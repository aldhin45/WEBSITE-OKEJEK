// public/js/daftar.js

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById("daftarForm");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault(); // Mencegah reload halaman
            
            const btn = document.getElementById("btnSubmit");
            
            // Simpan teks asli tombol
            const originalText = btn.textContent;
            
            // Ubah tombol jadi loading
            btn.textContent = "Memproses...";
            btn.disabled = true;

            const data = {
                nama: document.getElementById('nama').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };

            try {
                // Kirim data ke server
                const response = await fetch("/daftar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    alert("Pendaftaran Berhasil! Silakan Login.");
                    window.location.href = "/login";
                } else {
                    alert(result.message);
                    // Reset tombol jika gagal
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            } catch (error) {
                console.error("Error:", error);
                alert("Gagal menghubungi server");
                
                // Reset tombol jika error koneksi
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});