import { useAuth } from "../../contexts/AuthContext";
import ThemeToggle from "../ui/ThemeToggle";

export default function Header({ title }) {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-base-200 px-6 py-3 bg-base-100 sticky top-0 z-10">
      <h1 className="font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <span className="text-sm opacity-70">{user?.email}</span>
        <button className="btn btn-sm btn-ghost" onClick={logout}>
          Çıkış
        </button>
      </div>
    </header>
  );
}
