export type Role = "freelancer" | "client";

export type AgreementStatus = "draft" | "accepted";

export type ChangeStatus =
  | "requested"
  | "proposed"
  | "approved"
  | "rejected"
  | "declined";

export type ChangeKind = "scope" | "timeline";

export const TIMELINE_REASONS = [
  "Underestimated complexity",
  "Technical blocker",
  "Dependency",
  "Unforeseen circumstance",
  "Other",
] as const;

export interface Milestone {
  id: string;
  title: string;
  description: string;
  deliverables: string[];
  acceptanceCriteria: string[];
  amount: number;
  deadline: string;
  source: "original" | "change";
  changeRequestId?: string;
  agreedDeadline?: string;
  agreedAmount?: number;
}

export interface AgreementSnapshot {
  acceptedAt: string;
  projectName: string;
  description: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  startDate: string;
  expectedCompletion: string;
  milestones: Milestone[];
}

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  requestedAt: string;
  status: ChangeStatus;
  kind?: ChangeKind;
  requestedCost?: number;
  requestedDays?: number;
  requestedDeliverables?: string[];
  requestedCriteria?: string[];
  reason?: string;
  reasonDetail?: string;
  requestedDeadline?: string;
  affectedMilestoneId?: string;
  previousDeadline?: string;
  previousAmount?: number;
  proposedCost?: number;
  proposedDays?: number;
  proposalNote?: string;
  proposedDeliverables?: string[];
  proposedCriteria?: string[];
  proposedAt?: string;
  decidedAt?: string;
  decisionNote?: string;
  milestoneId?: string;
}

export interface Activity {
  id: string;
  at: string;
  actor: Role | "system";
  message: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  startDate: string;
  expectedCompletion: string;
  status: AgreementStatus;
  milestones: Milestone[];
  originalAgreement: AgreementSnapshot | null;
  changeRequests: ChangeRequest[];
  activity: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface PersistedState {
  role: Role;
  projects: Project[];
}

export interface MilestoneInput {
  id: string;
  title: string;
  description: string;
  amount: string;
  deadline: string;
  deliverables: string[];
  acceptanceCriteria: string[];
}

export interface ProjectInput {
  name: string;
  description: string;
  clientName: string;
  clientEmail: string;
  totalAmount: string;
  startDate: string;
  expectedCompletion: string;
  milestones: MilestoneInput[];
}

export interface ProposalInput {
  cost: string;
  days: string;
  note: string;
  deliverables: string[];
  acceptanceCriteria: string[];
}

export interface NormalizedProject {
  name: string;
  description: string;
  clientName: string;
  clientEmail: string;
  totalAmount: number;
  startDate: string;
  expectedCompletion: string;
  milestones: Milestone[];
}

export interface NormalizedProposal {
  cost: number;
  days: number;
  note: string;
  deliverables: string[];
  acceptanceCriteria: string[];
}

export interface ClientRequestInput {
  title: string;
  description: string;
  cost: string;
  days: string;
  note: string;
  deliverables: string[];
  acceptanceCriteria: string[];
}

export interface NormalizedClientRequest {
  title: string;
  description: string;
  proposal: NormalizedProposal;
}

export interface TimelineRequestInput {
  milestoneId: string;
  reason: string;
  reasonDetail: string;
  explanation: string;
  deadline: string;
  cost: string;
}

export interface NormalizedTimelineRequest {
  milestoneId: string;
  reason: string;
  reasonDetail: string;
  explanation: string;
  deadline: string;
  cost: number;
}
