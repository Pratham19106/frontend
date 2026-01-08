import { clerkCreateCase, clerkAssignJudge, clerkAssignLawyer, getCaseParticipants } from "./clerk.js";

const log = (msg) => {
    const box = document.getElementById("console");
    const time = new Date().toLocaleTimeString();
    box.innerHTML += `[${time}] ${msg}<br>`;
    box.scrollTop = box.scrollHeight;
};

// 1. Create Case Handler
document.getElementById("btnCreate").addEventListener("click", async () => {
    const title = document.getElementById("caseTitle").value;
    const firId = document.getElementById("firId").value;
    const meta = document.getElementById("metaData").value || "No Metadata";

    if (!title || !firId) return alert("Title and FIR ID required");

    log(`⏳ Creating case linked to FIR #${firId}...`);
    try {
        const result = await clerkCreateCase(title, firId, meta);
        log(`✅ <b>Success!</b> New Case ID: <b>${result.caseId}</b>`);
        log(`🔗 Tx: ${result.txHash.substring(0, 20)}...`);
    } catch (e) {
        log(`❌ Error: ${e.message}`);
        console.error(e);
    }
});

// 2. Assign Judge Handler
document.getElementById("btnAssignJudge").addEventListener("click", async () => {
    const id = document.getElementById("assignCaseId").value;
    const addr = document.getElementById("judgeAddr").value;

    log(`⏳ Assigning Judge to Case #${id}...`);
    try {
        await clerkAssignJudge(id, addr);
        log(`✅ Judge assigned successfully.`);
    } catch (e) {
        log(`❌ Error: ${e.reason || e.message}`);
    }
});

// 3. Assign Lawyer Handler
document.getElementById("btnAssignLawyer").addEventListener("click", async () => {
    const id = document.getElementById("assignCaseId").value;
    const addr = document.getElementById("lawyerAddr").value;
    const role = document.getElementById("lawyerRole").value;

    log(`⏳ Assigning ${role.toUpperCase()} to Case #${id}...`);
    try {
        await clerkAssignLawyer(id, addr, role);
        log(`✅ Lawyer assigned successfully.`);
    } catch (e) {
        log(`❌ Error: ${e.reason || e.message}`);
    }
});

// 4. Verify Data Handler
document.getElementById("btnCheck").addEventListener("click", async () => {
    const id = document.getElementById("queryId").value;
    log(`🔍 Fetching participants for Case #${id}...`);
    try {
        const p = await getCaseParticipants(id);
        const html = `
            <strong>Judge:</strong> ${p.judge}<br>
            <strong>Defence:</strong> ${p.defence}<br>
            <strong>Prosecution:</strong> ${p.prosecution}<br>
            <strong>Clerk:</strong> ${p.clerk}
        `;
        document.getElementById("participantView").innerHTML = html;
        log(`✅ Data retrieved.`);
    } catch (e) {
        log(`❌ Error fetching data.`);
    }
});