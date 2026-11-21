import { addDays, formatDate, formatInr, parseAmount, todayIso } from "./format";
import type {
  ClientRequestInput,
  MilestoneInput,
  NormalizedClientRequest,
  NormalizedProject,
  NormalizedProposal,
  NormalizedTimelineRequest,
  Project,
  ProjectInput,
  ProposalInput,
  TimelineRequestInput,
} from "./types";
import { TIMELINE_REASONS } from "./types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function blankMilestone(deadline = ""): MilestoneInput {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    amount: "",
    deadline,
    deliverables: [""],
    acceptanceCriteria: [""],
  };
}

export function blankProjectInput(): ProjectInput {
  const startDate = todayIso();
  const expectedCompletion = addDays(startDate, 30);
  return {
    name: "",
    description: "",
    clientName: "",
    clientEmail: "",
    totalAmount: "",
    startDate,
    expectedCompletion,
    milestones: [blankMilestone(expectedCompletion)],
  };
}

export function projectToInput(project: Project): ProjectInput {
  return {
    name: project.name,
    description: project.description,
    clientName: project.clientName,
    clientEmail: project.clientEmail,
    totalAmount: String(project.totalAmount),
    startDate: project.startDate,
    expectedCompletion: project.expectedCompletion,
    milestones: project.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      amount: String(milestone.amount),
      deadline: milestone.deadline,
      deliverables: milestone.deliverables.length > 0 ? [...milestone.deliverables] : [""],
      acceptanceCriteria:
        milestone.acceptanceCriteria.length > 0 ? [...milestone.acceptanceCriteria] : [""],
    })),
  };
}

export function validateProjectInput(
  input: ProjectInput,
): { ok: true; value: NormalizedProject } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const name = input.name.trim();
  const description = input.description.trim();
  const clientName = input.clientName.trim();
  const clientEmail = input.clientEmail.trim();

  if (!name) errors.push("Add a project name.");
  if (!description) errors.push("Describe what is included in the project.");
  if (!clientName) errors.push("Add the client name.");
  if (!EMAIL.test(clientEmail)) errors.push("Add a valid client email.");
  if (!DATE.test(input.startDate)) errors.push("Set a start date.");
  if (!DATE.test(input.expectedCompletion)) errors.push("Set an expected completion date.");
  if (
    DATE.test(input.startDate) &&
    DATE.test(input.expectedCompletion) &&
    input.expectedCompletion < input.startDate
  ) {
    errors.push("Completion should be on or after the start date.");
  }

  const totalAmount = parseAmount(input.totalAmount);
  if (totalAmount === null) errors.push("Set the total project amount in INR.");
  if (input.milestones.length === 0) errors.push("Add at least one milestone.");

  const milestones = input.milestones.flatMap((milestone, index) => {
    const label = `Milestone ${index + 1}`;
    const title = milestone.title.trim();
    const deliverables = milestone.deliverables.map((item) => item.trim()).filter(Boolean);
    const acceptanceCriteria = milestone.acceptanceCriteria
      .map((item) => item.trim())
      .filter(Boolean);
    const amount = parseAmount(milestone.amount);

    if (!title) errors.push(`${label} needs a title.`);
    if (amount === null) errors.push(`${label} needs an amount.`);
    if (!DATE.test(milestone.deadline)) errors.push(`${label} needs a deadline.`);
    if (DATE.test(milestone.deadline) && DATE.test(input.startDate) && milestone.deadline < input.startDate) {
      errors.push(
        `${label} is due ${formatDate(milestone.deadline)}, before the project starts on ${formatDate(input.startDate)}.`,
      );
    }
    if (
      DATE.test(milestone.deadline) &&
      DATE.test(input.expectedCompletion) &&
      milestone.deadline > input.expectedCompletion
    ) {
      errors.push(
        `${label} is due ${formatDate(milestone.deadline)}, after the expected completion on ${formatDate(input.expectedCompletion)}.`,
      );
    }
    if (deliverables.length === 0) errors.push(`${label} needs at least one deliverable.`);
    if (acceptanceCriteria.length === 0) {
      errors.push(`${label} needs at least one acceptance criterion.`);
    }

    if (!title || amount === null || !DATE.test(milestone.deadline)) return [];
    if (deliverables.length === 0 || acceptanceCriteria.length === 0) return [];

    return [
      {
        id: milestone.id,
        title,
        description: milestone.description.trim(),
        deliverables,
        acceptanceCriteria,
        amount,
        deadline: milestone.deadline,
        source: "original" as const,
      },
    ];
  });

  const milestoneTotal = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  if (totalAmount !== null && milestones.length === input.milestones.length && milestoneTotal !== totalAmount) {
    errors.push(
      `Milestone amounts add up to ${formatInr(milestoneTotal)}. The project total is ${formatInr(totalAmount)}. Match them before saving.`,
    );
  }

  if (errors.length > 0 || totalAmount === null) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      description,
      clientName,
      clientEmail,
      totalAmount,
      startDate: input.startDate,
      expectedCompletion: input.expectedCompletion,
      milestones,
    },
  };
}

export function validateProposal(
  input: ProposalInput,
): { ok: true; value: NormalizedProposal } | { ok: false; error: string } {
  const cost = parseAmount(input.cost);
  const daysText = input.days.trim();
  const days = Number(daysText);
  const deliverables = input.deliverables.map((item) => item.trim()).filter(Boolean);
  const acceptanceCriteria = input.acceptanceCriteria.map((item) => item.trim()).filter(Boolean);

  if (cost === null) {
    return { ok: false, error: "Enter the additional cost. Use 0 if there is no charge." };
  }
  if (daysText === "" || !Number.isInteger(days) || days < 0) {
    return { ok: false, error: "Enter extra days as a whole number. Use 0 if the date does not move." };
  }
  if (deliverables.length === 0) {
    return { ok: false, error: "Add at least one deliverable for this change." };
  }
  if (acceptanceCriteria.length === 0) {
    return { ok: false, error: "Add at least one acceptance criterion." };
  }

  return {
    ok: true,
    value: {
      cost,
      days,
      note: input.note.trim(),
      deliverables,
      acceptanceCriteria,
    },
  };
}

export function validateClientRequest(
  input: ClientRequestInput,
): { ok: true; value: NormalizedClientRequest } | { ok: false; error: string } {
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) {
    return { ok: false, error: "Describe the change you want." };
  }
  const proposal = validateProposal(input);
  if (!proposal.ok) return proposal;
  return { ok: true, value: { title, description, proposal: proposal.value } };
}

export function validateTimelineRequest(
  input: TimelineRequestInput,
): { ok: true; value: NormalizedTimelineRequest } | { ok: false; error: string } {
  const explanation = input.explanation.trim();
  const reason = input.reason.trim();
  const cost = input.cost.trim() === "" ? 0 : parseAmount(input.cost);

  if (!input.milestoneId) return { ok: false, error: "Choose the milestone this affects." };
  if (!TIMELINE_REASONS.includes(reason as (typeof TIMELINE_REASONS)[number])) {
    return { ok: false, error: "Choose a reason for the revision." };
  }
  if (!explanation) return { ok: false, error: "Explain why the timeline needs to change." };
  if (!DATE.test(input.deadline)) return { ok: false, error: "Set the revised deadline." };
  if (cost === null) return { ok: false, error: "Enter additional cost, or leave it blank for none." };

  return {
    ok: true,
    value: {
      milestoneId: input.milestoneId,
      reason,
      explanation,
      deadline: input.deadline,
      cost,
    },
  };
}
