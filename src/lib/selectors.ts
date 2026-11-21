import type { Project, Role } from "./types";

export function currentScopeAmount(project: Project) {
  return project.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
}

export function agreedAmount(project: Project) {
  return project.originalAgreement?.totalAmount ?? project.totalAmount;
}

export function changeAmount(project: Project) {
  return project.milestones
    .filter((milestone) => milestone.source === "change")
    .reduce((sum, milestone) => sum + milestone.amount, 0);
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
    return requested === 1 ? "1 change to price" : `${requested} changes to price`;
  }
  if (role === "client" && proposed > 0) {
    return proposed === 1 ? "1 proposal to decide" : `${proposed} proposals to decide`;
  }
  if (role === "client" && requested > 0) return "Waiting on a proposal";
  if (role === "freelancer" && proposed > 0) return "Waiting on the client";
  return "Up to date";
}

export function needsAttention(project: Project, role: Role) {
  const label = attentionLabel(project, role);
  return label !== "Up to date" && label !== "Draft, not accepted yet" && label !== "Waiting on a proposal" && label !== "Waiting on the client";
}
