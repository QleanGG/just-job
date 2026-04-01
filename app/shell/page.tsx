import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/get-server-user";

export default async function ShellPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  redirect("/shell/dashboard");
}
