import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { BriefingView } from "@/components/BriefingView";

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) redirect("/login");
  const { id } = await params;
  return (
    <main>
      <BriefingView topicId={id} />
    </main>
  );
}
