import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/policies/authorization";

export default async function NewGiftBoxPage() {
  await requireAdmin("gift-boxes");
  redirect("/admin/gift-boxes#new-gift-box");
}
