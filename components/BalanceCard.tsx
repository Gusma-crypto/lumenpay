import { Coins, RefreshCw, WalletCards } from "lucide-react";
import type { IssuedAssetBalance } from "@/lib/stellar";

type BalanceCardProps = {
  balance: string | null;
  assets: IssuedAssetBalance[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  publicKey: string | null;
  onRefresh: () => void;
};

function formatBalance(balance: string) {
  const parsed = Number.parseFloat(balance);

  if (!Number.isFinite(parsed)) {
    return balance;
  }

  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7
  });
}

export function BalanceCard(props: BalanceCardProps) {
  const hasAssets = props.assets.length > 0;
  const friendbotUrl = props.publicKey
    ? `https://friendbot.stellar.org?addr=${encodeURIComponent(props.publicKey)}`
    : null;

  return (
    <section className="panel-card">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Balance</p>
          <h2 className="text-xl font-semibold text-ink">Stellar Testnet Balance</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={props.onRefresh}
          disabled={!props.isConnected || props.isLoading}
          aria-label="Refresh balance"
          title="Refresh balance"
        >
          <RefreshCw size={18} aria-hidden="true" className={props.isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {props.isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-28 rounded-lg border border-line bg-paper" />
          <div className="h-16 w-2/3 rounded-lg bg-paper" />
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-line/60 bg-gradient-to-br from-cyan-400/15 via-[#121327] to-violet-500/18 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-violet-200/75">Available XLM</p>
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-line/50 bg-cyan-400/10 text-cyan-300 shadow-sm">
                <Coins size={18} aria-hidden="true" />
              </div>
            </div>
            <p className="mt-3 break-words text-4xl font-semibold text-ink sm:text-5xl">
              {props.balance ? formatBalance(props.balance) : "--"}
              <span className="ml-2 text-lg font-medium text-violet-200/70">XLM</span>
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-line/50 bg-[#090a18]/70 px-3 py-2 text-xs font-semibold text-cyan-100">
              <WalletCards size={15} aria-hidden="true" />
              Testnet account reserve applies
            </div>
          </div>

          {hasAssets ? (
            <div className="mt-4">
              <p className="mb-3 text-sm font-medium text-violet-200/70">Other Assets</p>
              <div className="space-y-2">
                {props.assets.map((asset) => (
                  <div
                    className="flex items-center justify-between gap-4 rounded-lg border border-line bg-paper p-4"
                    key={`${asset.code}-${asset.issuer}`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{asset.code}</p>
                      <p className="mt-1 truncate font-mono text-xs text-violet-200/60" title={asset.issuer}>
                        {asset.issuer}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-base font-semibold text-ink">
                      {formatBalance(asset.balance)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      {props.error ? (
        <div className="mt-4 space-y-3 rounded-lg border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-200">
          <p>{props.error}</p>
          {friendbotUrl ? (
            <a className="button-secondary min-h-10 justify-center" href={friendbotUrl} target="_blank" rel="noreferrer">
              Fund with Testnet Friendbot
            </a>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 text-sm leading-6 text-violet-100/70">
          <p>Keep at least 1 XLM available for Stellar account reserves and fees.</p>
          {friendbotUrl ? (
            <a className="inline-flex font-semibold text-cyan-300 underline-offset-4 hover:underline" href={friendbotUrl} target="_blank" rel="noreferrer">
              Need testnet XLM? Open Friendbot
            </a>
          ) : null}
        </div>
      )}
    </section>
  );
}
