import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("admin@opencard.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (user) return <Navigate to={from} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="text-2xl font-bold mb-2">OpenCard Admin</h1>
          <p className="text-sm opacity-70 mb-4">Yönetici girişi</p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">E-posta</span></label>
              <input
                type="email"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Şifre</span></label>
              <input
                type="password"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-error text-sm">{error}</div>}
            <button type="submit" disabled={submitting} className={`btn btn-primary w-full ${submitting ? "loading" : ""}`}>
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
