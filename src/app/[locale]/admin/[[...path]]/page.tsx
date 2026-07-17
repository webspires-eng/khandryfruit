import { redirect } from "next/navigation";
export default async function LocaleAdminAlias({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;
  redirect(`/admin${path?.length ? `/${path.join("/")}` : ""}`);
}
