"use client";

import { Activity, CheckCircle2, Clock3, ExternalLink, RefreshCw, XCircle } from "lucide-react";
import { ContractCallStatus, ContractPaymentEvent, CONTRACT_CONFIGURED, TRACKER_CONTRACT_ID } from "@/lib/contract";
import { getTestnetExplorerUrl, shortenPublicKey } from "@/lib/explorer";

type Props = {
  events: ContractPaymentEvent[];
  isLoading: boolean;
  error: string | null;
  callStatus: ContractCallStatus;
  callHash: string | null;
  onRefresh: () => void;
};

export function LiveContractActivity(props: Props) {
  const status = {
    idle: { icon: Activity, label: "Ready", className: "text-violet-200" },
    pending: { icon: Clock3, label: "Contract pending", className: "text-amber-200" },
    success: { icon: CheckCircle2, label: "Contract synced", className: "text-cyan-200" },
    failed: { icon: XCircle, label: "Contract failed", className: "text-red-200" },
    skipped: { icon: Activity, label: "Awaiting deployment", className: "text-violet-200" }
  }[props.callStatus];
  const StatusIcon = status.icon;

  return (
    <section className="panel-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-eyebrow">Soroban events</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">Live Payment Activity</h2>
          <p className="mt-2 text-sm leading-6 text-violet-100/70">
            Contract events refresh every 6 seconds and after every recorded payment.
          </p>
        </div>
        <button className="icon-button" type="button" onClick={props.onRefresh} disabled={props.isLoading} aria-label="Refresh events">
          <RefreshCw className={props.isLoading ? "animate-spin" : ""} size={18} />
        </button>
      </div>

      <div className={`mt-4 flex items-center gap-2 rounded-lg border border-line/50 bg-paper p-3 text-sm ${status.className}`}>
        <StatusIcon size={17} />
        <span className="font-semibold">{status.label}</span>
        {props.callHash ? (
          <a className="ml-auto inline-flex items-center gap-1 hover:underline" href={getTestnetExplorerUrl(props.callHash)} target="_blank" rel="noreferrer">
            Explorer <ExternalLink size={14} />
          </a>
        ) : null}
      </div>

      {!CONTRACT_CONFIGURED ? (
        <div className="mt-4 rounded-lg border border-amber-300/35 bg-amber-950/25 p-4 text-sm leading-6 text-amber-100">
          Deploy the included contract, then set <code>NEXT_PUBLIC_TRACKER_CONTRACT_ID</code> to activate writes and live events.
        </div>
      ) : props.error ? (
        <div className="mt-4 rounded-lg border border-red-400/40 bg-red-950/35 p-3 text-sm text-red-200">{props.error}</div>
      ) : props.events.length === 0 ? (
        <p className="mt-4 rounded-lg border border-line/50 bg-paper p-4 text-sm text-violet-100/70">
          No payment events found for this contract yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {props.events.slice(0, 6).map((event) => (
            <article key={event.id} className="rounded-lg border border-line/50 bg-paper p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-cyan-100">{event.amount} XLM</span>
                <span className="text-xs text-violet-200/70">Ledger {event.ledger}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-violet-100/80">
                {shortenPublicKey(event.sender)} → {shortenPublicKey(event.recipient)}
              </p>
              <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:underline" href={getTestnetExplorerUrl(event.contractHash)} target="_blank" rel="noreferrer">
                Contract transaction <ExternalLink size={13} />
              </a>
            </article>
          ))}
        </div>
      )}

      {CONTRACT_CONFIGURED ? (
        <p className="mt-4 break-all font-mono text-[11px] text-violet-200/55">Contract: {TRACKER_CONTRACT_ID}</p>
      ) : null}
    </section>
  );
}
