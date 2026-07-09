import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./router/index.jsx";

function App() {
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
        theme="light"
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
