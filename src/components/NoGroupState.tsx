/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNjangi } from '../context/NjangiContext.tsx';
import { PlusCircle, Link2, Sparkles, Shield, Users, ArrowRight } from 'lucide-react';

interface NoGroupStateProps {
  onOpenCreateGroup?: () => void;
  onOpenJoinNjangi?: () => void;
  onOpenCreateAccount?: () => void;
}

export const NoGroupState: React.FC<NoGroupStateProps> = ({
  onOpenCreateGroup,
  onOpenJoinNjangi,
  onOpenCreateAccount,
}) => {
  const { currentLanguage, loadSampleDemoData, currentUser } = useNjangi();

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 text-center space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome */}
      <div className="space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm text-2xl font-bold">
          🤝
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {currentLanguage === 'fr' ? 'Bienvenue sur Njangi Together' : 'Welcome to Njangi Together'}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
          {currentLanguage === 'fr'
            ? 'Plateforme non-custodiale de gestion et tenue de registres pour tontines au Cameroun. Vous démarrez sur une base propre et sécurisée.'
            : 'Non-custodial recordkeeping and governance for rotating savings groups in Cameroon. You are starting with a fresh, clean slate.'}
        </p>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
        {/* Create Group Card */}
        <div className="p-5 bg-white border border-emerald-200 rounded-2xl shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">
              {currentLanguage === 'fr' ? 'Créer un nouveau Njangi' : 'Create a New Njangi'}
            </h3>
            <p className="text-xs text-gray-600 leading-normal">
              {currentLanguage === 'fr'
                ? 'Configurez votre groupe en 3 étapes : montant, fréquence (quotidienne, hebdo, mensuelle ou personnalisée), et générez un lien d’invitation.'
                : 'Set up your group in 3 stages: contribution amount, cadence (daily, weekly, monthly, or custom), and generate an instant invite link.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreateGroup}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <span>{currentLanguage === 'fr' ? 'Créer un Njangi' : 'Create New Njangi'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Join Group Card */}
        <div className="p-5 bg-white border border-amber-200 rounded-2xl shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-amber-700" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">
              {currentLanguage === 'fr' ? 'Rejoindre via un lien d’invitation' : 'Join with an Invite Link / Code'}
            </h3>
            <p className="text-xs text-gray-600 leading-normal">
              {currentLanguage === 'fr'
                ? 'Reçu un lien d’un ami ou administrateur ? Collez le code pour rejoindre le groupe avec le rôle de membre.'
                : 'Received a link or code from a creator on WhatsApp? Paste the invite link to join as an ordinary member.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenJoinNjangi}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <span>{currentLanguage === 'fr' ? 'Rejoindre avec un code' : 'Join with Invite Link'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account Profile Status */}
      <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-sm shrink-0">
            {currentUser.name[0]}
          </div>
          <div>
            <span className="font-bold text-xs text-gray-900 block">{currentUser.name}</span>
            <span className="text-[11px] text-gray-500 font-mono">{currentUser.phone}</span>
          </div>
        </div>
        {onOpenCreateAccount && (
          <button
            type="button"
            onClick={onOpenCreateAccount}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-emerald-800 border border-gray-300 rounded-xl text-xs font-semibold shrink-0"
          >
            {currentLanguage === 'fr' ? 'Créer / Modifier un Compte' : 'Register Real Account'}
          </button>
        )}
      </div>

      {/* Optional demo sample link */}
      <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-gray-500">
        <span>
          {currentLanguage === 'fr'
            ? 'Besoin d’inspecter des exemples de tontines ?'
            : 'Want to inspect sample data for demonstration?'}
        </span>
        <button
          type="button"
          onClick={loadSampleDemoData}
          className="text-emerald-700 hover:text-emerald-900 font-bold underline flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{currentLanguage === 'fr' ? 'Charger les données démo' : 'Load Sample Demo Njangi'}</span>
        </button>
      </div>
    </div>
  );
};
