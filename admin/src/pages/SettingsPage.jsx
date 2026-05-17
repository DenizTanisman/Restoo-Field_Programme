import { useEffect, useState } from "react";
import { metricsApi } from "../api/analytics";
import { useToast } from "../components/ui/Toast";

// Sadakat sayfası — tüm public içerikleri buradan dinamik yönet.

const DEFAULT_VALUES = {
  // Stats sayıları
  loyalty_active_firms: "",
  loyalty_churn_reduction: "",
  loyalty_avg_roi: "",
  loyalty_payback_period: "",
  // Stats etiketleri
  loyalty_stats_active_firms_label: "Aktif Firma",
  loyalty_stats_churn_label: "Ortalama Churn Azalması",
  loyalty_stats_roi_label: "Ortalama ROI",
  loyalty_stats_payback_label: "Ortalama Geri Ödeme Süresi",
  // Hero
  loyalty_hero_bg_url: "",
  loyalty_hero_badge: "Sadakat Programı",
  loyalty_hero_title: "Müşterini koru,",
  loyalty_hero_title_accent: "gelirini büyüt.",
  loyalty_hero_subtitle: "",
  loyalty_hero_cta_text: "Nasıl Çalışır?",
  // Features
  loyalty_features_title: "Neler Sunuyoruz?",
  loyalty_features_subtitle: "Her özellik, somut bir kazanımla geliyor.",
  loyalty_feature_cards: [],
};

const EMPTY_CARD = { title: "", text: "", image_url: "" };

export default function SettingsPage() {
  const toast = useToast();
  const [v, setV] = useState(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    metricsApi.siteSettings.get()
      .then((data) => {
        // Eksik alanları default ile tamamla (geriye uyumluluk)
        setV({ ...DEFAULT_VALUES, ...data, loyalty_feature_cards: Array.isArray(data.loyalty_feature_cards) ? data.loyalty_feature_cards : [] });
      })
      .catch((e) => toast.push(e.message, "error"))
      .finally(() => setLoading(false));
  }, []);

  const upd = (k, val) => setV((s) => ({ ...s, [k]: val }));
  const updCard = (i, k, val) => setV((s) => ({
    ...s,
    loyalty_feature_cards: s.loyalty_feature_cards.map((c, idx) => (idx === i ? { ...c, [k]: val } : c)),
  }));
  const addCard = () => setV((s) => ({ ...s, loyalty_feature_cards: [...s.loyalty_feature_cards, { ...EMPTY_CARD }] }));
  const removeCard = (i) => setV((s) => ({ ...s, loyalty_feature_cards: s.loyalty_feature_cards.filter((_, idx) => idx !== i) }));
  const moveCard = (i, dir) => setV((s) => {
    const arr = [...s.loyalty_feature_cards];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return s;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...s, loyalty_feature_cards: arr };
  });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await metricsApi.siteSettings.upsert(v);
      toast.push("Sadakat sayfası içeriği kaydedildi", "success");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="opacity-60">Yükleniyor…</p>;

  return (
    <form onSubmit={save} className="space-y-4 pb-24 max-w-5xl">
      {/* ===== STATS ===== */}
      <Card title="① Stat Sayıları" subtitle="Sayfada büyük rakam olarak görünen 4 değer">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Aktif Firma sayısı" placeholder="ör: 340+" value={v.loyalty_active_firms} onChange={(x) => upd("loyalty_active_firms", x)} />
          <Field label="Ortalama Churn Azalması" placeholder="ör: %38" value={v.loyalty_churn_reduction} onChange={(x) => upd("loyalty_churn_reduction", x)} />
          <Field label="Ortalama ROI" placeholder="ör: 2.6x" value={v.loyalty_avg_roi} onChange={(x) => upd("loyalty_avg_roi", x)} />
          <Field label="Geri Ödeme Süresi" placeholder="ör: 90 Gün" value={v.loyalty_payback_period} onChange={(x) => upd("loyalty_payback_period", x)} />
        </div>
      </Card>

      <Card title="② Stat Etiketleri" subtitle="Rakamların altında görünen yazılar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Aktif Firma etiketi" value={v.loyalty_stats_active_firms_label} onChange={(x) => upd("loyalty_stats_active_firms_label", x)} />
          <Field label="Churn etiketi" value={v.loyalty_stats_churn_label} onChange={(x) => upd("loyalty_stats_churn_label", x)} />
          <Field label="ROI etiketi" value={v.loyalty_stats_roi_label} onChange={(x) => upd("loyalty_stats_roi_label", x)} />
          <Field label="Geri Ödeme Süresi etiketi" value={v.loyalty_stats_payback_label} onChange={(x) => upd("loyalty_stats_payback_label", x)} />
        </div>
      </Card>

      {/* ===== HERO ===== */}
      <Card title="③ Hero (üst bölüm)" subtitle="Sayfanın en üstündeki büyük başlık ve görsel">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Arka plan görseli URL" placeholder="https://..." value={v.loyalty_hero_bg_url} onChange={(x) => upd("loyalty_hero_bg_url", x)} className="md:col-span-2" />
          <Field label="Üst rozet metni" placeholder="ör: Sadakat Programı" value={v.loyalty_hero_badge} onChange={(x) => upd("loyalty_hero_badge", x)} />
          <Field label="CTA buton metni" placeholder="ör: Nasıl Çalışır?" value={v.loyalty_hero_cta_text} onChange={(x) => upd("loyalty_hero_cta_text", x)} />
          <Field label="Ana başlık (ilk satır)" placeholder="ör: Müşterini koru," value={v.loyalty_hero_title} onChange={(x) => upd("loyalty_hero_title", x)} />
          <Field label="Vurgulu başlık (renkli)" placeholder="ör: gelirini büyüt." value={v.loyalty_hero_title_accent} onChange={(x) => upd("loyalty_hero_title_accent", x)} />
          <TextArea label="Alt başlık paragrafı" rows={3} value={v.loyalty_hero_subtitle} onChange={(x) => upd("loyalty_hero_subtitle", x)} className="md:col-span-2" />
        </div>
      </Card>

      {/* ===== FEATURES HEADER ===== */}
      <Card title="④ Özellikler bölümü başlığı" subtitle="Kartların üstünde görünen başlık ve alt başlık">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Bölüm başlığı" value={v.loyalty_features_title} onChange={(x) => upd("loyalty_features_title", x)} />
          <Field label="Bölüm alt başlığı" value={v.loyalty_features_subtitle} onChange={(x) => upd("loyalty_features_subtitle", x)} />
        </div>
      </Card>

      {/* ===== FEATURE CARDS ===== */}
      <Card
        title="⑤ Özellik Kartları"
        subtitle="Sırayla görünür. + Kart Ekle ile yeni kart eklersin, ↑↓ ile sıralarsın."
        action={<button type="button" className="btn btn-sm btn-outline" onClick={addCard}>+ Kart Ekle</button>}
      >
        {v.loyalty_feature_cards.length === 0 && <p className="text-sm opacity-60">Henüz kart yok. "+ Kart Ekle" ile başla.</p>}
        <div className="space-y-3">
          {v.loyalty_feature_cards.map((c, i) => (
            <div key={i} className="border border-base-300 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium opacity-70">Kart #{i + 1}</span>
                <div className="flex gap-1">
                  <button type="button" className="btn btn-xs btn-ghost" onClick={() => moveCard(i, -1)} disabled={i === 0}>↑</button>
                  <button type="button" className="btn btn-xs btn-ghost" onClick={() => moveCard(i, 1)} disabled={i === v.loyalty_feature_cards.length - 1}>↓</button>
                  <button type="button" className="btn btn-xs btn-error" onClick={() => removeCard(i)}>Sil</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Field label="Başlık" value={c.title || ""} onChange={(x) => updCard(i, "title", x)} />
                <Field label="Görsel URL" placeholder="https://..." value={c.image_url || ""} onChange={(x) => updCard(i, "image_url", x)} />
                <TextArea label="Açıklama metni" rows={4} value={c.text || ""} onChange={(x) => updCard(i, "text", x)} className="md:col-span-2" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="fixed bottom-0 left-60 right-0 bg-base-100 border-t border-base-200 px-6 py-3 shadow-lg z-20">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Kaydediliyor…" : "Hepsini Kaydet"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Card({ title, subtitle, children, action }) {
  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body py-4">
        <div className="flex justify-between items-start gap-3">
          <div>
            <h3 className="font-semibold text-base">{title}</h3>
            {subtitle && <p className="text-xs opacity-60 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, className = "" }) {
  return (
    <label className={`form-control flex flex-col gap-1 ${className}`}>
      <span className="text-xs opacity-70">{label}</span>
      <input className="input input-bordered input-sm" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange, rows = 3, className = "" }) {
  return (
    <label className={`form-control flex flex-col gap-1 ${className}`}>
      <span className="text-xs opacity-70">{label}</span>
      <textarea className="textarea textarea-bordered textarea-sm" rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
