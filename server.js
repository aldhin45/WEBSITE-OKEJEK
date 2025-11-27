// 1. KONFIGURASI ENV
require('dotenv').config(); 

const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
// TAMBAHAN KEAMANAN XSS & VALIDASI
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------ MIDDLEWARE KEAMANAN ------------------ //
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { success: false, message: "Terlalu banyak percobaan login. Tunggu 15 menit." },
    standardHeaders: true,
    legacyHeaders: false,
});

// ------------------ MIDDLEWARE UMUM ------------------ //
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || "rahasia_dapur_okejek", 
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, 
        httpOnly: true, 
        secure: false 
    } 
}));

// ------------------ KONEKSI DATABASE ------------------ //
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

// ------------------ MIDDLEWARE CEK ROLE ------------------ //
function harusLogin(req, res, next) {
    if (!req.session.userId) return res.redirect('/login');
    next();
}

function harusAdmin(req, res, next) {
    if (req.session.role !== 'admin') return res.status(403).send("Akses Ditolak. Khusus Admin.");
    next();
}

function harusDriver(req, res, next) {
    if (req.session.role !== 'driver') return res.status(403).send("Akses Ditolak. Khusus Driver.");
    next();
}

// ------------------ ROUTE HALAMAN ------------------ //
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

// ------------------ API AUTH (DENGAN ANTI-XSS) ------------------ //

// 1. DAFTAR USER (VALIDASI + SANITASI)
app.post('/daftar', [
    body('nama').trim().escape(), // Ubah <script> jadi aman
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
], (req, res) => {
    
    // Cek Error Validasi
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ success: false, message: "Data tidak valid (Password min 6 huruf)" });
    }

    const { nama, email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length > 0) return res.json({ success: false, message: "Email sudah terdaftar" });

        const hashedPassword = await bcrypt.hash(password, 10);
        db.query("INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, 'user')", [nama, email, hashedPassword], (err) => {
            if (err) return res.json({ success: false, message: "Gagal daftar" });
            res.json({ success: true, message: "Berhasil daftar" });
        });
    });
});

// 2. DAFTAR DRIVER (VALIDASI + SANITASI)
app.post('/daftar-driver', [
    body('nama').trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('merk_kendaraan').trim().escape(),
    body('nomor_polisi').trim().escape()
], (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.json({ success: false, message: "Data tidak valid" });
    }

    const { nama, email, password, no_telepon, jenis_kendaraan, merk_kendaraan, nomor_polisi } = req.body;
    
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length > 0) return res.json({ success: false, message: "Email sudah terdaftar" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query("INSERT INTO users (nama, email, password, no_telepon, role) VALUES (?, ?, ?, ?, 'driver')", [nama, email, hashedPassword, no_telepon], (err) => {
            if (err) return res.json({ success: false, message: "Gagal daftar user" });

            db.query("INSERT INTO drivers (nama, jenis_kendaraan, merk_kendaraan, nomor_polisi, status) VALUES (?, ?, ?, ?, 'Online')", [nama, jenis_kendaraan, merk_kendaraan, nomor_polisi], (err) => {
                if (err) return res.json({ success: false, message: "Gagal simpan kendaraan" });
                res.json({ success: true, message: "Berhasil menjadi mitra driver!" });
            });
        });
    });
});

app.post('/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        const errorMsg = { success: false, message: "Email atau password salah" };
        if (err || results.length === 0) return res.json(errorMsg);

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            req.session.userId = user.id;
            req.session.role = user.role;
            return res.json({ success: true, message: "Login berhasil", role: user.role });
        } else {
            return res.json(errorMsg);
        }
    });
});

// ------------------ API USER ------------------ //
app.get('/api/user', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    db.query("SELECT nama, email, no_telepon, role FROM users WHERE id = ?", [req.session.userId], (err, results) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, user: results[0] });
    });
});

app.post('/api/user/update', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const { nama, email, no_telepon } = req.body;
    db.query("UPDATE users SET nama = ?, email = ?, no_telepon = ? WHERE id = ?", [nama, email, no_telepon, req.session.userId], (err) => {
        res.json({ success: true, message: "Profil updated" });
    });
});

// ------------------ API PESANAN ------------------ //
app.get('/api/rute', (req, res) => {
    db.query("SELECT * FROM daftar_rute", (err, results) => {
        res.json({ success: true, data: results });
    });
});

app.get('/api/drivers', (req, res) => {
    db.query("SELECT * FROM drivers ORDER BY RAND() LIMIT 3", (err, results) => {
        res.json({ success: true, data: results });
    });
});

app.post('/api/pesan', (req, res) => {
    if (!req.session.userId) return res.json({ success: false, message: "Login dulu" });
    
    const { rute_id, jenis_layanan } = req.body;
    const userId = req.session.userId;

    let requiredVehicle = 'Motor'; 
    if (jenis_layanan === 'mobil') requiredVehicle = 'Mobil';

    db.query("SELECT * FROM daftar_rute WHERE id = ?", [rute_id], (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, message: "Rute error" });

        const rute = results[0];
        let harga = 0;
        if (jenis_layanan === 'motor') harga = rute.harga_motor;
        else if (jenis_layanan === 'mobil') harga = rute.harga_mobil;
        else if (jenis_layanan === 'barang') harga = rute.harga_barang;

        db.query("SELECT * FROM drivers WHERE jenis_kendaraan = ? ORDER BY RAND() LIMIT 1", [requiredVehicle], (err, driverResult) => {
            if (driverResult.length === 0) return res.json({ success: false, message: `Tidak ada driver ${requiredVehicle}.` });

            const driver = driverResult[0];
            const infoKendaraan = `${driver.merk_kendaraan} (${driver.nomor_polisi})`;

            const sql = "INSERT INTO pesanan (user_id, lokasi_jemput, tujuan, jenis_layanan, harga, status, nama_driver, info_kendaraan) VALUES (?, ?, ?, ?, ?, 'Proses', ?, ?)";
            
            db.query(sql, [userId, rute.asal, rute.tujuan, jenis_layanan, harga, driver.nama, infoKendaraan], (err) => {
                res.json({ success: true, message: "Driver ditemukan: " + driver.nama });
            });
        });
    });
});

app.get('/api/riwayat', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    db.query("SELECT * FROM pesanan WHERE user_id = ? ORDER BY id DESC", [req.session.userId], (err, results) => {
        res.json({ success: true, data: results });
    });
});

app.delete('/api/riwayat/:id', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    db.query("DELETE FROM pesanan WHERE id = ? AND user_id = ?", [req.params.id, req.session.userId], (err, result) => {
        if (err || result.affectedRows === 0) return res.json({ success: false, message: "Gagal hapus" });
        res.json({ success: true });
    });
});

// ------------------ API KHUSUS ADMIN (CRUD) ------------------ //

app.get('/api/admin/data', harusLogin, harusAdmin, (req, res) => {
    db.query("SELECT * FROM pesanan ORDER BY id DESC", (err, pesanan) => {
        db.query("SELECT * FROM users ORDER BY id DESC", (err, users) => {
            db.query("SELECT * FROM drivers ORDER BY id DESC", (err, drivers) => {
                res.json({ success: true, pesanan, users, drivers });
            });
        });
    });
});

// 2. HAPUS USER (HAPUS JUGA DRIVER JIKA ADA)
app.delete('/api/admin/users/:id', harusLogin, harusAdmin, (req, res) => {
    const id = req.params.id;

    db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, message: "User tidak ditemukan." });

        const userToDelete = results[0];

        // Jika Driver, hapus data di tabel drivers juga
        if (userToDelete.role === 'driver') {
            db.query("DELETE FROM drivers WHERE nama = ?", [userToDelete.nama], (err) => {
                if (err) console.error("Gagal hapus data mitra driver:", err);
            });
        }

        db.query("DELETE FROM pesanan WHERE user_id = ?", [id], () => {
            db.query("DELETE FROM users WHERE id = ?", [id], (err) => {
                res.json({ success: true, message: "User berhasil dihapus." });
            });
        });
    });
});

app.delete('/api/admin/pesanan/:id', harusLogin, harusAdmin, (req, res) => {
    db.query("DELETE FROM pesanan WHERE id = ?", [req.params.id], (err) => {
        res.json({ success: true, message: "Pesanan dihapus." });
    });
});

// 3. HAPUS DRIVER (HAPUS USERNYA JUGA)
app.delete('/api/admin/drivers/:id', harusLogin, harusAdmin, (req, res) => {
    const driverId = req.params.id;
    db.query("SELECT nama FROM drivers WHERE id = ?", [driverId], (err, results) => {
        if (results.length === 0) return res.json({ success: false, message: "Driver tidak ditemukan." });
        const namaDriver = results[0].nama;

        // Hapus akun login driver
        db.query("DELETE FROM users WHERE nama = ? AND role = 'driver'", [namaDriver], () => {
            // Hapus data kendaraan driver
            db.query("DELETE FROM drivers WHERE id = ?", [driverId], () => {
                res.json({ success: true, message: "Mitra Driver & Akun Login dihapus." });
            });
        });
    });
});

app.put('/api/admin/users/:id/role', harusLogin, harusAdmin, (req, res) => {
    db.query("UPDATE users SET role = ? WHERE id = ?", [req.body.role, req.params.id], (err) => {
        res.json({ success: true, message: "Role diubah." });
    });
});

// ------------------ API KHUSUS DRIVER ------------------ //
app.get('/api/driver/data', harusLogin, harusDriver, (req, res) => {
    const userId = req.session.userId;
    db.query("SELECT nama, email, no_telepon FROM users WHERE id = ?", [userId], (err, userResult) => {
        if (err || userResult.length === 0) return res.json({ success: false });
        const namaDriver = userResult[0].nama;

        db.query("SELECT * FROM drivers WHERE nama = ?", [namaDriver], (err, driverDetail) => {
            const infoDriver = driverDetail.length > 0 ? driverDetail[0] : {};

            db.query("SELECT * FROM pesanan WHERE nama_driver = ? ORDER BY id DESC", [namaDriver], (err, pesanan) => {
                const aktif = pesanan.filter(p => p.status === 'Proses');
                const selesai = pesanan.filter(p => p.status === 'Selesai');
                const pendapatan = selesai.reduce((acc, curr) => acc + curr.harga, 0);

                res.json({
                    success: true,
                    profil: { ...userResult[0], ...infoDriver },
                    pendapatan,
                    totalOrder: pesanan.length,
                    pesananAktif: aktif,
                    riwayat: selesai
                });
            });
        });
    });
});

app.post('/api/driver/complete', harusLogin, harusDriver, (req, res) => {
    db.query("UPDATE pesanan SET status = 'Selesai' WHERE id = ?", [req.body.pesanan_id], (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
    });
});

// ------------------ SERVER JALAN ------------------ //
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));