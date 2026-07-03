export default function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="px-6 py-14 text-center">
      {Icon && <Icon className="mx-auto text-slate-300 dark:text-slate-600" size={38} />}
      <p className="mt-3 font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {action && <button type="button" onClick={onAction} className="mt-4 min-h-10 rounded-xl bg-cyber-600 px-4 text-sm font-bold text-white hover:bg-cyber-700">{action}</button>}
    </div>
  );
}
