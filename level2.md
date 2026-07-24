# LumenPay Lite Level 2 Yellow Belt Plan

> Panduan eksekusi lengkap tersedia di [`YELLOW_BELT_STEP_BY_STEP.md`](YELLOW_BELT_STEP_BY_STEP.md).

## Main Direction

Do not change the original concept.

**LumenPay Lite** remains a Stellar Testnet payment dApp for sending XLM, checking balance, viewing transaction status, and opening explorer links.

For Level 2, the app will be extended with Yellow Belt requirements:

- Multi-wallet integration
- Smart contract deployment
- Frontend contract calls
- Real-time event handling
- State synchronization
- Better transaction status tracking
- Stronger error handling

The project idea that best fits LumenPay is:

**Payment Tracker - Multi-address payments with status updates**

This means LumenPay keeps its payment purpose, but adds a smart-contract-backed payment log and live activity feed.

## Yellow Belt Overview Alignment

The Level 2 overview says:

> Building on your White Belt skills, integrate multiple wallets, deploy your first smart contract, and implement real-time event handling.

LumenPay Lite already has the White Belt foundation:

- Freighter wallet connection
- Stellar Testnet XLM payment
- Balance display
- Transaction preview
- Transaction success/error feedback
- Explorer links
- Transaction history

Level 2 will build on that foundation instead of replacing it.

## Final Level 2 Concept

**LumenPay Lite Level 2** is a multi-wallet Stellar Testnet payment app.

Users can:

1. Choose a wallet from multiple wallet options.
2. Connect their wallet.
3. Check their Testnet XLM balance.
4. Send XLM to another Stellar address.
5. See pending, success, and failed transaction status.
6. Record successful payments to a deployed smart contract.
7. See contract-recorded payment events in a live activity feed.

## Requirements Mapping

| Yellow Belt Requirement | LumenPay Lite Level 2 Implementation |
| --- | --- |
| StellarWalletsKit implementation | Replace Freighter-only connection with `StellarWalletsKit` and show wallet options |
| 3 error types handled | Handle wallet not found, user rejected signing, and insufficient balance/failed transaction |
| Contract deployed on testnet | Deploy a Soroban contract for payment records |
| Contract called from frontend | Call the contract after a successful XLM payment |
| Reading and writing data to a contract | Write payment records and read recent payment records/events |
| Event listening and state synchronization | Listen or poll contract events and sync them into the UI |
| Transaction status tracking | Show pending, success, and failed states for payment and contract record calls |
| Minimum 2+ meaningful commits | Split work into wallet integration, contract integration, and event feed commits |
| Deliverable | Multi-wallet LumenPay app with deployed payment tracker contract and real-time event integration |

## Smart Contract Plan

Contract purpose:

Record successful LumenPay testnet payments and emit events that the frontend can display.

Suggested contract name:

```txt
LumenPayTracker
```

Suggested functions:

```txt
record_payment(sender, recipient, amount, payment_hash)
get_payment(id)
get_payment_count()
```

Suggested event:

```txt
payment_recorded
```

Suggested event data:

- sender address
- recipient address
- amount
- payment transaction hash
- ledger sequence or timestamp

## Frontend Plan

### 1. Multi-wallet Connection

Add `StellarWalletsKit` so users can choose from available Stellar wallets.

Expected UI:

- Wallet selector modal or panel
- Available wallet options screenshot for README
- Connected wallet address in the header
- Existing balance and payment flow still works

### 2. Error Handling

Handle at least these 3 errors clearly in the UI:

- Wallet not found or not installed
- User rejected connection/signing
- Insufficient balance or transaction submission failed

### 3. Payment Flow

Keep the current LumenPay payment flow:

1. User enters recipient.
2. User enters XLM amount.
3. User reviews payment.
4. User signs the Stellar payment transaction.
5. App shows transaction status.
6. App opens explorer link for payment hash.

### 4. Contract Record Flow

After the payment succeeds:

1. Frontend calls `record_payment`.
2. Contract stores or emits the payment record.
3. App shows contract call status:
   - Pending
   - Success
   - Failed
4. App shows explorer link for the contract call transaction hash.

### 5. Real-time Activity Feed

Add a panel such as:

```txt
Live Payment Activity
```

The feed should show contract-recorded payment events:

- Sender
- Recipient
- Amount
- Payment hash
- Contract event/record time

The feed can update by:

- Polling recent contract events
- Refreshing after a successful contract call
- Listening where supported by the selected Stellar/Soroban tooling

## README Requirements For Level 2

Add a Level 2 section to `README.md` with:

- Project description for Yellow Belt
- Setup instructions
- Multi-wallet usage instructions
- Deployed contract address
- Transaction hash of a contract call
- Screenshot: wallet options available
- Screenshot: transaction status visible
- Screenshot: live activity/event feed
- Live demo link, if deployed

## Suggested Screenshots

| Requirement | File |
| --- | --- |
| Wallet options available | `public/screenshots/level2-wallet-options.png` |
| Contract call success | `public/screenshots/level2-contract-call.png` |
| Live activity feed | `public/screenshots/level2-live-feed.png` |
| Transaction status pending/success/fail | `public/screenshots/level2-transaction-status.png` |

## Suggested Commit Plan

Minimum 2 meaningful commits are required. Recommended:

1. `feat: add multi-wallet support with StellarWalletsKit`
2. `feat: add LumenPay payment tracker contract integration`
3. `feat: add live payment activity feed`
4. `docs: update README for Yellow Belt submission`

## Submission Checklist

- [ ] Public GitHub repository
- [ ] README with setup instructions
- [ ] Minimum 2+ meaningful commits
- [ ] Multi-wallet options visible
- [ ] 3 error types handled
- [ ] Contract deployed on testnet
- [ ] Contract address added to README
- [ ] Contract called from frontend
- [ ] Contract call transaction hash added to README
- [ ] Transaction status visible
- [ ] Real-time event/activity integration visible
- [ ] Screenshots added

## Important Notes

- Keep the name and purpose: **LumenPay Lite**.
- Do not rebuild from scratch.
- Do not remove existing Level 1 functionality.
- Use a dedicated testnet deployer account for contract deployment.
- Never commit secret keys, private keys, or wallet recovery phrases.
