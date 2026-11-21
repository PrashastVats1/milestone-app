import { actorLabel, formatDateTime } from "@/lib/format";
import type { Activity } from "@/lib/types";

export function ActivityTimeline({ activity }: { activity: Activity[] }) {
  const items = [...activity].reverse();
  return (
    <section>
      <p className="text-[11px] font-medium tracking-[0.16em] text-accent uppercase">Record</p>
      <h2 className="mt-1 font-display text-3xl tracking-tight">Activity</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        A shared log of the agreement, the acceptance, and every change after it.
      </p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nothing has been recorded yet.</p>
      ) : null}
      <ol className="mt-6 space-y-5 border-l border-line pl-5">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span className="absolute top-1.5 -left-[26px] size-2.5 rounded-full bg-accent ring-4 ring-paper" />
            <p className="text-xs text-muted">
              {formatDateTime(item.at)} · {actorLabel(item.actor)}
            </p>
            <p className="mt-1 text-sm leading-6">{item.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
