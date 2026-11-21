"use client";

import { useRef, useState } from "react";
import { addDays, formatDate, formatDateTime, formatInr, plural } from "@/lib/format";
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
    <section id="changes" className="scroll-mt-28">
      <SectionHeading
        eyebrow="Changes"
        title="Scope changes"
        text="Scope requests and timeline revisions stay out of the project until they are approved. The original agreement is left as it was accepted."
      />
      {role === "client" ? <RequestForm projectId={project.id} /> : <TimelineForm project={project} />}
      {changes.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-card px-5 py-8 text-sm text-muted">
          No change requests yet. The original agreement is the whole scope.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
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
  const busy = useRef(false);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Request a change</Button>;
  }

  return (
    <form
      className="rounded-3xl border border-line bg-card p-5 sm:p-6"
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
        setOpen(false);
        busy.current = false;
      }}
    >
      <h3 className="font-display text-2xl tracking-tight">Request additional work</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Name the cost and time you are proposing. The freelancer can accept that, counter it, or decline it.
      </p>
      <div className="mt-4 space-y-4">
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
        <div className="grid gap-4 sm:grid-cols-2">
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
        {error ? <p className="text-sm text-bad">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit">Send request</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}

function TimelineForm({ project }: { project: Project }) {
  const { requestTimelineChange } = useMilestone();
  const [open, setOpen] = useState(false);
  const [milestoneId, setMilestoneId] = useState(project.milestones[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [explanation, setExplanation] = useState("");
  const [deadline, setDeadline] = useState(
    project.milestones[0]?.deadline ?? project.expectedCompletion,
  );
  const [cost, setCost] = useState("");
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  if (!open) {
    return <Button onClick={() => setOpen(true)}>Request a timeline revision</Button>;
  }

  return (
    <form
      className="rounded-3xl border border-line bg-card p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (busy.current) return;
        busy.current = true;
        const result = requestTimelineChange(project.id, {
          milestoneId,
          reason,
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
        setExplanation("");
        setCost("");
        setError(null);
        setOpen(false);
        busy.current = false;
      }}
    >
      <h3 className="font-display text-2xl tracking-tight">Request a timeline revision</h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Ask to move one milestone. The client approves or rejects it. The original agreement stays locked.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Affected milestone">
          <select
            className={inputClass}
            value={milestoneId}
            onChange={(event) => {
              const nextId = event.target.value;
              setMilestoneId(nextId);
              const milestone = project.milestones.find((item) => item.id === nextId);
              if (milestone) setDeadline(milestone.deadline);
            }}
          >
            {project.milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reason">
          <select className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)}>
            <option value="">Choose a reason</option>
            {TIMELINE_REASONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Explanation">
            <textarea
              className={inputClass}
              rows={3}
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Revised deadline">
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
        {error ? <p className="text-sm text-bad sm:col-span-2">{error}</p> : null}
        <div className="flex gap-2 sm:col-span-2">
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
    <article id={`change-${change.id}`} className="scroll-mt-28 rounded-3xl border border-line bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl tracking-tight">{change.title}</h3>
          <p className="mt-1 text-xs text-muted">Requested {formatDateTime(change.requestedAt)}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <StatusBadge status={change.status} tone={partyTone(change)} label={partyTone(change) === "client" ? "Client" : "Freelancer"} />
          <StatusBadge
            status={change.status}
            tone={change.kind === "timeline" ? "timeline" : "scope"}
            label={change.kind === "timeline" ? "Timeline revision" : "Scope change"}
          />
          <StatusBadge status={change.status} label={labels[change.status]} />
        </div>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/80">{change.description}</p>

      {hasClientTerms(change) && change.status !== "approved" ? (
        <div className="mt-5 rounded-2xl bg-archive px-4 py-4">
          <p className="text-[11px] font-medium tracking-[0.14em] text-ink/60 uppercase">
            Client proposed
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
            {formatInr(change.requestedCost ?? 0)}
            <span className="ml-2 text-base text-muted">
              · {plural(change.requestedDays ?? 0, "extra day")}
            </span>
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PlainList title="Deliverables" items={change.requestedDeliverables ?? []} />
            <PlainList title="Acceptance criteria" items={change.requestedCriteria ?? []} />
          </div>
        </div>
      ) : null}

      {change.kind === "timeline" ? <TimelineSummary project={project} change={change} /> : null}

      {change.kind !== "timeline" && (change.status === "proposed" || change.status === "approved") ? (
        <div className="mt-5 rounded-2xl bg-accent-soft/70 px-4 py-4">
          <p className="text-[11px] font-medium tracking-[0.14em] text-accent uppercase">
            {change.proposalNote === "Accepted as the client proposed."
              ? "Accepted as proposed"
              : hasClientTerms(change)
                ? "Counteroffer"
                : "Proposal"}
          </p>
          <p className="mt-2 font-display text-2xl tracking-tight">
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
    <div className="mt-5 rounded-2xl bg-accent-soft/70 px-4 py-4">
      <p className="text-[11px] font-medium tracking-[0.14em] text-accent uppercase">Requested revision</p>
      {change.reason ? <p className="mt-2 text-sm">Reason: {change.reason}</p> : null}
      <p className="mt-2 font-display text-2xl tracking-tight">
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
      className="mt-5 space-y-4 border-t border-line pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        run("counter");
      }}
    >
      {canAccept ? (
        <div className="flex flex-wrap items-center gap-3">
          {confirm === "accept" ? (
            <>
              <p className="text-sm text-ink">Add this to the current scope at the client’s price?</p>
              <Button onClick={() => run("accept")}>Confirm and add</Button>
              <Button variant="ghost" onClick={() => setConfirm(null)}>
                Cancel
              </Button>
            </>
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Send counteroffer</Button>
        {confirm === "decline" ? (
          <>
            <Button variant="danger" onClick={() => run("decline")}>
              Confirm decline
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="danger" onClick={() => setConfirm("decline")}>
            Decline request
          </Button>
        )}
      </div>
      <Field label="Decline note" hint="Optional. Used only if you decline.">
        <input className={inputClass} value={declineNote} onChange={(event) => setDeclineNote(event.target.value)} />
      </Field>
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
    <div className="mt-5 border-t border-line pt-5">
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
      {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
      {confirm ? (
        <p className="mt-3 text-sm text-ink">
          {confirm === "approved"
            ? "Confirm this approval? The current scope updates. The original agreement stays locked."
            : "Confirm this rejection? The agreed scope stays as it is."}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {confirm === "approved" ? (
          <Button onClick={() => run("approved")}>Confirm approval</Button>
        ) : (
          <Button onClick={() => setConfirm("approved")}>
            {change.kind === "timeline" ? "Approve revision" : "Approve and add to scope"}
          </Button>
        )}
        {confirm === "rejected" ? (
          <Button variant="danger" onClick={() => run("rejected")}>
            Confirm rejection
          </Button>
        ) : (
          <Button variant="danger" onClick={() => setConfirm("rejected")}>
            {change.kind === "timeline"
              ? "Reject revision"
              : hasClientTerms(change)
                ? "Reject counteroffer"
                : "Reject proposal"}
          </Button>
        )}
        {confirm ? (
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
