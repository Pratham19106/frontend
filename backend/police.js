import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

// --- Configuration ---
const firRegistryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const contractAbi = [
    // Writes
    "function fileFIR(string _stationId, string[] _ipcSections, string _ipfsCid, string _accused, string _filer, address _filedBy, bytes32 _contentHash) external returns (uint256)",
    "function addSupplementaryReport(uint256 _firId, string _ipfsCid, bytes32 _contentHash) external",

    // Reads
    "function getReportCount(uint256 _firId) view returns (uint256)",
    "function getIpcSections(uint256 _firId) view returns (string[])",
    "function firs(uint256) view returns (uint256 id, string stationId, string accused, string filer, bool isForwarded, address filedBy,)",
    "function allReports(uint256) view returns (string ipfsCid, bytes32 contentHash, uint256 timestamp, address filedBy, bool isSupplementary)",
    "function getallReportIds(uint256 _firId) view returns (uint256[] memory)",

    // Events
    "event FIRFiled(uint256 indexed firId, string stationId, string[] ipcSections)",
    "event SupplementaryFiled(uint256 indexed firId, uint256 reportId)"
];

// --- Internal Helper: Get Contract ---
const getContract = async (withSigner = false) => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    if (withSigner) {
        const signer = await provider.getSigner();
        return new ethers.Contract(firRegistryAddress, contractAbi, signer);
    }
    return new ethers.Contract(firRegistryAddress, contractAbi, provider);
};

// --- API Functions ---

/**
 * Files a new FIR
 */
export const fileFir = async (stationId, ipcSections, accused, filer, contentHash) => {
    try {
        const contract = await getContract(true);
        const ipfsCid = "wryuiyfdghjkhgfderyiolkhgftyujbgyu"; // Mock IPFS ID
        const signerAddress = await (await (new ethers.BrowserProvider(window.ethereum)).getSigner()).getAddress();

        // Note: Added _filedBy address parameter to match your Solidity function signature
        const tx = await contract.fileFIR(
            stationId,
            ipcSections,
            ipfsCid,
            accused,
            filer,
            signerAddress,
            contentHash
            , { gasLimit: 2100000 }
        );

        console.log("Transaction pending...", tx.hash);
        const receipt = await tx.wait();

        // Parsing the event to get the new FIR ID
        const event = receipt.logs.map(log => {
            try { return contract.interface.parseLog(log); } catch (e) { return null; }
        }).find(e => e && e.name === "FIRFiled");

        console.log("FIR Filed Successfully. ID:", event.args.firId.toString());
        return event.args.firId;
    } catch (error) {
        console.error("fileFir Error:", error);
        throw error;
    }
};

/**
 * Adds a supplementary report to an existing FIR
 */
export const addSupplementaryReport = async (firId, ipfsCid, contentHash) => {
    try {
        const contract = await getContract(true);
        const tx = await contract.addSupplementaryReport(firId, ipfsCid, contentHash);
        await tx.wait();
        console.log(`Supplementary report added to FIR #${firId}`);
    } catch (error) {
        console.error("addSupplementaryReport Error:", error);
        throw error;
    }
};

/**
 * Fetches basic FIR details
 */
export const getFirDetails = async (firId) => {
    try {
        const contract = await getContract();
        const data = await contract.firs(firId);
        return {
            id: data.id.toString(),
            stationId: data.stationId,
            accused: data.accused,
            filer: data.filer,
            isForwarded: data.isForwarded,
            filedBy: data.filedBy
        };
    } catch (error) {
        console.error("getFirDetails Error:", error);
    }
};

/**
 * Fetches all reports associated with an FIR
 */
export const getFirReports = async (firId) => {
    try {
        const contract = await getContract();
        const count = await contract.getReportCount(firId);
        let reports = [];

        // This is a simplified fetch; in production, consider mapping 
        // reportIndexes in Solidity to return all IDs at once.
        for (let i = 1; i <= count; i++) {
            const report = await contract.allReports(i);
            reports.push(report);
        }
        return reports;
    } catch (error) {
        console.error("getFirReports Error:", error);
    }
};

export const getAllReportDetails = async (firId) => {
    try {
        let contract = await getContract();

        // 1. Get the array of IDs
        const reportIds = await contract.getallReportIds(firId);

        // 2. Create an array of Promises
        const reportPromises = reportIds.map(async (id) => {
            const report = await contract.allReports(id);
            // Assuming report is a struct/object that contains ipfsCid
            return report.ipfsCid;
        });

        // 3. Wait for all promises to resolve
        const allIpfsCids = await Promise.all(reportPromises);

        return allIpfsCids;
    } catch (error) {
        console.error("Error fetching report details:", error);
        return [];
    }
}

/**
 * Real-time listener for new FIRs
 */
export const listenForFirs = async (callback) => {
    const contract = await getContract();
    contract.on("FIRFiled", (firId, stationId, ipcSections, event) => {
        callback({
            firId: firId.toString(),
            stationId,
            ipcSections,
            txHash: event.log.transactionHash
        });
    });
};