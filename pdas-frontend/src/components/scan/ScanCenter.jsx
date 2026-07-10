import { Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { emailService } from "../../services/emailService";
import { getErrorMessage } from "../../services/api";
import { reportService } from "../../services/reportService";
import { scanService } from "../../services/scanService";

const tabs = [
  ["url", "URL"],
  ["email", "Email"],
  ["sms", "SMS"],
  ["report", "Report threat"],
];

export default function ScanCenter({ onComplete, initialTab = "url", lockedTab = false }) {
  const [tab, setTab] = useState(initialTab);
  const [content, setContent] = useState("");
  const [reportType, setReportType] = useState("url");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (["url", "email", "sms"].includes(initialTab)) {
      setTab(initialTab);
      setContent("");
    }
  }, [initialTab]);
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (tab === "url") await scanService.scanUrl(content.trim());
      if (tab === "sms") await scanService.scanSms(content.trim());
      if (tab === "email") await emailService.analyze(content.trim());
      if (tab === "report") await reportService.create({ report_type: reportType, content: content.trim() });
      toast.success(tab === "report" ? "Threat reported." : "Scan complete.", {
        id: "scan-complete",
      });
      setContent("");
      onComplete?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not complete scan."), {
        id: "scan-error",
      });
    } finally { setSubmitting(false); }
  };
  const label = tab === "url" ? "Web address" : tab === "email" ? "Email content" : tab === "sms" ? "SMS content" : "Suspicious content";
  return (
    <section>
      <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyber-600">Security tools</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight dark:text-white">Scan Center</h1><p className="mt-2 text-slate-500">Inspect suspicious content or send it to the security team.</p></div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {!lockedTab && <div className="flex gap-1 overflow-x-auto border-b border-slate-100 p-3 dark:border-slate-800" role="tablist">{tabs.map(([id, text]) => <button key={id} type="button" onClick={() => { setTab(id); setContent(""); }} className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-bold ${tab === id ? "bg-cyber-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`} role="tab" aria-selected={tab === id}>{text}</button>)}</div>}
        <form onSubmit={submit} className="space-y-5 p-5 sm:p-8">
          {tab === "report" && <label className="block text-sm font-bold">Threat type<select value={reportType} onChange={(event) => setReportType(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-950"><option value="url">URL</option><option value="email">Email</option><option value="sms">SMS</option></select></label>}
          <label className="block text-sm font-bold">{label}<textarea required rows={tab === "url" ? 3 : 8} value={content} onChange={(event) => setContent(event.target.value)} placeholder={tab === "url" ? "https://example.com" : `Paste ${label.toLowerCase()} here…`} className="mt-2 block w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyber-500 focus:ring-4 focus:ring-cyber-500/10 dark:border-slate-700 dark:bg-slate-950" /><span className="mt-2 block text-xs font-normal text-slate-500">Only submit content you are authorized to analyze.</span></label>
          <button disabled={submitting || !content.trim()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyber-600 px-5 font-bold text-white hover:bg-cyber-700 disabled:opacity-50 sm:w-auto">{submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}{submitting ? "Processing…" : tab === "report" ? "Submit report" : "Run scan"}</button>
        </form>
      </div>
    </section>
  );
}
