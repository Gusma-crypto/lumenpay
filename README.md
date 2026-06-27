# LumenPay - Real-Time Payroll & Payment Streaming on Stellar

LumenPay is a payroll and recurring payment streaming concept built around Stellar and Soroban smart contracts.

This repository currently implements **LumenPay Lite**, the Level 1 Stellar Testnet foundation: Freighter wallet connection, XLM balance display, XLM testnet payments, transaction feedback, network guard, QR recipient scanning, and a frontend-only template for the future USDC streaming product.

## Submission

Implemented in this repository:
* Freighter wallet connection
* Stellar Testnet account balance display
* Native XLM testnet payment transaction
* Transaction result shown to the user
* Transaction hash and Stellar Expert testnet explorer link

Not included in this Level 1 submission:

* Soroban smart contract deployment
* USDC escrow
* Real-time USDC payment streaming
* On-chain stream withdrawal and cancellation logic

The Soroban and USDC streaming features are part of the future product vision, not the implemented Level 1 scope.

## Problem

Traditional payroll and recurring payment systems are slow, inefficient, and heavily dependent on manual processes. Employees often wait until payday to access wages they have already earned, while freelancers must wait for invoice approvals before receiving payment.

For businesses, recurring payments require repeated manual transfers, increase operational overhead, and provide limited transparency. Cross-border payments can also introduce delays and unnecessary costs.

There is a need for a modern payment infrastructure that enables real-time, transparent, and programmable money movement.

## Product Vision

LumenPay transforms payroll and recurring payments into continuous financial streams powered by Stellar and Soroban smart contracts.

Instead of sending a single payment at the end of a work period, businesses can create payment streams funded with USDC. Funds are deposited into a smart contract escrow and become available to the recipient gradually over time.

Employees, freelancers, contractors, and contributors can withdraw earned funds whenever they need them, without waiting for payroll cycles or invoice approvals.

If a payment stream is cancelled, earned funds remain claimable by the recipient while unearned funds are automatically returned to the payer.

## Implemented Level 1 Features

* Connect Freighter wallet
* Disconnect wallet locally from the app
* Detect Freighter network and guard against non-Testnet signing
* Display connected wallet public key
* Fetch and display XLM balance on Stellar Testnet
* Open Testnet Friendbot when a connected account needs funding
* Send XLM to any valid Stellar testnet address
* Prevent sending XLM to the connected wallet's own address
* Scan a recipient QR code from the payment form
* Show transaction preview before signing
* Sign transaction with Freighter
* Submit transaction to Stellar Testnet
* Show success or failure feedback
* Show transaction hash and Stellar Expert testnet explorer link
* Display a frontend-only LumenPay Streams template aligned with the full product idea

## Future Product Features

* Real-time USDC payment streaming
* Smart contract escrow protection
* Flexible withdrawal of earned funds
* Automated recurring payroll and contractor payments
* Stream cancellation with automatic refund handling
* Transparent on-chain payment history
* Cross-border payments with Stellar's low-cost infrastructure

## Target Users

### Businesses and Organizations

* Startups
* Small and medium businesses
* DAOs
* Agencies
* Remote-first companies

### Recipients

* Employees
* Freelancers
* Contractors
* Contributors
* Service providers

## How Stellar Is Used

The implemented Level 1 app uses:

* Stellar Testnet
* Freighter wallet
* Stellar SDK
* Horizon Testnet
* Native XLM testnet transactions

The full LumenPay product is designed to use Soroban smart contracts and Stellar-based assets such as USDC.

The Soroban contract will manage:

* Stream creation
* Escrowed funds
* Time-based accrual calculations
* Withdrawals
* Stream cancellation
* Refund distribution

Users authenticate and sign transactions through Stellar wallets.

Payers deposit USDC into the smart contract and configure payment streams by specifying:

* Recipient
* Asset
* Total payment amount
* Stream duration

Recipients can monitor accumulated earnings and withdraw available funds directly from the contract.

Contract events are planned to track stream activity and power a real-time dashboard for payment history and status updates.

## Impact

LumenPay enables a new payroll experience where workers are paid continuously as they earn.

By combining Stellar's fast settlement network with Soroban's programmable smart contracts, LumenPay creates a transparent, efficient, and globally accessible payment infrastructure for payroll, freelancer compensation, subscriptions, and recurring business payments.

## Team

### Agus Sulistiono - Solo Builder

Responsible for:

* Product Design
* Soroban Smart Contract Planning
* Frontend Development
* Stellar Wallet Integration
* Testing
* Deployment
* Demo Preparation

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Stellar SDK
* Freighter API
* Vercel for deployment

## Network

This Level 1 implementation uses Stellar Testnet only.

```txt
Horizon URL: https://horizon-testnet.stellar.org
Network passphrase: Test SDF Network ; September 2015
```

## Requirements

* Node.js 20 or newer
* Freighter wallet browser extension
* Freighter configured for Stellar Testnet
* Testnet XLM balance

## Run Locally

Install dependencies:

```bash
npm install
```

Copy the environment example:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3001
```

## How to Use the Level 1 Demo

1. Open the app.
2. Connect Freighter wallet.
3. Make sure Freighter is using Stellar Testnet.
4. Fund the wallet with testnet XLM if needed.
5. Confirm that XLM balance is displayed.
6. Enter a recipient Stellar public key or scan a recipient QR code.
7. Enter an XLM amount.
8. Click Send Payment.
9. Review the transaction preview.
10. Approve the transaction in Freighter.
11. Check the success message, transaction hash, and explorer link.

If the connected account is not active on Testnet yet, use the Friendbot link shown in the balance panel, then refresh the balance.

## Screenshots

Add the final demo screenshots in `public/screenshots/` before submission.

### Wallet Connected State

![Wallet connected state](public/screenshots/wallet-connected.png)

Required proof:

* Freighter wallet is connected
* Connected Stellar public key is visible
* App is using Stellar Testnet

### Balance Displayed

![Balance displayed](public/screenshots/balance-displayed.png)

Required proof:

* Connected wallet balance is visible
* Balance is fetched from Stellar Testnet

### Successful Testnet Transaction

![Successful testnet transaction](public/screenshots/transaction-success.png)

Required proof:

* Payment was submitted successfully
* Transaction hash is visible
* Stellar Expert testnet link is visible

### Transaction Result Shown to the User

![Transaction result shown to the user](public/screenshots/transaction-result.png)

Required proof:

* The UI clearly shows the final transaction result after signing
* Success or failure feedback is visible to the user

## Submission Checklist

Use this checklist before submitting the GitHub repository link.

- [ ] Public GitHub repository
- [x] `README.md` file included
- [x] Project description included
- [x] Setup instructions included
- [ ] Screenshot: wallet connected state
- [ ] Screenshot: balance displayed
- [ ] Screenshot: successful Stellar testnet transaction
- [ ] Screenshot: transaction result shown to the user
- [x] UI shows transaction hash after successful submission
- [x] UI provides Stellar Expert testnet explorer link
- [ ] Freighter is switched to Stellar Testnet before recording screenshots
- [ ] Final GitHub repository link submitted before the monthly deadline

Repository link:

```txt
https://github.com/YOUR_USERNAME/lumenpay-stellar
```

## Future Scope

The full LumenPay idea will later expand into USDC payment streaming with Soroban smart contract escrow, time-based accrual, stream cancellation, and refund handling.

The app includes a frontend-only stream template to show this direction, but Soroban contracts, USDC escrow, withdrawals, and refunds are intentionally outside the Level 1 implementation scope.
