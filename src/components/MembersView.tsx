/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../context/NjangiContext.tsx';
import { formatFCFA, getMemberSlotSummary } from '../utils/njangiLogic.ts';
import { GroupMember } from '../types/njangi.ts';
import {
  ShieldCheck,
  Phone,
  Calendar,
  Lock,
  Eye,
  CheckCircle2,
  Users,
  Search,
  Plus,
  Layers,
  Shield,
  UserCheck,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import { NoGroupState } from './NoGroupState.tsx';

interface MembersViewProps {
  onOpenCreateAccount?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ onOpenCreateAccount }) => {
  const {
    activeGroup,
    currentUser,
    isAdmin,
    isTreasurer,
    isReviewer,
    grantAdminRights,
    revokeAdminRights,
    t,
    currentLanguage,
  } = useNjangi();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberForSlots, setSelectedMemberForSlots] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!activeGroup) {
    return <NoGroupState onOpenCreateAccount={onOpenCreateAccount} />;
  }

  const activeMemberSummary = selectedMemberForSlots
    ? getMemberSlotSummary(activeGroup, selectedMemberForSlots)
    : null;

  const filteredMembers = activeGroup.members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.phone.includes(q);
  });

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {t.navMembers} ({activeGroup.members.length})
          </h2>
          <p className="text-xs text-gray-500">
            {currentLanguage === 'fr'
              ? 'Membres du cycle, répartition des 4 rôles et ordre de passage'
              : 'Cycle members, 4-tier role governance, and payout turn schedule'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}?invite=${activeGroup.id}`;
              navigator.clipboard.writeText(url);
              setCopiedInvite(true);
              setTimeout(() => setCopiedInvite(false), 2500);
            }}
            className="px-3 py-2 bg-white hover:bg-gray-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition active:scale-95"
            title="Copy invite link to share with new members"
          >
            {copiedInvite ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.linkCopied || 'Invite Copied!'}</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t.copyInviteLink || 'Copy Invite Link'}</span>
              </>
            )}
          </button>

          {onOpenCreateAccount && (
            <button
              type="button"
              onClick={onOpenCreateAccount}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.registerBtn}</span>
            </button>
          )}

          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200">
            Cycle #{activeGroup.cycleNumber} • {activeGroup.members.length} Slots
          </span>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-emerald-100/90 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center justify-between animate-in fade-in duration-150">
          <span>{actionFeedback}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-emerald-800 font-bold ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Cross-Group Role Isolation Card (Section 2) */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200/90 rounded-2xl text-xs text-emerald-950 flex items-start gap-3 shadow-xs">
        <Layers className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-emerald-900 text-xs sm:text-sm font-bold">
            {currentLanguage === 'fr'
              ? 'Multi-Groupes & Permissions Isolées (Section 2 du cahier des charges) :'
              : 'Cross-Group Membership & Scoped Permissions (MVP Section 2):'}
          </strong>
          <p className="mt-0.5 text-gray-700 leading-relaxed text-[11px] sm:text-xs">
            {currentLanguage === 'fr'
              ? 'Une personne peut être Administrateur dans un groupe et simple Membre dans un autre. Les permissions sont strictement cantonnées à chaque groupe et vérifiées indépendamment. Par exemple, Amadou Tita est Admin & Trésorier dans "Bamenda Sunrise Njangi", mais simple Membre dans "Molyko Tech Solidarity".'
              : 'A person can administer one group and be an ordinary member in another. Roles are enforced strictly per group. For example, Amadou Tita is Admin & Treasurer in "Bamenda Sunrise Njangi", but merely an ordinary Member in "Molyko Tech Solidarity".'}
          </p>
        </div>
      </div>

      {/* 3. Privacy & Identity Safeguard Notice (Section 12) */}
      <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-600 flex items-start gap-2">
        <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-semibold">{currentLanguage === 'fr' ? 'Protection de l’identité (MVP Section 12) : ' : 'Identity & Privacy Safeguards (MVP Section 12): '}</span>
          {t.govIdNotice}
        </div>
      </div>

      {/* 4. Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={currentLanguage === 'fr' ? 'Rechercher un membre par nom ou téléphone...' : 'Search members by name or phone...'}
          className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-emerald-600 shadow-xs"
        />
      </div>

      {/* 5. Members List */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {filteredMembers.map((member) => {
          const isCurrent = member.userId === currentUser.id;
          const roles = member.roles || ['member'];
          const userSlots = (activeGroup.slots || []).filter((s) => s.memberId === member.userId);

          // Mask phone if not self or authorised official
          const canViewPhone = isCurrent || isAdmin || isTreasurer || isReviewer;
          const displayPhone = canViewPhone
            ? member.phone
            : member.phone.replace(/(\+237\s\d{3})\s\d{2}\s\d{2}\s(\d{2})/, '$1 •• •• $2');

          return (
            <div
              key={member.userId}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                isCurrent ? 'bg-emerald-50/40' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-sm shrink-0">
                  {member.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 truncate">
                      {member.name}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                    {roles.map((r) => (
                      <span
                        key={r}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          r === 'admin'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : r === 'treasurer'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : r === 'reviewer'
                            ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {r === 'admin'
                          ? t.admin
                          : r === 'treasurer'
                          ? t.treasurer
                          : r === 'reviewer'
                          ? t.reviewer
                          : t.member}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>{displayPhone}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Turn #{member.payoutTurn}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Governance & Turn/Slot Badges */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {isAdmin && !isCurrent && (
                  <div>
                    {roles.includes('admin') ? (
                      <button
                        type="button"
                        onClick={() => {
                          const res = revokeAdminRights(activeGroup.id, member.userId);
                          if (res.success) {
                            setActionFeedback(`Admin rights revoked for ${member.name}.`);
                            setTimeout(() => setActionFeedback(null), 3500);
                          } else {
                            setActionFeedback(res.error || 'Failed to revoke admin rights.');
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-rose-50 text-amber-900 hover:text-rose-700 border border-amber-300 hover:border-rose-300 rounded-lg text-[11px] font-semibold transition"
                        title="Revoke Admin rights in this Njangi"
                      >
                        {t.revokeAdmin || 'Revoke Admin'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const res = grantAdminRights(activeGroup.id, member.userId);
                          if (res.success) {
                            setActionFeedback(`Admin rights granted to ${member.name} by group creator/admin.`);
                            setTimeout(() => setActionFeedback(null), 3500);
                          } else {
                            setActionFeedback(res.error || 'Failed to grant admin rights.');
                          }
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition"
                        title="Creator/Admin privilege: Grant admin rights to this member"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                        <span>{t.grantAdmin || 'Grant Admin'}</span>
                      </button>
                    )}
                  </div>
                )}

                {userSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedMemberForSlots(member.userId)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{userSlots.length} {userSlots.length === 1 ? 'Slot' : 'Slots'} Summary</span>
                  </button>
                )}

                <div className="text-right">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">
                    {currentLanguage === 'fr' ? 'Tour / Part' : 'Turn / Slot'}
                  </div>
                  <div className="text-xs font-bold text-gray-800">
                    {userSlots.length > 1
                      ? `${userSlots.length} Slots Owned`
                      : `Turn #${member.payoutTurn} of ${activeGroup.totalRounds}`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Member Slot Summary Modal (Section 5) */}
      {selectedMemberForSlots && activeMemberSummary && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Section 5: Multi-Slot Participation
                </span>
                <h3 className="text-base font-bold text-gray-900 mt-1">
                  {activeGroup.members.find((m) => m.userId === selectedMemberForSlots)?.name} - Slot Summary
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForSlots(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Metric grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold block">Total Slots Owned</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block">{activeMemberSummary.totalSlotsCount}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold block">Nominal Entitlement</span>
                  <span className="text-sm font-bold text-emerald-800 mt-0.5 block">
                    {formatFCFA(activeMemberSummary.nominalEntitlementTotal)}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-gray-500 text-[10px] uppercase font-semibold block">Confirmed Paid</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5 block">
                    {formatFCFA(activeMemberSummary.confirmedContributions)}
                  </span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl">
                  <span className="text-rose-700 text-[10px] uppercase font-semibold block">Outstanding Entitlement</span>
                  <span className="text-sm font-bold text-rose-800 mt-0.5 block">
                    {formatFCFA(activeMemberSummary.outstandingEntitlement)}
                  </span>
                </div>
              </div>

              {/* Slot breakdown */}
              <div>
                <h4 className="font-bold text-gray-800 uppercase text-[10px] tracking-wider mb-2">
                  Owned Participation Slots
                </h4>
                <div className="space-y-1.5">
                  {activeMemberSummary.slots.map((s) => (
                    <div key={s.id} className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold text-[10px] flex items-center justify-center">
                          {s.slotNumber}
                        </span>
                        <div>
                          <span className="font-semibold text-gray-900 block">{s.displayName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">ID: {s.id}</span>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-800 text-xs">
                        {formatFCFA(activeGroup.contributionAmount)} / round
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payout allocations for these slots */}
              <div>
                <h4 className="font-bold text-gray-800 uppercase text-[10px] tracking-wider mb-2">
                  Scheduled Payout Allocations
                </h4>
                <div className="space-y-1.5">
                  {(activeGroup.payoutAllocations || [])
                    .filter((a) => a.beneficiaryId === selectedMemberForSlots)
                    .map((alloc) => (
                      <div key={alloc.id} className="p-2 rounded-lg border border-gray-100 bg-white flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-gray-800">Round #{alloc.roundNumber} Allocation</span>
                          <span className="text-[10px] text-gray-400 block font-mono">Slot: {alloc.receivingSlotId}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-emerald-800 block">{formatFCFA(alloc.scheduledAmount)}</span>
                          <span className="text-[10px] text-gray-500 font-medium">{alloc.status}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMemberForSlots(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
