"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@/db/actions/auth";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) setConfirmText("");
  }, [open]);

  const canConfirm = confirmText === "DELETE";

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className="border-error-400! bg-error-400! text-neutral-50! hover:bg-error-600!"
        onClick={() => setOpen(true)}
      >
        Delete account
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (
              cardRef.current &&
              !cardRef.current.contains(e.target as Node)
            ) {
              setOpen(false);
            }
          }}
        >
          <div
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-heading"
            className="flex w-[420px] flex-col gap-16 rounded-sm border border-neutral-300 bg-white p-24 shadow-[0_2px_8.5px_rgba(0,0,0,0.05)]"
          >
            <h2
              id="delete-account-heading"
              className="font-heading text-xl text-neutral-800"
            >
              Delete account?
            </h2>
            <p className="text-base leading-[1.4] text-neutral-800">
              This permanently removes your account, progress, streak, XP, and
              review schedule. This cannot be undone.
            </p>

            <div className="flex flex-col gap-8">
              <label
                htmlFor="confirm-delete"
                className="text-xs text-neutral-500"
              >
                Type DELETE to confirm
              </label>
              <input
                id="confirm-delete"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                className="w-full rounded-sm border border-neutral-300 bg-neutral-100 px-8 py-1.5 text-base text-neutral-800 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            <div className="mt-8 flex items-center justify-end gap-12">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <form action={deleteAccount}>
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={!canConfirm}
                  className="border-error-400! bg-error-400! text-neutral-50! hover:bg-error-600!"
                >
                  Delete forever
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
