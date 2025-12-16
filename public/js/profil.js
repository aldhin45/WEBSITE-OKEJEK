// public/js/profil.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Set Tahun Copyright
    const yearSpan = document.getElementById("year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Ambil Data User dari Server
    fetch('/api/user') 
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Isi Nama & Email
          const elNama = document.getElementById("nama");
          const elEmail = document.getElementById("email");
          
          if(elNama) elNama.textContent = data.user.nama;
          if(elEmail) elEmail.textContent = data.user.email;
          
          // Isi Nomor Telepon (Cek jika kosong)
          const phoneElement = document.getElementById("phone");
          if (phoneElement) {
              if (data.user.no_telepon) {
                  phoneElement.textContent = data.user.no_telepon;
              } else {
                  phoneElement.textContent = "-";
              }
          }

          // Buat Avatar (Huruf Depan)
          const avatarElement = document.getElementById("avatar");
          if (avatarElement && data.user.nama) {
            const firstLetter = data.user.nama.charAt(0).toUpperCase();
            avatarElement.textContent = firstLetter;
          }

        } else {
          // Jika sesi mati/expired
          alert("Sesi Anda telah berakhir. Silakan login kembali.");
          window.location.href = "/login";
        }
      })
      .catch(error => {
        console.error("Error:", error);
        const elNama = document.getElementById("nama");
        if(elNama) elNama.textContent = "Gagal memuat data";
      });
});