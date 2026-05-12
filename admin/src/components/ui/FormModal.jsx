export default function FormModal({ open, title, onClose, children, size = "md" }) {
  if (!open) return null;
  const sizeClass = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size] || "max-w-xl";
  return (
    <div className="modal modal-open">
      <div className={`modal-box ${sizeClass}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{title}</h3>
          <button className="btn btn-sm btn-ghost" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
