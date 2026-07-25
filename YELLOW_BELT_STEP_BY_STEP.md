# Yellow Belt Level 2 — Step-by-Step Submission Guide

This document tracks the completion and submission process for **LumenPay Lite — Yellow Belt Level 2 Payment Tracker**.

## Submission Goal

The project is ready for submission when it includes:

- Multi-wallet support through StellarWalletsKit.
- At least three clearly handled error types.
- A Soroban contract deployed on Stellar Testnet.
- Contract read and write calls from the frontend.
- Real-time contract event synchronization.
- Visible pending, success, and failed transaction states.
- At least two meaningful Level 2 commits.
- A public GitHub repository with setup instructions.
- A deployed contract ID and verifiable contract transaction hash.
- Submission screenshots and, when available, a live demo URL.

## Current Project Status

### Completed

- [x] StellarWalletsKit multi-wallet integration.
- [x] Wallet availability detection.
- [x] Wallet-not-found error handling.
- [x] Rejected wallet request/signature handling.
- [x] Insufficient balance and underfunded transaction handling.
- [x] Mainnet/Testnet network guard.
- [x] `LumenPayTracker` Soroban contract source.
- [x] Five passing contract unit tests.
- [x] Contract WASM built.
- [x] Contract deployed on Stellar Testnet.
- [x] Real contract ID stored in the frontend configuration and README.
- [x] Frontend XLM payment flow.
- [x] Frontend `record_payment` contract write flow.
- [x] Frontend `get_payment_count` contract read flow.
- [x] Contract event polling every six seconds.
- [x] Pending, success, and failed/error states.
- [x] More than two meaningful Level 2 commits.
- [x] Level 2 evidence screenshots captured locally.
- [x] Production frontend build.
- [x] Frontend deployed to Vercel.
- [x] Live demo URL documented in `README.md`.
- [x] Stellar Expert contract page documented in `README.md`.
- [x] Transaction-status screenshot listed in the README evidence table.

### Remaining Before Final Submission

- [ ] Commit all current source, documentation, and screenshot changes.
- [ ] Push the latest commits and screenshots to the public GitHub repository.
- [ ] Open every README image and Explorer link from GitHub to confirm that none are broken.

## Verified Deployment Evidence

| Evidence | Value |
| --- | --- |
| Network | Stellar Testnet |
| Contract ID | [`CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD`](https://stellar.expert/explorer/testnet/contract/CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD) |
| Deployment transaction | [`7f008a367ad0f3cc6ca6bf27dbc69adab452a9338e0866a05599ae4089f7d0bb`](https://stellar.expert/explorer/testnet/tx/7f008a367ad0f3cc6ca6bf27dbc69adab452a9338e0866a05599ae4089f7d0bb) |
| Successful CLI `record_payment` validation | [`21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35`](https://stellar.expert/explorer/testnet/tx/21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35) |
| Latest verified contract record count | `5` |
| Frontend `record_payment` transaction hash | [`182b2c71f4df58700e39eacb3e830cd321feafa3412845c2058f79179b1b6a1a`](https://stellar.expert/explorer/testnet/tx/182b2c71f4df58700e39eacb3e830cd321feafa3412845c2058f79179b1b6a1a) |
| Live demo | `https://lumenpay-flame.vercel.app` |

The CLI hash proves that the deployed contract accepts `record_payment`. The separate frontend hash documents the browser wallet contract-call flow.

---

## Step 1 — Prerequisites

Install or prepare:

- Node.js 20 or newer.
- npm.
- Rust and Cargo.
- Stellar CLI.
- A Stellar wallet such as Freighter.
- A wallet account funded with Testnet XLM.

Never place a seed phrase, secret key, or private key in:

- Source code.
- `.env.local`.
- README files.
- Screenshots.
- Git commits.

## Step 2 — Install and Validate the Frontend

From the project root:

```bash
npm install
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

Expected result:

- ESLint completes successfully.
- TypeScript reports no errors.
- Next.js creates a production build.

## Step 3 — Run the Development Server

On Windows:

```powershell
npm run dev
```

If file changes on drive `Z:` are not detected:

```powershell
npm run dev:poll
```

Open:

```txt
http://127.0.0.1:3001
```

## Step 4 — Test the Smart Contract

```bash
cd contracts
cargo test
cd ..
```

Expected result:

```txt
5 passed; 0 failed
```

## Step 5 — Build the Contract

From `contracts`:

```bash
stellar contract build
```

Expected WASM:

```txt
contracts/target/wasm32v1-none/release/lumenpay_tracker.wasm
```

## Step 6 — Deploy the Contract

PowerShell:

```powershell
stellar contract deploy --wasm target/wasm32v1-none/release/lumenpay_tracker.wasm --source lumenpay-deployer --network testnet
```

The deployed LumenPay contract is:

```txt
CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD
```

## Step 7 — Configure the Frontend

Create `.env.local`:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_TRACKER_CONTRACT_ID=CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD
```

Restart the development server after changing environment variables.

## Step 8 — Test Multi-Wallet Support

1. Click **Connect Wallet**.
2. Confirm that multiple StellarWalletsKit wallet options are displayed.
3. Select an available wallet.
4. Approve the connection.
5. Confirm that the wallet address and detected network appear.
6. Confirm that Mainnet produces a warning.
7. Switch to Testnet and refresh the network status.
8. Disconnect and reconnect.

Evidence:

```txt
public/screenshots/level2-wallet-options.png
public/screenshots/level2-wallet-connected.jpeg
```

## Step 9 — Test the Required Errors

### Wallet Not Found

Select a wallet that is not installed.

Expected:

- A wallet-not-found message is shown.
- The application does not crash.

### User Rejected

Start a connection or signing request and reject it in the wallet.

Expected:

- The UI reports that the request was rejected.
- No transaction is submitted.

### Insufficient Balance

Enter an amount larger than the spendable balance.

Expected:

- Form validation or Stellar rejects the transaction.
- The UI shows an insufficient-balance/underfunded error.
- The transaction state becomes failed/error.

### Wrong Network

Connect a wallet using Mainnet.

Expected:

- The popup identifies Mainnet.
- A Testnet warning appears.
- Payment submission is blocked until the wallet uses Testnet.

## Step 10 — Send XLM and Call the Contract

1. Connect a Testnet wallet.
2. Enter an active Testnet recipient address.
3. Enter a small XLM amount.
4. Review the payment.
5. Approve the XLM payment signature.
6. Wait for the payment status to become successful.
7. Approve the second signature for `record_payment`.
8. Wait for the contract status to become successful.
9. Copy the contract transaction hash.
10. Open the hash in Stellar Expert Testnet.

Do not close or refresh the page while a transaction is pending.

## Step 11 — Verify Contract Read and Events

Confirm that:

- `get_payment_count()` returns the deployed contract count.
- The latest verified count is `5`.
- Contract events contain sender, recipient, amount, payment hash, ledger, and transaction hash.
- The frontend refreshes events every six seconds.
- Manual refresh also updates the feed.

Evidence:

```txt
public/screenshots/contracts.png
public/screenshots/level2-live-feed.png
public/screenshots/contract-explore.png
```

## Step 12 — Verify Transaction States

Confirm that the UI can display:

- Pending/signing.
- Submitting.
- Payment success.
- Contract pending.
- Contract success.
- Failed/error.

Evidence:

```txt
public/screenshots/level2-transaction-status.png
```

## Step 13 — Update the README

The README must contain:

- Setup instructions.
- Contract ID.
- Deployment transaction hash.
- Frontend contract call transaction hash.
- Stellar Explorer links.
- Wallet options screenshot.
- Connected wallet screenshot.
- Contract deployment/read screenshot.
- Contract call screenshot.
- Transaction status screenshot.
- Live activity/event synchronization screenshot.
- Contract Explorer screenshot.
- Live demo URL.

Do not use placeholder IDs, example hashes, or evidence from another project.

## Step 14 — Commit and Push

The repository already has more than two meaningful commits. Commit the latest uncommitted work:

```bash
git status
git diff --check
git add README.md YELLOW_BELT_STEP_BY_STEP.md CATATAN_PROJECT.md app components lib package.json package-lock.json public/screenshots
git commit -m "docs: finalize Yellow Belt Level 2 submission evidence"
git push origin main
```

Review `git status` before committing. Never commit `.env.local` or secret keys.

## Step 15 — Final Submission Audit

### Repository

- [x] GitHub remote is configured.
- [x] README contains setup instructions.
- [x] More than two meaningful Level 2 commits exist.
- [x] Contract source and tests are included.
- [x] No secret key is intentionally stored in project documentation.
- [ ] Latest local changes are committed.
- [ ] Latest commit is pushed to the public GitHub repository.

### Multi-Wallet and Errors

- [x] Multiple wallet options are visible.
- [x] Wallet-not-found errors are handled.
- [x] User rejection is handled.
- [x] Insufficient balance is handled.
- [x] Mainnet/Testnet mismatch is handled.

### Smart Contract

- [x] Contract is deployed on Testnet.
- [x] Contract ID is documented.
- [x] Stellar Expert contract page is linked.
- [x] Frontend prepares and submits `record_payment`.
- [x] Contract stores payment records.
- [x] Frontend reads the contract count.
- [x] Contract events are readable.
- [x] CLI contract call hash is documented.
- [x] Contract activity is visible in Stellar Explorer.
- [x] Exact frontend contract transaction hash is documented in README.

### Real-Time and Status

- [x] Contract events refresh every six seconds.
- [x] Events can be reloaded from Soroban RPC.
- [x] Pending state is implemented.
- [x] Success state is implemented.
- [x] Failed/error state is implemented.

### Evidence

- [x] Wallet options screenshot.
- [x] Connected wallet screenshot.
- [x] Contract deployment/read screenshot.
- [x] Contract call/payment success screenshot.
- [x] Transaction status screenshot.
- [x] Live activity screenshot.
- [x] Contract Explorer screenshot.
- [x] Screenshots are linked in the local README.
- [x] Live demo URL is added to README.
- [ ] All screenshots are committed and visible on GitHub.

## Final Evidence Record

```txt
GitHub repository:
https://github.com/Gusma-crypto/lumenpay

Live demo:
https://lumenpay-flame.vercel.app

Contract ID:
CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD

Contract deployment transaction:
7f008a367ad0f3cc6ca6bf27dbc69adab452a9338e0866a05599ae4089f7d0bb

CLI record_payment transaction:
21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35

Frontend record_payment transaction:
182b2c71f4df58700e39eacb3e830cd321feafa3412845c2058f79179b1b6a1a
```

## Ready-to-Submit Rule

The project is ready for final submission when:

1. The exact frontend `record_payment` transaction hash is in the README.
2. The live demo URL is in the README.
3. All screenshots and documentation changes are committed.
4. The latest commit is pushed to the public repository.
5. All README links and images work from GitHub.
6. The repository remains free of secrets.
