document.addEventListener("DOMContentLoaded", () => {
    const paymentForm = document.getElementById("paymentForm");
    const namaPaymentInput = document.getElementById("namaPayment");
    const whatsappPaymentInput = document.getElementById("whatsappPayment");
    const paketDipilihText = document.getElementById("paketDipilihText");
    const durasiDipilihText = document.getElementById("durasiDipilihText");
    const totalHargaText = document.getElementById("totalHargaText");
    const namaPengirimInput = document.getElementById("namaPengirim");

    const buktiFileInput = document.getElementById("buktiFile");
    const uploadBtnTrigger = document.getElementById("uploadBtnTrigger");
    const fileNameLabel = document.getElementById("fileNameLabel");

    let buktiBase64 = "";
    let namaFileBukti = "";

    // ==========================================
    // 1. AMBIL & VALIDASI DATA DARI HALAMAN BOOKING
    // ==========================================
    const rawBookingData = localStorage.getItem("gokilzzz_booking");

    if (!rawBookingData) {
        alert("Data booking tidak ditemukan. Silakan isi form pemesanan terlebih dahulu.");
        window.location.href = "booking.html";
        return;
    }

    const bookingData = JSON.parse(rawBookingData);

    // ==========================================
    // 2. TAMPILKAN DATA KE FORM & RINCIAN TAGIHAN
    // ==========================================
    if (namaPaymentInput) namaPaymentInput.value = bookingData.nama || "";
    if (whatsappPaymentInput) whatsappPaymentInput.value = bookingData.whatsapp || "";
    if (paketDipilihText) paketDipilihText.textContent = bookingData.paket || "-";
    if (durasiDipilihText) durasiDipilihText.textContent = bookingData.durasi || "-";

    if (totalHargaText) {
        const nominal = Number(bookingData.totalHarga) || 0;
        totalHargaText.textContent = "Rp " + nominal.toLocaleString("id-ID");
    }

    // ==========================================
    // 3. INTERAKSI CUSTOM UPLOAD BUKTI PEMBAYARAN
    // ==========================================
    if (uploadBtnTrigger && buktiFileInput) {
        uploadBtnTrigger.addEventListener("click", () => {
            buktiFileInput.click();
        });

        buktiFileInput.addEventListener("change", () => {
            const file = buktiFileInput.files[0];
            if (!file) return;

            // Validasi tipe file (hanya gambar)
            if (!file.type.startsWith("image/")) {
                alert("Format file tidak valid! Harap unggah gambar (JPG, PNG, atau JPEG).");
                buktiFileInput.value = "";
                fileNameLabel.textContent = "Tambahkan file...";
                fileNameLabel.style.color = "";
                buktiBase64 = "";
                namaFileBukti = "";
                return;
            }

            // Validasi ukuran file maksimal 2MB (aman untuk localStorage & upload)
            const maxSize = 2 * 1024 * 1024;
            if (file.size > maxSize) {
                alert("Ukuran file terlalu besar! Maksimal ukuran bukti transfer adalah 2 MB.");
                buktiFileInput.value = "";
                fileNameLabel.textContent = "Tambahkan file...";
                fileNameLabel.style.color = "";
                buktiBase64 = "";
                namaFileBukti = "";
                return;
            }

            // Tampilkan nama file yang dipilih
            namaFileBukti = file.name;
            fileNameLabel.textContent = namaFileBukti;
            fileNameLabel.style.color = "#c5a880";

            // Konversi gambar ke Base64 untuk disimpan sementara
            const reader = new FileReader();
            reader.onload = (event) => {
                buktiBase64 = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // ==========================================
    // 4. HELPER GENERATOR KODE BOOKING UNIK
    // ==========================================
    function generateKodeBooking() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const randomDigits = Math.floor(1000 + Math.random() * 9000);
        return `GKZ-${year}${month}${day}-${randomDigits}`;
    }

    // ==========================================
    // 5. SUBMIT PEMBAYARAN -> SIMPAN & KE SUCCESS.HTML
    // ==========================================
    if (paymentForm) {
        paymentForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const namaPengirim = namaPengirimInput ? namaPengirimInput.value.trim() : "";
            if (!namaPengirim) {
                alert("Harap isi nama pemilik rekening atau e-wallet pengirim!");
                namaPengirimInput.focus();
                return;
            }

            // Validasi manual file karena input file asli disembunyikan CSS
            if (!buktiFileInput || !buktiFileInput.files || buktiFileInput.files.length === 0) {
                alert("Silakan unggah foto bukti pembayaran QRIS terlebih dahulu!");
                return;
            }

            const kodeBooking = generateKodeBooking();
            const waktuTransaksi = new Date().toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short"
            });

            // Gabungkan data booking + data pembayaran (siap untuk struktur DB)
            const completedBooking = {
                ...bookingData,
                kodeBooking: kodeBooking,
                namaPengirim: namaPengirim,
                namaFileBukti: namaFileBukti,
                buktiBase64: buktiBase64,
                waktuPembayaran: waktuTransaksi,
                status: "MENUNGGU VERIFIKASI"
            };

            // Simpan transaksi terakhir untuk ditampilkan di success.html
            localStorage.setItem("gokilzzz_completed_booking", JSON.stringify(completedBooking));

            // Simpan ke daftar riwayat semua booking (simulasi tabel database)
            const allBookings = JSON.parse(localStorage.getItem("gokilzzz_all_bookings")) || [];
            allBookings.push(completedBooking);
            localStorage.setItem("gokilzzz_all_bookings", JSON.stringify(allBookings));

            // Hapus draft booking sementara agar tidak terduplikasi
            localStorage.removeItem("gokilzzz_booking");

            alert("Bukti pembayaran berhasil dikirim! Mengalihkan ke halaman konfirmasi...");
            window.location.href = "success.html";
        });
    }
});