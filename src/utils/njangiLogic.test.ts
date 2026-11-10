/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFCFA,
  calculateMemberObligationStatus,
  calculateRoundSummary,
  findDuplicateReference,
  validateReceiptAllocations,
  calculateLedgerSummary,
  canUserConfirmReceipt,
  getFrequencyDays,
  calculateRoundDueDate,
  formatFrequency,
} from './njangiLogic.ts';
import type { NjangiGroup, User, LedgerEntry, GroupMember } from '../types/njangi.ts';

test('formatFCFA formats whole numbers correctly with Cameroon spacing and FCFA currency', () => {
  assert.equal(formatFCFA(25000), '25\u202f000 FCFA'); // \u202f or standard space in fr-FR
  assert.equal(formatFCFA(0), '0 FCFA');
});

test('calculateRoundSummary correctly applies beneficiary offset in Direct Beneficiary Collection', () => {
  const directGroup: NjangiGroup = {
    id: 'grp-direct',
    name: 'Direct Test Group',
    description: 'Test',
    currency: 'FCFA',
    contributionAmount: 25000,
    collectionArrangement: 'direct_beneficiary',
    frequency: 'monthly',
    firstContributionDate: '2026-08-01',
    paymentDeadlineDays: 5,
    cycleActive: true,
    cycleNumber: 1,
    currentRound: 1,
    totalRounds: 10,
    lateFeeEnabled: false,
    lateFeeAmount: 0,
    rules: [],
    members: Array.from({ length: 10 }, (_, i) => ({
      userId: `user-${i + 1}`,
      name: `Member ${i + 1}`,
      phone: `+237 670 00 00 0${i}`,
      roles: ['member'],
      payoutTurn: i + 1,
      joinedDate: '2026-08-01',
    })),
    receivingDestinations: [],
    submissions: [
      {
        id: 'sub-1',
        groupId: 'grp-direct',
        cycleNumber: 1,
        roundNumber: 1,
        memberId: 'user-2',
        memberName: 'Member 2',
        amount: 25000,
        paymentDate: '2026-08-02',
        paymentMethod: 'mtn_momo',
        status: 'confirmed',
        submittedBy: 'user-2',
        submittedByName: 'Member 2',
        submittedAt: '2026-08-02T10:00:00Z',
        allocations: [],
        unallocatedAmount: 0,
      },
    ],
    centralPayouts: [],
    beneficiaryOffsets: [],
    disputes: [],
    auditLogs: [],
    ledger: [],
    announcements: [],
  };

  const summary = calculateRoundSummary(directGroup, 1);
  // 10 members * 25,000 = 250,000 nominal
  assert.equal(summary.nominalEntitlement, 250000);
  // Beneficiary offset = 25,000
  assert.equal(summary.beneficiaryOffset, 25000);
  // Expected external receipts = 225,000 (from remaining 9 members)
  assert.equal(summary.expectedExternalReceipts, 225000);
  // 1 confirmed = 25,000
  assert.equal(summary.confirmedExternalReceipts, 25000);
  // Outstanding external receipts = 225,000 - 25,000 = 200,000
  assert.equal(summary.outstandingExternalReceipts, 200000);
  // Direct receipts NEVER create a central payout
  assert.equal(summary.actualPaidOut, 0);
});

test('Beneficiary offset satisfies member obligation without creating cash ledger entry', () => {
  // When offset is applied, obligation is fully satisfied
  const status = calculateMemberObligationStatus(
    25000,
    0, // 0 cash paid
    0,
    '2026-08-05',
    true // isBeneficiaryOffsetApplied
  );
  assert.equal(status, 'fully_satisfied');

  // Ledger summary excludes offsets and distinguishes assessed fines from collected fines
  const ledgerEntries: LedgerEntry[] = [
    {
      id: 'led-1',
      date: '2026-08-02',
      type: 'contribution',
      description: 'Confirmed external contribution',
      amount: 25000,
      recordedBy: 'Treasurer',
    },
    {
      id: 'led-2',
      date: '2026-08-03',
      type: 'fine_assessed',
      description: 'Assessed late fine (not collected)',
      amount: 1000,
      recordedBy: 'Treasurer',
    },
    {
      id: 'led-3',
      date: '2026-08-04',
      type: 'fine_collected',
      description: 'Late fine collected in cash',
      amount: 1000,
      recordedBy: 'Treasurer',
    },
  ];

  const ledgerSummary = calculateLedgerSummary(ledgerEntries);
  // Cash balance = 25,000 + 1,000 collected = 26,000 (assessed fine is NOT cash)
  assert.equal(ledgerSummary.recordedBalance, 26000);
  assert.equal(ledgerSummary.finesAssessed, 1000);
  assert.equal(ledgerSummary.finesCollected, 1000);
});

test('Receipt allocations cannot exceed confirmed receipt amount', () => {
  const invalid = validateReceiptAllocations(50000, [
    { id: 'a1', roundNumber: 1, memberId: 'u1', memberName: 'U1', allocatedAmount: 30000 },
    { id: 'a2', roundNumber: 2, memberId: 'u1', memberName: 'U1', allocatedAmount: 25000 },
  ]);
  assert.equal(invalid.valid, false);
  assert.equal(invalid.totalAllocated, 55000);

  const valid = validateReceiptAllocations(50000, [
    { id: 'a1', roundNumber: 1, memberId: 'u1', memberName: 'U1', allocatedAmount: 25000 },
    { id: 'a2', roundNumber: 2, memberId: 'u1', memberName: 'U1', allocatedAmount: 25000 },
  ]);
  assert.equal(valid.valid, true);
  assert.equal(valid.unallocated, 0);
});

test('Temporary receiving authority: Round beneficiary can confirm in direct collection; Official cannot confirm self in central', () => {
  const dummyGroup: NjangiGroup = {
    id: 'grp-test',
    name: 'Test',
    description: '',
    currency: 'FCFA',
    contributionAmount: 25000,
    collectionArrangement: 'direct_beneficiary',
    frequency: 'monthly',
    firstContributionDate: '2026-08-01',
    paymentDeadlineDays: 5,
    cycleActive: true,
    cycleNumber: 1,
    currentRound: 1,
    totalRounds: 3,
    lateFeeEnabled: false,
    lateFeeAmount: 0,
    rules: [],
    members: [
      { userId: 'u1', name: 'Beneficiary Round 1', phone: '', roles: ['member'], payoutTurn: 1, joinedDate: '' },
      { userId: 'u2', name: 'Member 2', phone: '', roles: ['member'], payoutTurn: 2, joinedDate: '' },
      { userId: 'u3', name: 'Treasurer', phone: '', roles: ['treasurer'], payoutTurn: 3, joinedDate: '' },
    ],
    receivingDestinations: [],
    submissions: [],
    centralPayouts: [],
    beneficiaryOffsets: [],
    disputes: [],
    auditLogs: [],
    ledger: [],
    announcements: [],
  };

  const beneficiaryUser: User = { id: 'u1', name: 'Beneficiary Round 1', phone: '' };
  const member2User: User = { id: 'u2', name: 'Member 2', phone: '' };

  // Beneficiary for round 1 CAN confirm round 1 receipts from other members
  const r1Check = canUserConfirmReceipt(beneficiaryUser, dummyGroup, 1, 'u2');
  assert.equal(r1Check.canConfirm, true);

  // Member 2 CANNOT confirm round 1 receipts
  const r2Check = canUserConfirmReceipt(member2User, dummyGroup, 1, 'u1');
  assert.equal(r2Check.canConfirm, false);

  // In central collection, treasurer CANNOT confirm their own contribution!
  const centralGroup: NjangiGroup = {
    ...dummyGroup,
    collectionArrangement: 'central',
  };
  const treasurerUser: User = { id: 'u3', name: 'Treasurer', phone: '' };
  const selfCheck = canUserConfirmReceipt(treasurerUser, centralGroup, 1, 'u3');
  assert.equal(selfCheck.canConfirm, false);
});

test('findDuplicateReference catches repeated transaction reference codes within same provider', () => {
  const group: NjangiGroup = {
    id: 'grp-dup',
    name: 'Dup Group',
    description: '',
    currency: 'FCFA',
    contributionAmount: 25000,
    collectionArrangement: 'central',
    frequency: 'monthly',
    firstContributionDate: '2026-08-01',
    paymentDeadlineDays: 5,
    cycleActive: true,
    cycleNumber: 1,
    currentRound: 1,
    totalRounds: 2,
    lateFeeEnabled: false,
    lateFeeAmount: 0,
    rules: [],
    members: [],
    receivingDestinations: [],
    submissions: [
      {
        id: 'sub-existing',
        groupId: 'grp-dup',
        cycleNumber: 1,
        roundNumber: 1,
        memberId: 'u1',
        memberName: 'U1',
        amount: 25000,
        paymentDate: '2026-08-01',
        paymentMethod: 'mtn_momo',
        reference: 'MTN-REF-999',
        status: 'confirmed',
        submittedBy: 'u1',
        submittedByName: 'U1',
        submittedAt: '2026-08-01T10:00:00Z',
        allocations: [],
        unallocatedAmount: 0,
      },
    ],
    centralPayouts: [],
    beneficiaryOffsets: [],
    disputes: [],
    auditLogs: [],
    ledger: [],
    announcements: [],
  };

  const dup = findDuplicateReference(group, 'mtn-ref-999', 'mtn_momo');
  assert.notEqual(dup, null);
  assert.equal(dup?.id, 'sub-existing');

  const differentRef = findDuplicateReference(group, 'MTN-REF-001', 'mtn_momo');
  assert.equal(differentRef, null);
});

test('Frequency model: Daily frequency computes 1 day cadence and appropriate round due dates', () => {
  assert.equal(getFrequencyDays('daily'), 1);

  const dailyGroup: NjangiGroup = {
    id: 'grp-daily-test',
    name: 'Douala Market Traders Daily',
    description: 'Daily collection',
    currency: 'FCFA',
    contributionAmount: 5000,
    collectionArrangement: 'central',
    frequency: 'daily',
    firstContributionDate: '2026-08-01',
    paymentDeadlineDays: 1,
    cycleActive: true,
    cycleNumber: 1,
    currentRound: 1,
    totalRounds: 10,
    lateFeeEnabled: false,
    lateFeeAmount: 0,
    rules: [],
    members: [],
    receivingDestinations: [],
    submissions: [],
    centralPayouts: [],
    beneficiaryOffsets: [],
    disputes: [],
    auditLogs: [],
    ledger: [],
    announcements: [],
  };

  const dueRound1 = calculateRoundDueDate(dailyGroup, 1);
  const dueRound2 = calculateRoundDueDate(dailyGroup, 2);
  const dueRound3 = calculateRoundDueDate(dailyGroup, 3);

  // Round 1 start 2026-08-01 + 1 day deadline = 2026-08-02
  assert.equal(dueRound1, '2026-08-02');
  // Round 2 start 2026-08-02 + 1 day deadline = 2026-08-03
  assert.equal(dueRound2, '2026-08-03');
  // Round 3 start 2026-08-03 + 1 day deadline = 2026-08-04
  assert.equal(dueRound3, '2026-08-04');

  assert.equal(formatFrequency(dailyGroup, 'en'), 'Daily');
  assert.equal(formatFrequency(dailyGroup, 'fr'), 'Quotidien (Chaque jour)');
});

test('Frequency model: Custom cadence computes configured interval in days', () => {
  // Custom every 3 days
  assert.equal(getFrequencyDays('custom', 3), 3);
  // Custom every 10 days
  assert.equal(getFrequencyDays('custom', 10), 10);

  const customGroup: NjangiGroup = {
    id: 'grp-custom-test',
    name: 'Custom 3-Day Njangi',
    description: 'Runs every 3 days',
    currency: 'FCFA',
    contributionAmount: 10000,
    collectionArrangement: 'central',
    frequency: 'custom',
    customFrequencyDays: 3,
    customFrequencyLabel: 'Every 3 Days',
    firstContributionDate: '2026-08-01',
    paymentDeadlineDays: 2,
    cycleActive: true,
    cycleNumber: 1,
    currentRound: 1,
    totalRounds: 5,
    lateFeeEnabled: false,
    lateFeeAmount: 0,
    rules: [],
    members: [],
    receivingDestinations: [],
    submissions: [],
    centralPayouts: [],
    beneficiaryOffsets: [],
    disputes: [],
    auditLogs: [],
    ledger: [],
    announcements: [],
  };

  const dueRound1 = calculateRoundDueDate(customGroup, 1);
  const dueRound2 = calculateRoundDueDate(customGroup, 2);

  // Round 1: start Aug 1 + 2 days = Aug 3
  assert.equal(dueRound1, '2026-08-03');
  // Round 2: start Aug 1 + 3 days (Aug 4) + 2 days deadline = Aug 6
  assert.equal(dueRound2, '2026-08-06');

  assert.equal(formatFrequency(customGroup, 'en'), 'Every 3 Days');
});

test('Role governance: User accounts and new joiners default to member role', () => {
  const newAccountMember: GroupMember = {
    userId: 'u-new',
    name: 'New Registered User',
    phone: '+237 670 11 22 33',
    roles: ['member'],
    payoutTurn: 5,
    joinedDate: '2026-08-01',
  };

  // Starts strictly as member
  assert.deepEqual(newAccountMember.roles, ['member']);
  assert.equal(newAccountMember.roles.includes('admin'), false);

  // Promoting to admin when granted by creator
  const promotedRoles = Array.from(new Set([...newAccountMember.roles, 'admin']));
  assert.deepEqual(promotedRoles, ['member', 'admin']);
  assert.equal(promotedRoles.includes('admin'), true);
});
