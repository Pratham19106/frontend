// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CourtAccessControl.sol";

contract FIRRegistry {
    struct Report {
        string ipfsCid; // Encrypted PDF
        bytes32 contentHash; // Integrity Check
        uint256 timestamp;
        address filedBy; // Officer ID
        bool isSupplementary; // True if it's an update
    }

    struct FIR {
        uint256 id;
        string stationId;
        string accused;
        string filer;
        string[] ipcSections;
        bool isForwarded;
        address filedBy;
        uint256[] reportIndexes;
    }

    CourtAccessControl public accessControl;

    uint256 private _firIds;
    mapping(uint256 => FIR) public firs;
    mapping(uint256 => Report) public allReports;
    uint256 private _reportIds;

    event FIRFiled(
        uint256 indexed firId,
        string stationId,
        string[] ipcSections
    );
    event SupplementaryFiled(uint256 indexed firId, uint256 reportId);
    event FIRForwarded(uint256 indexed firId, uint256 caseId);

    modifier onlyPolice() {
        require(accessControl.isPolice(msg.sender), "Caller is not Police");
        _;
    }

    modifier onlyClerk() {
        require(
            accessControl.hasRole(accessControl.CLERK_ROLE(), msg.sender),
            "Caller is not Clerk"
        );
        _;
    }
    modifier onlyCourtSession() {
        require(
            accessControl.isCourtSytem(msg.sender),
            "Caller is not the valid Court Session"
        );
        _;
    }

    constructor(address _accessControl) {
        accessControl = CourtAccessControl(_accessControl);
    }

    // Step 2: Register FIR (Original)
    //accused
    //filer
    function fileFIR(
        string calldata _stationId,
        string[] calldata _ipcSections, // <--- CHANGED: Array Input
        string calldata _ipfsCid,
        string calldata _accused,
        string calldata _filer,
        address _filedBy,
        bytes32 _contentHash
    ) external onlyPolice returns (uint256) {
        _firIds++;
        uint256 newFirId = _firIds;
        _reportIds++;
        allReports[_reportIds] = Report({
            ipfsCid: _ipfsCid,
            contentHash: _contentHash,
            timestamp: block.timestamp,
            filedBy: msg.sender,
            isSupplementary: false
        });

        uint256[] memory initReports = new uint256[](1);
        initReports[0] = _reportIds;

        firs[newFirId] = FIR({
            id: newFirId,
            stationId: _stationId,
            accused: _accused,
            filer: _filer,
            ipcSections: _ipcSections,
            isForwarded: false,
            filedBy: msg.sender,
            reportIndexes: initReports
        });

        emit FIRFiled(newFirId, _stationId, _ipcSections);
        return newFirId;
    }

    // Step 4: Add Supplementary Report (Append-Only)
    function addSupplementaryReport(
        uint256 _firId,
        string calldata _ipfsCid,
        bytes32 _contentHash
    ) external onlyPolice {
        require(firs[_firId].id != 0, "FIR does not exist");
        require(
            !firs[_firId].isForwarded,
            "Cannot update after forwarding to Court"
        );

        _reportIds++;
        allReports[_reportIds] = Report({
            ipfsCid: _ipfsCid,
            contentHash: _contentHash,
            timestamp: block.timestamp,
            filedBy: msg.sender,
            isSupplementary: true
        });

        firs[_firId].reportIndexes.push(_reportIds);
        emit SupplementaryFiled(_firId, _reportIds);
    }

    function markForwarded(
        uint256 _firId,
        uint256 _caseId
    ) external onlyCourtSession {
        require(firs[_firId].id != 0, "FIR does not exist");
        require(!firs[_firId].isForwarded, "Already forwarded");

        firs[_firId].isForwarded = true;
        emit FIRForwarded(_firId, _caseId);
    }

    function getReportCount(uint256 _firId) external view returns (uint256) {
        return firs[_firId].reportIndexes.length;
    }

    function getIpcSections(
        uint256 _firId
    ) external view returns (string[] memory) {
        return firs[_firId].ipcSections;
    }

    function getallReportIds(
        uint256 _firId
    ) external view returns (uint256[] memory) {
        return firs[_firId].reportIndexes;
    }
}
