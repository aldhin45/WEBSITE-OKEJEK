// public/js/driver.js

document.addEventListener('DOMContentLoaded', () => {
    // Jalankan pertama kali saat halaman dibuka
    loadDriverData();
    
    // Auto-Refresh data setiap 10 detik (Realtime sederhana)
    setInterval(loadDriverData, 10000);
});

// FUNGSI GLOBAL 

// Navigasi Sidebar
window.showSection = function(sectionId) {
    // Sembunyikan semua section & reset menu aktif
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    
    // Tampilkan section yang dipilih
    const section = document.getElementById(sectionId);
    const btn = document.getElementById('btn-' + sectionId);
    
    if (section) section.classList.add('active');
    if (btn) btn.classList.add('active');
}

// Format Rupiah
const formatRupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

// Load Data Driver (Statistik, Profil, Orderan Aktif, Riwayat)
async function loadDriverData() {
    try {
        const response = await fetch('/api/driver/data');
        const data = await response.json();

        if(data.success) {
            // UPDATE STATISTIK & PROFIL
            const elPendapatan = document.getElementById('totalPendapatan');
            const elTotalOrder = document.getElementById('totalOrder');
            
            if(elPendapatan) elPendapatan.textContent = formatRupiah(data.pendapatan);
            if(elTotalOrder) elTotalOrder.textContent = data.riwayat.length;

            // Update Info Profil
            document.getElementById('profNama').textContent = data.profil.nama;
            document.getElementById('profEmail').textContent = data.profil.email;
            document.getElementById('profMerk').textContent = data.profil.merk_kendaraan || '-';
            document.getElementById('profPlat').textContent = data.profil.nomor_polisi || '-';

            // UPDATE PEKERJAAN AKTIF
            const jobContainer = document.getElementById('activeJobContainer');
            if (jobContainer) {
                if (data.pesananAktif.length > 0) {
                    const job = data.pesananAktif[0];
                    jobContainer.innerHTML = `
                        <div class="job-card">
                            <h2>🔔 Orderan Masuk!</h2>
                            <p>Layanan: <strong>${job.jenis_layanan}</strong></p>
                            <div class="job-route">
                                ${job.lokasi_jemput} ➝ ${job.tujuan}
                            </div>
                            <p style="font-size: 1.5rem; color: #ffcc00; font-weight: bold; margin: 10px 0;">
                                ${formatRupiah(job.harga)}
                            </p>
                            <button class="btn-finish" onclick="selesaikanPesanan(${job.id})">✅ Selesaikan Pesanan</button>
                        </div>
                    `;
                } else {
                    jobContainer.innerHTML = `
                        <div style="text-align:center; padding: 40px; background:white; border-radius:12px; color:#888; border: 2px dashed #ddd;">
                            <h3>Tidak ada pesanan aktif</h3>
                            <p>Menunggu pesanan masuk...</p>
                        </div>`;
                }
            }

            // UPDATE TABEL RIWAYAT
            const tbody = document.getElementById('tableRiwayat');
            if (tbody) {
                tbody.innerHTML = '';
                if (data.riwayat.length > 0) {
                    data.riwayat.forEach(p => {
                        tbody.innerHTML += `
                            <tr>
                                <td>#${p.id}</td>
                                <td>${p.lokasi_jemput} ➝ ${p.tujuan}</td>
                                <td>${p.jenis_layanan}</td>
                                <td>${formatRupiah(p.harga)}</td>
                                <td><span class="badge">Selesai</span></td>
                            </tr>`;
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada riwayat.</td></tr>';
                }
            }
        }
    } catch (err) { 
        console.error("Gagal update data:", err); 
    }
}

// Fungsi Selesaikan Pesanan
window.selesaikanPesanan = async function(id) {
    if(!confirm("Sudah mengantar penumpang sampai tujuan?")) return;

    try {
        const response = await fetch('/api/driver/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pesanan_id: id })
        });
        
        const result = await response.json();
        if(result.success) {
            alert("Kerja bagus! Pesanan selesai.");
            loadDriverData(); // Refresh instan
        } else {
            alert("Gagal: " + result.message);
        }
    } catch (error) {
        console.error(error);
        alert("Gagal koneksi server.");
    }
}