"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardCheck, X } from "lucide-react";
import { AddressBook } from "@/components/AddressBook";
import { AppHeader } from "@/components/AppHeader";
import { BalanceCard } from "@/components/BalanceCard";
import { PaymentActivityChart } from "@/components/PaymentActivityChart";
import { PaymentForm } from "@/components/PaymentForm";
import { TransactionHistory } from "@/components/TransactionHistory";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletPanel } from "@/components/WalletPanel";
import { LiveContractActivity } from "@/components/LiveContractActivity";
import { getTestnetExplorerUrl } from "@/lib/explorer";
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
  submitContractTransaction
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");
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
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [contractEvents, setContractEvents] = useState<ContractPaymentEvent[]>([]);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractStatus, setContractStatus] = useState<ContractCallStatus>("idle");
  const [contractHash, setContractHash] = useState<string | null>(null);
  const [isContractLoading, setIsContractLoading] = useState(false);

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
    void listWallets().then(setWallets).catch(() => setWallets([]));
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
      setWalletError("Choose one of the available wallets below.");
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

  return (
    <main className="app-shell" data-theme={theme}>
      {notification ? <NotificationPopup notification={notification} onClose={() => setNotification(null)} /> : null}

      <AppHeader
        theme={theme}
        publicKey={publicKey}
        walletStatus={walletStatus}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
      />

      <section className="mx-auto grid w-full max-w-[1380px] gap-5 px-4 py-5 md:px-6 lg:grid-cols-2 xl:grid-cols-3 xl:items-start">
        <div className="space-y-5">
          <div className="rounded-lg border border-line/50 bg-[#101124]/80 p-4 shadow-panel">
            <p className="section-eyebrow">Step 1</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">Connect and check balance</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Choose a supported Stellar wallet on Testnet, then confirm your available XLM.
            </p>
          </div>
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
          <BalanceCard
            balance={balance}
            assets={assets}
            isLoading={isBalanceLoading}
            error={balanceError}
            isConnected={isConnected}
            publicKey={publicKey}
            onRefresh={refreshBalance}
          />
          <AddressBook items={paymentHistory} publicKey={publicKey} onSelect={setRecipientSuggestion} />
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-line/50 bg-[#101124]/80 p-4 shadow-panel">
            <p className="section-eyebrow">Step 2</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">Send a Testnet payment</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Enter a recipient, amount, optional memo, then review before signing.
            </p>
          </div>
          <PaymentForm
            isConnected={isConnected}
            isSubmitting={isSubmitting}
            latestTransactionHash={recentTransaction?.hash ?? null}
            onSendPayment={reviewPayment}
            onEdit={() => setTransactionResult({ status: "idle" })}
            recipientSuggestion={recipientSuggestion}
          />
          <TransactionStatus result={transactionResult} />

          {recentTransaction ? (
            <section className="panel-card">
              <p className="section-eyebrow">Latest Payment</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">{recentTransaction.amount} XLM Sent</h2>
              <div className="mt-4 space-y-2 text-sm">
                <p className="rounded-lg border border-line/55 bg-paper p-3 font-mono text-cyan-100 [overflow-wrap:anywhere]">
                  {recentTransaction.recipient}
                </p>
                <p className="rounded-lg border border-line/55 bg-paper p-3 font-mono text-violet-100/80 [overflow-wrap:anywhere]">
                  {recentTransaction.hash}
                </p>
                <a
                  className="inline-flex font-semibold text-cyan-300 underline-offset-4 hover:underline"
                  href={getTestnetExplorerUrl(recentTransaction.hash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  View latest transaction
                </a>
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-5 lg:col-span-2 xl:col-span-1">
          <div className="rounded-lg border border-line/50 bg-[#101124]/80 p-4 shadow-panel">
            <p className="section-eyebrow">Step 3</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">Track activity</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              View payment totals, filter recent transactions, and open hashes in Stellar Expert.
            </p>
          </div>
          <PaymentActivityChart items={paymentHistory} isConnected={isConnected} />
          <TransactionHistory
            items={paymentHistory}
            isLoading={isHistoryLoading}
            error={historyError}
            isConnected={isConnected}
            onRefresh={refreshPaymentHistory}
          />
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

      {pendingPayment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050611]/75 p-4 backdrop-blur-sm">
          <section className="w-full max-w-lg rounded-lg border border-line/60 bg-[#121327] p-5 shadow-panel">
            <div className="mb-5">
              <p className="section-eyebrow">Preview</p>
              <h2 className="mt-1 text-xl font-semibold text-ink">Review Transaction</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-line/55 bg-paper p-3">
                <p className="font-medium text-violet-200/70">Recipient</p>
                <p className="mt-1 break-all font-mono text-cyan-100">{pendingPayment.recipient}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-line/55 bg-paper p-3">
                  <p className="font-medium text-violet-200/70">Amount</p>
                  <p className="mt-1 font-semibold text-ink">{pendingPayment.amount} XLM</p>
                </div>
                <div className="rounded-lg border border-line/55 bg-paper p-3">
                  <p className="font-medium text-violet-200/70">Network</p>
                  <p className="mt-1 font-semibold text-ink">{freighterNetwork ?? "Testnet"}</p>
                </div>
                <div className="rounded-lg border border-line/55 bg-paper p-3">
                  <p className="font-medium text-violet-200/70">Estimated fee</p>
                  <p className="mt-1 font-semibold text-ink">{ESTIMATED_FEE_XLM} XLM</p>
                </div>
              </div>
              {pendingPayment.memo ? (
                <div className="rounded-lg border border-line/55 bg-paper p-3">
                  <p className="font-medium text-violet-200/70">Memo</p>
                  <p className="mt-1 text-cyan-100">{pendingPayment.memo}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button className="button-secondary flex-1 justify-center" type="button" onClick={() => setPendingPayment(null)}>
                Cancel
              </button>
              <button
                className="button-primary flex-1 justify-center"
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
