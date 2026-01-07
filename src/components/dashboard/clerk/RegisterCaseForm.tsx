import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FilePlus, Search as SearchIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GlassCard } from "@/components/layout/GlassWrapper";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const caseFormSchema = z.object({
  title: z.string().min(3, "Case title must be at least 3 characters").max(200),
  uniqueIdentifier: z.string().min(1, "FIR ID or Case Number is required").max(50),
  caseType: z.enum(["criminal", "civil"]),
  partyAName: z.string().min(2, "Party name must be at least 2 characters").max(100),
  partyBName: z.string().min(2, "Party name must be at least 2 characters").max(100),
  assignedJudgeId: z.string().optional(),
  lawyerPartyAId: z.string().optional(),
  lawyerPartyBId: z.string().optional(),
  courtName: z.string().optional(),
  description: z.string().optional(),
});

type CaseFormData = z.infer<typeof caseFormSchema>;

type Profile = {
  id: string;
  full_name: string;
  role_category: string;
  unique_id: string | null;
};

export const RegisterCaseForm = () => {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [judges, setJudges] = useState<Profile[]>([]);
  const [lawyers, setLawyers] = useState<Profile[]>([]);
  const [judgeSearch, setJudgeSearch] = useState("");
  const [lawyerASearch, setLawyerASearch] = useState("");
  const [lawyerBSearch, setLawyerBSearch] = useState("");
  const [judgeOpen, setJudgeOpen] = useState(false);
  const [lawyerAOpen, setLawyerAOpen] = useState(false);
  const [lawyerBOpen, setLawyerBOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      caseType: "criminal",
    },
  });

  const caseType = watch("caseType");
  const selectedJudgeId = watch("assignedJudgeId");
  const selectedLawyerAId = watch("lawyerPartyAId");
  const selectedLawyerBId = watch("lawyerPartyBId");

  // Fetch judges and lawyers from database
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const { data: judgesData } = await supabase
          .from("profiles")
          .select("id, full_name, role_category, unique_id")
          .eq("role_category", "judiciary");

        const { data: lawyersData } = await supabase
          .from("profiles")
          .select("id, full_name, role_category, unique_id")
          .eq("role_category", "legal_practitioner");

        setJudges(judgesData || []);
        setLawyers(lawyersData || []);
      } catch (error) {
        console.error("Error fetching personnel:", error);
      }
    };

    fetchPersonnel();
  }, []);

  const getPartyLabels = () => {
    if (caseType === "criminal") {
      return { partyA: "Complainant", partyB: "Accused" };
    }
    return { partyA: "Plaintiff", partyB: "Defendant" };
  };

  const { partyA, partyB } = getPartyLabels();

  const filteredJudges = judges.filter((judge) =>
    judge.full_name.toLowerCase().includes(judgeSearch.toLowerCase())
  );

  const filteredLawyersA = lawyers.filter((lawyer) =>
    lawyer.full_name.toLowerCase().includes(lawyerASearch.toLowerCase())
  );

  const filteredLawyersB = lawyers.filter((lawyer) =>
    lawyer.full_name.toLowerCase().includes(lawyerBSearch.toLowerCase())
  );

  const getSelectedName = (id: string | undefined, list: Profile[]) => {
    if (!id) return null;
    return list.find((item) => item.id === id)?.full_name || null;
  };

  const onSubmit = async (data: CaseFormData) => {
    if (!profile?.id) {
      toast.error("You must be logged in to register a case");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("cases").insert({
        title: data.title,
        unique_identifier: data.uniqueIdentifier,
        case_type: data.caseType,
        party_a_name: data.partyAName,
        party_b_name: data.partyBName,
        assigned_judge_id: data.assignedJudgeId || null,
        lawyer_party_a_id: data.lawyerPartyAId || null,
        lawyer_party_b_id: data.lawyerPartyBId || null,
        court_name: data.courtName || null,
        description: data.description || null,
        created_by: profile.id,
        case_number: "", // Will be auto-generated by trigger
      });

      if (error) throw error;

      toast.success("Case registered successfully!");
      reset();
      setJudgeSearch("");
      setLawyerASearch("");
      setLawyerBSearch("");
    } catch (error: any) {
      console.error("Error registering case:", error);
      toast.error(error.message || "Failed to register case");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <FilePlus className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Register New Case</h2>
          <p className="text-sm text-muted-foreground">
            Create a new case record in the system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Case Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Case Title *</Label>
          <Input
            id="title"
            placeholder="Enter case title"
            {...register("title")}
            className={cn(errors.title && "border-destructive")}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        {/* Unique Identifier */}
        <div className="space-y-2">
          <Label htmlFor="uniqueIdentifier">FIR ID / Case Number *</Label>
          <Input
            id="uniqueIdentifier"
            placeholder="Enter FIR ID or Case Number"
            {...register("uniqueIdentifier")}
            className={cn(errors.uniqueIdentifier && "border-destructive")}
          />
          {errors.uniqueIdentifier && (
            <p className="text-sm text-destructive">
              {errors.uniqueIdentifier.message}
            </p>
          )}
        </div>

        {/* Case Type */}
        <div className="space-y-2">
          <Label>Case Type *</Label>
          <Select
            value={caseType}
            onValueChange={(value: "criminal" | "civil") =>
              setValue("caseType", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select case type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="criminal">Criminal</SelectItem>
              <SelectItem value="civil">Civil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Party Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="partyAName">
              {partyA} Name (Party A) *
            </Label>
            <Input
              id="partyAName"
              placeholder={`Enter ${partyA.toLowerCase()} name`}
              {...register("partyAName")}
              className={cn(errors.partyAName && "border-destructive")}
            />
            {errors.partyAName && (
              <p className="text-sm text-destructive">
                {errors.partyAName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="partyBName">
              {partyB} Name (Party B) *
            </Label>
            <Input
              id="partyBName"
              placeholder={`Enter ${partyB.toLowerCase()} name`}
              {...register("partyBName")}
              className={cn(errors.partyBName && "border-destructive")}
            />
            {errors.partyBName && (
              <p className="text-sm text-destructive">
                {errors.partyBName.message}
              </p>
            )}
          </div>
        </div>

        {/* Legal Personnel */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Assign Legal Personnel</h3>

          {/* Assign Judge */}
          <div className="space-y-2">
            <Label>Assign Judge</Label>
            <Popover open={judgeOpen} onOpenChange={setJudgeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={judgeOpen}
                  className="w-full justify-between"
                >
                  {getSelectedName(selectedJudgeId, judges) || "Select a judge..."}
                  <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-popover" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search judges..."
                    value={judgeSearch}
                    onValueChange={setJudgeSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No judges found.</CommandEmpty>
                    <CommandGroup>
                      {filteredJudges.map((judge) => (
                        <CommandItem
                          key={judge.id}
                          value={judge.id}
                          onSelect={() => {
                            setValue("assignedJudgeId", judge.id);
                            setJudgeOpen(false);
                          }}
                        >
                          <span>{judge.full_name}</span>
                          {judge.unique_id && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({judge.unique_id})
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Lawyers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lawyer for Party A */}
            <div className="space-y-2">
              <Label>Lawyer for {partyA}</Label>
              <Popover open={lawyerAOpen} onOpenChange={setLawyerAOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={lawyerAOpen}
                    className="w-full justify-between"
                  >
                    {getSelectedName(selectedLawyerAId, lawyers) ||
                      "Select a lawyer..."}
                    <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-popover" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search lawyers..."
                      value={lawyerASearch}
                      onValueChange={setLawyerASearch}
                    />
                    <CommandList>
                      <CommandEmpty>No lawyers found.</CommandEmpty>
                      <CommandGroup>
                        {filteredLawyersA.map((lawyer) => (
                          <CommandItem
                            key={lawyer.id}
                            value={lawyer.id}
                            onSelect={() => {
                              setValue("lawyerPartyAId", lawyer.id);
                              setLawyerAOpen(false);
                            }}
                          >
                            <span>{lawyer.full_name}</span>
                            {lawyer.unique_id && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({lawyer.unique_id})
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Lawyer for Party B */}
            <div className="space-y-2">
              <Label>Lawyer for {partyB}</Label>
              <Popover open={lawyerBOpen} onOpenChange={setLawyerBOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={lawyerBOpen}
                    className="w-full justify-between"
                  >
                    {getSelectedName(selectedLawyerBId, lawyers) ||
                      "Select a lawyer..."}
                    <SearchIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-popover" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search lawyers..."
                      value={lawyerBSearch}
                      onValueChange={setLawyerBSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No lawyers found.</CommandEmpty>
                      <CommandGroup>
                        {filteredLawyersB.map((lawyer) => (
                          <CommandItem
                            key={lawyer.id}
                            value={lawyer.id}
                            onSelect={() => {
                              setValue("lawyerPartyBId", lawyer.id);
                              setLawyerBOpen(false);
                            }}
                          >
                            <span>{lawyer.full_name}</span>
                            {lawyer.unique_id && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({lawyer.unique_id})
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Court Name */}
        <div className="space-y-2">
          <Label htmlFor="courtName">Court Name</Label>
          <Input
            id="courtName"
            placeholder="Enter court name (optional)"
            {...register("courtName")}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Case Description</Label>
          <Textarea
            id="description"
            placeholder="Enter case description (optional)"
            rows={3}
            {...register("description")}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registering Case...
            </>
          ) : (
            <>
              <FilePlus className="w-4 h-4 mr-2" />
              Register Case
            </>
          )}
        </Button>
      </form>
    </GlassCard>
  );
};
// import { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "sonner";
// import { NyaySutraSidebar } from "./NyaySutraSidebar";
// import { DashboardHeader } from "./DashboardHeader";
// import { VitalStatsCards } from "./VitalStatsCards";
// import { CauseListItem, LiveCauseList } from "./LiveCauseList";
// import { JudgmentItem, JudgmentQueue } from "./JudgmentQueue";
// import { QuickJudicialNotes } from "./QuickJudicialNotes";
// import { PendingSignatures } from "./PendingSignatures";
// import { useAuth } from "@/contexts/AuthContext";
// import { supabase } from "@/integrations/supabase/client";

// // --- HELPER FUNCTIONS ---

// const transformCaseToCauseListItem = (dbCase: any, index: number): CauseListItem => {
  
//   // 1. Format Parties (Lawyer A vs Lawyer B)
//   const lawyerA = dbCase.lawyer_a?.full_name || "Unknown";
//   const lawyerB = dbCase.lawyer_b?.full_name || "Unknown";
//   // Fallback: if no lawyers, use the case title
//   const partiesDisplay = (lawyerA !== "Unknown" || lawyerB !== "Unknown") 
//     ? `${lawyerA} v. ${lawyerB}` 
//     : dbCase.title;

//   // 2. Helper for Case Type
//   const getCaseType = (caseType: string, title: string): string => {
//     if (caseType === "criminal") return "Criminal Case";
//     if (caseType === "civil") return "Civil Suit";
//     if (title && title.toLowerCase().includes("writ")) return "Writ Petition";
//     if (title && title.toLowerCase().includes("bail")) return "Bail Application";
//     return "Miscellaneous";
//   };

//   // 3. Helper for Stage
//   const getStage = (status: string): string => {
//     switch (status) {
//       case "pending": return "Filing";
//       case "active": return "Arguments";
//       case "hearing": return "Hearing";
//       case "verdict_pending": return "Reserved";
//       default: return "Scheduled";
//     }
//   };

//   // 4. Helper for Status
//   const mapStatus = (status: string): "scheduled" | "in-progress" | "completed" | "adjourned" => {
//     switch (status) {
//       case "closed": return "completed";
//       case "hearing": return "in-progress";
//       case "appealed": return "adjourned";
//       default: return "scheduled";
//     }
//   };

//   return {
//     id: dbCase.id,
//     srNo: index + 1,
//     caseNumber: dbCase.case_number || `CASE-${index + 100}`,
//     parties: partiesDisplay,
//     caseType: getCaseType(dbCase.case_type || "", dbCase.title || ""),
//     stage: getStage(dbCase.status),
//     status: mapStatus(dbCase.status),
//     time: undefined,
//     isUrgent: false,
//   };
// };

// // Mock data for judgment queue
// const mockJudgmentQueue: JudgmentItem[] = [
//   {
//     id: "j1",
//     caseNumber: "WP/0789/2024",
//     parties: "Sunrise Pharma vs. DPCO",
//     hearingDate: "Dec 28, 2024",
//     draftProgress: 75,
//     dueDate: "Jan 15, 2025",
//   },
//   {
//     id: "j2",
//     caseNumber: "CS/1567/2024",
//     parties: "Metro Builders vs. NHAI",
//     hearingDate: "Dec 20, 2024",
//     draftProgress: 40,
//     dueDate: "Jan 10, 2025",
//     isOverdue: true,
//   },
// ];

// type PendingCase = {
//   id: string;
//   case_number: string;
//   title: string;
//   status: string;
//   requested_at?: string;
// };

// // --- MAIN COMPONENT ---

// export const JudiciaryDashboard = () => {
//   const { profile } = useAuth();
//   const navigate = useNavigate();
//   const [currentHearingId, setCurrentHearingId] = useState<string | null>(null);
//   const [notes, setNotes] = useState("");
//   const [causeList, setCauseList] = useState<CauseListItem[]>([]);
//   const [pendingSignatures, setPendingSignatures] = useState<PendingCase[]>([]);
//   const [, setIsLoading] = useState(true);

//   const judgeName = profile?.full_name || "Judge";

//   // 1. Fetch Real Cases
//   useEffect(() => {
//     const fetchCases = async () => {
//       try {
//         const { data: cases, error } = await supabase
//           .from("cases")
//           .select(`
//             *,
//             judge:judge_id ( full_name ),
//             lawyer_a:lawyer_a_id ( full_name ),
//             lawyer_b:lawyer_b_id ( full_name )
//           `)
//           .order("created_at", { ascending: false })
//           .limit(20);

//         if (error) throw error;

//         if (cases) {
//           const transformedCases = cases.map((c: any, index: number) =>
//             transformCaseToCauseListItem(c, index)
//           );
//           setCauseList(transformedCases);
//         }
//       } catch (error) {
//         console.error("Error fetching cases:", error);
//         toast.error("Failed to load cases");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchCases();
//   }, []);

//   // 2. Fetch Pending Signatures
//   useEffect(() => {
//     const fetchPendingSignatures = async () => {
//       if (!profile?.id) return;

//       try {
//         const { data: cases } = await supabase
//           .from("cases")
//           .select("id, case_number, title, status, created_at")
//           // Note: Ensure your DB column is actually named 'judge_id' or 'assigned_judge_id'. 
//           // Based on your previous code, it was 'judge_id', but here I kept your 'assigned_judge_id' 
//           // just in case. If it fails, change this to 'judge_id'.
//           .eq("judge_id", profile.id) 
//           .in("status", ["active", "hearing", "verdict_pending"])
//           .limit(10);

//         if (cases) {
//           setPendingSignatures(
//             cases.map((c) => ({
//               ...c,
//               requested_at: c.created_at,
//             })),
//           );
//         }
//       } catch (error) {
//         console.error("Error fetching pending signatures:", error);
//       }
//     };

//     fetchPendingSignatures();
//   }, [profile?.id]);

//   const handleJudgeSign = async (caseId: string, signature: string) => {
//     console.log("Judge signed case:", caseId, "with signature:", signature);
//     setPendingSignatures((prev) => prev.filter((c) => c.id !== caseId));
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//   };

//   const currentCase = causeList.find((c) => c.id === currentHearingId);

//   const handleStartHearing = useCallback((id: string) => {
//     setCurrentHearingId(id);
//     const caseItem = causeList.find((c) => c.id === id);
//     toast.success(`Hearing started for ${caseItem?.caseNumber}`, {
//       description: caseItem?.parties,
//     });
//   }, [causeList]);

//   const handleOpenCaseFile = useCallback((id: string) => {
//     navigate(`/cases/${id}`);
//   }, [navigate]);

//   const handleVideoCall = useCallback((id: string) => {
//     toast.info("Video call feature coming soon", {
//       description: `Case ID: ${id}`,
//     });
//   }, []);

//   const handlePassOrder = useCallback((id: string) => {
//     toast.info("Pass order feature coming soon", {
//       description: `Case ID: ${id}`,
//     });
//   }, []);

//   const handleSaveNotes = useCallback((newNotes: string) => {
//     setNotes(newNotes);
//     if (newNotes.trim()) {
//       toast.success("Note saved", {
//         description: currentCase
//           ? `Added to ${currentCase.caseNumber}`
//           : "Saved to drafts",
//       });
//     }
//   }, [currentCase]);

//   const urgentMatters = causeList.filter((c) => c.isUrgent).length;

//   return (
//     <div className="flex min-h-screen">
//       <NyaySutraSidebar />
//       <div className="flex-1 flex flex-col min-w-0 p-6 space-y-6 overflow-auto ml-64">
//         <DashboardHeader judgeName={judgeName} />

//         <VitalStatsCards
//           casesListedToday={causeList.length}
//           urgentApplications={urgentMatters}
//           judgmentsReserved={mockJudgmentQueue.length}
//           monthlyDisposalRate="87%"
//         />

//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//           <div className="xl:col-span-2">
//             <LiveCauseList
//               items={causeList}
//               currentHearingId={currentHearingId}
//               onStartHearing={handleStartHearing}
//               onOpenCaseFile={handleOpenCaseFile}
//               onVideoCall={handleVideoCall}
//               onPassOrder={handlePassOrder}
//             />
//           </div>

//           <div className="space-y-6">
//             <JudgmentQueue
//               items={mockJudgmentQueue}
//               onOpenJudgment={(id: string) =>
//                 navigate(`/judgment-writer?case=${id}`)}
//             />

//             <PendingSignatures
//               cases={pendingSignatures}
//               role="judge"
//               onSign={handleJudgeSign}
//             />

//             <QuickJudicialNotes
//               currentHearingId={currentHearingId}
//               currentCaseNumber={currentCase?.caseNumber}
//               initialNotes={notes}
//               onSaveNotes={handleSaveNotes}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };