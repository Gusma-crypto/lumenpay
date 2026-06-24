import { isValidPublicKey } from "./stellar";

const MINIMUM_REMAINING_XLM = 1;

export function validateRecipientAddress(address: string) {
  if (!address.trim()) {
    return "Recipient address is required.";
  }

  if (!isValidPublicKey(address)) {
    return "Recipient address must be a valid Stellar public key.";
  }

  return null;
}

export function validateAmount(amount: string, currentBalance: string | null) {
  const parsedAmount = Number(amount);

  if (!amount.trim()) {
    return "Amount is required.";
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return "Amount must be greater than 0.";
  }

  if (!/^\d+(\.\d{1,7})?$/.test(amount.trim())) {
    return "XLM amount can use up to 7 decimal places.";
  }

  if (currentBalance && parsedAmount >= Number(currentBalance)) {
    return "Amount should be lower than your available XLM balance.";
  }

  if (currentBalance && Number(currentBalance) - parsedAmount < MINIMUM_REMAINING_XLM) {
    return `Leave at least ${MINIMUM_REMAINING_XLM} XLM in your wallet for Stellar reserves.`;
  }

  return null;
}
