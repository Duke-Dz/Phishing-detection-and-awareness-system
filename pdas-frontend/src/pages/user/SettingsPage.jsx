import { Bell, LockKeyhole, Palette, UserRound } from "lucide-react";

const groups = [
  ["Account", "Profile details and account preferences.", UserRound],
  ["Notification preferences", "Choose which security updates reach you.", Bell],
  ["Security", "Password, sessions, and account protection.", LockKeyhole],
  ["Appearance", "Theme and display preferences.", Palette],
];

export default function SettingsPage() {
  return <section><div className="mb-6"><h1 className="text-3xl font-extrabold dark:text-white">Settings</h1><p className="mt-2 text-slate-500">A central place for account preferences.</p></div><div className="grid gap-4 md:grid-cols-2">{groups.map(([title, text, Icon]) => <article key={title} className="dashboard-theme-surface rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-xl bg-cyber-50 text-cyber-600 dark:bg-cyber-500/10 dark:text-cyber-300"><Icon size={20} /></span><h2 className="mt-5 text-lg font-extrabold dark:text-white">{title}</h2><p className="mt-2 text-sm text-slate-500">{text}</p><p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Coming soon</p></article>)}</div></section>;
}
