import { useRole } from "@/contexts/RoleContext";
import { JudiciaryDashboard } from "@/components/dashboard/JudiciaryDashboard";
import { ClerkDashboard } from "@/components/dashboard/clerk/ClerkDashboard";
import { PublicDashboard } from "@/components/dashboard/PublicDashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const Dashboard = () => {
  const { currentUser } = useRole();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  // Role-based dashboard switching
  switch (currentUser.role) {
    case "judge":
      return <JudiciaryDashboard />;
    case "clerk":
      return <ClerkDashboard />;
    case "observer":
      return <PublicDashboard />;
    default:
      return <PublicDashboard />;
  }
};

export default Dashboard;
