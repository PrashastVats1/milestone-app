import { actorLabel, formatDateTime } from "@/lib/format";
import type { Activity } from "@/lib/types";

export function ActivityTimeline({ activity }: { activity: Activity[] }) {
  const items = [...activity].reverse();
  return (
    <section id="activity" className="scroll-mt-28 sm:scroll-mt-36">
      <p className="text-[11px] font-medium tracking-[0.14em] text-accent uppercase sm:tracking-[0.16em]">Record</p>
      <h2 className="mt-1 font-display text-2xl tracking-tight sm:text-3xl">Activity</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-5 text-muted sm:mt-2 sm:leading-6">
        A shared log of the agreement, the acceptance, and every change after it.
      </p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted sm:mt-6">Nothing has been recorded yet.</p>
      ) : null}
      <ol className="mt-4 space-y-3.5 border-l border-line pl-4 sm:mt-6 sm:space-y-5 sm:pl-5">
        {items.map((item) => (
          <li key={item.id} className="relative">
            <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-accent ring-4 ring-paper sm:-left-[26px]" />
            <p className="text-xs text-muted">
              {formatDateTime(item.at)} · {actorLabel(item.actor)}
            </p>
            <p className="mt-0.5 text-sm leading-5 sm:mt-1 sm:leading-6">{item.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
