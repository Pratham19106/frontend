// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "lib/openzeppelin-contracts/contracts/access/AccessControl.sol";

contract CourtAccessControl is AccessControl {
    bytes32 public constant JUDGE_ROLE = keccak256("JUDGE_ROLE");
    bytes32 public constant LAWYER_ROLE = keccak256("LAWYER_ROLE");
    bytes32 public constant CLERK_ROLE = keccak256("CLERK_ROLE");
    bytes32 public constant POLICE_ROLE = keccak256("POLICE_ROLE");
    bytes32 public constant COURT_SYSTEM_ROLE = keccak256("COURT_SYSTEM_ROLE");

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function isJudge(address _user) external view returns (bool) {
        return hasRole(JUDGE_ROLE, _user);
    }

    function isLawyer(address _user) external view returns (bool) {
        return hasRole(LAWYER_ROLE, _user);
    }

    function isPolice(address _user) external view returns (bool) {
        return hasRole(POLICE_ROLE, _user);
    }

    function isCourtSytem(address _user) external view returns (bool) {
        return hasRole(COURT_SYSTEM_ROLE, _user);
    }
}
