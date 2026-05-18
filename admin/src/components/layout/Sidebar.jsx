import { NavLink } from "react-router-dom";

// Sıralama: Restaurants → Dashboard → Data Entry → Case Studies → Loyalty → Applications
// Sonra ayrıştırıcı, ardından şifre-korumalı 3 link: Districts / Categories / Platforms.
const links = [
  { to: "/restaurants", label: "Restaurants", icon: "🍽️" },
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/data-entry", label: "Data Entry", icon: "📝" },
  { to: "/case-studies", label: "Case Studies", icon: "📚" },
  { to: "/settings", label: "Loyalty", icon: "💎" },
  { to: "/applications", label: "Applications", icon: "🛵" },
];

const lockedLinks = [
  { to: "/districts", label: "Districts", icon: "🗺️" },
  { to: "/categories", label: "Categories", icon: "🏷️" },
  { to: "/platforms", label: "Platforms", icon: "📱" },
];

function LinkItem({ l, locked = false }) {
  return (
    <NavLink
      to={l.to}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
          isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-base-200"
        }`
      }
    >
      <span>
        <span className="mr-2">{l.icon}</span>
        {l.label}
      </span>
      {locked && <span className="text-xs opacity-60">🔒</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-60 bg-base-100 border-r border-base-200 min-h-screen p-4 sticky top-0">
      <div className="text-lg font-bold mb-6 flex items-center gap-2">
        <span>🟧</span>
        <span>OpenCard Admin</span>
      </div>
      <nav className="flex flex-col gap-1">
        {links.map((l) => <LinkItem key={l.to} l={l} />)}
        <div className="border-t border-base-200 my-2" />
        {lockedLinks.map((l) => <LinkItem key={l.to} l={l} locked />)}
      </nav>
    </aside>
  );
}
