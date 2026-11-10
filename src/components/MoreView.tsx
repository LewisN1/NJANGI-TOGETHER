/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../context/NjangiContext.tsx';
import {
  calculateLedgerSummary,
  calculateRoundSummary,
  formatFCFA,
  generateSafeContributionsCsv,
} from '../utils/njangiLogic.ts';
import {
  BookOpen,
  FileSpreadsheet,
  Printer,
  Share2,
  ShieldAlert,
  Scale,
  PlusCircle,
  HelpCircle,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Check,
  Copy,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { NoGroupState } from './NoGroupState.tsx';

interface MoreViewProps {
  onOpenCreateGroup?: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({ onOpenCreateGroup }) => {
  const {
    activeGroup,
    currentUser,
    isAdmin,
    isTreasurer,
    isReviewer,
    addLedgerAdjustment,
    resolveDispute,
    t,
    currentLanguage,
  } = useNjangi();

  const [activeSubTab, setActiveSubTab] = useState<'ledger' | 'disputes' | 'closure' | 'rules' | 'exports'>('ledger');

  // Adjustment modal state
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjType, setAdjType] = useState<'fine_assessed' | 'fine_collected' | 'correction_in' | 'correction_out'>('fine_collected');
  const [adjAmount, setAdjAmount] = useState<string>('1000');
  const [adjDesc, setAdjDesc] = useState('');
  const [adjReason, setAdjReason] = useState('');

  // Dispute resolution state
  const [resolvingDisputeId, setResolvingDisputeId] = useState<string | null>(null);
  const [resolutionFindings, setResolutionFindings] = useState('');
  const [resolutionClaimAccepted, setResolutionClaimAccepted] = useState(true);

  // Print statement preview state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);

  if (!activeGroup) {
    return <NoGroupState onOpenCreateGroup={onOpenCreateGroup} />;
  }

  const ledgerSummary = calculateLedgerSummary(activeGroup.ledger);
  const isDirect = activeGroup.collectionArrangement === 'direct_beneficiary';

  // Handle adding manual adjustment
  const handleAddAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseInt(adjAmount, 10);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!adjDesc.trim() || !adjReason.trim()) return;

    addLedgerAdjustment({
      groupId: activeGroup.id,
      type: adjType,
      amount: parsedAmount,
      description: adjDesc.trim(),
      reason: adjReason.trim(),
    });
    setShowAdjModal(false);
    setAdjDesc('');
    setAdjReason('');
    setAdjAmount('1000');
  };

  // Handle resolving a dispute
  const handleResolveDispute = (disputeId: string) => {
    if (!resolutionFindings.trim()) return;
    resolveDispute({
      groupId: activeGroup.id,
      disputeId,
      status: resolutionClaimAccepted ? 'resolved' : 'rejected',
      resolutionNote: resolutionFindings.trim(),
    });
    setResolvingDisputeId(null);
    setResolutionFindings('');
  };

  // CSV Generation (Section 16: Safe from formula injection, role-restricted)
  const generateAuditedCsv = () => {
    const isReviewerOrAdmin = isReviewer || isAdmin;
    const csvContent = generateSafeContributionsCsv(activeGroup, isReviewerOrAdmin);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeGroup.name.replace(/\s+/g, '_')}_audit_ledger.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {currentLanguage === 'fr' ? 'Gestion, Grand Livre & Contrôles' : 'Ledger, Disputes & Controls'}
          </h2>
          <p className="text-xs text-gray-500">
            {isDirect ? t.directBeneficiaryCollection : t.centralCollection} • Cycle #{activeGroup.cycleNumber}
          </p>
        </div>

        {onOpenCreateGroup && (
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t.createNewGroup}</span>
          </button>
        )}
      </div>

      {/* 2. Sub-Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('ledger')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'ledger'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t.navLedger}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('disputes')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'disputes'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{t.navDisputes} ({activeGroup.disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('closure')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'closure'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>{currentLanguage === 'fr' ? 'Rapprochement & Clôture' : 'Closing & Reconciliation'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('exports')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'exports'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{t.navReports}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('rules')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'rules'
              ? 'border-emerald-700 text-emerald-900 bg-emerald-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{t.navSettings}</span>
        </button>
      </div>

      {/* SUB-TAB 1: LEDGER */}
      {activeSubTab === 'ledger' && (
        <div className="space-y-4">
          {/* Reconciliation Date Notice */}
          <div className="p-3 bg-white rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-gray-500 uppercase font-semibold text-[10px]">
                {t.reconciledBalanceDate}:{' '}
              </span>
              <strong className="text-gray-900">{activeGroup.reconciliationDate || 'Ongoing'}</strong>
              <span className="text-gray-400"> (Reconciled by: {activeGroup.reconciledBy || 'Group Official'})</span>
            </div>

            {(isAdmin || isTreasurer || isReviewer) && (
              <button
                type="button"
                onClick={() => setShowAdjModal(true)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 self-start"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{currentLanguage === 'fr' ? 'Ajustement / Amende' : 'Add Adjustment / Fine'}</span>
              </button>
            )}
          </div>

          {/* Ledger Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                {t.totalInflows}
              </span>
              <span className="text-base sm:text-lg font-bold text-emerald-800 mt-1 block">
                {formatFCFA(ledgerSummary.confirmedContributions)}
              </span>
              <span className="text-[10px] text-gray-400">Confirmed external cash</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                {t.totalOutflows}
              </span>
              <span className="text-base sm:text-lg font-bold text-blue-800 mt-1 block">
                {formatFCFA(ledgerSummary.payouts)}
              </span>
              <span className="text-[10px] text-gray-400">Central payouts recorded</span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                {t.finesCollected}
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-700 mt-1 block">
                {formatFCFA(ledgerSummary.finesCollected)}
              </span>
              <span className="text-[10px] text-amber-600 block">
                Separate fund (Assessed: {formatFCFA(ledgerSummary.finesAssessed)})
              </span>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-gray-500 block">
                {t.recordedBalance}
              </span>
              <span className="text-base sm:text-lg font-bold text-gray-900 mt-1 block">
                {formatFCFA(ledgerSummary.recordedBalance)}
              </span>
              <span className="text-[10px] text-gray-400">
                {isDirect ? 'Direct mode (Held by members)' : 'Reconciled recorded cash'}
              </span>
            </div>
          </div>

          {/* Section 8 & 9 Notice on Beneficiary Offsets */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Accountability Rule (Section 8 & 9): </strong>
              Beneficiary contribution offsets and assessed fines do NOT inflate the cash ledger. Fines collected are tracked in an isolated fund strictly separated from the rotating pot.
            </div>
          </div>

          {/* Chronological Ledger Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                {currentLanguage === 'fr' ? 'Écritures Chronologiques du Grand Livre' : 'Chronological Group Ledger Entries'}
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                {activeGroup.ledger.length} Entries
              </span>
            </div>

            {activeGroup.ledger.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                {isDirect
                  ? (currentLanguage === 'fr' ? 'En mode de collecte directe, les fonds circulent directement entre membres.' : 'In Direct Collection mode, funds move directly between members without central ledger entries.')
                  : 'No ledger transactions recorded yet.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeGroup.ledger.map((entry) => (
                  <div key={entry.id} className="p-3 sm:px-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{entry.description}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          entry.type === 'contribution'
                            ? 'bg-emerald-100 text-emerald-800'
                            : entry.type === 'payout'
                            ? 'bg-blue-100 text-blue-800'
                            : entry.type.startsWith('fine')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {entry.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Date: {entry.date} • Recorded by: {entry.recordedBy}
                        {entry.reference && ` • Ref: ${entry.reference}`}
                      </div>
                    </div>

                    <div className={`font-mono font-bold text-xs sm:text-sm ${
                      entry.type === 'contribution' || entry.type === 'fine_collected' || entry.type === 'correction_in'
                        ? 'text-emerald-700'
                        : entry.type === 'payout' || entry.type === 'correction_out'
                        ? 'text-blue-700'
                        : 'text-gray-500'
                    }`}>
                      {entry.type === 'contribution' || entry.type === 'fine_collected' || entry.type === 'correction_in'
                        ? `+${formatFCFA(entry.amount)}`
                        : entry.type === 'payout' || entry.type === 'correction_out'
                        ? `-${formatFCFA(entry.amount)}`
                        : formatFCFA(entry.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DISPUTES & INDEPENDENT REVIEWS (Section 11) */}
      {activeSubTab === 'disputes' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 flex items-start gap-2">
            <Scale className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Dispute Protection (Section 11): </strong>
              Members can dispute incorrect entries or unconfirmed payments. Disputes are assigned to an independent reviewer. Someone involved in a dispute cannot be its sole resolver.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
            {activeGroup.disputes.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                {currentLanguage === 'fr' ? 'Aucun litige ouvert dans ce groupe.' : 'No active disputes recorded for this group.'}
              </div>
            ) : (
              activeGroup.disputes.map((disp) => {
                const isClaimant = disp.raisedBy === currentUser.id;
                const canResolve = (isReviewer || isAdmin || isTreasurer) && !isClaimant;

                return (
                  <div key={disp.id} className="p-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">
                          Dispute #{disp.id} (Round {disp.roundNumber})
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          disp.status === 'open'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : disp.status === 'under_review'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : disp.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {disp.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        Raised by: <strong>{disp.raisedByName}</strong> ({new Date(disp.raisedAt).toLocaleDateString()})
                      </span>
                    </div>

                    <div className="text-xs text-gray-800 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <strong>Claim: </strong> {disp.claim}
                    </div>

                    {disp.resolutionNote && (
                      <div className="text-xs text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <strong>Resolution Findings: </strong> {disp.resolutionNote}
                      </div>
                    )}

                    {disp.status !== 'resolved' && disp.status !== 'rejected' && canResolve && (
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setResolvingDisputeId(disp.id)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                        >
                          Resolve Dispute Findings
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CLOSING & RECONCILIATION REVIEW (Section 13) */}
      {activeSubTab === 'closure' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-700" />
              <span>Round & Cycle Closure Review (Section 13)</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Before a round or full cycle closes, this review reconciles obligations, confirmed receipts, pending declarations, outstanding shortfalls, and open disputes. Unpaid obligations are NOT silently erased when a new round starts.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-500 uppercase font-semibold text-[10px] block">Total Obligation</span>
                <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                  {formatFCFA(activeGroup.contributionAmount * activeGroup.members.length * activeGroup.currentRound)}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <span className="text-emerald-700 uppercase font-semibold text-[10px] block">Confirmed Receipts</span>
                <span className="font-bold text-emerald-900 text-sm mt-0.5 block">
                  {formatFCFA(activeGroup.submissions.filter((s) => s.status === 'confirmed').reduce((sum, s) => sum + s.amount, 0))}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <span className="text-amber-700 uppercase font-semibold text-[10px] block">Pending Submissions</span>
                <span className="font-bold text-amber-900 text-sm mt-0.5 block">
                  {activeGroup.submissions.filter((s) => s.status === 'pending').length} item(s)
                </span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <span className="text-purple-700 uppercase font-semibold text-[10px] block">Open Disputes</span>
                <span className="font-bold text-purple-900 text-sm mt-0.5 block">
                  {activeGroup.disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length} case(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: REPORTS & AUDIT EXPORTS */}
      {activeSubTab === 'exports' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Audited Group CSV Export</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Download verified transactions, member obligations, and audit references for offline review.
              </p>
            </div>

            <button
              type="button"
              onClick={generateAuditedCsv}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t.exportCsv}</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: RULES & CYCLE LOCK */}
      {activeSubTab === 'rules' && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-900">
              Active Cycle Governance Rules
            </h3>
            <span className="text-[10px] bg-slate-100 text-gray-600 px-2.5 py-0.5 rounded-full font-semibold">
              Cycle #{activeGroup.cycleNumber} Locked
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-700">
            {activeGroup.rules.map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {showAdjModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddAdjustment} className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              {currentLanguage === 'fr' ? 'Enregistrer un Ajustement ou une Amende' : 'Record Ledger Adjustment / Fine'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Type:</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-xl p-2 bg-white"
                >
                  <option value="fine_collected">Fine Collected (Cash Inflow to Separate Fund)</option>
                  <option value="fine_assessed">Fine Assessed (Notice only, not cash)</option>
                  <option value="correction_in">Correction Credit (+ Inflow)</option>
                  <option value="correction_out">Correction Debit (- Outflow)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Amount (FCFA):</label>
                <input
                  type="number"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2 focus:outline-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Description:</label>
                <input
                  type="text"
                  value={adjDesc}
                  onChange={(e) => setAdjDesc(e.target.value)}
                  placeholder="e.g. Late fee for Round 2"
                  className="w-full border border-gray-200 rounded-xl p-2 focus:outline-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Audit Justification / Reason:</label>
                <textarea
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="Explain why this adjustment is applied..."
                  className="w-full border border-gray-200 rounded-xl p-2 focus:outline-emerald-600"
                  rows={2}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dispute Resolution Modal */}
      {resolvingDisputeId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-gray-900">
              Resolve Dispute #{resolvingDisputeId}
            </h3>
            <p className="text-xs text-gray-600">
              Provide formal independent findings. As reviewer, record whether the claim is upheld or rejected based on evidence.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Finding Outcome:</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={resolutionClaimAccepted}
                      onChange={() => setResolutionClaimAccepted(true)}
                    />
                    <span>Claim Upheld (Accepted)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={!resolutionClaimAccepted}
                      onChange={() => setResolutionClaimAccepted(false)}
                    />
                    <span>Claim Rejected</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Formal Reviewer Findings:</label>
                <textarea
                  value={resolutionFindings}
                  onChange={(e) => setResolutionFindings(e.target.value)}
                  placeholder="Record your independent findings..."
                  className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingDisputeId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                disabled={!resolutionFindings.trim()}
                onClick={() => handleResolveDispute(resolvingDisputeId)}
                className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                Submit Formal Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
