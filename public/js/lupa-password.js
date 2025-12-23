// public/js/lupa-password.js

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById("lupaForm");

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            // Ambil Elemen
            const emailInput = document.getElementById("email");
            const btn = document.getElementById("btnSubmit");
            const resultBox = document.getElementById("resultBox");
            
            const email = emailInput.value;

            // UI Loading State
            btn.textContent = "Memproses..."; 
            btn.disabled = true;
            resultBox.style.display = "none";

            try {
                // Kirim API Request
                const response = await fetch("/api/lupa-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // SUKSES: Tampilkan Link Reset 
                    resultBox.style.display = "block";
                    resultBox.style.backgroundColor = "#155724"; // Hijau sukses
                    resultBox.style.color = "#d4edda";
                    
                    resultBox.innerHTML = `
                        <p>Link reset berhasil dibuat!</p>
                        <a href="${result.resetLink}" class="reset-btn">KLIK UNTUK RESET PASSWORD</a>
                    `;
                } else {
                    // GAGAL: Email tidak ditemukan
                    alert(result.message);
                }

            } catch (err) {
                console.error(err);
                alert("Gagal koneksi ke server.");
            } finally {
                // Reset Tombol kembali normal
                btn.textContent = "Proses"; 
                btn.disabled = false;
            }
        });
    }
});