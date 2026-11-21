"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useEffect } from "react";
import { formatDate, formatInr, plural } from "@/lib/format";
import {
  agreedAmount,
  attentionLabel,
  changeAmount,
  currentScopeAmount,
  needsAttention,
} from "@/lib/selectors";
import { useMilestone } from "@/lib/store";
import { StatusBadge } from "./ui";

export function HomeScreen() {
  const { projects, role, hydrated } = useMilestone();
  const ordered = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  useEffect(() => {
    document.title = "Milestone";
  }, []);

  if (!hydrated) {
    return <p className="text-sm text-muted">Opening your agreements…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.16em] text-accent uppercase">
            Viewing as the {role}
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">
            Agreements in plain sight.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted">
            {role === "freelancer"
              ? "Write what will be delivered, get it accepted, and keep every later change beside the original."
              : "Review the scope you agreed to, and approve any change before it becomes part of the work."}
          </p>
        </div>
        {role === "freelancer" ? (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-[#372fb8]"
          >
            <Plus className="size-4" aria-hidden />
            New project
          </Link>
        ) : (
          <p className="max-w-xs text-sm leading-6 text-muted">
            Switch to Freelancer to create a project. Both roles use the same records on this device.
          </p>
        )}
      </div>

      <div className="mt-10 space-y-4">
        {ordered.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-muted">
            No projects yet.
          </p>
        ) : (
          ordered.map((project) => {
            const current = currentScopeAmount(project);
            const agreed = agreedAmount(project);
            const added = changeAmount(project);
            const attention = attentionLabel(project, role);
            const urgent = needsAttention(project, role);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-3xl border border-line bg-card p-5 transition hover:border-accent/40 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl tracking-tight sm:text-3xl">{project.name}</h2>
                      <StatusBadge
                        status={project.status}
                        label={project.status === "draft" ? "Draft" : "Agreed"}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {project.clientName} · {project.clientEmail}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
                      Current scope
                    </p>
                    <p className="mt-1 font-display text-3xl tracking-tight">{formatInr(current)}</p>
                    {project.status === "accepted" && current !== agreed ? (
                      <p className="text-sm text-muted">Agreed {formatInr(agreed)}</p>
                    ) : null}
                  </div>
                </div>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-ink/80">{project.description}</p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <p className="text-muted">
                    {plural(project.milestones.length, "milestone")}
                    {added > 0 ? ` · ${formatInr(added)} added` : ""} · finishes{" "}
                    {formatDate(project.expectedCompletion)}
                  </p>
                  <span className={urgent ? "inline-flex items-center gap-1 font-medium text-accent" : "text-muted"}>
                    {attention}
                    <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
