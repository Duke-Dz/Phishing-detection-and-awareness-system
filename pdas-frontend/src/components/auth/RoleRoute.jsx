import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_DESTINATIONS } from "../../utils/constants";
import { Shield } from "lucide-react";

export const RoleRoute = ({ allowedRoles, children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cyber-900">
        <div className="flex flex-col items-center gap-4">
          <Shield size={40} className="animate-pulse text-cyber-500" />
          <p className="text-sm font-medium text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const destination = ROLE_DESTINATIONS[user.role] || "/dashboard";
    return <Navigate to={destination} replace />;
  }

  return children;
};
