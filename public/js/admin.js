// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    // Load data saat halaman dibuka
    loadAdminData();
});

//  FUNGSI GLOBAL  

// Navigasi Sidebar (Dashboard / Pengguna / Driver)
window.showSection = function(sectionId) {
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    document.getElementById('btn-' + sectionId).classList.add('active');
}

// Helper: Format Rupiah & Pembersih XSS
const formatRupiah = (num) => 'Rp ' + Number(num).toLocaleString('id-ID');

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, function(match) {
        const escape = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return escape[match];
    });
}

// Load Semua Data Admin (Pesanan, User, Driver)
async function loadAdminData() {
    try {
        const response = await fetch('/api/admin/data');
        const data = await response.json();

        if(data.success) {
            // UPDATE STATISTIK
            const elTotalPesanan = document.getElementById('totalPesanan');
            const elTotalUser = document.getElementById('totalUser');
            const elTotalDriver = document.getElementById('totalDriver');
            const elTotalOmset = document.getElementById('totalOmset');

            if(elTotalPesanan) elTotalPesanan.textContent = data.pesanan.length;
            if(elTotalUser) elTotalUser.textContent = data.users.length;
            if(elTotalDriver) elTotalDriver.textContent = data.drivers.length;
            
            // Hitung Omset (Hanya yang status 'Selesai')
            const omset = data.pesanan
                .filter(p => p.status === 'Selesai')
                .reduce((acc, curr) => {
                    const harga = parseFloat(curr.harga);
                    return acc + (isNaN(harga) ? 0 : harga);
                }, 0);
            
            if(elTotalOmset) elTotalOmset.textContent = formatRupiah(omset);

            // UPDATE TABEL PESANAN
            const tPesanan = document.getElementById('tablePesanan');
            if(tPesanan) {
                tPesanan.innerHTML = '';
                data.pesanan.forEach(p => {
                    const badge = p.status === 'Selesai' ? 'bg-selesai' : 'bg-proses';
                    tPesanan.innerHTML += `
                        <tr>
                            <td>#${p.id}</td>
                            <td>User ${p.user_id}</td>
                            <td>${escapeHTML(p.lokasi_jemput)} ➝ ${escapeHTML(p.tujuan)}</td>
                            <td>${formatRupiah(p.harga)}</td>
                            <td><span class="badge ${badge}">${escapeHTML(p.status)}</span></td>
                            <td>
                                <button class="btn-action btn-del" onclick="hapusData('pesanan', ${p.id})">Hapus</button>
                            </td>
                        </tr>`;
                });
            }

            //  UPDATE TABEL USERS
            const tUsers = document.getElementById('tableUsers');
            if(tUsers) {
                tUsers.innerHTML = '';
                data.users.forEach(u => {
                    let roleClass = 'bg-user';
                    if(u.role === 'admin') roleClass = 'bg-admin';
                    if(u.role === 'driver') roleClass = 'bg-driver';

                    tUsers.innerHTML += `
                        <tr>
                            <td>${u.id}</td>
                            <td><strong>${escapeHTML(u.nama)}</strong></td>
                            <td>${escapeHTML(u.email)}</td>
                            <td><span class="badge ${roleClass}" style="cursor:pointer;" onclick="ubahRole(${u.id}, '${u.role}')">${escapeHTML(u.role.toUpperCase())} ✏️</span></td>
                            <td>
                                <button class="btn-action btn-del" onclick="hapusData('users', ${u.id})">Hapus</button>
                            </td>
                        </tr>`;
                });
            }

            // UPDATE TABEL DRIVERS
            const tDrivers = document.getElementById('tableDrivers');
            if(tDrivers) {
                tDrivers.innerHTML = '';
                data.drivers.forEach(d => {
                    tDrivers.innerHTML += `
                        <tr>
                            <td>${d.id}</td>
                            <td>${escapeHTML(d.nama)}</td>
                            <td>${escapeHTML(d.jenis_kendaraan)} ${escapeHTML(d.merk_kendaraan)}</td>
                            <td>${escapeHTML(d.nomor_polisi)}</td>
                            <td>
                                <button class="btn-action btn-del" onclick="hapusData('drivers', ${d.id})">Pecat</button>
                            </td>
                        </tr>`;
                });
            }
        }
    } catch (err) { 
        console.error("Gagal load admin data:", err); 
    }
}

// Fungsi Hapus Data (Universal)
window.hapusData = async function(type, id) {
    if(!confirm("Yakin ingin menghapus data ini secara permanen?")) return;
    
    try {
        const response = await fetch(`/api/admin/${type}/${id}`, { method: 'DELETE' });
        const result = await response.json();
        
        if(result.success) { 
            alert(result.message || "Data berhasil dihapus"); 
            loadAdminData(); // Refresh tabel
        } else { 
            alert("Gagal: " + result.message); 
        }
    } catch (error) {
        console.error(error);
        alert("Gagal menghapus data.");
    }
}

// Fungsi Ubah Role User
window.ubahRole = async function(id, currentRole) {
    const newRole = prompt("Masukkan Role Baru (admin / user / driver):", currentRole);
    
    if(!newRole || newRole === currentRole) return;
    
    if(['admin', 'user', 'driver'].includes(newRole.toLowerCase())) {
        try {
            const response = await fetch(`/api/admin/users/${id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole.toLowerCase() })
            });
            const result = await response.json();
            
            if(result.success) { 
                alert("Role berhasil diubah!"); 
                loadAdminData(); 
            }
        } catch (error) {
            console.error(error);
            alert("Gagal mengubah role.");
        }
    } else { 
        alert("Role tidak valid! Gunakan: admin, user, atau driver."); 
    }
}