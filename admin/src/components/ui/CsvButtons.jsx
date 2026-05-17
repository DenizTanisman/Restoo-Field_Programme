import { useRef, useState } from "react";
import { useToast } from "./Toast";

export function CsvExportButton({ onExport, filename = "export.csv", label = "CSV Dışa Aktar" }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const blob = await onExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.push("CSV indirildi", "success");
    } catch (e) {
      toast.push(`Dışa aktarma başarısız: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={`btn btn-sm btn-outline ${loading ? "loading" : ""}`} onClick={handle} disabled={loading}>
      ⬇ {label}
    </button>
  );
}

export function CsvImportButton({ onImport, label = "CSV İçe Aktar", accept = ".csv,text/csv" }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLoading(true);
    try {
      const result = await onImport(file);
      const created = result?.created || 0;
      const updated = result?.updated || 0;
      const skipped = result?.skipped || 0;
      const errs = result?.errors || [];
      const warns = result?.warnings || [];

      const parts = [];
      if (created) parts.push(`${created} eklendi`);
      if (updated) parts.push(`${updated} güncellendi`);
      if (skipped) parts.push(`${skipped} satır atlandı`);
      if (warns.length) parts.push(`${warns.length} uyarı`);
      if (errs.length) parts.push(`${errs.length} hata`);
      const summary = parts.length ? parts.join(" · ") : "Hiçbir kayıt işlenmedi";

      // Tip belirleme: gerçek hata varsa warning, sadece warning/skipped varsa info, hiçbir şey yoksa info
      let level = "success";
      if (errs.length) level = "warning";
      else if (created === 0 && updated === 0) level = "info";

      toast.push(`CSV: ${summary}`, level);
      if (warns.length) console.info("CSV warnings:", warns);
      if (errs.length) console.warn("CSV errors:", errs);
    } catch (e) {
      toast.push(`İçe aktarma başarısız: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden" />
      <button
        className={`btn btn-sm btn-outline ${loading ? "loading" : ""}`}
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        ⬆ {label}
      </button>
    </>
  );
}
