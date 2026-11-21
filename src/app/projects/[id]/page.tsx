import { Suspense } from "react";
import { ProjectScreen } from "@/components/project-screen";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Opening the project…</p>}>
      <ProjectScreen params={params} />
    </Suspense>
  );
}
