import { useEffect, useState } from "react";
import { api } from "../api/client";

const SideBarCategories = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .getCategories()
      .then((data) => {
        if (alive) setCategories(data);
      })
      .catch(() => {
        if (alive) setCategories([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const handleSelect = (cat) => {
    const isSame = selected?.id === cat.id;
    const next = isSame ? null : cat;
    setSelected(next);
    // HomePage `label` bekliyor; API ise `name` döndürüyor — adaptör
    if (onCategorySelect) {
      onCategorySelect(next ? { id: next.id, label: next.name, emoji: next.emoji } : null);
    }
  };

  return (
    <aside className="w-52 bg-white rounded-2xl shadow-md flex flex-col p-3 shrink-0 m-3 max-h-[calc(100vh-1.5rem)] sticky top-3 overflow-y-auto">
      <h2 className="text-sm font-bold uppercase tracking-wider text-base-content/60 mb-3 px-1">
        Kategoriler
      </h2>
      {loading ? (
        <span className="loading loading-spinner loading-sm self-center" />
      ) : (
        <ul className="flex flex-col gap-1">
          {[...categories]
            .sort((a, b) => a.name.localeCompare(b.name, "tr"))
            .map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => handleSelect(cat)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      selected?.id === cat.id
                        ? "bg-primary text-primary-content shadow"
                        : "hover:bg-base-300 text-base-content"
                    }`}
                >
                  <span className="text-lg leading-none">{cat.emoji}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </aside>
  );
};

export default SideBarCategories;
