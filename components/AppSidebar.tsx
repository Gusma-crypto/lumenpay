"use client";

import {
  Activity,
  Boxes,
  CircleUserRound,
  Info,
  LayoutDashboard,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
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
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
  onNavigate: (section: string) => void;
  publicKey: string | null;
  walletName: string | null;
};

export function AppSidebar({ activeSection, isOpen, isCollapsed, onClose, onToggleCollapsed, onNavigate, publicKey, walletName }: Props) {
  return (
    <>
      {isOpen ? <button className="sidebar-backdrop" type="button" onClick={onClose} aria-label="Close menu" /> : null}
      <aside className={`app-sidebar ${isOpen ? "is-open" : ""} ${isCollapsed ? "is-collapsed" : ""}`}>
        <div className="sidebar-brand">
          <img className="brand-logo" src="/logo.png" alt="LumenPay logo" />
          <span>LumenPay</span>
          <small>Lite</small>
          <button
            className="sidebar-collapse-toggle"
            type="button"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
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
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={19} />
              <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button className="sidebar-account-card" type="button" onClick={() => onNavigate("wallets")} title={isCollapsed ? (publicKey ? shortenPublicKey(publicKey) : "Connect wallet") : undefined}>
            <CircleUserRound size={33} />
            <div>
              <strong>{publicKey ? (walletName ?? "Connected Wallet") : "Not Connected"}</strong>
              <small>{publicKey ? shortenPublicKey(publicKey) : "Connect your wallet to get started"}</small>
            </div>
            <MoreVertical size={17} />
          </button>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navItems.filter((item) => ["dashboard", "send-payment", "activity", "wallets", "settings"].includes(item.id)).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeSection === item.id ? "active" : ""}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={19} />
              <span>{item.id === "send-payment" ? "Send" : item.id === "wallets" ? "Wallets" : item.label.replace(" Feed", "")}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
