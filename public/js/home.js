// public/js/home.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Set Tahun Copyright
    const yearSpan = document.getElementById('year');
    if(yearSpan) yearSpan.textContent = new Date().getFullYear();

    // ------------------------------------------------
    // LOGIKA RUTE & ESTIMASI HARGA (DATABASE)
    // ------------------------------------------------
    let dataRute = [];
    const selectRute = document.getElementById('rute_id');
    const selectService = document.getElementById('service');
    const displayHarga = document.getElementById('priceDisplay');

    // Fungsi Ambil Rute dari Server
    async function loadRute() {
        if (!selectRute) return;

        try {
            const response = await fetch('/api/rute');
            const result = await response.json();
            
            if (result.success) {
                dataRute = result.data;
                // Reset Pilihan
                selectRute.innerHTML = '<option value="">-- Pilih Rute Perjalanan --</option>';
                
                // Isi Dropdown
                dataRute.forEach(rute => {
                    const option = document.createElement('option');
                    option.value = rute.id;
                    option.textContent = `${rute.asal} ➝ ${rute.tujuan}`;
                    selectRute.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Gagal memuat rute:", error);
            selectRute.innerHTML = '<option value="">Gagal memuat data</option>';
        }
    }

    // Fungsi Hitung Harga Realtime
    function updateHarga() {
        const ruteId = selectRute.value;
        const layanan = selectService.value;
        
        if (!ruteId) { 
            displayHarga.textContent = "Rp 0"; 
            return; 
        }

        const rute = dataRute.find(r => r.id == ruteId);
        
        if (rute) {
            let harga = 0;
            if (layanan === 'motor') harga = rute.harga_motor;
            else if (layanan === 'mobil') harga = rute.harga_mobil;
            else if (layanan === 'barang') harga = rute.harga_barang;

            // Format Rupiah
            displayHarga.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(harga);
        }
    }

    // Event Listener (Jika dropdown berubah, harga update)
    if (selectRute && selectService) {
        selectRute.addEventListener('change', updateHarga);
        selectService.addEventListener('change', updateHarga);
    }
    
    // Jalankan Load Rute
    loadRute();

    // ------------------------------------------------
    // LOAD DRIVER ONLINE (DATABASE)
    // ------------------------------------------------
    async function loadDrivers() {
        const container = document.getElementById('driverGrid');
        if (!container) return;

        try {
            const response = await fetch('/api/drivers');
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                container.innerHTML = ''; // Kosongkan loading text
                
                result.data.forEach(driver => {
                    // Buat inisial (Misal: Budi Santoso -> BS)
                    const initials = driver.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                    
                    // Simulasi data tambahan (karena di DB simpel)
                    const jarak = (Math.random() * 3 + 0.5).toFixed(1); 
                    const jenis = driver.jenis_kendaraan || 'Kendaraan';

                    const card = document.createElement('div');
                    card.className = 'driver';
                    card.innerHTML = `
                        <div class="avatar">${initials}</div>
                        <div class="info">
                            <strong>${driver.nama}</strong>
                            <span>${jenis} • ${jarak} km</span>
                        </div>
                        <div class="status">Online</div>
                    `;
                    container.appendChild(card);
                });
            } else {
                container.innerHTML = '<p style="text-align:center; width:100%;">Tidak ada driver online saat ini.</p>';
            }
        } catch (error) {
            console.error(error);
        }
    }
    
    loadDrivers();

    // ------------------------------------------------
    // PETA (LEAFLET JS)
    // ------------------------------------------------
    const mapElement = document.getElementById('map');
    if (mapElement && window.L) {
        // Koordinat Default (Misal: Purwokerto/Banyumas)
        const map = L.map('map').setView([-7.4234, 109.2478], 15);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        L.marker([-7.4234, 109.2478]).addTo(map)
            .bindPopup('<b>Pusat Oke-Jek</b><br>Kami siap melayani.')
            .openPopup();
    }
});