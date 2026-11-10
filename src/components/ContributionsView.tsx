/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../context/NjangiContext.tsx';
import {
  getRoundSlotObligations,
  calculateRoundSummary,
  calculateRoundDueDate,
  formatFCFA,
} from '../utils/njangiLogic.ts';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  User,
  ShieldCheck,
  Lock,
  Eye,
  ArrowRightLeft,
  RotateCcw,
  Flag,
} from 'lucide-react';
import { NoGroupState } from './NoGroupState.tsx';

interface ContributionsViewProps {
  onOpenSubmitModal: (targetRound?: number) => void;
  onOpenVerifyModal: (submissionId?: string) => void;
  onOpenDisputeModal?: (targetId: string, round: number) => void;
}

export const ContributionsView: React.FC<ContributionsViewProps> = ({
  onOpenSubmitModal,
  onOpenVerifyModal,
  onOpenDisputeModal,
}) => {
  const {
    activeGroup,
    currentUser,
    canConfirmReceiptForRound,
    canViewPrivateEvidence,
    withdrawSubmission,
    reverseConfirmedSubmission,
    isAdmin,
    isTreasurer,
    isReviewer,
    t,
    currentLanguage,
  } = useNjangi();

  const [selectedRound, setSelectedRound] = useState<number>(activeGroup?.currentRound || 1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showReversalModal, setShowReversalModal] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');

  if (!activeGroup) {
    return <NoGroupState />;
  }

  const summary = calculateRoundSummary(activeGroup, selectedRound);
  const obligations = getRoundSlotObligations(activeGroup, selectedRound);
  const roundDueDate = calculateRoundDueDate(activeGroup, selectedRound);
  const isDirect = activeGroup.collectionArrangement === 'direct_beneficiary';

  // Section 8: Payment routings for this round (if direct collection)
  const roundRoutings = (activeGroup.paymentRoutings || []).filter(
    (r) => r.roundNumber === selectedRound
  );

  // Receiving permission check for the selected round
  const receivingAuth = canConfirmReceiptForRound(selectedRound);

  // Submissions for selected round
  const roundSubmissions = activeGroup.submissions.filter(
    (s) => s.roundNumber === selectedRound
  );

  const filteredSubmissions = roundSubmissions.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  // Approved receiving destination for this round
  const approvedDestination = activeGroup.receivingDestinations.find(
    (d) => d.status === 'approved' && (d.roundNumber === selectedRound || !d.roundNumber)
  );

  const handleWithdraw = (submissionId: string) => {
    if (window.confirm(currentLanguage === 'fr' ? 'Retirer cette déclaration ?' : 'Withdraw this payment declaration?')) {
      withdrawSubmission({ groupId: activeGroup.id, submissionId });
    }
  };

  const handleExecuteReversal = () => {
    if (!showReversalModal || !reversalReason.trim()) return;
    reverseConfirmedSubmission({
      groupId: activeGroup.id,
      submissionId: showReversalModal,
      reason: reversalReason.trim(),
    });
    setShowReversalModal(null);
    setReversalReason('');
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header & Round Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t.navContributions}
          </h2>
          <p className="text-xs text-gray-500">
            {isDirect
              ? (currentLanguage === 'fr' ? 'Collecte Directe : Le bénéficiaire confirme les réceptions de son tour' : 'Direct Collection: Round beneficiary confirms receipts directly')
              : (currentLanguage === 'fr' ? 'Collecte Centrale : Le trésorier confirme avant le versement central' : 'Central Collection: Group treasury confirms receipts')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenSubmitModal(selectedRound)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>{t.submitPaymentBtn}</span>
        </button>
      </div>

      {/* Round Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {Array.from({ length: activeGroup.totalRounds }, (_, i) => i + 1).map((roundNum) => {
          const isSelected = roundNum === selectedRound;
          const isCurrent = roundNum === activeGroup.currentRound;
          const roundSum = calculateRoundSummary(activeGroup, roundNum);

          return (
            <button
              key={roundNum}
              type="button"
              onClick={() => setSelectedRound(roundNum)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                isSelected
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <span>{currentLanguage === 'fr' ? `Tour ${roundNum}` : `Round ${roundNum}`}</span>
              {isCurrent && (
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-400' : 'bg-emerald-600'}`} />
              )}
              {roundSum.isFullyFunded && (
                <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* 2. Round Snapshot Summary Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {currentLanguage === 'fr' ? `Tour #${selectedRound} — Vue d’ensemble` : `Round #${selectedRound} — Record Summary`}
              </h3>
              <span className="text-xs bg-slate-100 text-gray-600 px-2.5 py-0.5 rounded-full font-medium">
                Due: {roundDueDate}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Beneficiary: <strong>{summary.roundBeneficiary?.name}</strong> • Entitlement: {formatFCFA(summary.nominalEntitlement)}
            </div>
          </div>

          {/* Receiving destination notice */}
          {approvedDestination && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-950 p-2.5 rounded-xl">
              <span className="font-semibold">Approved Destination: </span>
              <span>{approvedDestination.provider.toUpperCase()} — {approvedDestination.accountName} ({approvedDestination.accountNumberOrDetails})</span>
            </div>
          )}
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-500 block uppercase font-medium text-[10px]">
              {isDirect ? t.expectedExternalReceipts : t.expectedPot}
            </span>
            <span className="text-base font-bold text-gray-900 mt-0.5 block">
              {formatFCFA(summary.expectedExternalReceipts)}
            </span>
            {isDirect && (
              <span className="text-[10px] text-amber-700 block">
                Offset: {formatFCFA(summary.beneficiaryOffset)}
              </span>
            )}
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl">
            <span className="text-emerald-700 block uppercase font-medium text-[10px]">
              {t.confirmedCollected}
            </span>
            <span className="text-base font-bold text-emerald-900 mt-0.5 block">
              {formatFCFA(summary.confirmedExternalReceipts)}
            </span>
            <span className="text-[10px] text-emerald-600 block">Verified external</span>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl">
            <span className="text-amber-700 block uppercase font-medium text-[10px]">
              {t.submittedPending}
            </span>
            <span className="text-base font-bold text-amber-900 mt-0.5 block">
              {formatFCFA(summary.pendingVerification)}
            </span>
            <span className="text-[10px] text-amber-600 block">Awaiting check</span>
          </div>

          <div className="p-3 bg-rose-50 rounded-xl">
            <span className="text-rose-700 block uppercase font-medium text-[10px]">
              {t.outstandingAmount}
            </span>
            <span className="text-base font-bold text-rose-900 mt-0.5 block">
              {formatFCFA(summary.outstandingExternalReceipts)}
            </span>
            <span className="text-[10px] text-rose-600 block">
              {summary.isFullyFunded ? 'Completed' : 'Remaining'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Member Obligations Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
            {currentLanguage === 'fr' ? 'Tableau des Obligations des Membres' : 'Member Contribution Obligations'}
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            {obligations.length} Members
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {obligations.map((ob) => {
            const member = activeGroup.members.find((m) => m.userId === ob.memberId);
            const isCurrentUser = ob.memberId === currentUser.id;

            return (
              <div
                key={ob.memberId}
                className={`p-3 sm:px-4 flex items-center justify-between text-xs transition ${
                  isCurrentUser ? 'bg-emerald-50/40' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-gray-700 flex items-center justify-center font-bold text-xs shrink-0">
                    {member?.name[0] || 'M'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900 truncate">{member?.name}</span>
                      {isCurrentUser && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded">
                          You
                        </span>
                      )}
                      {member?.payoutTurn === selectedRound && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 rounded">
                          Beneficiary
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {ob.isBeneficiaryOffsetApplied ? (
                        <span className="text-amber-800 font-medium">
                          Beneficiary offset applied: {formatFCFA(ob.requiredAmount)}
                        </span>
                      ) : (
                        <span>
                          Confirmed: <strong>{formatFCFA(ob.confirmedAmount)}</strong> of {formatFCFA(ob.requiredAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                      ob.status === 'fully_satisfied'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : ob.status === 'partially_paid'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : ob.status === 'overdue'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    {ob.status === 'fully_satisfied'
                      ? t.paid
                      : ob.status === 'partially_paid'
                      ? t.partial
                      : ob.status === 'overdue'
                      ? t.overdue
                      : t.unpaid}
                  </span>

                  {!ob.isBeneficiaryOffsetApplied && ob.confirmedAmount < ob.requiredAmount && (
                    <button
                      type="button"
                      onClick={() => onOpenSubmitModal(selectedRound)}
                      className="hidden sm:inline-block px-2.5 py-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg border border-emerald-200"
                    >
                      Record
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 8: Direct Multi-Beneficiary Payment Routing Table */}
      {isDirect && roundRoutings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xs border border-amber-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-50/80 border-b border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-700" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                {currentLanguage === 'fr' ? 'Plan de Routage des Paiements Directs (Section 8)' : 'Direct Multi-Beneficiary Payment Routing (Section 8)'}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-amber-800">
              Balanced: {formatFCFA(summary.nominalEntitlement)}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5">Contributing Slot</th>
                  <th className="px-4 py-2.5">Contributor</th>
                  <th className="px-4 py-2.5">Amount Payable</th>
                  <th className="px-4 py-2.5">Beneficiary Recipient</th>
                  <th className="px-4 py-2.5">Approved Destination</th>
                  <th className="px-4 py-2.5">Offset / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roundRoutings.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/20">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.contributingSlotId}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">{r.contributingMemberName}</td>
                    <td className="px-4 py-2.5 font-bold text-emerald-800">{formatFCFA(r.amount)}</td>
                    <td className="px-4 py-2.5 font-semibold text-amber-900">{r.beneficiaryName}</td>
                    <td className="px-4 py-2.5 text-[11px] text-gray-500">{r.destinationSnapshot}</td>
                    <td className="px-4 py-2.5">
                      {r.isSelfOffset ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Self-Offset (Non-cash)
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {r.status === 'confirmed' ? 'Paid & Confirmed' : 'Payment Due'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Payment Declarations / Submissions List (Section 6 & 7) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              {currentLanguage === 'fr' ? 'Déclarations de Paiement Soumises' : 'Submitted Payment Declarations'}
            </h3>
            <p className="text-xs text-gray-500">
              {currentLanguage === 'fr'
                ? 'Les déclarations restent en attente jusqu’à vérification par le receveur agréé.'
                : 'Declarations remain pending until verified by the round receiving officer.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1 bg-white text-gray-700 font-medium"
            >
              <option value="all">All Declarations ({roundSubmissions.length})</option>
              <option value="pending">Awaiting Verification</option>
              <option value="clarification_needed">Clarification Needed</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            {currentLanguage === 'fr' ? 'Aucune déclaration de paiement pour ce filtre.' : 'No payment declarations match this filter.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 mt-2">
            {filteredSubmissions.map((sub) => {
              const hasAccess = canViewPrivateEvidence(sub);
              const isPayer = currentUser.id === sub.memberId;
              const isPending = sub.status === 'pending' || sub.status === 'clarification_needed';

              return (
                <div key={sub.id} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900">{sub.memberName}</span>
                      <span className="text-xs font-mono font-bold text-emerald-800">
                        {formatFCFA(sub.amount)}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {sub.paymentMethod.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span>Date paid: <strong>{sub.paymentDate}</strong></span>
                      {sub.reference ? (
                        <span>TxID: <code className="bg-gray-50 px-1 rounded">{sub.reference}</code></span>
                      ) : (
                        <span className="text-amber-700 italic">No TxID: {sub.referenceUnavailableExplanation}</span>
                      )}
                      <span>Submitted by: {sub.submittedByName}</span>
                      {sub.payerName && <span>(Payer: {sub.payerName})</span>}
                    </div>

                    {/* Private Evidence / Attachments Privacy Boundary (Section 12) */}
                    {sub.hasAttachment && (
                      <div className="mt-1.5 flex items-center gap-2">
                        {hasAccess ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                            <Eye className="w-3 h-3 text-emerald-700" />
                            <span>Evidence Attachment: {sub.attachmentFileName || 'payment_receipt.jpg'} (Restricted Access)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded flex items-center gap-1">
                            <Lock className="w-3 h-3 text-gray-400" />
                            <span>Attachment Restricted: Visible only to payer and round receiving officer</span>
                          </span>
                        )}
                      </div>
                    )}

                    {sub.statusReason && (
                      <div className="mt-1 text-[11px] p-2 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg">
                        <strong>Reason:</strong> {sub.statusReason}
                      </div>
                    )}
                  </div>

                  {/* Actions & Status Badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${
                        sub.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : sub.status === 'pending'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : sub.status === 'clarification_needed'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : sub.status === 'withdrawn'
                          ? 'bg-gray-100 text-gray-600 border-gray-200'
                          : sub.status === 'reversed'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {sub.status === 'confirmed'
                        ? t.paid
                        : sub.status === 'pending'
                        ? t.pending
                        : sub.status === 'clarification_needed'
                        ? t.clarificationNeeded
                        : sub.status === 'withdrawn'
                        ? t.withdrawn
                        : sub.status === 'reversed'
                        ? t.reversed
                        : t.rejectBtn}
                    </span>

                    {/* Receiving Officer verify button */}
                    {receivingAuth.canConfirm && isPending && (
                      <button
                        type="button"
                        onClick={() => onOpenVerifyModal(sub.id)}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition"
                      >
                        {currentLanguage === 'fr' ? 'Évaluer' : 'Review'}
                      </button>
                    )}

                    {/* Submitter withdraw button */}
                    {isPending && (isPayer || currentUser.id === sub.submittedBy) && (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(sub.id)}
                        className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                      >
                        {t.withdrawn}
                      </button>
                    )}

                    {/* Controlled Reversal (Admin/Treasurer/Reviewer on confirmed records) */}
                    {sub.status === 'confirmed' && (isAdmin || isTreasurer || isReviewer) && (
                      <button
                        type="button"
                        onClick={() => setShowReversalModal(sub.id)}
                        title="Controlled Reversal"
                        className="p-1.5 text-gray-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Controlled Reversal Modal */}
      {showReversalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              {currentLanguage === 'fr' ? 'Annulation Contrôlée d’une Entrée Confirmée' : 'Controlled Reversal of Confirmed Receipt'}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {currentLanguage === 'fr'
                ? 'Une entrée confirmée ne peut être supprimée en silence. Une écriture de contrepassation liée sera enregistrée dans l’audit et le grand livre.'
                : 'Confirmed entries cannot be silently deleted. A linked reversal entry with your recorded reason will be posted to the audit log and group ledger.'}
            </p>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                {currentLanguage === 'fr' ? 'Motif de la contrepassation :' : 'Reversal Explanation (Mandatory):'}
              </label>
              <textarea
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Bank chargeback, duplicate entry discovered during reconciliation"
                className="w-full text-xs border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowReversalModal(null);
                  setReversalReason('');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                disabled={!reversalReason.trim()}
                onClick={handleExecuteReversal}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50"
              >
                {currentLanguage === 'fr' ? 'Exécuter l’annulation' : 'Execute Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
