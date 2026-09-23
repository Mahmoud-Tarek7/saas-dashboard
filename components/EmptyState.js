export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-14 px-6 border border-dashed border-navy-600 rounded-2xl">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-navy-800 border border-navy-600 text-gold-400 mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>
      <p className="text-parchment-100 font-medium mb-1">{title}</p>
      {description && <p className="text-mist-500 text-sm mb-5">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-gold-500 hover:bg-gold-400 text-navy-950 px-5 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
