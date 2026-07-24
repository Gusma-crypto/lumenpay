# Yellow Belt Level 2 — Step-by-Step Submission Guide

Dokumen ini adalah panduan penyelesaian dan submission **LumenPay Lite Level 2 — Payment Tracker**.

## Target Akhir

Submission dinyatakan siap jika:

- Multi-wallet berjalan melalui StellarWalletsKit.
- Minimal tiga jenis error terlihat jelas.
- `LumenPayTracker` sudah deployed ke Stellar Testnet.
- Frontend benar-benar memanggil contract.
- Contract dapat menyimpan dan membaca data.
- Contract event muncul di live activity feed.
- Status `pending`, `success`, dan `failed` terlihat.
- Ada minimal dua meaningful commits untuk Level 2.
- README berisi contract address dan hash contract call asli.
- Screenshot bukti submission tersedia.

## Status Project Saat Ini

Sudah dikerjakan:

- [x] StellarWalletsKit dan pilihan multi-wallet.
- [x] Wallet availability detection.
- [x] Error wallet tidak ditemukan.
- [x] Error user menolak signing.
- [x] Error insufficient balance/transaction failure.
- [x] Source contract `LumenPayTracker`.
- [x] Contract unit test.
- [x] Frontend contract read/write integration.
- [x] Contract event polling setiap enam detik.
- [x] Status payment dan contract call.
- [x] Production frontend build.

Masih harus diselesaikan:

- [ ] Install Stellar CLI.
- [ ] Build contract ke WASM.
- [ ] Deploy contract ke Testnet.
- [ ] Simpan contract ID asli.
- [ ] Jalankan contract call dari frontend.
- [ ] Simpan transaction hash contract call.
- [ ] Ambil screenshot Level 2.
- [ ] Buat minimal dua meaningful commits.
- [ ] Push ke public GitHub.
- [ ] Deploy versi terbaru ke Vercel/Netlify.
- [ ] Lengkapi README dengan bukti final.

---

## Step 1 — Persiapan

Pastikan tersedia:

- Node.js 20 atau lebih baru.
- npm.
- Rust dan Cargo.
- Stellar CLI.
- Salah satu Stellar wallet, disarankan Freighter.
- Wallet menggunakan **Testnet**, bukan Mainnet.

Jangan pernah memasukkan seed phrase, secret key, atau private key ke:

- Source code.
- `.env.local`.
- README.
- Screenshot.
- Git commit.

Gunakan akun Testnet khusus untuk deployment dan testing.

## Step 2 — Install Frontend Dependencies

Dari root project:

```bash
npm install
```

Periksa TypeScript:

```bash
npx tsc --noEmit --incremental false
```

Build production:

```bash
npm run build
```

Hasil yang diharapkan:

- TypeScript tidak memiliki error.
- Next.js berhasil membuat production build.

## Step 3 — Test Smart Contract

Masuk ke folder contract:

```bash
cd contracts
cargo test
```

Hasil yang diharapkan:

```txt
1 passed; 0 failed
```

Kembali ke root project:

```bash
cd ..
```

## Step 4 — Install dan Periksa Stellar CLI

Ikuti instalasi resmi Stellar CLI sesuai sistem operasi, lalu periksa:

```bash
stellar --version
```

Gunakan Stellar CLI versi yang kompatibel dengan Soroban SDK project.

## Step 5 — Buat Akun Deployer Testnet

Buat identity khusus Testnet:

```bash
stellar keys generate lumenpay-deployer --network testnet --fund
```

Periksa address deployer:

```bash
stellar keys address lumenpay-deployer
```

Catatan:

- `--fund` meminta Friendbot mengisi akun dengan Testnet XLM.
- Testnet XLM tidak mempunyai nilai uang.
- Jangan tampilkan atau commit secret key deployer.

## Step 6 — Build Contract WASM

Dari folder `contracts`:

```bash
stellar contract build
```

File yang diharapkan:

```txt
contracts/target/wasm32v1-none/release/lumenpay_tracker.wasm
```

Folder `contracts/target` sudah diabaikan Git.

## Step 7 — Deploy Contract ke Testnet

Dari folder `contracts`:

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/lumenpay_tracker.wasm \
  --source lumenpay-deployer \
  --network testnet
```

Di PowerShell, command dapat ditulis satu baris:

```powershell
stellar contract deploy --wasm target/wasm32v1-none/release/lumenpay_tracker.wasm --source lumenpay-deployer --network testnet
```

Command akan menghasilkan contract ID seperti:

```txt
CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Yang harus Anda lakukan:

1. Salin contract ID tersebut.
2. Jangan mengubah atau memendekkannya.
3. Simpan sebagai bukti deployment.

## Step 8 — Konfigurasi Frontend

Buat `.env.local` di root project:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_TRACKER_CONTRACT_ID=C...HASIL_DEPLOYMENT...
```

Penting:

- Gunakan contract ID asli dari Step 7.
- `.env.local` tidak akan masuk Git.
- Restart development server setelah mengubah environment.

## Step 9 — Jalankan Frontend

```bash
npm run dev
```

Buka:

```txt
http://localhost:3001
```

## Step 10 — Test Multi-Wallet

Lakukan pengujian berikut:

1. Buka halaman LumenPay.
2. Pastikan beberapa wallet option terlihat.
3. Pilih wallet yang tersedia.
4. Approve connection.
5. Pastikan public address dan Testnet status muncul.
6. Disconnect.
7. Connect kembali untuk memastikan flow konsisten.

Ambil screenshot:

```txt
public/screenshots/level2-wallet-options.png
```

Screenshot harus memperlihatkan beberapa pilihan wallet.

## Step 11 — Test Tiga Jenis Error

### Error 1 — Wallet Not Found

Pilih wallet yang belum terpasang.

Hasil yang diharapkan:

- UI menjelaskan bahwa wallet tidak ditemukan.
- App tidak crash.

### Error 2 — User Rejected

Mulai connection atau transaksi, lalu tekan Reject/Cancel di wallet.

Hasil yang diharapkan:

- UI menjelaskan bahwa request ditolak.
- Tidak ada transaksi yang dikirim.

### Error 3 — Insufficient Balance

Masukkan amount yang melebihi saldo yang dapat digunakan.

Hasil yang diharapkan:

- UI menolak transaksi atau network mengembalikan pesan insufficient balance.
- Status menjadi failed/error.

Ambil screenshot jika diperlukan untuk menunjukkan kualitas error handling.

## Step 12 — Jalankan Payment dan Contract Call

Siapkan:

- Wallet pengirim dengan Testnet XLM.
- Wallet penerima Testnet yang sudah aktif.
- Amount kecil, misalnya `0.1 XLM`.

Flow:

1. Connect wallet.
2. Masukkan address penerima.
3. Masukkan amount.
4. Review payment.
5. Confirm dan approve transaksi XLM.
6. Tunggu status payment menjadi success.
7. Frontend akan menyiapkan `record_payment`.
8. Approve signature kedua untuk contract call.
9. Tunggu contract status menjadi success.
10. Salin contract transaction hash.

Jangan tutup atau refresh halaman saat status masih pending.

## Step 13 — Verifikasi di Stellar Explorer

Buka link explorer dari panel contract.

Pastikan:

- Network adalah Testnet.
- Transaction status berhasil.
- Transaction berisi invoke host function/contract call.
- Contract ID cocok dengan hasil deployment.

Simpan transaction hash lengkap:

```txt
64-character transaction hash
```

Transaction hash inilah yang harus dimasukkan ke README.

## Step 14 — Verifikasi Live Event

Setelah contract call sukses:

1. Tunggu maksimal enam detik.
2. Periksa panel **Live Payment Activity**.
3. Pastikan amount, sender, recipient, ledger, dan link transaction muncul.
4. Tekan tombol refresh untuk menguji manual synchronization.
5. Refresh browser dan pastikan event dapat dibaca kembali dari RPC.

Ambil screenshot:

```txt
public/screenshots/level2-live-feed.png
```

Ambil screenshot contract call:

```txt
public/screenshots/level2-contract-call.png
```

Ambil screenshot status transaksi:

```txt
public/screenshots/level2-transaction-status.png
```

## Step 15 — Update README dengan Bukti Asli

Isi README dengan:

- Contract ID hasil deployment.
- Transaction hash contract call.
- Link Stellar Explorer.
- Screenshot wallet options.
- Screenshot contract call.
- Screenshot live feed.
- Screenshot transaction status.
- Live demo URL jika sudah deployed.

Jangan menggunakan:

- Placeholder `C...`.
- Hash contoh.
- Screenshot dari project lain.

## Step 16 — Buat Meaningful Commits

Requirement meminta minimal dua meaningful commits. Rekomendasi:

### Commit 1

```bash
git add package.json package-lock.json app components lib .env.example
git commit -m "feat: add StellarWalletsKit multi-wallet support"
```

### Commit 2

```bash
git add contracts app components lib
git commit -m "feat: add Soroban payment tracker and live events"
```

### Commit 3

Setelah bukti final tersedia:

```bash
git add README.md public/screenshots YELLOW_BELT_STEP_BY_STEP.md level2.md
git commit -m "docs: add Yellow Belt deployment evidence"
```

Sebelum commit, selalu periksa:

```bash
git status
git diff --check
```

Jangan gunakan `git add .` sebelum memastikan tidak ada secret atau file yang tidak seharusnya masuk Git.

## Step 17 — Push ke GitHub

```bash
git push origin main
```

Setelah push:

1. Buka repository GitHub.
2. Pastikan repository bersifat public.
3. Pastikan minimal dua commit Level 2 terlihat.
4. Pastikan contract source tersedia.
5. Pastikan screenshot dapat terbuka.
6. Pastikan README menampilkan contract ID dan hash.

## Step 18 — Deploy Frontend

Deploy versi terbaru ke Vercel, Netlify, atau layanan serupa.

Tambahkan environment variables di dashboard deployment:

```txt
NEXT_PUBLIC_STELLAR_NETWORK
NEXT_PUBLIC_HORIZON_URL
NEXT_PUBLIC_SOROBAN_RPC_URL
NEXT_PUBLIC_TRACKER_CONTRACT_ID
```

Setelah deploy:

1. Buka live URL.
2. Test wallet connection.
3. Pastikan contract panel aktif.
4. Pastikan live event dapat dimuat.
5. Tambahkan live URL ke README.

## Step 19 — Final Submission Audit

### Repository

- [ ] GitHub repository public.
- [ ] README memiliki setup instructions.
- [ ] Minimal dua meaningful commits Level 2.
- [ ] Tidak ada secret key atau seed phrase.

### Multi-wallet dan Errors

- [ ] Wallet options terlihat.
- [ ] Wallet not found ditangani.
- [ ] User rejection ditangani.
- [ ] Insufficient balance ditangani.

### Smart Contract

- [ ] Contract deployed di Testnet.
- [ ] Contract ID ada di README.
- [ ] Frontend memanggil contract.
- [ ] Contract menyimpan payment record.
- [ ] Contract data/event dapat dibaca kembali.
- [ ] Contract call hash ada di README.
- [ ] Hash dapat diverifikasi di Stellar Explorer.

### Real-time dan Status

- [ ] Event baru muncul tanpa reload manual.
- [ ] State tetap sinkron setelah refresh.
- [ ] Pending terlihat.
- [ ] Success terlihat.
- [ ] Failed/error terlihat.

### Evidence

- [ ] Screenshot wallet options.
- [ ] Screenshot contract call.
- [ ] Screenshot live activity.
- [ ] Screenshot transaction status.
- [ ] Live demo link jika digunakan.

## Bukti yang Harus Anda Catat

Isi bagian ini setelah deployment:

```txt
GitHub repository:

Live demo:

Contract ID:

Contract deployment transaction hash:

Successful record_payment transaction hash:

Stellar Explorer URL:

Wallet options screenshot:

Contract call screenshot:

Live feed screenshot:

Transaction status screenshot:
```

## Kapan Project Siap Disubmit?

Project baru siap disubmit ketika semua kondisi berikut benar:

1. Contract ID bukan placeholder.
2. Contract call hash dapat dibuka di Stellar Explorer Testnet.
3. Live activity menampilkan event dari contract tersebut.
4. README memuat semua bukti.
5. Minimal dua commit Level 2 terlihat di GitHub.
6. Repository public dan tidak menyimpan secret.

