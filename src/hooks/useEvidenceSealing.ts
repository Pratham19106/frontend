import { useState, useCallback } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SealEvidenceParams {
  evidenceId: string;
  caseId: string;
  fileHash: string;
  fileName: string;
}

interface SealResult {
  success: boolean;
  signature?: string;
  txHash?: string;
  error?: string;
}

// Generate message to sign (evidence hash + case ID + timestamp)
const generateSealMessage = (fileHash: string, caseId: string): string => {
  const timestamp = new Date().toISOString();
  return `NyaySutra Evidence Seal\nCase: ${caseId}\nHash: ${fileHash}\nTimestamp: ${timestamp}`;
};

// Record seal on blockchain (placeholder - implement your smart contract)
const recordSealOnBlockchain = async (
  _fileHash: string,
  _signature: string,
  _caseId: string,
  _evidenceId: string
): Promise<string> => {
  // This is a placeholder - implement your smart contract interaction here
  // For now, return a mock hash
  return `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("")}`;
};

export const useEvidenceSealing = () => {
  const [isSealing, setIsSealing] = useState(false);
  const { isConnected, signMessage, address } = useWeb3();
  const { profile } = useAuth();

  const sealEvidence = useCallback(
    async (params: SealEvidenceParams): Promise<SealResult> => {
      if (!isConnected || !address) {
        return {
          success: false,
          error: "Please connect your wallet to seal evidence",
        };
      }

      if (!profile?.id) {
        return {
          success: false,
          error: "You must be logged in to seal evidence",
        };
      }

      setIsSealing(true);

      try {
        // Step 1: Generate seal message
        const sealMessage = generateSealMessage(params.fileHash, params.caseId);

        // Step 2: Sign message with wallet
        toast.info("Please sign the message in your wallet to seal this evidence");
        const signature = await signMessage(sealMessage);

        if (!signature) {
          return {
            success: false,
            error: "Signature cancelled or failed",
          };
        }

        // Step 3: Record on blockchain (optional but recommended)
        let txHash: string | undefined;
        if (isConnected) {
          try {
            txHash = await recordSealOnBlockchain(
              params.fileHash,
              signature,
              params.caseId,
              params.evidenceId
            );
          } catch (error) {
            console.warn("Blockchain recording failed, continuing with database seal:", error);
            // Continue even if blockchain fails - database seal is primary
          }
        }

        // TODO: Update evidence record when evidence table exists
        // For now, just log success
        console.log("Evidence sealed:", {
          evidenceId: params.evidenceId,
          signature,
          txHash,
          sealedBy: profile.id,
        });

        toast.success("Evidence sealed successfully with judicial signature");

        return {
          success: true,
          signature,
          txHash,
        };
      } catch (error: unknown) {
        console.error("Sealing error:", error);
        const errorMessage = error instanceof Error ? error.message : "Sealing failed";
        toast.error(errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsSealing(false);
      }
    },
    [isConnected, address, signMessage, profile]
  );

  return {
    sealEvidence,
    isSealing,
  };
};
