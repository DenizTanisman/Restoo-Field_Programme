import React, { useState } from "react";

const ApplyPage = () => {
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    city: "",
    district: "",
    vehicle: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="card bg-base-100 shadow-xl p-10 text-center max-w-md w-full">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Başvurunuz Alındı!</h2>
          <p className="text-base-content/60">
            En kısa sürede sizinle iletişime geçeceğiz.
          </p>
          <button
            className="btn btn-primary mt-6"
            onClick={() => setSubmitted(false)}
          >
            Yeni Başvuru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Kurye Başvurusu</h1>
          <p className="text-base-content/60 text-lg max-w-xl mx-auto">
            Ekibimize katılmak için aşağıdaki formu doldurun. Başvurunuzu
            değerlendirip en kısa sürede geri döneceğiz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          {/* Form */}
          <div className="lg:col-span-3 card bg-base-100 shadow-xl">
            <div className="card-body p-8">
              <h2 className="card-title text-xl mb-6">Kişisel Bilgiler</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Ad Soyad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Ad</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Adınız"
                      className="input input-bordered w-full"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Soyad</span>
                    </label>
                    <input
                      type="text"
                      name="surname"
                      placeholder="Soyadınız"
                      className="input input-bordered w-full"
                      value={form.surname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email & Telefon */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">E-posta</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="mail@site.com"
                      className="input input-bordered w-full"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Telefon</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="05XX XXX XX XX"
                      className="input input-bordered w-full"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Şehir & İlçe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Şehir</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      placeholder="İstanbul"
                      className="input input-bordered w-full"
                      value={form.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">İlçe</span>
                    </label>
                    <input
                      type="text"
                      name="district"
                      placeholder="Kadıköy"
                      className="input input-bordered w-full"
                      value={form.district}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Araç Tipi */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Araç Tipi</span>
                  </label>
                  <select
                    name="vehicle"
                    className="select select-bordered w-full"
                    value={form.vehicle}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Araç seçin
                    </option>
                    <option value="bisiklet">Bisiklet</option>
                    <option value="elektrikli_bisiklet">Elektrikli Bisiklet</option>
                    <option value="motorsiklet">Motorsiklet</option>
                    <option value="otomobil">Otomobil</option>
                  </select>
                </div>

                {/* Mesaj */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      Ek Bilgi{" "}
                      <span className="text-base-content/40">(isteğe bağlı)</span>
                    </span>
                  </label>
                  <textarea
                    name="message"
                    placeholder="Kendinizi kısaca tanıtın..."
                    className="textarea textarea-bordered w-full h-28 resize-none"
                    value={form.message}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full mt-2">
                  Başvuruyu Gönder
                </button>
              </form>
            </div>
          </div>

          {/* Sağ panel */}
          <div className="lg:col-span-2 flex flex-col gap-6 h-full">
            {/* Fotoğraf */}
            <div className="card bg-base-100 shadow-xl overflow-hidden flex-1">
              <figure className="h-full overflow-hidden">
                <img
                  src="/WhatsApp Image 2026-04-13 at 13.33.45.jpeg"
                  alt="Kurye"
                  className="w-full h-full object-cover"
                />
              </figure>
            </div>

            {/* İletişim */}
            <div className="card bg-primary text-primary-content shadow-xl">
              <div className="card-body p-6">
                <h3 className="font-bold text-lg mb-2">Sorularınız mı var?</h3>
                <p className="text-sm opacity-80 mb-3">
                  Bize ulaşmaktan çekinmeyin.
                </p>
                <a
                  href="mailto:info@opencard.com"
                  className="btn btn-sm bg-white/20 border-white/30 hover:bg-white/30 text-white"
                >
                  info@opencard.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPage;
