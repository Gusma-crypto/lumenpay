import { BadgeDollarSign, LogOut, Moon, Plug, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { shortenPublicKey } from "@/lib/explorer";

type AppHeaderProps = {
  theme: "dark" | "light";
  publicKey: string | null;
  walletStatus: "disconnected" | "connecting" | "connected" | "error";
  onToggleTheme: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function AppHeader(props: AppHeaderProps) {
  const isConnected = props.walletStatus === "connected" && Boolean(props.publicKey);
  const isConnecting = props.walletStatus === "connecting";

  return (
    <header className="border-b border-line/40 bg-[#080913]/80 px-5 py-5 backdrop-blur md:px-8">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg border border-line/50 bg-gradient-to-br from-cyan-400 to-violet-500 text-[#070812] shadow-panel">
            <BadgeDollarSign size={25} aria-hidden="true" />
          </div>
          <div>
            <p className="section-eyebrow">Stellar Testnet</p>
            <h1 className="text-2xl font-semibold text-ink">LumenPay Lite</h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-cyan-100 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 rounded-lg border border-line/50 bg-[#111226]/85 px-3 py-2 shadow-sm">
            <ShieldCheck size={17} aria-hidden="true" className="text-mint" />
            Multi-wallet
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-line/50 bg-[#111226]/85 px-3 py-2 shadow-sm">
            <Sparkles size={17} aria-hidden="true" className="text-amber" />
            Testnet payments
          </div>
          {isConnected && props.publicKey ? (
            <button
              className="button-secondary min-w-0 justify-center"
              type="button"
              onClick={props.onDisconnect}
              title="Disconnect wallet"
            >
              <LogOut size={17} aria-hidden="true" />
              <span className="font-mono">{shortenPublicKey(props.publicKey)}</span>
            </button>
          ) : (
            <button
              className="button-primary justify-center"
              type="button"
              onClick={props.onConnect}
              disabled={isConnecting}
            >
              <Plug size={17} aria-hidden="true" />
              {isConnecting ? "Connecting" : "Choose wallet"}
            </button>
          )}
          <button className="icon-button" type="button" onClick={props.onToggleTheme} aria-label="Toggle theme" title="Toggle theme">
            {props.theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
