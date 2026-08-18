import { ResetConfirmForm } from "@/components/ResetConfirmForm";

export default async function ResetConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main>
      <ResetConfirmForm token={token ?? ""} />
    </main>
  );
}
