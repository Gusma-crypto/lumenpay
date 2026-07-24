"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Box,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Copy,
  ExternalLink,
  Github,
  Radio,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { PaymentForm } from "@/components/PaymentForm";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletPanel } from "@/components/WalletPanel";
import { LiveContractActivity } from "@/components/LiveContractActivity";
import { getTestnetExplorerUrl, shortenPublicKey } from "@/lib/explorer";
import {
  connectWallet as connectSelectedWallet,
  disconnectWallet as disconnectActiveWallet,
  getWalletErrorMessage,
  getWalletNetwork,
  listWallets,
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
  IssuedAssetBalance,
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

type RecentTransaction = {
  amount: string;
  hash: string;
  recipient: string;
};

type PendingPayment = {
  amount: string;
  memo: string;
  recipient: string;
};

type AppNotification = {
  id: number;
  type: "form" | "success";
  title: string;
  message: string;
};

const FALLBACK_WALLETS: WalletOption[] = [
  { id: "freighter", name: "Freighter", icon: "https://stellar.creit.tech/wallet-icons/freighter.png", url: "https://freighter.app", isAvailable: false },
  { id: "xbull", name: "xBull Wallet", icon: "https://stellar.creit.tech/wallet-icons/xbull.png", url: "https://xbull.app", isAvailable: false },
  { id: "albedo", name: "Albedo", icon: "https://stellar.creit.tech/wallet-icons/albedo.png", url: "https://albedo.link", isAvailable: true },
  { id: "rabet", name: "Rabet", icon: "https://stellar.creit.tech/wallet-icons/rabet.png", url: "https://rabet.io", isAvailable: false }
];

function NotificationPopup(props: { notification: AppNotification; onClose: () => void }) {
  const Icon = props.notification.type === "success" ? CheckCircle2 : ClipboardCheck;

  return (
    <div className="fixed right-4 top-4 z-[60] w-[calc(100vw-2rem)] max-w-sm animate-fade-in rounded-lg border border-cyan-300/45 bg-[#101124]/95 p-4 shadow-panel ring-1 ring-cyan-300/15 backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-400/15 text-cyan-300">
          <Icon size={20} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{props.notification.title}</p>
          <p className="mt-1 text-sm leading-6 text-violet-100/75">{props.notification.message}</p>
        </div>
        <button
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line/50 bg-[#0d0e1f] text-cyan-200 transition hover:border-cyan-300 hover:bg-[#151633]"
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
  const [assets, setAssets] = useState<IssuedAssetBalance[]>([]);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [transactionResult, setTransactionResult] = useState<TransactionResult>({ status: "idle" });
  const [freighterNetwork, setFreighterNetwork] = useState<string | null>(null);
  const [freighterNetworkPassphrase, setFreighterNetworkPassphrase] = useState<string | null>(null);
  const [recentTransaction, setRecentTransaction] = useState<RecentTransaction | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [recipientSuggestion, setRecipientSuggestion] = useState<string | null>(null);
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [wallets, setWallets] = useState<WalletOption[]>(FALLBACK_WALLETS);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [contractEvents, setContractEvents] = useState<ContractPaymentEvent[]>([]);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractCallStatus>("idle");
  const [contractHash, setContractHash] = useState<string | null>(null);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isConnected = walletStatus === "connected" && Boolean(publicKey);
  const isSubmitting = transactionResult.status === "signing" || transactionResult.status === "submitting";
  const isFreighterTestnet = freighterNetworkPassphrase === NETWORK_PASSPHRASE;

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

  const refreshPaymentHistory = useCallback(async () => {
    if (!publicKey) {
      setPaymentHistory([]);
      setHistoryError(null);
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    setHistoryError(null);

    try {
      const history = await fetchPaymentHistory(publicKey);
      setPaymentHistory(history);
    } catch (error) {
      setPaymentHistory([]);
      setHistoryError(error instanceof Error ? error.message : "Failed to fetch transaction history.");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    void refreshPaymentHistory();
  }, [refreshPaymentHistory]);

  useEffect(() => {
    void listWallets().then((options) => setWallets(options.length > 0 ? options : FALLBACK_WALLETS)).catch(() => setWallets(FALLBACK_WALLETS));
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
    setWalletStatus("connecting");
    setWalletError(null);

    try {
      const connection = await connectSelectedWallet(walletId);

      setPublicKey(connection.address);
      setWalletName(connection.walletName);
      setFreighterNetwork(connection.network.network);
      setFreighterNetworkPassphrase(connection.network.networkPassphrase);
      setWalletStatus("connected");
      setIsWalletModalOpen(false);
    } catch (error) {
      setPublicKey(null);
      setFreighterNetwork(null);
      setFreighterNetworkPassphrase(null);
      setWalletStatus("error");
      setWalletError(getWalletErrorMessage(error));
    }
  }

  async function disconnectWallet() {
    await disconnectActiveWallet().catch(() => undefined);
    setPublicKey(null);
    setWalletName(null);
    setFreighterNetwork(null);
    setFreighterNetworkPassphrase(null);
    setWalletStatus("disconnected");
    setWalletError(null);
    setTransactionResult({ status: "idle" });
    setRecentTransaction(null);
    setPendingPayment(null);
    setPaymentHistory([]);
    setHistoryError(null);
    setRecipientSuggestion(null);
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
      setRecentTransaction({
        amount,
        hash: response.hash,
        recipient: destinationPublicKey
      });
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
    if (section === "wallets") {
      setIsWalletModalOpen(true);
      return;
    }
    if (section === "settings") {
      setIsSettingsOpen(true);
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
    <main className="app-shell yellow-belt-shell" data-theme={theme}>
      {notification ? <NotificationPopup notification={notification} onClose={() => setNotification(null)} /> : null}

      <AppSidebar
        activeSection={activeSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
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

      <div className="dashboard-content">
        <section className="dashboard-hero" id="dashboard">
          <div className="hero-copy">
            <h1>Welcome to <em>LumenPay Lite</em></h1>
            <p>A multi-wallet Stellar Testnet payment tracker.<br />Send XLM, record payments on-chain, and follow<br />everything in real-time.</p>
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

        {activeSection === "send-payment" || activeSection === "activity" ? (
        <section className="dashboard-grid feature-workspace">
          <div id="send-payment" className="dashboard-panel send-panel">
            <PaymentForm
              isConnected={isConnected}
              isSubmitting={isSubmitting}
              latestTransactionHash={recentTransaction?.hash ?? null}
              onSendPayment={reviewPayment}
              onEdit={() => setTransactionResult({ status: "idle" })}
              recipientSuggestion={recipientSuggestion}
            />
          </div>
          <div className="dashboard-panel status-panel">
            <h2>Transaction Status</h2>
            <p className="panel-subtitle">Follow payment and contract confirmation.</p>
            <TransactionStatus result={transactionResult} />
            <div className={`contract-status-row status-${contractStatus}`} id="contracts">
              <div className="status-icon"><Coins size={19} /></div>
              <div><strong>Contract Record</strong><span>LumenPayTracker · record_payment</span></div>
              <b>{contractStatus === "idle" ? "READY" : contractStatus.toUpperCase()}</b>
            </div>
            {contractHash ? (
              <a className="explorer-wide" href={getTestnetExplorerUrl(contractHash)} target="_blank" rel="noreferrer">
                View on Stellar Expert <ExternalLink size={15} />
              </a>
            ) : null}
          </div>
          <div id="activity" className="dashboard-panel activity-panel">
            <LiveContractActivity
              events={contractEvents}
              isLoading={isContractLoading}
              error={contractError}
              callStatus={contractStatus}
              callHash={contractHash}
              onRefresh={refreshContractEvents}
            />
          </div>
        </section>
        ) : null}

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
            />
          </div>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div className="wallet-modal-backdrop">
          <section className="settings-modal-card">
            <button className="wallet-modal-close" type="button" onClick={() => setIsSettingsOpen(false)} aria-label="Close settings">
              <X size={19} />
            </button>
            <p className="section-eyebrow">Preferences</p>
            <h2>Dashboard Settings</h2>
            <p>Choose the visual theme and review the active Stellar network.</p>
            <div className="settings-network-row">
              <span>Network</span>
              <strong><i /> Stellar Testnet</strong>
            </div>
            <div className="settings-theme-grid">
              <button className={theme === "light" ? "active" : ""} type="button" onClick={() => setTheme("light")}>
                Light dashboard
              </button>
              <button className={theme === "dark" ? "active" : ""} type="button" onClick={() => setTheme("dark")}>
                Dark dashboard
              </button>
            </div>
            <button className="primary-action settings-done" type="button" onClick={() => setIsSettingsOpen(false)}>
              Save preferences
            </button>
          </section>
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
