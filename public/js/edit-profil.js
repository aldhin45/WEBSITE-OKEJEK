// public/js/edit-profil.js

document.addEventListener('DOMContentLoaded', () => {

    // Set Tahun Copyright
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Load Data User Lama
    async function loadUserData() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();

            // Elemen Input
            const elNama = document.getElementById('nama');
            const elEmail = document.getElementById('email');
            const elTelepon = document.getElementById('no_telepon');

            if (data.success) {
                if(elNama) elNama.value = data.user.nama;
                if(elEmail) elEmail.value = data.user.email;
                // Jika no_telepon null, isi string kosong agar tidak error
                if(elTelepon) elTelepon.value = data.user.no_telepon || ''; 
            } else {
                alert("Gagal memuat data. Silakan login ulang.");
                window.location.href = '/login';
            }
        } catch (error) {
            console.error("Gagal ambil data user:", error);
        }
    }

    //Handle Simpan Perubahan
    const form = document.getElementById('editProfileForm');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Mencegah reload halaman

            // Ambil value terbaru dari input
            const nama = document.getElementById('nama').value;
            const email = document.getElementById('email').value;
            const no_telepon = document.getElementById('no_telepon').value;
            const btnSubmit = form.querySelector('button');

            // UX: Matikan tombol saat loading
            const textAsli = btnSubmit.textContent;
            btnSubmit.textContent = "Menyimpan...";
            btnSubmit.disabled = true;

            try {
                const response = await fetch('/api/user/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nama, email, no_telepon })
                });

                const result = await response.json();

                if (result.success) {
                    alert("Profil berhasil diperbarui!");
                    window.location.href = '/profil'; // Kembali ke halaman profil
                } else {
                    alert("Gagal: " + result.message);
                    // Kembalikan tombol
                    btnSubmit.textContent = textAsli;
                    btnSubmit.disabled = false;
                }

            } catch (error) {
                console.error("Error update:", error);
                alert("Terjadi kesalahan koneksi.");
                btnSubmit.textContent = textAsli;
                btnSubmit.disabled = false;
            }
        });
    }

    // Jalankan Load Data saat halaman siap
    loadUserData();
});