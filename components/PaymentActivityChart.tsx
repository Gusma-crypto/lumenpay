import { BarChart3, TrendingUp } from "lucide-react";
import type { PaymentHistoryItem } from "@/lib/stellar";

type PaymentActivityChartProps = {
  items: PaymentHistoryItem[];
  isConnected: boolean;
};

function sumXlm(items: PaymentHistoryItem[], direction: PaymentHistoryItem["direction"]) {
  return items
    .filter((item) => item.asset === "XLM" && item.direction === direction)
    .reduce((total, item) => total + (Number.parseFloat(item.amount) || 0), 0);
}

function formatAmount(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 4
  });
}

export function PaymentActivityChart(props: PaymentActivityChartProps) {
  const recentItems = props.items.slice(0, 7);
  const sentTotal = sumXlm(props.items, "sent");
  const receivedTotal = sumXlm(props.items, "received");
  const maxAmount = Math.max(1, ...recentItems.map((item) => Number.parseFloat(item.amount) || 0));

  return (
    <section className="panel-card">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Graph</p>
          <h2 className="text-xl font-semibold text-ink">Transaction Activity</h2>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-line/50 bg-cyan-400/10 text-cyan-300">
          <BarChart3 size={21} aria-hidden="true" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line/50 bg-paper p-4">
          <p className="text-xs font-semibold uppercase text-violet-200/55">Total tx</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{props.items.length}</p>
        </div>
        <div className="rounded-lg border border-violet-300/35 bg-violet-400/10 p-4">
          <p className="text-xs font-semibold uppercase text-violet-200/60">Sent</p>
          <p className="mt-2 text-2xl font-semibold text-violet-50">{formatAmount(sentTotal)} XLM</p>
        </div>
        <div className="rounded-lg border border-cyan-300/35 bg-cyan-400/10 p-4">
          <p className="text-xs font-semibold uppercase text-cyan-100/70">Received</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-50">{formatAmount(receivedTotal)} XLM</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-line/55 bg-paper p-4">
        {props.isConnected && recentItems.length > 0 ? (
          <div className="flex h-40 items-end gap-3">
            {recentItems.map((item) => {
              const amount = Number.parseFloat(item.amount) || 0;
              const height = Math.max(10, (amount / maxAmount) * 100);

              return (
                <div className="flex flex-1 flex-col items-center gap-2" key={item.id}>
                  <div className="flex h-28 w-full items-end rounded-lg border border-line/45 bg-[#080913] p-1">
                    <div
                      className={`w-full rounded-md ${
                        item.direction === "sent"
                          ? "bg-gradient-to-t from-violet-500 to-violet-200"
                          : "bg-gradient-to-t from-cyan-500 to-cyan-200"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-violet-100/60">{item.direction === "sent" ? "Out" : "In"}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed border-line/55 bg-[#080913]/60 p-5 text-center">
            <div>
              <TrendingUp className="mx-auto text-cyan-300" size={24} aria-hidden="true" />
              <p className="mt-3 text-sm leading-6 text-violet-100/70">
                {props.isConnected ? "Send or receive Testnet XLM to populate the graph." : "Connect wallet to view transaction graph."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
