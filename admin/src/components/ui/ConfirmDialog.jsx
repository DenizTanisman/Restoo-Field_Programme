export default function ConfirmDialog({ open, title = "Emin misin?", message, onConfirm, onCancel, confirmText = "Evet", cancelText = "İptal" }) {
  if (!open) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg">{title}</h3>
        {message && <p className="py-3 text-sm">{message}</p>}
        <div className="modal-action">
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-error btn-sm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onCancel} />
    </div>
  );
}
