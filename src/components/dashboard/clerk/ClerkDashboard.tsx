import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { RegisterCaseForm } from "./RegisterCaseForm";
import { SearchCase } from "./SearchCase";
import { CaseManagementPanel } from "./CaseManagementPanel";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const ClerkDashboard = () => {
  const { roleTheme } = useRole();
  // selectedCase can be used when integrating with real case search

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
            Register, search, and manage court cases
          </p>
        </div>
      </motion.div>

      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="register">Register Case</TabsTrigger>
          <TabsTrigger value="search">Search Case</TabsTrigger>
          <TabsTrigger value="manage">Case Management</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <RegisterCaseForm />
        </TabsContent>

        <TabsContent value="search">
          <SearchCase />
        </TabsContent>

        <TabsContent value="manage">
          <CaseManagementPanel
            caseData={{
              id: "demo-case",
              case_number: "CASE-2026-001",
              title: "Sample Case for Demo",
              status: "active",
              assigned_judge_id: null,
              lawyer_party_a_id: null,
              lawyer_party_b_id: null,
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
