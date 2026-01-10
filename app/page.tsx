import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ token?: string }>;
}) {
  const token = (await searchParams)?.token;
  redirect(token ? `/dashboard?token=${encodeURIComponent(token)}` : "/dashboard");
}
