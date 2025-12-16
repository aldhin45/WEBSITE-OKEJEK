// public/js/daftar-driver.js

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById("driverForm");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault(); // Mencegah reload halaman
            
            const btn = document.getElementById("btnSubmit");
            
            // Simpan teks asli tombol (opsional, biar rapi)
            const originalText = btn.textContent;
            
            // Ubah tombol jadi loading
            btn.textContent = "Memproses...";
            btn.disabled = true;

            // Kumpulkan data dari form
            const data = {
                nama: document.getElementById('nama').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                no_telepon: document.getElementById('no_telepon').value,
                jenis_kendaraan: document.getElementById('jenis_kendaraan').value,
                merk_kendaraan: document.getElementById('merk_kendaraan').value,
                nomor_polisi: document.getElementById('nomor_polisi').value
            };

            try {
                // Kirim data ke server
                const response = await fetch("/daftar-driver", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    alert("Pendaftaran Mitra Berhasil! Silakan Login.");
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