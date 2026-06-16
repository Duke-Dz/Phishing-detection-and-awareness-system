import React from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 text-center text-white">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-20 rounded-full"></div>
        <Search className="w-24 h-24 text-blue-400 mx-auto mb-8 relative z-10" />
      </div>
      
      <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 mb-4 tracking-tight">
        404
      </h1>
      <h2 className="text-3xl font-bold mb-4 text-slate-100">Page Not Found</h2>
      <p className="text-lg text-slate-400 max-w-md mx-auto mb-10">
        The page you are looking for doesn't exist or has been moved to a new URL.
      </p>
      
      <Link 
        to="/" 
        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
