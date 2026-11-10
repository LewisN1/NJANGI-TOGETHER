/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NjangiProvider, useNjangi } from './context/NjangiContext.tsx';
import { Header } from './components/Header.tsx';
import { BottomNav, TabKey } from './components/BottomNav.tsx';
import { DesktopNav } from './components/DesktopNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ContributionsView } from './components/ContributionsView.tsx';
import { PayoutsView } from './components/PayoutsView.tsx';
import { MembersView } from './components/MembersView.tsx';
import { MoreView } from './components/MoreView.tsx';

// Modals
import { SubmitPaymentModal } from './components/modals/SubmitPaymentModal.tsx';
import { VerifyPaymentModal } from './components/modals/VerifyPaymentModal.tsx';
import { RecordPayoutModal } from './components/modals/RecordPayoutModal.tsx';
import { AcknowledgeReceiptModal } from './components/modals/AcknowledgeReceiptModal.tsx';
import { CreateGroupModal } from './components/modals/CreateGroupModal.tsx';
import { ReorderPayoutModal } from './components/modals/ReorderPayoutModal.tsx';
import { WhatsAppModal } from './components/modals/WhatsAppModal.tsx';
import { CreateAccountModal } from './components/modals/CreateAccountModal.tsx';
import { PlatformConsoleModal } from './components/modals/PlatformConsoleModal.tsx';
import { JoinNjangiModal } from './components/modals/JoinNjangiModal.tsx';

function MainApp() {
  const { activeGroup, currentUser } = useNjangi();
  const [currentTab, setCurrentTab] = useState<TabKey>('home');

  // Modals state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitRoundTarget, setSubmitRoundTarget] = useState<number | undefined>(undefined);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifySubTarget, setVerifySubTarget] = useState<string | undefined>(undefined);

  const [showRecordPayoutModal, setShowRecordPayoutModal] = useState(false);
  const [recordPayoutRound, setRecordPayoutRound] = useState<number | undefined>(undefined);

  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [acknowledgeRound, setAcknowledgeRound] = useState<number | undefined>(undefined);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showPlatformConsole, setShowPlatformConsole] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [pendingInviteCode, setPendingInviteCode] = useState('');

  // Handle URL invitation params: ?invite=grp-123 or ?join=grp-123
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const inviteParam = params.get('invite') || params.get('join');
      if (inviteParam) {
        setPendingInviteCode(inviteParam);
        if (currentUser?.isRealUser) {
          setShowJoinModal(true);
        } else {
          // If not yet registered, prompt to create account first (all accounts start as Member)
          setShowCreateAccountModal(true);
        }
      }
    } catch {
      // browser environment check
    }
  }, [currentUser?.isRealUser]);

  const pendingSubmissionsCount =
    activeGroup?.submissions.filter(
      (s) => s.status === 'pending' || s.status === 'clarification_needed'
    ).length || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenCreateGroup={() => setShowCreateGroupModal(true)}
        onOpenCreateAccount={() => setShowCreateAccountModal(true)}
        onOpenPlatformConsole={() => setShowPlatformConsole(true)}
        onOpenJoinNjangi={() => {
          setPendingInviteCode('');
          setShowJoinModal(true);
        }}
      />

      {/* Desktop Navigation */}
      <DesktopNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingSubmissionsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-20 sm:pb-8">
        {currentTab === 'home' && (
          <DashboardView
            onNavigateTab={setCurrentTab}
            onOpenSubmitModal={() => {
              setSubmitRoundTarget(undefined);
              setShowSubmitModal(true);
            }}
            onOpenVerifyModal={() => {
              setVerifySubTarget(undefined);
              setShowVerifyModal(true);
            }}
            onOpenRecordPayoutModal={() => {
              setRecordPayoutRound(undefined);
              setShowRecordPayoutModal(true);
            }}
            onOpenAcknowledgeModal={() => {
              setAcknowledgeRound(undefined);
              setShowAcknowledgeModal(true);
            }}
            onOpenWhatsAppModal={() => setShowWhatsAppModal(true)}
            onOpenCreateGroup={() => setShowCreateGroupModal(true)}
            onOpenJoinNjangi={() => {
              setPendingInviteCode('');
              setShowJoinModal(true);
            }}
            onOpenCreateAccount={() => setShowCreateAccountModal(true)}
          />
        )}

        {currentTab === 'contributions' && (
          <ContributionsView
            onOpenSubmitModal={(targetRound) => {
              setSubmitRoundTarget(targetRound);
              setShowSubmitModal(true);
            }}
            onOpenVerifyModal={(subId) => {
              setVerifySubTarget(subId);
              setShowVerifyModal(true);
            }}
          />
        )}

        {currentTab === 'payouts' && (
          <PayoutsView
            onOpenRecordPayoutModal={(roundNum) => {
              setRecordPayoutRound(roundNum);
              setShowRecordPayoutModal(true);
            }}
            onOpenAcknowledgeModal={(roundNum) => {
              setAcknowledgeRound(roundNum);
              setShowAcknowledgeModal(true);
            }}
            onOpenReorderModal={() => setShowReorderModal(true)}
          />
        )}

        {currentTab === 'members' && (
          <MembersView onOpenCreateAccount={() => setShowCreateAccountModal(true)} />
        )}

        {currentTab === 'more' && (
          <MoreView onOpenCreateGroup={() => setShowCreateGroupModal(true)} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingSubmissionsCount}
      />

      {/* Interactive Modals */}
      {showSubmitModal && (
        <SubmitPaymentModal
          initialRound={submitRoundTarget}
          onClose={() => setShowSubmitModal(false)}
        />
      )}

      {showVerifyModal && (
        <VerifyPaymentModal
          initialSubmissionId={verifySubTarget}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

      {showRecordPayoutModal && (
        <RecordPayoutModal
          initialRound={recordPayoutRound}
          onClose={() => setShowRecordPayoutModal(false)}
        />
      )}

      {showAcknowledgeModal && (
        <AcknowledgeReceiptModal
          initialRound={acknowledgeRound}
          onClose={() => setShowAcknowledgeModal(false)}
        />
      )}

      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}

      {showReorderModal && (
        <ReorderPayoutModal onClose={() => setShowReorderModal(false)} />
      )}

      {showWhatsAppModal && (
        <WhatsAppModal onClose={() => setShowWhatsAppModal(false)} />
      )}

      {showCreateAccountModal && (
        <CreateAccountModal
          invitedGroupId={pendingInviteCode || undefined}
          onAccountCreated={() => {
            if (pendingInviteCode) {
              setShowJoinModal(true);
            }
          }}
          onClose={() => setShowCreateAccountModal(false)}
        />
      )}

      {showJoinModal && (
        <JoinNjangiModal
          initialInviteCode={pendingInviteCode}
          onClose={() => {
            setShowJoinModal(false);
            setPendingInviteCode('');
          }}
          onSuccess={() => {
            setShowJoinModal(false);
            setPendingInviteCode('');
          }}
        />
      )}

      {showPlatformConsole && (
        <PlatformConsoleModal onClose={() => setShowPlatformConsole(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <NjangiProvider>
      <MainApp />
    </NjangiProvider>
  );
}
