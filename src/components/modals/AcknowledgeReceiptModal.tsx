/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { formatFCFA } from '../../utils/njangiLogic.ts';
import { X, CheckCircle, ShieldCheck, UserCheck, AlertTriangle, Scale } from 'lucide-react';

interface AcknowledgeReceiptModalProps {
  initialRound?: number;
  onClose: () => void;
}

export const AcknowledgeReceiptModal: React.FC<AcknowledgeReceiptModalProps> = ({
  initialRound,
  onClose,
}) => {
  const {
    activeGroup,
    currentUser,
    acknowledgeCentralPayoutReceipt,
    raiseDispute,
    t,
    currentLanguage,
  } = useNjangi();

  if (!activeGroup) return null;

  const targetRound = initialRound || activeGroup.currentRound || 1;
  const centralPayout = activeGroup.centralPayouts.find((p) => p.roundNumber === targetRound);

  const [receiptStatus, setReceiptStatus] = useState<'full_received' | 'partial_received' | 'nothing_received'>('full_received');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAcknowledge = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!centralPayout) {
      setErrorMsg('No payout proposal found for this round.');
      return;
    }

    if (receiptStatus !== 'full_received' && !note.trim()) {
      setErrorMsg('Please describe the discrepancy or explain what occurred.');
      return;
    }

    const res = acknowledgeCentralPayoutReceipt({
      groupId: activeGroup.id,
      payoutId: centralPayout.id,
      receiptStatus,
      note: note.trim() || undefined,
    });

    if (res.success) {
      // If nothing received or partial, also log formal dispute
      if (receiptStatus !== 'full_received') {
        raiseDispute({
          groupId: activeGroup.id,
          roundNumber: targetRound,
          type: 'payout',
          targetId: centralPayout.id,
          claim: `Beneficiary reported ${receiptStatus === 'nothing_received' ? 'NOTHING RECEIVED' : 'PARTIAL AMOUNT RECEIVED'}. Note: ${note.trim()}`,
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setErrorMsg(res.error || 'Failed to acknowledge receipt');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              {t.acknowledgeReceiptBtn}
            </h3>
            <p className="text-xs text-gray-500">
              Round #{targetRound} • Beneficiary Receipt Declaration
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-base">
              {receiptStatus === 'full_received' ? 'Receipt Confirmed!' : 'Discrepancy Reported & Dispute Logged'}
            </h4>
            <p className="text-xs text-gray-600">
              Your formal statement is recorded in the permanent audit trail.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAcknowledge} className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Reported External Transfer:</span>
              <div className="text-base font-bold text-emerald-800">
                {formatFCFA(centralPayout?.proposedAmount || 0)}
              </div>
              <p className="text-gray-600">
                Transferred via {centralPayout?.destinationProvider.toUpperCase()} (Ref: <code>{centralPayout?.transferReference || 'N/A'}</code>)
              </p>
            </div>

            {/* Beneficiary Response Options (Section 11) */}
            <div className="space-y-2">
              <label className="font-bold text-gray-800 block">
                {currentLanguage === 'fr' ? 'Que déclarez-vous avoir reçu ?' : 'What is your actual receipt status?'}
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="receiptStatus"
                  value="full_received"
                  checked={receiptStatus === 'full_received'}
                  onChange={() => setReceiptStatus('full_received')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <span className="font-bold text-gray-900 block">Full amount received</span>
                  <span className="text-[11px] text-gray-500">I confirmed receipt of the full stated amount.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="receiptStatus"
                  value="partial_received"
                  checked={receiptStatus === 'partial_received'}
                  onChange={() => setReceiptStatus('partial_received')}
                  className="mt-0.5 text-amber-600"
                />
                <div>
                  <span className="font-bold text-amber-900 block">Different / Partial amount received</span>
                  <span className="text-[11px] text-gray-500">I received a different amount than stated.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 cursor-pointer">
                <input
                  type="radio"
                  name="receiptStatus"
                  value="nothing_received"
                  checked={receiptStatus === 'nothing_received'}
                  onChange={() => setReceiptStatus('nothing_received')}
                  className="mt-0.5 text-rose-600"
                />
                <div>
                  <span className="font-bold text-rose-900 block">Nothing received (Raise Dispute)</span>
                  <span className="text-[11px] text-gray-500">No money was received in my account. Raises formal review.</span>
                </div>
              </label>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                {receiptStatus === 'full_received' ? 'Optional Acknowledgement Note:' : 'Explanation of Discrepancy (Mandatory):'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={receiptStatus === 'full_received' ? 'e.g. Received on MTN MoMo, thank you.' : 'Detail the exact amount received or missing...'}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-emerald-600"
                rows={2}
                required={receiptStatus !== 'full_received'}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className={`px-5 py-2 font-bold text-white rounded-xl shadow-xs transition active:scale-95 ${
                  receiptStatus === 'nothing_received'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-700 hover:bg-emerald-800'
                }`}
              >
                {receiptStatus === 'nothing_received' ? 'Report Non-Receipt' : 'Confirm Declaration'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
