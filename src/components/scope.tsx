import { Check, Lock } from "lucide-react";
import { formatDate, formatDateTime, formatInr } from "@/lib/format";
import type { Milestone, Project } from "@/lib/types";
import { cn, StatusBadge } from "./ui";

export function MilestoneList({
  milestones,
  showSource = false,
}: {
  milestones: Milestone[];
  showSource?: boolean;
}) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {milestones.map((milestone, index) => (
        <article
          key={milestone.id}
          id={`milestone-${milestone.id}`}
          className={cn(
            "scroll-mt-28 rounded-2xl border bg-card p-4 sm:scroll-mt-36 sm:rounded-3xl sm:p-6",
            showSource && milestone.source === "change"
              ? "border-kind-scope/30 border-l-4 border-l-kind-scope"
              : showSource
                ? "border-line border-l-4 border-l-ink/30"
                : "border-line",
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-[0.12em] text-muted uppercase sm:tracking-[0.14em]">
                Milestone {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-0.5 font-display text-xl tracking-tight sm:mt-1 sm:text-2xl">{milestone.title}</h3>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-display text-xl tracking-tight sm:text-2xl">{formatInr(milestone.amount)}</p>
              <p className="mt-1 text-sm text-muted">Due {formatDate(milestone.deadline)}</p>
              {milestone.agreedDeadline || milestone.agreedAmount !== undefined ? (
                <p className="mt-1 text-xs text-muted">
                  Originally agreed {formatInr(milestone.agreedAmount ?? milestone.amount)} due{" "}
                  {formatDate(milestone.agreedDeadline ?? milestone.deadline)}
                </p>
              ) : null}
            </div>
          </div>
          {showSource ? (
            <div className="mt-3">
              <StatusBadge
                status={milestone.source === "change" ? "added" : "original"}
                label={milestone.source === "change" ? "Added by change" : "Original"}
              />
            </div>
          ) : null}
          {milestone.description ? (
            <p className="mt-3 max-w-3xl text-sm leading-5 text-ink/80 sm:mt-4 sm:leading-6">{milestone.description}</p>
          ) : null}
          <div className="mt-3 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-5">
            <ItemList title="Deliverables" items={milestone.deliverables} />
            <ItemList title="Acceptance criteria" items={milestone.acceptanceCriteria} marked />
          </div>
        </article>
      ))}
    </div>
  );
}

function ItemList({
  title,
  items,
  marked = false,
}: {
  title: string;
  items: string[];
  marked?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{title}</p>
      <ul className="mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-5 sm:leading-6">
            {marked ? (
              <Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden />
            ) : (
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink/50" aria-hidden />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OriginalAgreement({ project }: { project: Project }) {
  const original = project.originalAgreement;
  if (!original) return null;

  return (
    <section id="original-agreement" className="scroll-mt-28 rounded-2xl bg-archive px-4 py-4 sm:scroll-mt-36 sm:rounded-3xl sm:px-8 sm:py-8">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-ink text-white sm:size-10 sm:rounded-2xl">
          <Lock className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-[0.14em] text-ink/70 uppercase sm:tracking-[0.16em]">Preserved</p>
          <h2 className="mt-0.5 font-display text-2xl tracking-tight sm:mt-1 sm:text-3xl">Original agreement</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-5 text-ink/70 sm:mt-2 sm:leading-6">
            Accepted by {original.clientName} on {formatDateTime(original.acceptedAt)}. Approved
            changes are added beside this record. They do not rewrite it.
          </p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
        <Fact label="Contract total" value={formatInr(original.totalAmount)} />
        <Fact label="Started" value={formatDate(original.startDate)} />
        <Fact label="Agreed finish" value={formatDate(original.expectedCompletion)} />
      </dl>
      <p className="mt-4 max-w-3xl text-sm leading-5 text-ink/80 sm:mt-6 sm:leading-6">{original.description}</p>
      <div className="mt-4 sm:mt-6">
        <MilestoneList milestones={original.milestones} />
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-[0.14em] text-ink/50 uppercase">{label}</dt>
      <dd className="mt-0.5 font-display text-lg sm:mt-1 sm:text-xl">{value}</dd>
    </div>
  );
}
