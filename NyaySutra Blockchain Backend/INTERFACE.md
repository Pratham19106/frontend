# BlockChain Interface Documentation

## Overview

this folder consists of the interfaces which will be used to interact with the deployed contracts

---

## File Structure

```
BlockChain_Interface/
├── clerk.js          # Clerk operations (case creation, assignments)
├── grantaccess.js    # Role management (grant/revoke roles)
├── judge.js          # Judge operations (scheduling, sessions)
└── police.js         # Police operations (FIR filing, reports)
```

---

## 1. clerk.js

### Purpose
Provides interface for court clerks to manage cases and assign judicial roles.

### Configuration
```javascript
const COURT_ADDR = $COURT_ADDR; // CourtSession contract address
```

### Key Functions

#### `clerkCreateCase(title, firId, metaData)`
**Purpose**: Create a new court case

**Parameters**:
- `title` (string): Case title/name
- `firId` (number): FIR ID to link case to (use 0 for independent cases)
- `metaData` (string): Additional JSON metadata about case

**Returns**: Promise
```javascript
{
  txHash: string,    // Transaction hash
  caseId: string     // New case ID created
}
```
**Process**:
1. Calls `CourtSession.createCase()` on blockchain
2. Waits for transaction confirmation
3. Parses `CaseCreated` event from receipt
4. Returns case ID and transaction hash
---

#### `clerkAssignLawyer(caseId, lawyerAddress, role)`
**Purpose**: Assign defence or prosecution lawyer to case

**Parameters**:
- `caseId` (number): Case ID
- `lawyerAddress` (string): Ethereum address of lawyer
- `role` (string): "defence" or "prosecution" (case-insensitive)

**Returns**: Promise - Transaction receipt

---

#### `clerkAssignJudge(caseId, judgeAddress)`
**Purpose**: Assign judge to case

**Parameters**:
- `caseId` (number): Case ID
- `judgeAddress` (string): Ethereum address of judge

**Returns**: Promise - Transaction receipt

---

#### `getCaseParticipants(caseId)`
**Purpose**: Fetch all assigned participants for a case

**Parameters**:
- `caseId` (number): Case ID

**Returns**: Promise
```javascript
{
  clerk: string,        // Clerk's Ethereum address
  judge: string,        // Judge's Ethereum address
  defence: string,      // Defence lawyer's address
  prosecution: string   // Prosecution lawyer's address
}
```
---

### ABI Reference
```javascript
"function createCase(string _title, uint256 _firId, string _metaData) external returns (uint256)"
"function assignLawyer(uint256 _caseId, address _lawyer, string _role) external"
"function assignJudge(uint256 _caseId, address _judge) external"
"function cases(uint256) view returns (...)"
"function getCaseSigners(uint256 _caseId) view returns (...)"
"event CaseCreated(uint256 indexed caseId, string title, uint256 linkedFirId)"
```

---

## 2. grantaccess.js

### Purpose
Centralized role management interface. Allows admins to grant roles like POLICE_ROLE, JUDGE_ROLE, etc.

### Configuration
```javascript
const accessControlAddress = $accessControlAddress; // CourtAccessControl address
```

### Key Functions

#### `grantAccess()`
**Purpose**: Grant POLICE_ROLE to current connected wallet

**Parameters**: None

**Returns**: Promise - Void (logs transaction)


**Process**:
1. Connects to MetaMask wallet
2. Fetches POLICE_ROLE constant from contract
3. Gets current user's address
4. Calls `grantRole(POLICE_ROLE, userAddress)`
5. Waits for transaction confirmation

---

### ABI Reference
```javascript
// Role Constants
"function DEFAULT_ADMIN_ROLE() view returns (bytes32)"
"function JUDGE_ROLE() view returns (bytes32)"
"function LAWYER_ROLE() view returns (bytes32)"
"function CLERK_ROLE() view returns (bytes32)"
"function POLICE_ROLE() view returns (bytes32)"
"function COURT_SYSTEM_ROLE() view returns (bytes32)"

// Role Management
"function grantRole(bytes32 role, address account) external"
"function revokeRole(bytes32 role, address account) external"
"function hasRole(bytes32 role, address account) view returns (bool)"

// Custom View Functions
"function isJudge(address _user) view returns (bool)"
"function isLawyer(address _user) view returns (bool)"
"function isPolice(address _user) view returns (bool)"
"function isCourtSytem(address _user) view returns (bool)"
```

---

### Role Constants
Each role is a keccak256 hash:
- `JUDGE_ROLE = keccak256("JUDGE_ROLE")`
- `LAWYER_ROLE = keccak256("LAWYER_ROLE")`
- `CLERK_ROLE = keccak256("CLERK_ROLE")`
- `POLICE_ROLE = keccak256("POLICE_ROLE")`
- `COURT_SYSTEM_ROLE = keccak256("COURT_SYSTEM_ROLE")`

---

## 3. judge.js

### Purpose
Provides interface for judges to manage court sessions and record proceedings.

### Configuration
```javascript
const COURT_ADDR = $COURT_ADDR; // CourtSession contract
```

### Key Functions

#### `judgeScheduleHearing(caseId, unixTimestamp, description)`
**Purpose**: Schedule court hearing for a case

**Parameters**:
- `caseId` (number): Case ID
- `unixTimestamp` (number): Unix timestamp of scheduled hearing
- `description` (string): Hearing agenda/description

**Returns**: Promise - Transaction receipt

---

#### `judgeStartHearing(caseId)`
**Purpose**: Mark the start of a court session

**Parameters**:
- `caseId` (number): Case ID

**Returns**: Promise - Transaction receipt

**Example**:
```javascript
await judgeStartHearing(1);
console.log("Hearing started, recording begins");
```

**Blockchain Action**: Records `block.timestamp` as session start time

---

#### `judgeEndHearing(caseId, ipfsCid, isAdjourned)`
**Purpose**: End court session and record proceedings

**Parameters**:
- `caseId` (number): Case ID
- `ipfsCid` (string): IPFS content identifier of session recording/transcript
- `isAdjourned` (boolean): true if hearing adjourned, false if concluded

**Returns**: Promise - Transaction receipt

**Blockchain Action**:
- Records IPFS reference for session proceedings
- Records adjournment status
- Records `block.timestamp` as session end time

---

#### `getSessionRecord(caseId, sessionId)`
**Purpose**: Fetch details of a completed session

**Parameters**:
- `caseId` (number): Case ID
- `sessionId` (number): Session number

**Returns**: Promise
```javascript
{
  ipfsCid: string,           // IPFS hash of recording/transcript
  adjourned: boolean,        // Whether hearing was adjourned
  start: string,             // Formatted start datetime
  end: string                // Formatted end datetime or "In Progress (Live)"
}
```

---

### ABI Reference
```javascript
"function scheduleSession(uint256 _caseId, uint256 _date, string _desc) external"
"function startSession(uint256 _caseId) external"
"function endSession(uint256 _caseId, string _ipfsCid, bool _isAdjourned) external"
"function setCaseStatus(uint256 _caseId, uint8 _status) external"
"function getNextSessionDetails(uint256 _caseId) view returns (tuple(...))"
"function getSessionDetails(uint256 _caseId, uint256 _sessionId) view returns (tuple(...))"
```

---

## 4. police.js

### Purpose
Provides interface for police officers to file FIRs and add supplementary reports.

### Configuration
```javascript
const firRegistryAddress = $firRegistryAddress; // FIRRegistry contract
```

### Key Functions

#### `fileFir(stationId, ipcSections, accused, filer, contentHash)`
**Purpose**: File a new First Information Report (FIR)

**Parameters**:
- `stationId` (string): Police station identifier (e.g., "MUMBAI_NORTH_01")
- `ipcSections` (array): Array of IPC section numbers (e.g., ["420", "498A"])
- `accused` (string): Name of accused person
- `filer` (string): Name of person filing complaint
- `contentHash` (bytes32): Keccak256 hash of FIR document

**Returns**: Promise - FIR ID (BigInt)

**Process**:
1. Gets signer from MetaMask
2. Generates mock IPFS CID
3. Calls `FIRRegistry.fileFIR()` with gas limit
4. Waits for transaction confirmation
5. Parses `FIRFiled` event from receipt
6. Returns FIR ID

---

#### `addSupplementaryReport(firId, ipfsCid, contentHash)`
**Purpose**: Add supplementary report/evidence to existing FIR

**Parameters**:
- `firId` (number): ID of existing FIR
- `ipfsCid` (string): IPFS hash of supplementary document
- `contentHash` (bytes32): Keccak256 hash for verification

**Returns**: Promise - Void (confirmation message logged)

**Restrictions**:
- FIR must not be forwarded to court (immutable after forwarding)
- Requires POLICE_ROLE

---

#### `getFirDetails(firId)`
**Purpose**: Fetch FIR details

**Parameters**:
- `firId` (number): FIR ID

**Returns**: Promise
```javascript
{
  id: string,          // FIR ID
  stationId: string,   // Police station
  accused: string,     // Accused name
  filer: string,       // Complainant name
  isForwarded: boolean,// Forwarded to court?
  filedBy: string      // Officer's address
}
```

---

#### `getIpcSections(firId)`
**Purpose**: Get IPC sections for a FIR

**Parameters**:
- `firId` (number): FIR ID

**Returns**: Promise - Array of IPC section strings

**Example**:
```javascript
const sections = await getIpcSections(1);
console.log(`IPC Sections: ${sections.join(", ")}`); // "304, 506"
```

---

#### `getReportCount(firId)`
**Purpose**: Get number of reports (original + supplementary) for FIR

**Parameters**:
- `firId` (number): FIR ID

**Returns**: Promise - Number of reports

**Example**:
```javascript
const count = await getReportCount(1);
console.log(`Total reports: ${count}`);
```
---

#### `getAllReportIds(firId)`
**Purpose**: Get all report IDs associated with FIR

**Parameters**:
- `firId` (number): FIR ID

**Returns**: Promise - Array of report IDs

**Example**:
```javascript
const reportIds = await getAllReportIds(1);
console.log(`Report IDs: ${reportIds.join(", ")}`);
```

---

### ABI Reference
```javascript
// Write Functions
"function fileFIR(string _stationId, string[] _ipcSections, string _ipfsCid, string _accused, string _filer, address _filedBy, bytes32 _contentHash) external returns (uint256)"
"function addSupplementaryReport(uint256 _firId, string _ipfsCid, bytes32 _contentHash) external"

// Read Functions
"function getReportCount(uint256 _firId) view returns (uint256)"
"function getIpcSections(uint256 _firId) view returns (string[])"
"function firs(uint256) view returns (...)"
"function allReports(uint256) view returns (...)"
"function getallReportIds(uint256 _firId) view returns (uint256[])"

// Events
"event FIRFiled(uint256 indexed firId, string stationId, string[] ipcSections)"
"event SupplementaryFiled(uint256 indexed firId, uint256 reportId)"
```

---