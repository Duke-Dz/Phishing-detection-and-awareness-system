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
        position="bottom-center" 
        richColors 
        closeButton 
        theme="light"
        toastOptions={{
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: "0.95rem"
          },
          className: "cyber-toast"
        }}
      />
    </BrowserRouter>
  );
}

export default App;
