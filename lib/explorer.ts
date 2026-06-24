export function getTestnetExplorerUrl(hash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}

export function shortenPublicKey(publicKey: string) {
  if (publicKey.length <= 12) {
    return publicKey;
  }

  return `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`;
}
