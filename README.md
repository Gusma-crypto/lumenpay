# LumenPay Lite

A simple Stellar Testnet payment dApp for the Level 1 frontend challenge.

LumenPay Lite lets a user connect Freighter, view their Testnet XLM balance, send a native XLM testnet payment, and see the transaction result in the UI.


## Features

* Freighter wallet connection
* Stellar Testnet network guard
* Connected public key display
* XLM balance lookup through Horizon Testnet
* Native XLM testnet payment form
* Recipient address validation
* QR recipient scanning
* Transaction preview before signing
* Freighter signing flow
* Success and error transaction feedback
* Stellar Expert testnet explorer link

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Stellar SDK
* Freighter API

## Getting Started

Clone the repo:

```bash
git clone https://github.com/Gusma-crypto/lumenpay.git
cd lumenpay
```

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env.local
```

Run the app:

```bash
npm run dev
```

Open:

```txt
http://localhost:3001
```

## Environment

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Requirements

* Node.js 20+
* npm
* Freighter browser extension
* Freighter set to Stellar Testnet
* Testnet XLM balance

If the account is not funded yet, use the Friendbot link shown in the app.

## How to Test

1. Open the app.
2. Connect Freighter.
3. Make sure Freighter is on Stellar Testnet.
4. Confirm the XLM balance is displayed.
5. Enter a recipient Stellar public key.
6. Enter an XLM amount.
7. Review the transaction preview.
8. Approve the transaction in Freighter.
9. Check the transaction result in the app.
10. Open the Stellar Expert testnet link to verify the transaction.

## Project Structure

```txt
app/
  page.tsx
  layout.tsx
  globals.css

components/
  WalletPanel.tsx
  BalanceCard.tsx
  PaymentForm.tsx
  TransactionStatus.tsx
  TransactionHistory.tsx
  AddressBook.tsx

lib/
  freighter.ts
  stellar.ts
  explorer.ts
  validation.ts

public/
  screenshots/
```

## Screenshots

Add the final submission screenshots here:

| Requirement | File |
| --- | --- |
| Wallet connected state | `public/screenshots/wallet-connected.png` |
| Balance displayed | `public/screenshots/balance-displayed.png` |
| Successful testnet transaction | `public/screenshots/transaction-success.png` |
| Transaction result shown to the user | `public/screenshots/transaction-result.png` |

![Wallet connected state](public/screenshots/wallet-connected.png)

![Balance displayed](public/screenshots/balance-displayed.png)

![Successful testnet transaction](public/screenshots/transaction-success.png)

![Transaction result shown to the user](public/screenshots/transaction-result.png)

## Useful Links

* Repository: https://github.com/Gusma-crypto/lumenpay.git
* Stellar Testnet Horizon: https://horizon-testnet.stellar.org
* Stellar Expert Testnet: https://stellar.expert/explorer/testnet
* Freighter: https://www.freighter.app

## Troubleshooting

### Freighter is not detected

Install Freighter, unlock the extension, and refresh the page.

### Wrong network

Switch Freighter to Stellar Testnet.

### Account has no balance

Fund the account with Friendbot, then refresh the balance.

### Transaction fails

Check that the recipient address is valid, the amount is greater than zero, the wallet has enough testnet XLM, and Freighter is still on Testnet.

## Submission Checklist

- [x] Public GitHub repository
- [x] `README.md`
- [x] Project description
- [x] Setup instructions
- [ ] Screenshot: wallet connected state
- [ ] Screenshot: balance displayed
- [ ] Screenshot: successful testnet transaction
- [ ] Screenshot: transaction result shown to the user
- [x] Transaction result shown in the UI
- [x] Transaction hash shown in the UI
- [x] Stellar Expert testnet link shown in the UI
