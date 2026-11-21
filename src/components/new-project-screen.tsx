"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useMilestone } from "@/lib/store";
import { blankProjectInput } from "@/lib/validate";
import { ProjectForm } from "./project-form";

export function NewProjectScreen() {
  const router = useRouter();
  const { createProject, role, hydrated } = useMilestone();
  const [initial] = useState(() => blankProjectInput());

  useEffect(() => {
    document.title = "New project · Milestone";
  }, []);

  if (!hydrated) {
    return <p className="text-sm text-muted">Opening your agreements…</p>;
  }

  if (role !== "freelancer") {
    return (
      <div className="max-w-xl">
        <h1 className="font-display text-4xl tracking-tight">Switch to the freelancer</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Project agreements are created as the freelancer. Use the role switcher, then come back to
          this page.
        </p>
        <Link href="/" className="mt-6 inline-flex text-sm font-medium text-accent">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Projects
      </Link>
      <div className="mt-6">
        <ProjectForm
          initial={initial}
          submitLabel="Save draft"
          intro="This stays a draft until the client accepts it. You can edit milestones until then. Switch to Client in the header when you want to demo the acceptance."
          onSubmit={(input) => {
            const result = createProject(input);
            if (result.ok) router.push(`/projects/${result.id}`);
            return result;
          }}
        />
      </div>
    </div>
  );
}
