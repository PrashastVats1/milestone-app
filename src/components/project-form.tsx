"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { formatInr, parseAmount } from "@/lib/format";
import type { MilestoneInput, ProjectInput } from "@/lib/types";
import { blankMilestone } from "@/lib/validate";
import { Button, ErrorList, Field, LineEditor, MoneyField, inputClass } from "./ui";

type MilestoneGap = "title" | "amount" | "deadline" | "deliverable" | "criterion";

const gapOrder: MilestoneGap[] = ["title", "amount", "deadline", "deliverable", "criterion"];

const gapLabel: Record<MilestoneGap, string> = {
  title: "a title",
  amount: "an amount greater than zero",
  deadline: "a deadline",
  deliverable: "at least one deliverable",
  criterion: "at least one acceptance criterion",
};

function milestoneGaps(milestone: MilestoneInput): MilestoneGap[] {
  const amount = parseAmount(milestone.amount);
  const present: Record<MilestoneGap, boolean> = {
    title: milestone.title.trim() !== "",
    amount: amount !== null && amount > 0,
    deadline: milestone.deadline.trim() !== "",
    deliverable: milestone.deliverables.some((item) => item.trim() !== ""),
    criterion: milestone.acceptanceCriteria.some((item) => item.trim() !== ""),
  };
  return gapOrder.filter((gap) => !present[gap]);
}

function gapMessage(gaps: MilestoneGap[]) {
  const labels = gaps.map((gap) => gapLabel[gap]);
  const list =
    labels.length <= 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  return `Finish this milestone before adding another. It still needs ${list}.`;
}

function focusMilestoneGap(milestone: MilestoneInput, gap: MilestoneGap) {
  const id =
    gap === "deliverable" && milestone.deliverables.length === 0
      ? `milestone-${milestone.id}-deliverable-add`
      : gap === "criterion" && milestone.acceptanceCriteria.length === 0
        ? `milestone-${milestone.id}-criterion-add`
        : `milestone-${milestone.id}-${gap}`;
  const field = document.getElementById(id);
  field?.scrollIntoView({ block: "center" });
  field?.focus();
}

export function DraftSavedDialog({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const messageId = useId();
  const continueId = useId();

  useEffect(() => {
    document.getElementById(continueId)?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [continueId]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onContinue();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const items = [...dialogRef.current.querySelectorAll<HTMLElement>("button")];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onContinue]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="w-full max-w-md rounded-2xl border border-line bg-card p-5 sm:p-6"
      >
        <h2 id={titleId} className="font-display text-2xl tracking-tight text-ink">
          Draft saved
        </h2>
        <p id={messageId} className="mt-2 text-sm leading-6 text-muted">
          Your project agreement has been saved. It has not been sent to your client yet.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button id={continueId} className="w-full sm:w-auto" onClick={onContinue}>
            Continue editing
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onBack}>
            Back to projects
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProjectForm({
  initial,
  submitLabel,
  intro,
  savedNote,
  allowRepeat = false,
  onSubmit,
}: {
  initial: ProjectInput;
  submitLabel: string;
  intro: string;
  savedNote?: string | null;
  allowRepeat?: boolean;
  onSubmit: (input: ProjectInput) => { ok: true } | { ok: false; errors: string[] };
}) {
  const [input, setInput] = useState(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [milestoneNotice, setMilestoneNotice] = useState<{ id: string; gaps: MilestoneGap[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [totalEdited, setTotalEdited] = useState(initial.totalAmount.trim() !== "");
  const busy = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const milestoneSum = input.milestones.reduce(
    (sum, milestone) => sum + (parseAmount(milestone.amount) ?? 0),
    0,
  );
  const contract = parseAmount(input.totalAmount);

  function replaceMilestones(
    current: ProjectInput,
    milestones: ProjectInput["milestones"],
  ): ProjectInput {
    const previous = current.milestones.reduce(
      (sum, milestone) => sum + (parseAmount(milestone.amount) ?? 0),
      0,
    );
    const next = milestones.reduce((sum, milestone) => sum + (parseAmount(milestone.amount) ?? 0), 0);
    const contract = parseAmount(current.totalAmount);
    const followMilestones = !totalEdited && (current.totalAmount.trim() === "" || contract === previous);
    return {
      ...current,
      milestones,
      totalAmount: followMilestones && next > 0 ? String(next) : current.totalAmount,
    };
  }

  function updateMilestone(id: string, patch: Partial<ProjectInput["milestones"][number]>) {
    setMilestoneNotice((current) => (current?.id === id ? null : current));
    setInput((current) =>
      replaceMilestones(
        current,
        current.milestones.map((milestone) => (milestone.id === id ? { ...milestone, ...patch } : milestone)),
      ),
    );
  }

  function addMilestone() {
    const previous = input.milestones[input.milestones.length - 1];
    if (previous) {
      const gaps = milestoneGaps(previous);
      if (gaps.length > 0) {
        setMilestoneNotice({ id: previous.id, gaps });
        requestAnimationFrame(() => focusMilestoneGap(previous, gaps[0]));
        return;
      }
    }
    setMilestoneNotice(null);
    setInput((current) => ({
      ...current,
      milestones: [...current.milestones, blankMilestone(current.expectedCompletion)],
    }));
  }

  function moveMilestone(index: number, direction: -1 | 1) {
    setInput((current) => {
      const next = current.milestones.slice();
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return { ...current, milestones: next };
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    const result = onSubmit(input);
    setErrors(result.ok ? [] : result.errors);
    if (!result.ok || allowRepeat) {
      busy.current = false;
      setSaving(false);
    }
    if (!result.ok) {
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ block: "start" }));
    }
  }

  return (
    <form className="space-y-6 sm:space-y-8" onSubmit={handleSubmit} noValidate>
      <div>
        <p className="text-[11px] font-medium tracking-[0.14em] text-accent uppercase sm:tracking-[0.16em]">Agreement</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight sm:text-4xl">Write the scope</h1>
        <p className="mt-2 max-w-2xl text-sm leading-5 text-muted sm:mt-3 sm:leading-6">{intro}</p>
      </div>

      {savedNote ? (
        <p className="rounded-2xl bg-good-soft px-4 py-3 text-sm text-good">{savedNote}</p>
      ) : null}
      <div ref={errorRef} className="scroll-mt-36">
        <ErrorList errors={errors} />
      </div>

      <section className="rounded-2xl border border-line bg-card p-4 sm:rounded-3xl sm:p-7">
        <h2 className="font-display text-xl tracking-tight sm:text-2xl">1 · Project</h2>
        <div className="mt-3 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
          <div className="sm:col-span-2">
            <Field label="Project name">
              <input
                className={inputClass}
                value={input.name}
                placeholder="Northwind Ceramics — catalog website"
                onChange={(event) => setInput({ ...input, name: event.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="What will be delivered" hint="Say what is included, and what is not.">
              <textarea
                className={inputClass}
                rows={4}
                value={input.description}
                placeholder="Pages, files, and the boundaries of the work."
                onChange={(event) => setInput({ ...input, description: event.target.value })}
              />
            </Field>
          </div>
          <Field label="Client name">
            <input
              className={inputClass}
              value={input.clientName}
              placeholder="Meera Kapoor"
              onChange={(event) => setInput({ ...input, clientName: event.target.value })}
            />
          </Field>
          <Field label="Client email">
            <input
              className={inputClass}
              type="email"
              value={input.clientEmail}
              placeholder="meera@northwind.studio"
              onChange={(event) => setInput({ ...input, clientEmail: event.target.value })}
            />
          </Field>
          <Field label="Start date">
            <input
              className={inputClass}
              type="date"
              value={input.startDate}
              onChange={(event) => setInput({ ...input, startDate: event.target.value })}
            />
          </Field>
          <Field label="Expected completion">
            <input
              className={inputClass}
              type="date"
              value={input.expectedCompletion}
              onChange={(event) => setInput({ ...input, expectedCompletion: event.target.value })}
            />
          </Field>
          <Field label="Total project amount" hint="The contract total, in INR. A typed total stays until you replace it.">
            <MoneyField
              value={input.totalAmount}
              placeholder="180000"
              onChange={(totalAmount) => {
                setTotalEdited(true);
                setInput({ ...input, totalAmount });
              }}
            />
            {contract !== null && contract !== milestoneSum ? (
              <p className="mt-2 text-sm text-bad">
                Milestone amounts add up to {formatInr(milestoneSum)}. This contract total is {formatInr(contract)}.
              </p>
            ) : null}
          </Field>
          <div className="flex items-end">
            <div className="w-full rounded-2xl bg-archive px-4 py-3 text-sm">
              <p className="text-muted">Calculated from milestones</p>
              <p className="mt-1 font-display text-2xl text-ink">{formatInr(milestoneSum)}</p>
              {contract !== null && contract !== milestoneSum ? (
                <button
                  type="button"
                  className="mt-2 font-medium text-accent"
                  onClick={() => {
                    setTotalEdited(true);
                    setInput({ ...input, totalAmount: String(milestoneSum) });
                  }}
                >
                  Replace the contract total with the milestone sum
                </button>
              ) : (
                <p className="mt-1 text-muted">
                  {contract === milestoneSum
                    ? "Matches the contract total."
                    : "Set the contract total, or match it to these milestones."}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl tracking-tight sm:text-2xl">2 · Milestones</h2>
            <p className="mt-1 text-sm text-muted">
              Each one needs deliverables, acceptance criteria, an amount, and a deadline.
            </p>
          </div>
          <Button variant="secondary" onClick={addMilestone}>
            <Plus className="size-4" aria-hidden />
            Add milestone
          </Button>
        </div>

        {input.milestones.map((milestone, index) => (
          <article key={milestone.id} className="rounded-2xl border border-line bg-card p-4 sm:rounded-3xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted">Milestone {index + 1}</p>
              <div className="flex gap-1">
                <Button variant="ghost" className="px-3" onClick={() => moveMilestone(index, -1)} disabled={index === 0}>
                  <ArrowUp className="size-4" aria-hidden />
                  Up
                </Button>
                <Button
                  variant="ghost"
                  className="px-3"
                  onClick={() => moveMilestone(index, 1)}
                  disabled={index === input.milestones.length - 1}
                >
                  <ArrowDown className="size-4" aria-hidden />
                  Down
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 text-bad"
                  disabled={input.milestones.length === 1}
                  onClick={() =>
                    setInput((current) =>
                      replaceMilestones(
                        current,
                        current.milestones.filter((item) => item.id !== milestone.id),
                      ),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
            {milestoneNotice?.id === milestone.id ? (
              <p className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad" role="alert">
                {gapMessage(milestoneNotice.gaps)}
              </p>
            ) : null}
            <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
              <div className="sm:col-span-2">
                <Field label="Title">
                  <input
                    id={`milestone-${milestone.id}-title`}
                    className={`${inputClass} scroll-mt-28`}
                    value={milestone.title}
                    placeholder="Visual design"
                    onChange={(event) => updateMilestone(milestone.id, { title: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Amount">
                <MoneyField
                  id={`milestone-${milestone.id}-amount`}
                  value={milestone.amount}
                  placeholder="75000"
                  onChange={(amount) => updateMilestone(milestone.id, { amount })}
                />
              </Field>
              <Field label="Deadline">
                <input
                  id={`milestone-${milestone.id}-deadline`}
                  className={`${inputClass} scroll-mt-28`}
                  type="date"
                  value={milestone.deadline}
                  onChange={(event) => updateMilestone(milestone.id, { deadline: event.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes" hint="Optional context for this milestone.">
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={milestone.description}
                    onChange={(event) => updateMilestone(milestone.id, { description: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Deliverables">
                <LineEditor
                  items={milestone.deliverables}
                  placeholder="What will be handed over"
                  addLabel="Add deliverable"
                  firstInputId={`milestone-${milestone.id}-deliverable`}
                  addButtonId={`milestone-${milestone.id}-deliverable-add`}
                  onChange={(deliverables) => updateMilestone(milestone.id, { deliverables })}
                />
              </Field>
              <Field label="Acceptance criteria" hint="How both sides will know this is done.">
                <LineEditor
                  items={milestone.acceptanceCriteria}
                  placeholder="The client confirms this in writing"
                  addLabel="Add criterion"
                  firstInputId={`milestone-${milestone.id}-criterion`}
                  addButtonId={`milestone-${milestone.id}-criterion-add`}
                  onChange={(acceptanceCriteria) => updateMilestone(milestone.id, { acceptanceCriteria })}
                />
              </Field>
            </div>
          </article>
        ))}
      </section>

      <div className="flex justify-end">
        <Button type="submit" className="px-6" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
