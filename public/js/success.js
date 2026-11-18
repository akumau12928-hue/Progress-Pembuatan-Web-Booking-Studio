document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. AMBIL & VALIDASI DATA TRANSAKSI SELESAI
    // ==========================================
    const rawCompletedData = localStorage.getItem("gokilzzz_completed_booking");

    if (!rawCompletedData) {
        alert("Data reservasi tidak ditemukan. Silakan lakukan pemesanan terlebih dahulu.");
        window.location.href = "dashboard.html";
        return;
    }

    const booking = JSON.parse(rawCompletedData);

    // ==========================================
    // 2. HELPER FORMAT TANGGAL & RENTANG JAM
    // ==========================================
    function formatTanggalIndonesia(dateString) {
        if (!dateString) return "-";
        const dateObj = new Date(dateString + "T00:00:00");
        if (isNaN(dateObj.getTime())) return dateString;

        return dateObj.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    function formatRentangJam(jamMulai, durasiText) {
        if (!jamMulai) return "-";
        const durasiJam = parseInt(durasiText) || 1;
        const [hourStr, minuteStr] = jamMulai.split(":");
        const startHour = parseInt(hourStr);

        if (isNaN(startHour)) return `${jamMulai} WIB`;

        const endHour = (startHour + durasiJam) % 24;
        const formattedEndHour = String(endHour).padStart(2, "0");
        return `${jamMulai} - ${formattedEndHour}:${minuteStr || "00"} WIB`;
    }

    // ==========================================
    // 3. TAMPILKAN RINCIAN KE ELEMEN HTML
    // ==========================================
    const setElementText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || "-";
    };

    setElementText("resKodeBooking", booking.kodeBooking);
    setElementText("resNama", booking.nama);
    setElementText("resWhatsapp", booking.whatsapp);
    setElementText("resTanggal", formatTanggalIndonesia(booking.tanggal));
    setElementText("resJam", formatRentangJam(booking.jam, booking.durasi));
    setElementText("resDurasi", booking.durasi);
    setElementText("resPaket", booking.paket);

    const nominal = Number(booking.totalHarga) || 0;
    setElementText("resTotalHarga", "Rp " + nominal.toLocaleString("id-ID"));
});