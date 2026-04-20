import { useState } from "react";

const categories = [
  { id: 1, label: "Burger", emoji: "🍔" },
  { id: 2, label: "Pizza", emoji: "🍕" },
  { id: 3, label: "Kebap", emoji: "🥙" },
  { id: 4, label: "Döner", emoji: "🌯" },
  { id: 5, label: "Sushi", emoji: "🍱" },
  { id: 6, label: "Pide & Lahmacun", emoji: "🫓" },
  { id: 7, label: "Tatlı & Pastane", emoji: "🎂" },
  { id: 8, label: "Çorba", emoji: "🍲" },
  { id: 9, label: "Tavuk", emoji: "🍗" },
  { id: 10, label: "Balık & Deniz Ürünleri", emoji: "🐟" },
  { id: 11, label: "Vegan & Vejetaryen", emoji: "🥗" },
  { id: 12, label: "Kahvaltı", emoji: "🍳" },
  { id: 13, label: "Makarna", emoji: "🍝" },
  { id: 14, label: "Izgara", emoji: "🥩" },
  { id: 15, label: "Sandviç & Tost", emoji: "🥪" },
  { id: 16, label: "Börek & Pişi", emoji: "🥐" },
  { id: 17, label: "İçecek & Meyve Suyu", emoji: "🧃" },
  { id: 18, label: "Dondurma & Waffle", emoji: "🍦" },
];

const SideBarCategories = ({ onCategorySelect }) => {
  const [selected, setSelected] = useState(null);

  const handleSelect = (cat) => {
    const next = selected?.id === cat.id ? null : cat;
    setSelected(next);
    if (onCategorySelect) onCategorySelect(next);
  };

  return (
    <aside className="w-52 min-h-screen bg-base-200 flex flex-col p-3 shrink-0 border-l border-base-300">
      <h2 className="text-sm font-bold uppercase tracking-wider text-base-content/60 mb-3 px-1">
        Kategoriler
      </h2>
      <ul className="flex flex-col gap-1">
        {categories.map((cat) => (
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
              <span className="truncate">{cat.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default SideBarCategories;
