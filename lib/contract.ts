import {
  Address,
  BASE_FEE,
  Contract,
  nativeToScVal,
  rpc,
  scValToNative,
  TransactionBuilder
} from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE, server as horizonServer } from "./stellar";

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
export const TRACKER_CONTRACT_ID = process.env.NEXT_PUBLIC_TRACKER_CONTRACT_ID || "";
export const CONTRACT_CONFIGURED = TRACKER_CONTRACT_ID.startsWith("C");

const rpcServer = new rpc.Server(SOROBAN_RPC_URL);

export type ContractCallStatus = "idle" | "pending" | "success" | "failed" | "skipped";

export type ContractPaymentEvent = {
  id: string;
  sender: string;
  recipient: string;
  amount: string;
  paymentHash: string;
  contractHash: string;
  ledger: number;
};

export async function buildRecordPaymentTransaction(params: {
  source: string;
  recipient: string;
  amount: string;
  paymentHash: string;
}) {
  if (!CONTRACT_CONFIGURED) {
    throw new Error("Payment tracker contract is not configured.");
  }

  const sourceAccount = await horizonServer.loadAccount(params.source);
  const contract = new Contract(TRACKER_CONTRACT_ID);
  const amountStroops = BigInt(Math.round(Number(params.amount) * 10_000_000));
  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      contract.call(
        "record_payment",
        new Address(params.source).toScVal(),
        new Address(params.recipient).toScVal(),
        nativeToScVal(amountStroops, { type: "i128" }),
        nativeToScVal(params.paymentHash, { type: "string" })
      )
    )
    .setTimeout(180)
    .build();

  return rpcServer.prepareTransaction(transaction);
}

export async function submitContractTransaction(signedXdr: string) {
  const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const submitted = await rpcServer.sendTransaction(transaction);

  if (submitted.status === "ERROR") {
    throw new Error("The contract transaction was rejected during submission.");
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 1_500));
    const result = await rpcServer.getTransaction(submitted.hash);

    if (result.status === "SUCCESS") {
      return { hash: submitted.hash };
    }
    if (result.status === "FAILED") {
      throw new Error("The payment succeeded, but the contract record transaction failed.");
    }
  }

  throw new Error("The contract transaction is still pending. Check its hash in Stellar Expert.");
}

function decodeEventValue(value: unknown) {
  if (value && typeof value === "object" && "toXDR" in value) {
    return scValToNative(value as Parameters<typeof scValToNative>[0]);
  }
  return value;
}

export async function fetchPaymentEvents(): Promise<ContractPaymentEvent[]> {
  if (!CONTRACT_CONFIGURED) {
    return [];
  }

  const latestLedger = await rpcServer.getLatestLedger();
  const response = await rpcServer.getEvents({
    startLedger: Math.max(latestLedger.sequence - 12_000, 1),
    filters: [{ type: "contract", contractIds: [TRACKER_CONTRACT_ID] }],
    limit: 25
  });

  return response.events
    .map((event) => {
      const value = decodeEventValue(event.value);
      const record = Array.isArray(value)
        ? value
        : value && typeof value === "object"
          ? Object.values(value as Record<string, unknown>)
          : [];

      return {
        id: event.id,
        sender: String(record[0] ?? ""),
        recipient: String(record[1] ?? ""),
        amount: (Number(record[2] ?? 0) / 10_000_000).toFixed(7),
        paymentHash: String(record[3] ?? ""),
        contractHash: event.txHash,
        ledger: event.ledger
      };
    })
    .filter((event) => event.sender.startsWith("G"))
    .reverse();
}
