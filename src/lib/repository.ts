import { createSeedState } from "./seed";
import type { PersistedState, Project, Role } from "./types";

export const STORAGE_KEY = "milestone.v1";

/**
 * Browser persistence for this MVP.
 * Screens talk to the store, and the store talks to this module.
 * A later backend can replace loadState and saveState without rewriting the workflow.
 */
export function loadState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isPersistedState(parsed)) return createSeedState();
    return parsed;
  } catch {
    return createSeedState();
  }
}

export function saveState(state: PersistedState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota and private-mode failures. The in-memory session still works.
  }
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  const state = value as PersistedState;
  return isRole(state.role) && Array.isArray(state.projects) && state.projects.every(isProject);
}

function isRole(value: unknown): value is Role {
  return value === "freelancer" || value === "client";
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== "object") return false;
  const project = value as Project;
  return (
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    (project.status === "draft" || project.status === "accepted") &&
    Array.isArray(project.milestones) &&
    Array.isArray(project.changeRequests) &&
    Array.isArray(project.activity)
  );
}
