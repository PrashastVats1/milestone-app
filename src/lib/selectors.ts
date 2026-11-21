import type { ChangeRequest, Project, Role } from "./types";

export interface PendingAction {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  detail: string;
  href: string;
}

export function currentScopeAmount(project: Project) {
  return project.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
}

export function agreedAmount(project: Project) {
  return project.originalAgreement?.totalAmount ?? project.totalAmount;
}

export function changeAmount(project: Project) {
  return project.milestones.reduce((sum, milestone) => {
    if (milestone.source === "change") return sum + milestone.amount;
    if (milestone.agreedAmount === undefined) return sum;
    return sum + (milestone.amount - milestone.agreedAmount);
  }, 0);
}

export function pendingProposalAmount(project: Project) {
  return project.changeRequests
    .filter((change) => change.status === "proposed")
    .reduce((sum, change) => sum + (change.proposedCost ?? 0), 0);
}

export function attentionLabel(project: Project, role: Role) {
  if (project.status === "draft") {
    return role === "client" ? "Needs your acceptance" : "Draft, not accepted yet";
  }

  const requested = project.changeRequests.filter((change) => change.status === "requested").length;
  const proposed = project.changeRequests.filter((change) => change.status === "proposed").length;

  if (role === "freelancer" && requested > 0) {
    return requested === 1 ? "1 change to respond" : `${requested} changes to respond`;
  }
  if (role === "client" && proposed > 0) {
    return proposed === 1 ? "1 change to approve" : `${proposed} changes to approve`;
  }
  if (role === "client" && requested > 0) return "Waiting on the freelancer";
  if (role === "freelancer" && proposed > 0) return "Waiting on the client";
  return "Up to date";
}

export function pendingActions(projects: Project[], role: Role): PendingAction[] {
  const items: PendingAction[] = [];
  const ordered = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  for (const project of ordered) {
    if (role === "client" && project.status === "draft") {
      items.push({
        id: `${project.id}-acceptance`,
        projectId: project.id,
        projectName: project.name,
        title: "Accept the agreement",
        detail: "Pending agreement acceptance",
        href: `/projects/${project.id}`,
      });
    }

    if (project.status !== "accepted") continue;

    const changes = [...project.changeRequests].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    for (const change of changes) {
      if (role === "freelancer" && change.status === "requested") {
        items.push({
          id: change.id,
          projectId: project.id,
          projectName: project.name,
          title: change.title,
          detail: "Client requested scope change · Pending freelancer response",
          href: `/projects/${project.id}#change-${change.id}`,
        });
      }
      if (role === "client" && change.status === "proposed") {
        items.push({
          id: change.id,
          projectId: project.id,
          projectName: project.name,
          title: change.title,
          detail:
            change.kind === "timeline"
              ? "Freelancer requested timeline revision · Pending client approval"
              : "Pending client approval",
          href: `/projects/${project.id}#change-${change.id}`,
        });
      }
    }
  }

  return items;
}

export function orderedChanges(changes: ChangeRequest[], role: Role) {
  function rank(change: ChangeRequest) {
    const actionable = role === "freelancer" ? change.status === "requested" : change.status === "proposed";
    const waiting = role === "freelancer" ? change.status === "proposed" : change.status === "requested";
    if (actionable) return 0;
    if (waiting) return 1;
    if (change.status === "approved") return 2;
    return 3;
  }

  return [...changes].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    return b.requestedAt.localeCompare(a.requestedAt);
  });
}

export function needsAttention(project: Project, role: Role) {
  const label = attentionLabel(project, role);
  return (
    label !== "Up to date" &&
    label !== "Draft, not accepted yet" &&
    label !== "Waiting on the freelancer" &&
    label !== "Waiting on the client"
  );
}
