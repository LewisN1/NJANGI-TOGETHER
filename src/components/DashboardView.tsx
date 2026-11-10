/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNjangi } from '../context/NjangiContext.tsx';
import {
  calculateRoundSummary,
  calculateRoundDueDate,
  calculateRoundPayoutDate,
  formatFCFA,
} from '../utils/njangiLogic.ts';
import {
  Calendar,
  Clock,
  Banknote,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Share2,
  ChevronRight,
  Gift,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';
import { TabKey } from './BottomNav.tsx';
import { NoGroupState } from './NoGroupState.tsx';

interface DashboardViewProps {
  onNavigateTab: (tab: TabKey) => void;
  onOpenSubmitModal: () => void;
  onOpenVerifyModal: () => void;
  onOpenRecordPayoutModal: () => void;
  onOpenAcknowledgeModal: () => void;
  onOpenWhatsAppModal: () => void;
  onOpenCreateGroup?: () => void;
  onOpenJoinNjangi?: () => void;
  onOpenCreateAccount?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenSubmitModal,
  onOpenVerifyModal,
  onOpenRecordPayoutModal,
  onOpenAcknowledgeModal,
  onOpenWhatsAppModal,
  onOpenCreateGroup,
  onOpenJoinNjangi,
  onOpenCreateAccount,
}) => {
  const {
    activeGroup,
    currentUser,
    userRoles,
    isAdmin,
    isTreasurer,
    isReviewer,
    canConfirmReceiptForRound,
    t,
    currentLanguage,
  } = useNjangi();

  if (!activeGroup) {
    return (
      <NoGroupState
        onOpenCreateGroup={onOpenCreateGroup}
        onOpenJoinNjangi={onOpenJoinNjangi}
        onOpenCreateAccount={onOpenCreateAccount}
      />
    );
  }

  const currentRound = activeGroup.currentRound || 1;
  const summary = calculateRoundSummary(activeGroup, currentRound);
  const roundDueDate = calculateRoundDueDate(activeGroup, currentRound);
  const roundPayoutDate = calculateRoundPayoutDate(activeGroup, currentRound);
  const isDirect = activeGroup.collectionArrangement === 'direct_beneficiary';

  // Beneficiary of current round
  const currentBeneficiary = summary.roundBeneficiary;

  // Current user's receiving permission for this round (Section 4)
  const receivingAuth = canConfirmReceiptForRound(currentRound);

  // User's own member record
  const userMember = activeGroup.members.find((m) => m.userId === currentUser.id);
  const userTurn = userMember?.payoutTurn || 1;
  const isUserCurrentBeneficiary = userMember?.payoutTurn === currentRound;

  // User's contribution status for current round
  const userSubmissions = activeGroup.submissions.filter(
    (s) => s.roundNumber === currentRound && s.memberId === currentUser.id
  );
  const userConfirmed = userSubmissions
    .filter((s) => s.status === 'confirmed')
    .reduce((sum, s) => sum + s.amount, 0);
  const userPending = userSubmissions
    .filter((s) => s.status === 'pending' || s.status === 'clarification_needed')
    .reduce((sum, s) => sum + s.amount, 0);

  let userStatusText = t.unpaid;
  let userStatusColor = 'bg-gray-100 text-gray-700 border-gray-200';
  if (isDirect && isUserCurrentBeneficiary) {
    userStatusText = currentLanguage === 'fr' ? 'Satisfait (Compensation)' : 'Satisfied (Offset)';
    userStatusColor = 'bg-amber-100 text-amber-900 border-amber-300';
  } else if (userConfirmed >= activeGroup.contributionAmount) {
    userStatusText = t.paid;
    userStatusColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (userPending > 0) {
    userStatusText = t.pending;
    userStatusColor = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (userConfirmed > 0) {
    userStatusText = t.partial;
    userStatusColor = 'bg-blue-50 text-blue-800 border-blue-200';
  }

  // Count pending submissions
  const pendingCount = activeGroup.submissions.filter(
    (s) => s.roundNumber === currentRound && (s.status === 'pending' || s.status === 'clarification_needed')
  ).length;

  // Active round approved receiving destination
  const activeDestination = activeGroup.receivingDestinations.find(
    (d) => d.status === 'approved' && (d.roundNumber === currentRound || !d.roundNumber)
  );

  return (
    <div className="space-y-4 pb-8">
      {/* 1. Mandatory Non-Custodial Disclaimer (Section 1) */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 flex items-start gap-2.5 shadow-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-semibold">{t.appName}: </span>
          {t.nonCustodialDisclaimer}
        </div>
      </div>

      {/* 2. Group & Cycle Status Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              Cycle #{activeGroup.cycleNumber}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isDirect
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}>
              {isDirect ? t.directBeneficiaryCollection : t.centralCollection}
            </span>
            <span className="text-xs text-gray-500">
              {activeGroup.frequency.toUpperCase()} • {formatFCFA(activeGroup.contributionAmount)} / member
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {currentLanguage === 'fr' ? `Tour ${currentRound} sur ${activeGroup.totalRounds}` : `Round ${currentRound} of ${activeGroup.totalRounds}`}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isDirect ? t.directBeneficiaryCollectionDesc : t.centralCollectionDesc}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-left">
            <div className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-700" />
              <span>{t.deadline}</span>
            </div>
            <div className="text-xs font-bold text-gray-800 mt-0.5">{roundDueDate}</div>
          </div>

          <div className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-left">
            <div className="text-[10px] text-gray-500 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>{t.yourPayoutDate}</span>
            </div>
            <div className="text-xs font-bold text-gray-800 mt-0.5">
              Turn #{userTurn} ({calculateRoundPayoutDate(activeGroup, userTurn)})
            </div>
          </div>
        </div>
      </div>

      {/* 3. Beneficiary Receiving Destination Notice */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="text-[11px] text-gray-500 uppercase font-semibold">
                {t.currentBeneficiary} {isDirect && summary.roundBeneficiaries.length > 1 ? `(${summary.roundBeneficiaries.length} Recipients)` : `(Round #${currentRound})`}
              </div>
              <div className="text-sm font-bold text-gray-900 flex flex-wrap items-center gap-2">
                <span>
                  {summary.roundBeneficiaries.length > 0
                    ? summary.roundBeneficiaries.map((b) => b.name).join(', ')
                    : 'Assigned Beneficiary'}
                </span>
                {isUserCurrentBeneficiary && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    {currentLanguage === 'fr' ? 'C’est votre tour !' : 'Your Turn!'}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {activeDestination ? (
                  <span>
                    Approved Destination: <strong>{activeDestination.provider.toUpperCase()}</strong> ({activeDestination.accountName}: {activeDestination.accountNumberOrDetails})
                  </span>
                ) : (
                  <span>
                    {isDirect
                      ? `Pay directly to assigned round receiver(s): ${summary.roundBeneficiaries.map((b) => b.name).join(', ')}`
                      : 'Pay via approved central treasury account'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Receiving authority badge */}
          {receivingAuth.canConfirm && (
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                {isDirect && isUserCurrentBeneficiary
                  ? (currentLanguage === 'fr' ? 'Vous avez l’autorité de confirmer les réceptions de ce tour.' : 'You have temporary authority to confirm receipts for this round.')
                  : (currentLanguage === 'fr' ? 'Autorisé à confirmer les réceptions.' : 'Authorised to confirm receipts.')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Financial Status Grid (Respecting Collection Arrangement) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
          <div className="text-[11px] font-semibold text-gray-500 uppercase flex items-center justify-between">
            <span>{isDirect ? t.expectedExternalReceipts : t.expectedPot}</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
            {formatFCFA(summary.expectedExternalReceipts)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {isDirect
              ? `Nominal ${formatFCFA(summary.nominalEntitlement)} - Offset ${formatFCFA(summary.beneficiaryOffset)}`
              : `${activeGroup.members.length} members × ${formatFCFA(activeGroup.contributionAmount)}`}
          </p>
        </div>

        {/* Metric 2: Confirmed Receipts */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
          <div className="text-[11px] font-semibold text-gray-500 uppercase flex items-center justify-between">
            <span>{t.confirmedCollected}</span>
            <CheckCircle className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-800 mt-1">
            {formatFCFA(summary.confirmedExternalReceipts)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {currentLanguage === 'fr' ? 'Vérifié en banque / espèces' : 'Verified in bank / cash'}
          </p>
        </div>

        {/* Metric 3: Awaiting Verification */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
          <div className="text-[11px] font-semibold text-gray-500 uppercase flex items-center justify-between">
            <span>{t.submittedPending}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-amber-700 mt-1">
            {formatFCFA(summary.pendingVerification)}
          </div>
          <p className="text-[10px] text-amber-600/90 mt-1">
            {pendingCount} {currentLanguage === 'fr' ? 'déclaration(s) en attente' : 'declaration(s) awaiting check'}
          </p>
        </div>

        {/* Metric 4: Outstanding */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
          <div className="text-[11px] font-semibold text-gray-500 uppercase flex items-center justify-between">
            <span>{t.outstandingAmount}</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-700 mt-1">
            {formatFCFA(summary.outstandingExternalReceipts)}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {summary.isFullyFunded
              ? (currentLanguage === 'fr' ? '100% collecté !' : '100% satisfied!')
              : (currentLanguage === 'fr' ? 'Reste à recevoir' : 'Remaining to receive')}
          </p>
        </div>
      </div>

      {/* 5. Direct Collection Beneficiary Offset Explanation Box (Section 8) */}
      {isDirect && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
          <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{t.beneficiaryOffsetLabel}: </span>
            <span>
              {t.beneficiaryOffsetExplanation} (Turn #{currentRound} offset: <strong>{formatFCFA(summary.beneficiaryOffset)}</strong>).
            </span>
          </div>
        </div>
      )}

      {/* 6. User's Personal Obligation Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-500 font-semibold uppercase">{t.yourPaymentStatus}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${userStatusColor}`}>
              {userStatusText}
            </span>
            <span className="text-xs text-gray-600">
              {isDirect && isUserCurrentBeneficiary
                ? `${formatFCFA(activeGroup.contributionAmount)} (Offset applied)`
                : `${formatFCFA(userConfirmed)} confirmed of ${formatFCFA(activeGroup.contributionAmount)}`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(!isDirect || !isUserCurrentBeneficiary) && userConfirmed < activeGroup.contributionAmount && (
            <button
              type="button"
              onClick={onOpenSubmitModal}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
            >
              {t.submitPaymentBtn}
            </button>
          )}

          {receivingAuth.canConfirm && pendingCount > 0 && (
            <button
              type="button"
              onClick={onOpenVerifyModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
            >
              {t.verifyPaymentsBtn} ({pendingCount})
            </button>
          )}

          {!isDirect && (isAdmin || isTreasurer) && (
            <button
              type="button"
              onClick={onOpenRecordPayoutModal}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
            >
              {t.recordPayoutBtn}
            </button>
          )}

          {isUserCurrentBeneficiary && !isDirect && summary.centralPayout?.status === 'recorded' && (
            <button
              type="button"
              onClick={onOpenAcknowledgeModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
            >
              {t.acknowledgeReceiptBtn}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenWhatsAppModal}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* 7. Recent Group Audit Entries & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Audit Records */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-700" />
              <span>{t.recentActivity}</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('more')}
              className="text-xs text-emerald-700 hover:underline flex items-center gap-0.5"
            >
              <span>{currentLanguage === 'fr' ? 'Tout voir' : 'View full log'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5">
            {activeGroup.auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="text-xs text-gray-600 p-2 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span className="font-semibold text-emerald-800">{log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="font-medium text-gray-800 mt-0.5">{log.details}</div>
                {log.reason && (
                  <div className="text-[10px] text-amber-700 mt-0.5 italic">
                    Reason: {log.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Group Rules & Announcements */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>{currentLanguage === 'fr' ? 'Règles Actives du Cycle' : 'Active Cycle Rules'}</span>
            </h3>
            <span className="text-[10px] text-gray-400">Locked for Cycle #{activeGroup.cycleNumber}</span>
          </div>

          <div className="mt-3 space-y-2">
            {activeGroup.rules.slice(0, 4).map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
