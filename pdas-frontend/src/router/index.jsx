import { Routes, Route } from "react-router-dom";
import Unsubscribe from "../pages/Unsubscribe.jsx";
import PrivacyPolicy from "../pages/PrivacyPolicy.jsx";
import NotFound from "../pages/NotFound.jsx";
import Maintenance from "../pages/Maintenance.jsx";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/unsubscribe" element={<Unsubscribe />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/maintenance" element={<Maintenance />} />
      
      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
