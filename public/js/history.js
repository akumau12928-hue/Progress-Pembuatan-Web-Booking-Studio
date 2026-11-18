document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. PROTEKSI HALAMAN (WAJIB LOGIN)
    // ==========================================
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn !== "true") {
        alert("Silakan login terlebih dahulu untuk melihat profil dan histori pemesanan.");
        window.location.href = "login.html";
        return;
    }

    const savedUsername = localStorage.getItem("username") || "-";
    let savedEmail = localStorage.getItem("userEmail") || "";

    // Fallback: cari email di daftar akun jika sesi login lama belum menyimpan userEmail
    if (!savedEmail) {
        const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
        const currentUser = users.find(
            (u) => u.username.toLowerCase() === savedUsername.toLowerCase()
        );
        if (currentUser) {
            savedEmail = currentUser.email;
            localStorage.setItem("userEmail", savedEmail);
        }
    }

    // ==========================================
    // 2. HELPER FORMAT TANGGAL, JAM, & STATUS
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

        if (isNaN(startHour)) return `${jamMulai} WIB (${durasiText})`;

        const endHour = (startHour + durasiJam) % 24;
        const formattedEndHour = String(endHour).padStart(2, "0");
        return `${jamMulai} - ${formattedEndHour}:${minuteStr || "00"} WIB (${durasiText})`;
    }

    function getStatusBadgeClass(statusText) {
        const normalized = (statusText || "").toUpperCase();
        if (normalized === "TERVERIFIKASI" || normalized === "VERIFIED") {
            return "badge-status verified";
        }
        if (normalized === "DITOLAK" || normalized === "REJECTED") {
            return "badge-status rejected";
        }
        return "badge-status";
    }

    // ==========================================
    // 3. FILTER HISTORI & ISI DETAIL AKUN
    // ==========================================
    const allBookings = JSON.parse(localStorage.getItem("gokilzzz_all_bookings")) || [];

    const userBookings = allBookings
        .filter((item) => {
            if (savedEmail && item.userEmail) {
                return item.userEmail.toLowerCase() === savedEmail.toLowerCase();
            }
            return (item.username || "").toLowerCase() === savedUsername.toLowerCase();
        })
        .reverse(); // Urutkan dari transaksi terbaru

    const profileUsernameEl = document.getElementById("profileUsername");
    const profileEmailEl = document.getElementById("profileEmail");
    const profileTotalBookingEl = document.getElementById("profileTotalBooking");

    if (profileUsernameEl) profileUsernameEl.textContent = savedUsername;
    if (profileEmailEl) profileEmailEl.textContent = savedEmail || "-";
    if (profileTotalBookingEl) {
        profileTotalBookingEl.textContent = `${userBookings.length} Pemesanan`;
    }

    // ==========================================
    // 4. RENDER DAFTAR KARTU HISTORI PEMESANAN
    // ==========================================
    const historyListEl = document.getElementById("historyList");
    const emptyHistoryEl = document.getElementById("emptyHistory");

    if (!historyListEl || !emptyHistoryEl) return;

    if (userBookings.length === 0) {
        historyListEl.innerHTML = "";
        historyListEl.style.display = "none";
        emptyHistoryEl.style.display = "block";
        return;
    }

    emptyHistoryEl.style.display = "none";
    historyListEl.style.display = "flex";

    historyListEl.innerHTML = userBookings
        .map((booking) => {
            const nominal = Number(booking.totalHarga) || 0;
            const statusLabel = booking.status || "MENUNGGU VERIFIKASI";
            const badgeClass = getStatusBadgeClass(statusLabel);

            return `
                <article class="history-card">
                    <div class="history-card-header">
                        <div class="booking-code-wrapper">
                            <span class="booking-code-label">KODE BOOKING</span>
                            <strong class="booking-code">${booking.kodeBooking || "-"}</strong>
                        </div>
                        <span class="${badgeClass}">${statusLabel}</span>
                    </div>

                    <div class="history-details-grid">
                        <div class="history-detail-item">
                            <span>NAMA PEMESAN</span>
                            <strong>${booking.nama || "-"}</strong>
                        </div>
                        <div class="history-detail-item">
                            <span>NOMOR WHATSAPP</span>
                            <strong>${booking.whatsapp || "-"}</strong>
                        </div>
                        <div class="history-detail-item">
                            <span>PAKET SEWA</span>
                            <strong>${booking.paket || "-"}</strong>
                        </div>
                        <div class="history-detail-item">
                            <span>TANGGAL BOOKING</span>
                            <strong>${formatTanggalIndonesia(booking.tanggal)}</strong>
                        </div>
                        <div class="history-detail-item">
                            <span>JAM & DURASI</span>
                            <strong>${formatRentangJam(booking.jam, booking.durasi)}</strong>
                        </div>
                        <div class="history-detail-item">
                            <span>PENGIRIM TRANSFER</span>
                            <strong>${booking.namaPengirim || "-"}</strong>
                        </div>
                    </div>

                    <div class="history-card-footer">
                        <span class="history-timestamp">Dibuat pada: ${booking.waktuPembayaran || "-"}</span>
                        <div class="history-total">
                            <span>TOTAL BAYAR:</span>
                            <strong>Rp ${nominal.toLocaleString("id-ID")}</strong>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");
});