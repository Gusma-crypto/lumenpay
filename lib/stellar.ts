import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder
} from "@stellar/stellar-sdk";

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";

export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const MAINNET_PASSPHRASE = Networks.PUBLIC;
export const ESTIMATED_FEE_XLM = (Number(BASE_FEE) / 10_000_000).toFixed(5);

export const server = new Horizon.Server(HORIZON_URL);

export type IssuedAssetBalance = {
  code: string;
  issuer: string;
  balance: string;
};

export type PaymentHistoryItem = {
  id: string;
  hash: string;
  createdAt: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  direction: "sent" | "received";
};

type HorizonErrorResponse = {
  response?: {
    data?: {
      details?: string;
      extras?: {
        result_codes?: {
          transaction?: string;
          operations?: string[];
        };
      };
    };
    status?: number;
  };
};

const STELLAR_ERROR_MESSAGES: Record<string, string> = {
  op_no_destination: "Recipient account does not exist on Stellar Testnet. Fund it first or use an active Testnet address.",
  op_underfunded: "This payment would leave the wallet below the Stellar reserve requirement.",
  tx_bad_auth: "Freighter did not sign with the expected wallet. Reconnect Freighter and try again.",
  tx_bad_seq: "Wallet sequence is out of date. Refresh the page and try again.",
  tx_failed: "The Stellar network rejected this transaction.",
  tx_insufficient_balance: "This payment would leave the wallet below the Stellar reserve requirement.",
  tx_insufficient_fee: "The transaction fee was too low for the current network state.",
  tx_no_source_account: "Source wallet is not active on Stellar Testnet. Fund it first with Testnet XLM.",
  tx_too_late: "The transaction expired before it reached Stellar. Try again."
};

export function isValidPublicKey(value: string) {
  return StrKey.isValidEd25519PublicKey(value.trim());
}

function getHorizonErrorResponse(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  return (error as HorizonErrorResponse).response ?? null;
}

function explainStellarCode(code: string | undefined) {
  if (!code) {
    return null;
  }

  return STELLAR_ERROR_MESSAGES[code] ?? `Stellar rejected the transaction with code: ${code}.`;
}

export function getStellarErrorMessage(error: unknown, fallback = "Transaction failed.") {
  const response = getHorizonErrorResponse(error);
  const resultCodes = response?.data?.extras?.result_codes;
  const operationCode = resultCodes?.operations?.find(Boolean);
  const transactionCode = resultCodes?.transaction;
  const explainedCode = explainStellarCode(operationCode) ?? explainStellarCode(transactionCode);

  if (explainedCode) {
    return explainedCode;
  }

  if (response?.data?.details) {
    return response.data.details;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function fetchAccountBalances(publicKey: string) {
  const account = await server.loadAccount(publicKey);
  const nativeBalance = account.balances.find((balance) => balance.asset_type === "native");
  const assets = account.balances
    .filter((balance) => balance.asset_type !== "native" && balance.asset_type !== "liquidity_pool_shares")
    .map((balance) => ({
      code: balance.asset_code,
      issuer: balance.asset_issuer,
      balance: balance.balance
    }));

  return {
    xlm: nativeBalance?.balance ?? "0",
    assets
  };
}

export async function fetchXlmBalance(publicKey: string) {
  const balances = await fetchAccountBalances(publicKey);

  return balances.xlm;
}

export async function fetchPaymentHistory(publicKey: string) {
  const response = await server
    .payments()
    .forAccount(publicKey)
    .order("desc")
    .limit(8)
    .call();

  return response.records
    .filter((record) => record.type === "payment")
    .map((record) => {
      const payment = record as Horizon.HorizonApi.PaymentOperationResponse;
      const asset = payment.asset_type === "native" ? "XLM" : (payment.asset_code ?? "Asset");

      return {
        id: payment.id,
        hash: payment.transaction_hash,
        createdAt: payment.created_at,
        from: payment.from,
        to: payment.to,
        amount: payment.amount,
        asset,
        direction: payment.from === publicKey ? "sent" : "received"
      } satisfies PaymentHistoryItem;
    });
}

export async function buildXlmPaymentTransaction(params: {
  sourcePublicKey: string;
  destinationPublicKey: string;
  amount: string;
  memo?: string;
}) {
  const sourceAccount = await server.loadAccount(params.sourcePublicKey);

  try {
    await server.loadAccount(params.destinationPublicKey);
  } catch {
    throw new Error(
      "Recipient account does not exist on Stellar Testnet. Fund it first or use an active Testnet address."
    );
  }

  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE
  })
    .addOperation(
      Operation.payment({
        destination: params.destinationPublicKey,
        asset: Asset.native(),
        amount: params.amount
      })
    );

  if (params.memo?.trim()) {
    builder.addMemo(Memo.text(params.memo.trim()));
  }

  return builder.setTimeout(180).build();
}

export async function submitSignedTransaction(signedXdr: string) {
  const signedTransaction = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  return server.submitTransaction(signedTransaction);
}
