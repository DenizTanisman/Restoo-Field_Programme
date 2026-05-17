import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/data-entry", label: "Veri Girişi", icon: "📝" },
  { to: "/restaurants", label: "Restaurants", icon: "🍽️" },
  { to: "/case-studies", label: "Case Studies", icon: "📚" },
  { to: "/applications", label: "Applications", icon: "🛵" },
  { to: "/categories", label: "Categories", icon: "🏷️" },
  { to: "/platforms", label: "Platforms", icon: "📱" },
  { to: "/districts", label: "Districts", icon: "🗺️" },
  { to: "/settings", label: "Sadakat", icon: "💎" },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-base-100 border-r border-base-200 min-h-screen p-4 sticky top-0">
      <div className="text-lg font-bold mb-6 flex items-center gap-2">
        <span>🟧</span>
        <span>OpenCard Admin</span>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-base-200"
              }`
            }
          >
            <span className="mr-2">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
