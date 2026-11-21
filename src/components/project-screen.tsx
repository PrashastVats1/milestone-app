"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { use, useEffect, useRef, useState } from "react";
import { formatDate, formatInr } from "@/lib/format";
import {
  agreedAmount,
  changeAmount,
  currentScopeAmount,
  orderedChanges,
  pendingProposalAmount,
} from "@/lib/selectors";
import { useMilestone } from "@/lib/store";
import { projectToInput } from "@/lib/validate";
import { ChangeSection } from "./changes";
import { ProjectForm } from "./project-form";
import { MilestoneList, OriginalAgreement } from "./scope";
import { ActivityTimeline } from "./timeline";
import { actionLinkClass, Button, SectionHeading, Stat, StatusBadge } from "./ui";

export function ProjectScreen({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const store = useMilestone();
  const project = store.hydrated ? store.projects.find((item) => item.id === id) : undefined;

  useEffect(() => {
    if (!store.hydrated) return;
    document.title = project ? `${project.name} · Milestone` : "Project · Milestone";
  }, [project, store.hydrated]);

  const projectId = project?.id;
  useEffect(() => {
    if (!store.hydrated || !projectId) return;
    const target = window.location.hash.replace("#", "");
    if (!target) return;
    document.getElementById(target)?.scrollIntoView();
  }, [store.hydrated, projectId]);

  if (!store.hydrated) {
    return <p className="text-sm text-muted">Opening your agreements…</p>;
  }

  if (!project) {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">This project is not on this device.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          It may have been cleared with Reset demo data. Records are not shared across browsers.
        </p>
        <Link href="/" className="mt-6 inline-flex text-sm font-medium text-accent">
          Back to projects
        </Link>
      </div>
    );
  }

  if (project.status === "draft") {
    return (
      <div>
        <BackLink />
        <div className={store.role === "freelancer" ? "mt-6" : "hidden"}>
          <DraftEditor projectId={project.id} />
        </div>
        <div className={store.role === "client" ? "mt-6" : "hidden"}>
          <ClientReview projectId={project.id} />
        </div>
        <div className="mt-12">
          <ActivityTimeline activity={project.activity} />
        </div>
      </div>
    );
  }

  const agreed = agreedAmount(project);
  const current = currentScopeAmount(project);
  const added = changeAmount(project);
  const pending = pendingProposalAmount(project);
  const originalFinish = project.originalAgreement?.expectedCompletion;
  const requested = project.changeRequests.filter((change) => change.status === "requested").length;
  const proposed = project.changeRequests.filter((change) => change.status === "proposed").length;
  const freelancerAction = store.role === "freelancer" && requested > 0;
  const clientAction = store.role === "client" && proposed > 0;
  const nextChange = orderedChanges(project.changeRequests, store.role).find((change) =>
    store.role === "freelancer" ? change.status === "requested" : change.status === "proposed",
  );

  return (
    <div className="space-y-7 sm:space-y-10">
      <div>
        <BackLink />
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
          <h1 className="font-display text-3xl tracking-tight sm:text-5xl">{project.name}</h1>
          <StatusBadge status="accepted" label="Agreed" />
        </div>
        <p className="mt-2 text-sm text-muted sm:mt-3">
          {project.clientName} · {project.clientEmail}
        </p>
        <p className="mt-2 max-w-3xl text-[15px] leading-6 text-ink/80 sm:mt-4 sm:text-base sm:leading-7">{project.description}</p>
        <nav aria-label="On this page" className="mt-3 flex flex-wrap gap-2 sm:mt-5">
          {[
            ["#current-scope", "Current scope"],
            ["#changes", "Changes"],
            ["#original-agreement", "Original agreement"],
            ["#activity", "Activity"],
          ].map(([href, label]) => (
            <a key={href} href={href} className={actionLinkClass}>
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
        <Stat
          label="Originally agreed"
          value={formatInr(agreed)}
          hint="Locked at acceptance"
          href="#original-agreement"
          hrefLabel="View original agreement"
        />
        <Stat
          label="Current scope"
          value={formatInr(current)}
          hint={pending > 0 ? `${formatInr(pending)} proposed, not in scope yet` : "Includes approved changes"}
        />
        <Stat label="From changes" value={formatInr(added)} hint="Added after acceptance" />
        <Stat
          label="Expected finish"
          value={formatDate(project.expectedCompletion)}
          hint={
            originalFinish && originalFinish !== project.expectedCompletion
              ? `Agreed ${formatDate(originalFinish)}`
              : "As originally agreed"
          }
        />
      </div>

      {freelancerAction ? (
        <ActionBanner
          title={requested === 1 ? "A change needs your response" : `${requested} changes need your response`}
          body="Accepting a priced request adds it to the current scope immediately. A counteroffer still needs the client’s approval. Declining leaves the scope unchanged."
          href={nextChange ? `#change-${nextChange.id}` : "#changes"}
        />
      ) : null}
      {clientAction ? (
        <ActionBanner
          title={proposed === 1 ? "A change needs your approval" : `${proposed} changes need your approval`}
          body="Approving updates the current scope. The original agreement stays as accepted."
          href={nextChange ? `#change-${nextChange.id}` : "#changes"}
        />
      ) : null}
      {!freelancerAction && !clientAction ? (
        <p className="text-sm text-muted">Nothing is waiting on you. The original agreement and the change history are below.</p>
      ) : null}

      <section id="current-scope" className="scroll-mt-36">
        <SectionHeading
          eyebrow="Now"
          title="Current scope"
          text="Original milestones are the locked agreement. Added by change means the work was approved later and did not rewrite that agreement."
        />
        <a href="#original-agreement" className={`${actionLinkClass} mb-3 sm:mb-4`}>
          View the locked original agreement
        </a>
        <MilestoneList milestones={project.milestones} showSource />
      </section>

      <ChangeSection project={project} />
      <OriginalAgreement project={project} />
      <ActivityTimeline activity={project.activity} />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
      <ArrowLeft className="size-4" aria-hidden />
      Projects
    </Link>
  );
}

function ActionBanner({ title, body, href }: { title: string; body: string; href: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/15 bg-accent-soft px-4 py-3 sm:gap-4 sm:rounded-3xl sm:px-5 sm:py-4">
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-1 max-w-2xl text-sm leading-5 text-ink/70 sm:leading-6">{body}</p>
      </div>
      <a href={href} className={actionLinkClass}>
        Go to changes
      </a>
    </div>
  );
}

function DraftEditor({ projectId }: { projectId: string }) {
  const { projects, updateDraft } = useMilestone();
  const project = projects.find((item) => item.id === projectId);
  const [saved, setSaved] = useState(false);
  if (!project) return null;

  return (
    <ProjectForm
      key={project.id}
      initial={projectToInput(project)}
      allowRepeat
      submitLabel="Save draft"
      savedNote={saved ? "Draft saved. Switch to Client when you want to accept it." : null}
      intro="Edit anything until the client accepts. After acceptance, the original is locked and further work goes through a change request."
      onSubmit={(input) => {
        const result = updateDraft(project.id, input);
        setSaved(result.ok);
        return result;
      }}
    />
  );
}

function ClientReview({ projectId }: { projectId: string }) {
  const { projects, acceptAgreement } = useMilestone();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;
  const milestoneSum = currentScopeAmount(project);

  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.16em] text-accent uppercase">For your acceptance</p>
      <h1 className="mt-1.5 font-display text-3xl tracking-tight sm:mt-2 sm:text-5xl">{project.name}</h1>
      <p className="mt-2 max-w-3xl text-[15px] leading-6 sm:mt-4 sm:text-base sm:leading-7">{project.description}</p>
      <dl className="mt-6 grid gap-4 rounded-3xl border border-line bg-card p-5 sm:grid-cols-2 sm:p-6">
        <ReviewFact label="Client" value={`${project.clientName} · ${project.clientEmail}`} />
        <ReviewFact label="Contract total" value={formatInr(project.totalAmount)} />
        <ReviewFact label="Milestone total" value={formatInr(milestoneSum)} />
        <ReviewFact
          label="Dates"
          value={`${formatDate(project.startDate)} – ${formatDate(project.expectedCompletion)}`}
        />
      </dl>
      <div className="mt-6">
        <MilestoneList milestones={project.milestones} />
      </div>
      <div className="sticky bottom-4 z-20 mt-8">
        <div className="rounded-3xl bg-ink px-5 py-4 text-white shadow-[0_20px_50px_-24px_rgba(14,26,43,0.8)] sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-medium">
              {confirming ? "Lock this version as the original?" : "Accept this agreement?"}
            </p>
            <p className="mt-1 text-sm text-white/70">
              Later work is recorded as a change. This version stays as accepted.
            </p>
            {error ? <p className="mt-2 text-sm text-rose-200">{error}</p> : null}
          </div>
          <div className="mt-4 flex gap-2 sm:mt-0">
            {confirming ? (
              <>
                <Button
                  variant="light"
                  onClick={() => {
                    if (busy.current) return;
                    busy.current = true;
                    const result = acceptAgreement(project.id);
                    if (!result.ok) {
                      busy.current = false;
                      setError(result.error);
                    }
                  }}
                >
                  Lock and accept
                </Button>
                <button type="button" className="px-3 text-sm text-white/80" onClick={() => setConfirming(false)}>
                  Not yet
                </button>
              </>
            ) : (
              <Button variant="light" onClick={() => setConfirming(true)}>
                Accept agreement
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
