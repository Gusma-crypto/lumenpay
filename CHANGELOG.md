# Changelog

Semua catatan perubahan penting untuk LumenPay Lite dicatat di file ini.

## [2.0.0] - 2026-07-24

### Added

- Menambahkan halaman penuh untuk menu Send Payment sesuai referensi `send.png`.
- Menambahkan halaman penuh untuk menu Activity Feed sesuai referensi `activity.png`.
- Menambahkan halaman penuh untuk menu My Wallets sesuai referensi `wallets.png`.
- Menambahkan halaman penuh untuk menu Contracts sesuai referensi `contract.png`.
- Menambahkan halaman penuh untuk menu Settings sesuai referensi `settings.png`.
- Menambahkan halaman penuh untuk menu About sesuai referensi `about.png`.
- Menambahkan alur pembayaran bertahap: Input, Review, Sign & Send, dan Complete.
- Menambahkan popup review sebelum transaksi ditandatangani.
- Menambahkan tampilan ringkasan transaksi sukses dengan From, To, Amount, Network Fee, Total, dan hash transaksi.
- Menambahkan link hash transaksi ke Stellar Expert Testnet.
- Menambahkan kontrol Settings untuk wallet, explorer, theme, compact mode, konfirmasi transaksi, dan clear local data.

### Changed

- Menghapus konten dashboard bawaan dari halaman Send Payment, Activity Feed, My Wallets, Contracts, Settings, dan About.
- Memperbaiki tampilan popup connect wallet agar font lebih jelas dan kontras warna lebih baik.
- Memperbaiki warna notifikasi agar teks dan background tidak sama.
- Memperbaiki tampilan notifikasi Transaction Successful agar lebih rapi dan mudah dibaca.
- Merapikan sidebar dengan menghapus kartu Level 2, Yellow Belt, Build. Ship. On Stellar, dan tombol View Guide.
- Mengubah script dev agar menggunakan polling watcher dan host `127.0.0.1`.
- Mengubah script lint dari `next lint` ke `eslint .`.

### Fixed

- Memperbaiki masalah server dev yang sering stuck di `Starting...`.
- Memperbaiki error port `EADDRINUSE` dengan memastikan server lama dapat dihentikan sebelum menjalankan ulang dev server.
- Memperbaiki reset form setelah status transaksi berada di Complete.
- Memperbaiki proses stepper agar warna dan status aktif mengikuti tahap transaksi.
- Memperbaiki beberapa fungsi tombol menu agar membuka halaman yang sesuai.

### Verified

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## [0.1.0] - Initial Release

### Added

- Setup awal LumenPay Lite berbasis Next.js, React, dan TypeScript.
- Integrasi StellarWalletsKit untuk koneksi multi-wallet.
- Form pembayaran native XLM di Stellar Testnet.
- Validasi alamat recipient dan amount.
- Integrasi Horizon Testnet untuk balance dan riwayat transaksi.
- Integrasi Soroban smart contract `LumenPayTracker`.
- Sinkronisasi activity feed dari event kontrak.
- Link transaksi ke Stellar Expert Testnet.
