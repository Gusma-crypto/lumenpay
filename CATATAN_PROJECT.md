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

---

## Langkah 10 — Redesign Dashboard Yellow Belt v2

**Tanggal:** 24 Juli 2026
**Status:** SELESAI

**Tujuan**

Menyesuaikan tampilan aplikasi dengan referensi `dashboard.png`, `dashboardmenu.png`, dan `send.png` tanpa mengubah alur wallet, payment, contract, atau event synchronization.

**Perubahan**

- Menambahkan sidebar desktop dan bottom navigation mobile.
- Mengganti header menjadi topbar Testnet dan wallet controls.
- Menambahkan hero `Send. Track. On Stellar`.
- Menambahkan visual orbit Stellar berbasis CSS.
- Menambahkan empat summary cards.
- Menyusun ulang dashboard menjadi panel Send Payment, Transaction Status, dan Live Payment Activity.
- Memindahkan multi-wallet selector ke modal.
- Menambahkan responsive layout desktop, tablet, dan mobile.
- Mengubah visual utama menjadi light dashboard dengan warna ungu Yellow Belt.
- Memperbaiki wallet detection agar kegagalan satu adapter tidak menghapus seluruh wallet option.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus setelah seluruh perubahan.
- `npm run build`: lulus setelah seluruh perubahan.
- Screenshot desktop dan mobile lokal dibuat dan dibandingkan dengan referensi.
- Overflow horizontal mobile dan topbar mobile diperbaiki.
- Fallback empat wallet options ditambahkan agar selector tetap informatif saat adapter detection gagal.

**Risiko/catatan**

- Wallet extension tidak tersedia di browser headless, sehingga opsi akan tampil sebagai `Not detected`.
- Wallet connect dan signing tetap perlu diuji manual melalui browser dengan extension asli.
- Warning dependency Stellar/ESLint lama tetap muncul pada build, tetapi compilation, type checking, static generation, dan exit code sukses.

---

## Langkah 11 — Perbaikan Hydration Mismatch

**Tanggal:** 24 Juli 2026
**Status:** SELESAI

**Tujuan**

Menghilangkan React hydration overlay ketika wallet/browser extension menambahkan CSS variable `--swk-*` pada elemen HTML sebelum aplikasi selesai hydrate.

**Penyebab**

- Server merender `<html lang="en">`.
- Stellar wallet kit atau browser extension menambahkan atribut `style` pada `<html>` di sisi client.
- React mendeteksi perbedaan atribut server dan client sebagai hydration mismatch.

**Perubahan**

- Menambahkan `suppressHydrationWarning` pada root `<html>` dan `<body>`.
- Memperbarui metadata description dari White Belt Level 1 menjadi Yellow Belt Level 2.

**Risiko/catatan**

- Suppression hanya diterapkan pada root boundary yang memang dapat dimodifikasi extension.
- Tidak menyembunyikan hydration mismatch pada komponen aplikasi di bawahnya.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus.
- `npm run build`: lulus.
- Static generation berhasil untuk seluruh route.

---

## Langkah 12 — Aktivasi Navigasi dan Seluruh Tombol Dashboard

**Tanggal:** 24 Juli 2026
**Status:** SELESAI

**Tujuan**

Memastikan menu dashboard dan semua tombol interaktif menjalankan fungsi yang sesuai, sekaligus menyelaraskan menu dengan referensi `dashboardmenu.png`.

**Perubahan**

- Mengaktifkan navigasi halus menuju Dashboard, Send Payment, Activity Feed, Contracts, dan About.
- Membuka modal multi-wallet dari menu My Wallets, tombol Connect Wallet, dan Choose Wallet.
- Menambahkan menu Settings beserta modal pilihan light/dark dashboard dan informasi Stellar Testnet.
- Mengaktifkan tombol notifikasi untuk menampilkan ringkasan payment dan contract event.
- Mengaktifkan tombol tema di topbar dan menambahkan tampilan dark dashboard.
- Menampilkan kartu wallet aktif di bagian bawah sidebar.
- Mengaktifkan tombol hero berdasarkan kondisi wallet: membuka wallet selector atau menuju form pembayaran.
- Menghubungkan How it works dan Read Full Guide ke bagian/panduan yang sesuai.
- Mempertahankan aksi Refresh Balance, Refresh Activity, Disconnect Wallet, submit payment, contract call, serta link Stellar Explorer.
- Mengubah tema awal menjadi light agar sesuai dengan desain referensi.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus tanpa error.
- `npm run build`: lulus; compilation, type checking, dan static generation berhasil.
- `git diff --check`: tidak menemukan whitespace error.

**Risiko/catatan**

- Connect, signing, pengiriman XLM, dan contract call tetap harus diuji manual dengan wallet extension pada Stellar Testnet.
- Warning `sodium-native` dan patch ESLint masih muncul saat build, tetapi bukan build failure dan exit code tetap sukses.

---

## Langkah 13 — Penyelarasan Dashboard dengan dashboardmenu.png

**Tanggal:** 24 Juli 2026
**Status:** SELESAI

**Tujuan**

Menyelaraskan struktur, warna, dan hierarki dashboard dengan referensi `referensi/dashboardmenu.png`.

**Perubahan**

- Mengubah hero menjadi `Welcome to LumenPay Lite` dengan deskripsi seperti referensi.
- Menambahkan kartu ringkasan contract Testnet, jumlah record/event, copy Contract ID, dan tautan Stellar Expert.
- Menyesuaikan empat kartu statistik: connected wallets, recorded payments, volume, dan events.
- Menambahkan bagian `What you can do with LumenPay Lite` dengan empat tombol yang terhubung ke fitur aplikasi.
- Menambahkan ringkasan `Live Activity Feed` yang memakai data event aktual.
- Menambahkan blok About, Why Stellar, tautan guide/GitHub, dan footer.
- Menyamakan palet dengan referensi: putih, navy, ungu, hijau, biru, dan oranye.
- Mengubah modal Review Transaction dari tema gelap menjadi kartu putih–ungu yang konsisten.
- Menambahkan layout responsif untuk dashboard baru dan modal transaksi.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus tanpa error.
- `npm run build`: lulus; compilation, type checking, dan static generation berhasil.

**Risiko/catatan**

- Ilustrasi Stellar dibuat dengan CSS agar tidak membutuhkan aset eksternal.
- Warning dependency `sodium-native` dan patch ESLint tetap bersifat non-blocking.

---

## Langkah 14 — Pemisahan Dashboard dan Workspace Transaksi

**Tanggal:** 24 Juli 2026
**Status:** SELESAI

**Tujuan**

Membuat halaman Dashboard berhenti pada footer seperti `dashboardmenu.png`, tanpa panel transaksi dan event tambahan di bawahnya.

**Perubahan**

- Menghapus panel Payment, Transaction Status, Contract Record, dan Live Activity Feed dari tampilan Dashboard utama.
- Menghapus blok About lama yang duplikat.
- Mempertahankan footer sebagai elemen terakhir Dashboard.
- Panel transaksi dan event hanya dirender ketika menu Send Payment atau Activity Feed dipilih.
- Menunda proses scroll sampai workspace tujuan selesai dirender agar tombol navigasi tetap berfungsi.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus tanpa error.
- `npm run build`: lulus; compilation dan static generation berhasil.

**Risiko/catatan**

- Fitur transaksi dan event tidak dihapus dari aplikasi; fitur hanya dipisahkan dari halaman Dashboard.

---

## Langkah 15 — Penyempurnaan Proporsi dan Animasi Dashboard

**Tanggal:** 24 Juli 2026
**Status:** SELESAI

**Tujuan**

Mendekatkan proporsi dashboard ke `dashboardmenu.png` dan menambahkan animasi ringan tanpa mengganggu penggunaan aplikasi.

**Perubahan**

- Menyesuaikan sidebar menjadi 258px dan topbar menjadi 76px seperti komposisi referensi.
- Menyesuaikan grid hero, ukuran heading, lebar kartu contract, dan jarak konten.
- Menampilkan kartu `Not Connected` di sidebar sebelum wallet tersambung.
- Membuat kartu akun sidebar dapat membuka multi-wallet selector.
- Menyesuaikan urutan tombol theme dan notification pada topbar.
- Menambahkan animasi fade-up bertahap pada hero dan kartu dashboard.
- Menambahkan floating animation pada Stellar coin dan pergerakan orbit.
- Menambahkan pulse animation pada status Stellar Testnet dan titik orbit.
- Menambahkan hover elevation pada kartu dan tombol fitur.
- Menambahkan fallback `prefers-reduced-motion` untuk aksesibilitas.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus tanpa error.
- `npm run build`: lulus; compilation, type checking, dan static generation berhasil.

**Risiko/catatan**

- Animasi sengaja dibuat ringan agar dashboard tetap nyaman dan tidak mengganggu pembacaan data.

---

## Langkah 16 — Perbaikan Tombol Connect Wallet Navbar

**Tanggal:** 24 Juli 2026
**Status:** SELESAI

**Penyebab**

Handler `connectWallet` menerima event klik React sebagai parameter `walletId`. Akibatnya event tersebut dapat diproses sebagai ID wallet dan modal pemilihan wallet tidak berjalan sesuai harapan.

**Perubahan**

- Membungkus handler navbar dengan fungsi tanpa parameter.
- Memastikan klik `Connect Wallet` selalu menjalankan `connectWallet()` tanpa event.
- Alur pertama sekarang membuka modal multi-wallet; pemilihan wallet di dalam modal baru meneruskan ID wallet yang benar.

**Verifikasi**

- TypeScript type-check: lulus.
- `npm run build`: lulus; compilation dan static generation berhasil.
