// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CourtAccessControl.sol";
import "../src/FIRRegistry.sol";
import "../src/CourtSession.sol";
import "../src/EvidenceStaging.sol";

contract DeployScript is Script {
    function run() external {
        // --- INTERACTIVE PROMPT ---
        // This will pause execution and ask for your key in the terminal
        uint256 deployerPrivateKey = vm.promptSecretUint(
            "Enter Deployer Private Key:"
        );

        address deployer = vm.addr(deployerPrivateKey);
        console.log("--------------------------------------------------");
        console.log("Deploying with account:", deployer);
        console.log("--------------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Access Control
        CourtAccessControl access = new CourtAccessControl();
        console.log("CourtAccessControl :", address(access));

        // 2. Deploy FIR Registry
        FIRRegistry fir = new FIRRegistry(address(access));
        console.log("FIRRegistry        :", address(fir));

        // 3. Deploy Court Session
        CourtSession session = new CourtSession(address(access), address(fir));
        console.log("CourtSession       :", address(session));

        // 4. Deploy Evidence Staging
        EvidenceStaging staging = new EvidenceStaging(address(access));
        console.log("EvidenceStaging    :", address(staging));

        // --- CONFIGURATION ---
        // Link CourtSession to the System Role
        access.grantRole(access.COURT_SYSTEM_ROLE(), address(session));

        // Grant all roles to the deployer for easier testing
        access.grantRole(access.CLERK_ROLE(), deployer);
        access.grantRole(access.JUDGE_ROLE(), deployer);
        access.grantRole(access.POLICE_ROLE(), deployer);
        access.grantRole(access.LAWYER_ROLE(), deployer);

        console.log("--------------------------------------------------");
        console.log("CONFIG: Roles assigned to deployer.");
        console.log("--------------------------------------------------");

        vm.stopBroadcast();
    }
}
