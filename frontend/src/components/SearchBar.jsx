import { useState } from "react";

export default function SearchBar({
  onSearch,
  placeholder = "Restoran ara...",
  value,
  onChange,
}) {
  const [internalQuery, setInternalQuery] = useState("");
  const query = value !== undefined ? value : internalQuery;
  const setQuery = onChange !== undefined ? onChange : setInternalQuery;

  const handleSearch = () => {
    onSearch(query.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="w-full">
      <label className="input w-full bg-gray-100 text-zinc-900 py-3">
        <button className="btn btn-sm btn-ghost" onClick={handleSearch}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
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
          onKeyDown={handleKeyDown}
        />
      </label>
    </div>
  );
}
