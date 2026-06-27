"use client";

import { useCallback, useEffect, useState } from "react";
import { AddressBook } from "@/components/AddressBook";
import { AppHeader } from "@/components/AppHeader";
import { BalanceCard } from "@/components/BalanceCard";
import { PaymentActivityChart } from "@/components/PaymentActivityChart";
import { PaymentForm } from "@/components/PaymentForm";
import { TransactionHistory } from "@/components/TransactionHistory";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletPanel } from "@/components/WalletPanel";
import { getTestnetExplorerUrl } from "@/lib/explorer";
import { getFreighterNetworkDetails, isFreighterAvailable, requestFreighterPublicKey, signWithFreighter } from "@/lib/freighter";
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

  const isConnected = walletStatus === "connected" && Boolean(publicKey);
  const isSubmitting = transactionResult.status === "signing" || transactionResult.status === "submitting";
  const isFreighterTestnet = freighterNetworkPassphrase === NETWORK_PASSPHRASE;

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

  async function connectWallet() {
    setWalletStatus("connecting");
    setWalletError(null);

    try {
      const available = await isFreighterAvailable();
      if (!available) {
        throw new Error("Freighter wallet is not available. Install Freighter and switch to Testnet.");
      }

      const walletPublicKey = await requestFreighterPublicKey();
      const networkDetails = await getFreighterNetworkDetails();

      setPublicKey(walletPublicKey);
      setFreighterNetwork(networkDetails.network);
      setFreighterNetworkPassphrase(networkDetails.networkPassphrase);
      setWalletStatus("connected");
    } catch (error) {
      setPublicKey(null);
      setFreighterNetwork(null);
      setFreighterNetworkPassphrase(null);
      setWalletStatus("error");
      setWalletError(error instanceof Error ? error.message : "Failed to connect wallet.");
    }
  }

  function disconnectWallet() {
    setPublicKey(null);
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
      const networkDetails = await getFreighterNetworkDetails();
      setFreighterNetwork(networkDetails.network);
      setFreighterNetworkPassphrase(networkDetails.networkPassphrase);

      if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
        setTransactionResult({ status: "error", message: "Switch Freighter to Testnet." });
        return;
      }

      setTransactionResult({ status: "idle" });
    } catch (error) {
      setTransactionResult({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to read Freighter network."
      });
    }
  }

  async function reviewPayment(destinationPublicKey: string, amount: string, memo: string) {
    if (!publicKey) {
      setTransactionResult({ status: "error", message: "Connect your Freighter wallet first." });
      return;
    }

    const networkDetails = await getFreighterNetworkDetails();
    setFreighterNetwork(networkDetails.network);
    setFreighterNetworkPassphrase(networkDetails.networkPassphrase);

    if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
      setTransactionResult({
        status: "error",
        message: "Switch Freighter to Testnet."
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
  }

  async function sendPayment(destinationPublicKey: string, amount: string, memo: string) {
    if (!publicKey) {
      setTransactionResult({ status: "error", message: "Connect your Freighter wallet first." });
      return;
    }

    const networkDetails = await getFreighterNetworkDetails();
    setFreighterNetwork(networkDetails.network);
    setFreighterNetworkPassphrase(networkDetails.networkPassphrase);

    if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
      setTransactionResult({ status: "error", message: "Switch Freighter to Testnet." });
      return;
    }

    if (destinationPublicKey.trim().toUpperCase() === publicKey.trim().toUpperCase()) {
      setTransactionResult({ status: "error", message: "You cannot send XLM to your own wallet address." });
      return;
    }

    try {
      setTransactionResult({ status: "signing", message: "Waiting for Freighter approval..." });

      const transaction = await buildXlmPaymentTransaction({
        sourcePublicKey: publicKey,
        destinationPublicKey,
        amount,
        memo
      });

      const signedXdr = await signWithFreighter(transaction.toXDR(), publicKey);

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

      await refreshBalance();
      await refreshPaymentHistory();
    } catch (error) {
      setTransactionResult({
        status: "error",
        message: getStellarErrorMessage(error)
      });
    }
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <AppHeader theme={theme} onToggleTheme={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))} />

      <section className="mx-auto grid w-full max-w-[1380px] gap-5 px-4 py-5 md:px-6 lg:grid-cols-2 xl:grid-cols-3 xl:items-start">
        <div className="space-y-5">
          <div className="rounded-lg border border-line/50 bg-[#101124]/80 p-4 shadow-panel">
            <p className="section-eyebrow">Step 1</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">Connect and check balance</h2>
            <p className="mt-2 text-sm leading-6 text-violet-100/70">
              Start with Freighter on Stellar Testnet, then confirm your available XLM.
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
                <p className="rounded-lg border border-line/55 bg-paper p-3 font-mono text-cyan-100">
                  {recentTransaction.recipient}
                </p>
                <p className="rounded-lg border border-line/55 bg-paper p-3 break-all font-mono text-violet-100/80">
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
