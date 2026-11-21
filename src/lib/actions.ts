import { addDays, formatInr, plural } from "./format";
import type {
  Activity,
  AgreementSnapshot,
  ChangeRequest,
  Milestone,
  NormalizedProject,
  NormalizedProposal,
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

export function requestChange(project: Project, title: string, description: string): Project {
  if (project.status !== "accepted") {
    throw new Error("Accept the agreement before requesting a change.");
  }
  const cleanTitle = title.trim();
  const cleanDescription = description.trim();
  if (!cleanTitle || !cleanDescription) {
    throw new Error("Describe the change you want.");
  }

  const activity = entry("client", `Requested a change: “${cleanTitle}”.`);
  const change: ChangeRequest = {
    id: crypto.randomUUID(),
    title: cleanTitle,
    description: cleanDescription,
    requestedAt: activity.at,
    status: "requested",
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
    `Proposed ${formatInr(proposal.cost)} and ${plural(proposal.days, "extra day")} for “${change.title}”.`,
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

  if (decision === "rejected") {
    const activity = entry(
      "client",
      `Rejected the proposal for “${change.title}”. The scope is unchanged.`,
    );
    const next: ChangeRequest = {
      ...change,
      status: "rejected",
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

  const days = change.proposedDays ?? 0;
  const cost = change.proposedCost ?? 0;
  const deadline = addDays(project.expectedCompletion, days);
  const milestoneId = crypto.randomUUID();
  const milestone: Milestone = {
    id: milestoneId,
    title: change.title,
    description: change.description,
    deliverables: [...(change.proposedDeliverables ?? [])],
    acceptanceCriteria: [...(change.proposedCriteria ?? [])],
    amount: cost,
    deadline,
    source: "change",
    changeRequestId: change.id,
  };
  const activity = entry(
    "client",
    `Approved “${change.title}”. Added ${formatInr(cost)} and ${plural(days, "extra day")} to the current scope.`,
  );
  const next: ChangeRequest = {
    ...change,
    status: "approved",
    decidedAt: activity.at,
    decisionNote: note.trim(),
    milestoneId,
  };

  return {
    ...project,
    expectedCompletion: days > 0 ? deadline : project.expectedCompletion,
    milestones: [...project.milestones, milestone],
    changeRequests: project.changeRequests.map((item) => (item.id === changeId ? next : item)),
    updatedAt: activity.at,
    activity: [...project.activity, activity],
  };
}
