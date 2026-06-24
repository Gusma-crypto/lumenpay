"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ExternalLink, RefreshCw, Search } from "lucide-react";
import { getTestnetExplorerUrl, shortenPublicKey } from "@/lib/explorer";
import type { PaymentHistoryItem } from "@/lib/stellar";

type TransactionHistoryProps = {
  items: PaymentHistoryItem[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  onRefresh: () => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function TransactionHistory(props: TransactionHistoryProps) {
  const [query, setQuery] = useState("");
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return props.items;
    }

    return props.items.filter((item) =>
      [item.amount, item.asset, item.from, item.to, item.hash, item.direction]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [props.items, query]);

  return (
    <section className="panel-card">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Monitoring</p>
          <h2 className="text-xl font-semibold text-ink">Transaction History</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={props.onRefresh}
          disabled={!props.isConnected || props.isLoading}
          aria-label="Refresh transaction history"
          title="Refresh transaction history"
        >
          <RefreshCw size={18} aria-hidden="true" className={props.isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {props.error ? (
        <div className="rounded-lg border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-200">
          {props.error}
        </div>
      ) : null}

      {!props.error ? (
        <div className="mb-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-200/55"
              size={17}
              aria-hidden="true"
            />
            <input
              className="form-input min-h-11 pl-10 text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions"
              disabled={!props.isConnected || props.isLoading || props.items.length === 0}
            />
          </div>
        </div>
      ) : null}

      {!props.error && props.isLoading ? (
        <div className="space-y-3">
          <div className="h-16 animate-pulse rounded-lg border border-line/55 bg-paper" />
          <div className="h-16 animate-pulse rounded-lg border border-line/55 bg-paper" />
          <div className="h-16 animate-pulse rounded-lg border border-line/55 bg-paper" />
        </div>
      ) : null}

      {!props.error && !props.isLoading && props.items.length === 0 ? (
        <p className="rounded-lg border border-line/55 bg-paper p-4 text-sm leading-6 text-violet-100/70">
          {props.isConnected
            ? "No payment history found for this Testnet wallet yet."
            : "Connect a Freighter wallet to monitor Testnet payment history."}
        </p>
      ) : null}

      {!props.error && !props.isLoading && props.items.length > 0 && filteredItems.length === 0 ? (
        <p className="rounded-lg border border-line/55 bg-paper p-4 text-sm leading-6 text-violet-100/70">
          No matching transactions found.
        </p>
      ) : null}

      {!props.error && !props.isLoading && filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isSent = item.direction === "sent";
            const Icon = isSent ? ArrowUpRight : ArrowDownLeft;
            const counterparty = isSent ? item.to : item.from;

            return (
              <div className="rounded-lg border border-line/55 bg-paper p-4" key={item.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${
                        isSent
                          ? "border-violet-300/45 bg-violet-400/10 text-violet-100"
                          : "border-cyan-300/45 bg-cyan-400/10 text-cyan-100"
                      }`}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">
                        {isSent ? "Sent" : "Received"} {item.amount} {item.asset}
                      </p>
                      <p className="mt-1 truncate font-mono text-xs text-violet-100/60" title={counterparty}>
                        {isSent ? "To" : "From"} {shortenPublicKey(counterparty)}
                      </p>
                      <p className="mt-1 text-xs text-violet-100/55">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <a
                    className="shrink-0 text-cyan-300 transition hover:text-cyan-100"
                    href={getTestnetExplorerUrl(item.hash)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open transaction in explorer"
                    title="Open transaction in explorer"
                  >
                    <ExternalLink size={17} aria-hidden="true" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
