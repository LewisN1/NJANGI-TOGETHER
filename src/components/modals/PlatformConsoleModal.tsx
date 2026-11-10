/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import {
  ShieldAlert,
  Server,
  AlertTriangle,
  LifeBuoy,
  Lock,
  Unlock,
  CheckCircle,
  Activity,
  X,
  Plus,
} from 'lucide-react';
import type { PlatformTicket } from '../../types/njangi.ts';

export const PlatformConsoleModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    isReadOnlyIncidentMode,
    incidentReason,
    setIncidentReadOnlyMode,
    supportTickets,
    createSupportTicket,
    updateSupportTicket,
    currentUser,
    t,
    currentLanguage,
  } = useNjangi();

  const [activeTab, setActiveTab] = useState<'incident' | 'tickets' | 'health'>('incident');
  const [newReason, setNewReason] = useState(incidentReason || '');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // New ticket state
  const [ticketCategory, setTicketCategory] = useState<PlatformTicket['category']>('account_access');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');

  const handleToggleIncident = (targetState: boolean) => {
    if (targetState && !newReason.trim()) {
      alert(currentLanguage === 'fr' ? 'Veuillez préciser le motif de l’incident.' : 'Please provide an incident reason.');
      return;
    }
    setIncidentReadOnlyMode(targetState, newReason);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;
    createSupportTicket({
      category: ticketCategory,
      subject: ticketSubject,
      description: ticketDesc,
    });
    setTicketSubject('');
    setTicketDesc('');
    setShowNewTicketForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {currentLanguage === 'fr' ? 'Console d’Exploitation Plateforme' : 'Platform Operations Console'}
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Staff Only (Least Privilege)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentLanguage === 'fr'
                  ? 'Gestion des incidents, support technique et intégrité système. Les agents support n’ont aucun pouvoir de confirmation financière.'
                  : 'Incident controls, account troubleshooting, and health monitoring. Staff have zero financial confirmation powers.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-5 pt-3 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('incident')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'incident'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{currentLanguage === 'fr' ? 'Mode Incident & Sécurité' : 'Incident Mode & Security'}</span>
            {isReadOnlyIncidentMode && (
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tickets')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'tickets'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>{currentLanguage === 'fr' ? 'Tickets de Support' : 'Support Tickets'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700">
              {supportTickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'health'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{currentLanguage === 'fr' ? 'Santé du Service' : 'Service Health'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'incident' && (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-xl border ${
                  isReadOnlyIncidentMode
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isReadOnlyIncidentMode ? (
                    <Lock className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Unlock className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold">
                      {isReadOnlyIncidentMode
                        ? (currentLanguage === 'fr' ? 'Mode Incident Lecture Seule ACTIVÉ' : 'Emergency Read-Only Incident Mode is ACTIVE')
                        : (currentLanguage === 'fr' ? 'Système Opérationnel Normal' : 'System Operating Normally')}
                    </h3>
                    <p className="text-xs mt-1">
                      {isReadOnlyIncidentMode
                        ? (currentLanguage === 'fr'
                            ? `Toutes les mutations financières (déclarations, approbations, versements, annulations) sont bloquées. Motif enregistré : "${incidentReason}"`
                            : `All ordinary business mutations (payment submissions, confirmations, payouts, reversals) are blocked across groups. Active reason: "${incidentReason}"`)
                        : (currentLanguage === 'fr'
                            ? 'Les membres et gestionnaires peuvent effectuer toutes les opérations autorisées.'
                            : 'All authorized member and officer operations are running without restriction.')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Incident mode control */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  {currentLanguage === 'fr' ? 'Basculer le Mode Incident' : 'Toggle Incident State'}
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      {currentLanguage === 'fr' ? 'Motif de l’incident ou de la maintenance :' : 'Incident or Maintenance Reason:'}
                    </label>
                    <input
                      type="text"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      placeholder={currentLanguage === 'fr' ? 'Ex: Enquête de sécurité sur référence de paiement frauduleuse' : 'e.g. Investigation of fraudulent reference reports'}
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-800 outline-none"
                    />
                  </div>

                  <div className="flex gap-3">
                    {!isReadOnlyIncidentMode ? (
                      <button
                        type="button"
                        onClick={() => handleToggleIncident(true)}
                        className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Lock className="w-4 h-4" />
                        <span>{currentLanguage === 'fr' ? 'Activer la Lecture Seule d’Urgence' : 'Activate Emergency Read-Only Mode'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleIncident(false)}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>{currentLanguage === 'fr' ? 'Désactiver et Rétablir les Opérations' : 'Deactivate & Resume Normal Operations'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Boundary notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Section 17 Principle:</strong> Platform operators and technical support staff are strictly isolated from financial adjudication. Staff cannot confirm receipts, alter pots, or settle group disputes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  {currentLanguage === 'fr'
                    ? 'Assistance technique pour accès aux comptes et escalades de sécurité.'
                    : 'Account recovery and technical support escalations.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'fr' ? 'Créer un Ticket' : 'Open Ticket'}</span>
                </button>
              </div>

              {showNewTicketForm && (
                <form onSubmit={handleCreateTicket} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    {currentLanguage === 'fr' ? 'Nouveau Ticket Support' : 'Create Technical Support Ticket'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
                      >
                        <option value="account_access">Account Access / Contact Verification</option>
                        <option value="security_escalation">Security Escalation</option>
                        <option value="incident">Platform Incident Tracking</option>
                        <option value="general">General Support</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="e.g. Phone number update recovery"
                        className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Details & Description</label>
                    <textarea
                      value={ticketDesc}
                      onChange={(e) => setTicketDesc(e.target.value)}
                      rows={2}
                      className="w-full text-xs px-2.5 py-1.5 border rounded-lg bg-white"
                      placeholder="Describe the issue and steps taken..."
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewTicketForm(false)}
                      className="px-3 py-1.5 rounded-lg border text-xs text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                    >
                      Submit Ticket
                    </button>
                  </div>
                </form>
              )}

              {/* Tickets list */}
              <div className="space-y-2">
                {supportTickets.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-gray-500">{t.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            t.status === 'open'
                              ? 'bg-amber-100 text-amber-800'
                              : t.status === 'investigating'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {t.status}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.category}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-gray-900 mt-1">{t.subject}</h5>
                        <p className="text-xs text-gray-600 mt-0.5">{t.description}</p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          Submitted by {t.submittedByName} on {new Date(t.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {t.status !== 'resolved' && (
                        <button
                          type="button"
                          onClick={() => updateSupportTicket(t.id, 'resolved', 'Resolved by technical staff via console.')}
                          className="px-2.5 py-1 text-xs rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 shrink-0 font-medium"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">Frontend SPA</span>
                  </div>
                  <p className="text-[11px] text-gray-500">React 19 on Vite with Tailwind CSS</p>
                  <p className="text-xs font-mono font-semibold text-emerald-800 mt-1">Operational (Port 3000)</p>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">Ledger & Storage</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Versioned isolated local state (v5)</p>
                  <p className="text-xs font-mono font-semibold text-emerald-800 mt-1">Healthy (Reconciled)</p>
                </div>

                <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 text-emerald-700 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">External Network</span>
                  </div>
                  <p className="text-[11px] text-gray-500">Out-of-band external payments</p>
                  <p className="text-xs font-mono font-semibold text-slate-700 mt-1">Non-custodial (Zero funds held)</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">Audit & Least Privilege Architecture:</p>
                <p>• Staff actions are recorded in immutable audit logs with timestamps and operator identity.</p>
                <p>• Direct API bypass protection: Server/context logic checks authenticated group membership and group-scoped roles.</p>
                <p>• Government ID uploads are kept disabled for real users until accredited storage infrastructure is configured.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
          >
            {currentLanguage === 'fr' ? 'Fermer la console' : 'Close Console'}
          </button>
        </div>
      </div>
    </div>
  );
};
