import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/get-server-user";
import ShellPanels from "@/components/ShellPanels";

export default async function ShellDashboardPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  return <ShellPanels />;
}
