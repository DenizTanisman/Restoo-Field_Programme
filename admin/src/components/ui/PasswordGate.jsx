import { useEffect, useState } from "react";

// Districts / Categories / Platforms sayfaları için şifre kapısı.
// Aynı oturumda bir kez doğru şifre girilince üçü de açılır (sessionStorage).
// Yenileme veya yeni sekme → tekrar sorar.

const STORAGE_KEY = "opencard-admin-gate-unlocked";
const CORRECT_PASSWORD = "Erhan2684.";

export function isGateUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function PasswordGate({ pageLabel, children }) {
  const [unlocked, setUnlocked] = useState(isGateUnlocked);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!unlocked) setPwd("");
  }, [unlocked]);

  const submit = (e) => {
    e.preventDefault();
    if (pwd === CORRECT_PASSWORD) {
      try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
      setUnlocked(true);
      setError("");
    } else {
      setError("Şifre hatalı.");
    }
  };

  if (unlocked) return children;

  return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
    <div className="card bg-base-100 shadow-sm w-full max-w-md">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <span>🔒</span>
          <span>{pageLabel} — Şifre Gerekli</span>
        </h2>
        <p className="text-sm text-base-content/70 mb-2">
          Bu bölüm korumalıdır. Devam etmek için şifre girin.
          Bir kere doğru şifre girilirse oturum boyunca diğer korumalı sayfalar da açılır.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            autoFocus
            className="input input-bordered w-full"
            placeholder="Şifre"
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(""); }}
          />
          {error && <p className="text-sm text-error">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">Aç</button>
        </form>
      </div>
    </div>
    </div>
  );
}
