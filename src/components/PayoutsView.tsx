/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../context/NjangiContext.tsx';
import {
  calculateRoundSummary,
  calculateRoundPayoutDate,
  formatFCFA,
} from '../utils/njangiLogic.ts';
import {
  Calendar,
  Gift,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Send,
  Flag,
} from 'lucide-react';
import { NoGroupState } from './NoGroupState.tsx';

interface PayoutsViewProps {
  onOpenRecordPayoutModal: (roundNum?: number) => void;
  onOpenAcknowledgeModal: (roundNum?: number) => void;
  onOpenReorderModal: () => void;
  onOpenDisputeModal?: (targetId: string, round: number) => void;
}

export const PayoutsView: React.FC<PayoutsViewProps> = ({
  onOpenRecordPayoutModal,
  onOpenAcknowledgeModal,
  onOpenReorderModal,
  onOpenDisputeModal,
}) => {
  const {
    activeGroup,
    currentUser,
    isAdmin,
    isTreasurer,
    isReviewer,
    approveCentralPayout,
    t,
    currentLanguage,
  } = useNjangi();

  const [activeTabMode, setActiveTabMode] = useState<'list' | 'calendar'>('list');

  if (!activeGroup) {
    return <NoGroupState />;
  }

  const isDirect = activeGroup.collectionArrangement === 'direct_beneficiary';

  const handleApproveProposal = (payoutId: string, approved: boolean) => {
    approveCentralPayout({
      groupId: activeGroup.id,
      payoutId,
      approved,
      rejectionReason: approved ? undefined : 'Declined by independent reviewer/official',
    });
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t.navPayouts}
          </h2>
          <p className="text-xs text-gray-500">
            {isDirect
              ? (currentLanguage === 'fr' ? 'Collecte Directe : Les fonds sont reçus directement sans versement central supplémentaire.' : 'Direct Collection: Funds are received directly by the beneficiary without a central group payout.')
              : (currentLanguage === 'fr' ? 'Collecte Centrale : Processus multi-partie (Proposition → Approbation indépendante → Virement → Accusé)' : 'Central Collection: Multi-party controls (Proposed → Independently Approved → Transfer Recorded → Acknowledged)')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={onOpenReorderModal}
              className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>{currentLanguage === 'fr' ? 'Modifier l’ordre (Motif requis)' : 'Reorder Schedule'}</span>
            </button>
          )}

          {!isDirect && (isAdmin || isTreasurer) && (
            <button
              type="button"
              onClick={() => onOpenRecordPayoutModal()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.recordPayoutBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Collection Mode Policy Notice */}
      <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-xs ${
        isDirect
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
      }`}>
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block font-bold text-xs sm:text-sm">
            {isDirect ? t.directBeneficiaryCollection : t.centralCollection} Governance Policy
          </strong>
          <p className="mt-0.5 text-gray-700">
            {isDirect
              ? (currentLanguage === 'fr'
                  ? 'Dans ce mode, chaque bénéficiaire encaisse directement les cotisations des autres membres. La compensation de cotisation est appliquée pour sa propre part. L’application ne crée pas de versement central pour de l’argent déjà reçu directement.'
                  : 'In direct collection, each beneficiary collects contributions directly from the other members. Their own obligation is satisfied through the agreed beneficiary offset. The application records accountability without creating redundant central payouts.')
              : (currentLanguage === 'fr'
                  ? 'Dans ce mode, les fonds sont centralisés puis décaissés. Une proposition de versement doit être approuvée par une autre personne autorisée avant enregistrement du virement.'
                  : 'In central collection, collected funds are held in the treasury account. Payout proposals require independent review before external transfer is recorded, and the beneficiary confirms receipt.')}
          </p>
        </div>
      </div>

      {/* 3. Payout Schedule List by Round */}
      <div className="space-y-3">
        {Array.from({ length: activeGroup.totalRounds }, (_, i) => i + 1).map((roundNum) => {
          const summary = calculateRoundSummary(activeGroup, roundNum);
          const payoutDate = calculateRoundPayoutDate(activeGroup, roundNum);
          const isCurrent = roundNum === activeGroup.currentRound;
          const isPast = roundNum < activeGroup.currentRound;
          const isBeneficiary = summary.roundBeneficiary?.userId === currentUser.id;

          const centralProposal = activeGroup.centralPayouts.find((p) => p.roundNumber === roundNum);

          const roundAllocations = (activeGroup.payoutAllocations || []).filter((a) => a.roundNumber === roundNum);
          const hasMultipleAllocations = roundAllocations.length > 1;

          return (
            <div
              key={roundNum}
              className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border transition ${
                isCurrent
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-800 text-white shadow-md'
                      : isPast
                      ? 'bg-slate-100 text-gray-600'
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    #{roundNum}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-gray-900">
                        {roundAllocations.length > 0
                          ? roundAllocations.map((a) => a.beneficiaryName).join(' & ')
                          : summary.roundBeneficiary?.name || 'Assigned Member'}
                      </span>
                      {isBeneficiary && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                          Current Round
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Scheduled Turn: <strong>{payoutDate}</strong></span>
                      {hasMultipleAllocations && (
                        <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          Multi-Beneficiary Round ({roundAllocations.length} allocations)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side status */}
                <div className="flex items-center gap-2">
                  {isDirect ? (
                    <span className="px-3 py-1 bg-amber-50 text-amber-900 text-xs font-semibold rounded-lg border border-amber-200">
                      Direct Beneficiary Collection
                    </span>
                  ) : (
                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                      centralProposal?.status === 'acknowledged'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : centralProposal?.status === 'recorded'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : centralProposal?.status === 'approved'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : centralProposal?.status === 'disputed'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {centralProposal?.status === 'acknowledged'
                        ? t.payoutAcknowledged
                        : centralProposal?.status === 'recorded'
                        ? t.payoutRecorded
                        : centralProposal?.status === 'approved'
                        ? t.payoutApproved
                        : centralProposal?.status === 'disputed'
                        ? t.payoutDisputed
                        : t.payoutScheduled}
                    </span>
                  )}
                </div>
              </div>

              {/* Multi-allocation details if round has multiple allocations */}
              {hasMultipleAllocations && (
                <div className="mt-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200/70">
                  <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider block mb-1.5">
                    Round Payout Allocations (Section 6)
                  </span>
                  <div className="space-y-1.5">
                    {roundAllocations.map((alloc) => (
                      <div key={alloc.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-amber-100">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{alloc.beneficiaryName}</span>
                          <span className="text-[10px] text-gray-500 font-mono">({alloc.receivingSlotId})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-800">{formatFCFA(alloc.scheduledAmount)}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            alloc.status === 'fully_settled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {alloc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Breakdown per Round */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs">
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                    {t.nominalEntitlement}
                  </span>
                  <span className="font-bold text-gray-900 block mt-0.5">
                    {formatFCFA(summary.nominalEntitlement)}
                  </span>
                </div>

                {isDirect ? (
                  <>
                    <div className="p-2.5 bg-amber-50/70 rounded-xl">
                      <span className="text-amber-800 block text-[10px] uppercase font-semibold">
                        {t.beneficiaryOffsetLabel}
                      </span>
                      <span className="font-bold text-amber-900 block mt-0.5">
                        {formatFCFA(summary.beneficiaryOffset)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <span className="text-emerald-800 block text-[10px] uppercase font-semibold">
                        {t.confirmedExternalReceipts}
                      </span>
                      <span className="font-bold text-emerald-900 block mt-0.5">
                        {formatFCFA(summary.confirmedExternalReceipts)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-rose-50 rounded-xl">
                      <span className="text-rose-800 block text-[10px] uppercase font-semibold">
                        {t.outstandingExternalReceipts}
                      </span>
                      <span className="font-bold text-rose-900 block mt-0.5">
                        {formatFCFA(summary.outstandingExternalReceipts)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <span className="text-emerald-800 block text-[10px] uppercase font-semibold">
                        {t.confirmedCollected}
                      </span>
                      <span className="font-bold text-emerald-900 block mt-0.5">
                        {formatFCFA(summary.confirmedExternalReceipts)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <span className="text-blue-800 block text-[10px] uppercase font-semibold">
                        {t.actualAmountPaid}
                      </span>
                      <span className="font-bold text-blue-900 block mt-0.5">
                        {formatFCFA(centralProposal?.proposedAmount || 0)}
                      </span>
                    </div>

                    <div className="p-2.5 bg-rose-50 rounded-xl">
                      <span className="text-rose-800 block text-[10px] uppercase font-semibold">
                        {t.shortfall}
                      </span>
                      <span className="font-bold text-rose-900 block mt-0.5">
                        {formatFCFA(summary.outstandingExternalReceipts)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Central Payout Governance Actions (Section 10) */}
              {!isDirect && centralProposal && (
                <div className="mt-3 p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-gray-700">
                    <div>
                      <span>Proposed by: <strong>{centralProposal.proposedByName}</strong></span>
                      {centralProposal.approvedByName && (
                        <span> • Approved by: <strong>{centralProposal.approvedByName}</strong></span>
                      )}
                      {centralProposal.transferReference && (
                        <span> • Transfer Ref: <code>{centralProposal.transferReference}</code></span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Independent Approval Action: Section 10 Rule: Proposer cannot approve! */}
                      {centralProposal.status === 'proposed' && (isAdmin || isTreasurer || isReviewer) && (
                        <>
                          {centralProposal.proposedBy === currentUser.id ? (
                            <span className="text-[11px] text-amber-700 italic">
                              Multi-party rule: Awaiting independent approval by another official.
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApproveProposal(centralProposal.id, true)}
                              className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs"
                            >
                              Approve Payout
                            </button>
                          )}
                        </>
                      )}

                      {/* Beneficiary Acknowledgement or Dispute (Section 10 & 11) */}
                      {isBeneficiary && centralProposal.status === 'recorded' && (
                        <button
                          type="button"
                          onClick={() => onOpenAcknowledgeModal(roundNum)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                        >
                          {t.acknowledgeReceiptBtn}
                        </button>
                      )}
                    </div>
                  </div>

                  {centralProposal.partialReason && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <strong>Partial Payout Justification:</strong> {centralProposal.partialReason}
                    </div>
                  )}

                  {centralProposal.beneficiaryReceiptNote && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <strong>Beneficiary Confirmation:</strong> {centralProposal.beneficiaryReceiptNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
