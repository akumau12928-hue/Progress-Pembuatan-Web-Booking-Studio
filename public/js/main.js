// ==========================================
// KONFIGURASI EMAILJS
// ==========================================
const EMAILJS_PUBLIC_KEY = "NqKDbK9SCeLW0RTEz";
const EMAILJS_SERVICE_ID = "service_86l49h5";
const EMAILJS_TEMPLATE_ID = "template_57q5ne2";

if (typeof emailjs !== "undefined") {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

// Helper untuk mengambil & menyimpan daftar akun user
function getUsers() {
    return JSON.parse(localStorage.getItem("registeredUsers")) || [];
}

function saveUsers(users) {
    localStorage.setItem("registeredUsers", JSON.stringify(users));
}

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. CEK STATUS LOGIN & UBAH NAVBAR JADI PROFIL
    // ==========================================
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const savedUsername = localStorage.getItem("username") || "User";
    let navAuthArea = document.getElementById("navAuthArea");

    // Fallback: jika halaman belum punya #navAuthArea, bungkus tombol auth di navbar
    if (!navAuthArea && isLoggedIn === "true") {
        const navbarAuthBtn = document.querySelector(".navbar .btn-auth, .navbar .btn-outline");
        if (navbarAuthBtn) {
            const wrapper = document.createElement("div");
            wrapper.id = "navAuthArea";
            navbarAuthBtn.parentNode.replaceChild(wrapper, navbarAuthBtn);
            navAuthArea = wrapper;
        }
    }

    if (navAuthArea && isLoggedIn === "true") {
        navAuthArea.innerHTML = `
            <div class="user-menu">
                <button type="button" class="user-icon-btn" id="userIconBtn" title="Profil Akun">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <span class="user-name-label">Halo, ${savedUsername}</span>
                    <a href="history.html" class="dropdown-link">HISTORY</a>
                    <button type="button" class="btn-logout" id="logoutBtn">KELUAR</button>
                </div>
            </div>
        `;

        const userIconBtn = document.getElementById("userIconBtn");
        const userDropdown = document.getElementById("userDropdown");

        userIconBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle("show");
        });

        document.addEventListener("click", () => {
            userDropdown.classList.remove("show");
        });

        const logoutBtn = document.getElementById("logoutBtn");
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("username");
            localStorage.removeItem("userEmail");
            alert("Anda telah keluar.");
            window.location.href = "dashboard.html";
        });
    }

    // ==========================================
    // 2. HANDLING REGISTER FORM (SIMPAN DATA AKUN)
    // ==========================================
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("regUsername").value.trim();
            const email = document.getElementById("regEmail").value.trim().toLowerCase();
            const password = document.getElementById("regPassword").value;
            const confirmPassword = document.getElementById("regConfirmPassword").value;

            if (password !== confirmPassword) {
                alert("Password dan Ulangi Password tidak cocok!");
                return;
            }

            const users = getUsers();
            const isExist = users.some(
                (u) => u.email === email || u.username.toLowerCase() === username.toLowerCase()
            );

            if (isExist) {
                alert("Username atau Email sudah terdaftar! Silakan gunakan yang lain.");
                return;
            }

            users.push({ username, email, password });
            saveUsers(users);

            alert("Pendaftaran Berhasil! Silakan login menggunakan akun Anda.");
            window.location.href = "login.html";
        });
    }

    // ==========================================
    // 3. HANDLING LOGIN FORM (VALIDASI DATA AKUN)
    // ==========================================
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const loginInput = document.getElementById("loginInput").value.trim();
            const passwordInput = document.getElementById("passwordInput").value;

            const users = getUsers();
            const validUser = users.find(
                (u) =>
                    (u.email === loginInput.toLowerCase() || u.username === loginInput) &&
                    u.password === passwordInput
            );

            if (!validUser) {
                alert("Username/Email atau Password salah! Pastikan Anda sudah mendaftar.");
                return;
            }

            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("username", validUser.username);
            localStorage.setItem("userEmail", validUser.email);

            alert(`Login Berhasil! Selamat datang, ${validUser.username}.`);
            window.location.href = "dashboard.html";
        });
    }

    // ==========================================
    // 4. LUPA PASSWORD: EMAIL -> INPUT OTP & TIMER 1 MENIT
    // ==========================================
    const emailStepForm = document.getElementById("emailStepForm");
    const otpForm = document.getElementById("otpForm");
    const resetEmailInput = document.getElementById("resetEmail");
    const sendOtpBtn = document.getElementById("sendOtpBtn");
    const changeEmailBtn = document.getElementById("changeEmailBtn");
    const otpTimerBox = document.getElementById("otpTimerBox");

    let countdownInterval = null;
    let isOtpExpired = false;

    function startOneMinuteTimer() {
        clearInterval(countdownInterval);
        let secondsLeft = 60;
        isOtpExpired = false;

        otpTimerBox.disabled = true;
        otpTimerBox.classList.remove("resend-ready");
        otpTimerBox.textContent = "01:00";

        countdownInterval = setInterval(() => {
            secondsLeft--;
            const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
            const secs = String(secondsLeft % 60).padStart(2, "0");
            otpTimerBox.textContent = `${mins}:${secs}`;

            if (secondsLeft <= 0) {
                clearInterval(countdownInterval);
                isOtpExpired = true;
                otpTimerBox.disabled = false;
                otpTimerBox.classList.add("resend-ready");
                otpTimerBox.textContent = "KIRIM ULANG";
            }
        }, 1000);
    }

    function sendOtpToEmail(emailInput) {
        const users = getUsers();
        const targetUser = users.find((u) => u.email === emailInput);

        if (!targetUser) {
            alert("Email tidak ditemukan! Pastikan email tersebut sudah terdaftar.");
            return;
        }

        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expireDate = new Date(Date.now() + 15 * 60000);
        const expireTime = expireDate.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit"
        });

        sessionStorage.setItem("pendingOtp", generatedOtp);
        sessionStorage.setItem("pendingResetEmail", emailInput);

        sendOtpBtn.disabled = true;
        sendOtpBtn.textContent = "MENGIRIM KODE...";
        otpTimerBox.disabled = true;
        otpTimerBox.textContent = "...";

        emailjs
            .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                to_email: emailInput,
                passcode: generatedOtp,
                time: expireTime
            })
            .then(() => {
                alert(`Kode OTP berhasil dikirim ke ${emailInput}! Cek kotak masuk atau folder Spam.`);

                // Kunci email & tampilkan form input OTP + timer
                resetEmailInput.readOnly = true;
                sendOtpBtn.style.display = "none";
                changeEmailBtn.style.display = "inline-block";
                otpForm.style.display = "flex";

                startOneMinuteTimer();
            })
            .catch((error) => {
                console.error("Gagal kirim email:", error);
                alert("Gagal mengirim email OTP. Periksa kembali koneksi atau pengaturan EmailJS.");
                sendOtpBtn.disabled = false;
                sendOtpBtn.textContent = "KIRIM KODE OTP";
                otpTimerBox.disabled = false;
                otpTimerBox.classList.add("resend-ready");
                otpTimerBox.textContent = "KIRIM ULANG";
            });
    }

    if (emailStepForm) {
        emailStepForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const emailInput = resetEmailInput.value.trim().toLowerCase();
            if (!emailInput) return;
            sendOtpToEmail(emailInput);
        });
    }

    if (otpTimerBox) {
        otpTimerBox.addEventListener("click", () => {
            if (!isOtpExpired) return;
            const emailInput = resetEmailInput.value.trim().toLowerCase();
            sendOtpToEmail(emailInput);
        });
    }

    if (changeEmailBtn) {
        changeEmailBtn.addEventListener("click", () => {
            clearInterval(countdownInterval);
            resetEmailInput.readOnly = false;
            resetEmailInput.focus();
            sendOtpBtn.style.display = "block";
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = "KIRIM KODE OTP";
            changeEmailBtn.style.display = "none";
            otpForm.style.display = "none";
            document.getElementById("otpCode").value = "";
        });
    }

    // ==========================================
    // 5. VERIFIKASI KODE OTP -> LANJUT RESET PASSWORD
    // ==========================================
    if (otpForm) {
        otpForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const emailInput = resetEmailInput.value.trim().toLowerCase();
            const otpInput = document.getElementById("otpCode").value.trim();

            if (isOtpExpired) {
                alert("Waktu 1 menit telah habis! Silakan klik KIRIM ULANG di samping kotak OTP.");
                return;
            }

            const savedOtp = sessionStorage.getItem("pendingOtp");
            const savedEmail = sessionStorage.getItem("pendingResetEmail");

            if (!savedOtp || emailInput !== savedEmail) {
                alert("Silakan kirim kode OTP terlebih dahulu.");
                return;
            }

            if (otpInput !== savedOtp) {
                alert("Kode OTP salah! Periksa kembali kode 6 digit di email Anda.");
                return;
            }

            clearInterval(countdownInterval);
            alert("Kode OTP valid! Silakan buat password baru.");
            window.location.href = "reset password.html";
        });
    }

    // ==========================================
    // 6. SIMPAN PASSWORD BARU KE AKUN USER
    // ==========================================
    const resetForm = document.getElementById("resetPasswordForm");
    if (resetForm) {
        resetForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const newPass = document.getElementById("newPass").value;
            const confirmPass = document.getElementById("confirmPass").value;

            if (newPass !== confirmPass) {
                alert("Password baru dan Ulangi Password tidak cocok!");
                return;
            }

            const targetEmail = sessionStorage.getItem("pendingResetEmail");
            if (!targetEmail) {
                alert("Sesi reset password habis. Silakan ulangi proses lupa password.");
                window.location.href = "lupa password.html";
                return;
            }

            const users = getUsers();
            const userIndex = users.findIndex((u) => u.email === targetEmail);

            if (userIndex !== -1) {
                users[userIndex].password = newPass;
                saveUsers(users);
            }

            sessionStorage.removeItem("pendingOtp");
            sessionStorage.removeItem("pendingResetEmail");

            alert("Password berhasil diperbarui! Silakan login dengan password baru Anda.");
            window.location.href = "login.html";
        });
    }

    // ==========================================
    // 7. TOGGLE LIHAT/SEMBUNYIKAN PASSWORD (IKON MATA)
    // ==========================================
    const toggleButtons = document.querySelectorAll(".toggle-password");
    toggleButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            const passwordInput = document.getElementById(targetId);

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                btn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                passwordInput.type = "password";
                btn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    });

    // ==========================================
    // 8. HANDLING HALAMAN BOOKING (BOOKING.HTML)
    // ==========================================
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        const namaInput = document.getElementById("nama");
        const tanggalInput = document.getElementById("tanggal");
        const paketSelect = document.getElementById("paket");
        const durasiSelect = document.getElementById("durasi");
        const timeButtons = document.querySelectorAll(".time-btn");
        const jamDipilihInput = document.getElementById("jamDipilih");
        const estimasiHargaText = document.getElementById("estimasiHargaText");

        // Isi nama otomatis jika user sudah login
        if (isLoggedIn === "true" && namaInput && !namaInput.value) {
            namaInput.value = savedUsername;
        }

        // Batasi tanggal booking minimal hari ini
        if (tanggalInput) {
            const today = new Date().toISOString().split("T")[0];
            tanggalInput.setAttribute("min", today);
        }

        // Tangkap pilihan paket dari URL (jika klik dari halaman paket.html)
        const urlParams = new URLSearchParams(window.location.search);
        const paketFromUrl = urlParams.get("paket");
        if (paketFromUrl && paketSelect) {
            paketSelect.value = paketFromUrl;
        }

        // Interaksi tombol pemilihan jam
        timeButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                if (btn.classList.contains("disabled")) return;

                timeButtons.forEach((b) => b.classList.remove("selected"));
                btn.classList.add("selected");

                if (jamDipilihInput) {
                    jamDipilihInput.value = btn.getAttribute("data-time");
                }
            });
        });

        // Hitung estimasi total harga & validasi minimal durasi paket
        function hitungTotalHarga() {
            if (!paketSelect || !durasiSelect || !estimasiHargaText) return 0;

            const selectedOption = paketSelect.options[paketSelect.selectedIndex];
            const hargaPerJam = parseInt(selectedOption?.getAttribute("data-harga")) || 0;
            const minJam = parseInt(selectedOption?.getAttribute("data-min-jam")) || 1;

            Array.from(durasiSelect.options).forEach((opt) => {
                opt.disabled = parseInt(opt.value) < minJam;
            });

            if (parseInt(durasiSelect.value) < minJam) {
                durasiSelect.value = minJam.toString();
            }

            const durasi = parseInt(durasiSelect.value) || 1;
            const totalHarga = hargaPerJam * durasi;

            estimasiHargaText.textContent = "Rp " + totalHarga.toLocaleString("id-ID");
            return totalHarga;
        }

        if (paketSelect && durasiSelect) {
            paketSelect.addEventListener("change", hitungTotalHarga);
            durasiSelect.addEventListener("change", hitungTotalHarga);
            hitungTotalHarga();
        }

        // Submit form booking -> simpan data & lanjut ke payment.html
        bookingForm.addEventListener("submit", (e) => {
            e.preventDefault();

            if (!jamDipilihInput || !jamDipilihInput.value) {
                alert("Silakan pilih jam mulai booking terlebih dahulu!");
                return;
            }

            const totalHarga = hitungTotalHarga();
            const bookingData = {
                username: localStorage.getItem("username") || "",
                userEmail: localStorage.getItem("userEmail") || "",
                nama: namaInput.value.trim(),
                whatsapp: document.getElementById("whatsapp").value.trim(),
                tanggal: tanggalInput.value,
                paket: paketSelect.value,
                durasi: durasiSelect.value + " Jam",
                jam: jamDipilihInput.value,
                catatan: document.getElementById("catatan").value.trim() || "-",
                totalHarga: totalHarga
            };

            localStorage.setItem("gokilzzz_booking", JSON.stringify(bookingData));
            window.location.href = "payment.html";
        });
    }
});
