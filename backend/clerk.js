import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const COURT_ADDR = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // <--- REPLACE THIS
const COURT_ABI = [
    "function createCase(string _title, uint256 _firId, string _metaData) external returns (uint256)",
    "function assignLawyer(uint256 _caseId, address _lawyer, string _role) external",
    "function assignJudge(uint256 _caseId, address _judge) external",
    "function cases(uint256) view returns (uint256 id, uint256 linkedFirId, string title, string accused, string filer, uint8 status, address assignedJudge, uint256 creationDate, address defence, address prosecution, uint256 nextSessionId, string metaData, address assignedClerk)",
    "function getCaseSigners(uint256 _caseId) view returns (address clerk, address judge, address defence, address prosecution)",
    "event CaseCreated(uint256 indexed caseId, string title, uint256 linkedFirId)"
];

const getClerkContract = async () => {
    if (!window.ethereum) throw new Error("No Wallet Found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(COURT_ADDR, COURT_ABI, signer);
};

export const clerkCreateCase = async (title, firId, metaData) => {
    const contract = await getClerkContract();

    console.log(`Creating case linked to FIR #${firId}...`);
    const tx = await contract.createCase(title, firId, metaData);
    const receipt = await tx.wait();

    // --- FIX START ---
    // We cannot assume the event is at logs[0] because internal calls might emit events too.
    // We iterate through all logs to find 'CaseCreated'.
    const event = receipt.logs.map(log => {
        try {
            return contract.interface.parseLog(log);
        } catch (e) {
            return null; // Ignore logs from other contracts (like FIRRegistry)
        }
    }).find(parsed => parsed && parsed.name === "CaseCreated");

    if (!event) throw new Error("CaseCreated event not found in receipt!");
    // --- FIX END ---

    return {
        txHash: tx.hash,
        caseId: event.args.caseId.toString()
    };
};

export const clerkAssignLawyer = async (caseId, lawyerAddress, role) => {
    const contract = await getClerkContract();
    // Solidity expects lowercase "defence" or "prosecution"
    const tx = await contract.assignLawyer(caseId, lawyerAddress, role.toLowerCase());
    return await tx.wait();
};

export const clerkAssignJudge = async (caseId, judgeAddress) => {
    const contract = await getClerkContract();
    const tx = await contract.assignJudge(caseId, judgeAddress);
    return await tx.wait();
};

export const getCaseParticipants = async (caseId) => {
    const contract = await getClerkContract();
    const signers = await contract.getCaseSigners(caseId);
    return {
        clerk: signers.clerk,
        judge: signers.judge,
        defence: signers.defence,
        prosecution: signers.prosecution
    };
};