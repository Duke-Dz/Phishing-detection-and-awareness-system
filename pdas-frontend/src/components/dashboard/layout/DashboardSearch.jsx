import {
  BarChart3, BookOpenCheck, FileClock, LayoutDashboard, Link2,
  MailSearch, MessageSquareText, Radio, Search, Settings, Bell, User,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Searchable items catalog — mirrors every navigable section/page in the dashboard.
 * Each entry has: id, label (display name), keywords (extra match terms), icon, route.
 * "route" can be a path like "/dashboard/training" or a hash like "/dashboard#email-scanning".
 */
const SEARCH_CATALOG = [
  { id: "overview",       label: "Dashboard Overview",   keywords: ["home", "summary", "stats", "metrics", "charts", "donut", "threat", "scans"],       Icon: LayoutDashboard,    route: "/dashboard#dashboard-overview" },
  { id: "email-scan",     label: "Email Scanner",        keywords: ["email", "mail", "scan", "phishing", "check email", "analyze email"],                Icon: MailSearch,          route: "/dashboard#email-scanning" },
  { id: "url-scan",       label: "URL Scanner",          keywords: ["url", "link", "website", "scan url", "check url", "analyze url", "web"],            Icon: Link2,              route: "/dashboard#url-scanning" },
  { id: "sms-scan",       label: "SMS Scanner",          keywords: ["sms", "text", "message", "scan sms", "check sms", "analyze sms", "text message"],  Icon: MessageSquareText,  route: "/dashboard#sms-scanning" },
  { id: "scan-history",   label: "Scan History",         keywords: ["history", "recent", "past scans", "activity", "log", "previous"],                   Icon: FileClock,          route: "/dashboard#scan-history" },
  { id: "training",       label: "Awareness Training",   keywords: ["training", "learn", "lessons", "awareness", "education", "course", "phishing"],     Icon: BookOpenCheck,      route: "/dashboard/training" },
  { id: "reports",        label: "Reports",              keywords: ["report", "analytics", "data", "security reports", "export"],                        Icon: BarChart3,          route: "/dashboard/reports" },
  { id: "security-news",  label: "Security News",        keywords: ["news", "activity", "feed", "updates", "security"],                                  Icon: Radio,              route: "/dashboard/activity" },
  { id: "notifications",  label: "Notifications",        keywords: ["notification", "alerts", "bell", "unread", "messages"],                             Icon: Bell,               route: "/dashboard/notifications" },
  { id: "profile",        label: "Profile",              keywords: ["profile", "account", "avatar", "name", "personal", "info"],                         Icon: User,               route: "/dashboard/profile" },
  { id: "settings",       label: "Settings",             keywords: ["settings", "preferences", "configuration", "theme", "dark mode"],                   Icon: Settings,           route: "/dashboard/settings" },
];

/**
 * Simple fuzzy/substring matching — returns true if every word in the query
 * appears (as a substring) somewhere in the combined text of label + keywords.
 */
function matches(item, query) {
  const haystack = `${item.label} ${item.keywords.join(" ")}`.toLowerCase();
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return words.every((word) => haystack.includes(word));
}

/**
 * Highlight the first occurrence of each query word in `text`.
 * Returns an array of React elements (spans).
 */
function highlightText(text, query) {
  if (!query.trim()) return text;
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  // Build a regex that matches any of the query words
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="rounded-sm bg-cyber-100 px-0.5 text-cyber-800 dark:bg-cyber-900/60 dark:text-cyber-200">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function DashboardSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return SEARCH_CATALOG; // show all when empty but focused
    return SEARCH_CATALOG.filter((item) => matches(item, query));
  }, [query]);

  // Reset active index when results change
  useEffect(() => setActiveIndex(0), [results]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.children[activeIndex];
    if (active) active.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const goTo = useCallback(
    (route) => {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();

      if (route.includes("#")) {
        const [path, hash] = route.split("#");
        // Navigate to the path with hash
        navigate(`${path}#${hash}`);
        // Give React Router a tick, then scroll into view
        requestAnimationFrame(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } else {
        navigate(route);
      }
    },
    [navigate],
  );

  const onKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % results.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[activeIndex]) goTo(results[activeIndex].route);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        inputRef.current?.blur();
      }
    },
    [open, results, activeIndex, goTo],
  );

  return (
    <div ref={wrapperRef} className="relative hidden sm:block w-full max-w-[330px]">
      {/* Search input */}
      <label className="dashboard-theme-control flex h-9 w-full items-center gap-2.5 rounded-lg border border-slate-300 bg-white px-3.5 text-slate-500 shadow-[0_2px_6px_rgba(15,23,42,0.08)] transition focus-within:border-[#087CF0] focus-within:ring-2 focus-within:ring-[#087CF0]/15">
        <Search size={18} strokeWidth={2.1} className="shrink-0 text-slate-900 dark:text-slate-100" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search dashboard..."
          className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-400"
          aria-label="Search dashboard"
          aria-expanded={open}
          aria-controls="dashboard-search-listbox"
          aria-activedescendant={open && results[activeIndex] ? `search-item-${results[activeIndex].id}` : undefined}
          role="combobox"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </label>

      {/* Dropdown results */}
      {open && (
        <div
          className="dashboard-theme-popover absolute left-0 top-[calc(100%+6px)] z-50 w-full min-w-[320px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_48px_-16px_rgba(15,23,42,0.18)]"
          role="listbox"
          id="dashboard-search-listbox"
        >
          {/* Header hint */}
          <div className="dashboard-theme-divider border-b border-slate-100 px-3.5 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">
              {query.trim() ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Quick navigation"}
            </p>
          </div>

          {results.length > 0 ? (
            <ul
              ref={listRef}
              className="max-h-[320px] overflow-y-auto overscroll-contain py-1.5 scrollbar-thin"
            >
              {results.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <li
                    key={item.id}
                    id={`search-item-${item.id}`}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(item.route)}
                    className={`mx-1.5 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                      isActive
                        ? "bg-cyber-50 text-cyber-900 dark:bg-cyber-900/40 dark:text-cyber-100"
                        : "dashboard-theme-hover text-slate-700 hover:bg-slate-50 dark:text-slate-300"
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-cyber-100 text-cyber-700 shadow-sm dark:bg-cyber-800/50 dark:text-cyber-300"
                          : "dashboard-theme-control bg-slate-100 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      <item.Icon size={16} strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold leading-tight">
                        {highlightText(item.label, query)}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {item.route.startsWith("/dashboard#")
                          ? `Dashboard → ${item.label}`
                          : item.route.replace("/dashboard/", "Dashboard → ").replace(/^\w/, (c) => c.toUpperCase())}
                      </p>
                    </div>
                    {isActive && (
                      <kbd className="dashboard-theme-control hidden shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:inline-block">
                        Enter
                      </kbd>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <Search size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                No results found
              </p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Try searching for "email", "scan", "reports", or "training"
              </p>
            </div>
          )}

          {/* Keyboard hint footer */}
          <div className="dashboard-theme-divider border-t border-slate-100 px-3.5 py-2">
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <kbd className="dashboard-theme-control rounded border border-slate-200 bg-slate-50 px-1 py-px text-[10px]">↑</kbd>
                <kbd className="dashboard-theme-control rounded border border-slate-200 bg-slate-50 px-1 py-px text-[10px]">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="dashboard-theme-control rounded border border-slate-200 bg-slate-50 px-1 py-px text-[10px]">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="dashboard-theme-control rounded border border-slate-200 bg-slate-50 px-1 py-px text-[10px]">esc</kbd>
                close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
