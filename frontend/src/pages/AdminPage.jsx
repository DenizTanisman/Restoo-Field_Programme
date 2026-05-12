import React, { useEffect, useState } from "react";
import { api } from "../api/client";

export default function AdminPage() {
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({ name: "", district_id: "", category_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const loadAll = async () => {
    try {
      const [d, c, r] = await Promise.all([
        api.getDistricts(),
        api.getCategories(),
        api.listRestaurants(),
      ]);
      setDistricts(d);
      setCategories(c);
      setRestaurants(r);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    if (!form.name.trim() || !form.district_id || !form.category_id) {
      setError("Tüm alanları doldur.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.createRestaurant({
        name: form.name.trim(),
        district_id: form.district_id,
        category_id: Number(form.category_id),
      });
      setStatus(`Eklendi: ${created.name} (#${created.id})`);
      setForm({ name: "", district_id: "", category_id: "" });
      setRestaurants((prev) => [created, ...prev]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin · Restoran Yönetimi</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Yeni Restoran</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">İsim</span></label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Restoran adı"
                  />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">İlçe</span></label>
                  <select
                    className="select select-bordered"
                    value={form.district_id}
                    onChange={(e) => setForm({ ...form, district_id: e.target.value })}
                  >
                    <option value="">Seç...</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Kategori</span></label>
                  <select
                    className="select select-bordered"
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  >
                    <option value="">Seç...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className={`btn btn-primary w-full ${submitting ? "loading" : ""}`}
                  disabled={submitting}
                >
                  Ekle
                </button>
                {error && <div className="alert alert-error text-sm">{error}</div>}
                {status && <div className="alert alert-success text-sm">{status}</div>}
              </form>
            </div>
          </div>

          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title">Kayıtlı Restoranlar ({restaurants.length})</h2>
              <div className="overflow-x-auto max-h-[480px]">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>İsim</th>
                      <th>İlçe</th>
                      <th>Kategori</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.length === 0 && (
                      <tr><td colSpan={4} className="text-center opacity-60">Henüz restoran yok</td></tr>
                    )}
                    {restaurants.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.name}</td>
                        <td>{r.district_name}</td>
                        <td>{r.category_emoji} {r.category_label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
