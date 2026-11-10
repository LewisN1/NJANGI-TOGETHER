/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNjangi } from '../../context/NjangiContext.tsx';
import { formatFCFA } from '../../utils/njangiLogic.ts';
import { X, Share2, Copy, ExternalLink, MessageCircle } from 'lucide-react';

interface WhatsAppModalProps {
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ onClose }) => {
  const { activeGroup, currentLanguage, t } = useNjangi();
  const [copied, setCopied] = useState(false);

  if (!activeGroup) return null;

  const curRound = activeGroup.currentRound;
  const amountStr = formatFCFA(activeGroup.contributionAmount);

  const approvedDest = activeGroup.receivingDestinations.find(
    (d) => d.status === 'approved' && (d.roundNumber === curRound || !d.roundNumber)
  );
  const destInfo = approvedDest
    ? `${approvedDest.provider.toUpperCase()}: ${approvedDest.accountName} (${approvedDest.accountNumberOrDetails})`
    : 'Contact Group Treasurer / Beneficiary';

  const messageText =
    currentLanguage === 'fr'
      ? `Bonjour cher membre de *${activeGroup.name}* ! 👋\n\nRappel amical : la cotisation pour le *Tour ${curRound}* (${amountStr}) est attendue.\n\n📱 Destination de paiement approuvée :\n${destInfo}\n\nMerci de soumettre vos détails de paiement dans l'application *Njangi Together* une fois le virement effectué ! 🙏`
      : `Hello dear member of *${activeGroup.name}* ! 👋\n\nFriendly reminder: Your contribution for *Round ${curRound}* (${amountStr}) is due.\n\n📱 Approved receiving destination:\n${destInfo}\n\nPlease submit your payment details in the *Njangi Together* app once paid. Thank you! 🙏`;

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-tight">
              Share WhatsApp Reminder
            </h3>
            <p className="text-xs text-gray-500">
              Round {curRound} Contribution Alert
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] leading-relaxed">
            <strong>Honest notice:</strong> {t.whatsappDisclaimer}
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1.5">
              Message Preview:
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-[11px] text-gray-800 whitespace-pre-wrap leading-relaxed">
              {messageText}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Open WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl flex items-center gap-2 transition"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
