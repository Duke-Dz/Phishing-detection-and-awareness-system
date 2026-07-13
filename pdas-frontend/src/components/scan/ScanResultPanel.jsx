import { AlertTriangle, CheckCircle2, ShieldX } from "lucide-react";
import RiskRing from "./RiskRing";
import RiskScoreKey from "./RiskScoreKey";

const presentation = {
  safe: {
    label: "No strong threats detected",
    Icon: CheckCircle2,
    shell: "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/35",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300",
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-900/70 dark:text-emerald-200 dark:ring-emerald-700",
    heading: "text-emerald-950 dark:text-emerald-100",
  },
  suspicious: {
    label: "Suspicious indicators detected",
    Icon: AlertTriangle,
    shell: "border-amber-300 bg-amber-50/75 dark:border-amber-800 dark:bg-amber-950/35",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-900/70 dark:text-amber-200 dark:ring-amber-700",
    heading: "text-amber-950 dark:text-amber-100",
  },
  phishing: {
    label: "Likely phishing detected",
    Icon: ShieldX,
    shell: "border-rose-300 bg-rose-50/75 dark:border-rose-800 dark:bg-rose-950/35",
    icon: "bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-300",
    badge: "bg-rose-100 text-rose-900 ring-rose-300 dark:bg-rose-900/70 dark:text-rose-200 dark:ring-rose-700",
    heading: "text-rose-950 dark:text-rose-100",
  },
};

const fallbackFeedback = {
  safe: {
    verdict: "No strong phishing indicators were detected.",
    recommended_action: "Continue with normal caution; automated scanners cannot guarantee complete safety.",
    verification_steps: ["Confirm the sender or domain is the one you expected.", "Never share passwords, OTPs, PINs, or payment details unexpectedly."],
  },
  suspicious: {
    verdict: "This content contains indicators that need verification.",
    recommended_action: "Pause and verify the sender or website through an official channel before taking action.",
    verification_steps: ["Do not enter credentials or payment information.", "Contact the claimed sender using trusted contact details."],
  },
  phishing: {
    verdict: "This content shows strong signs of phishing.",
    recommended_action: "Do not click links, reply, call included numbers, or submit any information.",
    verification_steps: ["Close the message or website.", "Contact the organisation through its official app, website, or verified phone number.", "Report the content to your security team or service provider."],
  },
};

export default function ScanResultPanel({ result }) {
  if (!result?.classification) return null;
  const tone = presentation[result.classification] || presentation.suspicious;
  const Icon = tone.Icon;
  const details = result.detection_details || {};
  const feedback = details.user_feedback || result.user_feedback || fallbackFeedback[result.classification];
  const evidence = feedback.reasons?.length
    ? feedback.reasons
    : details.scoring?.top_evidence?.map((item) => item.evidence || item.name).filter(Boolean) || [];
  const steps = feedback.verification_steps || fallbackFeedback[result.classification]?.verification_steps || [];
  const displayEvidence = (value) => String(value).replace(/https?:\/\/\S+/g, (url) => url.length > 56 ? `${url.slice(0, 53)}...` : url);

  return (
    <section className={`mx-5 mb-5 overflow-hidden rounded-xl border sm:mx-8 sm:mb-8 ${tone.shell}`} role="status" aria-live="polite">
      <div className="flex flex-col gap-4 border-b border-black/10 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tone.icon}`}><Icon size={23} strokeWidth={2.3} aria-hidden="true" /></span>
          <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${tone.badge}`}>{result.classification[0].toUpperCase() + result.classification.slice(1)}</span><h3 className={`mt-2 text-xl font-bold tracking-tight ${tone.heading}`}>{tone.label}</h3><p className="mt-1 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{feedback.verdict}</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-lg border border-white/80 bg-white/80 px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"><RiskRing score={result.risk_score} compact /><div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Risk score</p><p className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(Number(result.risk_score || 0))} / 100</p></div></div>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-white/90 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/65">
          <h4 className="text-sm font-bold text-slate-950 dark:text-white">{evidence.length ? "What we found" : "What this means"}</h4>
          {evidence.length ? <ul className="mt-2.5 space-y-2">{evidence.slice(0, 4).map((reason) => <li key={reason} className="flex min-w-0 gap-2 text-sm leading-5 text-slate-700 dark:text-slate-300" title={reason}><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" /><span className="min-w-0 whitespace-pre-line [overflow-wrap:anywhere]">{displayEvidence(reason)}</span></li>)}</ul> : <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">The scanner did not find strong known warning signs. Stay cautious if the request is unexpected or urgent.</p>}
        </div>
        <div className="min-w-0 rounded-lg border border-white/90 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/65">
          <h4 className="text-sm font-bold text-slate-950 dark:text-white">What you should do</h4>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-800 dark:text-slate-200">{feedback.recommended_action}</p>
          <ol className="mt-2.5 space-y-2">{steps.map((step, index) => <li key={step} className="flex min-w-0 gap-2 text-sm leading-5 text-slate-700 dark:text-slate-300"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{index + 1}</span><span className="min-w-0 break-words">{step}</span></li>)}</ol>
        </div>
      </div>
      <div className="border-t border-black/10 p-4 sm:px-5"><div className="max-w-2xl"><RiskScoreKey /></div></div>
    </section>
  );
}
