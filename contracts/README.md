# LumenPayTracker

Soroban contract for LumenPay Yellow Belt. It stores successful payment records and emits a `PaymentRecorded` contract event.

Panduan command lengkap untuk setiap fungsi tersedia di [`COMMANDS.md`](COMMANDS.md).

## Build and test

```bash
cd contracts
cargo test
stellar contract build
```

## Deploy to Testnet

Install Stellar CLI 23, create/fund a dedicated Testnet identity, then:

```bash
stellar keys generate lumenpay-deployer --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/lumenpay_tracker.wasm \
  --source lumenpay-deployer \
  --network testnet
```

Copy the returned `C...` contract ID into `NEXT_PUBLIC_TRACKER_CONTRACT_ID` in `.env.local`. Never commit the deployer secret.

## Current Testnet Deployment

```txt
Contract ID:
CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD

Deployment transaction:
7f008a367ad0f3cc6ca6bf27dbc69adab452a9338e0866a05599ae4089f7d0bb

Validated `record_payment` transaction:
21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35
```

Explorer:

- https://stellar.expert/explorer/testnet/contract/CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD
- https://stellar.expert/explorer/testnet/tx/7f008a367ad0f3cc6ca6bf27dbc69adab452a9338e0866a05599ae4089f7d0bb
- https://stellar.expert/explorer/testnet/tx/21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35
