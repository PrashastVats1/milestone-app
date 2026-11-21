"use client";

import { useState } from "react";
import { addDays, formatDate, formatDateTime, formatInr, plural } from "@/lib/format";
import { useMilestone } from "@/lib/store";
import type { ChangeRequest, ChangeStatus, Project } from "@/lib/types";
import { Button, Field, LineEditor, MoneyField, SectionHeading, StatusBadge, inputClass } from "./ui";

const labels: Record<ChangeStatus, string> = {
  requested: "Needs a proposal",
  proposed: "Awaiting client",
  approved: "Approved",
  rejected: "Rejected",
  declined: "Declined",
};

const rank: Record<ChangeStatus, number> = {
  proposed: 0,
  requested: 1,
  approved: 2,
  rejected: 3,
  declined: 4,
};

export function ChangeSection({ project }: { project: Project }) {
  const { role } = useMilestone();
  const changes = [...project.changeRequests].sort((a, b) => {
    const byStatus = rank[a.status] - rank[b.status];
    if (byStatus !== 0) return byStatus;
    return b.requestedAt.localeCompare(a.requestedAt);
  });

  return (
    <section id="changes" className="scroll-mt-28">
      <SectionHeading
        eyebrow="Changes"
        title="Scope changes"
        text="A request stays out of the project until the client approves a proposal. The original agreement is left as it was accepted."
      />
      {role === "client" ? <RequestForm projectId={project.id} /> : null}
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
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Request a change</Button>
    );
  }

  return (
    <form
      className="rounded-3xl border border-line bg-card p-5 sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const result = requestChange(projectId, title, description);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setTitle("");
        setDescription("");
        setError(null);
        setOpen(false);
      }}
    >
      <h3 className="font-display text-2xl tracking-tight">Request additional work</h3>
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

function ChangeCard({ project, change }: { project: Project; change: ChangeRequest }) {
  const { role } = useMilestone();
  const finish =
    change.proposedDays !== undefined
      ? addDays(project.expectedCompletion, change.proposedDays)
      : null;

  return (
    <article className="rounded-3xl border border-line bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl tracking-tight">{change.title}</h3>
          <p className="mt-1 text-xs text-muted">Requested {formatDateTime(change.requestedAt)}</p>
        </div>
        <StatusBadge status={change.status} label={labels[change.status]} />
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/80">{change.description}</p>

      {change.status === "proposed" || change.status === "approved" ? (
        <div className="mt-5 rounded-2xl bg-accent-soft/70 px-4 py-4">
          <p className="text-[11px] font-medium tracking-[0.14em] text-accent uppercase">Proposal</p>
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
          {change.proposalNote ? <p className="mt-3 text-sm leading-6">{change.proposalNote}</p> : null}
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
        <ProposalForm projectId={project.id} changeId={change.id} />
      ) : null}
      {change.status === "requested" && role === "client" ? (
        <p className="mt-4 text-sm text-muted">Waiting for the freelancer to price this change.</p>
      ) : null}
      {change.status === "proposed" && role === "client" ? (
        <DecisionForm project={project} change={change} />
      ) : null}
      {change.status === "proposed" && role === "freelancer" ? (
        <p className="mt-4 text-sm text-muted">Waiting for the client to approve or reject this proposal.</p>
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

function ProposalForm({ projectId, changeId }: { projectId: string; changeId: string }) {
  const { proposeChange, declineChange } = useMilestone();
  const [cost, setCost] = useState("");
  const [days, setDays] = useState("0");
  const [note, setNote] = useState("");
  const [deliverables, setDeliverables] = useState([""]);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState([""]);
  const [declineNote, setDeclineNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-5 space-y-4 border-t border-line pt-5"
      onSubmit={(event) => {
        event.preventDefault();
        const result = proposeChange(projectId, changeId, {
          cost,
          days,
          note,
          deliverables,
          acceptanceCriteria,
        });
        setError(result.ok ? null : result.error);
      }}
    >
      <h4 className="font-medium">Propose the cost and time</h4>
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
        <Button type="submit">Send proposal</Button>
        <Button
          variant="danger"
          onClick={() => {
            const result = declineChange(projectId, changeId, declineNote);
            setError(result.ok ? null : result.error);
          }}
        >
          Decline request
        </Button>
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
  const finish = addDays(project.expectedCompletion, change.proposedDays ?? 0);

  return (
    <div className="mt-5 border-t border-line pt-5">
      <p className="text-sm leading-6">
        Approving adds this milestone to the current scope
        {(change.proposedDays ?? 0) > 0 ? ` and moves the finish to ${formatDate(finish)}` : ""}. The
        original agreement stays unchanged.
      </p>
      <div className="mt-3">
        <Field label="Note" hint="Optional.">
          <input className={inputClass} value={note} onChange={(event) => setNote(event.target.value)} />
        </Field>
      </div>
      {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const result = decideChange(project.id, change.id, "approved", note);
            setError(result.ok ? null : result.error);
          }}
        >
          Approve and add to scope
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            const result = decideChange(project.id, change.id, "rejected", note);
            setError(result.ok ? null : result.error);
          }}
        >
          Reject proposal
        </Button>
      </div>
    </div>
  );
}
