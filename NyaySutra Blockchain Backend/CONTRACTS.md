# Smart Contracts Documentation

## Overview
this is the overview of all the neccesarry blockchain contracts that will be needed and a breif summary of the contracts 

---

## 1. CourtAccessControl.sol

### Purpose
Central role management contract that extends OpenZeppelin's `AccessControl` to manage permissions for different judicial system participants.

### Contract Details
```solidity
contract CourtAccessControl is AccessControl
```

### Key Components

#### Role Definitions
```solidity
bytes32 public constant JUDGE_ROLE = keccak256("JUDGE_ROLE");
bytes32 public constant LAWYER_ROLE = keccak256("LAWYER_ROLE");
bytes32 public constant CLERK_ROLE = keccak256("CLERK_ROLE");
bytes32 public constant POLICE_ROLE = keccak256("POLICE_ROLE");
bytes32 public constant COURT_SYSTEM_ROLE = keccak256("COURT_SYSTEM_ROLE");
```

#### Functions

| Function | Visibility | Returns | Purpose |
|----------|-----------|---------|---------|
| `isJudge(address)` | external, view | bool | Check if address has JUDGE_ROLE |
| `isLawyer(address)` | external, view | bool | Check if address has LAWYER_ROLE |
| `isPolice(address)` | external, view | bool | Check if address has POLICE_ROLE |
| `isCourtSytem(address)` | external, view | bool | Check if address has COURT_SYSTEM_ROLE |

#### Inherited from AccessControl
- `grantRole(bytes32 role, address account)`
- `revokeRole(bytes32 role, address account)`
- `hasRole(bytes32 role, address account)`
- `renounceRole(bytes32 role, address account)`

### Use Cases
- Administrative role assignment for new participants
- Role verification in other contracts
- Centralized permission management

---

## 2. FIRRegistry.sol

### Purpose
Manages First Information Reports (FIRs) - the initial police report filed when a crime is reported. Provides immutable record of police investigations with support for supplementary reports.

### Contract Details
```solidity
contract FIRRegistry
```

### Key Structures

#### Report Struct
```solidity
struct Report {
    string ipfsCid;          // IPFS hash of encrypted PDF document
    bytes32 contentHash;     // Keccak256 hash for integrity verification
    uint256 timestamp;       // Block timestamp when filed
    address filedBy;         // Police officer address
    bool isSupplementary;    // Flag: true for updates, false for original
}
```

#### FIR Struct
```solidity
struct FIR {
    uint256 id;              // Unique FIR identifier
    string stationId;        // Police station identifier
    string accused;          // Name of accused person
    string filer;            // Name of person filing report
    string[] ipcSections;    // Array of applicable IPC sections (e.g., "420", "304")
    bool isForwarded;        // Immutable flag: true once forwarded to court
    address filedBy;         // Police officer who filed FIR
    uint256[] reportIndexes; // Array of all report IDs (original + supplementary)
}
```

#### Key Variables
```solidity
mapping(uint256 => FIR) public firs;              // FIR ID → FIR details
mapping(uint256 => Report) public allReports;    // Report ID → Report details
uint256 private _firIds;                         // Auto-incrementing FIR counter
uint256 private _reportIds;                      // Auto-incrementing Report counter
```

### Functions

#### Write Functions (State-Changing)

##### `fileFIR()`
**Signature**: `function fileFIR(string _stationId, string[] _ipcSections, string _ipfsCid, string _accused, string _filer, address _filedBy, bytes32 _contentHash) external onlyPolice returns (uint256)`

**Purpose**: File a new FIR with initial report

**Access**: Only accounts with POLICE_ROLE

**Parameters**:
- `_stationId`: Police station identifier
- `_ipcSections`: Array of IPC sections (e.g., ["420", "498A"])
- `_ipfsCid`: IPFS content identifier of encrypted PDF
- `_accused`: Name of accused person
- `_filer`: Name of person filing report
- `_filedBy`: Address of filing police officer
- `_contentHash`: Keccak256 hash of document for verification

**Returns**: New FIR ID

**Events**: Emits `FIRFiled(firId, stationId, ipcSections)`

---

##### `addSupplementaryReport()`
**Signature**: `function addSupplementaryReport(uint256 _firId, string _ipfsCid, bytes32 _contentHash) external onlyPolice`

**Purpose**: Add supplementary report to existing FIR

**Access**: Only accounts with POLICE_ROLE

**Parameters**:
- `_firId`: ID of existing FIR
- `_ipfsCid`: IPFS hash of supplementary document
- `_contentHash`: Document hash for integrity check

**Restrictions**:
- FIR must exist
- FIR must NOT be forwarded to court (immutable after forwarding)

**Events**: Emits `SupplementaryFiled(firId, reportId)`

---

##### `markForwarded()`
**Signature**: `function markForwarded(uint256 _firId, uint256 _caseId) external onlyCourtSession`

**Purpose**: Mark FIR as forwarded to court (makes it immutable)

**Access**: Only accounts with COURT_SYSTEM_ROLE (CourtSession contract)

**Parameters**:
- `_firId`: FIR to mark as forwarded
- `_caseId`: Corresponding court case ID

**Events**: Emits `FIRForwarded(firId, caseId)`

---

#### Read Functions (View)

| Function | Returns | Purpose |
|----------|---------|---------|
| `getReportCount(uint256 _firId)` | uint256 | Number of reports (original + supplementary) for a FIR |
| `getIpcSections(uint256 _firId)` | string[] | IPC sections applicable to a FIR |
| `getallReportIds(uint256 _firId)` | uint256[] | All report IDs associated with a FIR |

### Workflow Example
```
1. Police files FIR #1 (fileFIR)
   └─ Creates FIR with initial Report #1
   
2. Police adds supplementary info (addSupplementaryReport)
   └─ Adds Report #2 to FIR #1
   
3. Clerk creates court case from FIR (CourtSession)
   └─ Calls markForwarded(1, caseId)
   └─ FIR #1 now immutable, no more reports can be added
```

---

## 3. CourtSession.sol

### Purpose
Central case management contract. Handles case creation, role assignments, session scheduling, and recording of court proceedings.

### Key Structures

#### Case Enum
```solidity
enum CaseStatus {
    CREATED,        // 0 - Case just created
    PRE_TRIAL,      // 1 - Pre-trial motions phase
    IN_SESSION,     // 2 - Active court proceedings
    CLOSED          // 3 - Case concluded
}
```

#### Case Struct
```solidity
struct Case {
    uint256 id;              // Unique case identifier
    uint256 linkedFirId;     // Reference to original FIR (0 if no FIR)
    string title;            // Case title/name
    string accused;          // Name of accused (from linked FIR)
    string filer;            // Name of complainant (from linked FIR)
    CaseStatus status;       // Current case status
    address assignedJudge;   // Ethereum address of assigned judge
    uint256 creationDate;    // Block timestamp of case creation
    address defence;         // Address of defence lawyer
    address prosecution;     // Address of prosecution lawyer
    uint256 nextSessionId;   // ID of next scheduled session
    string metaData;         // Additional case metadata (JSON)
    address assignedClerk;   // Clerk who created the case
}
```

#### SessionDetails Struct
```solidity
struct SessionDetails {
    uint256 sessionId;       // Session number for this case
    uint256 scheduledDate;   // Unix timestamp of scheduled hearing
    string description;      // Hearing description/agenda
    bool isConcluded;        // Whether hearing concluded
}
```

#### CurrSession Struct
```solidity
struct CurrSession {
    uint256 caseId;              // Associated case ID
    uint256 sessionId;           // Session number
    string ipfsCid;              // IPFS hash of session recording/transcript
    bool isAdjourned;            // True if hearing adjourned
    uint256 startTimestamp;      // When session started (block.timestamp)
    uint256 endTimestamp;        // When session ended (0 if ongoing)
}
```

#### Key Variables
```solidity
mapping(uint256 => Case) public cases;                          // Case ID → Case details
mapping(uint256 => address) public assignedJudgeMap;           // Case ID → Judge address
mapping(uint256 => mapping(string => address)) public isAssignedLawyer;  // Case → Role → Lawyer
mapping(uint256 => mapping(uint256 => SessionDetails)) public NextSessions;  // Case → Session ID → Details
mapping(uint256 => mapping(uint256 => CurrSession)) public Sessions;  // Case → Session ID → Current session
```

### Functions

#### Write Functions

##### `createCase()`
**Signature**: `function createCase(string _title, uint256 _firId, string _metaData) external onlyClerk returns (uint256)`

**Purpose**: Create new court case (optionally linked to FIR)

**Access**: Only accounts with CLERK_ROLE

**Parameters**:
- `_title`: Case title
- `_firId`: FIR ID to link (0 for independent cases)
- `_metaData`: Additional JSON metadata

**Returns**: New case ID

**Actions**:
- Increments case counter
- Marks FIR as forwarded if _firId > 0
- Copies accused/filer from FIR if linked
- Creates Case with CREATED status
- Records clerk who created case

**Events**: Emits `CaseCreated(caseId, title, firId)`

---

##### `assignJudge()`
**Signature**: `function assignJudge(uint256 _caseId, address _judge) external onlyClerk`

**Purpose**: Assign judge to case

**Access**: Only CLERK_ROLE

**Parameters**:
- `_caseId`: Case ID
- `_judge`: Ethereum address of judge

**Validation**: Judge must have JUDGE_ROLE

**Events**: Emits `JudgeAssigned(caseId, judge)`

---

##### `assignLawyer()`
**Signature**: `function assignLawyer(uint256 _caseId, address _lawyer, string _role) external onlyClerk`

**Purpose**: Assign lawyer to case as defence or prosecution

**Access**: Only CLERK_ROLE

**Parameters**:
- `_caseId`: Case ID
- `_lawyer`: Lawyer address
- `_role`: "defence" or "prosecution"

**Validation**:
- Lawyer must have LAWYER_ROLE
- Cannot assign same lawyer twice to same role

**Events**: Emits `LawyerAssigned(caseId, lawyer, role)`

---

##### `scheduleSession()`
**Signature**: `function scheduleSession(uint256 _caseId, uint256 _date, string _desc) external onlyAssignedJudge(caseId)`

**Purpose**: Schedule court session/hearing

**Access**: Only the judge assigned to the case

**Parameters**:
- `_caseId`: Case ID
- `_date`: Unix timestamp of scheduled date
- `_desc`: Session description/agenda

**Actions**:
- Creates SessionDetails for next session
- Updates case status to IN_SESSION
- Increments nextSessionId counter

**Events**: Emits `NextSessionscheduled(caseId, sessionId, date)`

---

##### `startSession()`
**Signature**: `function startSession(uint256 _caseId) external onlyAssignedJudge(caseId)`

**Purpose**: Mark start of court session

**Access**: Only assigned judge

**Parameters**:
- `_caseId`: Case ID

**Actions**:
- Creates CurrSession entry
- Records block.timestamp as startTimestamp
- Sets ipfsCid and endTimestamp to defaults

---

##### `endSession()`
**Signature**: `function endSession(uint256 _caseId, string _ipfsCid, bool _isAdjourned) external onlyAssignedJudge(caseId)`

**Purpose**: End court session and record proceedings

**Access**: Only assigned judge

**Parameters**:
- `_caseId`: Case ID
- `_ipfsCid`: IPFS hash of session transcript/recording
- `_isAdjourned`: true if adjourned, false if concluded

**Actions**:
- Validates session was started
- Records IPFS content hash
- Sets endTimestamp to current block.timestamp
- Records adjournment status

**Events**: Emits `SessionPublished(caseId, sessionId, ipfsCid)`

---

##### `setCaseStatus()`
**Signature**: `function setCaseStatus(uint256 _caseId, CaseStatus _status) external onlyAssignedJudge(caseId)`

**Purpose**: Update case status

**Access**: Only assigned judge

**Parameters**:
- `_caseId`: Case ID
- `_status`: New status (CREATED, PRE_TRIAL, IN_SESSION, CLOSED)

**Events**: Emits `CaseStatusChanged(caseId, status)`

---

#### Read Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `getCaseSigners(uint256 _caseId)` | (clerk, judge, defence, prosecution) | Get all assigned participants |
| `getAssignedJudge(uint256 _caseId)` | address | Get judge for case |
| `isCaseActive(uint256 _caseId)` | bool | Check if case not CLOSED |
| `getNextSessionDetails(uint256 _caseId)` | SessionDetails | Get upcoming session info |
| `getSessionDetails(uint256 _caseId, uint256 _sessionId)` | CurrSession | Get past session details |

---

## 4. EvidenceStaging.sol

### Purpose
Manages evidence collection, submission, and review during court proceedings. 

### Key Structures

#### Submission Struct

```solidity
struct Submission {
    uint256 id;           // Unique submission ID
    uint256 caseId;       // Associated case ID
    address uploader;     // Address of person submitting evidence
    string cloudRef;      // Cloud storage reference (URL/CID)
    bytes32 fileHash;     // Keccak256 hash of file for integrity
    EvidenceType fileType;// DOCUMENT, AUDIO, or VIDEO
    Status status;        // PENDING, ACCEPTED, or REJECTED
    uint256 timestamp;    // Submission timestamp
    string metaData;      // Additional metadata (JSON)
}
```

### Authorization Model

Evidence can be submitted by:
1. **Lawyers**: Anyone with LAWYER_ROLE can submit evidence for any case
2. **Registered Participants**: Witnesses or parties registered by clerk for a specific case

### Functions

#### Write Functions

##### `registerCaseParticipants()`
**Signature**: `function registerCaseParticipants(uint256 _caseId, address[] _subjects) external onlyClerk`

**Purpose**: Register witnesses/parties who can submit evidence

**Access**: Only CLERK_ROLE

**Parameters**:
- `_caseId`: Case ID
- `_subjects`: Array of addresses to register

**Actions**: Sets `registeredParticipants[_caseId][address] = true` for each subject

---

##### `submitEvidence()`
**Signature**: `function submitEvidence(uint256 _caseId, string _cloudRef, bytes32 _fileHash, EvidenceType _fileType, string _metaData, bytes _lawyerSignature) external`

**Purpose**: Submit evidence for a case

**Access**: Anyone (authorization checked within function)

**Parameters**:
- `_caseId`: Case ID
- `_cloudRef`: Cloud storage reference (URL/IPFS CID)
- `_fileHash`: File hash for integrity verification
- `_fileType`: DOCUMENT (0), AUDIO (1), or VIDEO (2)
- `_metaData`: JSON metadata about evidence
- `_lawyerSignature`: Optional EIP-712 signature from lawyer for permission

**Authorization**: Submission allowed if:
- Submitter has LAWYER_ROLE, OR
- Submitter is registered participant, OR
- Valid lawyer signature provided

**Actions**:
- Creates new Submission with PENDING status
- Records submitter, timestamp, and all metadata

**Events**: Emits `EvidenceSubmitted(submissionId, caseId, fileHash)`

---

##### `reviewSubmission()`
**Signature**: `function reviewSubmission(uint256 _submissionId, bool _accepted) external onlyJudge`

**Purpose**: Judge accepts or rejects submitted evidence

**Access**: Only accounts with JUDGE_ROLE

**Parameters**:
- `_submissionId`: ID of submission to review
- `_accepted`: true to accept, false to reject

**Actions**:
- Updates status to ACCEPTED or REJECTED
- Evidence with ACCEPTED status can be used in trial

**Events**: Emits `EvidenceReviewed(submissionId, status, judge)`

---

#### Read Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `submissions(uint256)` | Submission struct | Get evidence details |
| `registeredParticipants(uint256, address)` | bool | Check if address registered for case |
| `nonces(address)` | uint256 | Get signature nonce for account |

---

## Cross-Contract Dependencies

```
CourtAccessControl
  ↑
  └─ Required by: FIRRegistry, CourtSession, EvidenceStaging

FIRRegistry
  ↑
  └─ Required by: CourtSession (for case creation)

CourtSession
  ↑
  ├─ Uses: CourtAccessControl (role checks)
  ├─ Uses: FIRRegistry (fetch accused/filer)
  └─ Referenced by: EvidenceStaging (case validation)

EvidenceStaging
  ↑
  └─ Uses: CourtAccessControl (lawyer verification)
```

---

## Events Reference

### FIRRegistry
- `FIRFiled(uint256 indexed firId, string stationId, string[] ipcSections)`
- `SupplementaryFiled(uint256 indexed firId, uint256 reportId)`
- `FIRForwarded(uint256 indexed firId, uint256 caseId)`

### CourtSession
- `CaseCreated(uint256 indexed caseId, string title, uint256 linkedFirId)`
- `CaseStatusChanged(uint256 indexed caseId, CaseStatus status)`
- `JudgeAssigned(uint256 indexed caseId, address judge)`
- `LawyerAssigned(uint256 indexed caseId, address lawyer, string role)`
- `NextSessionscheduled(uint256 indexed caseId, uint256 indexed sessionId, uint256 date)`
- `SessionPublished(uint256 indexed caseId, uint256 indexed sessionId, string ipfsCid)`

### EvidenceStaging
- `EvidenceSubmitted(uint256 indexed submissionId, uint256 indexed caseId, bytes32 fileHash)`
- `EvidenceReviewed(uint256 indexed submissionId, Status status, address reviewedBy)`

---
