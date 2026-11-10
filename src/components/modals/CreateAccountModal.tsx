/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { X, ShieldCheck, CheckCircle2, UserPlus, Info } from 'lucide-react';

interface CreateAccountModalProps {
  onClose: () => void;
  invitedGroupId?: string;
  onAccountCreated?: (user: any) => void;
}

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  onClose,
  invitedGroupId,
  onAccountCreated,
}) => {
  const { groups, registerRealAccount, joinGroupViaInvite, t, currentLanguage } = useNjangi();

  const invitedGroup = invitedGroupId
    ? groups.find((g) => g.id === invitedGroupId || g.inviteCode === invitedGroupId)
    : null;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+237 6');
  const [email, setEmail] = useState('');
  const [residenceCity, setResidenceCity] = useState('Douala');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [joinedGroupNote, setJoinedGroupNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full legal name.');
      return;
    }
    if (!phone.trim() || phone.length < 9) {
      setErrorMsg('Please enter a valid Cameroon phone number.');
      return;
    }

    const res = registerRealAccount({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      residenceCity: residenceCity.trim(),
    });

    if (res.success && res.user) {
      if (invitedGroup) {
        // Auto-join invited group as member
        const joinRes = joinGroupViaInvite(invitedGroup.id, res.user);
        if (joinRes.success) {
          setJoinedGroupNote(`You have joined ${invitedGroup.name} as an ordinary Member.`);
        }
      }
      setIsSuccess(true);
      setTimeout(() => {
        onAccountCreated?.(res.user);
        onClose();
      }, 1600);
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <UserPlus className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              {t.registerBtn}
            </h3>
            <p className="text-xs text-gray-500">
              One platform account with group-isolated roles
            </p>
          </div>
        </div>

        {/* Invitation Banner if arriving via invite link */}
        {invitedGroup && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 mb-3 space-y-1">
            <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Invitation: {invitedGroup.name}
            </span>
            <p className="text-[11px] text-gray-700 leading-normal">
              You were invited to join this Njangi. Create your account below to enter. All new accounts start as ordinary <strong>Members</strong>.
            </p>
          </div>
        )}

        {/* Section 12 MVP Notice */}
        <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 mb-4 flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            {t.govIdNotice}
          </div>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-base text-gray-900">
              Account Created Successfully!
            </h4>
            <p className="text-xs text-gray-600">
              You are now signed in as <strong>{name}</strong>. {joinedGroupNote || 'All new accounts start as ordinary Members. Admin rights apply when you create a Njangi group or are promoted by a creator.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lewis Nanfa"
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600"
                required
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">
                Cameroon Phone Number *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237 6XX XX XX XX"
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600 font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  City of Residence
                </label>
                <select
                  value={residenceCity}
                  onChange={(e) => setResidenceCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 bg-white"
                >
                  <option value="Douala">Douala</option>
                  <option value="Yaoundé">Yaoundé</option>
                  <option value="Bamenda">Bamenda</option>
                  <option value="Buea">Buea</option>
                  <option value="Bafoussam">Bafoussam</option>
                  <option value="Garoua">Garoua</option>
                  <option value="Kumba">Kumba</option>
                  <option value="Limbe">Limbe</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600"
                />
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
                type="submit"
                className="px-5 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition active:scale-95"
              >
                Create Account
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
