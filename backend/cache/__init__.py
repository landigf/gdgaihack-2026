"""Houston tile-based cache layer for time-windowed queries.

Pattern lifted from CacheRegime's normalized-trace approach: split a stream
into fixed-size daily tiles, materialize each tile once on disk as Arrow
record batches, and assemble query windows by reading the overlapping tiles.
Subset queries cost zero recomputation; superset queries cost only the new
delta.
"""
from .tile_cache import TileCache, TileCacheStats

__all__ = ["TileCache", "TileCacheStats"]
