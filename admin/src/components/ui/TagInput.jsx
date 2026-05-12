import { useState } from "react";

export default function TagInput({ value = [], onChange, placeholder = "Ekle..." }) {
  const [text, setText] = useState("");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    onChange([...value, t]);
    setText("");
  };

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2">
        {value.map((tag, i) => (
          <span key={i} className="badge badge-outline gap-1">
            {tag}
            <button type="button" className="ml-1 opacity-70 hover:opacity-100" onClick={() => remove(i)}>✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="input input-bordered input-sm flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <button type="button" className="btn btn-sm btn-primary" onClick={add}>+</button>
      </div>
    </div>
  );
}
