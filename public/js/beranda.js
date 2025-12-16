// public/js/beranda.js

document.addEventListener('DOMContentLoaded', () => {

    // Set Tahun Copyright
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Load Nama User (Untuk Sapaan: "Hai, Budi")
    async function loadUserName() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
            const elUser = document.getElementById('username');
            
            if (data.success && elUser) {
                elUser.textContent = data.user.nama;
            }
        } catch (error) {
            console.error("Gagal mengambil data user:", error);
        }
    }

    // Load Driver Aktif (Visualisasi)
    async function loadDrivers() {
        try {
            const response = await fetch('/api/drivers');
            const result = await response.json();
            const container = document.getElementById('driverContainer');
            
            if (!container) return;

            if (result.success && result.data.length > 0) {
                container.innerHTML = ''; // Hapus teks "Mencari driver..."

                result.data.forEach(driver => {
                    // Buat Inisial
                    const initials = driver.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    
                    // Hitung jarak acak (Simulasi)
                    const jarak = (Math.random() * 3 + 0.5).toFixed(1); 

                    const div = document.createElement('div');
                    div.classList.add('driver');
                    div.innerHTML = `
                        <div class="avatar">${initials}</div>
                        <div class="info">
                            <strong>${driver.nama}</strong>
                            <span style="font-size: 0.85rem; color: #ccc;">
                                ${driver.merk_kendaraan} • ${driver.nomor_polisi}
                            </span>
                            <span style="font-size: 0.8rem; color: #00e08f;">
                                ${jarak} km
                            </span>
                        </div>
                        <div class="status online">Online</div>
                    `;
                    container.appendChild(div);
                });
            } else {
                container.innerHTML = '<p style="text-align:center; color:#888;">Tidak ada driver online di sekitar.</p>';
            }
        } catch (error) {
            console.error("Gagal mengambil data driver:", error);
        }
    }

    // Jalankan fungsi
    loadUserName();
    loadDrivers();
});