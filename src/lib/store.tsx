"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  acceptAgreement,
  buildProject,
  decideChange,
  declineChange,
  proposeChange,
  requestChange,
  updateDraft,
} from "./actions";
import { loadState, saveState } from "./repository";
import { createSeedState } from "./seed";
import type { PersistedState, ProjectInput, Role } from "./types";
import { validateProjectInput, validateProposal } from "./validate";

type Store = {
  hydrated: boolean;
  role: Role;
  setRole: (role: Role) => void;
  projects: PersistedState["projects"];
  resetDemo: () => void;
  createProject: (input: ProjectInput) => { ok: true; id: string } | { ok: false; errors: string[] };
  updateDraft: (id: string, input: ProjectInput) => { ok: true } | { ok: false; errors: string[] };
  acceptAgreement: (id: string) => { ok: true } | { ok: false; error: string };
  requestChange: (
    id: string,
    title: string,
    description: string,
  ) => { ok: true } | { ok: false; error: string };
  proposeChange: (
    projectId: string,
    changeId: string,
    input: Parameters<typeof validateProposal>[0],
  ) => { ok: true } | { ok: false; error: string };
  declineChange: (
    projectId: string,
    changeId: string,
    note: string,
  ) => { ok: true } | { ok: false; error: string };
  decideChange: (
    projectId: string,
    changeId: string,
    decision: "approved" | "rejected",
    note: string,
  ) => { ok: true } | { ok: false; error: string };
};

const MilestoneContext = createContext<Store | null>(null);

export function useMilestone() {
  const store = useContext(MilestoneContext);
  if (!store) throw new Error("useMilestone must be used within StoreProvider");
  return store;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(createSeedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const api = useMemo<Store>(() => {
    const replace = (id: string, project: PersistedState["projects"][number]) => {
      setState((current) => {
        if (!current) return current;
        return {
          ...current,
          projects: current.projects.map((item) => (item.id === id ? project : item)),
        };
      });
    };

    return {
      hydrated,
      role: state.role,
      projects: state.projects,
      setRole: (role) => setState((current) => (current ? { ...current, role } : current)),
      resetDemo: () => setState(createSeedState()),
      createProject: (input) => {
        const validated = validateProjectInput(input);
        if (!validated.ok) return validated;
        const id = crypto.randomUUID();
        const project = buildProject(validated.value, id);
        setState((current) =>
          current ? { ...current, projects: [project, ...current.projects] } : current,
        );
        return { ok: true, id };
      },
      updateDraft: (id, input) => {
        const validated = validateProjectInput(input);
        if (!validated.ok) return validated;
        const project = state.projects.find((item) => item.id === id);
        if (!project) return { ok: false, errors: ["Project not found."] };
        try {
          replace(id, updateDraft(project, validated.value));
          return { ok: true };
        } catch (error) {
          return { ok: false, errors: [messageOf(error)] };
        }
      },
      acceptAgreement: (id) => mutate(state, id, acceptAgreement, replace),
      requestChange: (id, title, description) =>
        mutate(state, id, (project) => requestChange(project, title, description), replace),
      proposeChange: (projectId, changeId, input) => {
        const validated = validateProposal(input);
        if (!validated.ok) return validated;
        return mutate(
          state,
          projectId,
          (project) => proposeChange(project, changeId, validated.value),
          replace,
        );
      },
      declineChange: (projectId, changeId, note) =>
        mutate(state, projectId, (project) => declineChange(project, changeId, note), replace),
      decideChange: (projectId, changeId, decision, note) =>
        mutate(
          state,
          projectId,
          (project) => decideChange(project, changeId, decision, note),
          replace,
        ),
    };
  }, [hydrated, state]);

  return <MilestoneContext.Provider value={api}>{children}</MilestoneContext.Provider>;
}

function mutate(
  state: PersistedState,
  id: string,
  apply: (project: PersistedState["projects"][number]) => PersistedState["projects"][number],
  replace: (id: string, project: PersistedState["projects"][number]) => void,
): { ok: true } | { ok: false; error: string } {
  const project = state.projects.find((item) => item.id === id);
  if (!project) return { ok: false, error: "Project not found." };
  try {
    replace(id, apply(project));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: messageOf(error) };
  }
}

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
