import { FileUp, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { emailService } from "../../services/emailService";
import { getErrorMessage } from "../../services/api";
import { reportService } from "../../services/reportService";
import { scanService } from "../../services/scanService";
import ScanResultPanel from "./ScanResultPanel";
import EmailFileGuide from "./EmailFileGuide";

const tabs = [
  ["url", "URL"],
  ["email", "Email"],
  ["sms", "SMS"],
  ["report", "Report threat"],
];

const scannerCopy = {
  url: {
    title: "URL scanner",
    description: "Check a web address for phishing, malware, and other suspicious activity.",
  },
  email: {
    title: "Email scanner",
    description: "Paste suspicious email content to check for phishing and harmful links.",
  },
  sms: {
    title: "SMS scanner",
    description: "Check a suspicious text message for scams, unsafe links, and warning signs.",
  },
  report: {
    title: "Report a threat",
    description: "Send suspicious content to the security team for further review.",
  },
};

export default function ScanCenter({ onComplete, initialTab = "url", lockedTab = false }) {
  const [tab, setTab] = useState(initialTab);
  const [content, setContent] = useState("");
  const [reportType, setReportType] = useState("url");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);
  useEffect(() => {
    if (["url", "email", "sms"].includes(initialTab)) {
      setTab(initialTab);
      setContent("");
      setResult(null);
    }
  }, [initialTab]);
  useEffect(() => {
    if (!result) return undefined;
    const frame = window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [result]);
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      let response;
      if (tab === "url") response = await scanService.scanUrl(content.trim());
      if (tab === "sms") response = await scanService.scanSms(content.trim());
      if (tab === "email") response = await emailService.analyze(content.trim());
      if (tab === "report") response = await reportService.create({ report_type: reportType, content: content.trim() });
      const scanResult = tab === "report" ? null : response?.data;
      setResult(scanResult);
      const resultMessage = scanResult?.classification === "safe" ? "Scan complete. No strong threats detected." : scanResult?.classification === "phishing" ? "Scan complete. Likely phishing detected." : scanResult?.classification === "suspicious" ? "Scan complete. Suspicious indicators detected." : "Scan complete.";
      const notify = scanResult?.classification === "phishing" ? toast.error : scanResult?.classification === "suspicious" ? toast.warning : toast.success;
      notify(tab === "report" ? "Threat reported." : resultMessage, {
        id: "scan-complete",
      });
      setContent("");
      onComplete?.(scanResult);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not complete scan."), {
        id: "scan-error",
      });
    } finally { setSubmitting(false); }
  };
  const label = tab === "url" ? "Web address" : tab === "email" ? "Email content" : tab === "sms" ? "SMS content" : "Suspicious content";
  const copy = scannerCopy[tab];
  const inputGuidance = {
    url: { hint: "Paste the complete link, including https://", placeholder: "https://example.com/login" },
    email: { hint: "Include the sender, subject, message text, and any links.", placeholder: "Paste the complete email here" },
    sms: { hint: "Include the full message and any links.", placeholder: "Paste the complete text message here" },
    report: { hint: "Include enough detail for the security team to investigate.", placeholder: "Paste the suspicious content here" },
  }[tab];
  const fieldClassName = "mt-3 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-400 focus:border-[#087CF0] focus:ring-4 focus:ring-[#087CF0]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500";
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#34383d] dark:bg-[#17191c]">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">{copy.title}</h2>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{copy.description}</p>
      </div>
      <div>
        {!lockedTab && <div className="flex gap-1 overflow-x-auto border-b border-slate-100 p-3 dark:border-slate-800" role="tablist">{tabs.map(([id, text]) => <button key={id} type="button" onClick={() => { setTab(id); setContent(""); setResult(null); }} className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-bold ${tab === id ? "bg-cyber-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} role="tab" aria-selected={tab === id}>{text}</button>)}</div>}
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-8">
          {tab === "report" && <label className="block text-sm font-bold">Threat type<select value={reportType} onChange={(event) => setReportType(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-950"><option value="url">URL</option><option value="email">Email</option><option value="sms">SMS</option></select></label>}
          {tab === "email" && <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70"><div><p className="text-sm font-bold text-slate-900 dark:text-white">Have the original email file?</p><p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">Upload an .eml or .txt file to preserve headers and template content.</p></div><label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-cyber-400 hover:text-cyber-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyber-500 dark:hover:text-cyber-300"><FileUp size={16} />Choose file<input type="file" accept=".eml,.txt,message/rfc822,text/plain" className="sr-only" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setContent(await file.text()); setResult(null); toast.success("Email file loaded.", { id: "email-file-loaded" }); event.target.value = ""; }} /></label></div><EmailFileGuide /></div>}
          <label className="block text-sm font-bold">{label}<span className="mt-1.5 block text-xs font-normal text-slate-500">{inputGuidance.hint}</span>{tab === "url" ? <input required type="url" value={content} onChange={(event) => { setContent(event.target.value); setResult(null); }} placeholder={inputGuidance.placeholder} className={`${fieldClassName} min-h-12`} /> : <textarea required rows={tab === "sms" ? 5 : 6} value={content} onChange={(event) => { setContent(event.target.value); setResult(null); }} placeholder={inputGuidance.placeholder} className={`${fieldClassName} resize-y`} />}<span className="mt-2 block text-xs font-normal text-slate-500">Only submit content you are authorized to analyze.</span></label>
          <button disabled={submitting || !content.trim()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#087CF0] px-5 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(8,124,240,0.24)] transition-all hover:bg-[#0068D7] hover:shadow-[0_8px_20px_rgba(8,124,240,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45A3FF] focus-visible:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#1682E8] disabled:text-white disabled:shadow-[0_4px_12px_rgba(22,130,232,0.18)] sm:w-auto">{submitting ? <Loader2 className="animate-spin" size={19} strokeWidth={2.4} /> : <Send size={19} strokeWidth={2.4} />}{submitting ? "Processing…" : tab === "report" ? "Submit report" : "Run scan"}</button>
        </form>
        <div ref={resultRef}><ScanResultPanel result={result} /></div>
      </div>
    </section>
  );
}
