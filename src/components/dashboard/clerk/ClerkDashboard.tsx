import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { RegisterCaseForm } from "./RegisterCaseForm";
import { SearchCase } from "./SearchCase";
import { cn } from "@/lib/utils";

export const ClerkDashboard = () => {
  const { roleTheme } = useRole();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Briefcase className={cn("w-8 h-8", `text-${roleTheme.primary}`)} />
            Clerk Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Register new cases and search existing records
          </p>
        </div>
      </motion.div>

      {/* Main Content - Two Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Register New Case */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <RegisterCaseForm />
        </motion.div>

        {/* Search Case */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SearchCase />
        </motion.div>
      </div>
    </div>
  );
};
