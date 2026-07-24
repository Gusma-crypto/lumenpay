"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Copy,
  ExternalLink,
  Filter,
  Github,
  Headphones,
  Info,
  Moon,
  Monitor,
  RefreshCw,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { PaymentForm } from "@/components/PaymentForm";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletPanel } from "@/components/WalletPanel";
import { getTestnetExplorerUrl, shortenPublicKey } from "@/lib/explorer";
import {
  connectWallet as connectSelectedWallet,
  disconnectWallet as disconnectActiveWallet,
  getWalletErrorMessage,
  getWalletNetwork,
  listWallets,
  restoreWallet,
  signWithWallet,
  WalletOption
} from "@/lib/wallets";
import {
  buildRecordPaymentTransaction,
  CONTRACT_CONFIGURED,
  ContractCallStatus,
  ContractPaymentEvent,
  fetchPaymentEvents,
  submitContractTransaction,
  TRACKER_CONTRACT_ID
} from "@/lib/contract";
import {
  buildXlmPaymentTransaction,
  ESTIMATED_FEE_XLM,
  fetchAccountBalances,
  fetchPaymentHistory,
  getStellarErrorMessage,
  NETWORK_PASSPHRASE,
  PaymentHistoryItem,
  submitSignedTransaction
} from "@/lib/stellar";
import { validateAmount, validateRecipientAddress } from "@/lib/validation";

type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

type TransactionStatusType = "idle" | "signing" | "submitting" | "success" | "error";

export type TransactionResult = {
  status: TransactionStatusType;
  hash?: string;
  message?: string;
};

type PendingPayment = {
  amount: string;
  memo: string;
  recipient: string;
};

type CompletedPayment = PendingPayment & {
  hash: string;
};

type AppNotification = {
  id: number;
  type: "form" | "success" | "warning";
  title: string;
  message: string;
};

const STORED_WALLET_KEY = "lumenpay.connectedWallet";
const STORED_SIDEBAR_KEY = "lumenpay.sidebarCollapsed";

type StoredWalletSession = {
  address: string;
  walletId: string;
  walletName: string;
};

const FALLBACK_WALLETS: WalletOption[] = [
  { id: "freighter", name: "Freighter", icon: "https://stellar.creit.tech/wallet-icons/freighter.png", url: "https://freighter.app", isAvailable: false },
  { id: "xbull", name: "xBull Wallet", icon: "https://stellar.creit.tech/wallet-icons/xbull.png", url: "https://xbull.app", isAvailable: false },
  { id: "albedo", name: "Albedo", icon: "https://stellar.creit.tech/wallet-icons/albedo.png", url: "https://albedo.link", isAvailable: true },
  { id: "rabet", name: "Rabet", icon: "https://stellar.creit.tech/wallet-icons/rabet.png", url: "https://rabet.io", isAvailable: false }
];

function NotificationPopup(props: { notification: AppNotification; onClose: () => void }) {
  const Icon =
    props.notification.type === "success"
      ? CheckCircle2
      : props.notification.type === "warning"
        ? AlertTriangle
        : ClipboardCheck;

  return (
    <div className={`notification-popup animate-fade-in ${props.notification.type}`}>
      <div className="flex items-start gap-3">
        <div className="notification-icon">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="notification-title">{props.notification.title}</p>
          <p className="notification-message">{props.notification.message}</p>
        </div>
        <button
          className="notification-close"
          type="button"
          onClick={props.onClose}
          aria-label="Close notification"
          title="Close notification"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("disconnected");
  const [walletError, setWalletError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [_assets, setAssets] = useState<unknown[]>([]);
  const [_isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [_balanceError, setBalanceError] = useState<string | null>(null);
  const [transactionResult, setTransactionResult] = useState<TransactionResult>({ status: "idle" });
  const [freighterNetwork, setFreighterNetwork] = useState<string | null>(null);
  const [freighterNetworkPassphrase, setFreighterNetworkPassphrase] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [completedPayment, setCompletedPayment] = useState<CompletedPayment | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [recipientSuggestion, setRecipientSuggestion] = useState<string | null>(null);
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [wallets, setWallets] = useState<WalletOption[]>(FALLBACK_WALLETS);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [connectedWalletId, setConnectedWalletId] = useState<string | null>(null);
  const [contractEvents, setContractEvents] = useState<ContractPaymentEvent[]>([]);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractCallStatus>("idle");
  const [_contractHash, setContractHash] = useState<string | null>(null);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [paymentFormResetSignal, setPaymentFormResetSignal] = useState(0);
  const [activityQuery, setActivityQuery] = useState("");
  const [autoCopyTransactionLink, setAutoCopyTransactionLink] = useState(true);
  const [autoRecordContract, setAutoRecordContract] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [confirmTransactions, setConfirmTransactions] = useState(true);
  const knownPaymentIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedPaymentHistoryRef = useRef(false);

  const isConnected = walletStatus === "connected" && Boolean(publicKey);
  const isSubmitting = transactionResult.status === "signing" || transactionResult.status === "submitting";
  const isFreighterTestnet = freighterNetworkPassphrase === NETWORK_PASSPHRASE;
  const isSendPaymentPage = activeSection === "send-payment";
  const isActivityPage = activeSection === "activity";
  const isWalletPage = activeSection === "wallets";
  const isContractPage = activeSection === "contracts";
  const isSettingsPage = activeSection === "settings";
  const isAboutPage = activeSection === "about";
  const contractExplorerUrl = `https://stellar.expert/explorer/testnet/contract/${TRACKER_CONTRACT_ID}`;
  const displayedContractId = TRACKER_CONTRACT_ID || "Contract not configured";
  const previewPayment = pendingPayment ?? completedPayment;
  const paymentStepIndex =
    transactionResult.status === "success"
      ? 4
      : isSubmitting
        ? 3
        : pendingPayment
          ? 2
          : 1;
  const activityRows = [
    ...paymentHistory.map((item) => ({
      id: `payment-${item.id}`,
      type: item.direction === "sent" ? "PaymentSent" : "PaymentReceived",
      description: item.direction === "sent" ? "XLM payment sent" : "XLM payment received",
      status: "SUCCESS",
      tone: "success",
      amount: `${Number(item.amount).toFixed(2)} ${item.asset}`,
      from: item.from,
      to: item.to,
      ledger: item.id,
      hash: item.hash,
      time: new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt)),
      icon: Send
    })),
    ...contractEvents.map((event) => ({
      id: `contract-${event.id}`,
      type: "PaymentRecorded",
      description: "Payment recorded on contract",
      status: "SUCCESS",
      tone: "success",
      amount: `${Number(event.amount).toFixed(2)} XLM`,
      from: event.sender,
      to: event.recipient,
      ledger: String(event.ledger),
      hash: event.contractHash,
      time: `Ledger ${event.ledger}`,
      icon: Box
    }))
  ].slice(0, 12);
  const latestPaymentActivity = activityRows.find((row) => row.type === "PaymentSent" || row.type === "PaymentReceived");
  const latestContractActivity = activityRows.find((row) => row.type === "PaymentRecorded");
  const mobileActivityRows = activityRows.slice(0, 4);
  const normalizedActivityQuery = activityQuery.trim().toLowerCase();
  const filteredActivityRows = normalizedActivityQuery
    ? activityRows.filter((row) =>
        [row.type, row.description, row.status, row.amount, row.from, row.to, row.hash, row.ledger]
          .join(" ")
          .toLowerCase()
          .includes(normalizedActivityQuery)
      )
    : activityRows;
  const activityPendingCount = contractStatus === "pending" || isSubmitting ? 1 : 0;
  const activityFailedCount = contractStatus === "failed" || transactionResult.status === "error" ? 1 : 0;

  function showNotification(type: AppNotification["type"], title: string, message: string) {
    setNotification({
      id: Date.now(),
      type,
      title,
      message
    });
  }

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeout = window.setTimeout(() => setNotification(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  useEffect(() => {
    setIsSidebarCollapsed(window.localStorage.getItem(STORED_SIDEBAR_KEY) === "true");
  }, []);

  function toggleSidebarCollapsed() {
    setIsSidebarCollapsed((current) => {
      const nextValue = !current;
      window.localStorage.setItem(STORED_SIDEBAR_KEY, String(nextValue));
      return nextValue;
    });
  }

  const refreshBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance(null);
      setAssets([]);
      setBalanceError(null);
      setIsBalanceLoading(false);
      return;
    }

    setIsBalanceLoading(true);
    setBalanceError(null);

    try {
      const accountBalances = await fetchAccountBalances(publicKey);
      setBalance(accountBalances.xlm);
      setAssets(accountBalances.assets);
    } catch (error) {
      setBalance(null);
      setAssets([]);
      setBalanceError(error instanceof Error ? error.message : "Failed to fetch XLM balance.");
    } finally {
      setIsBalanceLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const refreshPaymentHistory = useCallback(async (options?: { notifyNew?: boolean }) => {
    if (!publicKey) {
      setPaymentHistory([]);
      setHistoryError(null);
      setIsHistoryLoading(false);
      knownPaymentIdsRef.current = new Set();
      hasLoadedPaymentHistoryRef.current = false;
      return;
    }

    setIsHistoryLoading(true);
    setHistoryError(null);

    try {
      const history = await fetchPaymentHistory(publicKey);
      setPaymentHistory(history);

      const knownPaymentIds = knownPaymentIdsRef.current;
      const newPayments = history.filter((item) => !knownPaymentIds.has(item.id));
      history.forEach((item) => knownPaymentIds.add(item.id));

      if (!hasLoadedPaymentHistoryRef.current) {
        hasLoadedPaymentHistoryRef.current = true;
        return;
      }

      if (options?.notifyNew && newPayments.length > 0) {
        const latestPayment = newPayments[0];
        const isReceived = latestPayment.direction === "received";
        const title = newPayments.length > 1
          ? `${newPayments.length} New Transfers`
          : isReceived
            ? "Incoming Transfer"
            : "Transfer Sent";
        const counterparty = isReceived ? latestPayment.from : latestPayment.to;
        const message = newPayments.length > 1
          ? `${newPayments.length} transaksi baru terdeteksi di Stellar Testnet.`
          : `${Number(latestPayment.amount).toFixed(7)} ${latestPayment.asset} ${isReceived ? "diterima dari" : "dikirim ke"} ${shortenPublicKey(counterparty)}.`;

        showNotification(isReceived ? "success" : "form", title, message);
        void refreshBalance();
      }
    } catch (error) {
      setPaymentHistory([]);
      setHistoryError(error instanceof Error ? error.message : "Failed to fetch transaction history.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [publicKey, refreshBalance]);

  useEffect(() => {
    void refreshPaymentHistory();
  }, [refreshPaymentHistory]);

  useEffect(() => {
    if (!publicKey || walletStatus !== "connected") {
      return;
    }

    const interval = window.setInterval(() => {
      void refreshPaymentHistory({ notifyNew: true });
    }, 12_000);

    return () => window.clearInterval(interval);
  }, [publicKey, walletStatus, refreshPaymentHistory]);

  useEffect(() => {
    void listWallets().then((options) => setWallets(options.length > 0 ? options : FALLBACK_WALLETS)).catch(() => setWallets(FALLBACK_WALLETS));
  }, []);

  useEffect(() => {
    const rawSession = window.localStorage.getItem(STORED_WALLET_KEY);
    if (!rawSession) {
      return;
    }

    let storedSession: StoredWalletSession;
    try {
      storedSession = JSON.parse(rawSession) as StoredWalletSession;
    } catch {
      window.localStorage.removeItem(STORED_WALLET_KEY);
      return;
    }

    if (!storedSession.address || !storedSession.walletId) {
      window.localStorage.removeItem(STORED_WALLET_KEY);
      return;
    }

    setPublicKey(storedSession.address);
    setWalletName(storedSession.walletName);
    setConnectedWalletId(storedSession.walletId);
    setWalletStatus("connected");

    void restoreWallet(storedSession.walletId)
      .then((connection) => {
        setWalletName(connection.walletName);
        setFreighterNetwork(connection.network.network);
        setFreighterNetworkPassphrase(connection.network.networkPassphrase);
        setWalletStatus("connected");
      })
      .catch((error) => {
        const message = getWalletErrorMessage(error);
        setWalletStatus("error");
        setWalletError(message);
        showNotification("warning", "Session Wallet Tidak Aktif", message);
      });
  }, []);

  const refreshContractEvents = useCallback(async () => {
    if (!CONTRACT_CONFIGURED) {
      setContractEvents([]);
      setContractStatus("skipped");
      return;
    }

    setIsContractLoading(true);
    try {
      setContractEvents(await fetchPaymentEvents());
      setContractError(null);
    } catch (error) {
      setContractError(error instanceof Error ? error.message : "Unable to synchronize contract events.");
    } finally {
      setIsContractLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshContractEvents();
    const interval = window.setInterval(() => void refreshContractEvents(), 6_000);
    return () => window.clearInterval(interval);
  }, [refreshContractEvents]);

  async function connectWallet(walletId?: string) {
    if (!walletId) {
      setIsWalletModalOpen(true);
      return;
    }

    const requestedWallet = wallets.find((wallet) => wallet.id === walletId);
    if (requestedWallet && !requestedWallet.isAvailable) {
      const message = `${requestedWallet.name} tidak terdeteksi di browser ini. Install atau buka wallet tersebut, lalu refresh halaman sebelum connect.`;
      setWalletStatus(publicKey ? "connected" : "disconnected");
      setWalletError(message);
      showNotification("warning", "Wallet Tidak Terdeteksi", message);
      return;
    }

    setWalletStatus("connecting");
    setWalletError(null);

    try {
      const connection = await connectSelectedWallet(walletId);

      setPublicKey(connection.address);
      setWalletName(connection.walletName);
      setConnectedWalletId(connection.walletId);
      setFreighterNetwork(connection.network.network);
      setFreighterNetworkPassphrase(connection.network.networkPassphrase);
      setWalletStatus("connected");
      setIsWalletModalOpen(false);
      window.localStorage.setItem(
        STORED_WALLET_KEY,
        JSON.stringify({
          address: connection.address,
          walletId: connection.walletId,
          walletName: connection.walletName
        } satisfies StoredWalletSession)
      );
      showNotification("success", "Wallet Connected", `${connection.walletName} berhasil terkoneksi ke Stellar Testnet.`);
    } catch (error) {
      const message = getWalletErrorMessage(error);
      setPublicKey(null);
      setWalletName(null);
      setConnectedWalletId(null);
      window.localStorage.removeItem(STORED_WALLET_KEY);
      setFreighterNetwork(null);
      setFreighterNetworkPassphrase(null);
      setWalletStatus("error");
      setWalletError(message);
      showNotification("warning", "Gagal Connect Wallet", message);
    }
  }

  async function disconnectWallet() {
    await disconnectActiveWallet().catch(() => undefined);
    window.localStorage.removeItem(STORED_WALLET_KEY);
    setPublicKey(null);
    setWalletName(null);
    setConnectedWalletId(null);
    setFreighterNetwork(null);
    setFreighterNetworkPassphrase(null);
    setWalletStatus("disconnected");
    setWalletError(null);
    setTransactionResult({ status: "idle" });
    setPendingPayment(null);
    setCompletedPayment(null);
    setPaymentHistory([]);
    knownPaymentIdsRef.current = new Set();
    hasLoadedPaymentHistoryRef.current = false;
    setHistoryError(null);
    setRecipientSuggestion(null);
    setContractHash(null);
    setContractError(null);
    setContractEvents([]);
    setContractStatus(CONTRACT_CONFIGURED ? "idle" : "skipped");
  }

  async function refreshFreighterNetwork() {
    try {
      const networkDetails = await getWalletNetwork();
      setFreighterNetwork(networkDetails.network);
      setFreighterNetworkPassphrase(networkDetails.networkPassphrase);

      if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
        setTransactionResult({ status: "error", message: "Switch the connected wallet to Testnet." });
        return;
      }

      setTransactionResult({ status: "idle" });
    } catch (error) {
      setTransactionResult({
        status: "error",
        message: getWalletErrorMessage(error)
      });
    }
  }

  async function reviewPayment(destinationPublicKey: string, amount: string, memo: string) {
    if (!publicKey) {
      setTransactionResult({ status: "error", message: "Connect a Stellar wallet first." });
      return;
    }

    const networkDetails = await getWalletNetwork();
    setFreighterNetwork(networkDetails.network);
    setFreighterNetworkPassphrase(networkDetails.networkPassphrase);

    if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
      setTransactionResult({
        status: "error",
        message: "Switch the connected wallet to Testnet."
      });
      return;
    }

    const recipientError = validateRecipientAddress(destinationPublicKey);
    if (recipientError) {
      setTransactionResult({ status: "error", message: recipientError });
      return;
    }

    if (destinationPublicKey.trim().toUpperCase() === publicKey.trim().toUpperCase()) {
      setTransactionResult({ status: "error", message: "You cannot send XLM to your own wallet address." });
      return;
    }

    const amountError = validateAmount(amount, balance);
    if (amountError) {
      setTransactionResult({ status: "error", message: amountError });
      return;
    }

    if (new TextEncoder().encode(memo.trim()).length > 28) {
      setTransactionResult({ status: "error", message: "Memo can use up to 28 bytes." });
      return;
    }

    setPendingPayment({ recipient: destinationPublicKey.trim(), amount: amount.trim(), memo: memo.trim() });
    showNotification("form", "Form Pembayaran Siap", "Detail pembayaran sudah valid. Review transaksi sebelum menandatangani.");
  }

  async function sendPayment(destinationPublicKey: string, amount: string, memo: string) {
    if (!publicKey) {
      setTransactionResult({ status: "error", message: "Connect a Stellar wallet first." });
      return;
    }

    const networkDetails = await getWalletNetwork();
    setFreighterNetwork(networkDetails.network);
    setFreighterNetworkPassphrase(networkDetails.networkPassphrase);

    if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
      setTransactionResult({ status: "error", message: "Switch the connected wallet to Testnet." });
      return;
    }

    if (destinationPublicKey.trim().toUpperCase() === publicKey.trim().toUpperCase()) {
      setTransactionResult({ status: "error", message: "You cannot send XLM to your own wallet address." });
      return;
    }

    try {
      setTransactionResult({ status: "signing", message: `Waiting for ${walletName ?? "wallet"} approval...` });

      const transaction = await buildXlmPaymentTransaction({
        sourcePublicKey: publicKey,
        destinationPublicKey,
        amount,
        memo
      });

      const signedXdr = await signWithWallet(transaction.toXDR(), publicKey);

      setTransactionResult({ status: "submitting", message: "Submitting transaction to Stellar Testnet..." });

      const response = await submitSignedTransaction(signedXdr);

      setTransactionResult({
        status: "success",
        hash: response.hash,
        message: "Payment sent successfully on Stellar Testnet."
      });
      setCompletedPayment({
        amount,
        hash: response.hash,
        memo,
        recipient: destinationPublicKey
      });
      setPaymentFormResetSignal((currentSignal) => currentSignal + 1);
      showNotification("success", "Transaction Successful", "Payment berhasil dikirim ke Stellar Testnet.");

      await refreshBalance();
      await refreshPaymentHistory();

      if (CONTRACT_CONFIGURED) {
        try {
          setContractStatus("pending");
          setContractError(null);
          const contractTransaction = await buildRecordPaymentTransaction({
            source: publicKey,
            recipient: destinationPublicKey,
            amount,
            paymentHash: response.hash
          });
          const signedContractXdr = await signWithWallet(contractTransaction.toXDR(), publicKey);
          const contractResponse = await submitContractTransaction(signedContractXdr);
          setContractHash(contractResponse.hash);
          setContractStatus("success");
          await refreshContractEvents();
        } catch (contractCallError) {
          setContractStatus("failed");
          setContractError(getWalletErrorMessage(contractCallError));
        }
      } else {
        setContractStatus("skipped");
      }
    } catch (error) {
      setTransactionResult({
        status: "error",
        message: getStellarErrorMessage(error, getWalletErrorMessage(error))
      });
    }
  }

  function navigateTo(section: string) {
    setActiveSection(section);
    setIsWalletModalOpen(false);

    if (["send-payment", "activity", "wallets", "contracts", "settings", "about"].includes(section)) {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      return;
    }

    const targetId =
      section === "send-payment"
        ? "send-payment"
        : section === "activity"
          ? "activity"
          : section === "wallets"
            ? "wallets"
            : section === "contracts"
              ? "contracts"
              : section === "about"
                ? "about"
                : "dashboard";
    window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <main className={`app-shell yellow-belt-shell ${isSendPaymentPage ? "send-mobile-mode" : ""} ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`} data-theme={theme}>
      {notification ? <NotificationPopup notification={notification} onClose={() => setNotification(null)} /> : null}

      <AppSidebar
        activeSection={activeSection}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapsed={toggleSidebarCollapsed}
        onNavigate={navigateTo}
        publicKey={publicKey}
        walletName={walletName}
      />
      <AppHeader
        theme={theme}
        publicKey={publicKey}
        walletStatus={walletStatus}
        onConnect={() => void connectWallet()}
        onDisconnect={disconnectWallet}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
        onMenuOpen={() => setIsSidebarOpen(true)}
        onNotifications={() =>
          showNotification(
            "form",
            "Activity Summary",
            `${paymentHistory.length} payments and ${contractEvents.length} contract events synchronized.`
          )
        }
      />

      <div className={`dashboard-content ${isSendPaymentPage || isActivityPage || isWalletPage || isContractPage || isSettingsPage ? "send-only-content" : ""}`}>
        {isSendPaymentPage ? (
          <section className="send-page" id="send-payment">
            <div className="send-mobile-header">
              <button type="button" onClick={() => navigateTo("dashboard")} aria-label="Back to dashboard">←</button>
              <h1>Send Payment</h1>
              <span><i /> Testnet</span>
            </div>

            <div className="send-page-heading">
              <div className="breadcrumb-row">
                <span>⌂</span>
                <span>/</span>
                <strong>Send Payment</strong>
              </div>
              <h1>Send Payment</h1>
              <p>Send XLM to any Stellar address and record it on-chain via LumenPay Tracker.</p>
            </div>

            <div className="send-steps" aria-label="Payment progress">
              {[
                { step: 1, label: "Input" },
                { step: 2, label: "Review" },
                { step: 3, label: "Sign & Send" },
                { step: 4, label: "Complete" }
              ].map((item) => (
                <div
                  className={
                    item.step === paymentStepIndex
                      ? `active${item.step === 4 ? " final-active" : ""}`
                      : item.step < paymentStepIndex
                        ? "complete"
                        : ""
                  }
                  key={item.step}
                >
                  <span>{item.step}</span>
                  <strong>{item.label}</strong>
                </div>
              ))}
            </div>

            <div className="send-layout">
              <PaymentForm
                isConnected={isConnected}
	                isSubmitting={isSubmitting}
	                balance={balance}
	                publicKey={publicKey}
	                onSendPayment={reviewPayment}
	                onEdit={() => {
	                  setTransactionResult({ status: "idle" });
	                  setCompletedPayment(null);
	                }}
	                recipientSuggestion={recipientSuggestion}
	                resetSignal={paymentFormResetSignal}
	              />

              <aside className="send-side">
                <section className="transaction-preview-card">
                  <div className="preview-heading">
                    <div className="send-card-icon">
                      <Send size={23} aria-hidden="true" />
                    </div>
                    <div>
                      <h2>Transaction Preview</h2>
                      <p>Please review your payment details before signing.</p>
                    </div>
                    <span>Stellar Testnet</span>
                  </div>

	                  <div className="preview-box">
	                    <div>
	                      <span>From</span>
	                      <strong>{publicKey ? shortenPublicKey(publicKey) : "Connect wallet"}</strong>
	                    </div>
	                    <div>
	                      <span>To</span>
	                      <strong>{previewPayment ? shortenPublicKey(previewPayment.recipient) : "Recipient"}</strong>
	                    </div>
	                    <div>
	                      <span>Amount</span>
	                      <strong>{previewPayment ? `${Number(previewPayment.amount).toFixed(7)} XLM` : "0.0000000 XLM"}</strong>
	                    </div>
	                    <div>
	                      <span>Network Fee</span>
	                      <strong>≈ {ESTIMATED_FEE_XLM} XLM</strong>
	                    </div>
	                    <div className="preview-total">
	                      <span>Total</span>
	                      <strong>
	                        {previewPayment
	                          ? `${(Number(previewPayment.amount) + Number(ESTIMATED_FEE_XLM)).toFixed(5)} XLM`
	                          : `${ESTIMATED_FEE_XLM} XLM`}
	                      </strong>
	                    </div>
                  </div>

                  <div className="preview-warning">
                    <ShieldCheck size={24} aria-hidden="true" />
                    <p>You will be asked to confirm and sign this transaction in your connected Stellar wallet.</p>
                  </div>

                  <TransactionStatus result={transactionResult} />
                </section>

                <section className="recent-activity-card">
                  <div className="recent-heading">
                    <div>
                      <Activity size={18} aria-hidden="true" />
                      <h2>Recent Activity</h2>
                    </div>
                    <button type="button" onClick={() => navigateTo("activity")}>View All</button>
                  </div>
                  <div className="recent-list">
                    {paymentHistory.length === 0 && contractEvents.length === 0 ? (
                      <p className="recent-empty">
                        {isConnected ? "No activity yet for this wallet." : "Connect a wallet to load recent activity."}
                      </p>
                    ) : null}
                    {paymentHistory.slice(0, 2).map((item) => (
                      <article key={item.id}>
                        <i><Send size={20} aria-hidden="true" /></i>
                        <div>
                          <strong>Payment{item.direction === "sent" ? "Sent" : "Received"}</strong>
                          <span>{item.direction === "sent" ? "To" : "From"}: {shortenPublicKey(item.direction === "sent" ? item.to : item.from)} · {Number(item.amount).toFixed(2)} {item.asset}</span>
                        </div>
                        <b>SUCCESS</b>
                      </article>
                    ))}
                    {contractEvents.slice(0, 2).map((event) => (
                      <article key={event.id}>
                        <i className="contract"><Box size={20} aria-hidden="true" /></i>
                        <div>
                          <strong>PaymentRecorded</strong>
                          <span>Contract: LumenPayTracker</span>
                        </div>
                        <b>SUCCESS</b>
                      </article>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </section>
        ) : isActivityPage ? (
          <section className="activity-page" id="activity">
            <div className="activity-page-heading">
              <div>
                <h1>Live Activity Feed <span>Live</span></h1>
                <p>Real-time stream of on-chain payment records and contract events from the LumenPayTracker smart contract.</p>
              </div>
              <div className="activity-tools">
                <label>
                  <Search size={18} aria-hidden="true" />
                  <input
                    value={activityQuery}
                    onChange={(event) => setActivityQuery(event.target.value)}
                    placeholder="Search by address, tx hash..."
                  />
                </label>
                <button type="button" aria-label="Filter activity" title="Filter activity">
                  <Filter size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void refreshPaymentHistory();
                    void refreshContractEvents();
                  }}
                  disabled={isHistoryLoading || isContractLoading}
                  aria-label="Refresh activity"
                  title="Refresh activity"
                >
                  <RefreshCw className={isHistoryLoading || isContractLoading ? "animate-spin" : ""} size={18} aria-hidden="true" />
                </button>
              </div>
            </div>

            {historyError || contractError ? (
              <div className="activity-error-banner">
                {historyError ?? contractError}
              </div>
            ) : null}

            <section className="activity-stat-grid">
              {[
                { label: "Total Events", value: filteredActivityRows.length, note: "On-chain events", icon: Box, tone: "purple" },
                { label: "Successful", value: filteredActivityRows.length, note: "This session", icon: CheckCircle2, tone: "green" },
                { label: "Pending", value: activityPendingCount, note: "Waiting for confirmation", icon: Activity, tone: "orange" },
                { label: "Failed", value: activityFailedCount, note: "This session", icon: X, tone: "red" }
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <article className="activity-stat-card" key={stat.label}>
                    <i className={stat.tone}><Icon size={28} aria-hidden="true" /></i>
                    <div>
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                      <small>{stat.note}</small>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="activity-table-card">
              <div className="activity-table-head">
                <span>Event</span>
                <span>Amount</span>
                <span>From</span>
                <span>To</span>
                <span>Time</span>
              </div>
              {filteredActivityRows.length === 0 ? (
                <div className="activity-empty-state">
                  <Box size={32} aria-hidden="true" />
                  <strong>No activity found</strong>
                  <p>{activityQuery ? "Try a different address or transaction hash." : "Connect your wallet or record payments to populate this feed."}</p>
                </div>
              ) : (
                <div className="activity-table-body">
                  {filteredActivityRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <article className="activity-row" key={row.id}>
                        <div className="activity-event-cell">
                          <i className={row.tone}><Icon size={24} aria-hidden="true" /></i>
                          <div>
                            <strong>{row.type} <b className={row.tone}>{row.status}</b></strong>
                            <span>{row.description}</span>
                            <small>Ledger: {row.ledger}</small>
                          </div>
                        </div>
                        <div className="activity-amount-cell">
                          <strong>{row.amount}</strong>
                          <span>≈ ${(Number(row.amount.split(" ")[0]) * 0.219).toFixed(2)} USD</span>
                        </div>
                        <div className="activity-address-cell">{shortenPublicKey(row.from)}</div>
                        <div className="activity-address-cell">{shortenPublicKey(row.to)}</div>
                        <div className="activity-time-cell">
                          <span>{row.time}</span>
                          <a href={getTestnetExplorerUrl(row.hash)} target="_blank" rel="noreferrer">
                            View on Explorer <ExternalLink size={14} aria-hidden="true" />
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="activity-footer-row">
              <span><i /> Auto-updated every 6s</span>
              <div>
                <button type="button" disabled>‹</button>
                <button type="button" className="active">1</button>
                <button type="button" disabled>2</button>
                <button type="button" disabled>3</button>
                <button type="button" disabled>›</button>
              </div>
            </div>
          </section>
        ) : isWalletPage ? (
          <section className="wallets-page" id="wallets">
            <div className="wallets-main">
              <div className="wallets-heading">
                <h1>Wallets</h1>
                <p>Connect and manage multiple Stellar wallets.<br />You can switch between wallets anytime.</p>
              </div>

              <section className="wallets-section">
                <div className="wallets-section-heading">
                  <h2>Available Wallets</h2>
                  <p>Choose a wallet to connect to Stellar Testnet</p>
                </div>
                <div className="wallet-card-grid">
                  {wallets
                    .slice()
                    .sort((first, second) => Number(second.id.toLowerCase() === "freighter") - Number(first.id.toLowerCase() === "freighter"))
                    .slice(0, 6)
                    .map((wallet) => {
                    const isActiveWallet = isConnected && connectedWalletId === wallet.id;
                    const isRecommended = wallet.id.toLowerCase() === "freighter" && !isActiveWallet;
                    return (
                      <article
                        className={[
                          "wallet-choice-card",
                          isRecommended ? "featured" : "",
                          isActiveWallet ? "connected" : "",
                          !wallet.isAvailable ? "unavailable" : ""
                        ].filter(Boolean).join(" ")}
                        key={wallet.id}
                      >
                        {isActiveWallet ? (
                          <span className="wallet-selected-mark connected"><CheckCircle2 size={18} aria-hidden="true" /></span>
                        ) : isRecommended ? (
                          <span className="wallet-selected-mark"><CheckCircle2 size={18} aria-hidden="true" /></span>
                        ) : null}
                        <div className="wallet-card-head">
                          <img src={wallet.icon} alt="" />
                          <div>
                            <h3>{wallet.name}</h3>
                            <span>{isRecommended ? "Browser Extension" : wallet.isAvailable ? "Stellar Wallet" : "Install Required"}</span>
                          </div>
                          {isRecommended ? <small>Recommended</small> : null}
                          <b aria-hidden="true">›</b>
                        </div>
                        <div>
                          <p>
                            {isActiveWallet
                              ? "Wallet ini sedang terkoneksi dan aktif digunakan."
                              : wallet.isAvailable
                                ? "Ready to connect on Stellar Testnet."
                                : "Wallet tidak terdeteksi. Install atau buka wallet dahulu."}
                          </p>
                          {isActiveWallet ? <small className="connected-badge">Connected</small> : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void connectWallet(wallet.id)}
                          disabled={walletStatus === "connecting" || isActiveWallet}
                        >
                          {walletStatus === "connecting"
                            ? "Connecting..."
                            : isActiveWallet
                              ? "Connected"
                              : wallet.isAvailable
                                ? isConnected ? "Switch Wallet" : "Connect"
                                : "Connect"}
                        </button>
                      </article>
                    );
                  })}
                  <article className="wallet-choice-card more-wallets-card">
                    <div className="more-wallet-icon"><WalletCards size={28} aria-hidden="true" /></div>
                    <div>
                      <h3>More Wallets</h3>
                      <p>View other compatible Stellar wallets.</p>
                    </div>
                    <button type="button" onClick={() => setIsWalletModalOpen(true)}>View More</button>
                  </article>
                </div>
              </section>

              <section className="wallet-security-strip">
                <ShieldCheck size={23} aria-hidden="true" />
                <div>
                  <strong>Your keys. Your funds.</strong>
                  <p>LumenPay Lite never stores your private keys. We only connect to your wallet to perform transactions.</p>
                </div>
                <a href="https://stellar.org/learn/wallets" target="_blank" rel="noreferrer">
                  Learn more about wallets <ExternalLink size={15} aria-hidden="true" />
                </a>
              </section>

              <section className="recent-wallets-section">
                <div className="recent-wallets-heading">
                  <h2>Recently Used Wallets</h2>
                  <button type="button" onClick={() => setIsWalletModalOpen(true)}>View All</button>
                </div>
                <div className="recent-wallet-list">
                  {publicKey ? (
                    <article>
                      <div className="wallet-avatar-dot" />
                      <div>
                        <strong>{shortenPublicKey(publicKey)}</strong>
                        <span>Connected</span>
                      </div>
                      <b>{balance ? `${Number(balance).toFixed(4)} XLM` : "Loading balance"}</b>
                      <small>Connected just now</small>
                      <button type="button" aria-label="Copy wallet address" onClick={() => void navigator.clipboard.writeText(publicKey)}>
                        <Copy size={17} aria-hidden="true" />
                      </button>
                    </article>
                  ) : (
                    <p className="wallet-empty-row">No recently used wallet. Connect a wallet to start tracking balances and payments.</p>
                  )}
                </div>
              </section>
            </div>

            <aside className="wallets-side">
              <section className="connected-wallet-card">
                <h2>Connected Wallet</h2>
                <div className="connected-wallet-identity">
                  <div className="wallet-avatar-dot" />
                  <div>
                    <small>{walletName ?? "Stellar Wallet"}</small>
                    <strong>{publicKey ? shortenPublicKey(publicKey) : "No wallet connected"}</strong>
                    <span><i /> {isConnected ? "Connected" : "Disconnected"}</span>
                  </div>
                </div>
                <p>Balance (Testnet)</p>
                <div className="connected-wallet-balance">
                  <strong>{balance ? Number(balance).toFixed(4) : "0.0000"}</strong>
                  <span>XLM</span>
                  <button type="button" onClick={refreshBalance} disabled={!isConnected} aria-label="Refresh balance">
                    <RefreshCw size={18} aria-hidden="true" />
                  </button>
                </div>
                <div className="connected-wallet-actions">
                  <a
                    href={publicKey ? `https://stellar.expert/explorer/testnet/account/${publicKey}` : "https://stellar.expert/explorer/testnet"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={16} aria-hidden="true" />
                    View on Explorer
                  </a>
                  <button type="button" onClick={() => setIsWalletModalOpen(true)}>
                    <WalletCards size={16} aria-hidden="true" />
                    Manage
                  </button>
                </div>
              </section>

              <section className="wallet-benefits-card">
                <h2>Why connect multiple wallets?</h2>
                {["Easily switch between accounts", "Manage different funds", "Track all your payments", "More flexibility for payments"].map((item) => (
                  <p key={item}><CheckCircle2 size={18} aria-hidden="true" /> {item}</p>
                ))}
              </section>

              <section className="wallet-tips-card">
                <h2>Tips</h2>
                <p>Make sure you are on Stellar Testnet when connecting your wallet.</p>
                <button type="button" onClick={refreshFreighterNetwork}>
                  <span /> Stellar Testnet
                </button>
              </section>
            </aside>
          </section>
        ) : isContractPage ? (
          <section className="contracts-page" id="contracts">
            <div className="contracts-main">
              <div className="contracts-heading">
                <h1>Smart Contracts</h1>
                <p>Interact with the LumenPayTracker smart contract and view on-chain data.</p>
              </div>

              <section className="contract-summary-grid">
                <article className="contract-summary-card deployed">
                  <i><Box size={27} aria-hidden="true" /></i>
                  <div>
                    <span>Deployed Contract <b className={CONTRACT_CONFIGURED ? "active" : "inactive"}>{CONTRACT_CONFIGURED ? "Active" : "Missing"}</b></span>
                    <strong>{TRACKER_CONTRACT_ID ? `${TRACKER_CONTRACT_ID.slice(0, 5)}...LUMENPAYTRACKER` : "Not configured"}</strong>
                    <small>{CONTRACT_CONFIGURED ? "Ready on Stellar Testnet" : "Set NEXT_PUBLIC_TRACKER_CONTRACT_ID"}</small>
                  </div>
                  <button type="button" onClick={() => void navigator.clipboard.writeText(TRACKER_CONTRACT_ID)} disabled={!TRACKER_CONTRACT_ID} aria-label="Copy contract address">
                    <Copy size={15} aria-hidden="true" />
                  </button>
                </article>
                <article className="contract-summary-card">
                  <i className="green"><Coins size={27} aria-hidden="true" /></i>
                  <div>
                    <span>Total Records</span>
                    <strong>{contractEvents.length}</strong>
                    <small>Payment records</small>
                  </div>
                </article>
                <article className="contract-summary-card">
                  <i className="orange"><Radio size={27} aria-hidden="true" /></i>
                  <div>
                    <span>Total Events</span>
                    <strong>{contractEvents.length}</strong>
                    <small>Events emitted</small>
                  </div>
                </article>
              </section>

              <nav className="contract-tabs" aria-label="Contract sections">
                <button className="active" type="button">Overview</button>
                <button type="button" onClick={() => navigateTo("send-payment")}>Write (Call)</button>
                <button type="button" onClick={refreshContractEvents}>Read (Query)</button>
                <button type="button" onClick={() => navigateTo("activity")}>Events</button>
              </nav>

              <section className="contract-overview-panel">
                <div className="contract-overview-copy">
                  <h2>Contract Overview</h2>
                  {[
                    ["Contract Name", "LumenPayTracker"],
                    ["Contract Address", displayedContractId],
                    ["Network", "Stellar Testnet"],
                    ["Deployer", publicKey ? shortenPublicKey(publicKey) : "Connected wallet"],
                    ["Deployed At", CONTRACT_CONFIGURED ? "Stellar Testnet deployment" : "Awaiting configuration"],
                    ["Description", "Records successful LumenPay payments and emits events that can be tracked in real-time."]
                  ].map(([label, value]) => (
                    <div className="contract-detail-line" key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                  <div className="contract-detail-line">
                    <span>Explorer</span>
                    <a href={CONTRACT_CONFIGURED ? contractExplorerUrl : "https://stellar.expert/explorer/testnet"} target="_blank" rel="noreferrer">
                      View on Stellar Expert <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </div>
                </div>
                <div className="contract-visual" aria-hidden="true">
                  <div className="contract-document">
                    <span />
                    <span />
                    <b>{"{}"}</b>
                    <span />
                  </div>
                </div>
              </section>

              <section className="contract-actions-section">
                <div>
                  <h2>Quick Actions</h2>
                  <p>Interact with the contract</p>
                </div>
                <div className="contract-action-grid">
                  <article className="contract-action-card purple">
                    <i><Send size={22} aria-hidden="true" /></i>
                    <strong>Record Payment</strong>
                    <p>Record a new payment to the contract.</p>
                    <button type="button" onClick={() => navigateTo("send-payment")}>Record Payment →</button>
                  </article>
                  <article className="contract-action-card blue">
                    <i><ClipboardCheck size={22} aria-hidden="true" /></i>
                    <strong>Get Payment Count</strong>
                    <p>Get the total number of payment records.</p>
                    <button type="button" onClick={refreshContractEvents}>View Count</button>
                  </article>
                  <article className="contract-action-card green">
                    <i><Search size={22} aria-hidden="true" /></i>
                    <strong>Get Payment by ID</strong>
                    <p>Retrieve details of a payment by its ID.</p>
                    <button type="button" onClick={() => navigateTo("activity")}>Search Payment</button>
                  </article>
                </div>
              </section>

              <section className="contract-security-strip">
                <ShieldCheck size={24} aria-hidden="true" />
                <div>
                  <strong>Secure & Transparent</strong>
                  <p>All interactions are performed on Stellar Testnet. You maintain full control of your funds.</p>
                </div>
                <a href="https://developers.stellar.org/docs/smart-contracts" target="_blank" rel="noreferrer">
                  Learn more about contracts <ExternalLink size={15} aria-hidden="true" />
                </a>
              </section>
            </div>

            <aside className="contracts-side">
              <section className="contract-details-card">
                <div className="contract-side-heading">
                  <h2>Contract Details</h2>
                  <i><Box size={26} aria-hidden="true" /></i>
                </div>
                <label>Address</label>
                <div className="contract-address-copy">
                  <span>{TRACKER_CONTRACT_ID ? `${TRACKER_CONTRACT_ID.slice(0, 5)}...LUMENPAYTRACKER` : "Not configured"}</span>
                  <button type="button" onClick={() => void navigator.clipboard.writeText(TRACKER_CONTRACT_ID)} disabled={!TRACKER_CONTRACT_ID} aria-label="Copy contract address">
                    <Copy size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="contract-meta-list">
                  <p><span>Network</span><b>Stellar Testnet</b></p>
                  <p><span>Status</span><b className={CONTRACT_CONFIGURED ? "active" : "inactive"}>{CONTRACT_CONFIGURED ? "Active" : "Not configured"}</b></p>
                  <p><span>Last Updated</span><strong>{new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</strong></p>
                </div>
                <a href={CONTRACT_CONFIGURED ? contractExplorerUrl : "https://stellar.expert/explorer/testnet"} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} aria-hidden="true" />
                  View on Stellar Expert
                </a>
              </section>

              <section className="contract-recent-card">
                <div className="contract-recent-heading">
                  <h2>Recent Contract Activity</h2>
                  <button type="button" onClick={() => navigateTo("activity")}>View All</button>
                </div>
                <div className="contract-recent-list">
                  {contractEvents.length === 0 ? (
                    <p className="contract-empty">No contract events yet. Record a payment to populate this panel.</p>
                  ) : (
                    contractEvents.slice(0, 4).map((event) => (
                      <article key={event.id}>
                        <i><Box size={21} aria-hidden="true" /></i>
                        <div>
                          <strong>PaymentRecorded</strong>
                          <span>From: {shortenPublicKey(event.sender)}</span>
                          <span>To: {shortenPublicKey(event.recipient)}</span>
                          <small>Amount: {Number(event.amount).toFixed(2)} XLM</small>
                        </div>
                        <b>SUCCESS</b>
                      </article>
                    ))
                  )}
                </div>
                <button className="contract-refresh-button" type="button" onClick={refreshContractEvents} disabled={isContractLoading}>
                  <RefreshCw className={isContractLoading ? "animate-spin" : ""} size={17} aria-hidden="true" />
                </button>
              </section>
            </aside>
          </section>
        ) : isAboutPage ? (
          <section className="about-page" id="about">
            <div className="about-main">
              <section className="about-hero">
                <div className="about-hero-copy">
                  <h1>About LumenPay Lite</h1>
                  <p>
                    LumenPay Lite is a multi-wallet Stellar Testnet payment dApp that lets you send XLM,
                    record payments on-chain using a smart contract, and follow everything in real-time.
                  </p>
                </div>
                <div className="about-hero-visual" aria-hidden="true">
                  <span className="about-spark one">*</span>
                  <span className="about-spark two">*</span>
                  <span className="about-spark three">*</span>
                  <div className="about-orb"><span>S</span></div>
                  <div className="about-podium" />
                </div>
              </section>

              <section className="about-section">
                <h2>What is LumenPay Lite?</h2>
                <div className="about-feature-grid">
                  {[
                    {
                      title: "Multi-Wallet Support",
                      text: "Connect with multiple Stellar wallets using StellarWalletsKit and switch anytime.",
                      icon: WalletCards,
                      tone: "purple"
                    },
                    {
                      title: "Real-time Activity",
                      text: "Track live payment events and contract records in a synchronized activity feed.",
                      icon: Radio,
                      tone: "blue"
                    },
                    {
                      title: "Smart Contract Powered",
                      text: "All successful payments are recorded on the LumenPayTracker Soroban smart contract.",
                      icon: Box,
                      tone: "green"
                    },
                    {
                      title: "Secure & Transparent",
                      text: "Built on Stellar. Secure, fast, and transparent payments on the Stellar Testnet.",
                      icon: ShieldCheck,
                      tone: "purple"
                    }
                  ].map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <article className="about-feature" key={feature.title}>
                        <i className={feature.tone}><Icon size={24} aria-hidden="true" /></i>
                        <div>
                          <strong>{feature.title}</strong>
                          <p>{feature.text}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="about-section">
                <h2>Tech Stack</h2>
                <div className="tech-stack-grid">
                  {[
                    ["Stellar SDK", "v11+"],
                    ["Soroban", "Smart Contracts"],
                    ["StellarWalletsKit", "Multi-Wallet"],
                    ["Vue 3", "Frontend"],
                    ["Vite", "Build Tool"]
                  ].map(([name, note]) => (
                    <article key={name}>
                      <span>{name.slice(0, 1)}</span>
                      <div>
                        <strong>{name}</strong>
                        <small>{note}</small>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="about-project-card">
                <h2>About the Project</h2>
                <p>
                  LumenPay Lite was built for the Stellar Quest - Yellow Belt (Level 2) challenge.
                  It demonstrates real-world integration of Stellar wallets, Soroban smart contracts,
                  and real-time event handling in a modern dApp experience.
                </p>
                <div>
                  <a href="https://github.com/Gusma-crypto/lumenpay" target="_blank" rel="noreferrer">
                    <Github size={17} aria-hidden="true" /> View on GitHub <ExternalLink size={14} aria-hidden="true" />
                  </a>
                  <a href="https://developers.stellar.org/docs" target="_blank" rel="noreferrer">
                    Documentation <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </div>
              </section>

              <div className="about-footer-note">
                <ShieldCheck size={15} aria-hidden="true" />
                Secure. Transparent. Built on Stellar.
              </div>
            </div>

            <aside className="about-side">
              <section className="about-side-card">
                <div className="about-side-heading">
                  <h2>Contract Information</h2>
                  <i><ClipboardCheck size={22} aria-hidden="true" /></i>
                </div>
                <label>Contract Name</label>
                <strong>LumenPayTracker</strong>
                <label>Contract Address</label>
                <div className="about-contract-copy">
                  <span>{displayedContractId}</span>
                  <button type="button" onClick={() => void navigator.clipboard.writeText(TRACKER_CONTRACT_ID)} aria-label="Copy contract address">
                    <Copy size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="about-info-row"><span>Network</span><b>Stellar Testnet</b></div>
                <div className="about-info-row"><span>Deployed At</span><strong>15 May 2026, 10:24 AM</strong></div>
                <a href={contractExplorerUrl} target="_blank" rel="noreferrer">
                  View on Stellar Expert <ExternalLink size={14} aria-hidden="true" />
                </a>
              </section>

              <section className="about-side-card">
                <div className="about-side-heading">
                  <h2>Version</h2>
                  <i><Sparkles size={22} aria-hidden="true" /></i>
                </div>
                <label>Current Version</label>
                <strong>2.0.0 (Level 2)</strong>
                <label>Release Date</label>
                <strong>May 15, 2026</strong>
                <a href="https://github.com/Gusma-crypto/lumenpay" target="_blank" rel="noreferrer">
                  View Changelog <ExternalLink size={14} aria-hidden="true" />
                </a>
              </section>

              <section className="about-side-card resources">
                <div className="about-side-heading">
                  <h2>Links & Resources</h2>
                  <i><ExternalLink size={22} aria-hidden="true" /></i>
                </div>
                {[
                  ["Stellar Network", "https://stellar.org"],
                  ["Soroban Documentation", "https://developers.stellar.org/docs/build/smart-contracts"],
                  ["Stellar Quest - Yellow Belt", "https://quest.stellar.org"],
                  ["Join Stellar Community", "https://stellar.org/community"]
                ].map(([label, href]) => (
                  <a href={href} target="_blank" rel="noreferrer" key={label}>
                    {label} <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ))}
              </section>
            </aside>
          </section>
        ) : isSettingsPage ? (
          <section className="settings-page" id="settings">
            <div className="settings-main">
              <div className="settings-page-heading">
                <h1>Settings</h1>
                <p>Manage your preferences, network, and application settings.</p>
              </div>

              <nav className="settings-tabs" aria-label="Settings sections">
                {["General", "Network", "Appearance", "Notifications", "Advanced"].map((item, index) => (
                  <button className={index === 0 ? "active" : ""} type="button" key={item}>{item}</button>
                ))}
              </nav>

              <section className="settings-panel profile">
                <h2>Profile & Wallet</h2>
                <div className="settings-profile-row">
                  <div className="wallet-avatar-dot" />
                  <div>
                    <span>Connected Wallet</span>
                    <strong>{publicKey ? shortenPublicKey(publicKey) : "No wallet connected"}</strong>
                    <small>
                      Public Key: {publicKey ? shortenPublicKey(publicKey) : "Not connected"}
                      {publicKey ? (
                        <button type="button" onClick={() => void navigator.clipboard.writeText(publicKey)} aria-label="Copy public key">
                          <Copy size={15} aria-hidden="true" />
                        </button>
                      ) : null}
                    </small>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void (isConnected ? disconnectWallet() : connectWallet());
                    }}
                    className={isConnected ? "danger-outline" : ""}
                  >
                    {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
                  </button>
                </div>
              </section>

              <section className="settings-panel">
                <h2>Application Preferences</h2>
                <div className="settings-line">
                  <div>
                    <strong>Default Explorer</strong>
                    <p>Choose the default Stellar explorer for transactions.</p>
                  </div>
                  <button className="settings-select" type="button">Stellar Expert ˅</button>
                </div>
                <div className="settings-line">
                  <div>
                    <strong>Auto copy transaction link</strong>
                    <p>Automatically copy transaction link after success.</p>
                  </div>
                  <button
                    className={`settings-toggle ${autoCopyTransactionLink ? "on" : ""}`}
                    type="button"
                    onClick={() => setAutoCopyTransactionLink((current) => !current)}
                    aria-pressed={autoCopyTransactionLink}
                  />
                </div>
                <div className="settings-line">
                  <div>
                    <strong>Auto record to contract</strong>
                    <p>Automatically record successful payments to the contract.</p>
                  </div>
                  <button
                    className={`settings-toggle ${autoRecordContract ? "on" : ""}`}
                    type="button"
                    onClick={() => setAutoRecordContract((current) => !current)}
                    aria-pressed={autoRecordContract}
                  />
                </div>
              </section>

              <section className="settings-panel">
                <h2>Display & Appearance</h2>
                <div className="settings-line appearance">
                  <div>
                    <strong>Theme</strong>
                    <p>Choose your preferred theme.</p>
                  </div>
                  <div className="theme-choice-group">
                    <button className={theme === "light" ? "active" : ""} type="button" onClick={() => setTheme("light")}>
                      <Sun size={17} aria-hidden="true" /> Light
                    </button>
                    <button className={theme === "dark" ? "active" : ""} type="button" onClick={() => setTheme("dark")}>
                      <Moon size={17} aria-hidden="true" /> Dark
                    </button>
                    <button type="button" onClick={() => setTheme("light")}>
                      <Monitor size={17} aria-hidden="true" /> System
                    </button>
                  </div>
                </div>
                <div className="settings-line">
                  <div>
                    <strong>Compact mode</strong>
                    <p>Show more content in less space.</p>
                  </div>
                  <button
                    className={`settings-toggle ${compactMode ? "on" : ""}`}
                    type="button"
                    onClick={() => setCompactMode((current) => !current)}
                    aria-pressed={compactMode}
                  />
                </div>
              </section>

              <section className="settings-panel">
                <h2>Security & Privacy</h2>
                <div className="settings-line">
                  <div>
                    <strong>Confirm transactions</strong>
                    <p>Always show confirmation before sending transactions.</p>
                  </div>
                  <button
                    className={`settings-toggle ${confirmTransactions ? "on" : ""}`}
                    type="button"
                    onClick={() => setConfirmTransactions((current) => !current)}
                    aria-pressed={confirmTransactions}
                  />
                </div>
                <div className="settings-line">
                  <div>
                    <strong>Clear local data</strong>
                    <p>Remove all locally stored data from this browser.</p>
                  </div>
                  <button
                    className="clear-data-button"
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      void disconnectWallet();
                      showNotification("form", "Local Data Cleared", "Browser storage untuk LumenPay Lite sudah dibersihkan.");
                    }}
                  >
                    Clear Data
                  </button>
                </div>
              </section>
            </div>

            <aside className="settings-side">
              <section className="settings-side-card network">
                <h2>Network</h2>
                <div className="settings-side-row">
                  <i><Coins size={23} aria-hidden="true" /></i>
                  <div>
                    <strong>Stellar Testnet <b>Active</b></strong>
                    <p>All transactions and contracts interact with the Stellar Testnet.</p>
                  </div>
                </div>
                <button type="button" onClick={refreshFreighterNetwork}>Change Network</button>
              </section>

              <section className="settings-side-card about">
                <h2>About LumenPay Lite</h2>
                <div className="settings-side-row">
                  <i><Sparkles size={23} aria-hidden="true" /></i>
                  <div>
                    <strong>Version <span>2.0.0 (Level 2)</span></strong>
                    <p>A lightweight Stellar payment dApp built for the Yellow Belt Challenge.</p>
                    <a href="https://github.com/Gusma-crypto/lumenpay" target="_blank" rel="noreferrer">View Changelog <ExternalLink size={14} aria-hidden="true" /></a>
                  </div>
                </div>
              </section>

              <section className="settings-side-card tips">
                <h2>Tips</h2>
                {["Never share your secret key or recovery phrase.", "Always double-check recipient addresses.", "Use Testnet for testing only."].map((item) => (
                  <p key={item}><CheckCircle2 size={18} aria-hidden="true" /> {item}</p>
                ))}
                <a href="https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts" target="_blank" rel="noreferrer">
                  Security Best Practices <ExternalLink size={14} aria-hidden="true" />
                </a>
              </section>

              <section className="settings-side-card help">
                <div className="settings-side-row">
                  <i><Headphones size={23} aria-hidden="true" /></i>
                  <div>
                    <h2>Need Help?</h2>
                    <p>Check our documentation or join the Stellar community.</p>
                  </div>
                </div>
                <a href="https://developers.stellar.org/docs" target="_blank" rel="noreferrer">
                  View Documentation <ExternalLink size={14} aria-hidden="true" />
                </a>
              </section>
            </aside>
          </section>
        ) : (
        <>
        <section className="dashboard-hero" id="dashboard">
          <div className="hero-copy">
            <h1><span>Send. Track.</span> <em>On Stellar.</em></h1>
            <p>A multi-wallet Stellar Testnet payment tracker.<br />Send XLM, record payments on-chain, and follow<br />everything in real-time.</p>
            <div className="hero-actions">
              <button className="primary-action" type="button" onClick={() => navigateTo("send-payment")}>
                Send XLM Payment <Send size={17} aria-hidden="true" />
              </button>
              <button className="secondary-action" type="button" onClick={() => navigateTo("about")}>
                <Info size={17} aria-hidden="true" /> How it works
              </button>
            </div>
          </div>
          <div className="stellar-orbit" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="stellar-coin">S</div>
            <span className="orbit-dot dot-one" />
            <span className="orbit-dot dot-two" />
          </div>
          <article className="contract-overview" id="contracts">
            <div className="contract-network"><strong>Network</strong><span>Stellar Testnet</span></div>
            <label>Payment Tracker Contract</label>
            <div className="contract-address">
              <span>{TRACKER_CONTRACT_ID ? `${TRACKER_CONTRACT_ID.slice(0, 5)}...LUMENPAYTRACKER` : "Contract not configured"}</span>
              <button type="button" aria-label="Copy contract address" onClick={() => void navigator.clipboard.writeText(TRACKER_CONTRACT_ID)}>
                <Copy size={15} />
              </button>
            </div>
            <div className="contract-counts">
              <div><span>Total Records</span><strong>{paymentHistory.length}</strong></div>
              <div><span>Total Events</span><strong>{contractEvents.length}</strong></div>
            </div>
            <a href={`https://stellar.expert/explorer/testnet/contract/${TRACKER_CONTRACT_ID}`} target="_blank" rel="noreferrer">
              <ExternalLink size={15} /> View on Stellar Expert
            </a>
          </article>
        </section>

        <section className="stats-grid">
          {[
            { label: "Connected Wallets", value: isConnected ? 1 : 0, note: "This session", icon: Users, tone: "blue" },
            { label: "Total Payments Recorded", value: paymentHistory.length, note: "On-chain", icon: Box, tone: "purple" },
            {
              label: "Total Volume Recorded",
              value: `${paymentHistory.reduce((total, item) => total + (Number(item.amount) || 0), 0).toFixed(2)} XLM`,
              note: "On-chain",
              icon: Coins,
              tone: "green"
            },
            { label: "Total Events", value: contractEvents.length, note: "From smart contract", icon: Radio, tone: "orange" }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <article className="stat-card" key={stat.label}>
                <div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></div>
                <i className={stat.tone}><Icon size={21} /></i>
              </article>
            );
          })}
        </section>

        <section className="mobile-dashboard-panels" aria-label="Mobile dashboard overview">
          <article className="mobile-transaction-card">
            <div className="mobile-card-heading">
              <h2>Transaction Status</h2>
              <button type="button" onClick={() => navigateTo("activity")}>View All</button>
            </div>
            <div className="mobile-status-timeline">
              <div className="mobile-status-item">
                <i><Send size={18} aria-hidden="true" /></i>
                <div>
                  <strong>XLM Payment</strong>
                  <span>{latestPaymentActivity ? `To ${shortenPublicKey(latestPaymentActivity.to)}` : "Ready to send payment"}</span>
                  <small>{latestPaymentActivity?.hash ? shortenPublicKey(latestPaymentActivity.hash) : "No payment submitted yet"}</small>
                </div>
                <b className={latestPaymentActivity ? "success" : "ready"}>{latestPaymentActivity ? "SUCCESS" : "READY"}</b>
              </div>
              <div className="mobile-status-item">
                <i><Box size={18} aria-hidden="true" /></i>
                <div>
                  <strong>Contract Record</strong>
                  <span>{latestContractActivity ? `Ledger ${latestContractActivity.ledger}` : "Waiting for contract record"}</span>
                  <small>{latestContractActivity?.hash ? shortenPublicKey(latestContractActivity.hash) : "No contract event yet"}</small>
                </div>
                <b className={latestContractActivity ? "success" : "ready"}>{latestContractActivity ? "SUCCESS" : "READY"}</b>
              </div>
            </div>
            <div className="mobile-success-banner">
              <CheckCircle2 size={17} aria-hidden="true" />
              <span>{transactionResult.status === "success" ? "Payment sent successfully on Stellar Testnet." : "Connect wallet and send XLM to start tracking."}</span>
            </div>
          </article>

          <article className="mobile-live-card">
            <div className="mobile-card-heading">
              <h2>Live Activity Feed</h2>
              <button type="button" onClick={() => navigateTo("activity")}>View All</button>
            </div>
            <div className="mobile-live-list">
              {mobileActivityRows.length ? (
                mobileActivityRows.map((row) => {
                  const Icon = row.icon;
                  return (
                    <button type="button" key={row.id} onClick={() => navigateTo("activity")}>
                      <i><Icon size={18} aria-hidden="true" /></i>
                      <span>
                        <strong>{row.description}</strong>
                        <small>{row.amount} · {row.time}</small>
                      </span>
                      <b>{row.status}</b>
                    </button>
                  );
                })
              ) : (
                <div className="mobile-empty-feed">
                  <Radio size={23} aria-hidden="true" />
                  <strong>No activity yet</strong>
                  <span>Send a payment to create the first activity item.</span>
                </div>
              )}
            </div>
          </article>
        </section>

        <section className="overview-grid">
          <article className="capabilities-card">
            <h2>What you can do with LumenPay Lite</h2>
            <div className="capabilities-list">
              {[
                { title: "Send Payments", text: "Send XLM to any Stellar address quickly and securely.", icon: Send, tone: "purple", action: "Send Payment", target: "send-payment" },
                { title: "Record On-Chain", text: "Successful payments can be recorded to our smart contract.", icon: Box, tone: "green", action: "Learn More", target: "contracts" },
                { title: "Track in Real-Time", text: "View live events and payment records in the activity feed.", icon: Radio, tone: "orange", action: "Open Activity Feed", target: "activity" },
                { title: "Use Multiple Wallets", text: "Connect and switch between multiple Stellar wallets anytime.", icon: WalletCards, tone: "blue", action: "Manage Wallets", target: "wallets" }
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div className="capability" key={feature.title}>
                    <i className={feature.tone}><Icon size={23} /></i>
                    <strong>{feature.title}</strong>
                    <p>{feature.text}</p>
                    <button type="button" onClick={() => navigateTo(feature.target)}>{feature.action}</button>
                  </div>
                );
              })}
            </div>
          </article>
          <article className="activity-overview">
            <div className="overview-heading">
              <h2>Live Activity Feed</h2>
              <button type="button" onClick={() => navigateTo("activity")}>View All</button>
            </div>
            <div className="empty-activity">
              <Box size={31} />
              <strong>{contractEvents.length ? `${contractEvents.length} events synchronized` : "No activity yet"}</strong>
              <p>{contractEvents.length ? "Open the activity feed to inspect the latest contract events." : "Connect your wallet and start sending payments to see live events here."}</p>
              <button type="button" onClick={() => navigateTo("activity")}>Go to Activity Feed</button>
            </div>
          </article>
        </section>

        <section className="dashboard-about-grid" id="about">
          <article className="dashboard-about">
            <Sparkles size={20} />
            <div>
              <h2>About LumenPay Lite</h2>
              <p>LumenPay Lite is built for the Stellar Quest – Yellow Belt (Level 2) challenge. It demonstrates multi-wallet support, smart contract integration, and real-time event handling on Stellar Testnet.</p>
              <div>
                <a href="https://github.com/Gusma-crypto/lumenpay/blob/main/YELLOW_BELT_STEP_BY_STEP.md" target="_blank" rel="noreferrer">Read Full Guide <ExternalLink size={14} /></a>
                <a href="https://github.com/Gusma-crypto/lumenpay" target="_blank" rel="noreferrer"><Github size={14} /> View on GitHub</a>
              </div>
            </div>
          </article>
          <article className="why-stellar">
            <h2>Why Stellar?</h2>
            <p><CheckCircle2 size={15} /> Fast and low-cost transactions</p>
            <p><CheckCircle2 size={15} /> Built for real-world financial use cases</p>
            <p><CheckCircle2 size={15} /> Strong ecosystem and developer support</p>
            <a href="https://stellar.org" target="_blank" rel="noreferrer">Learn more about Stellar <ExternalLink size={13} /></a>
          </article>
        </section>

        <div className="dashboard-footer"><span><ShieldCheck size={14} /> Secure. Transparent. Built on Stellar.</span><span>© 2026 LumenPay Lite. All rights reserved.</span></div>
        </>
        )}

      </div>

      {isWalletModalOpen ? (
        <div className="wallet-modal-backdrop">
          <div className="wallet-modal-card">
            <button className="wallet-modal-close" type="button" onClick={() => setIsWalletModalOpen(false)} aria-label="Close wallet selection"><X size={19} /></button>
            <WalletPanel
              publicKey={publicKey}
              status={walletStatus}
              error={walletError}
              networkName={freighterNetwork}
              isTestnet={isFreighterTestnet}
              onRefreshNetwork={refreshFreighterNetwork}
              onConnect={connectWallet}
              onDisconnect={disconnectWallet}
              wallets={wallets}
              walletName={walletName}
              connectedWalletId={connectedWalletId}
            />
          </div>
        </div>
      ) : null}

      {pendingPayment ? (
        <div className="review-backdrop">
          <section className="review-card">
            <div className="review-heading">
              <p className="section-eyebrow">Preview</p>
              <h2>Review Transaction</h2>
            </div>

            <div className="review-details">
              <div className="review-field recipient">
                <p>Recipient</p>
                <strong>{pendingPayment.recipient}</strong>
              </div>
              <div className="review-three-columns">
                <div className="review-field">
                  <p>Amount</p>
                  <strong>{pendingPayment.amount} XLM</strong>
                </div>
                <div className="review-field">
                  <p>Network</p>
                  <strong>{freighterNetwork ?? "Testnet"}</strong>
                </div>
                <div className="review-field">
                  <p>Estimated fee</p>
                  <strong>{ESTIMATED_FEE_XLM} XLM</strong>
                </div>
              </div>
              {pendingPayment.memo ? (
                <div className="review-field">
                  <p>Memo</p>
                  <strong>{pendingPayment.memo}</strong>
                </div>
              ) : null}
            </div>

            <div className="review-actions">
              <button className="secondary-action" type="button" onClick={() => setPendingPayment(null)}>
                Cancel
              </button>
              <button
                className="primary-action"
                type="button"
                onClick={() => {
                  const payment = pendingPayment;
                  setPendingPayment(null);
                  void sendPayment(payment.recipient, payment.amount, payment.memo);
                }}
              >
                Confirm and Send
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
