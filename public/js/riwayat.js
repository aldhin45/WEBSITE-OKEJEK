// public/js/riwayat.js

// Set Tahun Copyright Otomatis
document.addEventListener('DOMContentLoaded', () => {
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    
    // Jalankan fungsi load data saat halaman selesai dimuat
    loadRiwayat();
});

//  FUNGSI SANITIZER (KEAMANAN)
function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(match) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escape[match];
    });
}

// FUNGSI FORMATTING 
function formatTanggal(tanggalString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(tanggalString).toLocaleDateString('id-ID', options);
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(angka);
}

function formatLayanan(jenis) {
    if (jenis === 'motor') return 'Ojek Motor';
    if (jenis === 'mobil') return 'Ojek Mobil';
    if (jenis === 'barang') return 'Kirim Barang';
    return escapeHTML(jenis);
}

// LOGIKA UTAMA (LOAD DATA) 
async function loadRiwayat() {
    try {
        const response = await fetch('/api/riwayat');
        const result = await response.json();
        const container = document.getElementById('historyContainer');
        container.innerHTML = '';

        if (result.success && result.data.length > 0) {
            result.data.forEach(item => {
                const card = document.createElement('div');
                card.classList.add('card');
                
                const driverName = item.nama_driver ? item.nama_driver : "Sedang dicari...";
                const vehicleInfo = item.info_kendaraan ? item.info_kendaraan : "";

                card.innerHTML = `
                    <button class="btn-delete" onclick="hapusPesanan(${item.id})">Hapus</button>
                    
                    <h3>${escapeHTML(item.lokasi_jemput)} ➜ ${escapeHTML(item.tujuan)}</h3>
                    
                    <p>
                        <strong>${formatLayanan(item.jenis_layanan)}</strong> • 
                        ${formatRupiah(item.harga)} • 
                        ${formatTanggal(item.tanggal)}
                    </p>
                    
                    <div class="driver-info">
                        Driver: <strong>${escapeHTML(driverName)}</strong><br>
                        <span style="font-size: 0.85rem; color: #888;">${escapeHTML(vehicleInfo)}</span>
                    </div>

                    <span class="status-badge">${escapeHTML(item.status)}</span>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p style="text-align:center;">Belum ada riwayat perjalanan.</p>';
        }

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('historyContainer').innerHTML = '<p style="text-align:center; color:red;">Gagal memuat data.</p>';
    }
}

// LOGIKA HAPUS PESANAN
async function hapusPesanan(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus riwayat ini?")) {
        return;
    }
    try {
        const response = await fetch(`/api/riwayat/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (result.success) {
            alert("Riwayat berhasil dihapus!");
            loadRiwayat(); 
        } else {
            alert("Gagal: " + result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Gagal menghubungi server.");
    }
}