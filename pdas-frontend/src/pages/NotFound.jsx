import { Link } from "react-router-dom";
import { Search, Home, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { PageTransition } from "../components/common/PageTransition";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-cyber-900 flex flex-col justify-center items-center p-6 text-center text-white overflow-hidden relative">
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.25, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-cyber-500 blur-[100px] rounded-full"
          />
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Search className="w-24 h-24 text-cyber-400 mx-auto mb-8 relative z-10" />
          </motion.div>
        </div>
        
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-300 to-cyber-500 mb-4 tracking-tight">
          404
        </h1>
        <h2 className="text-3xl font-bold mb-4 text-slate-100">Page Not Found</h2>
        <p className="text-lg text-slate-400 max-w-md mx-auto mb-10">
          The page you are looking for may have been moved, deleted, or never existed in the first place.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            to="/dashboard" 
            className="flex items-center justify-center gap-2 px-8 py-3 bg-cyber-600 hover:bg-cyber-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-cyber-500/20 hover:shadow-cyber-500/40 no-underline"
          >
            <Home size={18} />
            Return to Dashboard
          </Link>
          <Link 
            to="/login" 
            className="flex items-center justify-center gap-2 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all no-underline"
          >
            <LogIn size={18} />
            Go to Login
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
