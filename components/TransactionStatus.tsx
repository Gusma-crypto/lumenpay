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

  return (
    <section
      className={`rounded-lg border p-5 shadow-panel ring-1 ring-cyan-300/10 ${
        isSuccess
          ? "border-cyan-300/50 bg-cyan-950/35"
          : isError
            ? "border-red-400/50 bg-red-950/35"
            : "border-violet-300/50 bg-violet-950/35"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${
            isSuccess ? "bg-cyan-400/15 text-cyan-300" : isError ? "bg-red-400/15 text-red-200" : "bg-violet-400/15 text-violet-200"
          }`}
        >
          <Icon size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-ink">
            {isSuccess ? "Transaction Successful" : isError ? "Transaction Failed" : "Transaction Pending"}
          </p>
          {result.message ? <p className="mt-1 text-sm leading-6 text-violet-100/75">{result.message}</p> : null}
          {result.hash ? (
            <div className="mt-3 space-y-2">
              <p className="rounded-lg border border-line/55 bg-[#090a18]/75 p-3 break-all font-mono text-sm text-cyan-100">
                {result.hash}
              </p>
              <a
                className="inline-flex text-sm font-semibold text-brand underline-offset-4 hover:underline"
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
