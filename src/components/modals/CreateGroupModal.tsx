/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { GroupMember, CollectionArrangement } from '../../types/njangi.ts';
import { formatFCFA, validatePayoutTurns } from '../../utils/njangiLogic.ts';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Shield,
  Lock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  ArrowRightLeft,
  ShieldCheck,
  Copy,
  Check,
  Share2,
  Link2,
} from 'lucide-react';

interface CreateGroupModalProps {
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
  const { currentUser, createNewGroup, t, currentLanguage } = useNjangi();

  // Wizard step: 1 = Basic Info & Collection Arrangement, 2 = Members, Cadence & Invite Link, 3 = Review Schedule & Activate
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Pre-generate unique group ID for invite link
  const [tempGroupId] = useState(() => `grp-${Date.now()}`);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contributionAmount, setContributionAmount] = useState('25000');
  const [collectionArrangement, setCollectionArrangement] = useState<CollectionArrangement>('central');
  
  // Frequency & Cadence Model (Daily, Weekly, Fortnightly, Monthly, Custom)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'custom'>('monthly');
  const [customDays, setCustomDays] = useState('3');
  const [customLabel, setCustomLabel] = useState('');

  const [firstDate, setFirstDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineDays, setDeadlineDays] = useState('5');
  const [lateFeeEnabled, setLateFeeEnabled] = useState(false);
  const [lateFeeAmount, setLateFeeAmount] = useState('1000');

  // Acceptance check for beneficiary offset rule (Section 8)
  const [offsetAccepted, setOffsetAccepted] = useState(false);

  // Initial members
  const [members, setMembers] = useState<GroupMember[]>([
    {
      userId: currentUser.id,
      name: currentUser.name,
      phone: currentUser.phone,
      roles: ['admin', 'treasurer'], // Group creator gets initial admin rights
      payoutTurn: 1,
      joinedDate: new Date().toISOString().split('T')[0],
    },
    {
      userId: `usr-new-2`,
      name: 'Nathalie Biya',
      phone: '+237 671 22 33 44',
      roles: ['member'],
      payoutTurn: 2,
      joinedDate: new Date().toISOString().split('T')[0],
    },
    {
      userId: `usr-new-3`,
      name: 'Roger Milla',
      phone: '+237 692 55 66 77',
      roles: ['member'],
      payoutTurn: 3,
      joinedDate: new Date().toISOString().split('T')[0],
    },
  ]);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'reviewer' | 'treasurer'>('member');
  const [errorMsg, setErrorMsg] = useState('');

  const inviteUrl = `${window.location.origin}${window.location.pathname}?invite=${tempGroupId}`;

  const handleCopyInviteLink = () => {
    try {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleWhatsAppShare = () => {
    const amountVal = parseInt(contributionAmount, 10) || 0;
    const freqDisplay = frequency === 'custom' ? (customLabel.trim() || `Every ${customDays} days`) : frequency;
    const text = encodeURIComponent(
      `Hello! You've been invited to join our Njangi Together group: "${name || 'New Njangi'}".\n\n💰 Contribution: ${formatFCFA(amountVal)} • ${freqDisplay.toUpperCase()}\n\n🔗 Click here to join directly (or register first if you are new):\n${inviteUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const newTurn = members.length + 1;
    const newM: GroupMember = {
      userId: `usr-new-${Date.now()}`,
      name: newMemberName.trim(),
      phone: newMemberPhone.trim() || '+237 6XX XXX XXX',
      roles: [newMemberRole],
      payoutTurn: newTurn,
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setMembers([...members, newM]);
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberRole('member');
  };

  const handleRemoveMember = (idx: number) => {
    if (members.length <= 2) {
      setErrorMsg('A njangi requires at least 2 members.');
      return;
    }
    const updated = members.filter((_, i) => i !== idx).map((m, i) => ({
      ...m,
      payoutTurn: i + 1,
    }));
    setMembers(updated);
  };

  const handleCreateAndActivate = () => {
    setErrorMsg('');

    if (collectionArrangement === 'direct_beneficiary' && !offsetAccepted) {
      setErrorMsg('Please read and accept the beneficiary contribution offset rule before activation.');
      return;
    }

    const parsedAmount = parseInt(contributionAmount, 10);
    const parsedDeadline = parseInt(deadlineDays, 10);
    const parsedLateFee = parseInt(lateFeeAmount, 10);
    const parsedCustomDays = frequency === 'custom' ? parseInt(customDays, 10) || 1 : undefined;

    const res = createNewGroup({
      id: tempGroupId,
      name: name.trim(),
      description: description.trim(),
      contributionAmount: parsedAmount,
      collectionArrangement,
      frequency,
      customFrequencyDays: parsedCustomDays,
      customFrequencyLabel: frequency === 'custom' ? (customLabel.trim() || `Every ${customDays} Days`) : undefined,
      firstContributionDate: firstDate,
      paymentDeadlineDays: parsedDeadline || (frequency === 'daily' ? 1 : 5),
      lateFeeEnabled,
      lateFeeAmount: parsedLateFee || 0,
      members,
    });

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to create group');
    }
  };

  const amountVal = parseInt(contributionAmount, 10) || 0;
  const nominalPot = amountVal * members.length;
  const directReceipts = amountVal * Math.max(0, members.length - 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Wizard Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
            {step}/3
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              {t.createNewGroup}
            </h3>
            <p className="text-xs text-gray-500">
              {step === 1 && 'Step 1: Group Details & Collection Arrangement'}
              {step === 2 && 'Step 2: Add Members, Roles & Payout Turns'}
              {step === 3 && 'Step 3: Review Schedule & Lock Cycle'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs mb-4">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Basic Info & Arrangement */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Group Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Buea Silicon Mountain Solidarity"
                className="w-full border border-gray-200 rounded-xl p-2.5 focus:outline-emerald-600 text-xs"
                required
              />
            </div>

            {/* Collection Arrangement Choice (Section 3) */}
            <div className="space-y-2">
              <label className="font-bold text-gray-700 block">{t.collectionArrangementLabel} *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border cursor-pointer transition ${
                  collectionArrangement === 'central'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="arrangement"
                    checked={collectionArrangement === 'central'}
                    onChange={() => setCollectionArrangement('central')}
                    className="sr-only"
                  />
                  <div className="font-bold text-gray-900 text-xs">{t.centralCollection}</div>
                  <p className="text-[11px] text-gray-600 mt-1 leading-normal">
                    {t.centralCollectionDesc}
                  </p>
                </label>

                <label className={`p-3 rounded-xl border cursor-pointer transition ${
                  collectionArrangement === 'direct_beneficiary'
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="arrangement"
                    checked={collectionArrangement === 'direct_beneficiary'}
                    onChange={() => setCollectionArrangement('direct_beneficiary')}
                    className="sr-only"
                  />
                  <div className="font-bold text-gray-900 text-xs">{t.directBeneficiaryCollection}</div>
                  <p className="text-[11px] text-gray-600 mt-1 leading-normal">
                    {t.directBeneficiaryCollectionDesc}
                  </p>
                </label>
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 block mb-1">Contribution per Member (FCFA) *</label>
              <input
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 font-bold text-emerald-800 focus:outline-emerald-600 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">First Contribution Date *</label>
                <input
                  type="date"
                  value={firstDate}
                  onChange={(e) => setFirstDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs focus:outline-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Payment Window (Days after round start)</label>
                <input
                  type="number"
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-xs transition active:scale-95"
              >
                <span>Continue to Stage 2: Cadence & Members</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Cadence & Frequency Model, Invite Link, and Members */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            {/* 1. Cadence & Frequency Model (Daily + Custom) */}
            <div className="p-3.5 bg-slate-50 border border-gray-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  Frequency & Cadence Model
                </span>
                <span className="text-[10px] text-gray-500 font-medium">Stage 2 Schedule Configuration</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'daily', label: t.daily || 'Daily', desc: 'Every 1 Day' },
                  { id: 'weekly', label: t.weekly || 'Weekly', desc: 'Every 7 Days' },
                  { id: 'fortnightly', label: t.fortnightly || 'Every 2 Weeks', desc: 'Every 14 Days' },
                  { id: 'monthly', label: t.monthly || 'Monthly', desc: 'Every 30 Days' },
                  { id: 'custom', label: t.custom || 'Custom Cadence', desc: 'Custom Interval' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFrequency(opt.id as any)}
                    className={`p-2 rounded-xl border text-center transition ${
                      frequency === opt.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-600/20'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs truncate">{opt.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>

              {frequency === 'custom' && (
                <div className="p-3 bg-white border border-emerald-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1 text-[11px]">
                      Cadence Interval (in Days) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      placeholder="e.g. 3 for every 3 days"
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs font-bold text-emerald-900"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1 text-[11px]">
                      Custom Frequency Label
                    </label>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="e.g. Every 3 Days, Market Day"
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Generated Invite Link Box */}
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-emerald-700" />
                  Generated Invite Link for this Njangi
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Stage 2 Shareable Link
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-2.5 py-2 text-[11px] font-mono text-gray-800 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs transition active:scale-95"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs transition active:scale-95"
                  title="Share on WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>

              <div className="p-2.5 bg-white/90 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 space-y-1">
                <span className="font-bold block">How invitations work:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-700">
                  <li><strong>Members already using the app: </strong>Clicking this link joins this Njangi directly in one click.</li>
                  <li><strong>Members not yet using the app: </strong>Opening this link prompts them to create their account first. All new accounts start as ordinary <strong>Members</strong>. After creation, the option to join this Njangi appears automatically.</li>
                </ul>
              </div>
            </div>

            {/* Total Members summary */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-800">Initial Members: {members.length}</span>
                <span className="text-gray-500 block text-[11px]">
                  Cycle will run for {members.length} rounds. You ({currentUser.name}) start with Admin rights as creator.
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-800 text-sm">
                  Pot: {formatFCFA(nominalPot)}
                </span>
              </div>
            </div>

            {/* Members table */}
            <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
              {members.map((m, idx) => (
                <div key={m.userId} className="p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-xs shrink-0">
                      #{m.payoutTurn}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 truncate">{m.name}</span>
                        {idx === 0 && (
                          <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                            Creator & Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 block">{m.roles.join(', ')} • {m.phone}</span>
                    </div>
                  </div>

                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(idx)}
                      className="text-gray-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add member row */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
              <span className="font-bold text-emerald-900 block text-xs">Add Initial Member Pre-Entry</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Full Legal Name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Cameroon Phone (+237 6...)"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="border border-gray-200 rounded-lg p-2 text-xs bg-white"
                />
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="border border-gray-200 rounded-lg p-2 text-xs bg-white"
                >
                  <option value="member">Member</option>
                  <option value="reviewer">Independent Reviewer</option>
                  <option value="treasurer">Treasurer</option>
                </select>
              </div>
              <button
                type="button"
                disabled={!newMemberName.trim()}
                onClick={handleAddMember}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                + Add Member Slot
              </button>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                disabled={members.length < 2}
                onClick={() => setStep(3)}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <span>Review Schedule & Activate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Lock Cycle */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">{name}</span>
                <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {collectionArrangement === 'direct_beneficiary' ? 'Direct Beneficiary Mode' : 'Central Treasury Mode'}
                </span>
              </div>
              <p className="text-gray-600">
                {members.length} members • {formatFCFA(amountVal)} / member • {frequency === 'custom' ? (customLabel || `EVERY ${customDays} DAYS`) : frequency.toUpperCase()}
              </p>
            </div>

            {/* Direct Collection Offset Acceptance (Section 8) */}
            {collectionArrangement === 'direct_beneficiary' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-950">
                <div className="flex items-center gap-2 font-bold">
                  <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Beneficiary Contribution Offset Rule (MVP Section 8)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  In direct collection, each round the beneficiary receives {formatFCFA(directReceipts)} from the other {members.length - 1} members. Their own obligation of {formatFCFA(amountVal)} is satisfied through an agreed offset. Offsets are not cash received and do not enter the cash ledger.
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-1 font-semibold">
                  <input
                    type="checkbox"
                    checked={offsetAccepted}
                    onChange={(e) => setOffsetAccepted(e.target.checked)}
                    className="rounded text-amber-700"
                  />
                  <span>I understand and accept the beneficiary contribution offset calculation rule.</span>
                </label>
              </div>
            )}

            {/* Lock Cycle Warning */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-start gap-2">
              <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong>Cycle Lock Safeguard (Section 2 & 3): </strong>
                Once activated, membership, collection arrangement and contribution amounts are locked for Cycle #1 to guarantee accountability. Payout order changes will require an explicit recorded reason.
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateAndActivate}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-md transition active:scale-95"
              >
                Activate Cycle #1 Now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
