import { useEffect, useState } from "react";
import { ServerCrash, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { PageTransition } from "../components/common/PageTransition";

export default function Maintenance() {
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Attempt to refresh the page automatically when timer hits 0
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    window.location.href = "/";
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-cyber-900 flex flex-col justify-center items-center p-6 text-center text-white overflow-hidden relative">
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-amber-500 blur-[100px] rounded-full"
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 w-24 h-24 bg-slate-800/80 backdrop-blur-sm rounded-2xl flex justify-center items-center mx-auto mb-8 border border-slate-700 shadow-xl"
          >
            <ServerCrash className="w-12 h-12 text-amber-400" />
          </motion.div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-slate-100 mb-4 tracking-tight">
          System Maintenance
        </h1>
        <p className="text-lg text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
          We're currently performing scheduled maintenance to upgrade CyberSense and improve your security experience. We'll be back online shortly.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-lg font-bold transition-all shadow-lg shadow-amber-500/20"
          >
            <RefreshCw className="w-5 h-5" />
            Check Status Now
          </button>
        </div>

        <p className="mt-12 text-sm text-slate-500 font-medium">
          Auto-refreshing in <span className="text-amber-500">{secondsLeft}s</span>
        </p>
      </div>
    </PageTransition>
  );
}
