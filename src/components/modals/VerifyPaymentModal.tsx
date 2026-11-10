/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { formatFCFA, findDuplicateReference } from '../../utils/njangiLogic.ts';
import {
  X,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  HelpCircle,
  Lock,
  Eye,
  MessageSquare,
} from 'lucide-react';

interface VerifyPaymentModalProps {
  initialSubmissionId?: string;
  onClose: () => void;
}

export const VerifyPaymentModal: React.FC<VerifyPaymentModalProps> = ({
  initialSubmissionId,
  onClose,
}) => {
  const {
    activeGroup,
    confirmMoneyReceived,
    requestPaymentClarification,
    rejectSubmission,
    canViewPrivateEvidence,
    t,
    currentLanguage,
  } = useNjangi();

  if (!activeGroup) return null;

  const pendingSubmissions = activeGroup.submissions.filter(
    (s) => s.status === 'pending' || s.status === 'clarification_needed'
  );

  const [selectedSubId, setSelectedSubId] = useState<string>(
    initialSubmissionId || pendingSubmissions[0]?.id || ''
  );

  const [mode, setMode] = useState<'idle' | 'rejecting' | 'clarifying'>('idle');
  const [reasonInput, setReasonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);
  const [duplicateJustification, setDuplicateJustification] = useState('');

  const currentSub = activeGroup.submissions.find((s) => s.id === selectedSubId);
  const duplicateMatch = currentSub
    ? findDuplicateReference(activeGroup, currentSub.reference, currentSub.paymentMethod, undefined, currentSub.id)
    : null;

  const hasEvidenceAccess = currentSub ? canViewPrivateEvidence(currentSub) : false;

  const handleApprove = () => {
    if (!currentSub) return;
    setErrorMsg('');
    if (duplicateMatch && !overrideDuplicate) {
      setErrorMsg('Duplicate reference warning: Must check override and provide recorded justification.');
      return;
    }
    if (duplicateMatch && overrideDuplicate && !duplicateJustification.trim()) {
      setErrorMsg('Override requires a recorded explanation/justification.');
      return;
    }
    const res = confirmMoneyReceived({
      groupId: activeGroup.id,
      submissionId: currentSub.id,
      overrideDuplicate,
      duplicateJustification: duplicateJustification.trim() || undefined,
    });
    if (res.success) {
      setOverrideDuplicate(false);
      setDuplicateJustification('');
      const remaining = pendingSubmissions.filter((s) => s.id !== currentSub.id);
      if (remaining.length > 0) {
        setSelectedSubId(remaining[0].id);
      } else {
        onClose();
      }
    } else {
      setErrorMsg(res.error || 'Failed to confirm receipt');
    }
  };

  const handleReject = () => {
    if (!currentSub) return;
    if (!reasonInput.trim()) {
      setErrorMsg('Rejection requires a mandatory recorded reason.');
      return;
    }
    const res = rejectSubmission({
      groupId: activeGroup.id,
      submissionId: currentSub.id,
      reason: reasonInput.trim(),
    });
    if (res.success) {
      setMode('idle');
      setReasonInput('');
      const remaining = pendingSubmissions.filter((s) => s.id !== currentSub.id);
      if (remaining.length > 0) {
        setSelectedSubId(remaining[0].id);
      } else {
        onClose();
      }
    } else {
      setErrorMsg(res.error || 'Failed to reject');
    }
  };

  const handleClarification = () => {
    if (!currentSub) return;
    if (!reasonInput.trim()) {
      setErrorMsg('Please specify what clarification or evidence is needed.');
      return;
    }
    const res = requestPaymentClarification({
      groupId: activeGroup.id,
      submissionId: currentSub.id,
      reason: reasonInput.trim(),
    });
    if (res.success) {
      setMode('idle');
      setReasonInput('');
      const remaining = pendingSubmissions.filter((s) => s.id !== currentSub.id);
      if (remaining.length > 0) {
        setSelectedSubId(remaining[0].id);
      } else {
        onClose();
      }
    } else {
      setErrorMsg(res.error || 'Failed to request clarification');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              {t.verifyPaymentsBtn}
            </h3>
            <p className="text-xs text-gray-500">
              {pendingSubmissions.length} declaration(s) awaiting check
            </p>
          </div>
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500 space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-bold text-sm text-gray-800">
              {currentLanguage === 'fr' ? 'Toutes les déclarations sont traitées !' : 'All declarations reviewed!'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-800 font-bold rounded-xl text-xs mt-2"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Submission Selector Tabs */}
            {pendingSubmissions.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {pendingSubmissions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubId(s.id);
                      setMode('idle');
                      setReasonInput('');
                      setErrorMsg('');
                    }}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold transition ${
                      s.id === selectedSubId
                        ? 'bg-emerald-800 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {s.memberName} ({formatFCFA(s.amount)})
                  </button>
                ))}
              </div>
            )}

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {currentSub && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">Contributing Member</span>
                    <h4 className="text-sm font-bold text-gray-900">{currentSub.memberName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Declared Amount</span>
                    <div className="text-base font-bold text-emerald-800">{formatFCFA(currentSub.amount)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-gray-200 text-gray-700">
                  <div>
                    <span className="text-gray-400 block">Round:</span>
                    <strong>Round #{currentSub.roundNumber}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Payment Date:</span>
                    <strong>{currentSub.paymentDate}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Channel:</span>
                    <strong className="uppercase">{currentSub.paymentMethod.replace('_', ' ')}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Submitted By:</span>
                    <span>{currentSub.submittedByName}</span>
                    {currentSub.payerName && <span className="block text-gray-500">(Payer: {currentSub.payerName})</span>}
                  </div>
                </div>

                {/* Reference details */}
                <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Transaction Reference:</span>
                  {currentSub.reference ? (
                    <code className="text-xs font-bold text-gray-900 block mt-0.5">{currentSub.reference}</code>
                  ) : (
                    <span className="text-amber-700 italic block mt-0.5">
                      No TxID: {currentSub.referenceUnavailableExplanation}
                    </span>
                  )}
                  {duplicateMatch && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-[11px] space-y-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{t.duplicateRefWarning}</span>
                      </div>
                      <p className="text-[10px] text-amber-800">
                        Section 12: Override of duplicate warning requires recorded justification and independent review.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs">
                        <input
                          type="checkbox"
                          checked={overrideDuplicate}
                          onChange={(e) => setOverrideDuplicate(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span>Confirm intentional duplicate override</span>
                      </label>
                      {overrideDuplicate && (
                        <div>
                          <input
                            type="text"
                            value={duplicateJustification}
                            onChange={(e) => setDuplicateJustification(e.target.value)}
                            placeholder="Mandatory override justification / reference review..."
                            className="w-full text-xs p-1.5 border border-amber-300 rounded bg-white"
                            required
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Destination Snapshot */}
                {currentSub.receivingDestinationSnapshot && (
                  <div className="text-[11px] text-gray-600">
                    <span className="text-gray-400">Reported Destination: </span>
                    <strong>{currentSub.receivingDestinationSnapshot}</strong>
                  </div>
                )}

                {/* Privacy-Guarded Supporting Evidence (Section 12) */}
                {currentSub.hasAttachment && (
                  <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Attached Evidence:</span>
                      {hasEvidenceAccess ? (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>Authorised Access</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Restricted Access</span>
                        </span>
                      )}
                    </div>
                    {hasEvidenceAccess ? (
                      <p className="text-gray-700 text-xs mt-1">
                        File: <code>{currentSub.attachmentFileName}</code> (Simulated screenshot verified)
                      </p>
                    ) : (
                      <p className="text-gray-400 text-[11px] mt-1">
                        Private evidence is restricted to the payer and round receiving officer.
                      </p>
                    )}
                  </div>
                )}

                {/* Non-Custodial verification reminder */}
                <div className="text-[10px] text-gray-500 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                  ⚠️ Reminder: Uploading evidence alone does NOT confirm payment. Please cross-check your actual MoMo / Orange Money SMS or bank statement before confirming.
                </div>
              </div>
            )}

            {/* Rejection / Clarification input */}
            {mode !== 'idle' && (
              <div className="space-y-2 p-3 bg-slate-50 border border-gray-200 rounded-xl">
                <label className="font-bold text-gray-800 block">
                  {mode === 'rejecting' ? t.reasonPrompt : 'Describe what clarification is required:'}
                </label>
                <textarea
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder={mode === 'rejecting' ? 'e.g. Reference CI261017.1234 not found in bank statement' : 'e.g. Please re-send the telecom confirmation SMS code'}
                  className="w-full text-xs border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600"
                  rows={2}
                  required
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('idle');
                      setReasonInput('');
                    }}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={mode === 'rejecting' ? handleReject : handleClarification}
                    className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg ${
                      mode === 'rejecting' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {mode === 'rejecting' ? 'Confirm Rejection' : 'Send Clarification Request'}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {mode === 'idle' && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('rejecting')}
                    className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl"
                  >
                    {t.rejectBtn}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('clarifying')}
                    className="px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-50 border border-purple-200 rounded-xl"
                  >
                    {t.requestClarificationBtn}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-4 py-1.5 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
                  >
                    {t.approveBtn}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
