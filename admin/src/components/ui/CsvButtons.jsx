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
      const summary = result?.errors?.length
        ? `${result.created || 0} eklendi, ${result.updated || 0} güncellendi, ${result.errors.length} hata`
        : `${result.created || 0} eklendi, ${result.updated || 0} güncellendi`;
      toast.push(summary, result?.errors?.length ? "warning" : "success");
      if (result?.errors?.length) {
        console.warn("CSV import errors:", result.errors);
      }
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
