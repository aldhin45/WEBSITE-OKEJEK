// public/js/pesan.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Set Tahun Copyright
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    let dataRute = []; // Simpan data rute dari server

    // Fungsi Load Rute dari Server
    async function loadRute() {
        try {
            const response = await fetch('/api/rute');
            const result = await response.json();

            if (result.success) {
                dataRute = result.data; // Simpan ke variabel global
                const select = document.getElementById('rute_id');

                // Reset isi select (kecuali opsi pertama)
                select.innerHTML = '<option value="">-- Pilih Lokasi Jemput & Tujuan --</option>';

                dataRute.forEach(rute => {
                    const option = document.createElement('option');
                    option.value = rute.id;
                    option.textContent = `${rute.asal} ➝ ${rute.tujuan} (${rute.jarak_km} km)`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Gagal memuat rute:", error);
        }
    }

    // Fungsi Hitung Harga Realtime
    function updateHarga() {
        const ruteId = document.getElementById('rute_id').value;
        const layanan = document.getElementById('jenis_layanan').value;
        const displayHarga = document.getElementById('estimasiHarga');

        if (!ruteId) {
            displayHarga.textContent = "Rp 0";
            return;
        }

        // Cari data rute yang sedang dipilih user
        const ruteTerpilih = dataRute.find(r => r.id == ruteId);
        
        if (ruteTerpilih) {
            let harga = 0;
            if (layanan === 'motor') harga = ruteTerpilih.harga_motor;
            else if (layanan === 'mobil') harga = ruteTerpilih.harga_mobil;
            else if (layanan === 'barang') harga = ruteTerpilih.harga_barang;

            // Format ke Rupiah
            displayHarga.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(harga);
        }
    }

    // Event Listeners 
    const elRute = document.getElementById('rute_id');
    const elLayanan = document.getElementById('jenis_layanan');
    const form = document.getElementById('formPesan');

    if (elRute) elRute.addEventListener('change', updateHarga);
    if (elLayanan) elLayanan.addEventListener('change', updateHarga);

    // Kirim Pesanan (Submit Form)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const rute_id = elRute.value;
            const jenis_layanan = elLayanan.value;
            const btnSubmit = form.querySelector('button');

            // Matikan tombol biar gak double click
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Memproses...";

            try {
                const response = await fetch('/api/pesan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rute_id, jenis_layanan })
                });

                const result = await response.json();

                if (result.success) {
                    alert("Pesanan Berhasil Dibuat! Driver sedang meluncur.");
                    window.location.href = '/riwayat'; 
                } else {
                    alert("Gagal: " + result.message);
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = "Pesan Sekarang";
                }

            } catch (error) {
                console.error(error);
                alert("Terjadi kesalahan koneksi.");
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Pesan Sekarang";
            }
        });
    }

    // Jalankan load data saat awal buka
    loadRute();
});