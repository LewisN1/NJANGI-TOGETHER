/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { PaymentMethod } from '../../types/njangi.ts';
import { calculateRoundSummary, formatFCFA } from '../../utils/njangiLogic.ts';
import { X, Gift, AlertCircle, AlertTriangle, CheckCircle, ShieldCheck, Send } from 'lucide-react';

interface RecordPayoutModalProps {
  initialRound?: number;
  onClose: () => void;
}

export const RecordPayoutModal: React.FC<RecordPayoutModalProps> = ({
  initialRound,
  onClose,
}) => {
  const {
    activeGroup,
    currentUser,
    isAdmin,
    isTreasurer,
    isReviewer,
    proposeCentralPayout,
    approveCentralPayout,
    recordCentralPayoutTransfer,
    t,
    currentLanguage,
  } = useNjangi();

  if (!activeGroup) return null;

  const targetRound = initialRound || activeGroup.currentRound || 1;
  const roundSummary = calculateRoundSummary(activeGroup, targetRound);
  const existingProposal = activeGroup.centralPayouts.find((p) => p.roundNumber === targetRound);

  const [proposedAmount, setProposedAmount] = useState<string>(
    roundSummary.confirmedExternalReceipts.toString()
  );
  const [provider, setProvider] = useState<PaymentMethod>('mtn_momo');
  const [destinationAccount, setDestinationAccount] = useState(
    roundSummary.roundBeneficiary?.phone || ''
  );
  const [partialReason, setPartialReason] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const parsedAmount = parseInt(proposedAmount, 10) || 0;
  const shortfall = Math.max(0, roundSummary.nominalEntitlement - parsedAmount);

  // Propose payout
  const handlePropose = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (parsedAmount <= 0) {
      setErrorMsg('Proposed payout amount must be greater than zero.');
      return;
    }
    if (shortfall > 0 && !partialReason.trim()) {
      setErrorMsg('A recorded reason is required explaining the shortfall for this partial payout.');
      return;
    }

    const beneficiary = roundSummary.roundBeneficiaries?.[0] || roundSummary.roundBeneficiary;
    if (!beneficiary) {
      setErrorMsg('No beneficiary found for this round.');
      return;
    }

    const res = proposeCentralPayout({
      groupId: activeGroup.id,
      roundNumber: targetRound,
      beneficiaryId: beneficiary.userId,
      amount: parsedAmount,
      destinationProvider: provider,
      destinationAccount: destinationAccount.trim(),
      partialReason: shortfall > 0 ? partialReason.trim() : undefined,
    });

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => onClose(), 1400);
    } else {
      setErrorMsg(res.error || 'Failed to propose payout.');
    }
  };

  // Record transfer
  const handleRecordTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!existingProposal) return;
    if (!transferRef.trim()) {
      setErrorMsg('Please enter the external bank or telecom transfer reference.');
      return;
    }

    const res = recordCentralPayoutTransfer({
      groupId: activeGroup.id,
      payoutId: existingProposal.id,
      transferReference: transferRef.trim(),
    });

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => onClose(), 1400);
    } else {
      setErrorMsg(res.error || 'Failed to record transfer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              {t.recordPayoutBtn}
            </h3>
            <p className="text-xs text-gray-500">
              Round #{targetRound} • Beneficiary: <strong>{roundSummary.roundBeneficiary?.name}</strong>
            </p>
          </div>
        </div>

        {/* Multi-party Governance Notice (Section 10) */}
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Multi-Party Governance Control (Section 10): </strong>
            One person cannot propose and approve the same payout. Payout proposals require independent review before an external transfer can be recorded.
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base text-gray-900">
              {existingProposal?.status === 'approved' ? 'Payout Transfer Recorded!' : 'Payout Proposal Submitted!'}
            </h4>
            <p className="text-xs text-gray-600">
              Audit log updated. Recordkeeping state synchronized.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Stage: If existing proposal is APPROVED, record the external transfer reference */}
            {existingProposal?.status === 'approved' ? (
              <form onSubmit={handleRecordTransfer} className="space-y-3.5">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <span className="font-bold text-blue-900 block">Proposal Independently Approved!</span>
                  <p className="text-blue-800 text-[11px]">
                    Approved for <strong>{formatFCFA(existingProposal.proposedAmount)}</strong> to {existingProposal.beneficiaryName} ({existingProposal.destinationProvider.toUpperCase()}: {existingProposal.destinationAccount}).
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    External Bank or Mobile Money Transaction Reference:
                  </label>
                  <input
                    type="text"
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="e.g. MOMO-PAYOUT-9912 or BANQUE-VIR-2819"
                    className="w-full border border-gray-200 rounded-xl p-2.5 font-mono uppercase focus:outline-emerald-600"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    This records the external transfer in the group ledger. The beneficiary will be prompted to acknowledge receipt.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
                  >
                    Record External Transfer
                  </button>
                </div>
              </form>
            ) : existingProposal?.status === 'proposed' ? (
              /* Stage: Proposed, awaiting independent approval */
              <div className="space-y-3 p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-sm">Payout Proposal Awaiting Independent Approval</span>
                  <span className="text-[10px] bg-purple-200 text-purple-900 font-bold px-2 py-0.5 rounded-full uppercase">
                    Proposed
                  </span>
                </div>
                <div className="text-purple-950 text-xs space-y-1">
                  <p>Beneficiary: <strong>{existingProposal.beneficiaryName}</strong></p>
                  <p>Proposed Amount: <strong>{formatFCFA(existingProposal.proposedAmount)}</strong></p>
                  <p>Destination: {existingProposal.destinationProvider.toUpperCase()} ({existingProposal.destinationAccount})</p>
                  <p>Proposed by: {existingProposal.proposedByName}</p>
                </div>
                <p className="text-[11px] text-purple-800 italic pt-1">
                  Governance Rule: You cannot approve a payout you proposed. Another authorised official or reviewer can approve this in the Payouts tab.
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-purple-900 text-white font-bold rounded-xl text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Stage: Propose New Central Payout */
              <form onSubmit={handlePropose} className="space-y-3.5">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Nominal Entitlement:
                  </label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900">
                    {formatFCFA(roundSummary.nominalEntitlement)} ({activeGroup.members.length} members × {formatFCFA(activeGroup.contributionAmount)})
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">
                    Proposed Payout Amount (FCFA):
                  </label>
                  <input
                    type="number"
                    value={proposedAmount}
                    onChange={(e) => setProposedAmount(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-2.5 font-bold text-emerald-800 focus:outline-emerald-600"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    Confirmed external receipts collected so far: {formatFCFA(roundSummary.confirmedExternalReceipts)}
                  </span>
                </div>

                {shortfall > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Partial Payout Shortfall: {formatFCFA(shortfall)}</span>
                    </div>
                    <div>
                      <label className="text-gray-700 font-semibold block mb-1">
                        Mandatory Shortfall Explanation:
                      </label>
                      <textarea
                        value={partialReason}
                        onChange={(e) => setPartialReason(e.target.value)}
                        placeholder="State reason for partial disbursement (e.g. 2 members pending payment; remaining shortfall will disburse once collected)..."
                        className="w-full border border-amber-200 rounded-xl p-2 text-xs focus:outline-emerald-600"
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Destination Channel:</label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as PaymentMethod)}
                      className="w-full border border-gray-200 rounded-xl p-2.5 bg-white font-medium"
                    >
                      <option value="mtn_momo">MTN Mobile Money</option>
                      <option value="orange_money">Orange Money</option>
                      <option value="cash">Cash in hand</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Destination Account / Phone:</label>
                    <input
                      type="text"
                      value={destinationAccount}
                      onChange={(e) => setDestinationAccount(e.target.value)}
                      placeholder="+237 6..."
                      className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
                  >
                    Submit Payout Proposal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
