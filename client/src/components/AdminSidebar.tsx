import { NavLink } from "react-router-dom";
import { LayoutDashboard, Calendar, Heart, BookOpen, Users, Clock } from "lucide-react";

export function AdminSidebar() {
  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/events", label: "Events", icon: Calendar },
    { href: "/admin/library", label: "Library", icon: BookOpen },
    { href: "/admin/donations", label: "Donations", icon: Heart },
    { href: "/admin/seva", label: "Seva", icon: Clock },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <aside className="w-64 bg-card border-r min-h-screen p-6" aria-label="Admin sidebar">
      <h2 className="font-heading font-bold text-xl mb-6 text-primary">Admin Panel</h2>
      <nav className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.href}
              to={link.href}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-md transition-all hover-elevate active-elevate-2 ${
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground"
                }`
              }
              data-testid={`link-admin-${link.label.toLowerCase()}`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
