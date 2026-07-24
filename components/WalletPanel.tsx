"use client";

import { AlertTriangle, CheckCircle2, Copy, LogOut, QrCode, RefreshCw, Wallet, WifiOff, X } from "lucide-react";
import { useState } from "react";
import { shortenPublicKey } from "@/lib/explorer";
import type { WalletOption } from "@/lib/wallets";

type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

type WalletPanelProps = {
  publicKey: string | null;
  status: WalletStatus;
  error: string | null;
  networkName: string | null;
  isTestnet: boolean;
  onRefreshNetwork: () => void;
  onConnect: (walletId?: string) => void;
  onDisconnect: () => void;
  wallets: WalletOption[];
  walletName: string | null;
};

export function WalletPanel(props: WalletPanelProps) {
  const [isSwitchHelpOpen, setIsSwitchHelpOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy");
  const isConnected = props.status === "connected" && props.publicKey;
  const isConnecting = props.status === "connecting";
  const StatusIcon = isConnected ? CheckCircle2 : WifiOff;

  return (
    <section className="panel-card">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="section-eyebrow">Wallet</p>
          <h2 className="text-xl font-semibold text-ink">Multi-wallet Connection</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-violet-100/70">
            Connect with StellarWalletsKit, confirm Testnet, then use your preferred wallet to send XLM.
          </p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-line/50 bg-cyan-400/10 text-cyan-300 shadow-sm">
          <Wallet size={22} aria-hidden="true" />
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line/45 bg-[#090a18] p-3">
          <p className="text-xs font-semibold uppercase text-violet-200/55">Wallet Security</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">{props.walletName ?? "Wallet signed"}</p>
        </div>
        <div className="rounded-lg border border-line/45 bg-[#090a18] p-3">
          <p className="text-xs font-semibold uppercase text-violet-200/55">Network Status</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">{props.isTestnet ? "Testnet ready" : "Needs Testnet"}</p>
        </div>
        <div className="rounded-lg border border-line/45 bg-[#090a18] p-3">
          <p className="text-xs font-semibold uppercase text-violet-200/55">Payment Asset</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">Native XLM</p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-line bg-paper p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-violet-200/70">Status</p>
            <p className="mt-1 text-base font-semibold text-ink">
              {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
            </p>
          </div>
          <div
            className={`grid h-10 w-10 place-items-center rounded-lg ${
              isConnected ? "bg-cyan-400/15 text-cyan-300" : "bg-violet-400/10 text-violet-200"
            }`}
          >
            <StatusIcon size={19} aria-hidden="true" />
          </div>
        </div>
        {props.publicKey ? (
          <div className="mt-3 rounded-lg border border-line/55 bg-[#090a18] p-3">
            <p className="break-all font-mono text-sm text-cyan-100" title={props.publicKey}>
              {shortenPublicKey(props.publicKey)}
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                className="button-secondary min-h-10 justify-center px-3 py-2 text-xs"
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(props.publicKey ?? "");
                  setCopyLabel("Copied");
                  window.setTimeout(() => setCopyLabel("Copy"), 1200);
                }}
              >
                <Copy size={15} aria-hidden="true" />
                {copyLabel}
              </button>
              <button
                className="button-secondary min-h-10 justify-center px-3 py-2 text-xs"
                type="button"
                onClick={() => setIsQrOpen(true)}
              >
                <QrCode size={15} aria-hidden="true" />
                QR
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-violet-100/70">Choose a Stellar wallet on Testnet.</p>
        )}
      </div>

      {!isConnected ? (
        <div className="mb-5">
          <p className="mb-3 text-sm font-semibold text-cyan-100">Available wallet options</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {props.wallets.slice(0, 8).map((wallet) => (
              <button
                key={wallet.id}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-line/55 bg-[#090a18] p-3 text-left transition hover:border-cyan-300 hover:bg-[#11132a] disabled:hover:border-line/55"
                type="button"
                onClick={() => props.onConnect(wallet.id)}
                disabled={isConnecting}
                title={wallet.isAvailable ? `Connect ${wallet.name}` : `${wallet.name} is not detected`}
              >
                <img className="h-8 w-8 rounded-md" src={wallet.icon} alt="" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{wallet.name}</span>
                  <span className={`block text-xs ${wallet.isAvailable ? "text-cyan-300" : "text-violet-200/55"}`}>
                    {wallet.isAvailable ? "Ready" : "Not detected"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {props.wallets.length === 0 ? (
            <button className="button-primary w-full justify-center" type="button" onClick={() => props.onConnect()} disabled={isConnecting}>
              <Wallet size={18} />
              {isConnecting ? "Checking wallets..." : "Check wallet options"}
            </button>
          ) : null}
        </div>
      ) : null}

      {isConnected ? (
        <div
          className={`mb-5 flex items-start gap-3 rounded-lg border p-3 text-sm ${
            props.isTestnet
              ? "border-cyan-300/45 bg-cyan-950/25 text-cyan-100"
              : "border-amber-300/45 bg-amber-950/25 text-amber-100"
          }`}
        >
          {props.isTestnet ? (
            <CheckCircle2 className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 shrink-0" size={17} aria-hidden="true" />
          )}
          <div>
            <p className="font-semibold">{props.isTestnet ? "Wallet is on Testnet" : "Switch wallet to Testnet"}</p>
            <p className="mt-1 text-violet-100/70">
              Current network: {props.networkName ?? "Unknown"}
            </p>
            {!props.isTestnet ? (
              <button
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300/45 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15"
                type="button"
                onClick={() => setIsSwitchHelpOpen(true)}
              >
                Switch to Testnet
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {props.error ? (
        <div className="mb-5 rounded-lg border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-200">
          {props.error}
        </div>
      ) : null}

      {isConnected ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="button-secondary" type="button" onClick={props.onDisconnect}>
            <LogOut size={18} aria-hidden="true" />
            Disconnect
          </button>
        </div>
      ) : null}

      {isSwitchHelpOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050611]/75 p-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-lg border border-line/60 bg-[#121327] p-5 shadow-panel">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-amber-300/45 bg-amber-300/10 text-amber-100">
                <AlertTriangle size={19} aria-hidden="true" />
              </div>
              <div>
                <p className="section-eyebrow">Network Guard</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">Switch wallet to Testnet</h3>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-line/55 bg-paper p-4 text-sm leading-6 text-violet-100/80">
              <p>1. Open your connected wallet.</p>
              <p>2. Open Settings or the network selector.</p>
              <p>3. Change network from PUBLIC/Mainnet to Testnet.</p>
              <p>4. Return here and refresh the network status.</p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button className="button-secondary flex-1 justify-center" type="button" onClick={() => setIsSwitchHelpOpen(false)}>
                Close
              </button>
              <button
                className="button-primary flex-1 justify-center"
                type="button"
                onClick={() => {
                  props.onRefreshNetwork();
                  setIsSwitchHelpOpen(false);
                }}
              >
                <RefreshCw size={17} aria-hidden="true" />
                I switched to Testnet
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isQrOpen && props.publicKey ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050611]/75 p-4 backdrop-blur-sm">
          <section className="w-full max-w-sm rounded-lg border border-line/60 bg-[#121327] p-5 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="section-eyebrow">Wallet Address</p>
                <h3 className="text-lg font-semibold text-ink">Receive QR</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsQrOpen(false)} aria-label="Close address QR">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="rounded-lg border border-line/55 bg-white p-4">
              <img
                className="mx-auto h-48 w-48"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(props.publicKey)}`}
                alt="Connected wallet address QR code"
              />
            </div>
            <p className="mt-4 break-all rounded-lg border border-line/55 bg-paper p-3 font-mono text-xs text-cyan-100">
              {props.publicKey}
            </p>
          </section>
        </div>
      ) : null}
    </section>
  );
}
