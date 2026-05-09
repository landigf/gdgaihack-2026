import { useState } from "react";

type Props = { onSearch: (q: string) => void; busy: boolean };

export default function SearchBar({ onSearch, busy }: Props) {
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) onSearch(q.trim());
      }}
    >
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg">
          ⌕
        </span>
        <input
          autoFocus
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Find anything in your files… 'budget presentation project alpha'"
          className="w-full bg-surface border border-border rounded-lg pl-11 pr-4 py-3 text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/40 placeholder:text-muted disabled:opacity-50 transition"
          disabled={busy}
        />
        {busy && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-accent font-mono">
            searching…
          </span>
        )}
      </div>
    </form>
  );
}
