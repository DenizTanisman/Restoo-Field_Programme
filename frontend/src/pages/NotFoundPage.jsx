import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <>
      <main className="grid h-screen place-items-center bg-base-100 px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <p className="text-base font-semibold text-indigo-600">404</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-base-content sm:text-7xl">
            Sayfa Bulunamadı
          </h1>
          <p className="mt-6 text-lg font-medium text-pretty text-base-content/60 sm:text-xl/8">
            Üzgünüz, aradığınız sayfayı bulamadık.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Anasayfaya geri dön
            </Link>
            <a
              href="mailto:canercakir6134@gmail.com"
              className="text-sm font-semibold text-base-content"
              target="_blank"
            >
              Bir hata mı olduğunu düşünüyorsunuz{" "}
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
