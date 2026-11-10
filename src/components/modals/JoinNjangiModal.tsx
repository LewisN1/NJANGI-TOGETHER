/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { formatFCFA, formatFrequency } from '../../utils/njangiLogic.ts';
import { X, Users, Calendar, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Link2 } from 'lucide-react';

interface JoinNjangiModalProps {
  initialInviteCode?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const JoinNjangiModal: React.FC<JoinNjangiModalProps> = ({
  initialInviteCode = '',
  onClose,
  onSuccess,
}) => {
  const { groups, currentUser, joinGroupViaInvite, currentLanguage, t } = useNjangi();

  const [inputCode, setInputCode] = useState(initialInviteCode);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [joinedGroupName, setJoinedGroupName] = useState('');

  // Extract invite code/group ID if user pastes full URL
  const extractCode = (str: string): string => {
    try {
      if (str.includes('invite=')) {
        const u = new URL(str, window.location.origin);
        return u.searchParams.get('invite') || str;
      }
      if (str.includes('join=')) {
        const u = new URL(str, window.location.origin);
        return u.searchParams.get('join') || str;
      }
    } catch {
      // not a URL, use raw string
    }
    return str.trim();
  };

  const parsedId = extractCode(inputCode);
  const targetGroup = groups.find(
    (g) => g.id === parsedId || g.inviteCode === parsedId || g.id === inputCode.trim()
  );

  const isAlreadyMember = Boolean(
    targetGroup && targetGroup.members.some((m) => m.userId === currentUser.id)
  );

  const handleJoin = () => {
    setErrorMsg('');
    if (!parsedId) {
      setErrorMsg('Please enter a valid Njangi invite code or link.');
      return;
    }

    if (!targetGroup) {
      setErrorMsg('Njangi group not found. Please verify the invite code or link.');
      return;
    }

    const res = joinGroupViaInvite(targetGroup.id, currentUser);
    if (res.success) {
      setJoinedGroupName(res.group?.name || targetGroup.name);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to join group.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              {t.joinNjangi}
            </h3>
            <p className="text-xs text-gray-500">
              Join with an invitation link or group code
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base text-gray-900">
              Successfully Joined {joinedGroupName}!
            </h4>
            <p className="text-xs text-gray-600">
              You are enrolled as an ordinary Member. Payout turn assigned.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Invite Link or Code *
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Paste invite link or code (e.g. grp-12345...)"
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs font-mono focus:outline-emerald-600"
              />
            </div>

            {/* Target Group Preview */}
            {targetGroup && (
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/90 rounded-2xl space-y-3 text-emerald-950">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-900 truncate">
                    {targetGroup.name}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900">
                    {targetGroup.collectionArrangement === 'direct_beneficiary'
                      ? 'Direct Collection'
                      : 'Central Treasury'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-700">
                  <div className="p-2 bg-white/80 rounded-lg border border-emerald-100">
                    <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                      Contribution
                    </span>
                    <span className="font-bold text-emerald-900">
                      {formatFCFA(targetGroup.contributionAmount)}
                    </span>
                  </div>
                  <div className="p-2 bg-white/80 rounded-lg border border-emerald-100">
                    <span className="text-gray-500 block text-[10px] uppercase font-semibold">
                      Frequency
                    </span>
                    <span className="font-bold text-gray-800">
                      {formatFrequency(targetGroup, currentLanguage as any)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-gray-600 flex items-center justify-between pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{targetGroup.members.length} Active Members</span>
                  </span>
                  <span className="font-semibold text-emerald-800">
                    Your Payout Turn: #{targetGroup.members.length + 1}
                  </span>
                </div>

                {isAlreadyMember && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-center font-bold text-xs">
                    You are already a member of this Njangi group.
                  </div>
                )}
              </div>
            )}

            {/* Governance Policy Notice */}
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Default Role Policy: </strong>
                All participants join as ordinary <strong>Members</strong>. Admin rights are only granted when you create your own Njangi group or when given by the group creator.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                disabled={!targetGroup || isAlreadyMember}
                onClick={handleJoin}
                className="px-5 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span>{isAlreadyMember ? 'Already Enrolled' : t.joinNjangi}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
