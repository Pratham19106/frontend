import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
import { fileFir, addSupplementaryReport, getFirDetails, listenForFirs, getAllReportDetails } from "./police.js";
import { grantAccess } from "./grantaccess.js";
const logElement = document.getElementById("log");

// Helper to update the UI log
document.querySelector("#gid").addEventListener("click", grantAccess);
const logger = (msg, color = "#ecf0f1") => {
    const time = new Date().toLocaleTimeString();
    logElement.innerHTML += `<span style="color: ${color}">[${time}] ${msg}</span><br>`;
    logElement.scrollTop = logElement.scrollHeight;
};

// 1. Initial Setup: Handle Connection Display
const init = async () => {
    if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        document.getElementById("walletAddress").innerText = await signer.getAddress();
        logger("Wallet connected. Ready to serve justice.");
    }

    // Start live listener
    listenForFirs((data) => {
        logger(`🚨 NEW FIR DETECTED ON NETWORK! ID: ${data.firId} (Station: ${data.stationId})`, "#f1c40f");
    });
};

// 2. Action: File FIR
document.getElementById("btnFile").addEventListener("click", async () => {
    const sId = document.getElementById("stationId").value.toString();
    const ipc = document.getElementById("ipcSections").value.split(",");
    const accused = document.getElementById("accused").value;
    const filer = document.getElementById("filer").value;

    // Generate a dummy content hash for testing
    const contentHash = "0x56570de287d73cd1cb6092bb8fdee6173974955fdef345ae579ee9f475ea7432";

    logger(`Initiating FIR filing for ${accused}...`);
    try {
        const firId = await fileFir(sId, ipc, accused, filer, contentHash);
        logger(`✅ FIR successfully recorded! ID: ${firId}`, "#2ecc71");
    } catch (e) {
        logger(`❌ Error: ${e.message}`, "#e74c3c");
    }
});

// 3. Action: Get Details
document.getElementById("btnQuery").addEventListener("click", async () => {
    const id = document.getElementById("queryId").value;
    logger(`Querying FIR #${id}...`);
    const details = await getFirDetails(id);
    if (details) {
        logger(`Result: Accused: ${details.accused}, Filer: ${details.filer}, Forwarded: ${details.isForwarded}`, "#3498db");
    }
    console.log(await getAllReportDetails(id));
});

// 4. Action: Add Supplementary
document.getElementById("btnUpdate").addEventListener("click", async () => {
    const id = document.getElementById("targetFirId").value;
    const cid = document.getElementById("suppIpfs").value || "QmSupp_Default";
    const hash = "0x56570de287d73cd1cb6092bb8fdee6173974955fdef345ae579ee9f475ea7432";

    logger(`Adding supplementary report to FIR #${id}...`);
    try {
        await addSupplementaryReport(id, cid, hash);
        logger(`✅ Supplementary report added to FIR #${id}`, "#2ecc71");
    } catch (e) {
        logger(`❌ Error: ${e.message}`, "#e74c3c");
    }
});

init();