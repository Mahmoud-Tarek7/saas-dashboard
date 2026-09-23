"use client";

export default function ConfirmDialog({ open, title, message, confirmLabel = "تأكيد", danger = false, onConfirm, onCancel, loading = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/70 backdrop-blur-sm px-4">
      <div className="bg-navy-800 border border-navy-600 rounded-2xl p-6 max-w-sm w-full">
        <h3 className="font-display font-bold text-lg text-parchment-100 mb-2">{title}</h3>
        <p className="text-mist-400 text-sm mb-6">{message}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-60 ${
              danger
                ? "bg-rust-500 hover:bg-rust-600 text-navy-950"
                : "bg-gold-500 hover:bg-gold-400 text-navy-950"
            }`}
          >
            {loading ? "جاري التنفيذ..." : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm text-mist-400 hover:text-parchment-100 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
