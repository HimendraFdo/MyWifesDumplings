"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminDialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `dialog-title-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-2 border-brand-ink/15 bg-brand-cream p-0 text-brand-ink shadow-2xl backdrop:bg-black/55",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-brand-ink/10 p-5">
        <div>
          <h2 id={titleId} className="font-display text-2xl">
            {title}
          </h2>
          {description && (
            <p className="mt-1 font-body text-sm text-brand-ink/65">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-brand-ink/60 transition-colors hover:bg-brand-ink/10 hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
