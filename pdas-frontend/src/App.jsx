import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/index.jsx";
import { useEffect, useState } from "react";

function App() {
  const [toastTheme, setToastTheme] = useState(() => localStorage.getItem("dashboard_theme") === "dark" ? "dark" : "light");
  useEffect(() => {
    const update = (event) => setToastTheme(event.detail || "light");
    window.addEventListener("dashboard-theme-change", update);
    return () => window.removeEventListener("dashboard-theme-change", update);
  }, []);
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
      <Toaster 
        position="top-center"
        offset="1rem"
        mobileOffset="1rem"
        richColors 
        theme={toastTheme}
        duration={5000}
        toastOptions={{
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem"
          },
          className: "cyber-toast"
        }}
      />
    </BrowserRouter>
  );
}

export default App;
