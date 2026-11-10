/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { GroupMember } from '../../types/njangi.ts';
import { X, ArrowUpDown, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';

interface ReorderPayoutModalProps {
  onClose: () => void;
}

export const ReorderPayoutModal: React.FC<ReorderPayoutModalProps> = ({ onClose }) => {
  const { activeGroup, updatePayoutOrder, t } = useNjangi();

  if (!activeGroup) return null;

  // Determine completed rounds (cannot change completed payouts)
  const completedRounds = activeGroup.collectionArrangement === 'central'
    ? activeGroup.centralPayouts
        .filter((p) => p.status === 'acknowledged' || p.status === 'recorded')
        .map((p) => p.roundNumber)
    : Array.from({ length: Math.max(0, activeGroup.currentRound - 1) }, (_, i) => i + 1);

  // Editable turns for members whose turn is > completed rounds
  const [reorderedMembers, setReorderedMembers] = useState<GroupMember[]>(() => {
    return [...activeGroup.members].sort((a, b) => a.payoutTurn - b.payoutTurn);
  });

  const [reason, setReason] = useState('');
  const [acknowledgedByMembers, setAcknowledgedByMembers] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const swapTurns = (indexA: number, indexB: number) => {
    const memA = reorderedMembers[indexA];
    const memB = reorderedMembers[indexB];

    if (completedRounds.includes(memA.payoutTurn) || completedRounds.includes(memB.payoutTurn)) {
      setErrorMsg(`Cannot swap completed payout rounds (Rounds ${completedRounds.join(', ')}).`);
      return;
    }

    const updated = [...reorderedMembers];
    const turnA = memA.payoutTurn;
    const turnB = memB.payoutTurn;

    updated[indexA] = { ...memA, payoutTurn: turnB };
    updated[indexB] = { ...memB, payoutTurn: turnA };

    // Sort by turn
    updated.sort((a, b) => a.payoutTurn - b.payoutTurn);
    setReorderedMembers(updated);
    setErrorMsg('');
  };

  const handleSave = () => {
    if (!reason.trim()) {
      setErrorMsg('A recorded reason is strictly required to adjust the active payout order.');
      return;
    }
    if (!acknowledgedByMembers) {
      setErrorMsg('Please confirm that affected members have given their explicit consent.');
      return;
    }

    const res = updatePayoutOrder(
      activeGroup.id,
      reorderedMembers.map((m) => ({ userId: m.userId, turn: m.payoutTurn })),
      reason.trim()
    );
    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => onClose(), 1400);
    } else {
      setErrorMsg(res.error || 'Failed to update payout order.');
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
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
            <ArrowUpDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              Adjust Payout Order
            </h3>
            <p className="text-xs text-gray-500">
              Active Cycle Protection • Past payouts are locked
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-gray-900">Payout Schedule Updated!</h4>
            <p className="text-xs text-gray-500">
              Changes and justification have been recorded into the audit trail.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 leading-relaxed text-[11px]">
              <strong>Rule:</strong> Completed payouts are locked and cannot be swapped. Use the arrow buttons below to swap turns between future consenting members.
            </div>

            {/* List with swap controls */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 p-1">
              {reorderedMembers.map((m, idx) => {
                const isLocked = completedRounds.includes(m.payoutTurn);
                const canSwapDown = idx < reorderedMembers.length - 1 && !isLocked && !completedRounds.includes(reorderedMembers[idx + 1].payoutTurn);

                return (
                  <div
                    key={m.userId}
                    className={`flex items-center justify-between p-2.5 rounded-xl border ${
                      isLocked ? 'bg-gray-100 border-gray-200 text-gray-500' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-xs shrink-0 ${
                        isLocked ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-900'
                      }`}>
                        #{m.payoutTurn}
                      </span>
                      <span className="font-semibold text-gray-900 truncate">{m.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isLocked ? (
                        <span className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold bg-gray-200 px-2 py-0.5 rounded">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      ) : (
                        canSwapDown && (
                          <button
                            type="button"
                            onClick={() => swapTurns(idx, idx + 1)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-bold flex items-center gap-1"
                          >
                            Swap with #{idx + 2}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reason */}
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                Recorded Reason / Justification *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="e.g. Mutual swap requested between Eric and Beatrice due to family emergency..."
                className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Acknowledgment checkbox */}
            <label className="flex items-start gap-2 cursor-pointer p-2.5 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                checked={acknowledgedByMembers}
                onChange={(e) => setAcknowledgedByMembers(e.target.checked)}
                className="mt-0.5 rounded text-emerald-700"
              />
              <span className="text-gray-800 font-medium">
                I confirm that both affected members have explicitly agreed to this order change.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-bold rounded-xl shadow-xs"
              >
                Save New Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
