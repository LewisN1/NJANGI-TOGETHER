/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Four distinct group roles as specified in MVP spec
export type UserRole = 'admin' | 'treasurer' | 'member' | 'reviewer';

export type CollectionArrangement = 'central' | 'direct_beneficiary';

export type PaymentMethod = 'mtn_momo' | 'orange_money' | 'cash' | 'bank_transfer';

// Payment Submission Lifecycle States (Section 7 & 11)
export type PaymentSubmissionStatus =
  | 'pending'               // Awaiting verification
  | 'clarification_needed'  // Receiving officer asked for details
  | 'confirmed'             // Verified received in destination account or cash
  | 'rejected'              // Rejected with recorded reason
  | 'withdrawn'             // Withdrawn by submitter before confirmation
  | 'reversed';             // Reversed via controlled correction

// Slot / Member Obligation States (Section 7 & 11)
export type ObligationStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'fully_satisfied'
  | 'overdue';

// Central Payout Lifecycle (Section 10 & 13)
export type CentralPayoutStatus =
  | 'proposed'       // Payout proposed by official
  | 'approved'       // Independently approved by another official/reviewer
  | 'recorded'       // External disbursement recorded
  | 'acknowledged'   // Beneficiary confirmed receipt
  | 'disputed';      // Beneficiary disputed amount or non-receipt

export type DisputeType = 'contribution' | 'payout' | 'allocation' | 'correction';
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'rejected';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  isRealUser?: boolean; // Distinguishes real user from demo sandbox personas
  residenceCity?: string;
  isStaff?: boolean;    // Platform operator role (strictly isolated from group authority)
}

export interface GroupMember {
  userId: string;
  name: string;
  phone: string;
  roles: UserRole[]; // e.g. ['admin'], ['treasurer'], ['reviewer'], ['member']
  payoutTurn: number; // Historical/default turn index
  joinedDate: string;
  rulesAccepted?: boolean;
}

/**
 * Section 5: Multiple Participation Slots
 * A member can own multiple whole slots in each cycle.
 * Each slot has its own obligations, entitlement and settlement history.
 */
export interface ParticipationSlot {
  id: string;
  slotNumber: number;
  displayName: string;
  memberId: string;
  memberName: string;
  cycleNumber: number;
}

/**
 * Section 6: Flexible Payout Allocation
 * A round is a contribution period that can feature multiple allocations across slots/beneficiaries.
 */
export interface PayoutAllocation {
  id: string;
  roundNumber: number;
  receivingSlotId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  scheduledAmount: number; // Whole FCFA
  collectionArrangement: CollectionArrangement;
  receivingDestinationId?: string;
  settledAmount: number;   // Amount confirmed received (direct) or disbursed (central)
  offsetAmount: number;    // Amount satisfied via self-offset
  status: 'scheduled' | 'partially_settled' | 'fully_settled';
}

/**
 * Section 8: Multi-Beneficiary Payment Routing for Direct Collection
 * Explicit approved routing connecting slot obligations to receiving allocations.
 */
export interface PaymentRouting {
  id: string;
  roundNumber: number;
  contributingSlotId: string;
  contributingMemberId: string;
  contributingMemberName: string;
  receivingAllocationId: string;
  beneficiaryId: string;
  beneficiaryName: string;
  amount: number;
  destinationSnapshot: string;
  isSelfOffset: boolean;
  status: 'pending' | 'partially_paid' | 'confirmed';
}

export interface DestinationVersion {
  version: number;
  provider: PaymentMethod;
  accountName: string;
  accountNumberOrDetails: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ReceivingDestination {
  id: string;
  roundNumber?: number; // round-specific or group-default
  provider: PaymentMethod;
  accountName: string;
  accountNumberOrDetails: string;
  proposedBy: string; // userId of proposer (e.g. round beneficiary or treasurer)
  proposedByName: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  approvedBy?: string; // Must be an independent authorised person
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  cashReceiverName?: string;
  updatedAt: string;
  version: number;
  previousVersions?: DestinationVersion[];
}

export interface ReceiptAllocation {
  id: string;
  roundNumber: number;
  slotId?: string;
  memberId: string;
  memberName: string;
  allocatedAmount: number;
  note?: string;
}

export interface PaymentSubmission {
  id: string;
  groupId: string;
  cycleNumber: number;
  roundNumber: number;
  slotId?: string;         // Slot targeted (if multi-slot)
  slotName?: string;
  memberId: string;        // The member whose obligation is being paid
  memberName: string;
  amount: number;          // Whole number XAF
  paymentDate: string;     // Date actual transfer took place
  paymentMethod: PaymentMethod;
  receivingDestinationId?: string;
  receivingDestinationSnapshot?: string; // Preserves destination shown at time of payment
  reference?: string;
  referenceUnavailableExplanation?: string;
  payerName?: string;      // If someone else paid on their behalf
  submittedBy: string;     // userId who entered the record
  submittedByName: string;
  submittedAt: string;
  receiptNote?: string;
  hasAttachment?: boolean;
  attachmentFileName?: string;
  attachmentPrivateToken?: string; // Private short-lived token access simulation
  cashReceiptNumber?: string;      // Numbered cash acknowledgement if cash payment
  status: PaymentSubmissionStatus;
  statusReason?: string;   // Rejection, clarification request, or reversal reason
  verifiedAt?: string;
  verifiedBy?: string;     // userId of receiver who confirmed
  verifiedByName?: string;
  allocations: ReceiptAllocation[];
  unallocatedAmount: number;
  reversedBy?: string;
  reversedAt?: string;
  reversalReason?: string;
  linkedCorrectionId?: string;
}

export interface BeneficiaryOffset {
  id?: string;
  roundNumber: number;
  slotId?: string;
  beneficiaryId: string;
  beneficiaryName: string;
  offsetAmount: number; // Satisfies their own obligation without cash entry
  agreedAt: string;
  isAcknowledged: boolean;
  receivingAllocationId?: string;
}

export interface CentralPayoutProposal {
  id: string;
  groupId: string;
  cycleNumber: number;
  roundNumber: number;
  receivingSlotId?: string;
  beneficiaryId: string;
  beneficiaryName: string;
  nominalEntitlement: number;
  proposedAmount: number;
  destinationAccount: string;
  destinationProvider: PaymentMethod;
  proposedBy: string;
  proposedByName: string;
  proposedAt: string;
  approvedBy?: string; // Must NOT be proposedBy
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  recordedTransferBy?: string;
  recordedTransferByName?: string;
  recordedTransferAt?: string;
  transferReference?: string;
  status: CentralPayoutStatus;
  partialReason?: string;
  remainingEntitlement: number;
  acknowledgedAt?: string;
  beneficiaryReceiptStatus?: 'full_received' | 'partial_received' | 'nothing_received';
  beneficiaryReceiptNote?: string;
}

export interface DisputeRecord {
  id: string;
  groupId: string;
  roundNumber: number;
  type: DisputeType;
  targetId: string; // paymentSubmissionId, payoutId, or allocationId
  raisedBy: string;
  raisedByName: string;
  raisedAt: string;
  claim: string;
  evidenceNote?: string;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  status: DisputeStatus;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
  reason?: string;
  groupId?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type:
    | 'contribution'
    | 'payout'
    | 'fine_assessed'
    | 'fine_collected'
    | 'correction_in'
    | 'correction_out'
    | 'handover_in'
    | 'handover_out';
  description: string;
  amount: number;
  recordedBy: string;
  reference?: string;
  memberId?: string;
  slotId?: string;
  roundNumber?: number;
  isBeneficiaryOffset?: false; // Offsets are strictly excluded from cash ledger
}

export interface CashHandoverRecord {
  id: string;
  groupId: string;
  amount: number;
  handoverDate: string;
  handedOverBy: string;
  handedOverByName: string;
  receivedBy: string;
  receivedByName: string;
  status: 'recorded' | 'acknowledged' | 'disputed';
  discrepancyNote?: string;
  acknowledgedAt?: string;
}

export interface ReconciliationRecord {
  id: string;
  groupId: string;
  cutoffDate: string;
  scope: string;
  accountsChecked: string[];
  expectedBalances: Record<string, number>;
  actualCheckedBalances: Record<string, number>;
  differences: Record<string, number>;
  explanation?: string;
  reconciledBy: string;
  reconciledByName: string;
  status: 'balanced' | 'unresolved_difference';
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  pinned?: boolean;
}

export interface RoundObligation {
  roundNumber: number;
  slotId?: string;
  slotName?: string;
  memberId: string;
  memberName?: string;
  requiredAmount: number;
  confirmedAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: ObligationStatus;
  isBeneficiaryOffsetApplied?: boolean;
}

export interface PlatformTicket {
  id: string;
  category: 'account_access' | 'security_escalation' | 'incident' | 'general';
  subject: string;
  description: string;
  submittedBy: string;
  submittedByName: string;
  status: 'open' | 'investigating' | 'resolved';
  assignedStaff?: string;
  createdAt: string;
  updatedAt: string;
  resolution?: string;
}

export interface PlatformIncidentState {
  isReadOnlyIncidentMode: boolean;
  incidentReason?: string;
  activatedBy?: string;
  activatedAt?: string;
}

export interface NjangiGroup {
  id: string;
  name: string;
  description: string;
  currency: 'FCFA'; // Central African Franc (XAF)
  contributionAmount: number;
  collectionArrangement: CollectionArrangement; // Central vs Direct Beneficiary
  frequency: 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'custom';
  customFrequencyDays?: number; // e.g. 3 for every 3 days
  customFrequencyLabel?: string; // e.g. "Every 3 Days"
  creatorId?: string; // User ID of creator who holds initial admin rights
  inviteCode?: string; // Short invite code or identifier
  firstContributionDate: string; // YYYY-MM-DD
  paymentDeadlineDays: number;
  cycleActive: boolean;
  cycleNumber: number;
  currentRound: number;
  totalRounds: number;
  lateFeeEnabled: boolean;
  lateFeeAmount: number;
  rules: string[];
  offsetRuleAccepted?: boolean; // Section 9: group acceptance of offset rule
  members: GroupMember[];
  slots?: ParticipationSlot[];   // Section 5: Multiple participation slots
  payoutAllocations?: PayoutAllocation[]; // Section 6: Flexible allocations
  paymentRoutings?: PaymentRouting[];     // Section 8: Direct payment routing
  receivingDestinations: ReceivingDestination[];
  submissions: PaymentSubmission[];
  centralPayouts: CentralPayoutProposal[];
  beneficiaryOffsets: BeneficiaryOffset[];
  cashHandovers?: CashHandoverRecord[];
  reconciliations?: ReconciliationRecord[];
  disputes: DisputeRecord[];
  auditLogs: AuditLogEntry[];
  ledger: LedgerEntry[];
  announcements: Announcement[];
  isDemo?: boolean;
  isCycleLocked?: boolean;
  reconciliationDate?: string;
  reconciledBy?: string;
}
