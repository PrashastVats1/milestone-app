"use client";

import { useRef, useState } from "react";
import { addDays, formatDate, formatDateTime, formatInr, formatReason, plural, todayIso } from "@/lib/format";
import { orderedChanges } from "@/lib/selectors";
import { useMilestone } from "@/lib/store";
import type { ChangeRequest, ChangeStatus, Project } from "@/lib/types";
import { TIMELINE_REASONS } from "@/lib/types";
import { Button, Field, LineEditor, MoneyField, SectionHeading, StatusBadge, inputClass } from "./ui";

const labels: Record<ChangeStatus, string> = {
  requested: "Requested",
  proposed: "Proposed",
  approved: "Approved",
  rejected: "Rejected",
  declined: "Declined",
};

function partyTone(change: ChangeRequest): "client" | "freelancer" {
  return change.kind === "timeline" ? "freelancer" : "client";
}

function hasClientTerms(change: ChangeRequest) {
  return (
    change.kind !== "timeline" &&
    change.requestedCost !== undefined &&
    change.requestedDays !== undefined &&
    (change.requestedDeliverables ?? []).length > 0 &&
    (change.requestedCriteria ?? []).length > 0
  );
}

export function ChangeSection({ project }: { project: Project }) {
  const { role } = useMilestone();
  const changes = orderedChanges(project.changeRequests, role);

  return (
    <section id="changes" className="scroll-mt-36">
      <SectionHeading
        eyebrow="Changes"
        title="Scope changes"
        text="Scope requests and timeline revisions stay out of the project until they are approved. The original agreement is left as it was accepted."
      />
      {role === "client" ? <RequestForm projectId={project.id} /> : <TimelineForm project={project} />}
      {changes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-card px-4 py-5 text-sm text-muted sm:rounded-3xl sm:px-5 sm:py-8">
          No change requests yet. The original agreement is the whole scope.
        </p>
      ) : (
        <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
          {changes.map((change) => (
            <ChangeCard key={change.id} project={project} change={change} />
          ))}
        </div>
      )}
    </section>
  );
}

function RequestForm({ projectId }: { projectId: string }) {
  const { requestChange } = useMilestone();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [days, setDays] = useState("0");
  const [deliverables, setDeliverables] = useState([""]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState([""]);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const busy = useRef(false);

  if (!open) {
    return (
      <div>
        {sent ? (
          <p className="mb-3 rounded-2xl bg-good-soft px-4 py-3 text-sm text-good" role="status">
            Request sent. It stays out of the scope until the freelancer responds.
          </p>
        ) : null}
        <Button
          onClick={() => {
            setSent(false);
            setOpen(true);
          }}
        >
          Request a change
        </Button>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-line bg-card p-4 sm:rounded-3xl sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy.current) return;
        busy.current = true;
        const result = requestChange(projectId, {
          title,
          description,
          cost,
          days,
          note: "",
          deliverables,
          acceptanceCriteria,
        });
        if (!result.ok) {
          busy.current = false;
          setError(result.error);
          return;
        }
        setTitle("");
        setDescription("");
        setCost("");
        setDays("0");
        setDeliverables([""]);
        setAcceptanceCriteria([""]);
        setError(null);
        setSent(true);
        setOpen(false);
        busy.current = false;
      }}
    >
      <h3 className="font-display text-xl tracking-tight sm:text-2xl">Request additional work</h3>
      <p className="mt-1.5 text-sm leading-5 text-muted sm:mt-2 sm:leading-6">
        Name the cost and time you are proposing. The freelancer can accept that, counter it, or decline it.
      </p>
      <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
        <Field label="What should change">
          <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="Details" hint="Say what is being added, and what is still out of scope.">
          <textarea
            className={inputClass}
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <Field label="Proposed additional cost" hint="Use 0 if you expect no charge.">
            <MoneyField value={cost} onChange={setCost} />
          </Field>
          <Field label="Proposed extra days" hint="Use 0 if the finish date stays put.">
            <input
              className={inputClass}
              inputMode="numeric"
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
          </Field>
          <Field label="Deliverables">
            <LineEditor
              items={deliverables}
              onChange={setDeliverables}
              placeholder="What this change adds"
              addLabel="Add deliverable"
            />
          </Field>
          <Field label="Acceptance criteria">
            <LineEditor
              items={acceptanceCriteria}
              onChange={setAcceptanceCriteria}
              placeholder="How this change is accepted"
              addLabel="Add criterion"
            />
          </Field>
        </div>
        {error ? <p className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad" role="alert">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Send request</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

function upcomingMilestone(project: Project) {
  const today = todayIso();
  return (
    project.milestones
      .filter((milestone) => milestone.deadline >= today)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))[0] ?? project.milestones[0]
  );
}

function revisedDeadlineDefault(deadline: string | undefined) {
  if (!deadline || deadline < todayIso()) return "";
  return deadline;
}

function TimelineForm({ project }: { project: Project }) {
  const { requestTimelineChange } = useMilestone();
  const starting = upcomingMilestone(project);
  const [open, setOpen] = useState(false);
  const [milestoneId, setMilestoneId] = useState(starting?.id ?? "");
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [explanation, setExplanation] = useState("");
  const [deadline, setDeadline] = useState(revisedDeadlineDefault(starting?.deadline));
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const busy = useRef(false);

  if (!open) {
    return (
      <div>
        {sent ? (
          <p className="mb-3 rounded-2xl bg-good-soft px-4 py-3 text-sm text-good" role="status">
            Revision sent. It waits for the client’s approval and is not in the scope yet.
          </p>
        ) : null}
        <Button
          onClick={() => {
            setSent(false);
            setOpen(true);
          }}
        >
          Request a timeline revision
        </Button>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-line bg-card p-4 sm:rounded-3xl sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy.current) return;
        busy.current = true;
        const result = requestTimelineChange(project.id, {
          milestoneId,
          reason,
          reasonDetail,
          explanation,
          deadline,
          cost,
        });
        if (!result.ok) {
          busy.current = false;
          setError(result.error);
          return;
        }
        setReason("");
        setReasonDetail("");
        setExplanation("");
        setCost("");
        setError(null);
        setSent(true);
        setOpen(false);
        busy.current = false;
      }}
    >
      <h3 className="font-display text-xl tracking-tight sm:text-2xl">Request a timeline revision</h3>
      <p className="mt-1.5 text-sm leading-5 text-muted sm:mt-2 sm:leading-6">
        Ask to move one milestone. The client approves or rejects it. The original agreement stays locked.
      </p>
      <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
        <Field label="Affected milestone">
          <select
            className={inputClass}
            value={milestoneId}
            onChange={(event) => {
              const nextId = event.target.value;
              setMilestoneId(nextId);
              const milestone = project.milestones.find((item) => item.id === nextId);
              setDeadline(revisedDeadlineDefault(milestone?.deadline));
            }}
          >
            {project.milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason" hint="Choose a category. The explanation below is separate.">
          <select
            className={inputClass}
            value={reason}
            onChange={(event) => {
              const next = event.target.value;
              setReason(next);
              setError(null);
              if (next !== "Other") setReasonDetail("");
            }}
          >
            <option value="">Choose a reason</option>
            {TIMELINE_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        {reason === "Other" ? (
          <div className="sm:col-span-2">
            <Field label="What is the reason?">
              <input
                className={inputClass}
                value={reasonDetail}
                placeholder="Briefly describe the reason..."
                onChange={(event) => setReasonDetail(event.target.value)}
              />
            </Field>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Field label="Explanation" hint="How this affects the milestone. Do not restate the reason.">
            <textarea
              className={inputClass}
              rows={3}
              value={explanation}
              placeholder="What has to move, and what stays the same."
              onChange={(event) => setExplanation(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Revised deadline" hint="Later than this milestone’s current deadline.">
          <input
            className={inputClass}
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </Field>
        <Field label="Additional cost" hint="Leave blank if the revision has no charge.">
          <MoneyField value={cost} onChange={setCost} />
        </Field>
        {error ? (
          <p className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit">Send to client</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

function ChangeCard({ project, change }: { project: Project; change: ChangeRequest }) {
  const { role } = useMilestone();
  const finish =
    change.proposedDays !== undefined
      ? addDays(project.expectedCompletion, change.proposedDays)
      : null;

  return (
    <article id={`change-${change.id}`} className="scroll-mt-28 rounded-2xl border border-line bg-card p-4 sm:scroll-mt-36 sm:rounded-3xl sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl tracking-tight sm:text-2xl">{change.title}</h3>
          <p className="mt-0.5 text-xs text-muted sm:mt-1">Requested {formatDateTime(change.requestedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:justify-end sm:gap-2">
          <StatusBadge status={change.status} tone={partyTone(change)} label={partyTone(change) === "client" ? "Client" : "Freelancer"} />
          <StatusBadge
            status={change.status}
            tone={change.kind === "timeline" ? "timeline" : "scope"}
            label={change.kind === "timeline" ? "Timeline revision" : "Scope change"}
          />
          <StatusBadge status={change.status} label={labels[change.status]} />
        </div>
      </div>
      <p className="mt-3 max-w-3xl text-sm leading-5 text-ink/80 sm:mt-4 sm:leading-6">{change.description}</p>

      {hasClientTerms(change) && change.status !== "approved" ? (
        <div className="mt-3 rounded-2xl bg-archive px-3.5 py-3 sm:mt-5 sm:px-4 sm:py-4">
          <p className="text-[11px] font-medium tracking-[0.12em] text-ink/60 uppercase sm:tracking-[0.14em]">
            Client proposed
          </p>
          <p className="mt-1.5 font-display text-xl tracking-tight sm:mt-2 sm:text-2xl">
            {formatInr(change.requestedCost ?? 0)}
            <span className="ml-2 text-base text-muted">
              · {plural(change.requestedDays ?? 0, "extra day")}
            </span>
          </p>
          <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
            <PlainList title="Deliverables" items={change.requestedDeliverables ?? []} />
            <PlainList title="Acceptance criteria" items={change.requestedCriteria ?? []} />
          </div>
        </div>
      ) : null}

      {change.kind === "timeline" ? <TimelineSummary project={project} change={change} /> : null}

      {change.kind !== "timeline" && (change.status === "proposed" || change.status === "approved") ? (
        <div className="mt-3 rounded-2xl bg-accent-soft/70 px-3.5 py-3 sm:mt-5 sm:px-4 sm:py-4">
          <p className="text-[11px] font-medium tracking-[0.12em] text-accent uppercase sm:tracking-[0.14em]">
            {change.proposalNote === "Accepted as the client proposed."
              ? "Accepted as proposed"
              : hasClientTerms(change)
                ? "Counteroffer"
                : "Proposal"}
          </p>
          <p className="mt-1.5 font-display text-xl tracking-tight sm:mt-2 sm:text-2xl">
            {formatInr(change.proposedCost ?? 0)}
            <span className="ml-2 text-base text-muted">
              · {plural(change.proposedDays ?? 0, "extra day")}
            </span>
          </p>
          {finish && change.status === "proposed" ? (
            <p className="mt-1 text-sm text-muted">
              If approved, the finish date moves to {formatDate(finish)}.
            </p>
          ) : null}
          {change.proposalNote && change.proposalNote !== "Accepted as the client proposed." ? (
            <p className="mt-3 text-sm leading-6">{change.proposalNote}</p>
          ) : null}
          <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
            <PlainList title="Deliverables" items={change.proposedDeliverables ?? []} />
            <PlainList title="Acceptance criteria" items={change.proposedCriteria ?? []} />
          </div>
        </div>
      ) : null}

      {change.decisionNote ? (
        <p className="mt-4 text-sm text-muted">Note: {change.decisionNote}</p>
      ) : null}
      {change.milestoneId ? (
        <a className="mt-3 inline-block text-sm font-medium text-accent" href={`#milestone-${change.milestoneId}`}>
          View in current scope
        </a>
      ) : null}

      {change.status === "requested" && role === "freelancer" ? (
        <ProposalForm projectId={project.id} change={change} />
      ) : null}
      {change.status === "requested" && role === "client" ? (
        <p className="mt-4 text-sm text-muted">Pending freelancer response.</p>
      ) : null}
      {change.status === "proposed" && role === "client" ? (
        <DecisionForm project={project} change={change} />
      ) : null}
      {change.status === "proposed" && role === "freelancer" ? (
        <p className="mt-4 text-sm text-muted">Pending client approval.</p>
      ) : null}
    </article>
  );
}

function PlainList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{title}</p>
      <ul className="mt-2 space-y-1 text-sm leading-6">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function TimelineSummary({ project, change }: { project: Project; change: ChangeRequest }) {
  const milestone = project.milestones.find((item) => item.id === change.affectedMilestoneId);
  const wasDue = change.previousDeadline ?? milestone?.deadline;
  const wasAmount = change.previousAmount ?? milestone?.amount;

  return (
    <div className="mt-3 rounded-2xl bg-accent-soft/70 px-3.5 py-3 sm:mt-5 sm:px-4 sm:py-4">
      <p className="text-[11px] font-medium tracking-[0.12em] text-accent uppercase sm:tracking-[0.14em]">Requested revision</p>
      {change.reason ? (
        <p className="mt-2 text-sm">Reason: {formatReason(change.reason, change.reasonDetail)}</p>
      ) : null}
      <p className="mt-1.5 font-display text-xl leading-snug tracking-tight sm:mt-2 sm:text-2xl">
        Due {change.requestedDeadline ? formatDate(change.requestedDeadline) : "—"}
        <span className="ml-2 text-base text-muted">
          · {(change.proposedCost ?? 0) > 0 ? `${formatInr(change.proposedCost ?? 0)} extra` : "no extra cost"}
        </span>
      </p>
      {wasDue ? (
        <p className="mt-2 text-sm text-muted">
          Agreed before this request: due {formatDate(wasDue)}
          {wasAmount !== undefined ? ` · ${formatInr(wasAmount)}` : ""}.
        </p>
      ) : null}
    </div>
  );
}

function ProposalForm({ projectId, change }: { projectId: string; change: ChangeRequest }) {
  const { proposeChange, declineChange, acceptChange } = useMilestone();
  const changeId = change.id;
  const canAccept = hasClientTerms(change);
  const [cost, setCost] = useState("");
  const [days, setDays] = useState("0");
  const [note, setNote] = useState("");
  const [deliverables, setDeliverables] = useState([""]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState([""]);
  const [declineNote, setDeclineNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"accept" | "decline" | null>(null);
  const busy = useRef(false);

  function run(action: "accept" | "decline" | "counter") {
    if (busy.current) return;
    busy.current = true;
    const result =
      action === "accept"
        ? acceptChange(projectId, changeId)
        : action === "decline"
          ? declineChange(projectId, changeId, declineNote)
          : proposeChange(projectId, changeId, { cost, days, note, deliverables, acceptanceCriteria });
    if (!result.ok) {
      busy.current = false;
      setError(result.error);
      return;
    }
    setError(null);
    setConfirm(null);
  }

  return (
    <form
      className="mt-4 space-y-3 border-t border-line pt-4 sm:mt-5 sm:space-y-4 sm:pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        run("counter");
      }}
    >
      {canAccept ? (
        <div className="flex flex-wrap items-center gap-3">
          {confirm === "accept" ? (
            <div className="rounded-2xl border border-good/30 bg-good-soft px-4 py-3">
              <p className="text-sm font-medium text-ink">Add this to the current scope at the client’s price?</p>
              <p className="mt-1 text-sm text-ink/80">This happens now. It does not wait for another approval.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => run("accept")}>Confirm and add</Button>
                <Button variant="secondary" onClick={() => setConfirm(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setConfirm("accept")}>Accept as proposed</Button>
          )}
          <p className="text-sm text-muted">This adds the client’s price and time to the current scope.</p>
        </div>
      ) : (
        <p className="text-sm text-muted">
          This request has no price or timeline, so it needs a counteroffer or a decline.
        </p>
      )}
      <h4 className="font-medium">Counteroffer</h4>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <Field label="Additional cost" hint="Use 0 if there is no charge.">
          <MoneyField value={cost} onChange={setCost} />
        </Field>
        <Field label="Extra days" hint="Use 0 if the finish date stays put.">
          <input className={inputClass} inputMode="numeric" value={days} onChange={(event) => setDays(event.target.value)} />
        </Field>
        <Field label="Deliverables">
          <LineEditor
            items={deliverables}
            onChange={setDeliverables}
            placeholder="What this change adds"
            addLabel="Add deliverable"
          />
        </Field>
        <Field label="Acceptance criteria">
          <LineEditor
            items={acceptanceCriteria}
            onChange={setAcceptanceCriteria}
            placeholder="How this change is accepted"
            addLabel="Add criterion"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Note to the client">
            <textarea className={inputClass} rows={2} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
        </div>
      </div>
      {error ? (
        <p className="rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad" role="alert">
          {error}
        </p>
      ) : null}
      <Field label="Decline note" hint="Optional. Write this before you decline.">
        <input className={inputClass} value={declineNote} onChange={(event) => setDeclineNote(event.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Send counteroffer</Button>
        {confirm === "decline" ? null : (
          <Button variant="danger" onClick={() => setConfirm("decline")}>
            Decline request
          </Button>
        )}
      </div>
      {confirm === "decline" ? (
        <div className="rounded-2xl border border-bad/30 bg-bad-soft px-4 py-3">
          <p className="text-sm font-medium text-ink">Decline this request?</p>
          <p className="mt-1 text-sm text-ink/80">The current scope stays as it is.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="danger" onClick={() => run("decline")}>
              Confirm decline
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}

function DecisionForm({ project, change }: { project: Project; change: ChangeRequest }) {
  const { decideChange } = useMilestone();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"approved" | "rejected" | null>(null);
  const busy = useRef(false);
  const finish = addDays(project.expectedCompletion, change.proposedDays ?? 0);

  function run(decision: "approved" | "rejected") {
    if (busy.current) return;
    busy.current = true;
    const result = decideChange(project.id, change.id, decision, note);
    if (!result.ok) {
      busy.current = false;
      setError(result.error);
      return;
    }
    setError(null);
  }

  return (
    <div className="mt-4 border-t border-line pt-4 sm:mt-5 sm:pt-5">
      <p className="text-sm leading-6">
        {change.kind === "timeline"
          ? `Approving moves this milestone to ${change.requestedDeadline ? formatDate(change.requestedDeadline) : "the requested date"}${(change.proposedCost ?? 0) > 0 ? ` and adds ${formatInr(change.proposedCost ?? 0)}` : ""}. The original deadline and amount stay in the history.`
          : `Approving adds this milestone to the current scope${(change.proposedDays ?? 0) > 0 ? ` and moves the finish to ${formatDate(finish)}` : ""}. The original agreement stays unchanged.`}
      </p>
      <div className="mt-3">
        <Field label="Note" hint="Optional.">
          <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
      </div>
      {error ? (
        <p className="mt-3 rounded-xl bg-bad-soft px-3 py-2 text-sm text-bad" role="alert">
          {error}
        </p>
      ) : null}
      {confirm ? (
        <div
          className={
            confirm === "approved"
              ? "mt-4 rounded-2xl border border-good/30 bg-good-soft px-4 py-3"
              : "mt-4 rounded-2xl border border-bad/30 bg-bad-soft px-4 py-3"
          }
        >
          <p className="text-sm font-medium text-ink">
            {confirm === "approved" ? "Confirm this approval?" : "Confirm this rejection?"}
          </p>
          <p className="mt-1 text-sm text-ink/80">
            {confirm === "approved"
              ? "The current scope updates. The original agreement stays locked."
              : "The agreed scope stays as it is."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {confirm === "approved" ? (
              <Button onClick={() => run("approved")}>Confirm approval</Button>
            ) : (
              <Button variant="danger" onClick={() => run("rejected")}>
                Confirm rejection
              </Button>
            )}
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => setConfirm("approved")}>
            {change.kind === "timeline" ? "Approve revision" : "Approve and add to scope"}
          </Button>
          <Button variant="danger" onClick={() => setConfirm("rejected")}>
            {change.kind === "timeline"
              ? "Reject revision"
              : hasClientTerms(change)
                ? "Reject counteroffer"
                : "Reject proposal"}
          </Button>
        </div>
      )}
    </div>
  );
}
