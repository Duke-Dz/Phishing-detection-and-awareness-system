import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AwarenessTraining from "../../components/awareness/AwarenessTraining";
import DashboardLayout from "../../components/dashboard/layout/DashboardLayout";
import OverviewPanel from "../../components/dashboard/overview/OverviewPanel";
import UserReports from "../../components/reports/UserReports";
import RecentScans from "../../components/scan/RecentScans";
import ScanCenter from "../../components/scan/ScanCenter";
import { useAuth } from "../../hooks/useAuth";
import { awarenessService } from "../../services/awarenessService";
import { getErrorMessage } from "../../services/api";
import { dashboardService } from "../../services/dashboardService";
import { reportService } from "../../services/reportService";
import { scanService } from "../../services/scanService";
import NotificationsPage from "./NotificationsPage";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";

const EMPTY_STATS = {
  totalScans: 0,
  safeScans: 0,
  suspiciousScans: 0,
  phishingScans: 0,
  recentScans: 0,
  totalReports: 0,
  unreadNotifications: 0,
};

export default function UserDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [scans, setScans] = useState([]);
  const [reports, setReports] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState(false);

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
      setDashboardError(false);
      const [statsResponse, scansResponse, reportsResponse, lessonsResponse] = await Promise.all([
        dashboardService.getStats(),
        scanService.list({ page: 1, page_size: 20 }),
        reportService.list({ page: 1, page_size: 20 }),
        awarenessService.list({ page: 1, page_size: 50 }),
      ]);
      setStats({ ...EMPTY_STATS, ...(statsResponse.data || {}) });
      setScans(scansResponse.data || []);
      setReports(reportsResponse.data || []);
      setLessons(lessonsResponse.data || []);
    } catch (error) {
      setDashboardError(true);
      toast.error(getErrorMessage(error, "Could not load dashboard."), {
        id: "dashboard-load-error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const path = location.pathname;
  const sectionByPath = {
    "/dashboard/email-scan": "email-scanning",
    "/dashboard/url-scan": "url-scanning",
    "/dashboard/sms-scan": "sms-scanning",
  };

  useEffect(() => {
    if (path === "/dashboard/activity") navigate("/dashboard#scan-history", { replace: true });
  }, [navigate, path]);

  useEffect(() => {
    const sectionId = sectionByPath[path] || location.hash.slice(1);
    if (!sectionId) return undefined;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, path]);

  useEffect(() => {
    if (path !== "/dashboard") return undefined;
    const sectionIds = ["dashboard-overview", "email-scanning", "url-scanning", "sms-scanning", "scan-history"];
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const hash = `#${visible.target.id}`;
      if (window.location.hash === hash) return;
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }, { rootMargin: "-18% 0px -62% 0px", threshold: [0.1, 0.5] });
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [path]);

  const dashboardContent = (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 lg:p-3">
      <div className="space-y-4">
      <section id="dashboard-overview" className="scroll-mt-28">
        <OverviewPanel stats={stats} scans={scans} loading={loading} error={dashboardError} />
      </section>
      <section id="email-scanning" className="scroll-mt-28"><ScanCenter initialTab="email" lockedTab onComplete={() => load(true)} /></section>
      <section id="url-scanning" className="scroll-mt-28"><ScanCenter initialTab="url" lockedTab onComplete={() => load(true)} /></section>
      <section id="sms-scanning" className="scroll-mt-28"><ScanCenter initialTab="sms" lockedTab onComplete={() => load(true)} /></section>
      <section id="scan-history" className="scroll-mt-28"><RecentScans scans={scans} loading={loading} onScan={() => navigate("/dashboard#url-scanning")} /></section>
      </div>
    </div>
  );

  let content;
  if (path === "/dashboard/training") content = <AwarenessTraining lessons={lessons} loading={loading} />;
  else if (path === "/dashboard/reports") content = <UserReports reports={reports} loading={loading} />;
  else if (path === "/dashboard/notifications") content = <NotificationsPage />;
  else if (path === "/dashboard/profile") content = <ProfilePage />;
  else if (path === "/dashboard/settings") content = <SettingsPage />;
  else content = dashboardContent;

  return (
    <DashboardLayout
      unread={stats.unreadNotifications}
      refreshing={refreshing}
      onRefresh={() => load(true)}
      onUnreadChange={(delta) => setStats((current) => ({ ...current, unreadNotifications: Math.max(0, current.unreadNotifications + delta) }))}
    >
      {content}
    </DashboardLayout>
  );
}
