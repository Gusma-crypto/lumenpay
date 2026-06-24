# Project Rules - LumenPay Lite Level 1

LumenPay Lite is the Level 1 version of LumenPay. The project must stay focused on Stellar Testnet fundamentals.

## In Scope

* Connect Freighter wallet
* Disconnect wallet
* Use Stellar Testnet
* Display public key
* Fetch and display XLM balance
* Send XLM testnet transaction
* Show transaction success or failure
* Show transaction hash and explorer link

## Out of Scope

* Soroban smart contract
* USDC payment streaming
* Escrow logic
* Payroll automation
* Real-time accrual
* Stream cancellation and refund
* Tax, compliance, and HR workflows
* Backend database

## Rules

* Never use mainnet for Level 1.
* Never store secret keys, seed phrases, or private wallet data.
* All transaction signing must happen through Freighter.
* Validate recipient address.
* Validate amount before building the transaction.
* Show loading, success, and error states.
* Keep the UI simple and demo-ready.
