/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'fr';

export const translations = {
  en: {
    appName: 'Njangi Together',
    tagline: 'Cameroon Rotating Savings & Accountability Recordkeeper',
    switchLang: 'Passer en Français',
    currentLangLabel: 'EN',
    
    // Non-custodial disclaimer (Section 1)
    nonCustodialDisclaimer: 'Njangi Together is a group administration and recordkeeping service. Money moves outside the application via MTN Mobile Money, Orange Money, Cash or Bank Transfer. The application records declarations, receipt confirmations, allocations, disputes, and reconciliation. It does not transfer, safeguard, or guarantee money.',
    pinWarningNotice: 'Security notice: Never enter or share your Mobile Money PIN, banking passwords, or OTPs. Please crop or remove sensitive personal information before submitting payment screenshots.',
    
    // Roles (Section 2)
    admin: 'Group Administrator',
    treasurer: 'Treasurer',
    member: 'Member',
    reviewer: 'Independent Reviewer',
    adminAndTreasurer: 'Admin & Treasurer',

    // Slots & Multi-beneficiary (Sections 5 & 6)
    slotsLabel: 'Participation Slots',
    slotOwner: 'Slot Owner',
    slotSummary: 'Member Slot Summary',
    scheduledAllocations: 'Scheduled Allocations',
    routingSchedule: 'Payment Routing Schedule',
    cashHandoverLabel: 'Cash Custody Handover',
    reconciliationLabel: 'Account Reconciliation',
    reconciledAsOf: 'Reconciled as of',
    incidentModeActive: 'EMERGENCY READ-ONLY INCIDENT MODE ACTIVE',
    incidentModeNotice: 'Financial modifications are temporarily restricted by platform administrators.',
    platformConsole: 'Platform Operations Console',
    
    // Collection arrangements (Section 3)
    centralCollection: 'Central Group Collection',
    centralCollectionDesc: 'Members pay an authorised treasurer or designated group account. Receipts are verified before central payout is recorded.',
    directBeneficiaryCollection: 'Direct Beneficiary Collection',
    directBeneficiaryCollectionDesc: 'Members pay that round’s beneficiary directly. The beneficiary receives temporary receiving authority to confirm receipts.',
    collectionArrangementLabel: 'Collection Arrangement',
    
    // Beneficiary offset (Section 8)
    beneficiaryOffsetLabel: 'Beneficiary Contribution Offset',
    beneficiaryOffsetExplanation: 'In direct collection, the round beneficiary satisfies their own obligation through an agreed offset rather than transferring money to themselves. Offsets do not represent cash received and do not enter the cash ledger.',
    nominalEntitlement: 'Nominal Entitlement',
    expectedExternalReceipts: 'Expected External Receipts',
    confirmedExternalReceipts: 'Confirmed External Receipts',
    outstandingExternalReceipts: 'Outstanding External Receipts',

    // Statuses (Section 7)
    unpaid: 'Unpaid',
    partial: 'Partially Satisfied',
    pending: 'Awaiting Verification',
    clarificationNeeded: 'Clarification Needed',
    paid: 'Fully Satisfied',
    overdue: 'Overdue',
    withdrawn: 'Withdrawn',
    reversed: 'Reversed via Correction',
    
    // Central Payout statuses (Section 10)
    payoutScheduled: 'Scheduled',
    payoutProposed: 'Proposed',
    payoutApproved: 'Independently Approved',
    payoutRecorded: 'External Transfer Recorded',
    payoutAcknowledged: 'Receipt Acknowledged',
    payoutDisputed: 'Disputed by Beneficiary',
    
    // Navigation
    navHome: 'Home',
    navContributions: 'Contributions',
    navPayouts: 'Payouts',
    navMembers: 'Members',
    navMore: 'More',
    navLedger: 'Group Ledger',
    navDisputes: 'Disputes & Reviews',
    navAnnouncements: 'Announcements',
    navSettings: 'Rules & Settings',
    navReports: 'Export Reports',
    
    // Dashboard & Metrics (Accurate labels per Section 1)
    currentRound: 'Current Round',
    deadline: 'Payment Deadline',
    contributionDue: 'Contribution Obligation Due',
    expectedPot: 'Expected Pot',
    confirmedCollected: 'Confirmed Money Received',
    submittedPending: 'Awaiting Verification',
    outstandingAmount: 'Outstanding Contributions',
    currentBeneficiary: 'This Round Beneficiary',
    yourPayoutDate: 'Your Scheduled Turn Date',
    yourPaymentStatus: 'Your Declaration Status',
    recentActivity: 'Recent Group Audit Records',
    quickActions: 'Operational Controls',
    submitPaymentBtn: 'Submit Payment Details',
    verifyPaymentsBtn: 'Confirm Money Received',
    recordPayoutBtn: 'Record Central Payout',
    acknowledgeReceiptBtn: 'Confirm Beneficiary Receipt',
    
    // Actions & Notices
    privacyNotice: 'Private attachments and references are restricted to the relevant payer, receiving officer, and authorised reviewer.',
    whatsappShare: 'Share Reminder via WhatsApp',
    whatsappDisclaimer: 'Note: Opens your WhatsApp app with pre-filled text. Njangi Together does not send messages automatically.',
    demoBanner: 'Simulated Demo Sandbox: Isolated test environment with fictional Cameroonian personas. Real accounts are strictly segregated.',
    resetDemo: 'Reset Demo Data',
    
    // Frequency
    daily: 'Daily',
    weekly: 'Weekly',
    fortnightly: 'Every 2 Weeks',
    monthly: 'Monthly',
    custom: 'Custom Cadence',
    customDays: 'Every {days} Days',
    copyInviteLink: 'Copy Invite Link',
    linkCopied: 'Invite Link Copied!',
    joinNjangi: 'Join Njangi',
    grantAdmin: 'Grant Admin Rights',
    revokeAdmin: 'Revoke Admin',
    
    // Payment methods
    mtn_momo: 'MTN Mobile Money',
    orange_money: 'Orange Money',
    cash: 'Cash in Hand',
    bank_transfer: 'Bank Transfer',
    
    // Forms
    amountLabel: 'Amount Paid (Whole number FCFA)',
    dateLabel: 'Actual Payment Date',
    methodLabel: 'Payment Method',
    refLabel: 'Transaction Reference (TxID / SMS code)',
    refUnavailableLabel: 'Reference Unavailable Explanation',
    refUnavailablePlaceholder: 'State why electronic reference is missing (e.g. cash handed in person, USSD error)',
    refPlaceholder: 'e.g. CI261017.1234 or MOMO-98213',
    proofLabel: 'Supporting Evidence / Screenshot (Optional)',
    submitBtn: 'Record Payment Details',
    cancelBtn: 'Cancel',
    approveBtn: 'Confirm Money Received',
    rejectBtn: 'Reject with Recorded Reason',
    requestClarificationBtn: 'Request Clarification',
    reasonPrompt: 'Please record why this submission cannot be confirmed (required for accountability):',
    duplicateRefWarning: 'Duplicate warning: This transaction reference matches an existing record for this provider/account.',
    
    // Payout details
    actualAmountPaid: 'Actual Amount Transferred',
    shortfall: 'Pot Shortfall',
    acknowledgeConfirm: 'I confirm that I have personally received this payout in full via the specified payment channel.',
    
    // Groups
    myGroups: 'My Njangi Groups',
    createNewGroup: 'Create New Njangi Group',
    joinGroup: 'Join via Group Code',
    activeCycle: 'Active Cycle',
    cycleLockedNotice: 'Collection arrangement, membership and contribution amount are locked during the active cycle for record integrity.',
    
    // Ledger & Balance (Section 1)
    recordedBalance: 'Recorded Balance',
    reconciledBalanceDate: 'Reconciliation Date',
    openingBalance: 'Opening Balance',
    closingBalance: 'Recorded Closing Balance',
    totalInflows: 'Confirmed Inflows',
    totalOutflows: 'Recorded Outflows',
    finesAssessed: 'Fines Assessed (Pending)',
    finesCollected: 'Fines Collected (Separate Fund)',
    adjustments: 'Controlled Corrections & Reversals',
    exportCsv: 'Download Audited CSV',
    printStatement: 'Print Record Statement',

    // KYC & Government ID (MVP Policy Section 12)
    registerBtn: 'Create Account',
    govIdNotice: 'Identity Verification Notice: Real government ID document upload is deferred in this MVP pending certified encrypted storage and regulatory review. Accounts use declared legal name and verified phone number.',
  },
  fr: {
    appName: 'Njangi Ensemble',
    tagline: 'Tenue de Registres et Tontines Rotatives au Cameroun',
    switchLang: 'Switch to English',
    currentLangLabel: 'FR',
    
    // Non-custodial disclaimer (Section 1)
    nonCustodialDisclaimer: 'Njangi Ensemble est un outil administratif de tenue de registres. L’argent circule hors de l’application via MTN Mobile Money, Orange Money, Espèces ou Virement. L’application enregistre les déclarations, confirmations, répartitions, litiges et rapprochements. Elle ne transfère ni ne garantit de fonds.',
    pinWarningNotice: 'Avis de sécurité : Ne saisissez jamais vos codes secrets Mobile Money, mots de passe bancaires ou codes OTP. Veuillez masquer les informations sensibles sur vos captures d’écran.',
    
    // Roles (Section 2)
    admin: 'Administrateur du groupe',
    treasurer: 'Trésorier',
    member: 'Membre',
    reviewer: 'Vérificateur Indépendant',
    adminAndTreasurer: 'Admin & Trésorier',

    // Slots & Multi-beneficiary (Sections 5 & 6)
    slotsLabel: 'Parts de Participation',
    slotOwner: 'Titulaire de la part',
    slotSummary: 'Synthèse des parts du membre',
    scheduledAllocations: 'Attributions programmées',
    routingSchedule: 'Plan de routage des paiements directs',
    cashHandoverLabel: 'Passation de caisse (Espèces)',
    reconciliationLabel: 'Rapprochement des comptes',
    reconciledAsOf: 'Rapproché au',
    incidentModeActive: 'MODE INCIDENT LECTURE SEULE ACTIF',
    incidentModeNotice: 'Les modifications financières sont temporairement restreintes par la plateforme.',
    platformConsole: 'Console d’Exploitation Plateforme',
    
    // Collection arrangements (Section 3)
    centralCollection: 'Collecte Centrale de Groupe',
    centralCollectionDesc: 'Les membres paient un trésorier agréé ou un compte de groupe. Les réceptions sont confirmées avant l’enregistrement du versement au bénéficiaire.',
    directBeneficiaryCollection: 'Collecte Directe au Bénéficiaire',
    directBeneficiaryCollectionDesc: 'Les membres paient directement le bénéficiaire du tour. Le bénéficiaire reçoit l’autorité temporaire pour confirmer les réceptions.',
    collectionArrangementLabel: 'Mode de Collecte',
    
    // Beneficiary offset (Section 8)
    beneficiaryOffsetLabel: 'Compensation de Cotisation du Bénéficiaire',
    beneficiaryOffsetExplanation: 'En collecte directe, la cotisation du bénéficiaire est satisfaite par compensation convenue. Une compensation n’est pas de l’argent liquide et n’augmente pas le solde de caisse.',
    nominalEntitlement: 'Droit Nominal Total',
    expectedExternalReceipts: 'Recettes Externes Attendues',
    confirmedExternalReceipts: 'Recettes Confirmées Reçues',
    outstandingExternalReceipts: 'Reste Externe à Percevoir',

    // Statuses (Section 7)
    unpaid: 'Non payé',
    partial: 'Partiellement satisfait',
    pending: 'En attente de vérification',
    clarificationNeeded: 'Clarification demandée',
    paid: 'Entièrement satisfait',
    overdue: 'En retard',
    withdrawn: 'Retiré par l’émetteur',
    reversed: 'Annulé par correction contrôlée',
    
    // Central Payout statuses (Section 10)
    payoutScheduled: 'Programmé',
    payoutProposed: 'Proposé',
    payoutApproved: 'Approuvé de façon indépendante',
    payoutRecorded: 'Virement externe enregistré',
    payoutAcknowledged: 'Réception confirmée par le bénéficiaire',
    payoutDisputed: 'Contesté par le bénéficiaire',
    
    // Navigation
    navHome: 'Accueil',
    navContributions: 'Cotisations',
    navPayouts: 'Versements',
    navMembers: 'Membres',
    navMore: 'Plus',
    navLedger: 'Grand Livre',
    navDisputes: 'Litiges & Rapprochements',
    navAnnouncements: 'Annonces',
    navSettings: 'Règles & Paramètres',
    navReports: 'Rapports & Exports',
    
    // Dashboard & Metrics (Section 1)
    currentRound: 'Tour en cours',
    deadline: 'Date limite de paiement',
    contributionDue: 'Obligation de cotisation',
    expectedPot: 'Cagnotte attendue',
    confirmedCollected: 'Argent confirmé reçu',
    submittedPending: 'En attente de vérification',
    outstandingAmount: 'Cotisations en souffrance',
    currentBeneficiary: 'Bénéficiaire du tour',
    yourPayoutDate: 'Date programmée de votre tour',
    yourPaymentStatus: 'Statut de votre déclaration',
    recentActivity: 'Derniers enregistrements d’audit',
    quickActions: 'Contrôles opérationnels',
    submitPaymentBtn: 'Soumettre les détails du paiement',
    verifyPaymentsBtn: 'Confirmer l’argent reçu',
    recordPayoutBtn: 'Enregistrer le versement central',
    acknowledgeReceiptBtn: 'Confirmer la réception de mon gain',
    
    // Actions & Notices
    privacyNotice: 'Les pièces justificatives et références sont strictement réservées au payeur, au receveur et au vérificateur agréé.',
    whatsappShare: 'Partager le rappel via WhatsApp',
    whatsappDisclaimer: 'Note : Ouvre votre application WhatsApp avec le message pré-rempli. Aucun message n’est envoyé automatiquement.',
    demoBanner: 'Bac à sable de démonstration : Environnement de test isolé avec profils camerounais fictifs. Les vrais comptes sont séparés.',
    resetDemo: 'Réinitialiser les données démo',
    
    // Frequency
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    fortnightly: 'Toutes les 2 semaines',
    monthly: 'Mensuel',
    custom: 'Cadence personnalisée',
    customDays: 'Tous les {days} jours',
    copyInviteLink: 'Copier le lien d’invitation',
    linkCopied: 'Lien d’invitation copié !',
    joinNjangi: 'Rejoindre le Njangi',
    grantAdmin: 'Accorder les droits Admin',
    revokeAdmin: 'Retirer les droits Admin',
    
    // Payment methods
    mtn_momo: 'MTN Mobile Money',
    orange_money: 'Orange Money',
    cash: 'Espèces (Remis en main propre)',
    bank_transfer: 'Virement bancaire',
    
    // Forms
    amountLabel: 'Montant versé (FCFA entier)',
    dateLabel: 'Date effective du paiement',
    methodLabel: 'Moyen de paiement',
    refLabel: 'Référence de transaction (Code SMS / TxID)',
    refUnavailableLabel: 'Explication si référence absente',
    refUnavailablePlaceholder: 'Expliquer pourquoi la référence électronique manque (ex: espèces en réunion)',
    refPlaceholder: 'ex: CI261017.1234 ou MOMO-98213',
    proofLabel: 'Preuve ou capture (Optionnel)',
    submitBtn: 'Enregistrer la déclaration de paiement',
    cancelBtn: 'Annuler',
    approveBtn: 'Confirmer l’argent reçu',
    rejectBtn: 'Rejeter avec motif enregistré',
    requestClarificationBtn: 'Demander une clarification',
    reasonPrompt: 'Veuillez consigner le motif (obligatoire pour la transparence) :',
    duplicateRefWarning: 'Alerte doublon : Cette référence correspond à un enregistrement existant pour cet opérateur/compte.',
    
    // Payout details
    actualAmountPaid: 'Montant effectif transféré',
    shortfall: 'Déficit sur la cagnotte',
    acknowledgeConfirm: 'Je certifie avoir personnellement reçu l’intégralité de ce versement par le moyen indiqué.',
    
    // Groups
    myGroups: 'Mes Groupes Njangi',
    createNewGroup: 'Créer un nouveau Njangi',
    joinGroup: 'Rejoindre via code',
    activeCycle: 'Cycle en cours',
    cycleLockedNotice: 'Le mode de collecte, la liste des membres et le montant de cotisation sont verrouillés pendant le cycle actif.',
    
    // Ledger & Balance (Section 1)
    recordedBalance: 'Solde Enregistré',
    reconciledBalanceDate: 'Date de Rapprochement',
    openingBalance: 'Solde initial',
    closingBalance: 'Solde enregistré de clôture',
    totalInflows: 'Entrées confirmées reçues',
    totalOutflows: 'Sorties enregistrées payées',
    finesAssessed: 'Amendes prononcées (En attente)',
    finesCollected: 'Amendes collectées (Caisse séparée)',
    adjustments: 'Corrections & Annulations contrôlées',
    exportCsv: 'Télécharger CSV audité',
    printStatement: 'Imprimer relevé certifié',

    // KYC & Government ID (MVP Policy Section 12)
    registerBtn: 'Créer un compte',
    govIdNotice: 'Avis d’identification : Le téléversement de pièces d’identité officielles est suspendu pour ce MVP dans l’attente de protocoles de stockage certifiés. Les comptes utilisent l’état civil déclaré et le numéro de téléphone vérifié.',
  },
};
