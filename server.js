// 1. KONFIGURASI ENV
require('dotenv').config(); 

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------ MIDDLEWARE ------------------ //
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { success: false, message: "Terlalu banyak percobaan login." }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || "rahasia", 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: false } 
}));

// ------------------ DATABASE ------------------ //
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '', 
    database: process.env.DB_NAME || 'okejekdb'
});

db.connect((err) => {
    if (err) console.error("Error DB:", err);
    else console.log("Connected to MySQL (okejekdb)");
});

// ------------------ MIDDLEWARE ROLE ------------------ //
function harusLogin(req, res, next) {
    if (!req.session.userId) return res.redirect('/login');
    next();
}
function harusAdmin(req, res, next) {
    if (req.session.role !== 'admin') return res.status(403).send("Akses Ditolak.");
    next();
}
function harusDriver(req, res, next) {
    if (req.session.role !== 'driver') return res.status(403).send("Akses Ditolak.");
    next();
}

// ------------------ ROUTE VIEW ------------------ //
function cekRedirect(req, res, file) {
    if (req.session.userId) {
        if (req.session.role === 'admin') return res.redirect('/admin');
        if (req.session.role === 'driver') return res.redirect('/driver-dashboard');
        return res.redirect('/home');
    }
    res.sendFile(path.join(__dirname, file));
}

app.get('/', (req, res) => cekRedirect(req, res, 'views/index.html'));
app.get('/login', (req, res) => cekRedirect(req, res, 'views/login.html'));
app.get('/daftar', (req, res) => cekRedirect(req, res, 'views/daftar.html'));
app.get('/daftar-driver', (req, res) => cekRedirect(req, res, 'views/daftar-driver.html'));

app.get('/home', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'home.html')));
app.get('/konfirmasi', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'konfirmasi.html')));
app.get('/edit-profil', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'edit-profil.html')));
app.get('/pesan', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'pesan.html')));
app.get('/riwayat', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'riwayat.html')));
app.get('/profil', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'profil.html')));
app.get('/admin', harusLogin, harusAdmin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/driver-dashboard', harusLogin, harusDriver, (req, res) => res.sendFile(path.join(__dirname, 'views', 'driver.html')));

app.get('/keluar', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// ------------------ API AUTH ------------------ //
app.post('/daftar', [body('nama').escape()], (req, res) => {
    // (Kode validasi sama seperti sebelumnya...)
    const { nama, email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (results.length > 0) return res.json({ success: false, message: "Email ada" });
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query("INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, 'user')", [nama, email, hashedPassword], () => {
            res.json({ success: true, message: "Daftar berhasil" });
        });
    });
});

app.post('/daftar-driver', (req, res) => {
    const { nama, email, password, no_telepon, jenis_kendaraan, merk_kendaraan, nomor_polisi } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (results.length > 0) return res.json({ success: false, message: "Email ada" });
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query("INSERT INTO users (nama, email, password, no_telepon, role) VALUES (?, ?, ?, ?, 'driver')", [nama, email, hashedPassword, no_telepon], () => {
            db.query("INSERT INTO drivers (nama, jenis_kendaraan, merk_kendaraan, nomor_polisi, status) VALUES (?, ?, ?, ?, 'Online')", [nama, jenis_kendaraan, merk_kendaraan, nomor_polisi], () => {
                res.json({ success: true });
            });
        });
    });
});

app.post('/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, message: "Email/Password salah" });
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            req.session.userId = user.id;
            req.session.role = user.role;
            return res.json({ success: true, message: "Login berhasil", role: user.role });
        }
        return res.json({ success: false, message: "Email/Password salah" });
    });
});

// ------------------ API USER ------------------ //
app.get('/api/user', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    db.query("SELECT nama, email, no_telepon, role FROM users WHERE id = ?", [req.session.userId], (err, results) => {
        res.json({ success: true, user: results[0] });
    });
});

app.post('/api/user/update', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const { nama, email, no_telepon } = req.body;
    db.query("UPDATE users SET nama = ?, email = ?, no_telepon = ? WHERE id = ?", [nama, email, no_telepon, req.session.userId], () => {
        res.json({ success: true, message: "Updated" });
    });
});

// ------------------ API PESAN (UPDATE: LOGIC DRIVER) ------------------ //
app.get('/api/rute', (req, res) => {
    db.query("SELECT * FROM daftar_rute", (err, results) => res.json({ success: true, data: results }));
});

app.get('/api/drivers', (req, res) => {
    db.query("SELECT * FROM drivers WHERE status = 'Online' ORDER BY RAND() LIMIT 3", (err, results) => res.json({ success: true, data: results }));
});

// 1. LOGIKA PESAN YANG DIPERBAIKI
app.post('/api/pesan', (req, res) => {
    if (!req.session.userId) return res.json({ success: false, message: "Login dulu" });
    const { rute_id, jenis_layanan } = req.body;
    const userId = req.session.userId;

    let requiredVehicle = 'Motor'; 
    if (jenis_layanan === 'mobil') requiredVehicle = 'Mobil';

    db.query("SELECT * FROM daftar_rute WHERE id = ?", [rute_id], (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, message: "Rute error" });
        const rute = results[0];
        let harga = (jenis_layanan === 'motor') ? rute.harga_motor : ((jenis_layanan === 'mobil') ? rute.harga_mobil : rute.harga_barang);

        // UPDATE: HANYA CARI DRIVER YG STATUSNYA 'Online'
        db.query("SELECT * FROM drivers WHERE jenis_kendaraan = ? AND status = 'Online' ORDER BY RAND() LIMIT 1", [requiredVehicle], (err, driverResult) => {
            
            // Jika tidak ada driver online, tolak pesanan
            if (driverResult.length === 0) {
                return res.json({ success: false, message: `Maaf, semua driver ${requiredVehicle} sedang sibuk. Coba lagi nanti.` });
            }

            const driver = driverResult[0];
            const infoKendaraan = `${driver.merk_kendaraan} (${driver.nomor_polisi})`;

            // 1. Ubah status Driver jadi 'Busy'
            db.query("UPDATE drivers SET status = 'Busy' WHERE id = ?", [driver.id], () => {
                
                // 2. Buat Pesanan
                const sql = "INSERT INTO pesanan (user_id, lokasi_jemput, tujuan, jenis_layanan, harga, status, nama_driver, info_kendaraan) VALUES (?, ?, ?, ?, ?, 'Proses', ?, ?)";
                db.query(sql, [userId, rute.asal, rute.tujuan, jenis_layanan, harga, driver.nama, infoKendaraan], () => {
                    res.json({ success: true, message: `Driver ditemukan: ${driver.nama} (${infoKendaraan})` });
                });
            });
        });
    });
});

// ------------------ API RIWAYAT (UPDATE: PROTEKSI HAPUS) ------------------ //
app.get('/api/riwayat', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    db.query("SELECT * FROM pesanan WHERE user_id = ? ORDER BY id DESC", [req.session.userId], (err, results) => {
        res.json({ success: true, data: results });
    });
});

// 2. PROTEKSI HAPUS
app.delete('/api/riwayat/:id', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    
    // Cek Status Pesanan Dulu
    db.query("SELECT status FROM pesanan WHERE id = ? AND user_id = ?", [req.params.id, req.session.userId], (err, results) => {
        if (results.length === 0) return res.json({ success: false, message: "Pesanan tidak ditemukan." });
        
        // JIKA STATUS MASIH 'PROSES', TOLAK
        if (results[0].status === 'Proses') {
            return res.json({ success: false, message: "Tidak bisa menghapus pesanan yang sedang berjalan!" });
        }

        // Jika status 'Selesai', baru boleh hapus
        db.query("DELETE FROM pesanan WHERE id = ?", [req.params.id], (err, result) => {
            res.json({ success: true, message: "Riwayat berhasil dihapus." });
        });
    });
});

// ------------------ API DRIVER (UPDATE: SET STATUS ONLINE) ------------------ //
app.get('/api/driver/data', harusLogin, harusDriver, (req, res) => {
    const userId = req.session.userId;
    db.query("SELECT nama FROM users WHERE id = ?", [userId], (err, userResult) => {
        if (userResult.length === 0) return res.json({ success: false });
        const namaDriver = userResult[0].nama;

        db.query("SELECT * FROM drivers WHERE nama = ?", [namaDriver], (err, driverDetail) => {
            const infoDriver = driverDetail.length > 0 ? driverDetail[0] : {};
            db.query("SELECT * FROM pesanan WHERE nama_driver = ? ORDER BY id DESC", [namaDriver], (err, pesanan) => {
                const aktif = pesanan.filter(p => p.status === 'Proses');
                const selesai = pesanan.filter(p => p.status === 'Selesai');
                const pendapatan = selesai.reduce((acc, curr) => acc + curr.harga, 0);
                res.json({ success: true, profil: { ...userResult[0], ...infoDriver }, pendapatan, pesananAktif: aktif, riwayat: selesai });
            });
        });
    });
});

// 3. SELESAI PESANAN -> DRIVER JADI ONLINE LAGI
app.post('/api/driver/complete', harusLogin, harusDriver, (req, res) => {
    const { pesanan_id } = req.body;
    
    // Ambil nama driver dari pesanan ini
    db.query("SELECT nama_driver FROM pesanan WHERE id = ?", [pesanan_id], (err, result) => {
        if (result.length === 0) return res.json({ success: false });
        
        const namaDriver = result[0].nama_driver;

        // 1. Update Pesanan jadi Selesai
        db.query("UPDATE pesanan SET status = 'Selesai' WHERE id = ?", [pesanan_id], () => {
            
            // 2. Update Driver jadi Online lagi
            db.query("UPDATE drivers SET status = 'Online' WHERE nama = ?", [namaDriver], () => {
                res.json({ success: true, message: "Pekerjaan selesai." });
            });
        });
    });
});

// ------------------ API ADMIN (TETAP SAMA) ------------------ //
app.get('/api/admin/data', harusLogin, harusAdmin, (req, res) => {
    db.query("SELECT * FROM pesanan ORDER BY id DESC", (err, pesanan) => {
        db.query("SELECT * FROM users ORDER BY id DESC", (err, users) => {
            db.query("SELECT * FROM drivers ORDER BY id DESC", (err, drivers) => {
                res.json({ success: true, pesanan, users, drivers });
            });
        });
    });
});

app.delete('/api/admin/users/:id', harusLogin, harusAdmin, (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
        const userToDelete = results[0];
        if (userToDelete.role === 'driver') {
            db.query("DELETE FROM drivers WHERE nama = ?", [userToDelete.nama]);
        }
        db.query("DELETE FROM pesanan WHERE user_id = ?", [id], () => {
            db.query("DELETE FROM users WHERE id = ?", [id], () => res.json({ success: true, message: "User dihapus" }));
        });
    });
});

app.delete('/api/admin/pesanan/:id', harusLogin, harusAdmin, (req, res) => {
    db.query("DELETE FROM pesanan WHERE id = ?", [req.params.id], () => res.json({ success: true }));
});

app.delete('/api/admin/drivers/:id', harusLogin, harusAdmin, (req, res) => {
    const driverId = req.params.id;
    db.query("SELECT nama FROM drivers WHERE id = ?", [driverId], (err, results) => {
        if (results.length === 0) return res.json({ success: false });
        const namaDriver = results[0].nama;
        db.query("DELETE FROM users WHERE nama = ? AND role = 'driver'", [namaDriver], () => {
            db.query("DELETE FROM drivers WHERE id = ?", [driverId], () => res.json({ success: true }));
        });
    });
});

app.put('/api/admin/users/:id/role', harusLogin, harusAdmin, (req, res) => {
    db.query("UPDATE users SET role = ? WHERE id = ?", [req.body.role, req.params.id], () => res.json({ success: true }));
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));