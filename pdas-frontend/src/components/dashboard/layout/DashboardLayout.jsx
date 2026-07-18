import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { userService } from "../../../services/userService";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import FloatingHelp from "./FloatingHelp";

export default function DashboardLayout({ children, unread = 0, refreshing = false, onRefresh, onUnreadChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("dashboard_theme") === "dark");
  const [avatarSrc, setAvatarSrc] = useState("");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    window.dispatchEvent(new CustomEvent("dashboard-theme-change", { detail: dark ? "dark" : "light" }));
    return () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "";
      window.dispatchEvent(new CustomEvent("dashboard-theme-change", { detail: "light" }));
    };
  }, [dark]);
  useEffect(() => {
    if (!user?.avatar_url) return undefined;
    let active = true;
    userService.getAvatar(user.avatar_url).then((url) => active && setAvatarSrc(url)).catch(() => {});
    return () => { active = false; };
  }, [user?.avatar_url]);
  const toggleTheme = () => {
    setDark((value) => { localStorage.setItem("dashboard_theme", value ? "light" : "dark"); return !value; });
  };
  const signOut = async () => { await logout(); navigate("/login", { replace: true }); };
  return (
    <div className={dark ? "dark" : ""}>
      <div className="dashboard-theme-canvas min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors duration-200">
        <DashboardSidebar open={sidebarOpen} collapsed={collapsed} onClose={() => setSidebarOpen(false)} onToggle={() => setCollapsed((value) => !value)} user={user} avatarSrc={avatarSrc} onLogout={signOut} />
        <div className={`min-h-screen transition-[padding] duration-300 ease-in-out ${collapsed ? "lg:pl-24" : "lg:pl-[266px]"}`}>
          <div className="min-h-screen lg:px-4 lg:pt-4">
          <DashboardHeader user={user} avatarSrc={avatarSrc} unread={unread} refreshing={refreshing} dark={dark} onMenu={() => setSidebarOpen(true)} onRefresh={onRefresh} onTheme={toggleTheme} onLogout={signOut} onUnreadChange={onUnreadChange} />
          <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 sm:py-7 lg:min-h-[calc(100dvh-8rem)] lg:px-0 lg:py-5">{children}</main>
          </div>
        </div>
        <FloatingHelp />
      </div>
    </div>
  );
}
