import { Bell, ChevronDown, LogOut, Menu, Plug, Sun } from "lucide-react";
import { shortenPublicKey } from "@/lib/explorer";

type AppHeaderProps = {
  theme: "dark" | "light";
  publicKey: string | null;
  walletStatus: "disconnected" | "connecting" | "connected" | "error";
  onToggleTheme: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onMenuOpen?: () => void;
  onNotifications: () => void;
};

export function AppHeader(props: AppHeaderProps) {
  const isConnected = props.walletStatus === "connected" && Boolean(props.publicKey);
  const isConnecting = props.walletStatus === "connecting";

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button className="mobile-menu-button" type="button" onClick={props.onMenuOpen} aria-label="Open navigation">
          <Menu size={21} />
        </button>
        <div className="mobile-topbar-brand">
          <img src="/logo.png" alt="" />
          <strong>LumenPay</strong>
          <small>Lite</small>
        </div>
        <div className="network-pill">
          <span />
          Stellar Testnet
          <ChevronDown size={15} />
        </div>
      </div>
      <div className="topbar-actions">
          {isConnected && props.publicKey ? (
            <button
              className="wallet-chip"
              type="button"
              onClick={props.onDisconnect}
              title="Disconnect wallet"
            >
              <LogOut size={17} aria-hidden="true" />
              <span className="font-mono">{shortenPublicKey(props.publicKey)}</span>
            </button>
          ) : (
            <button
              className="connect-wallet-button"
              type="button"
              onClick={() => props.onConnect()}
              disabled={isConnecting}
            >
              <Plug size={17} aria-hidden="true" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
          <button className="topbar-icon" type="button" onClick={props.onToggleTheme} aria-label="Toggle theme">
            <Sun size={20} />
          </button>
          <button className="topbar-icon" type="button" onClick={props.onNotifications} aria-label="Notifications">
            <Bell size={20} />
          </button>
      </div>
    </header>
  );
}
