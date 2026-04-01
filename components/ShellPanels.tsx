import SwipeShellWrapper from "@/components/SwipeShellWrapper";
import DashboardBody from "@/components/DashboardBody";
import CvsBody from "@/components/CvsBody";
import ProfileBody from "@/components/ProfileBody";

export default function ShellPanels() {
  return (
    <SwipeShellWrapper
      dashboard={<DashboardBody />}
      cvs={<CvsBody />}
      profile={<ProfileBody />}
    />
  );
}
