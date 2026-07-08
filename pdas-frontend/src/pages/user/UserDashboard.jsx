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

  const load = useCallback(async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true);
    try {
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
      toast.error(getErrorMessage(error, "Could not load dashboard."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const path = location.pathname;
  let content;
  if (path === "/dashboard/scans") content = <ScanCenter onComplete={() => load(true)} />;
  else if (path === "/dashboard/activity") content = <RecentScans scans={scans} loading={loading} onScan={() => navigate("/dashboard/scans")} />;
  else if (path === "/dashboard/reports") content = <UserReports reports={reports} loading={loading} />;
  else if (path === "/dashboard/training") content = <AwarenessTraining lessons={lessons} loading={loading} />;
  else if (path === "/dashboard/notifications") content = <NotificationsPage />;
  else if (path === "/dashboard/profile") content = <ProfilePage />;
  else if (path === "/dashboard/settings") content = <SettingsPage />;
  else content = <OverviewPanel user={user} stats={stats} scans={scans} reports={reports} lessons={lessons} loading={loading} />;

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
