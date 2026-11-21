import { addDays, formatDate, formatInr, plural } from "./format";
import type {
  Activity,
  AgreementSnapshot,
  ChangeRequest,
  Milestone,
  NormalizedClientRequest,
  NormalizedProject,
  NormalizedProposal,
  NormalizedTimelineRequest,
  Project,
} from "./types";

function entry(actor: Activity["actor"], message: string): Activity {
  const at = new Date().toISOString();
  return { id: crypto.randomUUID(), at, actor, message };
}

export function buildProject(input: NormalizedProject, id: string): Project {
  const activity = entry("freelancer", `Created “${input.name}” for ${input.clientName}.`);
  return {
    id,
    ...input,
    status: "draft",
    originalAgreement: null,
    changeRequests: [],
    activity: [activity],
    createdAt: activity.at,
    updatedAt: activity.at,
  };
}

export function updateDraft(project: Project, input: NormalizedProject): Project {
  if (project.status !== "draft") {
    throw new Error("The accepted agreement can only change through a change request.");
  }

  const unchanged =
    project.name === input.name &&
    project.description === input.description &&
    project.clientName === input.clientName &&
    project.clientEmail === input.clientEmail &&
    project.totalAmount === input.totalAmount &&
    project.startDate === input.startDate &&
    project.expectedCompletion === input.expectedCompletion &&
    JSON.stringify(project.milestones) === JSON.stringify(input.milestones);

  if (unchanged) return project;

  const activity = entry("freelancer", "Updated the draft agreement.");
  return {
    ...project,
    ...input,
    updatedAt: activity.at,
    activity: [...project.activity, activity],
  };
}

export function acceptAgreement(project: Project): Project {
  if (project.status === "accepted") {
    throw new Error("This agreement is already accepted.");
  }
  if (project.milestones.length === 0) {
    throw new Error("Add a milestone before accepting.");
  }

  const activity = entry(
    "client",
    `${project.clientName} accepted the agreement. The original scope is locked.`,
  );
  const originalAgreement: AgreementSnapshot = {
    acceptedAt: activity.at,
    projectName: project.name,
    description: project.description,
    clientName: project.clientName,
    clientEmail: project.clientEmail,
    totalAmount: project.totalAmount,
    startDate: project.startDate,
    expectedCompletion: project.expectedCompletion,
    milestones: project.milestones.map((milestone) => ({
      ...milestone,
      deliverables: [...milestone.deliverables],
      acceptanceCriteria: [...milestone.acceptanceCriteria],
      source: "original",
    })),
  };

  return {
    ...project,
    status: "accepted",
    originalAgreement,
    updatedAt: activity.at,
    activity: [...project.activity, activity],
  };
}

export function requestChange(project: Project, input: NormalizedClientRequest): Project {
  if (project.status !== "accepted") {
    throw new Error("Accept the agreement before requesting a change.");
  }

  const activity = entry(
    "client",
    `Requested a scope change: “${input.title}” at ${formatInr(input.proposal.cost)} and ${plural(input.proposal.days, "extra day")}.`,
  );
  const change: ChangeRequest = {
    id: crypto.randomUUID(),
    kind: "scope",
    title: input.title,
    description: input.description,
    requestedAt: activity.at,
    status: "requested",
    requestedCost: input.proposal.cost,
    requestedDays: input.proposal.days,
    requestedDeliverables: input.proposal.deliverables,
    requestedCriteria: input.proposal.acceptanceCriteria,
  };

  return {
    ...project,
    updatedAt: activity.at,
    changeRequests: [...project.changeRequests, change],
    activity: [...project.activity, activity],
  };
}

export function requestTimelineChange(project: Project, input: NormalizedTimelineRequest): Project {
  if (project.status !== "accepted") {
    throw new Error("Accept the agreement before requesting a change.");
  }
  const milestone = project.milestones.find((item) => item.id === input.milestoneId);
  if (!milestone) throw new Error("That milestone is not on this project.");

  const costNote = input.cost > 0 ? ` and ${formatInr(input.cost)} extra` : "";
  const activity = entry(
    "freelancer",
    `Requested a timeline revision for “${milestone.title}”: due ${formatDate(input.deadline)}${costNote}. Reason: ${input.reason}.`,
  );
  const change: ChangeRequest = {
    id: crypto.randomUUID(),
    kind: "timeline",
    title: milestone.title,
    description: input.explanation,
    reason: input.reason,
    requestedAt: activity.at,
    status: "proposed",
    affectedMilestoneId: milestone.id,
    requestedDeadline: input.deadline,
    proposedCost: input.cost,
    proposedAt: activity.at,
    previousDeadline: milestone.deadline,
    previousAmount: milestone.amount,
  };

  return {
    ...project,
    updatedAt: activity.at,
    changeRequests: [...project.changeRequests, change],
    activity: [...project.activity, activity],
  };
}

export function proposeChange(
  project: Project,
  changeId: string,
  proposal: NormalizedProposal,
): Project {
  const change = project.changeRequests.find((item) => item.id === changeId);
  if (!change) throw new Error("That change request was not found.");
  if (change.status !== "requested") {
    throw new Error("This request already has a proposal or a decision.");
  }

  const activity = entry(
    "freelancer",
    `Countered “${change.title}” at ${formatInr(proposal.cost)} and ${plural(proposal.days, "extra day")}.`,
  );
  const next: ChangeRequest = {
    ...change,
    status: "proposed",
    proposedCost: proposal.cost,
    proposedDays: proposal.days,
    proposalNote: proposal.note,
    proposedDeliverables: proposal.deliverables,
    proposedCriteria: proposal.acceptanceCriteria,
    proposedAt: activity.at,
  };

  return {
    ...project,
    updatedAt: activity.at,
    changeRequests: project.changeRequests.map((item) => (item.id === changeId ? next : item)),
    activity: [...project.activity, activity],
  };
}

export function declineChange(project: Project, changeId: string, note: string): Project {
  const change = project.changeRequests.find((item) => item.id === changeId);
  if (!change || change.status !== "requested") {
    throw new Error("This request can no longer be declined.");
  }

  const activity = entry(
    "freelancer",
    `Declined the change “${change.title}”. The scope is unchanged.`,
  );
  const next: ChangeRequest = {
    ...change,
    status: "declined",
    decidedAt: activity.at,
    decisionNote: note.trim(),
  };

  return {
    ...project,
    updatedAt: activity.at,
    changeRequests: project.changeRequests.map((item) => (item.id === changeId ? next : item)),
    activity: [...project.activity, activity],
  };
}

export function acceptChangeAsProposed(project: Project, changeId: string): Project {
  const change = project.changeRequests.find((item) => item.id === changeId);
  if (!change || change.status !== "requested" || change.kind === "timeline") {
    throw new Error("This request can no longer be accepted as proposed.");
  }
  if (
    change.requestedCost === undefined ||
    change.requestedDays === undefined ||
    (change.requestedDeliverables ?? []).length === 0 ||
    (change.requestedCriteria ?? []).length === 0
  ) {
    throw new Error("This request has no price or timeline. Send a counteroffer instead.");
  }

  const message = `Accepted “${change.title}” as proposed. Added ${formatInr(change.requestedCost)} and ${plural(change.requestedDays, "extra day")} to the current scope.`;
  return approveScopeChange(project, change, {
    cost: change.requestedCost,
    days: change.requestedDays,
    note: "Accepted as the client proposed.",
    deliverables: change.requestedDeliverables ?? [],
    acceptanceCriteria: change.requestedCriteria ?? [],
    actor: "freelancer",
    message,
    decisionNote: "",
  });
}

export function decideChange(
  project: Project,
  changeId: string,
  decision: "approved" | "rejected",
  note: string,
): Project {
  const change = project.changeRequests.find((item) => item.id === changeId);
  if (!change || change.status !== "proposed") {
    throw new Error("There is no proposal waiting for a decision.");
  }

  if (change.kind === "timeline") {
    return decideTimelineChange(project, change, decision, note);
  }

  if (decision === "rejected") {
    return rejectChange(
      project,
      change,
      `Rejected the counteroffer for “${change.title}”. The scope is unchanged.`,
      note,
    );
  }

  const days = change.proposedDays ?? 0;
  const cost = change.proposedCost ?? 0;
  return approveScopeChange(project, change, {
    cost,
    days,
    note: change.proposalNote ?? "",
    deliverables: change.proposedDeliverables ?? [],
    acceptanceCriteria: change.proposedCriteria ?? [],
    actor: "client",
    message: `Approved “${change.title}”. Added ${formatInr(cost)} and ${plural(days, "extra day")} to the current scope.`,
    decisionNote: note.trim(),
  });
}

function rejectChange(project: Project, change: ChangeRequest, message: string, note: string): Project {
  const activity = entry("client", message);
  const next: ChangeRequest = {
    ...change,
    status: "rejected",
    decidedAt: activity.at,
    decisionNote: note.trim(),
  };
  return {
    ...project,
    updatedAt: activity.at,
    changeRequests: project.changeRequests.map((item) => (item.id === change.id ? next : item)),
    activity: [...project.activity, activity],
  };
}

function approveScopeChange(
  project: Project,
  change: ChangeRequest,
  input: NormalizedProposal & {
    actor: Activity["actor"];
    message: string;
    decisionNote: string;
  },
): Project {
  const deadline = addDays(project.expectedCompletion, input.days);
  const milestoneId = crypto.randomUUID();
  const milestone: Milestone = {
    id: milestoneId,
    title: change.title,
    description: change.description,
    deliverables: [...input.deliverables],
    acceptanceCriteria: [...input.acceptanceCriteria],
    amount: input.cost,
    deadline,
    source: "change",
    changeRequestId: change.id,
  };
  const activity = entry(input.actor, input.message);
  const next: ChangeRequest = {
    ...change,
    status: "approved",
    proposedCost: input.cost,
    proposedDays: input.days,
    proposalNote: input.note,
    proposedDeliverables: [...input.deliverables],
    proposedCriteria: [...input.acceptanceCriteria],
    proposedAt: change.proposedAt ?? activity.at,
    decidedAt: activity.at,
    decisionNote: input.decisionNote,
    milestoneId,
  };

  return {
    ...project,
    expectedCompletion: input.days > 0 ? deadline : project.expectedCompletion,
    milestones: [...project.milestones, milestone],
    changeRequests: project.changeRequests.map((item) => (item.id === change.id ? next : item)),
    updatedAt: activity.at,
    activity: [...project.activity, activity],
  };
}

function decideTimelineChange(
  project: Project,
  change: ChangeRequest,
  decision: "approved" | "rejected",
  note: string,
): Project {
  const milestone = project.milestones.find((item) => item.id === change.affectedMilestoneId);
  if (!milestone) throw new Error("The milestone for this revision is no longer on the project.");

  if (decision === "rejected") {
    return rejectChange(
      project,
      change,
      `Rejected the timeline revision for “${milestone.title}”. The agreed milestone is unchanged.`,
      note,
    );
  }

  if (!change.requestedDeadline) throw new Error("This revision has no deadline.");

  const extra = change.proposedCost ?? 0;
  const previousDeadline = change.previousDeadline ?? milestone.deadline;
  const previousAmount = change.previousAmount ?? milestone.amount;
  const activity = entry(
    "client",
    `Approved the timeline revision for “${milestone.title}”. Deadline moves from ${formatDate(previousDeadline)} to ${formatDate(change.requestedDeadline)}${extra > 0 ? `, and ${formatInr(extra)} is added` : ""}.`,
  );
  const nextMilestone: Milestone = {
    ...milestone,
    deadline: change.requestedDeadline,
    amount: milestone.amount + extra,
    agreedDeadline: milestone.agreedDeadline ?? milestone.deadline,
    agreedAmount: milestone.agreedAmount ?? milestone.amount,
  };
  const next: ChangeRequest = {
    ...change,
    status: "approved",
    decidedAt: activity.at,
    decisionNote: note.trim(),
    previousDeadline,
    previousAmount,
    milestoneId: milestone.id,
  };

  return {
    ...project,
    expectedCompletion:
      change.requestedDeadline > project.expectedCompletion
        ? change.requestedDeadline
        : project.expectedCompletion,
    milestones: project.milestones.map((item) => (item.id === milestone.id ? nextMilestone : item)),
    changeRequests: project.changeRequests.map((item) => (item.id === change.id ? next : item)),
    updatedAt: activity.at,
    activity: [...project.activity, activity],
    originalAgreement: project.originalAgreement,
  };
}
