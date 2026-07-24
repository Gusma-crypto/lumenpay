# Catatan Project — LumenPay Yellow Belt Level 2

Dokumen ini mencatat perubahan secara berurutan agar bug, keputusan teknis, dan hasil verifikasi mudah ditelusuri.

## Format Catatan

Setiap langkah berisi:

- **Tujuan**: alasan perubahan.
- **Perubahan**: file dan perilaku yang diubah.
- **Verifikasi**: command dan hasil pengujian.
- **Risiko/catatan**: hal yang perlu diperhatikan.
- **Status**: `SELESAI`, `GAGAL`, atau `MENUNGGU`.

---

## Langkah 01 — Fondasi Yellow Belt

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI

**Tujuan**

Menambahkan multi-wallet, contract integration, live events, dan transaction status tanpa menghapus fitur White Belt.

**Perubahan**

- Menambahkan StellarWalletsKit pada `lib/wallets.ts`.
- Menambahkan wallet selector pada `components/WalletPanel.tsx`.
- Menambahkan Soroban RPC integration pada `lib/contract.ts`.
- Menambahkan live activity pada `components/LiveContractActivity.tsx`.
- Menambahkan contract Rust pada `contracts/lumenpay_tracker`.
- Menambahkan environment configuration pada `.env.example`.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus.
- `npm run build`: lulus.
- `cargo test --locked`: 1 test lulus.

**Risiko/catatan**

- Contract belum deployed ke Testnet.
- Contract ID dan transaction hash masih menunggu bukti asli.
- Next.js build memiliki warning dependency `sodium-native`, tetapi build berhasil.

---

## Langkah 02 — Hardening LumenPayTracker

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI

**Tujuan**

Menutup risiko duplicate payment, mengganti panic generik dengan typed error, memperbarui event API, menjaga TTL data, dan memperluas unit test.

**Perubahan**

- Pin `soroban-sdk` secara exact ke `23.5.3`.
- Menambahkan `ContractError::InvalidAmount`.
- Menambahkan `ContractError::DuplicatePayment`.
- Menambahkan indeks `PaymentHash` untuk mencegah pencatatan hash berulang.
- Mengganti deprecated `Events::publish` dengan `#[contractevent]`.
- Menambahkan perpanjangan TTL untuk count, payment, dan payment hash.
- Menambahkan test ID increment, missing payment, invalid amount, dan duplicate hash.

**Verifikasi**

- `cargo fmt --all -- --check`: lulus.
- `cargo test --locked`: 5 test lulus, 0 gagal.
- Warning deprecated event sudah tidak muncul.

**Risiko/catatan**

- Bentuk event harus tetap berupa vec agar decoder frontend tetap kompatibel.
- Test error menggunakan expected contract error code `#1` dan `#2`.

---

## Langkah 03 — Pemeriksaan Toolchain Deployment

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI

**Tujuan**

Memastikan mesin lokal dapat membangun contract WASM dan melakukan deployment Testnet.

**Perubahan**

- Tidak ada perubahan source.

**Verifikasi**

- Rust target `wasm32-unknown-unknown`: tersedia.
- Native Rust target `x86_64-pc-windows-msvc`: tersedia.
- Stellar CLI `23.0.0`: berhasil dipasang.
- Rust target `wasm32v1-none`: berhasil dipasang.

**Risiko/catatan**

- Instalasi CLI menulis ke Cargo home di luar repository.

---

## Langkah 04 — Build Contract WASM

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI DENGAN CATATAN

**Tujuan**

Menghasilkan artifact contract yang dapat dideploy ke Stellar Testnet.

**Perubahan**

- Tidak ada perubahan source.
- Menghasilkan artifact build lokal yang diabaikan Git.

**Verifikasi**

- Command: `stellar contract build`.
- WASM: `contracts/target/wasm32v1-none/release/lumenpay_tracker.wasm`.
- Ukuran: 4.084 byte.
- WASM hash: `697d08d1306644e03a282975da248806016f0d517a94ea82f0136f9b8bf6479d`.
- Exported functions: `record_payment`, `get_payment`, dan `get_payment_count`.

**Risiko/catatan**

- `stellar contract info interface` pada CLI `23.0.0` mengalami panic `not yet implemented` ketika membaca metadata event dari SDK `23.5.3`.
- Build contract tetap selesai dengan exit sukses dan fungsi berhasil terdeteksi oleh build summary.
- Jika deployment gagal karena metadata, opsi diagnosis berikutnya adalah menyamakan versi CLI/SDK atau menggunakan CLI yang lebih baru.

---

## Langkah 05 — Membuat Identity Deployer Testnet

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI

**Tujuan**

Menyediakan akun khusus untuk deployment tanpa menggunakan wallet utama pengguna.

**Perubahan**

- Membuat identity lokal bernama `lumenpay-deployer`.
- Friendbot berhasil mendanai identity pada Testnet.
- Menambahkan `contracts/.stellar` ke `.gitignore`.

**Verifikasi**

- Public address: `GCT45UYJ2KR2ILNHOBCKGJ25HA42QLWLPNOTP7JFFTEMM46RADJXGMKV`.
- Identity tersimpan di `contracts/.stellar/identity/lumenpay-deployer.toml`.
- Folder credential tidak boleh muncul sebagai untracked file Git.

**Risiko/catatan**

- File identity mengandung credential sensitif dan hanya disimpan lokal.
- Jangan menghapus folder `.stellar` sebelum deployment/testing selesai kecuali credential sudah dicadangkan secara aman.
- Jangan membuka, menyalin, atau commit isi file identity.

---

## Langkah 06 — Deploy LumenPayTracker ke Testnet

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI

**Tujuan**

Memenuhi requirement Yellow Belt bahwa contract benar-benar deployed di Stellar Testnet.

**Perubahan**

- Contract WASM di-upload dan di-deploy menggunakan `lumenpay-deployer`.
- Contract ID ditambahkan ke `.env.local`.
- Contract ID dan deployment transaction ditambahkan ke README.

**Verifikasi**

- Contract ID: `CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD`.
- Deployment transaction: `7f008a367ad0f3cc6ca6bf27dbc69adab452a9338e0866a05599ae4089f7d0bb`.
- Explorer transaction: `https://stellar.expert/explorer/testnet/tx/7f008a367ad0f3cc6ca6bf27dbc69adab452a9338e0866a05599ae4089f7d0bb`.
- Explorer contract: `https://stellar.expert/explorer/testnet/contract/CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD`.

**Risiko/catatan**

- Deployment transaction bukan `record_payment` transaction.
- Requirement transaction hash contract call masih menunggu satu call dari frontend.
- `.env.local` tidak masuk Git; environment deployment harus dikonfigurasi ulang di Vercel/Netlify.

---

## Langkah 07 — Verifikasi Contract dan Frontend

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI

**Tujuan**

Memastikan deployment dapat dibaca dari RPC dan frontend tetap dapat dibuild menggunakan contract ID nyata.

**Perubahan**

- Menambahkan deployment evidence ke `contracts/README.md`.
- Tidak ada perubahan logic frontend.

**Verifikasi**

- Read-only invocation `get_payment_count`: berhasil, hasil `0`.
- `npx tsc --noEmit --incremental false`: lulus.
- `npm run build` dengan `.env.local`: lulus.
- `.env.local`: dikonfirmasi di-ignore Git.
- `contracts/.stellar/identity/lumenpay-deployer.toml`: dikonfirmasi di-ignore Git.
- `git diff --check`: lulus.

**Risiko/catatan**

- Build menghasilkan warning bundling `sodium-native` dan patch ESLint, tetapi compilation, type checking, static generation, dan exit code semuanya sukses.
- Contract count masih `0` karena belum ada `record_payment` yang ditandatangani dari frontend.
- Langkah berikutnya membutuhkan interaksi pengguna di browser dengan wallet Testnet.

---

## Langkah 08 — Write Test dan Explorer Validation

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI

**Tujuan**

Menguji fungsi write `record_payment`, penyimpanan, authorization, event, dan menghasilkan transaction hash yang dapat diverifikasi di Explorer.

**Perubahan**

- Stellar CLI memigrasikan identity dari `contracts/.stellar` ke global config `C:\Users\mis\.config\stellar`.
- Menulis satu validation record ke contract Testnet.
- Menambahkan hash contract call ke README.

**Data uji**

- Sender: `GCT45UYJ2KR2ILNHOBCKGJ25HA42QLWLPNOTP7JFFTEMM46RADJXGMKV`.
- Recipient: address deployer yang sama.
- Amount: `1000000` stroops (`0.1 XLM` sebagai nilai pencatatan).
- Payment hash label: `cli-validation-20260724-01`.

**Verifikasi**

- `record_payment` menghasilkan ID `1`.
- Transaction status: success.
- Transaction hash: `21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35`.
- Explorer: `https://stellar.expert/explorer/testnet/tx/21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35`.
- Event: `PaymentRecorded`.
- Read-only `get_payment_count` setelah write: `1`.

**Risiko/catatan**

- Record ini adalah validasi contract melalui CLI, bukan bukti payment XLM dari frontend.
- Hash ini valid untuk membuktikan contract call, tetapi submission akhir sebaiknya juga menyertakan hash call yang dibuat melalui frontend.
- Nilai amount pada record ini tidak memindahkan XLM; `record_payment` adalah payment logger.

---

## Langkah 09 — Contract Command Reference

**Tanggal:** 24 Juli 2026  
**Status:** SELESAI

**Tujuan**

Menyediakan command pembelajaran yang dapat langsung digunakan untuk setiap fungsi contract.

**Perubahan**

- Menambahkan `contracts/COMMANDS.md`.
- Menambahkan tautan command reference pada `contracts/README.md`.

**Isi panduan**

- Unit test dan formatting.
- Build dan deployment.
- `get_payment_count`.
- `get_payment`.
- `record_payment`.
- Invalid amount test.
- Duplicate payment test.
- Authorization test.
- Explorer dan event verification.
- Perbedaan CLI test dan frontend test.

**Verifikasi**

- Nama function dan argument disesuaikan dengan contract yang deployed.
- Contract ID dan deployer public address menggunakan deployment Testnet aktif.

**Risiko/catatan**

- Setiap `payment_hash` write test harus unik.
- Write test membuat data permanen sementara pada Testnet.
- CLI validation bukan pengganti frontend wallet validation untuk submission.
