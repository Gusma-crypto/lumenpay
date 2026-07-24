"use client";

import {
  Activity,
  Boxes,
  CircleUserRound,
  Info,
  LayoutDashboard,
  MoreVertical,
  Send,
  Settings,
  WalletCards,
  X
} from "lucide-react";
import { shortenPublicKey } from "@/lib/explorer";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "send-payment", label: "Send Payment", icon: Send },
  { id: "activity", label: "Activity Feed", icon: Activity },
  { id: "wallets", label: "My Wallets", icon: WalletCards },
  { id: "contracts", label: "Contracts", icon: Boxes },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "about", label: "About", icon: Info }
];

type Props = {
  activeSection: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  publicKey: string | null;
  walletName: string | null;
};

export function AppSidebar({ activeSection, isOpen, onClose, onNavigate, publicKey, walletName }: Props) {
  return (
    <>
      {isOpen ? <button className="sidebar-backdrop" type="button" onClick={onClose} aria-label="Close menu" /> : null}
      <aside className={`app-sidebar ${isOpen ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <img className="brand-logo" src="/logo.png" alt="LumenPay logo" />
          <span>LumenPay</span>
          <small>Lite</small>
          <button className="sidebar-close" type="button" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeSection === item.id ? "active" : ""}
                type="button"
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="sidebar-account-card" type="button" onClick={() => onNavigate("wallets")}>
            <CircleUserRound size={33} />
            <div>
              <strong>{publicKey ? (walletName ?? "Connected Wallet") : "Not Connected"}</strong>
              <small>{publicKey ? shortenPublicKey(publicKey) : "Connect your wallet to get started"}</small>
            </div>
            <MoreVertical size={17} />
          </button>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeSection === item.id ? "active" : ""}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={19} />
              <span>{item.label.replace(" Payment", "")}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
