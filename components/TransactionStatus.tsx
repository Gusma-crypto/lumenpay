import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { getTestnetExplorerUrl } from "@/lib/explorer";
import type { TransactionResult } from "@/app/page";

type TransactionStatusProps = {
  result: TransactionResult;
};

export function TransactionStatus(props: TransactionStatusProps) {
  const { result } = props;

  if (result.status === "idle") {
    return (
      <section className="panel-card">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-line/50 bg-violet-400/10 text-violet-200">
            <Clock size={19} aria-hidden="true" />
          </div>
          <div>
            <p className="section-eyebrow">Transaction</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">Waiting for Payment</h2>
          </div>
        </div>
        <p className="mt-4 rounded-lg border border-line/55 bg-paper p-3 text-sm leading-6 text-violet-100/70">
          Transaction feedback will appear here after you send an XLM testnet payment.
        </p>
      </section>
    );
  }

  const isSuccess = result.status === "success";
  const isError = result.status === "error";
  const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Clock;
  const statusClass = isSuccess ? "success" : isError ? "error" : "pending";
  const statusTitle =
    result.status === "signing"
      ? "Pending..."
      : result.status === "submitting"
        ? "Submitting..."
        : isSuccess
          ? "Success"
          : "Failed";

  return (
    <section className={`transaction-status-card ${statusClass}`}>
      <div className="flex items-start gap-3">
        <div className="transaction-status-icon">
          <Icon size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="transaction-status-title">{statusTitle}</p>
          {result.message ? <p className="transaction-status-message">{result.message}</p> : null}
          {result.hash ? (
            <div className="transaction-status-links">
              <p className="transaction-hash">
                {result.hash}
              </p>
              <a
                className="transaction-explorer-link"
                href={getTestnetExplorerUrl(result.hash)}
                target="_blank"
                rel="noreferrer"
              >
                View on Stellar Expert Testnet
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
