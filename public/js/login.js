document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault(); // Mencegah reload halaman

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (result.success) {
            // Simpan userId jika dibutuhkan untuk keperluan frontend lain
            localStorage.setItem("userId", result.userId);
            
            alert("Login Berhasil!");
            window.location.href = "/home"; // Pindah ke halaman home
        } else {
            alert(result.message); // Tampilkan pesan error dari server (misal: Email salah)
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan pada server");
    }
});