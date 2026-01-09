import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const COURT_ADDR = "";
const JUDGE_ABI = [
    "function scheduleSession(uint256 _caseId, uint256 _date, string _desc) external",
    "function startSession(uint256 _caseId) external",
    "function endSession(uint256 _caseId, string _ipfsCid, bool _isAdjourned) external",
    "function setCaseStatus(uint256 _caseId, uint8 _status) external",
    "function getNextSessionDetails(uint256 _caseId) view returns (tuple(uint256 sessionId, uint256 scheduledDate, string description, bool isConcluded))",
    "function getSessionDetails(uint256 _caseId, uint256 _sessionId) view returns (tuple(uint256 caseId, uint256 sessionId, string ipfsCid, bool isAdjourned, uint256 startTimestamp, uint256 endTimestamp))"
];

const getJudgeContract = async () => {
    if (!window.ethereum) throw new Error("Wallet not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(COURT_ADDR, JUDGE_ABI, signer);
};

export const judgeScheduleHearing = async (caseId, unixTimestamp, description) => {
    const contract = await getJudgeContract();
    console.log(`Scheduling Case #${caseId} for ${new Date(unixTimestamp * 1000).toLocaleString()}`);
    // Ensure timestamp is an integer string or BigInt to prevent float errors
    const tx = await contract.scheduleSession(caseId, BigInt(unixTimestamp), description);
    return await tx.wait();
};

export const judgeStartHearing = async (caseId) => {
    const contract = await getJudgeContract();
    const tx = await contract.startSession(caseId);
    return await tx.wait();
};

export const judgeEndHearing = async (caseId, ipfsCid, isAdjourned) => {
    const contract = await getJudgeContract();
    const tx = await contract.endSession(caseId, ipfsCid, isAdjourned);
    return await tx.wait();
};

export const getSessionRecord = async (caseId, sessionId) => {
    const contract = await getJudgeContract();
    const s = await contract.getSessionDetails(caseId, sessionId);

    // Fix: Handle BigInt comparison safely
    const endTime = s.endTimestamp;
    const isEnded = endTime > 0n;

    return {
        ipfsCid: s.ipfsCid,
        adjourned: s.isAdjourned,
        // Convert BigInt to Number for Date constructor
        start: new Date(Number(s.startTimestamp) * 1000).toLocaleString(),
        end: isEnded ? new Date(Number(endTime) * 1000).toLocaleString() : "In Progress (Live)"
    };
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