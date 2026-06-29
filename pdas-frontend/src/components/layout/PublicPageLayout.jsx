import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { PageTransition } from "../common/PageTransition";

export const PublicPageLayout = ({ 
  title, 
  lastUpdated, 
  effectiveDate, 
  children,
  tableOfContents 
}) => {
  return (
    <PageTransition>
      <div className="public-page">
        {/* Simple Header */}
        <header className="site-header flex items-center justify-between px-6 py-4 border-b border-white/5 bg-cyber-950/50 backdrop-blur-sm sticky top-0 z-40">
          <Link to="/" className="flex items-center gap-2 no-underline group focus-ring rounded-lg">
            <Shield className="w-6 h-6 text-cyber-500 group-hover:text-cyber-400 transition-colors" />
            <span className="text-xl font-bold text-white tracking-tight">CyberSense</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </header>

        <main className="public-page-content flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="public-page-header">
              <h1 className="text-4xl font-bold text-white tracking-tight mb-4">{title}</h1>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                {lastUpdated && <span>Last Updated: {lastUpdated}</span>}
                {effectiveDate && <span>Effective Date: {effectiveDate}</span>}
              </div>
            </div>

            <div className="prose-content">
              {children}
            </div>
          </div>

          {tableOfContents && tableOfContents.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="public-nav-sidebar">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">On this page</h4>
                <nav className="flex flex-col gap-2">
                  {tableOfContents.map((item) => (
                    <a 
                      key={item.id} 
                      href={`#${item.id}`}
                      className="text-sm text-slate-400 hover:text-cyber-400 no-underline transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </main>

        <footer className="site-footer border-t border-white/5 py-8 mt-12 bg-cyber-950/30">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} CyberSense. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="text-sm text-slate-400 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-sm text-slate-400 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};
