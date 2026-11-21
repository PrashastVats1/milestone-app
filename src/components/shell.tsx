"use client";

import Link from "next/link";
import { useState } from "react";
import { Flag } from "lucide-react";
import { useMilestone } from "@/lib/store";
import { cn } from "./ui";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-ink text-white">
              <Flag className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block font-display text-xl leading-none tracking-tight">Milestone</span>
              <span className="mt-1 hidden text-xs text-muted sm:block">
                Clear scope. Agreed changes.
              </span>
            </span>
          </Link>
          <RoleSwitcher />
        </div>
        <div className="border-t border-line/70 bg-[#efeae1]">
          <p className="mx-auto max-w-6xl px-4 py-2 text-xs leading-5 text-muted sm:px-6 sm:text-sm">
            Demo on one device. Switch roles in this browser. Nothing is synced to another person.
          </p>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-2 pb-8 text-sm text-muted sm:px-6">
        <p>Records stay in this browser until you reset them.</p>
        <ResetDemo />
      </footer>
    </div>
  );
}

function RoleSwitcher() {
  const { role, setRole } = useMilestone();
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">View as</span>
      <div className="flex rounded-full bg-ink p-1" role="group" aria-label="View as">
        {(["freelancer", "client"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={role === option}
            onClick={() => setRole(option)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition sm:px-4",
              role === option ? "bg-white text-ink" : "text-white/75 hover:text-white",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResetDemo() {
  const { resetDemo } = useMilestone();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="font-medium text-ink underline-offset-4 hover:underline" onClick={() => setOpen(true)}>
        Reset demo data
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <span>Restore the sample project?</span>
      <button
        type="button"
        className="font-medium text-ink"
        onClick={() => {
          resetDemo();
          setOpen(false);
        }}
      >
        Restore
      </button>
      <button type="button" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </span>
  );
}
