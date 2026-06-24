import * as freighter from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "./stellar";

type FreighterResult = Record<string, unknown>;
type AsyncApi = Record<string, (...args: unknown[]) => Promise<unknown>>;
type SignTransactionOptions = {
  networkPassphrase: string;
  address: string;
  accountToSign: string;
};

function readBoolean(result: unknown, key: string, fallback = false) {
  if (typeof result === "boolean") {
    return result;
  }

  if (result && typeof result === "object" && key in result) {
    return Boolean((result as FreighterResult)[key]);
  }

  return fallback;
}

function readString(result: unknown, keys: string[]) {
  if (typeof result === "string") {
    return result;
  }

  if (!result || typeof result !== "object") {
    return null;
  }

  const objectResult = result as FreighterResult;
  for (const key of keys) {
    const value = objectResult[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return null;
}

function readNestedString(result: unknown, objectKey: string, keys: string[]) {
  if (!result || typeof result !== "object" || !(objectKey in result)) {
    return null;
  }

  return readString((result as FreighterResult)[objectKey], keys);
}

function readErrorMessage(result: unknown) {
  if (!result || typeof result !== "object" || !("error" in result)) {
    return null;
  }

  const error = (result as FreighterResult).error;
  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as FreighterResult).message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return null;
}

export async function isFreighterAvailable() {
  const api = freighter as unknown as AsyncApi;

  if (typeof api.isConnected !== "function") {
    return false;
  }

  const result = await api.isConnected();
  return readBoolean(result, "isConnected");
}

export async function requestFreighterPublicKey() {
  const api = freighter as unknown as AsyncApi;

  if (typeof api.requestAccess === "function") {
    const result = await api.requestAccess();
    const address = readString(result, ["address", "publicKey"]);
    if (address) {
      return address;
    }
  }

  if (typeof api.getPublicKey === "function") {
    const result = await api.getPublicKey();
    const publicKey = readString(result, ["publicKey", "address"]);
    if (publicKey) {
      return publicKey;
    }
  }

  throw new Error("Unable to access Freighter wallet public key.");
}

export async function getFreighterNetworkDetails() {
  const api = freighter as unknown as AsyncApi;

  if (typeof api.getNetworkDetails === "function") {
    const result = await api.getNetworkDetails();
    const network = readString(result, ["network", "networkName"]);
    const networkPassphrase =
      readString(result, ["networkPassphrase"]) ??
      readNestedString(result, "networkDetails", ["networkPassphrase"]);

    return { network, networkPassphrase };
  }

  if (typeof api.getNetwork === "function") {
    const result = await api.getNetwork();
    const network = readString(result, ["network"]);
    const networkPassphrase = readString(result, ["networkPassphrase"]);

    return { network, networkPassphrase };
  }

  return { network: null, networkPassphrase: null };
}

export async function signWithFreighter(transactionXdr: string, address: string) {
  const api = freighter as unknown as AsyncApi;

  if (typeof api.signTransaction !== "function") {
    throw new Error("Freighter signTransaction API is not available.");
  }

  const result = await api.signTransaction(transactionXdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
    accountToSign: address
  } satisfies SignTransactionOptions);

  const errorMessage = readErrorMessage(result);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const signerAddress = readString(result, ["signerAddress"]);
  if (signerAddress && signerAddress !== address) {
    throw new Error("Freighter signed with a different account. Reconnect the active wallet and try again.");
  }

  const signedXdr = readString(result, ["signedTxXdr", "signedXDR", "xdr"]);
  if (signedXdr) {
    return signedXdr;
  }

  throw new Error("Freighter did not return a signed transaction.");
}
