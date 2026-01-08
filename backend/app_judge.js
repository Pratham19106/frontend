import { judgeScheduleHearing, judgeStartHearing, judgeEndHearing, getSessionRecord, getCaseParticipants } from "./judge.js";

const log = (msg) => {
    const box = document.getElementById("statusBox");
    const time = new Date().toLocaleTimeString();
    box.innerHTML += `<span style="color: #f1c40f">[${time}]</span> ${msg}<br>`;
    box.scrollTop = box.scrollHeight;
};

// 1. Schedule Handler
document.getElementById("btnSchedule").addEventListener("click", async () => {
    const id = document.getElementById("schedCaseId").value;
    const desc = document.getElementById("schedDesc").value;
    const dateInput = document.getElementById("schedDate").value;

    if (!id || !dateInput) return alert("Missing fields");

    // Convert Local Date Input -> Unix Timestamp (Seconds)
    const unixTime = Math.floor(new Date(dateInput).getTime() / 1000);

    log(`Scheduling Case #${id} for timestamp: ${unixTime}...`);
    try {
        await judgeScheduleHearing(id, unixTime, desc);
        log(`✅ Session Scheduled successfully.`);
    } catch (e) {
        log(`❌ Error: ${e.reason || e.message}`);
    }
});

// 2. Start Handler
document.getElementById("btnStart").addEventListener("click", async () => {
    const id = document.getElementById("startCaseId").value;
    log(`Attempting to start session for Case #${id}...`);
    try {
        await judgeStartHearing(id);
        log(`⚡ Session Started! Timer is running on-chain.`);
    } catch (e) {
        log(`❌ Error: ${e.reason || e.message}`);
    }
});

// 3. End Handler
document.getElementById("btnEnd").addEventListener("click", async () => {
    const id = document.getElementById("endCaseId").value;
    const cid = document.getElementById("endCid").value || "QmEmpty";
    const adjourned = document.getElementById("isAdjourned").value === "true";

    log(`Concluding session for Case #${id}...`);
    try {
        await judgeEndHearing(id, cid, adjourned);
        log(`🏁 Session Ended. Transcript recorded.`);
    } catch (e) {
        log(`❌ Error: ${e.reason || e.message}`);
    }
});

// 4. View Record Handler
document.getElementById("btnCheck").addEventListener("click", async () => {
    const cid = document.getElementById("queryCaseId").value;
    const sid = document.getElementById("querySessionId").value;

    log(`Fetching record for Case #${cid}, Session #${sid}...`);
    try {
        const data = await getSessionRecord(cid, sid);
        document.getElementById("recordResult").innerHTML = `
            <strong>Start:</strong> ${data.start}<br>
            <strong>End:</strong> ${data.end}<br>
            <strong>Adjourned:</strong> ${data.adjourned}<br>
            <strong>IPFS:</strong> ${data.ipfsCid}
        `;
        log(`✅ Data Retrieved.`);
    } catch (e) {
        log(`❌ Fetch Error: ${e.message}`);
    }
});