import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { userService } from "../../../services/userService";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";

export default function DashboardLayout({ children, unread = 0, refreshing = false, onRefresh, onUnreadChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("dashboard_theme") === "dark");
  const [avatarSrc, setAvatarSrc] = useState("");
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
      <div className="min-h-screen overflow-x-hidden bg-[#f5f8fc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <DashboardSidebar open={sidebarOpen} collapsed={collapsed} onClose={() => setSidebarOpen(false)} onToggle={() => setCollapsed((value) => !value)} user={user} avatarSrc={avatarSrc} onLogout={signOut} />
        <div className={`min-h-screen transition-[padding] duration-300 ease-in-out ${collapsed ? "lg:pl-24" : "lg:pl-[280px]"}`}>
          <div className="min-h-screen lg:py-3 lg:pr-3">
          <DashboardHeader user={user} avatarSrc={avatarSrc} unread={unread} refreshing={refreshing} dark={dark} onMenu={() => setSidebarOpen(true)} onRefresh={onRefresh} onTheme={toggleTheme} onLogout={signOut} onUnreadChange={onUnreadChange} />
          <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-7 sm:py-8 lg:min-h-[calc(100dvh-6.5rem)] lg:px-5 lg:pb-7">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
