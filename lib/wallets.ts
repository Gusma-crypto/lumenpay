"use client";

import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";
import { NETWORK_PASSPHRASE } from "./stellar";

export type WalletOption = {
  id: string;
  name: string;
  icon: string;
  url: string;
  isAvailable: boolean;
};

let initialized = false;
let walletModules: ReturnType<typeof defaultModules> = [];

function ensureWalletKit() {
  if (!initialized) {
    walletModules = defaultModules();
    StellarWalletsKit.init({
      modules: walletModules,
      network: Networks.TESTNET,
      authModal: {
        showInstallLabel: true,
        hideUnsupportedWallets: false
      }
    });
    initialized = true;
  }

  return StellarWalletsKit;
}

export async function listWallets(): Promise<WalletOption[]> {
  ensureWalletKit();
  return Promise.all(
    walletModules.map(async (wallet) => ({
      id: wallet.productId,
      name: wallet.productName,
      icon: wallet.productIcon,
      url: wallet.productUrl,
      isAvailable: await wallet.isAvailable().catch(() => false)
    }))
  );
}

export async function connectWallet(walletId: string) {
  const kit = ensureWalletKit();
  kit.setWallet(walletId);
  const selected = (await kit.refreshSupportedWallets()).find((wallet) => wallet.id === walletId);

  if (selected && !selected.isAvailable) {
    throw new Error(`${selected.name} was not found. Install or open the wallet, then try again.`);
  }

  const { address } = await kit.fetchAddress();
  const network = await kit.getNetwork();
  return { address, network, walletId, walletName: selected?.name ?? walletId };
}

export async function restoreWallet(walletId: string) {
  const kit = ensureWalletKit();
  kit.setWallet(walletId);
  const selected = (await kit.refreshSupportedWallets()).find((wallet) => wallet.id === walletId);

  if (selected && !selected.isAvailable) {
    throw new Error(`${selected.name} was not found. Install or open the wallet, then try again.`);
  }

  const network = await kit.getNetwork();
  return { network, walletId, walletName: selected?.name ?? walletId };
}

export async function getWalletNetwork() {
  return ensureWalletKit().getNetwork();
}

export async function signWithWallet(transactionXdr: string, address: string) {
  const { signedTxXdr, signerAddress } = await ensureWalletKit().signTransaction(transactionXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address
  });

  if (signerAddress && signerAddress !== address) {
    throw new Error("The transaction was signed by a different account. Reconnect the active wallet.");
  }

  return signedTxXdr;
}

export async function disconnectWallet() {
  if (initialized) {
    await StellarWalletsKit.disconnect();
  }
}

export function getWalletErrorMessage(error: unknown) {
  const fallback = "The wallet request failed. Unlock your wallet and try again.";
  const raw =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String(error.message)
        : fallback;
  const message = raw.toLowerCase();

  if (message.includes("reject") || message.includes("declin") || message.includes("denied") || message.includes("cancel")) {
    return "The wallet request was rejected. No transaction was submitted.";
  }

  if (message.includes("not connected") || message.includes("not found") || message.includes("not installed")) {
    return "Wallet not found. Install or open the selected wallet, then refresh this page.";
  }

  return raw || fallback;
}
