/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  NjangiGroup,
  User,
  UserRole,
  PaymentMethod,
  GroupMember,
  PaymentSubmission,
  AuditLogEntry,
  LedgerEntry,
  CentralPayoutProposal,
  DisputeRecord,
  ReceivingDestination,
  CashHandoverRecord,
  ReconciliationRecord,
  PlatformTicket,
  ParticipationSlot,
  PayoutAllocation,
  PaymentRouting,
} from '../types/njangi.ts';
import { INITIAL_GROUPS, DEMO_USERS, SAMPLE_DEMO_GROUPS, INITIAL_FRESH_USER } from '../data/demoData.ts';
import {
  findDuplicateReference,
  createAuditLog,
  canUserConfirmReceipt,
  validateReceiptAllocations,
  getRoundBeneficiaries,
  getRoundSlotObligations,
  getMemberSlotSummary,
  calculateLedgerSummary,
  validateCycleSchedule,
  formatFCFA,
} from '../utils/njangiLogic.ts';
import { translations, Language } from '../utils/i18n.ts';

const STORAGE_KEY = 'njangi_together_fresh_v6';
const USERS_STORAGE_KEY = 'njangi_users_v6';
const INCIDENT_STORAGE_KEY = 'njangi_incident_mode_v6';
const TICKETS_STORAGE_KEY = 'njangi_platform_tickets_v6';

interface NjangiContextType {
  groups: NjangiGroup[];
  activeGroup: NjangiGroup | null;
  currentUser: User;
  allUsers: User[];
  currentLanguage: Language;
  t: typeof translations['en'];
  userRoles: UserRole[];
  isAdmin: boolean;
  isTreasurer: boolean;
  isReviewer: boolean;
  isGroupMember: boolean;
  isReadOnlyIncidentMode: boolean;
  incidentReason?: string;
  supportTickets: PlatformTicket[];

  canViewPrivateEvidence: (submission: PaymentSubmission) => boolean;
  canConfirmReceiptForRound: (roundNumber: number, targetMemberId?: string) => { canConfirm: boolean; reason?: string };
  switchUser: (userId: string) => void;
  switchGroup: (groupId: string) => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;

  // Platform Incident Mode & Operations (Section 17)
  setIncidentReadOnlyMode: (enabled: boolean, reason?: string) => { success: boolean; error?: string };
  createSupportTicket: (data: { category: PlatformTicket['category']; subject: string; description: string }) => { success: boolean; error?: string };
  updateSupportTicket: (ticketId: string, status: PlatformTicket['status'], resolution?: string) => { success: boolean; error?: string };

  // Payment submissions & verifications (Sections 6, 7 & 11)
  submitPaymentDetails: (data: {
    groupId: string;
    roundNumber: number;
    memberId: string;
    slotId?: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    receivingDestinationId?: string;
    reference?: string;
    referenceUnavailableExplanation?: string;
    payerName?: string;
    receiptNote?: string;
    hasAttachment?: boolean;
    attachmentFileName?: string;
  }) => { success: boolean; error?: string; duplicateWarning?: boolean };

  confirmMoneyReceived: (data: {
    groupId: string;
    submissionId: string;
    notes?: string;
    overrideDuplicate?: boolean;
    duplicateJustification?: string;
  }) => { success: boolean; error?: string };

  requestPaymentClarification: (data: {
    groupId: string;
    submissionId: string;
    reason: string;
  }) => { success: boolean; error?: string };

  rejectSubmission: (data: {
    groupId: string;
    submissionId: string;
    reason: string;
  }) => { success: boolean; error?: string };

  withdrawSubmission: (data: {
    groupId: string;
    submissionId: string;
  }) => { success: boolean; error?: string };

  reverseConfirmedSubmission: (data: {
    groupId: string;
    submissionId: string;
    reason: string;
  }) => { success: boolean; error?: string };

  // Receiving Destinations (Section 10)
  proposeDestination: (data: {
    groupId: string;
    roundNumber?: number;
    provider: PaymentMethod;
    accountName: string;
    accountNumberOrDetails: string;
    cashReceiverName?: string;
  }) => { success: boolean; error?: string };

  approveDestination: (data: {
    groupId: string;
    destinationId: string;
    approved: boolean;
    rejectionReason?: string;
  }) => { success: boolean; error?: string };

  // Central Payout multi-party controls (Section 13)
  proposeCentralPayout: (data: {
    groupId: string;
    roundNumber: number;
    receivingSlotId?: string;
    beneficiaryId: string;
    amount: number;
    destinationProvider: PaymentMethod;
    destinationAccount: string;
    partialReason?: string;
  }) => { success: boolean; error?: string };

  approveCentralPayout: (data: {
    groupId: string;
    payoutId: string;
    approved: boolean;
    rejectionReason?: string;
  }) => { success: boolean; error?: string };

  recordExternalDisbursement: (data: {
    groupId: string;
    payoutId: string;
    transferReference: string;
  }) => { success: boolean; error?: string };

  acknowledgeCentralPayoutReceipt: (data: {
    groupId: string;
    payoutId: string;
    receiptStatus: 'full_received' | 'partial_received' | 'nothing_received';
    note?: string;
  }) => { success: boolean; error?: string };

  // Disputes (Section 15)
  raiseDispute: (data: {
    groupId: string;
    roundNumber: number;
    type: DisputeRecord['type'];
    targetId: string;
    claim: string;
    evidenceNote?: string;
  }) => { success: boolean; error?: string };

  resolveDispute: (data: {
    groupId: string;
    disputeId: string;
    status: 'resolved' | 'rejected';
    resolutionNote: string;
  }) => { success: boolean; error?: string };

  // Cash Handover & Custody (Section 14)
  recordCashHandover: (data: {
    groupId: string;
    amount: number;
    receiverId: string;
  }) => { success: boolean; error?: string };

  acknowledgeCashHandover: (data: {
    groupId: string;
    handoverId: string;
    discrepancyNote?: string;
  }) => { success: boolean; error?: string };

  // Reconciliations (Section 14)
  recordReconciliation: (data: {
    groupId: string;
    scope: string;
    accountsChecked: string[];
    expectedBalances: Record<string, number>;
    actualCheckedBalances: Record<string, number>;
    explanation?: string;
  }) => { success: boolean; error?: string };

  // Manual Ledger Adjustments & Fines (Section 14)
  addLedgerAdjustment: (data: {
    groupId: string;
    type: LedgerEntry['type'];
    amount: number;
    description: string;
    reason: string;
  }) => { success: boolean; error?: string };

  // Group creation & registration
  createGroup: (newGroupData: Partial<NjangiGroup>) => { success: boolean; error?: string; group?: NjangiGroup };
  createNewGroup: (newGroupData: Partial<NjangiGroup>) => { success: boolean; error?: string; group?: NjangiGroup };
  registerNewUserAccount: (userData: { name: string; phone: string; email?: string; residenceCity?: string }) => { success: boolean; user?: User; error?: string };
  registerRealAccount: (userData: { name: string; phone: string; email?: string; residenceCity?: string }) => { success: boolean; user?: User; error?: string };
  recordCentralPayoutTransfer: (data: { groupId: string; payoutId: string; transferReference: string }) => { success: boolean; error?: string };
  updatePayoutOrder: (groupId: string, newOrder: { userId: string; turn: number }[], reason: string) => { success: boolean; error?: string };
  joinGroupViaInvite: (groupId: string, userToJoin?: User) => { success: boolean; error?: string; group?: NjangiGroup; alreadyMember?: boolean };
  updateMemberRoles: (groupId: string, targetUserId: string, newRoles: UserRole[], reason?: string) => { success: boolean; error?: string };
  grantAdminRights: (groupId: string, targetUserId: string, reason?: string) => { success: boolean; error?: string };
  revokeAdminRights: (groupId: string, targetUserId: string, reason?: string) => { success: boolean; error?: string };
  loadSampleDemoData: () => void;
  clearAllData: () => void;
  resetDemoData: () => void;
}

const NjangiContext = createContext<NjangiContextType | undefined>(undefined);

export function NjangiProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<NjangiGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Version migration: ensure all groups have required arrays
          return parsed.map((g: any) => ({
            ...g,
            slots: g.slots || [],
            payoutAllocations: g.payoutAllocations || [],
            paymentRoutings: g.paymentRoutings || [],
            cashHandovers: g.cashHandovers || [],
            reconciliations: g.reconciliations || [],
            submissions: g.submissions || [],
            centralPayouts: g.centralPayouts || [],
            beneficiaryOffsets: g.beneficiaryOffsets || [],
            disputes: g.disputes || [],
            auditLogs: g.auditLogs || [],
            ledger: g.ledger || [],
            receivingDestinations: g.receivingDestinations || [],
          }));
        }
      }
    } catch (e) {
      console.warn('Could not parse saved njangi groups:', e);
    }
    return INITIAL_GROUPS; // defaults to [] for fresh start
  });

  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    return groups[0]?.id || '';
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [INITIAL_FRESH_USER];
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return allUsers[0]?.id || INITIAL_FRESH_USER.id;
  });

  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    return (localStorage.getItem('njangi_language') as Language) || 'en';
  });

  // Section 17: Platform Operations & Incident Mode
  const [isReadOnlyIncidentMode, setIsReadOnlyIncidentMode] = useState<boolean>(() => {
    return localStorage.getItem(INCIDENT_STORAGE_KEY) === 'true';
  });
  const [incidentReason, setIncidentReason] = useState<string | undefined>(() => {
    return localStorage.getItem('njangi_incident_reason_v5') || undefined;
  });

  const [supportTickets, setSupportTickets] = useState<PlatformTicket[]>(() => {
    try {
      const saved = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [
      {
        id: 'ticket-1',
        category: 'account_access',
        subject: 'Phone number change verification',
        description: 'User requested contact update from Orange to MTN.',
        submittedBy: 'usr-3',
        submittedByName: 'Paul Ngu',
        status: 'open',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
      },
    ];
  });

  // Sync groups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    } catch (e) {
      console.error('Failed to save groups state', e);
    }
  }, [groups]);

  // Sync allUsers
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));
    } catch {}
  }, [allUsers]);

  // Sync incident mode
  useEffect(() => {
    localStorage.setItem(INCIDENT_STORAGE_KEY, isReadOnlyIncidentMode ? 'true' : 'false');
    if (incidentReason) {
      localStorage.setItem('njangi_incident_reason_v6', incidentReason);
    } else {
      localStorage.removeItem('njangi_incident_reason_v6');
    }
  }, [isReadOnlyIncidentMode, incidentReason]);

  // Sync tickets
  useEffect(() => {
    try {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(supportTickets));
    } catch {}
  }, [supportTickets]);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || groups[0] || null;
  const currentUser = allUsers.find((u) => u.id === currentUserId) || allUsers[0] || INITIAL_FRESH_USER;

  // Derive per-group user permissions (Section 4)
  const activeMemberRecord = activeGroup?.members.find((m) => m.userId === currentUser.id);
  const userRoles: UserRole[] = activeMemberRecord ? activeMemberRecord.roles : [];
  const isAdmin = userRoles.includes('admin');
  const isTreasurer = userRoles.includes('treasurer');
  const isReviewer = userRoles.includes('reviewer');
  const isGroupMember = Boolean(activeMemberRecord);

  const t = translations[currentLanguage];

  const toggleLanguage = () => {
    const nextLang = currentLanguage === 'en' ? 'fr' : 'en';
    setCurrentLanguage(nextLang);
    localStorage.setItem('njangi_language', nextLang);
  };

  const setLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('njangi_language', lang);
  };

  const switchUser = (userId: string) => {
    const found = allUsers.find((u) => u.id === userId);
    if (found) setCurrentUserId(found.id);
  };

  const switchGroup = (groupId: string) => {
    const found = groups.find((g) => g.id === groupId);
    if (found) setActiveGroupId(found.id);
  };

  // Fresh Start: clear all saved records and start with 0 groups and 1 fresh personal user
  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(INCIDENT_STORAGE_KEY);
    localStorage.removeItem('njangi_incident_reason_v6');
    localStorage.removeItem(TICKETS_STORAGE_KEY);
    setGroups([]);
    setAllUsers([INITIAL_FRESH_USER]);
    setActiveGroupId('');
    setCurrentUserId(INITIAL_FRESH_USER.id);
    setIsReadOnlyIncidentMode(false);
    setIncidentReason(undefined);
  };

  // Load sample demo data on demand for testing/demonstration
  const loadSampleDemoData = () => {
    setGroups(SAMPLE_DEMO_GROUPS);
    setAllUsers(DEMO_USERS);
    setActiveGroupId(SAMPLE_DEMO_GROUPS[0].id);
    setCurrentUserId(DEMO_USERS[0].id);
    setIsReadOnlyIncidentMode(false);
    setIncidentReason(undefined);
  };

  const resetDemoData = () => {
    clearAllData();
  };

  // Section 16: Privacy check for sensitive evidence
  const canViewPrivateEvidence = (submission: PaymentSubmission): boolean => {
    if (!activeGroup) return false;
    // 1. Payer or submitter can always see their own evidence
    if (submission.memberId === currentUser.id || submission.submittedBy === currentUser.id) {
      return true;
    }
    // 2. Authorised reviewer can inspect evidence during review/dispute
    if (isReviewer) return true;

    // 3. Round receiving officer
    if (activeGroup.collectionArrangement === 'direct_beneficiary') {
      const beneficiaries = getRoundBeneficiaries(activeGroup, submission.roundNumber);
      if (beneficiaries.some((b) => b.userId === currentUser.id)) return true;
    } else {
      // Central collection: Treasurer can see private payment evidence
      if (isTreasurer) return true;
    }

    // Section 16: Ordinary group admin status ALONE does not grant unrestricted private document access
    return false;
  };

  // Check receiving authority
  const canConfirmReceiptForRound = (
    roundNumber: number,
    targetMemberId?: string
  ): { canConfirm: boolean; reason?: string } => {
    if (!activeGroup) return { canConfirm: false, reason: 'No active group.' };
    return canUserConfirmReceipt(currentUser, activeGroup, roundNumber, targetMemberId);
  };

  // Section 17: Platform Incident Mode Management
  const setIncidentReadOnlyMode = (enabled: boolean, reason?: string) => {
    setIsReadOnlyIncidentMode(enabled);
    setIncidentReason(enabled ? reason || 'Administrative maintenance' : undefined);
    return { success: true };
  };

  const createSupportTicket = (data: { category: PlatformTicket['category']; subject: string; description: string }) => {
    const newTicket: PlatformTicket = {
      id: `ticket-${Date.now()}`,
      category: data.category,
      subject: data.subject,
      description: data.description,
      submittedBy: currentUser.id,
      submittedByName: currentUser.name,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    return { success: true };
  };

  const updateSupportTicket = (ticketId: string, status: PlatformTicket['status'], resolution?: string) => {
    setSupportTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status, resolution: resolution || t.resolution, updatedAt: new Date().toISOString() }
          : t
      )
    );
    return { success: true };
  };

  // Helper check for incident mode
  const guardIncidentMode = (): { success: boolean; error?: string } | null => {
    if (isReadOnlyIncidentMode) {
      return {
        success: false,
        error: `Action blocked: Application is in emergency read-only incident mode (${incidentReason || 'Platform maintenance'}). Ordinary financial changes are restricted.`,
      };
    }
    return null;
  };

  // Section 6, 7 & 11: Submit Payment Details
  const submitPaymentDetails = (data: {
    groupId: string;
    roundNumber: number;
    memberId: string;
    slotId?: string;
    amount: number;
    paymentDate: string;
    paymentMethod: PaymentMethod;
    receivingDestinationId?: string;
    reference?: string;
    referenceUnavailableExplanation?: string;
    payerName?: string;
    receiptNote?: string;
    hasAttachment?: boolean;
    attachmentFileName?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    // Permission check: Member submitting their own OR authorised official on behalf of member
    const isPayingOwn = currentUser.id === data.memberId;
    const isOfficial = isAdmin || isTreasurer;
    if (!isPayingOwn && !isOfficial) {
      return {
        success: false,
        error: 'Only group officials can record contributions on behalf of other members.',
      };
    }

    if (!data.amount || data.amount <= 0) {
      return { success: false, error: 'Amount must be a whole positive number in FCFA.' };
    }

    // Duplicate reference check (Section 12)
    const duplicate = findDuplicateReference(group, data.reference, data.paymentMethod);
    const hasDuplicateWarning = Boolean(duplicate);

    // Numbered cash acknowledgement if cash payment (Section 11)
    let cashReceiptNumber: string | undefined = undefined;
    if (data.paymentMethod === 'cash') {
      const cashCount = group.submissions.filter((s) => s.paymentMethod === 'cash').length + 1;
      const formattedNum = String(cashCount).padStart(4, '0');
      cashReceiptNumber = `CASH-REC-${new Date().getFullYear()}-${formattedNum}`;
    }

    const memberRecord = group.members.find((m) => m.userId === data.memberId);
    const memberName = memberRecord ? memberRecord.name : 'Unknown Member';

    // Find destination snapshot
    let destSnapshot = '';
    if (data.receivingDestinationId) {
      const dest = group.receivingDestinations.find((d) => d.id === data.receivingDestinationId);
      if (dest) {
        destSnapshot = `${dest.provider.toUpperCase()} - ${dest.accountName} (${dest.accountNumberOrDetails})`;
      }
    }

    const slotRecord = group.slots?.find((s) => s.id === data.slotId);

    const newSubmission: PaymentSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      groupId: data.groupId,
      cycleNumber: group.cycleNumber,
      roundNumber: data.roundNumber,
      slotId: data.slotId,
      slotName: slotRecord?.displayName,
      memberId: data.memberId,
      memberName,
      amount: Math.round(data.amount),
      paymentDate: data.paymentDate,
      paymentMethod: data.paymentMethod,
      receivingDestinationId: data.receivingDestinationId,
      receivingDestinationSnapshot: destSnapshot || undefined,
      reference: data.reference?.trim() || undefined,
      referenceUnavailableExplanation: data.referenceUnavailableExplanation,
      payerName: data.payerName?.trim() || undefined,
      submittedBy: currentUser.id,
      submittedByName: currentUser.name,
      submittedAt: new Date().toISOString(),
      receiptNote: data.receiptNote,
      hasAttachment: data.hasAttachment,
      attachmentFileName: data.attachmentFileName,
      attachmentPrivateToken: data.hasAttachment ? `tok-${Date.now()}` : undefined,
      cashReceiptNumber,
      status: 'pending',
      allocations: [
        {
          id: `al-${Date.now()}`,
          roundNumber: data.roundNumber,
          slotId: data.slotId,
          memberId: data.memberId,
          memberName,
          allocatedAmount: Math.round(data.amount),
        },
      ],
      unallocatedAmount: 0,
    };

    const audit = createAuditLog(
      currentUser,
      'PAYMENT_DETAILS_SUBMITTED',
      `Submitted ${formatFCFA(data.amount)} for ${memberName} in Round ${data.roundNumber} via ${data.paymentMethod}. Status: Awaiting verification.`,
      undefined,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              submissions: [newSubmission, ...g.submissions],
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true, duplicateWarning: hasDuplicateWarning };
  };

  // Section 7, 11 & 12: Confirm Money Received
  const confirmMoneyReceived = (data: {
    groupId: string;
    submissionId: string;
    notes?: string;
    overrideDuplicate?: boolean;
    duplicateJustification?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const submission = group.submissions.find((s) => s.id === data.submissionId);
    if (!submission) return { success: false, error: 'Submission not found.' };

    if (submission.status === 'confirmed') {
      return { success: false, error: 'This payment has already been confirmed.' };
    }

    // Permission check
    const permCheck = canUserConfirmReceipt(currentUser, group, submission.roundNumber, submission.memberId);
    if (!permCheck.canConfirm) {
      return { success: false, error: permCheck.reason || 'Not authorised to confirm receipts for this round.' };
    }

    // Duplicate check enforcement (Section 12)
    const duplicate = findDuplicateReference(group, submission.reference, submission.paymentMethod, undefined, submission.id);
    if (duplicate && !data.overrideDuplicate) {
      return {
        success: false,
        error: `Warning: Duplicate transaction reference detected (matches ${duplicate.reference} from ${duplicate.memberName}). Override requires justification.`,
      };
    }

    const updatedSubmissions = group.submissions.map((s) =>
      s.id === submission.id
        ? {
            ...s,
            status: 'confirmed' as const,
            verifiedAt: new Date().toISOString(),
            verifiedBy: currentUser.id,
            verifiedByName: currentUser.name,
            receiptNote: data.notes || s.receiptNote,
          }
        : s
    );

    // If Central Collection: Confirmed receipt enters group cash ledger (Section 9)
    let updatedLedger = [...group.ledger];
    if (group.collectionArrangement === 'central') {
      const newLedgerEntry: LedgerEntry = {
        id: `led-${Date.now()}`,
        date: submission.paymentDate,
        type: 'contribution',
        description: `Confirmed central contribution from ${submission.memberName} (Round ${submission.roundNumber})`,
        amount: submission.amount,
        recordedBy: currentUser.name,
        reference: submission.reference || submission.cashReceiptNumber,
        memberId: submission.memberId,
        slotId: submission.slotId,
        roundNumber: submission.roundNumber,
      };
      updatedLedger = [newLedgerEntry, ...updatedLedger];
    }

    // If Direct Collection: update settlement progress on linked payoutAllocation
    let updatedAllocations = [...(group.payoutAllocations || [])];
    if (group.collectionArrangement === 'direct_beneficiary') {
      updatedAllocations = updatedAllocations.map((a) => {
        if (a.roundNumber === submission.roundNumber && a.beneficiaryId === currentUser.id) {
          const newSettled = (a.settledAmount || 0) + submission.amount;
          return {
            ...a,
            settledAmount: newSettled,
            status: newSettled + a.offsetAmount >= a.scheduledAmount ? 'fully_settled' : 'partially_settled',
          };
        }
        return a;
      });
    }

    const audit = createAuditLog(
      currentUser,
      'RECEIPT_CONFIRMED',
      `Confirmed receipt of ${formatFCFA(submission.amount)} from ${submission.memberName} for Round ${submission.roundNumber}.${data.overrideDuplicate ? ` [DUPLICATE OVERRIDDEN: ${data.duplicateJustification}]` : ''}`,
      data.notes,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              submissions: updatedSubmissions,
              ledger: updatedLedger,
              payoutAllocations: updatedAllocations,
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  const requestPaymentClarification = (data: { groupId: string; submissionId: string; reason: string }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const submission = group.submissions.find((s) => s.id === data.submissionId);
    if (!submission) return { success: false, error: 'Submission not found.' };

    const permCheck = canUserConfirmReceipt(currentUser, group, submission.roundNumber, submission.memberId);
    if (!permCheck.canConfirm) {
      return { success: false, error: permCheck.reason || 'Not authorised to manage receipts for this round.' };
    }

    const audit = createAuditLog(
      currentUser,
      'PAYMENT_CLARIFICATION_REQUESTED',
      `Requested clarification for ${submission.memberName} submission of ${formatFCFA(submission.amount)}. Reason: ${data.reason}`,
      data.reason,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              submissions: g.submissions.map((s) =>
                s.id === submission.id
                  ? { ...s, status: 'clarification_needed' as const, statusReason: data.reason }
                  : s
              ),
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  const rejectSubmission = (data: { groupId: string; submissionId: string; reason: string }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const submission = group.submissions.find((s) => s.id === data.submissionId);
    if (!submission) return { success: false, error: 'Submission not found.' };

    const permCheck = canUserConfirmReceipt(currentUser, group, submission.roundNumber, submission.memberId);
    if (!permCheck.canConfirm) {
      return { success: false, error: permCheck.reason || 'Not authorised.' };
    }

    const audit = createAuditLog(
      currentUser,
      'PAYMENT_REJECTED',
      `Rejected submission of ${formatFCFA(submission.amount)} from ${submission.memberName}. Reason: ${data.reason}`,
      data.reason,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              submissions: g.submissions.map((s) =>
                s.id === submission.id
                  ? { ...s, status: 'rejected' as const, statusReason: data.reason }
                  : s
              ),
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  const withdrawSubmission = (data: { groupId: string; submissionId: string }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const submission = group.submissions.find((s) => s.id === data.submissionId);
    if (!submission) return { success: false, error: 'Submission not found.' };

    if (submission.submittedBy !== currentUser.id && submission.memberId !== currentUser.id) {
      return { success: false, error: 'Only the submitter or member can withdraw a pending submission.' };
    }

    if (submission.status !== 'pending' && submission.status !== 'clarification_needed') {
      return { success: false, error: 'Only pending submissions can be withdrawn.' };
    }

    const audit = createAuditLog(
      currentUser,
      'PAYMENT_WITHDRAWN',
      `Withdrew pending submission of ${formatFCFA(submission.amount)} for Round ${submission.roundNumber}`,
      undefined,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              submissions: g.submissions.map((s) =>
                s.id === submission.id ? { ...s, status: 'withdrawn' as const } : s
              ),
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  // Section 12: Controlled Reversal
  const reverseConfirmedSubmission = (data: { groupId: string; submissionId: string; reason: string }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const submission = group.submissions.find((s) => s.id === data.submissionId);
    if (!submission) return { success: false, error: 'Submission not found.' };

    if (submission.status !== 'confirmed') {
      return { success: false, error: 'Only confirmed submissions can be reversed.' };
    }

    // Must be authorised official or reviewer
    if (!isAdmin && !isTreasurer && !isReviewer) {
      return { success: false, error: 'Only administrators, treasurers or reviewers can perform controlled reversals.' };
    }

    // In central collection: Linked correction ledger entry
    let updatedLedger = [...group.ledger];
    if (group.collectionArrangement === 'central') {
      const correctionEntry: LedgerEntry = {
        id: `led-cor-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'correction_out',
        description: `Correction/Reversal for receipt ${submission.reference || submission.id} (${data.reason})`,
        amount: submission.amount,
        recordedBy: currentUser.name,
        reference: submission.reference,
        memberId: submission.memberId,
        roundNumber: submission.roundNumber,
      };
      updatedLedger = [correctionEntry, ...updatedLedger];
    }

    const audit = createAuditLog(
      currentUser,
      'RECEIPT_REVERSED',
      `Controlled reversal of ${formatFCFA(submission.amount)} from ${submission.memberName}. Reason: ${data.reason}`,
      data.reason,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              submissions: g.submissions.map((s) =>
                s.id === submission.id
                  ? {
                      ...s,
                      status: 'reversed' as const,
                      reversedBy: currentUser.id,
                      reversedAt: new Date().toISOString(),
                      reversalReason: data.reason,
                    }
                  : s
              ),
              ledger: updatedLedger,
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  // Section 10: Propose Receiving Destination
  const proposeDestination = (data: {
    groupId: string;
    roundNumber?: number;
    provider: PaymentMethod;
    accountName: string;
    accountNumberOrDetails: string;
    cashReceiverName?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const newDest: ReceivingDestination = {
      id: `dest-${Date.now()}`,
      roundNumber: data.roundNumber,
      provider: data.provider,
      accountName: data.accountName,
      accountNumberOrDetails: data.accountNumberOrDetails,
      cashReceiverName: data.cashReceiverName,
      proposedBy: currentUser.id,
      proposedByName: currentUser.name,
      status: 'pending_approval',
      version: 1,
      updatedAt: new Date().toISOString(),
    };

    const audit = createAuditLog(
      currentUser,
      'DESTINATION_PROPOSED',
      `Proposed ${data.provider} destination (${data.accountName}) awaiting independent approval.`,
      undefined,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              receivingDestinations: [newDest, ...g.receivingDestinations],
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  // Section 10: Approve Destination (Must be different person!)
  const approveDestination = (data: {
    groupId: string;
    destinationId: string;
    approved: boolean;
    rejectionReason?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const dest = group.receivingDestinations.find((d) => d.id === data.destinationId);
    if (!dest) return { success: false, error: 'Destination not found.' };

    // Self-approval prevented!
    if (dest.proposedBy === currentUser.id) {
      return {
        success: false,
        error: 'Separation of duties: An official cannot approve their own proposed receiving destination.',
      };
    }

    if (!isAdmin && !isTreasurer && !isReviewer) {
      return { success: false, error: 'Authorised official or reviewer required to approve destinations.' };
    }

    const updated = group.receivingDestinations.map((d) =>
      d.id === dest.id
        ? {
            ...d,
            status: (data.approved ? 'approved' : 'rejected') as any,
            approvedBy: currentUser.id,
            approvedByName: currentUser.name,
            approvedAt: new Date().toISOString(),
            rejectionReason: data.rejectionReason,
          }
        : d
    );

    const audit = createAuditLog(
      currentUser,
      data.approved ? 'DESTINATION_APPROVED' : 'DESTINATION_REJECTED',
      `${data.approved ? 'Approved' : 'Rejected'} destination ${dest.accountName} (${dest.provider})`,
      data.rejectionReason,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, receivingDestinations: updated, auditLogs: [audit, ...g.auditLogs] } : g))
    );

    return { success: true };
  };

  // Section 13: Propose Central Payout
  const proposeCentralPayout = (data: {
    groupId: string;
    roundNumber: number;
    receivingSlotId?: string;
    beneficiaryId: string;
    amount: number;
    destinationProvider: PaymentMethod;
    destinationAccount: string;
    partialReason?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    if (!isAdmin && !isTreasurer) {
      return { success: false, error: 'Only group administrator or treasurer can propose a central payout.' };
    }

    const beneficiary = group.members.find((m) => m.userId === data.beneficiaryId);
    const nominalEntitlement = (group.slots?.length || group.members.length) * group.contributionAmount;

    const newProposal: CentralPayoutProposal = {
      id: `payout-${Date.now()}`,
      groupId: group.id,
      cycleNumber: group.cycleNumber,
      roundNumber: data.roundNumber,
      receivingSlotId: data.receivingSlotId,
      beneficiaryId: data.beneficiaryId,
      beneficiaryName: beneficiary?.name || 'Beneficiary',
      nominalEntitlement,
      proposedAmount: Math.round(data.amount),
      destinationProvider: data.destinationProvider,
      destinationAccount: data.destinationAccount,
      proposedBy: currentUser.id,
      proposedByName: currentUser.name,
      proposedAt: new Date().toISOString(),
      status: 'proposed',
      partialReason: data.partialReason,
      remainingEntitlement: Math.max(0, nominalEntitlement - Math.round(data.amount)),
    };

    const audit = createAuditLog(
      currentUser,
      'CENTRAL_PAYOUT_PROPOSED',
      `Proposed central payout of ${formatFCFA(data.amount)} for ${beneficiary?.name} (Round ${data.roundNumber})`,
      data.partialReason,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              centralPayouts: [newProposal, ...g.centralPayouts],
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  // Section 13: Approve Central Payout (Proposer cannot approve!)
  const approveCentralPayout = (data: {
    groupId: string;
    payoutId: string;
    approved: boolean;
    rejectionReason?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const payout = group.centralPayouts.find((p) => p.id === data.payoutId);
    if (!payout) return { success: false, error: 'Payout proposal not found.' };

    // Section 13 Rule: Proposer cannot approve!
    if (payout.proposedBy === currentUser.id) {
      return {
        success: false,
        error: 'Separation of duties: One person cannot propose and approve the same payout, even if they hold multiple roles.',
      };
    }

    if (!isAdmin && !isTreasurer && !isReviewer) {
      return { success: false, error: 'Only an independent authorised official or reviewer can approve central payouts.' };
    }

    const updatedPayouts = group.centralPayouts.map((p) =>
      p.id === payout.id
        ? {
            ...p,
            status: (data.approved ? 'approved' : 'rejected') as any,
            approvedBy: currentUser.id,
            approvedByName: currentUser.name,
            approvedAt: new Date().toISOString(),
            rejectionReason: data.rejectionReason,
          }
        : p
    );

    const audit = createAuditLog(
      currentUser,
      data.approved ? 'CENTRAL_PAYOUT_APPROVED' : 'CENTRAL_PAYOUT_REJECTED',
      `${data.approved ? 'Approved' : 'Rejected'} central payout proposal of ${formatFCFA(payout.proposedAmount)} for ${payout.beneficiaryName}`,
      data.rejectionReason,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, centralPayouts: updatedPayouts, auditLogs: [audit, ...g.auditLogs] } : g))
    );

    return { success: true };
  };

  // Section 13: Record External Disbursement
  const recordExternalDisbursement = (data: {
    groupId: string;
    payoutId: string;
    transferReference: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const payout = group.centralPayouts.find((p) => p.id === data.payoutId);
    if (!payout) return { success: false, error: 'Payout proposal not found.' };

    if (payout.status !== 'approved') {
      return { success: false, error: 'Payout must be independently approved before recording disbursement.' };
    }

    const updatedPayouts = group.centralPayouts.map((p) =>
      p.id === payout.id
        ? {
            ...p,
            status: 'recorded' as const,
            recordedTransferBy: currentUser.id,
            recordedTransferByName: currentUser.name,
            recordedTransferAt: new Date().toISOString(),
            transferReference: data.transferReference,
          }
        : p
    );

    // Ledger entry for cash out
    const ledgerEntry: LedgerEntry = {
      id: `led-pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'payout',
      description: `Disbursed central payout to ${payout.beneficiaryName} (Round ${payout.roundNumber})`,
      amount: payout.proposedAmount,
      recordedBy: currentUser.name,
      reference: data.transferReference,
      roundNumber: payout.roundNumber,
    };

    const audit = createAuditLog(
      currentUser,
      'EXTERNAL_DISBURSEMENT_RECORDED',
      `Recorded external transfer of ${formatFCFA(payout.proposedAmount)} to ${payout.beneficiaryName}. Reference: ${data.transferReference}`,
      undefined,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              centralPayouts: updatedPayouts,
              ledger: [ledgerEntry, ...g.ledger],
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  // Section 13: Beneficiary Acknowledgement or Dispute (Silence never counts!)
  const acknowledgeCentralPayoutReceipt = (data: {
    groupId: string;
    payoutId: string;
    receiptStatus: 'full_received' | 'partial_received' | 'nothing_received';
    note?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const payout = group.centralPayouts.find((p) => p.id === data.payoutId);
    if (!payout) return { success: false, error: 'Payout not found.' };

    if (payout.beneficiaryId !== currentUser.id && !isAdmin && !isReviewer) {
      return { success: false, error: 'Only the designated beneficiary can acknowledge receipt.' };
    }

    const nextStatus = data.receiptStatus === 'full_received' ? 'acknowledged' : 'disputed';

    const updatedPayouts = group.centralPayouts.map((p) =>
      p.id === payout.id
        ? {
            ...p,
            status: nextStatus as any,
            acknowledgedAt: new Date().toISOString(),
            beneficiaryReceiptStatus: data.receiptStatus,
            beneficiaryReceiptNote: data.note,
          }
        : p
    );

    let updatedDisputes = [...group.disputes];
    if (data.receiptStatus !== 'full_received') {
      const newDispute: DisputeRecord = {
        id: `disp-${Date.now()}`,
        groupId: group.id,
        roundNumber: payout.roundNumber,
        type: 'payout',
        targetId: payout.id,
        raisedBy: currentUser.id,
        raisedByName: currentUser.name,
        raisedAt: new Date().toISOString(),
        claim: `Beneficiary reported: ${data.receiptStatus === 'nothing_received' ? 'Nothing received' : 'Different amount received'}. Note: ${data.note || 'None'}`,
        status: 'open',
      };
      updatedDisputes = [newDispute, ...updatedDisputes];
    }

    const audit = createAuditLog(
      currentUser,
      'PAYOUT_RECEIPT_ACKNOWLEDGED',
      `Beneficiary acknowledged central payout: ${data.receiptStatus}`,
      data.note,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              centralPayouts: updatedPayouts,
              disputes: updatedDisputes,
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  // Section 15: Disputes
  const raiseDispute = (data: {
    groupId: string;
    roundNumber: number;
    type: DisputeRecord['type'];
    targetId: string;
    claim: string;
    evidenceNote?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const reviewer = group.members.find((m) => m.roles.includes('reviewer'));

    const newDispute: DisputeRecord = {
      id: `disp-${Date.now()}`,
      groupId: group.id,
      roundNumber: data.roundNumber,
      type: data.type,
      targetId: data.targetId,
      raisedBy: currentUser.id,
      raisedByName: currentUser.name,
      raisedAt: new Date().toISOString(),
      claim: data.claim,
      evidenceNote: data.evidenceNote,
      assignedReviewerId: reviewer?.userId,
      assignedReviewerName: reviewer?.name,
      status: 'open',
    };

    const audit = createAuditLog(
      currentUser,
      'DISPUTE_RAISED',
      `Raised dispute for Round ${data.roundNumber} (${data.type}): ${data.claim}`,
      data.claim,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              disputes: [newDispute, ...g.disputes],
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  const resolveDispute = (data: {
    groupId: string;
    disputeId: string;
    status: 'resolved' | 'rejected';
    resolutionNote: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const dispute = group.disputes.find((d) => d.id === data.disputeId);
    if (!dispute) return { success: false, error: 'Dispute not found.' };

    // Section 15 Rule: A person involved in a dispute CANNOT be its sole resolver!
    if (dispute.raisedBy === currentUser.id) {
      return { success: false, error: 'Separation of duties: A person involved in a dispute cannot be its resolver.' };
    }

    if (!isReviewer && !isAdmin) {
      return { success: false, error: 'Authorised reviewer or administrator required to resolve disputes.' };
    }

    const updated = group.disputes.map((d) =>
      d.id === dispute.id
        ? {
            ...d,
            status: data.status,
            resolutionNote: data.resolutionNote,
            resolvedAt: new Date().toISOString(),
            resolvedBy: currentUser.id,
          }
        : d
    );

    const audit = createAuditLog(
      currentUser,
      'DISPUTE_RESOLVED',
      `Dispute ${dispute.id} marked ${data.status}. Resolution: ${data.resolutionNote}`,
      data.resolutionNote,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, disputes: updated, auditLogs: [audit, ...g.auditLogs] } : g))
    );

    return { success: true };
  };

  // Section 14: Cash Handover & Custody
  const recordCashHandover = (data: {
    groupId: string;
    amount: number;
    receiverId: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    if (!isAdmin && !isTreasurer) {
      return { success: false, error: 'Only authorized cash collectors can record handovers.' };
    }

    const receiver = group.members.find((m) => m.userId === data.receiverId);

    const newHandover: CashHandoverRecord = {
      id: `hand-${Date.now()}`,
      groupId: group.id,
      amount: Math.round(data.amount),
      handoverDate: new Date().toISOString().split('T')[0],
      handedOverBy: currentUser.id,
      handedOverByName: currentUser.name,
      receivedBy: data.receiverId,
      receivedByName: receiver?.name || 'Receiver',
      status: 'recorded',
    };

    const audit = createAuditLog(
      currentUser,
      'CASH_HANDOVER_RECORDED',
      `Recorded cash handover of ${formatFCFA(data.amount)} to ${receiver?.name}. Awaiting acknowledgement.`,
      undefined,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              cashHandovers: [newHandover, ...(g.cashHandovers || [])],
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  const acknowledgeCashHandover = (data: {
    groupId: string;
    handoverId: string;
    discrepancyNote?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    const handover = (group.cashHandovers || []).find((h) => h.id === data.handoverId);
    if (!handover) return { success: false, error: 'Handover record not found.' };

    if (handover.receivedBy !== currentUser.id && !isAdmin && !isReviewer) {
      return { success: false, error: 'Only the receiving officer can acknowledge this cash handover.' };
    }

    const nextStatus = data.discrepancyNote ? 'disputed' : 'acknowledged';

    const updated = (group.cashHandovers || []).map((h) =>
      h.id === handover.id
        ? {
            ...h,
            status: nextStatus as any,
            discrepancyNote: data.discrepancyNote,
            acknowledgedAt: new Date().toISOString(),
          }
        : h
    );

    const audit = createAuditLog(
      currentUser,
      'CASH_HANDOVER_ACKNOWLEDGED',
      `Acknowledged cash handover of ${formatFCFA(handover.amount)} (${nextStatus})`,
      data.discrepancyNote,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, cashHandovers: updated, auditLogs: [audit, ...g.auditLogs] } : g))
    );

    return { success: true };
  };

  // Section 14: Record Reconciliation
  const recordReconciliation = (data: {
    groupId: string;
    scope: string;
    accountsChecked: string[];
    expectedBalances: Record<string, number>;
    actualCheckedBalances: Record<string, number>;
    explanation?: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    if (!isReviewer && !isAdmin && !isTreasurer) {
      return { success: false, error: 'Only authorised reviewers or officials can perform reconciliations.' };
    }

    const differences: Record<string, number> = {};
    let hasDiff = false;
    for (const acc of data.accountsChecked) {
      const exp = data.expectedBalances[acc] || 0;
      const act = data.actualCheckedBalances[acc] || 0;
      const diff = act - exp;
      differences[acc] = diff;
      if (diff !== 0) hasDiff = true;
    }

    const newRecon: ReconciliationRecord = {
      id: `recon-${Date.now()}`,
      groupId: group.id,
      cutoffDate: new Date().toISOString().split('T')[0],
      scope: data.scope,
      accountsChecked: data.accountsChecked,
      expectedBalances: data.expectedBalances,
      actualCheckedBalances: data.actualCheckedBalances,
      differences,
      explanation: data.explanation,
      reconciledBy: currentUser.id,
      reconciledByName: currentUser.name,
      status: hasDiff ? 'unresolved_difference' : 'balanced',
      createdAt: new Date().toISOString(),
    };

    const audit = createAuditLog(
      currentUser,
      'RECONCILIATION_PERFORMED',
      `Reconciliation performed for ${data.scope}. Status: ${newRecon.status}`,
      data.explanation,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              reconciliations: [newRecon, ...(g.reconciliations || [])],
              reconciliationDate: newRecon.cutoffDate,
              reconciledBy: currentUser.name,
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  // Section 14: Manual Ledger Adjustment / Fine
  const addLedgerAdjustment = (data: {
    groupId: string;
    type: LedgerEntry['type'];
    amount: number;
    description: string;
    reason: string;
  }) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === data.groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    if (!isAdmin && !isTreasurer && !isReviewer) {
      return { success: false, error: 'Only administrators, treasurers or reviewers can record adjustments.' };
    }

    const newEntry: LedgerEntry = {
      id: `led-adj-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: data.type,
      description: `${data.description} (${data.reason})`,
      amount: Math.round(data.amount),
      recordedBy: currentUser.name,
    };

    const audit = createAuditLog(
      currentUser,
      'LEDGER_ADJUSTMENT',
      `Recorded ${data.type} of ${formatFCFA(data.amount)}: ${data.description}`,
      data.reason,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id
          ? {
              ...g,
              ledger: [newEntry, ...g.ledger],
              auditLogs: [audit, ...g.auditLogs],
            }
          : g
      )
    );

    return { success: true };
  };

  // Group creation
  const createGroup = (newGroupData: Partial<NjangiGroup>) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const id = newGroupData.id || `grp-${Date.now()}`;
    const initialMember: GroupMember = {
      userId: currentUser.id,
      name: currentUser.name,
      phone: currentUser.phone,
      roles: ['admin', 'treasurer'], // Admin rights apply when creating a njangi group
      payoutTurn: 1,
      joinedDate: new Date().toISOString().split('T')[0],
      rulesAccepted: true,
    };

    const membersList: GroupMember[] =
      newGroupData.members && newGroupData.members.length > 0
        ? newGroupData.members.map((m) => {
            if (m.userId === currentUser.id) {
              const roles: UserRole[] = m.roles?.includes('admin')
                ? m.roles
                : (['admin', ...(m.roles || [])] as UserRole[]);
              return { ...m, roles };
            }
            // Other members start as assigned role or 'member'
            const roles: UserRole[] = (m.roles && m.roles.length > 0 ? m.roles : ['member']) as UserRole[];
            return { ...m, roles };
          })
        : [initialMember];

    const slotsList: ParticipationSlot[] =
      newGroupData.slots && newGroupData.slots.length > 0
        ? newGroupData.slots
        : membersList.map((m, idx) => ({
            id: `slot-${id}-${idx + 1}`,
            slotNumber: idx + 1,
            displayName: `Slot ${idx + 1} - ${m.name}`,
            memberId: m.userId,
            memberName: m.name,
            cycleNumber: 1,
          }));

    const group: NjangiGroup = {
      id,
      creatorId: currentUser.id,
      inviteCode: id.replace('grp-', 'INV-'),
      name: newGroupData.name || 'New Njangi Group',
      description: newGroupData.description || '',
      currency: 'FCFA',
      contributionAmount: newGroupData.contributionAmount || 25000,
      collectionArrangement: newGroupData.collectionArrangement || 'central',
      frequency: newGroupData.frequency || 'monthly',
      customFrequencyDays: newGroupData.customFrequencyDays,
      customFrequencyLabel: newGroupData.customFrequencyLabel,
      firstContributionDate: newGroupData.firstContributionDate || new Date().toISOString().split('T')[0],
      paymentDeadlineDays: newGroupData.paymentDeadlineDays || (newGroupData.frequency === 'daily' ? 1 : 5),
      cycleActive: false,
      cycleNumber: 1,
      currentRound: 1,
      totalRounds: Math.max(1, membersList.length),
      lateFeeEnabled: Boolean(newGroupData.lateFeeEnabled),
      lateFeeAmount: newGroupData.lateFeeAmount || 0,
      rules: newGroupData.rules || ['Standard rules apply. Non-custodial recordkeeping service.'],
      offsetRuleAccepted: true,
      members: membersList,
      slots: slotsList,
      payoutAllocations: [],
      paymentRoutings: [],
      receivingDestinations: [],
      submissions: [],
      centralPayouts: [],
      beneficiaryOffsets: [],
      cashHandovers: [],
      reconciliations: [],
      disputes: [],
      auditLogs: [
        createAuditLog(
          currentUser,
          'GROUP_CREATED',
          `Created group ${newGroupData.name || 'New Njangi Group'} (${newGroupData.collectionArrangement || 'central'} collection, frequency: ${newGroupData.frequency || 'monthly'})`,
          undefined,
          id
        ),
      ],
      ledger: [],
      announcements: [],
    };

    setGroups((prev) => [group, ...prev]);
    setActiveGroupId(group.id);
    return { success: true, group };
  };

  const joinGroupViaInvite = (groupId: string, userToJoin?: User) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const targetUser = userToJoin || currentUser;
    const group = groups.find((g) => g.id === groupId || g.inviteCode === groupId);
    if (!group) {
      return { success: false, error: 'Njangi group not found for this invite link.' };
    }

    const isAlreadyMember = group.members.some((m) => m.userId === targetUser.id);
    if (isAlreadyMember) {
      setActiveGroupId(group.id);
      return { success: true, group, alreadyMember: true };
    }

    // Rule: On creation of account or when joining via invite, everyone starts as a member.
    // Admin rights only apply when creating a njangi group or when given by a creator/admin.
    const newTurn = group.members.length + 1;
    const newMember: GroupMember = {
      userId: targetUser.id,
      name: targetUser.name,
      phone: targetUser.phone,
      roles: ['member'], // Strictly starts as 'member'
      payoutTurn: newTurn,
      joinedDate: new Date().toISOString().split('T')[0],
      rulesAccepted: true,
    };

    const newSlot: ParticipationSlot = {
      id: `slot-${group.id}-${newTurn}`,
      slotNumber: newTurn,
      displayName: `Slot ${newTurn} - ${targetUser.name}`,
      memberId: targetUser.id,
      memberName: targetUser.name,
      cycleNumber: group.cycleNumber,
    };

    const updatedMembers = [...group.members, newMember];
    const updatedSlots = [...(group.slots || []), newSlot];
    const updatedTotalRounds = Math.max(group.totalRounds, updatedMembers.length);

    const audit = createAuditLog(
      targetUser,
      'MEMBER_JOINED_VIA_INVITE',
      `${targetUser.name} joined the Njangi via invite link as an ordinary Member (Turn #${newTurn}).`,
      undefined,
      group.id
    );

    const updatedGroup: NjangiGroup = {
      ...group,
      members: updatedMembers,
      slots: updatedSlots,
      totalRounds: updatedTotalRounds,
      auditLogs: [audit, ...group.auditLogs],
    };

    setGroups((prev) => prev.map((g) => (g.id === group.id ? updatedGroup : g)));
    setActiveGroupId(group.id);
    return { success: true, group: updatedGroup, alreadyMember: false };
  };

  const updateMemberRoles = (
    groupId: string,
    targetUserId: string,
    newRoles: UserRole[],
    reason?: string
  ) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    // Caller must be an admin of this group
    const callerMember = group.members.find((m) => m.userId === currentUser.id);
    if (!callerMember || !callerMember.roles.includes('admin')) {
      return { success: false, error: 'Only a group administrator can manage member roles and permissions.' };
    }

    const targetMember = group.members.find((m) => m.userId === targetUserId);
    if (!targetMember) return { success: false, error: 'Target member not found in this group.' };

    // Prevent removing admin if target is the sole admin
    const currentAdmins = group.members.filter((m) => m.roles.includes('admin'));
    if (
      currentAdmins.length === 1 &&
      currentAdmins[0].userId === targetUserId &&
      !newRoles.includes('admin')
    ) {
      return { success: false, error: 'Cannot revoke admin rights: this group must have at least one administrator.' };
    }

    // Role cleanup: guarantee at least ['member'] if empty
    const sanitizedRoles: UserRole[] = newRoles.length > 0 ? Array.from(new Set(newRoles)) : ['member'];

    const updatedMembers = group.members.map((m) =>
      m.userId === targetUserId ? { ...m, roles: sanitizedRoles } : m
    );

    const audit = createAuditLog(
      currentUser,
      'ROLE_PERMISSIONS_UPDATED',
      `Updated permissions for ${targetMember.name} to: ${sanitizedRoles.join(', ')}`,
      reason || 'Group administrator governance action',
      group.id
    );

    setGroups((prev) =>
      prev.map((g) =>
        g.id === group.id ? { ...g, members: updatedMembers, auditLogs: [audit, ...group.auditLogs] } : g
      )
    );

    return { success: true };
  };

  const grantAdminRights = (groupId: string, targetUserId: string, reason?: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return { success: false, error: 'Group not found.' };
    const member = group.members.find((m) => m.userId === targetUserId);
    if (!member) return { success: false, error: 'Member not found.' };
    const newRoles = Array.from(new Set([...member.roles, 'admin' as UserRole]));
    return updateMemberRoles(
      groupId,
      targetUserId,
      newRoles,
      reason || `Admin rights granted by ${currentUser.name}`
    );
  };

  const revokeAdminRights = (groupId: string, targetUserId: string, reason?: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return { success: false, error: 'Group not found.' };
    const member = group.members.find((m) => m.userId === targetUserId);
    if (!member) return { success: false, error: 'Member not found.' };
    const newRoles = member.roles.filter((r) => r !== 'admin');
    return updateMemberRoles(
      groupId,
      targetUserId,
      newRoles.length > 0 ? newRoles : ['member'],
      reason || `Admin rights revoked by ${currentUser.name}`
    );
  };

  const registerNewUserAccount = (userData: { name: string; phone: string; email?: string; residenceCity?: string }): { success: boolean; user?: User; error?: string } => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      residenceCity: userData.residenceCity,
      isRealUser: true,
    };

    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem('njangi_all_users_v5', JSON.stringify(updatedUsers));
    setCurrentUserId(newUser.id);
    return { success: true, user: newUser };
  };
  const updatePayoutOrder = (groupId: string, newOrder: { userId: string; turn: number }[], reason: string) => {
    const guard = guardIncidentMode();
    if (guard) return guard;

    const group = groups.find((g) => g.id === groupId);
    if (!group) return { success: false, error: 'Group not found.' };

    if (!isAdmin) {
      return { success: false, error: 'Only administrators can update the payout schedule.' };
    }

    const updatedMembers = group.members.map((m) => {
      const match = newOrder.find((o) => o.userId === m.userId);
      return match ? { ...m, payoutTurn: match.turn } : m;
    });

    const audit = createAuditLog(
      currentUser,
      'SCHEDULE_REORDERED',
      `Updated payout order for cycle ${group.cycleNumber}`,
      reason,
      group.id
    );

    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, members: updatedMembers, auditLogs: [audit, ...g.auditLogs] } : g))
    );

    return { success: true };
  };

  return (
    <NjangiContext.Provider
      value={{
        groups,
        activeGroup,
        currentUser,
        allUsers,
        currentLanguage,
        t,
        userRoles,
        isAdmin,
        isTreasurer,
        isReviewer,
        isGroupMember,
        isReadOnlyIncidentMode,
        incidentReason,
        supportTickets,
        canViewPrivateEvidence,
        canConfirmReceiptForRound,
        switchUser,
        switchGroup,
        toggleLanguage,
        setLanguage,
        setIncidentReadOnlyMode,
        createSupportTicket,
        updateSupportTicket,
        submitPaymentDetails,
        confirmMoneyReceived,
        requestPaymentClarification,
        rejectSubmission,
        withdrawSubmission,
        reverseConfirmedSubmission,
        proposeDestination,
        approveDestination,
        proposeCentralPayout,
        approveCentralPayout,
        recordExternalDisbursement,
        recordCentralPayoutTransfer: recordExternalDisbursement,
        acknowledgeCentralPayoutReceipt,
        raiseDispute,
        resolveDispute,
        recordCashHandover,
        acknowledgeCashHandover,
        recordReconciliation,
        addLedgerAdjustment,
        createGroup,
        createNewGroup: createGroup,
        registerNewUserAccount,
        registerRealAccount: registerNewUserAccount,
        updatePayoutOrder,
        joinGroupViaInvite,
        updateMemberRoles,
        grantAdminRights,
        revokeAdminRights,
        loadSampleDemoData,
        clearAllData,
        resetDemoData,
      }}
    >
      {children}
    </NjangiContext.Provider>
  );
}

export function useNjangi() {
  const context = useContext(NjangiContext);
  if (!context) {
    throw new Error('useNjangi must be used within a NjangiProvider');
  }
  return context;
}
