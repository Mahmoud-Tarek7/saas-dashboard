"use client";

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

const styles = {
  success: "border-emerald-500/30 bg-emerald-100 text-emerald-500",
  error: "border-rust-500/30 bg-rust-100 text-rust-500",
  info: "border-gold-500/30 bg-navy-800 text-gold-400",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 inset-x-0 z-50 flex flex-col items-center gap-2 pointer-events-none px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto border rounded-xl px-4 py-2.5 text-sm shadow-lg backdrop-blur ${styles[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
