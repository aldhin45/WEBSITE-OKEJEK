// 1. KONFIGURASI ENV
require('dotenv').config(); 

const crypto = require('crypto'); // Untuk token acak
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE KEAMANAN  //
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { success: false, message: "Terlalu banyak percobaan login." }
});

// MIDDLEWARE UMUM //
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || "rahasia_lokal_okejek", 
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 24 * 60 * 60 * 1000, 
        httpOnly: true, 
        secure: false 
    } 
}));

//  KONEKSI DATABASE LOKAL //
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '', 
    database: process.env.DB_NAME || 'okejekdb'
});

db.connect((err) => {
    if (err) {
        console.error("Gagal konek database:", err);
        return;
    }
    console.log("Berhasil terhubung ke MySQL (Localhost)");
});

// MIDDLEWARE CEK ROLE //
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

// ROUTE HALAMAN (VIEW)  //

function cekRedirect(req, res, file) {
    if (req.session.userId) {
        if (req.session.role === 'admin') return res.redirect('/admin');
        if (req.session.role === 'driver') return res.redirect('/driver-dashboard');
        return res.redirect('/home');
    }
    res.sendFile(path.join(__dirname, file));
}

// Halaman Public
app.get('/', (req, res) => cekRedirect(req, res, 'views/index.html'));
app.get('/login', (req, res) => cekRedirect(req, res, 'views/login.html'));
app.get('/daftar', (req, res) => cekRedirect(req, res, 'views/daftar.html'));
app.get('/daftar-driver', (req, res) => cekRedirect(req, res, 'views/daftar-driver.html'));
app.get('/lupa-password', (req, res) => res.sendFile(path.join(__dirname, 'views', 'lupa-password.html')));
app.get('/reset-password', (req, res) => res.sendFile(path.join(__dirname, 'views', 'reset-password.html')));

// Halaman User
app.get('/home', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'home.html')));
app.get('/konfirmasi', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'konfirmasi.html')));
app.get('/edit-profil', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'edit-profil.html')));
app.get('/pesan', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'pesan.html')));
app.get('/riwayat', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'riwayat.html')));
app.get('/profil', harusLogin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'profil.html')));

// Halaman Khusus
app.get('/admin', harusLogin, harusAdmin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/driver-dashboard', harusLogin, harusDriver, (req, res) => res.sendFile(path.join(__dirname, 'views', 'driver.html')));

app.get('/keluar', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// API AUTHENTICATION //

// Daftar User Biasa
app.post('/daftar', [body('nama').trim().escape()], (req, res) => {
    const { nama, email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (results.length > 0) return res.json({ success: false, message: "Email sudah terdaftar" });
        
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query("INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, 'user')", [nama, email, hashedPassword], () => {
            res.json({ success: true, message: "Daftar berhasil" });
        });
    });
});

// Daftar Driver
app.post('/daftar-driver', (req, res) => {
    const { nama, email, password, no_telepon, jenis_kendaraan, merk_kendaraan, nomor_polisi } = req.body;
    
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (results.length > 0) return res.json({ success: false, message: "Email sudah terdaftar" });

        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query("INSERT INTO users (nama, email, password, no_telepon, role) VALUES (?, ?, ?, ?, 'driver')", [nama, email, hashedPassword, no_telepon], (err) => {
            if (err) return res.json({ success: false, message: "Gagal daftar user" });

            db.query("INSERT INTO drivers (nama, jenis_kendaraan, merk_kendaraan, nomor_polisi, status) VALUES (?, ?, ?, ?, 'Online')", [nama, jenis_kendaraan, merk_kendaraan, nomor_polisi], () => {
                res.json({ success: true });
            });
        });
    });
});

// Login
app.post('/login', loginLimiter, (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, message: "Email atau password salah" });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            req.session.userId = user.id;
            req.session.role = user.role;
            return res.json({ success: true, message: "Login berhasil", role: user.role });
        }
        return res.json({ success: false, message: "Email atau password salah" });
    });
});

// Lupa Password contoh sederhana pake terminal
app.post('/api/lupa-password', (req, res) => {
    const { email } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (results.length === 0) return res.json({ success: false, message: "Email tidak ditemukan." });

        const token = crypto.randomBytes(20).toString('hex');
        const expires = new Date(Date.now() + 3600000); 

        db.query("UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?", [token, expires, email], (err) => {
            
            // Tampilkan link di Terminal dan kirim ke Frontend
            const link = `http://localhost:3000/reset-password?token=${token}`;
            console.log(`\n[SIMULASI] Link Reset: ${link}\n`);
            
            res.json({ success: true, message: "Link reset berhasil dibuat!", resetLink: link });
        });
    });
});

app.post('/api/reset-password', async (req, res) => {
    const { token, password } = req.body;
    db.query("SELECT * FROM users WHERE reset_token = ? AND reset_expires > NOW()", [token], async (err, results) => {
        if (results.length === 0) return res.json({ success: false, message: "Token tidak valid/expired." });

        const hashedPassword = await bcrypt.hash(password, 10);
        db.query("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?", [hashedPassword, results[0].id], () => {
            res.json({ success: true, message: "Password berhasil diubah." });
        });
    });
});

// API UMUM  //
app.get('/api/user', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    db.query("SELECT nama, email, no_telepon, role FROM users WHERE id = ?", [req.session.userId], (err, results) => res.json({ success: true, user: results[0] }));
});

app.post('/api/user/update', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    const { nama, email, no_telepon } = req.body;
    db.query("UPDATE users SET nama = ?, email = ?, no_telepon = ? WHERE id = ?", [nama, email, no_telepon, req.session.userId], () => res.json({ success: true, message: "Updated" }));
});

app.get('/api/rute', (req, res) => {
    db.query("SELECT * FROM daftar_rute", (err, results) => res.json({ success: true, data: results }));
});

app.get('/api/drivers', (req, res) => {
    db.query("SELECT * FROM drivers WHERE status = 'Online' ORDER BY RAND() LIMIT 3", (err, results) => res.json({ success: true, data: results }));
});

//  API PESANAN //
app.post('/api/pesan', (req, res) => {
    if (!req.session.userId) return res.json({ success: false, message: "Login dulu" });
    const { rute_id, jenis_layanan } = req.body;
    const userId = req.session.userId;

    let requiredVehicle = (jenis_layanan === 'mobil') ? 'Mobil' : 'Motor';

    db.query("SELECT * FROM daftar_rute WHERE id = ?", [rute_id], (err, results) => {
        if (err || results.length === 0) return res.json({ success: false, message: "Rute error" });
        const rute = results[0];
        let harga = (jenis_layanan === 'motor') ? rute.harga_motor : ((jenis_layanan === 'mobil') ? rute.harga_mobil : rute.harga_barang);

        // Cari Driver
        db.query("SELECT * FROM drivers WHERE jenis_kendaraan = ? AND status = 'Online' ORDER BY RAND() LIMIT 1", [requiredVehicle], (err, driverResult) => {
            if (driverResult.length === 0) return res.json({ success: false, message: `Maaf, semua driver ${requiredVehicle} sedang sibuk.` });

            const driver = driverResult[0];
            const infoKendaraan = `${driver.merk_kendaraan} (${driver.nomor_polisi})`;

            // Set Busy
            db.query("UPDATE drivers SET status = 'Busy' WHERE id = ?", [driver.id], () => {
                const sql = "INSERT INTO pesanan (user_id, lokasi_jemput, tujuan, jenis_layanan, harga, status, nama_driver, info_kendaraan) VALUES (?, ?, ?, ?, ?, 'Proses', ?, ?)";
                db.query(sql, [userId, rute.asal, rute.tujuan, jenis_layanan, harga, driver.nama, infoKendaraan], () => {
                    res.json({ success: true, message: `Driver ditemukan: ${driver.nama}` });
                });
            });
        });
    });
});

app.get('/api/riwayat', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    db.query("SELECT * FROM pesanan WHERE user_id = ? ORDER BY id DESC", [req.session.userId], (err, results) => res.json({ success: true, data: results }));
});

app.delete('/api/riwayat/:id', (req, res) => {
    if (!req.session.userId) return res.json({ success: false });
    
    // Cek status
    db.query("SELECT status FROM pesanan WHERE id = ? AND user_id = ?", [req.params.id, req.session.userId], (err, results) => {
        if (results.length === 0) return res.json({ success: false, message: "Tidak ditemukan" });
        if (results[0].status === 'Proses') return res.json({ success: false, message: "Pesanan sedang berjalan!" });
        db.query("DELETE FROM pesanan WHERE id = ?", [req.params.id], () => res.json({ success: true, message: "Dihapus" }));
    });
});

//  API ADMIN //
app.get('/api/admin/data', harusLogin, harusAdmin, (req, res) => {
    db.query("SELECT * FROM pesanan ORDER BY id DESC", (err, pesanan) => {
        db.query("SELECT * FROM users ORDER BY id DESC", (err, users) => {
            db.query("SELECT * FROM drivers ORDER BY id DESC", (err, drivers) => res.json({ success: true, pesanan, users, drivers }));
        });
    });
});

app.delete('/api/admin/users/:id', harusLogin, harusAdmin, (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
        if(results[0].role === 'driver') db.query("DELETE FROM drivers WHERE nama = ?", [results[0].nama]);
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
    db.query("SELECT nama FROM drivers WHERE id = ?", [driverId], (err, resD) => {
        if(resD.length > 0) db.query("DELETE FROM users WHERE nama = ? AND role = 'driver'", [resD[0].nama]);
        db.query("DELETE FROM drivers WHERE id = ?", [driverId], () => res.json({ success: true }));
    });
});

app.put('/api/admin/users/:id/role', harusLogin, harusAdmin, (req, res) => {
    db.query("UPDATE users SET role = ? WHERE id = ?", [req.body.role, req.params.id], () => res.json({ success: true }));
});

//  API DRIVER  //
app.get('/api/driver/data', harusLogin, harusDriver, (req, res) => {
    const userId = req.session.userId;
    db.query("SELECT nama, email FROM users WHERE id = ?", [userId], (err, uRes) => {
        const nama = uRes[0].nama;
        db.query("SELECT * FROM drivers WHERE nama = ?", [nama], (err, dRes) => {
            db.query("SELECT * FROM pesanan WHERE nama_driver = ? ORDER BY id DESC", [nama], (err, pRes) => {
                const aktif = pRes.filter(p => p.status === 'Proses');
                const selesai = pRes.filter(p => p.status === 'Selesai');
                const pendapatan = selesai.reduce((acc, curr) => acc + parseFloat(curr.harga), 0);
                res.json({ success: true, profil: {...uRes[0], ...dRes[0]}, pendapatan, pesananAktif: aktif, riwayat: selesai });
            });
        });
    });
});

app.post('/api/driver/complete', harusLogin, harusDriver, (req, res) => {
    const { pesanan_id } = req.body;
    db.query("SELECT nama_driver FROM pesanan WHERE id = ?", [pesanan_id], (err, result) => {
        db.query("UPDATE pesanan SET status = 'Selesai' WHERE id = ?", [pesanan_id], () => {
            if(result.length > 0 && result[0].nama_driver) {
                db.query("UPDATE drivers SET status = 'Online' WHERE nama = ?", [result[0].nama_driver]);
            }
            res.json({ success: true });
        });
    });
});

// AUTO COMPLETE
setInterval(() => {
    db.query("SELECT * FROM pesanan WHERE status = 'Proses' AND tanggal < (NOW() - INTERVAL 1 MINUTE)", (err, orders) => {
        if (orders && orders.length > 0) {
            orders.forEach(o => {
                db.query("UPDATE pesanan SET status = 'Selesai' WHERE id = ?", [o.id], () => {
                    if (o.nama_driver) db.query("UPDATE drivers SET status = 'Online' WHERE nama = ?", [o.nama_driver]);
                });
            });
        }
    });
}, 5000);

//  START SERVER  //
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});