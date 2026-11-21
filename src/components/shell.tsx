"use client";

import Link from "next/link";
import { useState } from "react";
import { Flag } from "lucide-react";
import { useMilestone } from "@/lib/store";
import { cn } from "./ui";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen min-w-0 flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:gap-3 sm:px-6 sm:py-3">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-white sm:size-9 sm:rounded-xl">
              <Flag className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-lg leading-none tracking-tight sm:text-xl">Milestone</span>
              <span className="mt-1 hidden text-xs text-muted sm:block">
                Clear scope. Agreed changes.
              </span>
            </span>
          </Link>
          <RoleSwitcher />
        </div>
        <div className="border-t border-line/70 bg-[#efeae1]">
          <p className="mx-auto max-w-6xl px-4 py-1.5 text-xs leading-4 text-muted sm:px-6 sm:py-2 sm:text-sm sm:leading-5">
            Demo on one device. Switch roles in this browser. Nothing is synced to another person.
          </p>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-10">{children}</main>
      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-2 pb-6 text-sm text-muted sm:px-6 sm:pb-8">
        <p>Records stay in this browser until you reset them.</p>
        <ResetDemo />
      </footer>
    </div>
  );
}

function RoleSwitcher() {
  const { role, setRole } = useMilestone();
  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <span className="hidden text-[11px] font-medium tracking-[0.14em] text-muted uppercase sm:inline">
        View as
      </span>
      <div className="flex rounded-full bg-ink p-0.5 sm:p-1" role="group" aria-label="View as">
        {(["freelancer", "client"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={role === option}
            onClick={() => setRole(option)}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-sm font-medium capitalize transition sm:px-4",
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
        className="rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-white"
        onClick={() => {
          resetDemo();
          setOpen(false);
        }}
      >
        Restore
      </button>
      <button type="button" className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium" onClick={() => setOpen(false)}>
        Cancel
      </button>
    </span>
  );
}
