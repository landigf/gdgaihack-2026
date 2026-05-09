"""Tile-based cache for time-windowed queries.

Data model
----------
A *stream* (e.g. ``o2_kg_per_hr``, ``cabin_co2_ppm``) is partitioned into
fixed daily *tiles*. Each tile is a PyArrow ``RecordBatch`` containing the
raw samples for one Sol, plus a content_hash that invalidates the tile when
the upstream simulator parameters change.

Query flow
----------
1. Caller asks for ``query_window(stream, start, end)``.
2. We enumerate the tiles overlapping ``[start, end]``.
3. For each cached tile -> read from Parquet (zero compute).
4. For each missing tile -> compute via the registered ``producer`` and
   persist as Parquet for future calls.
5. Concatenate the tiles into one Arrow Table and slice to the exact
   requested boundaries.

Cache hit/miss accounting is exposed on every query so the benchmark
harness and the ``/perf`` endpoint can plot the speedup.
"""
from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

import pyarrow as pa
import pyarrow.compute as pc
import pyarrow.parquet as pq

# 1 day in seconds — Mars Sol approximated to Earth day for the demo.
SECONDS_PER_TILE = 86_400


@dataclass
class TileCacheStats:
    """Returned alongside every query so the caller (and benchmarks) can
    plot hit/miss ratios and per-tile latency."""

    requested_tiles: int = 0
    hits: int = 0
    misses: int = 0
    elapsed_ms: int = 0
    bytes_read: int = 0
    bytes_written: int = 0
    cold_compute_ms: int = 0
    warm_read_ms: int = 0
    sliced_rows: int = 0

    @property
    def hit_rate(self) -> float:
        if self.requested_tiles == 0:
            return 0.0
        return self.hits / self.requested_tiles

    def merge(self, other: "TileCacheStats") -> None:
        self.requested_tiles += other.requested_tiles
        self.hits += other.hits
        self.misses += other.misses
        self.bytes_read += other.bytes_read
        self.bytes_written += other.bytes_written
        self.cold_compute_ms += other.cold_compute_ms
        self.warm_read_ms += other.warm_read_ms
        self.sliced_rows += other.sliced_rows

    def to_dict(self) -> dict:
        return {
            "requested_tiles": self.requested_tiles,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": round(self.hit_rate, 3),
            "elapsed_ms": self.elapsed_ms,
            "cold_compute_ms": self.cold_compute_ms,
            "warm_read_ms": self.warm_read_ms,
            "bytes_read": self.bytes_read,
            "bytes_written": self.bytes_written,
            "sliced_rows": self.sliced_rows,
        }


# ProducerFn: given (stream_id, tile_start_unix, tile_end_unix), return a
# RecordBatch holding the samples for that tile. The producer is responsible
# for the *only* expensive work the cache layer cannot skip on a miss.
ProducerFn = Callable[[str, int, int], pa.RecordBatch]


@dataclass
class TileCache:
    """Per-stream tile cache backed by Parquet under ``root_dir``."""

    root_dir: Path
    producers: dict[str, ProducerFn] = field(default_factory=dict)
    content_version: str = "v1"  # bump to invalidate every tile (e.g. schema change)
    in_memory: dict[tuple[str, int, str], pa.RecordBatch] = field(default_factory=dict)
    stats_total: TileCacheStats = field(default_factory=TileCacheStats)

    def __post_init__(self):
        self.root_dir = Path(self.root_dir)
        self.root_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(self, stream_id: str, producer: ProducerFn) -> None:
        self.producers[stream_id] = producer

    # ------------------------------------------------------------------
    # Tile addressing
    # ------------------------------------------------------------------

    @staticmethod
    def _tile_index(unix_ts: int) -> int:
        return int(unix_ts // SECONDS_PER_TILE)

    @staticmethod
    def _tile_bounds(tile_index: int) -> tuple[int, int]:
        start = tile_index * SECONDS_PER_TILE
        return start, start + SECONDS_PER_TILE

    def _content_hash(self, stream_id: str) -> str:
        # Parameters that should invalidate the tile — keep narrow so we don't
        # over-invalidate during the demo. Producer identity + content_version.
        prod = self.producers.get(stream_id)
        prod_repr = getattr(prod, "__qualname__", repr(prod)) if prod else "noop"
        digest = hashlib.sha256(
            f"{stream_id}|{prod_repr}|{self.content_version}".encode()
        ).hexdigest()[:12]
        return digest

    def _tile_path(self, stream_id: str, tile_index: int, content_hash: str) -> Path:
        return self.root_dir / f"{stream_id}__t{tile_index:08d}__{content_hash}.parquet"

    # ------------------------------------------------------------------
    # Read/write
    # ------------------------------------------------------------------

    def _load_tile(
        self, stream_id: str, tile_index: int, content_hash: str
    ) -> pa.RecordBatch | None:
        key = (stream_id, tile_index, content_hash)
        if key in self.in_memory:
            return self.in_memory[key]
        path = self._tile_path(stream_id, tile_index, content_hash)
        if not path.exists():
            return None
        tbl = pq.read_table(path)
        if tbl.num_rows == 0:
            return None
        batch = tbl.to_batches()[0]
        self.in_memory[key] = batch
        return batch

    def _store_tile(
        self,
        stream_id: str,
        tile_index: int,
        content_hash: str,
        batch: pa.RecordBatch,
    ) -> int:
        key = (stream_id, tile_index, content_hash)
        self.in_memory[key] = batch
        path = self._tile_path(stream_id, tile_index, content_hash)
        tbl = pa.Table.from_batches([batch])
        pq.write_table(tbl, path, compression="zstd")
        return path.stat().st_size

    # ------------------------------------------------------------------
    # Public query
    # ------------------------------------------------------------------

    def query_window(
        self,
        stream_id: str,
        start_unix: int,
        end_unix: int,
    ) -> tuple[pa.Table, TileCacheStats]:
        """Return all samples for ``[start_unix, end_unix)`` along with
        cache statistics. Misses are computed via the registered producer
        and persisted before returning.
        """
        if stream_id not in self.producers:
            raise KeyError(f"no producer registered for stream {stream_id!r}")
        if end_unix <= start_unix:
            raise ValueError("end must be > start")

        producer = self.producers[stream_id]
        content_hash = self._content_hash(stream_id)
        first_tile = self._tile_index(start_unix)
        last_tile = self._tile_index(end_unix - 1)
        tile_indices = list(range(first_tile, last_tile + 1))

        stats = TileCacheStats(requested_tiles=len(tile_indices))
        t0 = time.time()

        batches: list[pa.RecordBatch] = []
        for ti in tile_indices:
            cached = self._load_tile(stream_id, ti, content_hash)
            if cached is not None:
                stats.hits += 1
                ts0 = time.time()
                batches.append(cached)
                stats.warm_read_ms += int((time.time() - ts0) * 1000)
                stats.bytes_read += cached.nbytes
                continue
            stats.misses += 1
            ts0 = time.time()
            tile_start, tile_end = self._tile_bounds(ti)
            batch = producer(stream_id, tile_start, tile_end)
            stats.cold_compute_ms += int((time.time() - ts0) * 1000)
            stats.bytes_written += self._store_tile(stream_id, ti, content_hash, batch)
            batches.append(batch)

        # Merge and slice to exact bounds. Arrow concat is zero-copy when
        # schemas match, which they do for our single-producer streams.
        if not batches:
            empty = pa.table({})
            stats.elapsed_ms = int((time.time() - t0) * 1000)
            return empty, stats

        table = pa.Table.from_batches(batches)
        ts_col = table.column("ts")
        # Filter by the exact requested window (each tile is wider than the
        # request near the edges).
        mask = pc.and_(
            pc.greater_equal(ts_col, start_unix),
            pc.less(ts_col, end_unix),
        )
        sliced = table.filter(mask)
        stats.sliced_rows = sliced.num_rows
        stats.elapsed_ms = int((time.time() - t0) * 1000)
        self.stats_total.merge(stats)
        return sliced, stats

    def export_summary(self) -> dict:
        on_disk = sum(p.stat().st_size for p in self.root_dir.glob("*.parquet"))
        return {
            "tiles_on_disk": len(list(self.root_dir.glob("*.parquet"))),
            "bytes_on_disk": on_disk,
            "in_memory_tiles": len(self.in_memory),
            "lifetime": self.stats_total.to_dict(),
        }
