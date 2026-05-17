import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";

export default function SearchBar({
  onSearch,
  onSelectSuggestion,
  placeholder = "Restoran ara...",
  value,
  onChange,
}) {
  const [internalQuery, setInternalQuery] = useState("");
  const query = value !== undefined ? value : internalQuery;
  const setQuery = onChange !== undefined ? onChange : setInternalQuery;

  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  // Dış tıklamada dropdown'ı kapat
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Query değişince debounced fetch
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      api
        .searchRestaurants(q)
        .then((data) => {
          if (!alive) return;
          setSuggestions(data);
          setOpen(true);
        })
        .catch(() => {
          if (alive) setSuggestions([]);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setOpen(false);
    onSearch?.(query.trim());
  };

  const handlePick = (restaurant) => {
    setQuery(restaurant.name);
    setOpen(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(restaurant);
    } else {
      onSearch?.(restaurant.name);
    }
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center gap-2 bg-base-200 rounded-lg px-3 py-3 text-base-content"
      >
        <button
          type="submit"
          className="text-base-content/80 hover:text-base-content cursor-pointer flex items-center justify-center"
          aria-label="Ara"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21 21-4.34-4.34" />
            <circle cx="11" cy="11" r="8" />
          </svg>
        </button>
        <input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && suggestions.length > 0 && setOpen(true)}
          className="flex-1 bg-transparent outline-none border-0 focus:outline-none focus:ring-0"
        />
        {loading && <span className="loading loading-spinner loading-xs text-base-content/60" />}
      </form>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-base-100 rounded-lg shadow-lg border border-base-300 max-h-80 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-base-content/50">
              {loading ? "Aranıyor…" : "Sonuç bulunamadı"}
            </div>
          ) : (
            <ul className="divide-y divide-base-300">
              {suggestions.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(r)}
                    className="w-full text-left px-4 py-2.5 hover:bg-base-200 flex items-center gap-3"
                  >
                    <span className="text-lg">{r.category_emoji || "🍽️"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base-content truncate">{r.name}</div>
                      <div className="text-xs text-base-content/60 truncate">
                        {r.district_name}
                        {r.category_label ? ` · ${r.category_label}` : ""}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
