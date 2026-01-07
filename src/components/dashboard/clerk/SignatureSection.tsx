import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Pen, Gavel, Scale, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CaseData = {
  id: string;
  case_number: string;
  title: string;
  assigned_judge?: { full_name: string } | null;
  lawyer_party_a?: { full_name: string } | null;
  lawyer_party_b?: { full_name: string } | null;
};

interface SignatureSectionProps {
  caseData: CaseData;
  judgeSignature: string | null;
  lawyerASignature: string | null;
  lawyerBSignature: string | null;
  onJudgeSign: (signature: string) => void;
  onLawyerASign: (signature: string) => void;
  onLawyerBSign: (signature: string) => void;
}

type SignatureRole = "judge" | "lawyerA" | "lawyerB";

const roleConfig = {
  judge: {
    label: "Judge",
    icon: Gavel,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  lawyerA: {
    label: "Lawyer (Party A)",
    icon: Scale,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  lawyerB: {
    label: "Lawyer (Party B)",
    icon: Scale,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
};

export const SignatureSection = ({
  caseData,
  judgeSignature,
  lawyerASignature,
  lawyerBSignature,
  onJudgeSign,
  onLawyerASign,
  onLawyerBSign,
}: SignatureSectionProps) => {
  const [signatureModal, setSignatureModal] = useState<SignatureRole | null>(null);
  const [signatureInput, setSignatureInput] = useState("");
  const [isSigning, setIsSigning] = useState(false);

  const getSignature = (role: SignatureRole) => {
    switch (role) {
      case "judge":
        return judgeSignature;
      case "lawyerA":
        return lawyerASignature;
      case "lawyerB":
        return lawyerBSignature;
    }
  };

  const getName = (role: SignatureRole) => {
    switch (role) {
      case "judge":
        return caseData.assigned_judge?.full_name || "Assigned Judge";
      case "lawyerA":
        return caseData.lawyer_party_a?.full_name || "Lawyer (Party A)";
      case "lawyerB":
        return caseData.lawyer_party_b?.full_name || "Lawyer (Party B)";
    }
  };

  const handleSign = async () => {
    if (!signatureInput.trim() || !signatureModal) return;
    
    setIsSigning(true);
    
    // Simulate signing process
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const signature = signatureInput.trim();
    
    switch (signatureModal) {
      case "judge":
        onJudgeSign(signature);
        break;
      case "lawyerA":
        onLawyerASign(signature);
        break;
      case "lawyerB":
        onLawyerBSign(signature);
        break;
    }
    
    setIsSigning(false);
    setSignatureModal(null);
    setSignatureInput("");
  };

  const SignatureCard = ({ role }: { role: SignatureRole }) => {
    const config = roleConfig[role];
    const Icon = config.icon;
    const signature = getSignature(role);
    const name = getName(role);

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-4 rounded-lg border-2",
          signature ? "border-emerald-500/30 bg-emerald-500/5" : config.border,
          config.bg
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", signature ? "text-emerald-500" : config.color)} />
            <div>
              <p className="font-medium">{config.label}</p>
              <p className="text-sm text-muted-foreground">{name}</p>
            </div>
          </div>
          
          {signature ? (
            <div className="flex items-center gap-2 text-emerald-500">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Signed</span>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSignatureModal(role)}
            >
              <Pen className="w-3 h-3 mr-1" />
              Sign
            </Button>
          )}
        </div>
        
        {signature && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Digital Signature</p>
            <p className="font-serif italic text-lg">{signature}</p>
          </div>
        )}
      </motion.div>
    );
  };

  const allSigned = judgeSignature && lawyerASignature && lawyerBSignature;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Pen className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Digital Signatures</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Collect digital signatures from the Judge and both Lawyers to finalize the case record.
      </p>

      {/* Signature Cards */}
      <div className="space-y-3">
        <SignatureCard role="judge" />
        <SignatureCard role="lawyerA" />
        <SignatureCard role="lawyerB" />
      </div>

      {/* Status */}
      {allSigned && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center"
        >
          <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-medium text-emerald-500">All Signatures Collected</p>
          <p className="text-sm text-muted-foreground">Ready to submit to IPFS</p>
        </motion.div>
      )}

      {/* Signature Modal */}
      <Dialog open={!!signatureModal} onOpenChange={() => setSignatureModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Digital Signature</DialogTitle>
            <DialogDescription>
              Enter the signature for {signatureModal && roleConfig[signatureModal].label}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name (as signature)</Label>
              <Input
                placeholder="Enter full name..."
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
                  setSignatureModal(null);
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
    </div>
  );
};
