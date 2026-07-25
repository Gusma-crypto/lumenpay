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

---

## Langkah 17 — Network Error, Statistik Contract, dan Session Restore

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menindaklanjuti hasil code review pada error handling wallet, akurasi statistik on-chain, dan keamanan pemulihan sesi wallet.

**Perubahan**

- Membungkus pemeriksaan wallet network pada tahap review dan send dengan `try/catch`.
- Menampilkan transaction error dan notification ketika wallet terkunci, disconnect, menolak request, atau gagal membaca network.
- Menambahkan query read-only `get_payment_count()` melalui simulasi Soroban RPC.
- Menggunakan contract payment count untuk Total Records, Total Payments Recorded, dan Total Events.
- Mengubah volume menjadi `Synchronized Volume` karena nilainya berasal dari event contract yang tersedia pada rentang sinkronisasi RPC.
- Mengubah `restoreWallet()` agar mengambil address aktif dari wallet extension.
- Menandai sesi sebagai connected hanya setelah address dan network berhasil diverifikasi.
- Memperbarui session storage menggunakan address aktif yang terverifikasi.
- Membersihkan public key, wallet metadata, network, dan session storage jika restore gagal.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus.
- `npm run lint`: lulus.
- `cargo test`: 5/5 contract tests lulus.
- `npm run build`: lulus; compilation dan static generation berhasil.

**Risiko/catatan**

- Soroban event endpoint memakai rentang ledger terbaru, sehingga volume diberi label synchronized dan bukan lifetime total.
- Warning bundler `sodium-native` dan konfigurasi plugin Next.js ESLint tetap non-blocking.

---

## Langkah 18 — Perbaikan Overflow Wallet dan Tech Stack

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Memperbaiki elemen yang keluar dari card pada halaman Wallets dan About serta menyamakan skala font dengan dashboard.

**Perubahan**

- Memindahkan badge `Recommended` ke dalam kolom informasi Freighter.
- Menyederhanakan grid header wallet agar icon, teks, dan arrow tidak saling menimpa.
- Menambahkan `min-width: 0`, wrapping, dan overflow protection pada card wallet.
- Memastikan tombol Connect selalu memakai lebar maksimal card.
- Menurunkan ukuran font wallet menjadi skala 11–14px yang konsisten dengan dashboard.
- Menyembunyikan arrow dekoratif ketika card memiliki selected mark.
- Menambahkan wrapping pada nama dan deskripsi Tech Stack.
- Menambahkan batas lebar internal serta overflow protection pada setiap Tech Stack card.
- Menyesuaikan font Tech Stack menjadi 10–12px.

**Verifikasi**

- `npm run build`: lulus.
- `npx tsc --noEmit --incremental false`: lulus.
- `npm run lint`: lulus.

**Risiko/catatan**

- Warning bundler Stellar SDK dan konfigurasi plugin Next.js ESLint tetap non-blocking.

---

## Langkah 19 — Penyederhanaan Popup Connect Wallet

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menghilangkan informasi pembuka yang tidak diperlukan agar popup Connect Wallet lebih ringkas.

**Perubahan**

- Menghapus judul `Multi-wallet Connection`.
- Menghapus deskripsi StellarWalletsKit dari bagian atas popup.
- Menghapus kartu `Wallet Security`.
- Menghapus kartu `Network Status`.
- Menghapus kartu `Payment Asset`.
- Mempertahankan status koneksi, daftar pilihan wallet, informasi Testnet setelah connected, dan tombol disconnect.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus.
- `npm run lint`: lulus.
- `npm run build`: lulus.

## Langkah 20 — Deteksi Testnet dan Mainnet pada Popup Wallet

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menampilkan network wallet yang sebenarnya dan memberikan peringatan ketika network tidak sesuai dengan Stellar Testnet yang digunakan aplikasi.

**Perubahan**

- Menambahkan konstanta passphrase Stellar Mainnet.
- Mendeteksi Testnet dan Mainnet menggunakan network passphrase, bukan hanya nama tampilan.
- Menambahkan badge Testnet atau Mainnet pada status connected.
- Mengubah icon dan warna status menjadi peringatan ketika Mainnet atau network lain terdeteksi.
- Menampilkan pesan bahwa transaksi LumenPay Lite dikonfigurasi untuk Stellar Testnet.
- Menampilkan notification segera setelah connect atau restore session jika Mainnet terdeteksi.
- Menambahkan notification hasil pemeriksaan ulang network.
- Mempertahankan panduan `Switch to Testnet` untuk pengguna Mainnet.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus.
- `npm run lint`: lulus.
- `npm run build`: lulus.

---

## Langkah 21 — Perbaikan Dev Command Windows

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Penyebab**

Script `dev` memakai format environment variable Linux/macOS (`WATCHPACK_POLLING=true command`) yang tidak dikenali oleh `cmd.exe` pada Windows.

**Perubahan**

- Mengubah `npm run dev` menjadi command Next.js yang kompatibel lintas platform.
- Menambahkan `npm run dev:poll` khusus Windows jika project pada drive `Z:` membutuhkan polling watcher.

**Command**

- Normal: `npm run dev`
- Polling Windows: `npm run dev:poll`

**Verifikasi**

- `npm run dev`: Next.js berhasil start di `http://127.0.0.1:3001`.

---

## Langkah 22 — Bottom Navbar Mobile dan Back to Home

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Membuat seluruh menu mudah diakses dari smartphone dan menyediakan navigasi kembali ke Dashboard.

**Perubahan**

- Menampilkan tujuh menu pada bottom navbar: Dashboard, Send, Activity, Wallets, Contracts, Settings, dan About.
- Menyesuaikan grid bottom navbar menjadi tujuh kolom.
- Memendekkan label Send, Activity, dan Wallets.
- Menyembunyikan label pada layar maksimal 390px agar semua icon tetap muat.
- Mempertahankan bottom navbar pada halaman Send Payment.
- Mengganti karakter panah halaman Send dengan icon `ArrowLeft`.
- Menambahkan tombol `Back to Home` pada Activity, Wallets, Contracts, Settings, dan About.
- Menambahkan ruang bawah pada halaman Send agar konten tidak tertutup navbar.

**Verifikasi**

- `npx tsc --noEmit --incremental false`: lulus.
- `npm run lint`: lulus.
- `npm run build`: lulus.

---

## Langkah 23 — Menonaktifkan Collapse Sidebar Mobile

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menghilangkan kontrol collapse sidebar ketika aplikasi dibuka melalui smartphone atau perangkat sentuh.

**Perubahan**

- Menyembunyikan tombol collapse secara paksa pada viewport mobile.
- Menonaktifkan pointer event tombol collapse.
- Menerapkan perlindungan tambahan hingga 1024px untuk perangkat tanpa hover.
- Mempertahankan hamburger untuk membuka sidebar dan tombol X untuk menutupnya.
- Fitur collapse desktop tetap tersedia.

**Verifikasi**

- `npm run lint`: lulus.
- `npm run build`: lulus.

---

## Langkah 24 — Menghapus Icon Toggle pada Perangkat Sentuh

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Memastikan icon toggle/collapse sidebar tidak muncul ketika aplikasi dibuka melalui smartphone.

**Perubahan**

- Mendeteksi perangkat tanpa hover dan perangkat dengan pointer sentuh.
- Menyembunyikan icon toggle menggunakan `display`, `visibility`, ukuran nol, dan pointer protection.
- Tidak bergantung hanya pada lebar viewport sehingga berlaku pada smartphone portrait maupun landscape.
- Hamburger pembuka sidebar dan tombol X tetap dipertahankan.

**Verifikasi**

- `npm run lint`: lulus.
- `npm run build`: lulus.

---

## Langkah 25 — Menghapus Sidebar pada Versi Mobile

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menghapus seluruh sidebar ketika aplikasi dibuka melalui smartphone dan menggunakan bottom navbar sebagai navigasi utama.

**Perubahan**

- Menyembunyikan panel sidebar pada viewport maksimal 820px.
- Menyembunyikan sidebar pada perangkat sentuh hingga 1024px untuk mode landscape.
- Menghapus hamburger dan backdrop sidebar dari tampilan mobile.
- Mempertahankan brand, network, dan wallet controls pada header mobile.
- Menggunakan tujuh icon bottom navbar sebagai navigasi mobile.
- Sidebar desktop tetap tersedia.

**Verifikasi**

- `npm run lint`: lulus.
- `npm run build`: lulus.

---

## Langkah 26 — Optimasi Send Payment untuk Smartphone

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Memperkecil tampilan, font, dan progress Send Payment agar proporsional pada layar smartphone.

**Perubahan**

- Memperkecil heading mobile Send Payment menjadi 18px.
- Memperkecil badge Testnet, tombol back, dan jarak header.
- Memperkecil progress circle menjadi 30px dan label menjadi 10px.
- Menyesuaikan garis progress dengan ukuran circle mobile.
- Mengubah label tahap ketiga dari `Sign & Send` menjadi `Sign`.
- Memperkecil padding card, icon Payment Details, judul, dan deskripsi.
- Memperkecil wallet source card, status Connected, label form, input, serta bantuan validasi.
- Memperkecil quick amount, memo, information note, Reset, dan Review Payment.
- Menjaga ruang bawah agar form tidak tertutup bottom navbar.
- Memperluas penghapusan sidebar dan aktivasi bottom navbar hingga 1024px.

**Verifikasi**

- `npm run lint`: lulus.
- `npm run build`: lulus.

---

## Langkah 27 — Tech Stack Icon Only

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menyederhanakan bagian Tech Stack pada halaman About agar hanya menampilkan icon.

**Perubahan**

- Menghapus nama dan deskripsi yang terlihat dari card Tech Stack.
- Menampilkan icon Stellar SDK, Soroban, StellarWalletsKit, Next.js, dan TypeScript.
- Memperbarui daftar teknologi agar sesuai dengan implementasi project saat ini.
- Menambahkan `title` dan `aria-label` pada setiap icon.
- Menambahkan hover ringan tanpa menampilkan teks tambahan.

**Verifikasi**

- `npm run lint`: lulus.
- `npm run build`: lulus.

---

## Langkah 28 — Tabel Bukti Screenshot README

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menambahkan pemetaan requirement Yellow Belt Level 2 ke screenshot bukti yang tersedia.

**Perubahan**

- Mengganti tabel screenshot lama dan pending screenshot dengan tabel bukti Level 2.
- Menambahkan wallet options, connected wallet, contract deployment, contract call, contract read, transaction status, live feed, dan event synchronization.
- Menyesuaikan ekstensi wallet connected menjadi `.jpeg`.
- Menggunakan `contracts.png` untuk deployment dan read contract data.
- Menggunakan `level2-live-feed.png` untuk live feed dan event synchronization.
- Mengubah seluruh path menjadi tautan Markdown yang dapat diklik.
- Menambahkan preview seluruh screenshot Level 2.
- Menandai checklist Level 2 submission screenshots sebagai selesai.

**Verifikasi**

- Seluruh enam file screenshot yang dirujuk tersedia pada `public/screenshots`.
- Tidak ada path screenshot Level 2 yang rusak pada tabel baru.

---

## Langkah 29 — Bukti Stellar Explorer

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menambahkan screenshot verifikasi Stellar Explorer pada dokumentasi submission.

**Perubahan**

- Menambahkan requirement `Stellar Explorer verification` pada tabel screenshot README.
- Menautkan file `public/screenshots-yellow-belt1/explore.png`.
- Menambahkan preview screenshot Explorer pada bagian Evidence Preview.

**Verifikasi**

- File Explorer tersedia dan path README valid.

---

## Langkah 30 — Bukti Contract Explorer

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Menambahkan screenshot Contract Explorer ke dokumentasi submission.

**Perubahan**

- Menambahkan requirement `Contract Explorer verification` pada tabel screenshot README.
- Menautkan `public/screenshots/contract-explore.png`.
- Menambahkan screenshot tersebut pada bagian Evidence Preview.
- Memastikan kembali path Stellar Explorer memakai file `explore.png` yang tersedia.

**Verifikasi**

- File `contract-explore.png` tersedia dan path README valid.

---

## Langkah 31 — English Yellow Belt Submission Checklist

**Tanggal:** 25 Juli 2026
**Status:** SELESAI

**Tujuan**

Memperbarui `YELLOW_BELT_STEP_BY_STEP.md` menjadi panduan dan checklist submission berbahasa Inggris yang sesuai dengan kondisi project terbaru.

**Perubahan**

- Menulis ulang seluruh panduan dalam bahasa Inggris.
- Memperbarui contract ID, deployment hash, CLI validation hash, live demo, dan contract record count.
- Menandai implementasi multi-wallet, error handling, contract, event synchronization, status transaksi, tests, build, dan screenshots sebagai selesai.
- Menjaga frontend contract transaction hash sebagai pending sampai hash tepat dicatat di README.
- Menjaga commit/push screenshot dan live demo README sebagai pending.
- Memperbarui command Windows `npm run dev` dan `npm run dev:poll`.
- Menambahkan final audit dan ready-to-submit rules.

**Verifikasi**

- Tidak ada bagian panduan berbahasa Indonesia yang tersisa.
- Checklist membedakan item teknis selesai dan bukti submission yang masih pending.

## Langkah 32 — Live Demo dan Contract Explorer Link

### Tujuan

Melengkapi bukti submission Yellow Belt Level 2 dengan tautan deployment frontend dan halaman contract Testnet yang dapat diverifikasi.

### Perubahan

- Menambahkan live demo `https://lumenpay-flame.vercel.app/` pada bagian awal README dan Useful Links.
- Membuat Contract ID menjadi tautan langsung ke halaman contract di Stellar Expert Testnet.
- Menambahkan baris screenshot transaction status ke tabel evidence README.
- Menandai checklist live demo, Contract Explorer link, dan transaction-status screenshot sebagai selesai.
- Memperbarui `YELLOW_BELT_STEP_BY_STEP.md` agar status checklist sesuai dengan bukti terbaru.

### Catatan

- URL contract Stellar Expert adalah halaman contract, bukan hash transaksi individual.
- Transaction hash frontend `record_payment` masih perlu diambil dari transaksi yang ditandatangani melalui wallet pada aplikasi.

## Langkah 33 — Frontend Contract Transaction Evidence

### Tujuan

Melengkapi bukti pemanggilan smart contract dari frontend untuk submission Yellow Belt Level 2.

### Perubahan

- Menambahkan transaction hash frontend `record_payment` ke tabel Contract Evidence di README.
- Menambahkan tautan langsung transaksi tersebut ke Stellar Expert Testnet.
- Menandai requirement frontend contract transaction hash sebagai selesai.
- Memperbarui final evidence record dan checklist pada `YELLOW_BELT_STEP_BY_STEP.md`.

### Bukti

- Transaction hash: `182b2c71f4df58700e39eacb3e830cd321feafa3412845c2058f79179b1b6a1a`.
- Explorer: `https://stellar.expert/explorer/testnet/tx/182b2c71f4df58700e39eacb3e830cd321feafa3412845c2058f79179b1b6a1a`.

### Catatan

- Bukti ini diberikan sebagai transaksi contract call yang dijalankan melalui alur frontend wallet.
- Langkah submission yang tersisa adalah commit, push, dan verifikasi seluruh bukti pada repository publik.
- `git diff --check` tidak menemukan whitespace error pada file panduan.
