/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  NjangiGroup,
  GroupMember,
  ParticipationSlot,
  PayoutAllocation,
  PaymentRouting,
  PaymentSubmission,
  RoundObligation,
  ObligationStatus,
  LedgerEntry,
  AuditLogEntry,
  ReceiptAllocation,
  CentralPayoutProposal,
  User,
  CashHandoverRecord,
  ReconciliationRecord,
} from '../types/njangi.ts';

/**
 * Format amounts in FCFA (Central African Franc / XAF).
 * Always whole numbers, space thousands separator, no decimals.
 */
export function formatFCFA(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 FCFA';
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString('fr-FR');
  return `${formatted} FCFA`;
}

export function getFrequencyDays(
  frequency: 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'custom',
  customFrequencyDays?: number
): number {
  switch (frequency) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'fortnightly':
      return 14;
    case 'monthly':
      return 30;
    case 'custom':
      return customFrequencyDays && customFrequencyDays > 0 ? customFrequencyDays : 1;
    default:
      return 30;
  }
}

/**
 * Calculates due date for a specific round based on start date and frequency.
 */
export function calculateRoundDueDate(group: NjangiGroup, roundNumber: number): string {
  const start = new Date(group.firstContributionDate);
  const freqDays = getFrequencyDays(group.frequency, group.customFrequencyDays);
  const daysOffset = (roundNumber - 1) * freqDays;
  const roundStart = new Date(start.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  const deadlineDays = group.frequency === 'daily'
    ? Math.min(1, group.paymentDeadlineDays ?? 1)
    : Math.min(group.paymentDeadlineDays ?? 5, Math.max(1, freqDays - 1));
  const deadline = new Date(roundStart.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
  return deadline.toISOString().split('T')[0];
}

/**
 * Calculates payout date for a specific round.
 */
export function calculateRoundPayoutDate(group: NjangiGroup, roundNumber: number): string {
  const start = new Date(group.firstContributionDate);
  const freqDays = getFrequencyDays(group.frequency, group.customFrequencyDays);
  const daysOffset = (roundNumber - 1) * freqDays;
  const roundStart = new Date(start.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  const payoutOffsetDays = Math.max(0, Math.min(freqDays - 1, (group.paymentDeadlineDays ?? 1)));
  const payoutDate = new Date(roundStart.getTime() + payoutOffsetDays * 24 * 60 * 60 * 1000);
  return payoutDate.toISOString().split('T')[0];
}

/**
 * Formats group frequency into a user-friendly readable label.
 */
export function formatFrequency(
  group: Pick<NjangiGroup, 'frequency' | 'customFrequencyDays' | 'customFrequencyLabel'>,
  lang: 'en' | 'fr' = 'en'
): string {
  if (group.frequency === 'daily') {
    return lang === 'fr' ? 'Quotidien (Chaque jour)' : 'Daily';
  }
  if (group.frequency === 'weekly') {
    return lang === 'fr' ? 'Hebdomadaire' : 'Weekly';
  }
  if (group.frequency === 'fortnightly') {
    return lang === 'fr' ? 'Toutes les 2 semaines' : 'Every 2 Weeks';
  }
  if (group.frequency === 'monthly') {
    return lang === 'fr' ? 'Mensuel' : 'Monthly';
  }
  if (group.frequency === 'custom') {
    if (group.customFrequencyLabel) return group.customFrequencyLabel;
    const days = group.customFrequencyDays || 1;
    return lang === 'fr' ? `Tous les ${days} jours` : `Every ${days} Days`;
  }
  return group.frequency;
}

/**
 * Section 5 & 6: Pre-activation Schedule Validation
 * Validates:
 * 1. Total scheduled entitlement per slot equals agreed cycle entitlement (totalSlots * contributionAmount)
 * 2. No slot is overallocated
 * 3. Planned contributions cover cumulative planned allocations
 * 4. Complete cycle balances
 */
export function validateCycleSchedule(group: NjangiGroup): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const totalSlotsCount = group.slots?.length || group.members.length;
  const cycleEntitlementPerSlot = totalSlotsCount * group.contributionAmount;

  if (totalSlotsCount === 0) {
    errors.push('Cycle must have at least one slot.');
    return { valid: false, errors };
  }

  // Check each slot's scheduled entitlement
  const slotAllocationsMap = new Map<string, number>();
  for (const alloc of group.payoutAllocations || []) {
    const current = slotAllocationsMap.get(alloc.receivingSlotId) || 0;
    slotAllocationsMap.set(alloc.receivingSlotId, current + alloc.scheduledAmount);
  }

  for (const slot of group.slots || []) {
    const allocated = slotAllocationsMap.get(slot.id) || 0;
    if (allocated !== cycleEntitlementPerSlot) {
      errors.push(
        `Slot ${slot.displayName} (${slot.memberName}) is allocated ${formatFCFA(allocated)}, expected ${formatFCFA(cycleEntitlementPerSlot)}.`
      );
    }
  }

  // Round-by-round funding check
  let cumulativeObligations = 0;
  let cumulativeAllocations = 0;
  for (let r = 1; r <= group.totalRounds; r++) {
    const roundObligations = totalSlotsCount * group.contributionAmount;
    cumulativeObligations += roundObligations;

    const roundAllocations = (group.payoutAllocations || [])
      .filter((a) => a.roundNumber === r)
      .reduce((sum, a) => sum + a.scheduledAmount, 0);

    cumulativeAllocations += roundAllocations;

    if (group.collectionArrangement === 'direct_beneficiary') {
      // In direct collection, allocations in each round must match that round's obligations
      if (roundAllocations !== roundObligations) {
        errors.push(
          `Round ${r} direct allocations (${formatFCFA(roundAllocations)}) do not match round obligations (${formatFCFA(roundObligations)}). Direct mode does not permit central carry-forward.`
        );
      }
    } else {
      // Central collection: cumulative contributions must cover cumulative allocations
      if (cumulativeAllocations > cumulativeObligations) {
        errors.push(
          `Round ${r} cumulative planned payouts (${formatFCFA(cumulativeAllocations)}) exceed cumulative planned contributions (${formatFCFA(cumulativeObligations)}).`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Section 8: Direct Collection Payment Routing Validation
 * Ensures that:
 * 1. Routing amounts match slot contribution obligations (each slot owes group.contributionAmount per round)
 * 2. Routing amounts payable to each beneficiary match their round allocation
 * 3. No money is assigned twice
 * 4. Self-offsets match contributor == beneficiary
 */
export function validatePaymentRouting(
  group: NjangiGroup,
  roundNumber: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const routings = (group.paymentRoutings || []).filter((r) => r.roundNumber === roundNumber);
  const allocations = (group.payoutAllocations || []).filter((a) => a.roundNumber === roundNumber);
  const slots = group.slots || [];

  // Check each slot's outgoing routing
  for (const slot of slots) {
    const slotRoutings = routings.filter((r) => r.contributingSlotId === slot.id);
    const totalRouted = slotRoutings.reduce((sum, r) => sum + r.amount, 0);
    if (totalRouted !== group.contributionAmount) {
      errors.push(
        `Slot ${slot.displayName} has ${formatFCFA(totalRouted)} routed for Round ${roundNumber}, expected ${formatFCFA(group.contributionAmount)}.`
      );
    }
  }

  // Check each receiving allocation's incoming routing
  for (const alloc of allocations) {
    const incomingRoutings = routings.filter((r) => r.receivingAllocationId === alloc.id);
    const totalIncoming = incomingRoutings.reduce((sum, r) => sum + r.amount, 0);
    if (totalIncoming !== alloc.scheduledAmount) {
      errors.push(
        `Allocation for ${alloc.beneficiaryName} expects ${formatFCFA(alloc.scheduledAmount)}, but routed incoming total is ${formatFCFA(totalIncoming)}.`
      );
    }
  }

  // Validate self-offsets in routing
  for (const r of routings) {
    if (r.isSelfOffset) {
      if (r.contributingMemberId !== r.beneficiaryId) {
        errors.push(
          `Invalid self-offset in routing ${r.id}: Contributor ${r.contributingMemberName} does not match Beneficiary ${r.beneficiaryName}.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Identifies the beneficiaries for a given round based on payoutAllocations or legacy payoutTurn.
 */
export function getRoundBeneficiaries(group: NjangiGroup, roundNumber: number): Array<{ userId: string; name: string }> {
  if (group.payoutAllocations && group.payoutAllocations.length > 0) {
    const roundAllocs = group.payoutAllocations.filter((a) => a.roundNumber === roundNumber);
    const unique = new Map<string, string>();
    for (const a of roundAllocs) {
      unique.set(a.beneficiaryId, a.beneficiaryName);
    }
    return Array.from(unique.entries()).map(([userId, name]) => ({ userId, name }));
  }

  // Fallback to legacy single member payoutTurn
  const legacyMember = group.members.find((m) => m.payoutTurn === roundNumber);
  return legacyMember ? [{ userId: legacyMember.userId, name: legacyMember.name }] : [];
}

/**
 * Permission check: Can this user confirm receipts for this round?
 * Section 4: For direct collection, temporary authority is derived from beneficiary assignment.
 * Section 8: In central collection, an official CANNOT confirm their own contribution.
 */
export function canUserConfirmReceipt(
  user: User,
  group: NjangiGroup,
  roundNumber: number,
  targetMemberId?: string
): { canConfirm: boolean; reason?: string } {
  const member = group.members.find((m) => m.userId === user.id);
  const roles = member?.roles || [];
  const roundBeneficiaries = getRoundBeneficiaries(group, roundNumber);
  const isBeneficiaryOfRound = roundBeneficiaries.some((b) => b.userId === user.id);

  if (group.collectionArrangement === 'direct_beneficiary') {
    // Round beneficiary has temporary authority to confirm receipts for this round
    if (isBeneficiaryOfRound) {
      if (targetMemberId && targetMemberId === user.id) {
        return {
          canConfirm: false,
          reason: 'Beneficiary own contribution is satisfied via agreed offset, not external receipt confirmation.',
        };
      }
      return { canConfirm: true };
    }
    // Reviewer or Admin can assist in disputes only
    if (roles.includes('reviewer') || roles.includes('admin')) {
      return { canConfirm: true };
    }
    return {
      canConfirm: false,
      reason: 'In direct beneficiary collection, only this round’s beneficiary (or authorised reviewer) can confirm receipts.',
    };
  }

  // Central collection:
  if (roles.includes('treasurer') || roles.includes('admin')) {
    // Receiving official cannot confirm their own payment!
    if (targetMemberId && targetMemberId === user.id) {
      return {
        canConfirm: false,
        reason: 'Governance policy: Another authorised official must verify a receiving official’s own contribution.',
      };
    }
    return { canConfirm: true };
  }

  return {
    canConfirm: false,
    reason: 'Only authorised group treasurers or administrators can confirm central collection receipts.',
  };
}

/**
 * Calculates obligation status for a slot/member in a specific round.
 */
export function calculateMemberObligationStatus(
  requiredAmount: number,
  confirmedAmount: number,
  pendingAmount: number,
  dueDate: string,
  isBeneficiaryOffset: boolean,
  referenceDateStr?: string
): ObligationStatus {
  if (isBeneficiaryOffset) {
    return 'fully_satisfied';
  }

  if (confirmedAmount >= requiredAmount) {
    return 'fully_satisfied';
  }

  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const isPastDue = new Date(dueDate).getTime() < refDate.getTime();

  if (confirmedAmount > 0) {
    return isPastDue ? 'overdue' : 'partially_paid';
  }

  return isPastDue ? 'overdue' : 'unpaid';
}

/**
 * Section 5: Computes all slot obligations for a given round.
 * Supports multiple participation slots per member.
 */
export function getRoundSlotObligations(
  group: NjangiGroup,
  roundNumber: number,
  referenceDateStr?: string
): RoundObligation[] {
  const roundDueDate = calculateRoundDueDate(group, roundNumber);
  const isDirect = group.collectionArrangement === 'direct_beneficiary';

  // Find self-offsets for this round
  const offsets = (group.beneficiaryOffsets || []).filter((o) => o.roundNumber === roundNumber);

  // If group has slots configured
  if (group.slots && group.slots.length > 0) {
    return group.slots.map((slot) => {
      const slotOffset = offsets.find((o) => o.slotId === slot.id || (o.beneficiaryId === slot.memberId && !o.slotId));
      const hasOffset = isDirect && Boolean(slotOffset);

      // Submissions for this slot
      const submissions = group.submissions.filter(
        (s) => s.roundNumber === roundNumber && (s.slotId === slot.id || (!s.slotId && s.memberId === slot.memberId))
      );

      const confirmedAmount = submissions
        .filter((s) => s.status === 'confirmed')
        .reduce((sum, s) => sum + s.amount, 0);

      const pendingAmount = submissions
        .filter((s) => s.status === 'pending' || s.status === 'clarification_needed')
        .reduce((sum, s) => sum + s.amount, 0);

      const status = calculateMemberObligationStatus(
        group.contributionAmount,
        confirmedAmount,
        pendingAmount,
        roundDueDate,
        hasOffset,
        referenceDateStr
      );

      return {
        roundNumber,
        slotId: slot.id,
        slotName: slot.displayName,
        memberId: slot.memberId,
        memberName: slot.memberName,
        requiredAmount: group.contributionAmount,
        confirmedAmount,
        pendingAmount,
        dueDate: roundDueDate,
        status,
        isBeneficiaryOffsetApplied: hasOffset,
      };
    });
  }

  // Fallback to member-level obligations if slots not yet initialized
  const roundBeneficiaries = getRoundBeneficiaries(group, roundNumber);
  return group.members.map((member) => {
    const isDirectBeneficiary = isDirect && roundBeneficiaries.some((b) => b.userId === member.userId);
    const memberSubmissions = group.submissions.filter(
      (s) => s.roundNumber === roundNumber && s.memberId === member.userId
    );

    const confirmedAmount = memberSubmissions
      .filter((s) => s.status === 'confirmed')
      .reduce((sum, s) => sum + s.amount, 0);

    const pendingAmount = memberSubmissions
      .filter((s) => s.status === 'pending' || s.status === 'clarification_needed')
      .reduce((sum, s) => sum + s.amount, 0);

    const status = calculateMemberObligationStatus(
      group.contributionAmount,
      confirmedAmount,
      pendingAmount,
      roundDueDate,
      isDirectBeneficiary,
      referenceDateStr
    );

    return {
      roundNumber,
      memberId: member.userId,
      memberName: member.name,
      requiredAmount: group.contributionAmount,
      confirmedAmount,
      pendingAmount,
      dueDate: roundDueDate,
      status,
      isBeneficiaryOffsetApplied: isDirectBeneficiary,
    };
  });
}

/**
 * Aggregates slot obligations into member summaries (Section 5).
 */
export function getMemberSlotSummary(
  group: NjangiGroup,
  userId: string
): {
  memberId: string;
  slots: ParticipationSlot[];
  totalSlotsCount: number;
  nominalEntitlementTotal: number;
  totalCycleObligations: number;
  confirmedContributions: number;
  pendingContributions: number;
  scheduledAllocationsTotal: number;
  settledEntitlementTotal: number;
  outstandingEntitlement: number;
} {
  const userSlots = (group.slots || []).filter((s) => s.memberId === userId);
  const totalSlotsCount = userSlots.length;
  const cycleEntitlementPerSlot = (group.slots?.length || group.members.length) * group.contributionAmount;
  const nominalEntitlementTotal = totalSlotsCount * cycleEntitlementPerSlot;
  const totalCycleObligations = totalSlotsCount * group.totalRounds * group.contributionAmount;

  const userSubmissions = group.submissions.filter((s) => s.memberId === userId);
  const confirmedContributions = userSubmissions
    .filter((s) => s.status === 'confirmed')
    .reduce((sum, s) => sum + s.amount, 0);

  const pendingContributions = userSubmissions
    .filter((s) => s.status === 'pending' || s.status === 'clarification_needed')
    .reduce((sum, s) => sum + s.amount, 0);

  const userAllocations = (group.payoutAllocations || []).filter((a) => a.beneficiaryId === userId);
  const scheduledAllocationsTotal = userAllocations.reduce((sum, a) => sum + a.scheduledAmount, 0);
  const settledEntitlementTotal = userAllocations.reduce(
    (sum, a) => sum + (a.settledAmount || 0) + (a.offsetAmount || 0),
    0
  );
  const outstandingEntitlement = Math.max(0, nominalEntitlementTotal - settledEntitlementTotal);

  return {
    memberId: userId,
    slots: userSlots,
    totalSlotsCount,
    nominalEntitlementTotal,
    totalCycleObligations,
    confirmedContributions,
    pendingContributions,
    scheduledAllocationsTotal,
    settledEntitlementTotal,
    outstandingEntitlement,
  };
}

/**
 * Section 8 & 9: Financial summary for a round respecting collection arrangements and multiple beneficiaries.
 */
export function calculateRoundSummary(group: NjangiGroup, roundNumber: number) {
  const totalSlotsCount = group.slots?.length || group.members.length;
  const nominalRoundEntitlement = group.contributionAmount * totalSlotsCount;
  const isDirect = group.collectionArrangement === 'direct_beneficiary';

  const roundBeneficiaries = getRoundBeneficiaries(group, roundNumber);

  // Section 9: Self-offsets applied in this round
  const roundOffsets = (group.beneficiaryOffsets || []).filter((o) => o.roundNumber === roundNumber);
  let totalBeneficiaryOffset = roundOffsets.reduce((sum, o) => sum + o.offsetAmount, 0);

  // In direct beneficiary collection, if explicit offset records haven't been generated yet,
  // round beneficiaries offset their own obligations in their payout round
  if (totalBeneficiaryOffset === 0 && isDirect && roundBeneficiaries.length > 0) {
    if (group.slots && group.slots.length > 0) {
      const beneficiaryMemberIds = new Set(roundBeneficiaries.map((b) => b.userId));
      const beneficiarySlots = group.slots.filter((s) => beneficiaryMemberIds.has(s.memberId));
      totalBeneficiaryOffset = beneficiarySlots.length * group.contributionAmount;
    } else {
      totalBeneficiaryOffset = roundBeneficiaries.length * group.contributionAmount;
    }
  }

  const expectedExternalReceipts = isDirect
    ? Math.max(0, nominalRoundEntitlement - totalBeneficiaryOffset)
    : nominalRoundEntitlement;

  const roundSubmissions = group.submissions.filter((s) => s.roundNumber === roundNumber);

  const confirmedExternalReceipts = roundSubmissions
    .filter((s) => s.status === 'confirmed')
    .reduce((sum, s) => sum + s.amount, 0);

  const pendingVerification = roundSubmissions
    .filter((s) => s.status === 'pending' || s.status === 'clarification_needed')
    .reduce((sum, s) => sum + s.amount, 0);

  const outstandingExternalReceipts = Math.max(
    0,
    expectedExternalReceipts - confirmedExternalReceipts
  );

  // Central payouts
  const centralPayouts = (group.centralPayouts || []).filter((p) => p.roundNumber === roundNumber);
  const actualPaidOut =
    !isDirect
      ? centralPayouts
          .filter((p) => p.status === 'recorded' || p.status === 'acknowledged')
          .reduce((sum, p) => sum + p.proposedAmount, 0)
      : 0;

  return {
    collectionArrangement: group.collectionArrangement,
    nominalEntitlement: nominalRoundEntitlement,
    beneficiaryOffset: totalBeneficiaryOffset,
    expectedExternalReceipts,
    confirmedExternalReceipts,
    pendingVerification,
    outstandingExternalReceipts,
    actualPaidOut,
    roundBeneficiaries,
    roundBeneficiary: roundBeneficiaries[0]
      ? group.members.find((m) => m.userId === roundBeneficiaries[0].userId) || {
          userId: roundBeneficiaries[0].userId,
          name: roundBeneficiaries[0].name,
          phone: '',
          roles: ['member'],
          payoutTurn: roundNumber,
          joinedDate: '',
        }
      : null,
    isFullyFunded: confirmedExternalReceipts >= expectedExternalReceipts,
    centralPayouts,
    centralPayout: centralPayouts[0] || null,
  };
}

/**
 * Validates payout turn uniqueness for simple schedules.
 */
export function validatePayoutTurns(members: GroupMember[]): { valid: boolean; error?: string } {
  const turns = new Set<number>();
  for (const m of members) {
    if (m.payoutTurn < 1 || m.payoutTurn > members.length) {
      return {
        valid: false,
        error: `Payout turn ${m.payoutTurn} for ${m.name} is outside valid range (1-${members.length}).`,
      };
    }
    if (turns.has(m.payoutTurn)) {
      return {
        valid: false,
        error: `Duplicate payout turn ${m.payoutTurn} detected. Each member must have a unique turn.`,
      };
    }
    turns.add(m.payoutTurn);
  }
  return { valid: true };
}

/**
 * Checks for repeated transaction references in the context of provider and account.
 * Section 12: Detect duplicate references within provider and receiving-account context.
 */
export function findDuplicateReference(
  group: NjangiGroup,
  reference: string | undefined,
  provider?: string,
  destinationAccount?: string,
  currentSubmissionId?: string
): PaymentSubmission | null {
  if (!reference || !reference.trim()) {
    return null;
  }
  const cleanRef = reference.trim().toLowerCase();
  const match = group.submissions.find((s) => {
    if (s.id === currentSubmissionId) return false;
    if (s.status === 'rejected' || s.status === 'withdrawn' || s.status === 'reversed') return false;
    if (!s.reference) return false;
    const sameRef = s.reference.trim().toLowerCase() === cleanRef;
    if (!sameRef) return false;
    if (provider && s.paymentMethod !== provider) return false;
    return true;
  });
  return match || null;
}

/**
 * Validates receipt allocation rule: total allocations cannot exceed confirmed receipt amount.
 * Section 11 & 12.
 */
export function validateReceiptAllocations(
  receiptAmount: number,
  allocations: ReceiptAllocation[]
): { valid: boolean; totalAllocated: number; unallocated: number; error?: string } {
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
  if (totalAllocated > receiptAmount) {
    return {
      valid: false,
      totalAllocated,
      unallocated: receiptAmount - totalAllocated,
      error: `Allocations total (${formatFCFA(totalAllocated)}) exceeds receipt amount (${formatFCFA(receiptAmount)}).`,
    };
  }
  return {
    valid: true,
    totalAllocated,
    unallocated: receiptAmount - totalAllocated,
  };
}

/**
 * Section 14: Group ledger and cash custody summary.
 * Strictly separates rotating funds, collected fines, assessed unpaid fines,
 * unallocated receipts, member credits, direct settlements, and non-cash offsets.
 */
export function calculateLedgerSummary(
  ledger: LedgerEntry[],
  submissions: PaymentSubmission[] = [],
  offsets: any[] = []
) {
  let confirmedContributions = 0;
  let payouts = 0;
  let finesAssessed = 0;
  let finesCollected = 0;
  let correctionsIn = 0;
  let correctionsOut = 0;
  let handoversIn = 0;
  let handoversOut = 0;

  for (const entry of ledger) {
    switch (entry.type) {
      case 'contribution':
        confirmedContributions += entry.amount;
        break;
      case 'payout':
        payouts += entry.amount;
        break;
      case 'fine_assessed':
        finesAssessed += entry.amount;
        break;
      case 'fine_collected':
        finesCollected += entry.amount;
        break;
      case 'correction_in':
        correctionsIn += entry.amount;
        break;
      case 'correction_out':
        correctionsOut += entry.amount;
        break;
      case 'handover_in':
        handoversIn += entry.amount;
        break;
      case 'handover_out':
        handoversOut += entry.amount;
        break;
    }
  }

  // Recorded balance reflects actual cash in - cash out
  const recordedBalance =
    confirmedContributions + finesCollected + correctionsIn - payouts - correctionsOut;

  // Unallocated receipts
  const unallocatedReceiptsTotal = submissions
    .filter((s) => s.status === 'confirmed')
    .reduce((sum, s) => sum + (s.unallocatedAmount || 0), 0);

  // Noncash offsets total (strictly outside ledger)
  const noncashOffsetsTotal = offsets.reduce((sum, o) => sum + (o.offsetAmount || 0), 0);

  return {
    confirmedContributions,
    payouts,
    finesAssessed,
    finesCollected,
    correctionsIn,
    correctionsOut,
    recordedBalance,
    unallocatedReceiptsTotal,
    noncashOffsetsTotal,
  };
}

/**
 * Section 16: Safe CSV Export handling preventing CSV formula injection (=, +, -, @)
 */
export function sanitizeCsvField(field: string | number | undefined | null): string {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  // Neutralize formula injection triggers
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

/**
 * Generates audit-safe, role-restricted CSV data.
 */
export function generateSafeContributionsCsv(
  group: NjangiGroup,
  isReviewerOrAdmin: boolean
): string {
  const headers = [
    'Round',
    'Slot / Member',
    'Amount (FCFA)',
    'Payment Date',
    'Method',
    'Status',
    'Reference',
    'Payer Name',
    'Submitted By',
    'Submission Date',
  ];

  if (isReviewerOrAdmin) {
    headers.push('Verified By', 'Verification Date');
  }

  const rows = group.submissions.map((s) => {
    const row = [
      sanitizeCsvField(s.roundNumber),
      sanitizeCsvField(s.slotName ? `${s.slotName} (${s.memberName})` : s.memberName),
      sanitizeCsvField(s.amount),
      sanitizeCsvField(s.paymentDate),
      sanitizeCsvField(s.paymentMethod),
      sanitizeCsvField(s.status),
      sanitizeCsvField(s.reference || s.cashReceiptNumber || 'N/A'),
      sanitizeCsvField(s.payerName || s.memberName),
      sanitizeCsvField(s.submittedByName),
      sanitizeCsvField(s.submittedAt),
    ];

    if (isReviewerOrAdmin) {
      row.push(
        sanitizeCsvField(s.verifiedByName || 'N/A'),
        sanitizeCsvField(s.verifiedAt || 'N/A')
      );
    }

    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Creates an immutable audit log entry.
 */
export function createAuditLog(
  actor: { id: string; name: string },
  action: string,
  details: string,
  reason?: string,
  groupId?: string
): AuditLogEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    action,
    details,
    reason,
    groupId,
  };
}
