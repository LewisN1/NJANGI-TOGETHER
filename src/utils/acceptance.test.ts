/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canUserConfirmReceipt,
  calculateRoundSummary,
  calculateMemberObligationStatus,
  validateReceiptAllocations,
  calculateLedgerSummary,
  findDuplicateReference,
} from './njangiLogic.ts';
import type { NjangiGroup, User, PaymentSubmission, LedgerEntry } from '../types/njangi.ts';

// Group A: Central Collection (Amadou is admin/treasurer)
const groupA: NjangiGroup = {
  id: 'group-a',
  name: 'Group A Central',
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
  totalRounds: 3,
  lateFeeEnabled: false,
  lateFeeAmount: 0,
  rules: [],
  members: [
    { userId: 'u-amadou', name: 'Amadou', phone: '', roles: ['admin', 'treasurer'], payoutTurn: 1, joinedDate: '' },
    { userId: 'u-chantal', name: 'Chantal', phone: '', roles: ['member'], payoutTurn: 2, joinedDate: '' },
    { userId: 'u-paul', name: 'Paul', phone: '', roles: ['member'], payoutTurn: 3, joinedDate: '' },
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

// Group B: Direct Collection (Chantal is admin, Amadou is ordinary member)
const groupB: NjangiGroup = {
  id: 'group-b',
  name: 'Group B Direct',
  description: '',
  currency: 'FCFA',
  contributionAmount: 50000,
  collectionArrangement: 'direct_beneficiary',
  frequency: 'monthly',
  firstContributionDate: '2026-09-01',
  paymentDeadlineDays: 5,
  cycleActive: true,
  cycleNumber: 1,
  currentRound: 1, // Chantal is turn 1 beneficiary
  totalRounds: 3,
  lateFeeEnabled: false,
  lateFeeAmount: 0,
  rules: [],
  members: [
    { userId: 'u-chantal', name: 'Chantal', phone: '', roles: ['admin'], payoutTurn: 1, joinedDate: '' },
    { userId: 'u-amadou', name: 'Amadou', phone: '', roles: ['member'], payoutTurn: 2, joinedDate: '' },
    { userId: 'u-paul', name: 'Paul', phone: '', roles: ['member'], payoutTurn: 3, joinedDate: '' },
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

const amadouUser: User = { id: 'u-amadou', name: 'Amadou', phone: '' };
const chantalUser: User = { id: 'u-chantal', name: 'Chantal', phone: '' };

test('Acceptance 1: Administrator in Group A cannot approve payments in Group B where they are an ordinary member', () => {
  // Amadou in Group A is admin/treasurer -> can confirm for Paul
  const checkGroupA = canUserConfirmReceipt(amadouUser, groupA, 1, 'u-paul');
  assert.equal(checkGroupA.canConfirm, true);

  // Amadou in Group B is an ordinary member -> CANNOT confirm receipts for Round 1
  const checkGroupB = canUserConfirmReceipt(amadouUser, groupB, 1, 'u-paul');
  assert.equal(checkGroupB.canConfirm, false);
});

test('Acceptance 2: A rotating receiver can confirm only receipts for their assigned rounds', () => {
  // In Group B (direct collection): Chantal is turn 1 beneficiary -> can confirm Round 1 receipts
  const chantalRound1 = canUserConfirmReceipt(chantalUser, groupB, 1, 'u-paul');
  assert.equal(chantalRound1.canConfirm, true);

  // Round 2 beneficiary is Amadou. Chantal (not being round 2 beneficiary) CANNOT confirm round 2 receipts as ordinary member
  const memberChantal: User = { id: 'u-chantal-plain', name: 'Chantal', phone: '' };
  const groupBNoAdmin: NjangiGroup = {
    ...groupB,
    members: [
      { userId: 'u-chantal-plain', name: 'Chantal', phone: '', roles: ['member'], payoutTurn: 1, joinedDate: '' },
      { userId: 'u-amadou', name: 'Amadou', phone: '', roles: ['member'], payoutTurn: 2, joinedDate: '' },
    ],
  };
  const chantalRound2 = canUserConfirmReceipt(memberChantal, groupBNoAdmin, 2, 'u-amadou');
  assert.equal(chantalRound2.canConfirm, false);
});

test('Acceptance 4: A submitted screenshot alone never increases confirmed receipts', () => {
  const groupWithPendingSubmission: NjangiGroup = {
    ...groupA,
    submissions: [
      {
        id: 'sub-pending',
        groupId: 'group-a',
        cycleNumber: 1,
        roundNumber: 1,
        memberId: 'u-paul',
        memberName: 'Paul',
        amount: 25000,
        paymentDate: '2026-08-02',
        paymentMethod: 'mtn_momo',
        hasAttachment: true,
        attachmentFileName: 'momo_screenshot.png',
        status: 'pending', // Awaiting verification
        submittedBy: 'u-paul',
        submittedByName: 'Paul',
        submittedAt: '2026-08-02T10:00:00Z',
        allocations: [],
        unallocatedAmount: 0,
      },
    ],
  };

  const summary = calculateRoundSummary(groupWithPendingSubmission, 1);
  // Confirmed collected MUST remain 0!
  assert.equal(summary.confirmedExternalReceipts, 0);
  assert.equal(summary.pendingVerification, 25000);
  assert.equal(summary.outstandingExternalReceipts, 75000); // 3 * 25,000 = 75,000
});

test('Acceptance 6: Allocations cannot exceed a confirmed receipt', () => {
  const overAllocated = validateReceiptAllocations(25000, [
    { id: 'a1', roundNumber: 1, memberId: 'u1', memberName: 'U1', allocatedAmount: 20000 },
    { id: 'a2', roundNumber: 2, memberId: 'u1', memberName: 'U1', allocatedAmount: 10000 },
  ]);
  assert.equal(overAllocated.valid, false);
  assert.equal(overAllocated.totalAllocated, 30000);

  const exactAllocated = validateReceiptAllocations(25000, [
    { id: 'a1', roundNumber: 1, memberId: 'u1', memberName: 'U1', allocatedAmount: 15000 },
    { id: 'a2', roundNumber: 1, memberId: 'u2', memberName: 'U2', allocatedAmount: 10000 },
  ]);
  assert.equal(exactAllocated.valid, true);
  assert.equal(exactAllocated.unallocated, 0);
});

test('Acceptance 7: Beneficiary offsets do not create cash entries', () => {
  const emptyLedger: LedgerEntry[] = [];
  const summary = calculateLedgerSummary(emptyLedger);
  assert.equal(summary.recordedBalance, 0);

  // Beneficiary offset satisfies obligation without cash
  const offsetStatus = calculateMemberObligationStatus(50000, 0, 0, '2026-09-05', true);
  assert.equal(offsetStatus, 'fully_satisfied');
});

test('Acceptance 8: Direct receipts do not create a second central payout', () => {
  const directSummary = calculateRoundSummary(groupB, 1);
  assert.equal(directSummary.actualPaidOut, 0);
  assert.equal(directSummary.collectionArrangement, 'direct_beneficiary');
});
