import { Check, Lock } from "lucide-react";
import { formatDate, formatDateTime, formatInr } from "@/lib/format";
import type { Milestone, Project } from "@/lib/types";
import { StatusBadge } from "./ui";

export function MilestoneList({
  milestones,
  showSource = false,
}: {
  milestones: Milestone[];
  showSource?: boolean;
}) {
  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <article
          key={milestone.id}
          id={`milestone-${milestone.id}`}
          className="scroll-mt-28 rounded-3xl border border-line bg-card p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] text-muted uppercase">
                Milestone {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 font-display text-2xl tracking-tight">{milestone.title}</h3>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-display text-2xl tracking-tight">{formatInr(milestone.amount)}</p>
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
            <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/80">{milestone.description}</p>
          ) : null}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6">
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
    <section id="original-agreement" className="scroll-mt-28 rounded-3xl bg-archive px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink text-white">
          <Lock className="size-4" aria-hidden />
        </span>
        <div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-ink/70 uppercase">Preserved</p>
          <h2 className="mt-1 font-display text-3xl tracking-tight">Original agreement</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
            Accepted by {original.clientName} on {formatDateTime(original.acceptedAt)}. Approved
            changes are added beside this record. They do not rewrite it.
          </p>
        </div>
      </div>
      <dl className="mt-6 grid gap-4 sm:grid-cols-3">
        <Fact label="Contract total" value={formatInr(original.totalAmount)} />
        <Fact label="Started" value={formatDate(original.startDate)} />
        <Fact label="Agreed finish" value={formatDate(original.expectedCompletion)} />
      </dl>
      <p className="mt-6 max-w-3xl text-sm leading-6 text-ink/80">{original.description}</p>
      <div className="mt-6">
        <MilestoneList milestones={original.milestones} />
      </div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-[0.14em] text-ink/50 uppercase">{label}</dt>
      <dd className="mt-1 font-display text-xl">{value}</dd>
    </div>
  );
}
