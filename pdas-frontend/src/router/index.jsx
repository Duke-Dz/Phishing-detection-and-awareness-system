import { AnimatePresence } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import { PageTransition } from "../components/common/PageTransition";

// Auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";

// Public pages
import Unsubscribe from "../pages/Unsubscribe.jsx";
import PrivacyPolicy from "../pages/PrivacyPolicy.jsx";
import NotFound from "../pages/NotFound.jsx";
import Maintenance from "../pages/Maintenance.jsx";
import TermsOfService from "../pages/TermsOfService.jsx";

// Route guard
import { RoleRoute } from "../components/auth/RoleRoute";
import UserDashboard from "../pages/user/UserDashboard";

const AppRouter = () => {
  const location = useLocation();

  const withTransition = (element) => (
    <PageTransition>{element}</PageTransition>
  );

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Auth routes */}
        <Route path="/login" element={withTransition(<LoginPage />)} />
        <Route path="/register" element={withTransition(<RegisterPage />)} />
        <Route
          path="/verify-email"
          element={withTransition(<VerifyEmailPage />)}
        />
        <Route
          path="/forgot-password"
          element={withTransition(<ForgotPasswordPage />)}
        />
        <Route
          path="/reset-password"
          element={withTransition(<ResetPasswordPage />)}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={withTransition(
            <RoleRoute allowedRoles={["user"]}>
              <UserDashboard />
            </RoleRoute>
          )}
        />

        <Route
          path="/analyst/*"
          element={withTransition(
            <RoleRoute allowedRoles={["analyst", "admin"]}>
              <div className="flex min-h-screen items-center justify-center bg-cyber-900">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">
                    Analyst Dashboard
                  </h1>
                  <p className="mt-2 text-slate-400">Coming soon</p>
                </div>
              </div>
            </RoleRoute>
          )}
        />

        <Route
          path="/admin/*"
          element={withTransition(
            <RoleRoute allowedRoles={["admin"]}>
              <div className="flex min-h-screen items-center justify-center bg-cyber-900">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">
                    Admin Dashboard
                  </h1>
                  <p className="mt-2 text-slate-400">Coming soon</p>
                </div>
              </div>
            </RoleRoute>
          )}
        />

        {/* Public routes */}
        <Route path="/unsubscribe" element={withTransition(<Unsubscribe />)} />
        <Route path="/privacy" element={withTransition(<PrivacyPolicy />)} />
        <Route path="/terms" element={withTransition(<TermsOfService />)} />
        <Route path="/maintenance" element={withTransition(<Maintenance />)} />

        {/* Default & 404 */}
        <Route path="/" element={withTransition(<LoginPage />)} />
        <Route path="*" element={withTransition(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRouter;
