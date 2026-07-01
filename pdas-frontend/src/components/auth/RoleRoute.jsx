import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_DESTINATIONS } from "../../utils/constants";
import { LoadingScreen } from "../common/LoadingScreen";

export const RoleRoute = ({ allowedRoles, children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
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
