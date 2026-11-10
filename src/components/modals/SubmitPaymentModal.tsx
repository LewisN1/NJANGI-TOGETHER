/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { PaymentMethod } from '../../types/njangi.ts';
import { formatFCFA, findDuplicateReference, calculateRoundDueDate } from '../../utils/njangiLogic.ts';
import { X, Banknote, AlertTriangle, CheckCircle, ShieldAlert, Lock, Upload, FileText } from 'lucide-react';

interface SubmitPaymentModalProps {
  initialRound?: number;
  onClose: () => void;
}

export const SubmitPaymentModal: React.FC<SubmitPaymentModalProps> = ({
  initialRound,
  onClose,
}) => {
  const {
    activeGroup,
    currentUser,
    isAdmin,
    isTreasurer,
    submitPaymentDetails,
    t,
    currentLanguage,
  } = useNjangi();

  if (!activeGroup) return null;

  const targetRound = initialRound || activeGroup.currentRound || 1;
  const isDirect = activeGroup.collectionArrangement === 'direct_beneficiary';

  // Can official submit on behalf of someone?
  const [targetMemberId, setTargetMemberId] = useState<string>(currentUser.id);
  const [amount, setAmount] = useState<string>(activeGroup.contributionAmount.toString());
  const [method, setMethod] = useState<PaymentMethod>('mtn_momo');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [hasRef, setHasRef] = useState(true);
  const [refExplanation, setRefExplanation] = useState('');
  const [payerName, setPayerName] = useState('');
  const [receiptNote, setReceiptNote] = useState('');
  const [hasAttachment, setHasAttachment] = useState(false);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Available receiving destinations
  const approvedDestinations = activeGroup.receivingDestinations.filter(
    (d) => d.status === 'approved' && (d.roundNumber === targetRound || !d.roundNumber)
  );

  // Check duplicate reference in real time
  const duplicateMatch = hasRef && reference.trim()
    ? findDuplicateReference(activeGroup, reference, method)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid whole-number contribution amount in FCFA.');
      return;
    }

    if (!hasRef && !refExplanation.trim()) {
      setErrorMessage('Please provide an explanation for why an electronic transaction reference is unavailable.');
      return;
    }

    if (hasRef && !reference.trim()) {
      setErrorMessage('Please enter the electronic transaction reference (TxID or SMS code).');
      return;
    }

    const result = submitPaymentDetails({
      groupId: activeGroup.id,
      roundNumber: targetRound,
      memberId: targetMemberId,
      slotId: selectedSlotId || undefined,
      amount: parsedAmount,
      paymentDate,
      paymentMethod: method,
      receivingDestinationId: selectedDestinationId || undefined,
      reference: hasRef ? reference.trim() : undefined,
      referenceUnavailableExplanation: !hasRef ? refExplanation.trim() : undefined,
      payerName: payerName.trim() || undefined,
      receiptNote: receiptNote.trim() || undefined,
      hasAttachment,
      attachmentFileName: hasAttachment ? `receipt_${Date.now()}.png` : undefined,
    });

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1400);
    } else {
      setErrorMessage(result.error || 'Failed to record payment details.');
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

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              {t.submitPaymentBtn}
            </h3>
            <p className="text-xs text-gray-500">
              Round #{targetRound} • {activeGroup.name} ({isDirect ? 'Direct Mode' : 'Central Mode'})
            </p>
          </div>
        </div>

        {/* Security Notice: Section 6 Warning */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>Security Notice: </strong>
            {t.pinWarningNotice}
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base text-gray-900">
              {currentLanguage === 'fr' ? 'Déclaration Enregistrée !' : 'Payment Declaration Recorded!'}
            </h4>
            <p className="text-xs text-gray-600">
              {currentLanguage === 'fr'
                ? 'Votre paiement est marqué "En attente de vérification". Le receveur va rapprocher cette écriture avec son relevé bancaire / espèces.'
                : 'Status set to "Awaiting Verification". The receiving officer will confirm once verified in external banking or cash.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Member Selection (if official submitting on behalf of member) */}
            {(isAdmin || isTreasurer) && (
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Contributing Member:
                </label>
                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2 bg-white"
                >
                  {activeGroup.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.userId === currentUser.id ? 'Self' : 'On behalf'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Slot Selection (if member owns multiple slots) */}
            {activeGroup.slots && activeGroup.slots.filter((s) => s.memberId === targetMemberId).length > 1 && (
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Specific Participation Slot:
                </label>
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2 bg-white"
                >
                  <option value="">All Slots / General Deposit</option>
                  {activeGroup.slots
                    .filter((s) => s.memberId === targetMemberId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} ({formatFCFA(activeGroup.contributionAmount)})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                {t.amountLabel}
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 font-bold text-sm text-gray-900 focus:outline-emerald-600"
                required
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Standard round obligation: {formatFCFA(activeGroup.contributionAmount)}. Partial payments supported.
              </span>
            </div>

            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {t.methodLabel}
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 bg-white font-medium"
                >
                  <option value="mtn_momo">MTN Mobile Money</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="cash">Cash (In-person)</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  {t.dateLabel}
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 bg-white font-medium focus:outline-emerald-600"
                  required
                />
              </div>
            </div>

            {/* Approved Receiving Destination (Section 5) */}
            {approvedDestinations.length > 0 && (
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  Destination Paid To:
                </label>
                <select
                  value={selectedDestinationId}
                  onChange={(e) => setSelectedDestinationId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 bg-white"
                >
                  <option value="">Select approved destination...</option>
                  {approvedDestinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.provider.toUpperCase()}: {d.accountName} ({d.accountNumberOrDetails})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reference or Explanation (Section 6) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-gray-700">
                  {hasRef ? t.refLabel : t.refUnavailableLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setHasRef(!hasRef)}
                  className="text-[11px] text-emerald-700 hover:underline"
                >
                  {hasRef ? 'No reference code?' : 'Have a reference?'}
                </button>
              </div>

              {hasRef ? (
                <>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder={t.refPlaceholder}
                    className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600 uppercase font-mono"
                    required={hasRef}
                  />
                  {duplicateMatch && (
                    <div className="p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[10px] mt-1 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{t.duplicateRefWarning}</span>
                    </div>
                  )}
                </>
              ) : (
                <textarea
                  value={refExplanation}
                  onChange={(e) => setRefExplanation(e.target.value)}
                  placeholder={t.refUnavailablePlaceholder}
                  className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600"
                  rows={2}
                  required={!hasRef}
                />
              )}
            </div>

            {/* Third-party payer name (Section 6) */}
            <div>
              <label className="font-semibold text-gray-700 block mb-1">
                Actual Payer's Name (if paid by spouse/relative):
              </label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Leave blank if paid from your own account"
                className="w-full border border-gray-200 rounded-xl p-2 focus:outline-emerald-600"
              />
            </div>

            {/* Receipt Attachment Simulation (Section 6 & 12) */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAttachment}
                  onChange={(e) => setHasAttachment(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span className="font-semibold text-gray-800">
                  Attach Payment Screenshot / Receipt (Simulated Upload)
                </span>
              </label>
              <p className="text-[10px] text-gray-500 mt-1 pl-5">
                Note: Uploading evidence does NOT automatically confirm a payment. Access is restricted to the payer and round receiving officer.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="px-5 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition active:scale-95"
              >
                {t.submitBtn}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
