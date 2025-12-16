// public/js/reset-password.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Ambil Token dari URL 
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Cek Validitas Token
    if (!token) {
        alert("Token tidak valid atau URL rusak!");
        window.location.href = '/login';
        return; // Hentikan script jika token tidak ada
    }

    // Handle Submit Form
    const form = document.getElementById("resetForm");
    
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const passwordInput = document.getElementById("password");
            const password = passwordInput.value;
            const btnSubmit = form.querySelector("button");

            // Validasi sederhana di sisi client
            if (password.length < 6) {
                alert("Password minimal 6 karakter.");
                return;
            }

            // Matikan tombol biar gak diklik 2x
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Menyimpan...";

            try {
                const response = await fetch("/api/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, password })
                });
                
                const result = await response.json();

                if (result.success) {
                    alert("Sukses! Password berhasil diubah. Silakan login kembali.");
                    window.location.href = "/login";
                } else {
                    alert("Gagal: " + result.message);
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Simpan Password";
                }
            } catch (err) {
                console.error(err);
                alert("Terjadi kesalahan koneksi ke server.");
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Simpan Password";
            }
        });
    }
});