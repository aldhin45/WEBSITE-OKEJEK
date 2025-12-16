// public/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Mencegah reload halaman

            // Ambil elemen
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const btn = document.getElementById("btnSubmit");

            // Ubah tombol jadi loading
            const textAsli = btn.textContent;
            btn.textContent = "Memuat...";
            btn.disabled = true;

            try {
                // Kirim data ke server
                const response = await fetch("/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();

                if (result.success) {
                    // Cek Role untuk Redirect yang sesuai
                    if (result.role === 'admin') {
                        window.location.href = "/admin";
                    } else if (result.role === 'driver') {
                        window.location.href = "/driver-dashboard";
                    } else {
                        window.location.href = "/home"; 
                    }
                } else {
                    // Jika gagal (Password salah / User tidak ada)
                    alert(result.message);
                    
                    // Kembalikan tombol seperti semula
                    btn.textContent = textAsli;
                    btn.disabled = false;
                }

            } catch (error) {
                console.error("Error:", error);
                alert("Terjadi kesalahan koneksi ke server.");
                
                // Kembalikan tombol seperti semula
                btn.textContent = textAsli;
                btn.disabled = false;
            }
        });
    }
});