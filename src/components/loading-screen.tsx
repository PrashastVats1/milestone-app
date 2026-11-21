import { Flag } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl bg-ink text-white">
          <Flag className="size-4" aria-hidden />
        </span>
        <p className="mt-4 font-display text-3xl tracking-tight">Milestone</p>
        <p className="mt-2 text-sm text-muted">Opening your agreements…</p>
      </div>
    </div>
  );
}
