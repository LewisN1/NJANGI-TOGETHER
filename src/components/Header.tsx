/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../context/NjangiContext.tsx';
import {
  Globe,
  RotateCcw,
  ChevronDown,
  CheckCircle2,
  PlusCircle,
  ShieldAlert,
  Layers,
  UserPlus,
  Link2,
  Trash2,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC<{
  onOpenCreateGroup?: () => void;
  onOpenCreateAccount?: () => void;
  onOpenPlatformConsole?: () => void;
  onOpenJoinNjangi?: () => void;
}> = ({
  onOpenCreateGroup,
  onOpenCreateAccount,
  onOpenPlatformConsole,
  onOpenJoinNjangi,
}) => {
  const {
    activeGroup,
    groups,
    currentUser,
    allUsers,
    switchUser,
    switchGroup,
    currentLanguage,
    toggleLanguage,
    t,
    userRoles,
    loadSampleDemoData,
    clearAllData,
    resetDemoData,
    isReadOnlyIncidentMode,
    incidentReason,
  } = useNjangi();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  const roleLabel = userRoles.includes('admin')
    ? userRoles.includes('treasurer')
      ? t.adminAndTreasurer
      : t.admin
    : userRoles.includes('treasurer')
    ? t.treasurer
    : userRoles.includes('reviewer')
    ? t.reviewer
    : t.member;

  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      {/* Emergency Read-Only Incident Banner (Section 17) */}
      {isReadOnlyIncidentMode && (
        <div className="bg-rose-700 text-white px-4 py-1.5 text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span>
              {currentLanguage === 'fr'
                ? `ALERTE INCIDENT : Mode lecture seule actif (${incidentReason || 'Maintenance de sécurité'}). Mutations financières bloquées.`
                : `INCIDENT ALERT: Emergency read-only mode active (${incidentReason || 'Security maintenance'}). Financial mutations are blocked.`}
            </span>
          </div>
          {onOpenPlatformConsole && (
            <button
              type="button"
              onClick={onOpenPlatformConsole}
              className="underline text-[11px] text-white hover:text-amber-200 ml-2 shrink-0"
            >
              Console
            </button>
          )}
        </div>
      )}

      {/* Non-custodial top banner notice */}
      <div className="bg-emerald-950 text-emerald-200/90 px-4 py-1 text-[11px] flex items-center justify-between border-b border-emerald-800/60 overflow-hidden">
        <div className="flex items-center gap-1.5 truncate">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            {currentLanguage === 'fr'
              ? 'Tenue de registres uniquement : l’application ne détient ni ne transfère de fonds.'
              : 'Recordkeeping service only: Money moves externally via MoMo, Orange Money, Cash or Bank.'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {onOpenPlatformConsole && (
            <button
              type="button"
              onClick={onOpenPlatformConsole}
              className="text-[10px] text-emerald-300 hover:text-white underline"
            >
              {t.platformConsole}
            </button>
          )}
          <span className="hidden sm:inline-block font-mono text-[10px] text-emerald-400">
            XAF (FCFA)
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand & Group Switcher */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0 text-amber-400 font-bold shadow-inner">
            <span className="text-xl">🤝</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                {t.appName}
              </h1>
              {activeGroup && (
                <span className={`hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                  activeGroup.collectionArrangement === 'direct_beneficiary'
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                    : 'bg-emerald-700/60 text-emerald-100 border-emerald-600'
                }`}>
                  {activeGroup.collectionArrangement === 'direct_beneficiary'
                    ? (currentLanguage === 'fr' ? 'Collecte Directe' : 'Direct Collection')
                    : (currentLanguage === 'fr' ? 'Collecte Centrale' : 'Central Collection')}
                </span>
              )}
            </div>

            {/* Group selector dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowGroupMenu(!showGroupMenu)}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-100 hover:text-white transition font-medium focus:outline-none truncate max-w-[200px] sm:max-w-xs"
              >
                <span className="truncate">{activeGroup?.name || t.myGroups}</span>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 opacity-80" />
              </button>

              {showGroupMenu && (
                <div
                  className="absolute left-0 mt-2 w-80 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setShowGroupMenu(false)}
                >
                  <p className="text-xs font-semibold uppercase text-gray-500 px-3 py-1">
                    {t.myGroups} (Switch Context)
                  </p>
                  <div className="space-y-1">
                    {groups.length === 0 ? (
                      <div className="px-3 py-3 text-xs text-gray-500 text-center italic">
                        {currentLanguage === 'fr'
                          ? 'Aucun groupe pour le moment. Créez-en un ou rejoignez via un lien.'
                          : 'No groups yet. Create one or join with an invite code.'}
                      </div>
                    ) : (
                      groups.map((g) => {
                        const memberInGroup = g.members.find((m) => m.userId === currentUser.id);
                        const rolesInGroup = memberInGroup?.roles || [];
                        const gRoleLabel = rolesInGroup.includes('admin')
                          ? rolesInGroup.includes('treasurer')
                            ? 'Admin & Treasurer'
                            : 'Admin'
                          : rolesInGroup.includes('treasurer')
                          ? 'Treasurer'
                          : rolesInGroup.includes('reviewer')
                          ? 'Independent Reviewer'
                          : memberInGroup
                          ? 'Member'
                          : 'Non-member';

                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => switchGroup(g.id)}
                            className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition ${
                              g.id === activeGroup?.id
                                ? 'bg-emerald-50 text-emerald-900 font-semibold'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="truncate block font-medium">{g.name}</span>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                <span>Role: <strong>{gRoleLabel}</strong></span>
                                <span>•</span>
                                <span className="text-emerald-700">
                                  {g.collectionArrangement === 'direct_beneficiary' ? 'Direct' : 'Central'}
                                </span>
                              </div>
                            </div>
                            {g.id === activeGroup?.id && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                    {onOpenCreateGroup && (
                      <button
                        type="button"
                        onClick={onOpenCreateGroup}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        {t.createNewGroup}
                      </button>
                    )}
                    {onOpenJoinNjangi && (
                      <button
                        type="button"
                        onClick={onOpenJoinNjangi}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      >
                        <Link2 className="w-4 h-4 text-emerald-700" />
                        <span>{t.joinNjangi || 'Join with Invite Link'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side controls: Join Njangi, Register Real Account, Language, Demo Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenJoinNjangi && (
            <button
              type="button"
              onClick={onOpenJoinNjangi}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-xs font-medium text-emerald-100 hover:text-white transition"
              title="Join a group via invite link or code"
            >
              <Link2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">{t.joinNjangi || 'Join Njangi'}</span>
            </button>
          )}

          {onOpenCreateAccount && (
            <button
              type="button"
              onClick={onOpenCreateAccount}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-semibold text-amber-200 hover:text-white transition"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.registerBtn}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={t.switchLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 border border-emerald-700 text-xs font-medium text-emerald-100 hover:text-white transition"
          >
            <Globe className="w-3.5 h-3.5 text-amber-300" />
            <span>{currentLanguage.toUpperCase()}</span>
          </button>

          {/* User / Role Switcher for Testing (Section 2: Isolated Demo Sandbox) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 border border-emerald-700 text-xs font-medium text-white transition focus:outline-none"
            >
              <div className="w-6 h-6 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="font-semibold text-xs leading-none truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[10px] text-amber-200 mt-0.5 truncate max-w-[120px]">{roleLabel}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-76 bg-white text-gray-900 rounded-xl shadow-2xl border border-gray-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowUserMenu(false)}
              >
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    <p className="text-xs font-bold text-gray-800">
                      {currentLanguage === 'fr' ? 'Bac à Sable Démo (Rôles & Personas)' : 'Simulated Demo Sandbox'}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {currentLanguage === 'fr'
                      ? 'Testez les rôles Admin, Trésorier, Vérificateur et Membre isolés dans ce groupe.'
                      : 'Switch between isolated demo personas to test multi-role governance in this group.'}
                  </p>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {allUsers.map((u) => {
                    const memberInfo = activeGroup?.members.find((m) => m.userId === u.id);
                    const roles = memberInfo?.roles || ['member'];
                    const isSelected = u.id === currentUser.id;

                    const pRole = roles.includes('admin')
                      ? roles.includes('treasurer')
                        ? 'Admin & Treasurer'
                        : 'Admin'
                      : roles.includes('treasurer')
                      ? 'Treasurer'
                      : roles.includes('reviewer')
                      ? 'Independent Reviewer'
                      : `Member (Turn #${memberInfo?.payoutTurn || '?'})`;

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => switchUser(u.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-semibold'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {u.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-xs">{u.name}</p>
                            <span className="text-[10px] text-gray-500 block truncate">{pRole}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-gray-100 mt-2 pt-2 space-y-1.5 px-1">
                  <div className="flex items-center justify-between">
                    {onOpenCreateAccount && (
                      <button
                        type="button"
                        onClick={onOpenCreateAccount}
                        className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-medium"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {t.registerBtn}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadSampleDemoData();
                        setShowUserMenu(false);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-medium ml-auto"
                      title="Load sample tontine groups for demonstration"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{currentLanguage === 'fr' ? 'Démo' : 'Sample'}</span>
                    </button>
                  </div>
                  <div className="pt-1 border-t border-gray-50 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAllData();
                        setShowUserMenu(false);
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium"
                      title="Clear all stored data and start fresh"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{currentLanguage === 'fr' ? 'Effacer tout (Départ propre)' : 'Clear Data (Fresh Start)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
