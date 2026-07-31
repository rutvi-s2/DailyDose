import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { Wall } from "@/components/Wall";

export default async function Home() {
  const userId = await requireUserId();
  if (!userId) redirect("/login");
  return (
    <main>
      <Wall />
    </main>
  );
}
