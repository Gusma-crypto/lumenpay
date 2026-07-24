# LumenPayTracker — Command Reference

Panduan ini menjelaskan command untuk build, deploy, dan memanggil setiap fungsi contract `LumenPayTracker` menggunakan PowerShell dan Stellar CLI.

## 1. Masuk ke Folder Contract

```powershell
cd Z:\hackathon-stellar\lumenpay-stellar\contracts
```

Semua command berikut dijalankan dari folder tersebut.

## 2. Variable yang Digunakan

Supaya command lebih mudah dibaca, buat variable PowerShell:

```powershell
$ContractId = "CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD"
$Deployer = "lumenpay-deployer"
$Sender = "GCT45UYJ2KR2ILNHOBCKGJ25HA42QLWLPNOTP7JFFTEMM46RADJXGMKV"
$Recipient = "GCT45UYJ2KR2ILNHOBCKGJ25HA42QLWLPNOTP7JFFTEMM46RADJXGMKV"
```

Keterangan:

- `$ContractId`: address contract yang diawali `C`.
- `$Deployer`: alias identity lokal untuk signing Testnet.
- `$Sender`: address yang mengotorisasi pencatatan.
- `$Recipient`: address penerima yang akan dicatat.

Variable hanya berlaku pada terminal PowerShell yang sedang dibuka.

## 3. Periksa Stellar CLI

```powershell
stellar --version
```

Versi yang digunakan project:

```txt
stellar 23.0.0
```

## 4. Unit Test Contract

```powershell
cargo test --locked
```

Hasil yang diharapkan:

```txt
5 passed; 0 failed
```

Unit test tidak membuat transaksi Testnet dan tidak membutuhkan XLM.

## 5. Periksa Format Rust

```powershell
cargo fmt --all -- --check
```

Jika ingin memperbaiki format otomatis:

```powershell
cargo fmt --all
```

## 6. Build Contract

```powershell
stellar contract build
```

Output:

```txt
target\wasm32v1-none\release\lumenpay_tracker.wasm
```

Build contract saat ini mempunyai fungsi:

```txt
record_payment
get_payment
get_payment_count
```

## 7. Deploy Contract Baru

Jalankan ini hanya jika ingin membuat deployment dan contract ID baru:

```powershell
stellar contract deploy --wasm target\wasm32v1-none\release\lumenpay_tracker.wasm --source $Deployer --network testnet
```

Output berupa address contract baru:

```txt
C...
```

Penting:

- Setiap deployment baru dapat menghasilkan contract ID baru.
- Setelah deploy, update `$ContractId` dan `NEXT_PUBLIC_TRACKER_CONTRACT_ID`.
- Tidak perlu deploy ulang untuk sekadar membaca atau mengetes contract yang sudah ada.

---

# Fungsi Contract

## 8. `get_payment_count`

Tujuan:

Membaca jumlah payment record yang sudah disimpan.

Jenis:

```txt
Read-only
```

Command:

```powershell
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- get_payment_count
```

Contoh output:

```txt
1
```

Artinya terdapat satu payment record.

Command lengkap tanpa variable:

```powershell
stellar contract invoke --id CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD --source lumenpay-deployer --network testnet -- get_payment_count
```

Karena read-only, command hanya melakukan simulation dan tidak membuat transaction hash baru.

## 9. `get_payment`

Tujuan:

Membaca satu payment berdasarkan ID.

Jenis:

```txt
Read-only
```

Command untuk membaca payment ID `1`:

```powershell
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- get_payment --id 1
```

Command lengkap tanpa variable:

```powershell
stellar contract invoke --id CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD --source lumenpay-deployer --network testnet -- get_payment --id 1
```

Output berisi:

```txt
id
sender
recipient
amount
payment_hash
ledger
```

Jika ID tidak tersedia, hasilnya berupa `null`/`None`.

Contoh:

```powershell
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- get_payment --id 999
```

## 10. `record_payment`

Tujuan:

Menyimpan payment record baru dan menerbitkan event `PaymentRecorded`.

Jenis:

```txt
Write transaction
```

Function parameters:

```txt
sender
recipient
amount
payment_hash
```

Siapkan payment hash yang unik:

```powershell
$PaymentHash = "manual-test-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
```

Jalankan contract:

```powershell
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- record_payment --sender $Sender --recipient $Recipient --amount 1000000 --payment_hash $PaymentHash
```

Keterangan amount:

```txt
1 XLM   = 10,000,000 stroops
0.1 XLM = 1,000,000 stroops
0.01 XLM = 100,000 stroops
```

Contoh output sukses:

```txt
2
Transaction submitted successfully!
Event: PaymentRecorded
```

Angka `2` berarti record mendapatkan ID 2.

Command lengkap tanpa variable:

```powershell
stellar contract invoke --id CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD --source lumenpay-deployer --network testnet -- record_payment --sender GCT45UYJ2KR2ILNHOBCKGJ25HA42QLWLPNOTP7JFFTEMM46RADJXGMKV --recipient GCT45UYJ2KR2ILNHOBCKGJ25HA42QLWLPNOTP7JFFTEMM46RADJXGMKV --amount 1000000 --payment_hash manual-test-002
```

Jangan memakai `payment_hash` yang sama dua kali.

---

# Pengujian Error

## 11. Test Invalid Amount

Gunakan amount `0`:

```powershell
$PaymentHash = "invalid-amount-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

stellar contract invoke --id $ContractId --source $Deployer --network testnet -- record_payment --sender $Sender --recipient $Recipient --amount 0 --payment_hash $PaymentHash
```

Hasil yang diharapkan:

```txt
Error(Contract, #1)
```

Error code:

```txt
#1 = InvalidAmount
```

Transaksi gagal dan record tidak disimpan.

## 12. Test Duplicate Payment

Buat satu hash tetap:

```powershell
$DuplicateHash = "duplicate-study-001"
```

Simpan pertama kali:

```powershell
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- record_payment --sender $Sender --recipient $Recipient --amount 100000 --payment_hash $DuplicateHash
```

Jalankan command yang sama untuk kedua kalinya:

```powershell
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- record_payment --sender $Sender --recipient $Recipient --amount 100000 --payment_hash $DuplicateHash
```

Pemanggilan kedua harus menghasilkan:

```txt
Error(Contract, #2)
```

Error code:

```txt
#2 = DuplicatePayment
```

## 13. Test Authorization

`sender` harus sama dengan account yang dapat diotorisasi oleh `$Deployer`.

Jika sender diganti dengan address lain yang tidak ditandatangani:

```powershell
$OtherSender = "G...ADDRESS_LAIN..."

stellar contract invoke --id $ContractId --source $Deployer --network testnet -- record_payment --sender $OtherSender --recipient $Recipient --amount 100000 --payment_hash unauthorized-test-001
```

Hasil yang diharapkan:

```txt
authorization/signature error
```

Contract memanggil:

```rust
sender.require_auth();
```

Karena itu deployer tidak dapat mencatat payment atas nama address lain tanpa authorization yang benar.

---

# Verifikasi Explorer dan Event

## 14. Buka Contract di Explorer

```powershell
Start-Process "https://stellar.expert/explorer/testnet/contract/$ContractId"
```

Atau buka manual:

```txt
https://stellar.expert/explorer/testnet/contract/CANCP3MHEGUZMNWXJ7FWPO5OLPZW6JBPBIHH7O4SMDVKYMXLI5EEKAKD
```

## 15. Buka Transaction Hash

Setelah `record_payment` sukses, terminal menampilkan hash seperti:

```txt
21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35
```

Simpan sebagai variable:

```powershell
$TransactionHash = "21e5d6d77dd9a8d55445717e7222b44944e6095fe01a458dec72d5068cabce35"
```

Buka Explorer:

```powershell
Start-Process "https://stellar.expert/explorer/testnet/tx/$TransactionHash"
```

Di Explorer, periksa:

- Network menunjukkan `testnet`.
- Transaction status sukses.
- Contract ID sesuai.
- Function adalah `record_payment`.
- Event adalah `PaymentRecorded`.
- Sender, recipient, amount, dan payment hash sesuai.

## 16. Alur Belajar yang Disarankan

Jalankan berurutan:

```powershell
# 1. Jalankan unit test
cargo test --locked

# 2. Build WASM
stellar contract build

# 3. Baca jumlah record
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- get_payment_count

# 4. Buat hash unik
$PaymentHash = "study-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# 5. Tulis record
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- record_payment --sender $Sender --recipient $Recipient --amount 100000 --payment_hash $PaymentHash

# 6. Baca jumlah record terbaru
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- get_payment_count

# 7. Baca record berdasarkan ID output langkah 5
stellar contract invoke --id $ContractId --source $Deployer --network testnet -- get_payment --id 2
```

## 17. Perbedaan CLI Test dan Frontend Test

CLI test:

- Ditandatangani oleh identity `lumenpay-deployer`.
- Berguna untuk mempelajari dan memverifikasi contract.
- Tidak membuktikan wallet selector frontend.

Frontend test:

- Ditandatangani oleh wallet yang dipilih melalui StellarWalletsKit.
- Membuktikan requirement `contract called from frontend`.
- Hash frontend sebaiknya digunakan sebagai bukti utama submission.

Gunakan CLI untuk belajar/debugging, kemudian lakukan test final melalui frontend.

