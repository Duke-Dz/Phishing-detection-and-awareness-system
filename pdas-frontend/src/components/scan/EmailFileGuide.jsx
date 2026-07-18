import { ChevronDown, CircleHelp, Laptop, ShieldCheck, Smartphone } from "lucide-react";
import { useState } from "react";

const guides = {
  computer: {
    Gmail: ["Open the email in Gmail.", "Select More (three dots), then Download message.", "Upload the downloaded .eml file here."],
    "Outlook web": ["Open the email in Outlook.com.", "Select More actions, then Download.", "Upload the downloaded .eml file here."],
    "Outlook app": ["Open the email.", "Select More actions > Save as in new Outlook, or File > Save As in classic Outlook.", "Upload the .eml file. If Outlook saves .msg, use Outlook web instead."],
    "Apple Mail": ["Open the email in Mail.", "Select File > Save As > Raw Message Source.", "Save it as an .eml file, then upload it here."],
  },
  mobile: {
    Gmail: ["The Gmail app cannot normally export a complete .eml file.", "Open mail.google.com in Chrome or Safari and request Desktop site.", "Open the email, select More, then Download message. If unavailable, paste the complete email below."],
    Outlook: ["The Outlook mobile app does not normally export .eml files.", "Open Outlook.com in your browser and request Desktop site.", "Open the email, select More actions, then Download. If unavailable, paste the complete email below."],
  },
};

export default function EmailFileGuide() {
  const [device, setDevice] = useState("computer");
  const [provider, setProvider] = useState("Gmail");
  const options = Object.keys(guides[device]);
  const chooseDevice = (value) => {
    setDevice(value);
    setProvider(Object.keys(guides[value])[0]);
  };

  return (
    <details className="dashboard-theme-card group rounded-lg border border-cyber-200 bg-cyber-50/45 open:bg-white">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm font-bold text-cyber-900 marker:content-none dark:text-cyber-300">
        <span className="flex items-center gap-2"><CircleHelp size={17} aria-hidden="true" />How do I get an .eml file?</span>
        <ChevronDown size={17} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="dashboard-theme-divider border-t border-cyber-100 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Your device</p>
            <div className="dashboard-theme-control inline-flex h-9 rounded-lg border border-slate-300 bg-slate-100 p-0.5">
              {[['computer', Laptop, 'Computer'], ['mobile', Smartphone, 'Mobile']].map(([value, Icon, label]) => <button key={value} type="button" onClick={() => chooseDevice(value)} className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-bold transition ${device === value ? "bg-white text-cyber-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:text-cyber-300 dark:ring-slate-600" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`} aria-pressed={device === value}><Icon size={14} />{label}</button>)}
            </div>
          </div>
          <label className="w-40 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email app<select value={provider} onChange={(event) => setProvider(event.target.value)} className="dashboard-theme-control mt-1.5 block h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold normal-case tracking-normal text-slate-800 outline-none transition hover:border-slate-400 focus:border-cyber-500 focus:ring-2 focus:ring-cyber-500/15 dark:text-slate-100">{options.map((option) => <option key={option}>{option}</option>)}</select></label>
        </div>

        <ol className="mt-3 grid gap-2 sm:grid-cols-3">
          {guides[device][provider].map((step, index) => <li key={step} className="dashboard-theme-control flex gap-2 rounded-lg bg-slate-50 p-2.5 text-xs leading-5 text-slate-700 dark:text-slate-300"><span className="dashboard-theme-card grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white font-bold text-cyber-700 ring-1 ring-slate-200 dark:text-cyber-300 dark:ring-[#3a4450]">{index + 1}</span><span>{step}</span></li>)}
        </ol>
        <p className="mt-3 flex items-center gap-2 text-[11px] leading-4 text-slate-500"><ShieldCheck size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />An .eml file gives the scanner more evidence. Only upload email you are authorized to analyze.</p>
      </div>
    </details>
  );
}
