import { useState } from "react";
import { motion } from "framer-motion";
import { Pen, Check, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/layout/GlassWrapper";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PendingCase = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  requested_at?: string;
};

interface PendingSignaturesProps {
  cases: PendingCase[];
  role: "judge" | "lawyer";
  onSign: (caseId: string, signature: string) => Promise<void>;
  className?: string;
}

export const PendingSignatures = ({
  cases,
  role,
  onSign,
  className,
}: PendingSignaturesProps) => {
  const [signingCaseId, setSigningCaseId] = useState<string | null>(null);
  const [signatureInput, setSignatureInput] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const handleSign = async () => {
    if (!signatureInput.trim() || !signingCaseId) return;

    setIsSigning(true);

    try {
      await onSign(signingCaseId, signatureInput.trim());
      toast.success("Signature submitted successfully!", {
        description: "The case has been signed.",
      });
      setSigningCaseId(null);
      setSignatureInput("");
    } catch (error) {
      toast.error("Failed to submit signature");
    } finally {
      setIsSigning(false);
    }
  };

  if (cases.length === 0) {
    return (
      <GlassCard className={cn("p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Pen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Pending Signatures</h3>
        </div>
        <div className="text-center py-8">
          <Check className="w-12 h-12 text-emerald-500/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No pending signature requests
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard className={cn("p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pen className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Pending Signatures</h3>
          </div>
          <Badge variant="secondary">{cases.length} pending</Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          The clerk has requested your signature on the following cases.
        </p>

        <div className="space-y-3">
          {cases.map((caseItem) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-secondary/30 border border-amber-500/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{caseItem.title}</p>
                    <p className="text-sm font-mono text-muted-foreground">
                      {caseItem.case_number}
                    </p>
                    {caseItem.requested_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested: {new Date(caseItem.requested_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setSigningCaseId(caseItem.id)}
                >
                  <Pen className="w-3 h-3 mr-1" />
                  Sign
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Signature Modal */}
      <Dialog open={!!signingCaseId} onOpenChange={() => setSigningCaseId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Digital Signature</DialogTitle>
            <DialogDescription>
              Sign as {role === "judge" ? "the presiding Judge" : "Legal Counsel"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name (as signature)</Label>
              <Input
                placeholder="Enter your full name..."
                value={signatureInput}
                onChange={(e) => setSignatureInput(e.target.value)}
                className="font-serif text-lg"
              />
            </div>

            {signatureInput && (
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <p className="font-serif italic text-2xl">{signatureInput}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSigningCaseId(null);
                  setSignatureInput("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSign}
                disabled={!signatureInput.trim() || isSigning}
              >
                {isSigning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Confirm Signature
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
