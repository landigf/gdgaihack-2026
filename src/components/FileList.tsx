import type { SearchHit } from "../types";
import FileRow from "./FileRow";

type Props = {
  hits: SearchHit[];
  selected: SearchHit | null;
  onSelect: (h: SearchHit) => void;
  emptyHint?: string;
};

export default function FileList({ hits, selected, onSelect, emptyHint }: Props) {
  if (hits.length === 0)
    return (
      <div className="text-muted text-sm py-12 text-center">
        {emptyHint || "No results yet — index a folder and search."}
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      {hits.map((h, i) => (
        <FileRow
          key={`${h.path}-${h.chunk_index}-${i}`}
          hit={h}
          selected={
            !!selected &&
            selected.path === h.path &&
            selected.chunk_index === h.chunk_index
          }
          onSelect={() => onSelect(h)}
        />
      ))}
    </div>
  );
}
