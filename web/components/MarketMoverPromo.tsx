"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "nrl24-marketmover-promo-until";
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const DELAY_MS = 1500;
const MARK = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/marketmover-mark.png`;
const HREF =
  "https://www.marketmover.net?utm_source=nrl24-0&utm_medium=popup&utm_campaign=crosspromo";
const COPY = "MarketMover — live prices and model markets in one place. More markets coming.";

function promoHidden() {
  try {
    const until = Number(localStorage.getItem(KEY));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

function hideForTwoWeeks() {
  try {
    localStorage.setItem(KEY, String(Date.now() + TTL_MS));
  } catch {
    /* private browsing */
  }
}

/** Home and the Perfect Season game (`/play`) only. */
function promoPath(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/" || path === "/play";
}

export default function MarketMoverPromo() {
  const pathname = usePathname() || "/";
  const eligible = promoPath(pathname);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!eligible || promoHidden()) {
      dialogRef.current?.close();
      setOpen(false);
      return;
    }
    const t = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, [eligible, pathname]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!open || !el || el.open) return;
    el.showModal();
  }, [open]);

  function dismiss() {
    hideForTwoWeeks();
    dialogRef.current?.close();
    setOpen(false);
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="mm-promo-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        dismiss();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const items = [...dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !dialog.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="mm-promo">
        <button type="button" className="mm-promo-close" onClick={dismiss} aria-label="Dismiss">
          <span aria-hidden="true">×</span>
        </button>
        <img src={MARK} alt="" width={48} height={48} />
        <p id={titleId} className="mm-promo-copy">{COPY}</p>
        <div className="mm-promo-actions">
          <a className="btn btn-primary" href={HREF} onClick={dismiss}>
            Open MarketMover
          </a>
          <button type="button" className="btn" onClick={dismiss}>
            Not now
          </button>
        </div>
      </div>
    </dialog>
  );
}
