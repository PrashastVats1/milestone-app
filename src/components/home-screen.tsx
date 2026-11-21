"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate, formatInr, plural } from "@/lib/format";
import {
  agreedAmount,
  attentionLabel,
  changeAmount,
  currentScopeAmount,
  needsAttention,
  pendingActions,
} from "@/lib/selectors";
import { useMilestone } from "@/lib/store";
import { inputClass, StatusBadge } from "./ui";

type ProjectFilter = "all" | "attention" | "draft" | "accepted";

const filters: Array<{ id: ProjectFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs you" },
  { id: "draft", label: "Drafts" },
  { id: "accepted", label: "Agreed" },
];

export function HomeScreen() {
  const { projects, role, hydrated } = useMilestone();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const ordered = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const actions = pendingActions(projects, role);
  const activeCount = projects.filter((project) => project.status === "accepted").length;
  const needle = query.trim().toLowerCase();
  const visible = ordered.filter((project) => {
    const matchesQuery =
      needle === "" ||
      project.name.toLowerCase().includes(needle) ||
      project.clientName.toLowerCase().includes(needle) ||
      project.clientEmail.toLowerCase().includes(needle);
    const matchesFilter =
      filter === "all" ||
      (filter === "attention" && needsAttention(project, role)) ||
      (filter === "draft" && project.status === "draft") ||
      (filter === "accepted" && project.status === "accepted");
    return matchesQuery && matchesFilter;
  });

  useEffect(() => {
    document.title = "Milestone";
  }, []);

  if (!hydrated) {
    return <p className="text-sm text-muted">Opening your agreements…</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.14em] text-accent uppercase sm:tracking-[0.16em]">
            Viewing as the {role}
          </p>
          <h1 className="mt-1.5 font-display text-3xl tracking-tight sm:mt-2 sm:text-5xl">
            Agreements in plain sight.
          </h1>
          <p className="mt-2 text-[15px] leading-6 text-muted sm:mt-4 sm:text-base sm:leading-7">
            {role === "freelancer"
              ? "Write what will be delivered, get it accepted, and keep every later change beside the original."
              : "Review the scope you agreed to, and approve any change before it becomes part of the work."}
          </p>
          <p className="mt-1.5 text-sm leading-5 text-ink/80 sm:mt-2 sm:leading-6">
            {role === "freelancer"
              ? "Next, you can accept a priced scope request, counter it, or send a timeline revision."
              : "Next, you can accept a draft agreement, or approve and reject proposals waiting on you."}
          </p>
          <p className="mt-2 text-sm text-muted sm:mt-3">
            {plural(activeCount, "active project")} · {plural(actions.length, "pending action")}
          </p>
        </div>
        {role === "freelancer" ? (
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white hover:bg-[#372fb8]"
          >
            <Plus className="size-4" aria-hidden />
            Create project
          </Link>
        ) : (
          <p className="max-w-xs text-sm leading-6 text-muted">
            Switch to Freelancer to create a project. Both roles use the same records on this device.
          </p>
        )}
      </div>

      <section className="mt-7 sm:mt-10">
        <h2 className="font-display text-xl tracking-tight sm:text-2xl">Pending actions</h2>
        <p className="mt-1 text-sm text-muted">What is waiting on you in this role.</p>
        {actions.length === 0 ? (
          <p className="mt-3 rounded-3xl border border-dashed border-line bg-card px-4 py-5 text-sm text-muted sm:mt-4 sm:px-5 sm:py-8">
            Nothing is waiting on you. Switch roles to see the other side of a request.
          </p>
        ) : (
          <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-3">
            {actions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-accent/20 bg-accent-soft px-4 py-3 transition hover:border-accent/50 sm:gap-3 sm:rounded-3xl sm:px-5 sm:py-4"
              >
                <div>
                  <p className="font-medium text-ink">{action.title}</p>
                  <p className="mt-1 text-sm text-ink/70">
                    {action.projectName} · {action.detail}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-ink">
                  Open
                  <ArrowRight className="size-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8 sm:mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl tracking-tight sm:text-2xl">All projects</h2>
            <p className="mt-1 text-sm text-muted">Most recently updated first. Each project keeps its own agreement.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            className={inputClass}
            value={query}
            placeholder="Search by project or client"
            aria-label="Search projects"
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                className={
                  filter === item.id
                    ? "rounded-full bg-ink px-3 py-1.5 text-sm text-white"
                    : "rounded-full border border-line bg-card px-3 py-1.5 text-sm text-ink"
                }
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

      <div className="mt-6 space-y-4">
        {projects.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-muted">
            No projects yet. Create one to write the first agreement.
          </p>
        ) : visible.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-card px-6 py-12 text-sm text-muted">
            No projects match that search or filter.
          </p>
        ) : (
          visible.map((project) => {
            const current = currentScopeAmount(project);
            const agreed = agreedAmount(project);
            const added = changeAmount(project);
            const attention = attentionLabel(project, role);
            const urgent = needsAttention(project, role);
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-2xl border border-line bg-card p-4 transition hover:border-accent/40 sm:rounded-3xl sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl tracking-tight sm:text-3xl">{project.name}</h2>
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
                    <p className="mt-0.5 font-display text-2xl tracking-tight sm:mt-1 sm:text-3xl">{formatInr(current)}</p>
                    {project.status === "accepted" && current !== agreed ? (
                      <p className="text-sm text-muted">Agreed {formatInr(agreed)}</p>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-5 text-ink/80 sm:mt-4 sm:line-clamp-none sm:leading-6">{project.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm sm:mt-5 sm:gap-3">
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
      </section>
    </div>
  );
}
