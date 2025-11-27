-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for okejekdb
CREATE DATABASE IF NOT EXISTS `okejekdb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `okejekdb`;

-- Dumping structure for table okejekdb.daftar_rute
CREATE TABLE IF NOT EXISTS `daftar_rute` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asal` varchar(100) DEFAULT NULL,
  `tujuan` varchar(100) DEFAULT NULL,
  `jarak_km` decimal(5,1) DEFAULT NULL,
  `harga_motor` decimal(10,2) DEFAULT NULL,
  `harga_mobil` decimal(10,2) DEFAULT NULL,
  `harga_barang` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table okejekdb.daftar_rute: ~5 rows (approximately)
INSERT INTO `daftar_rute` (`id`, `asal`, `tujuan`, `jarak_km`, `harga_motor`, `harga_mobil`, `harga_barang`) VALUES
	(1, 'Purwokerto', 'Baturraden', 14.5, 20000.00, 40000.00, 25000.00),
	(2, 'Stasiun Purwokerto', 'Unsoed', 4.2, 12000.00, 24000.00, 15000.00),
	(3, 'Pasar Wage', 'Rita Supermall', 2.5, 10000.00, 20000.00, 12000.00),
	(4, 'Terminal Bulupitu', 'Alun-alun', 5.0, 15000.00, 30000.00, 18000.00),
	(5, 'Telkom University', 'Stasiun', 3.0, 11000.00, 22000.00, 13000.00);

-- Dumping structure for table okejekdb.drivers
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) DEFAULT NULL,
  `jenis_kendaraan` varchar(20) DEFAULT NULL,
  `merk_kendaraan` varchar(50) DEFAULT NULL,
  `nomor_polisi` varchar(20) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Online',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table okejekdb.drivers: ~5 rows (approximately)
INSERT INTO `drivers` (`id`, `nama`, `jenis_kendaraan`, `merk_kendaraan`, `nomor_polisi`, `status`) VALUES
	(12, 'aldino', 'Motor', 'Beat', 'R 1234 X', 'Busy');

-- Dumping structure for table okejekdb.pesanan
CREATE TABLE IF NOT EXISTS `pesanan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `lokasi_jemput` varchar(255) DEFAULT NULL,
  `tujuan` varchar(255) DEFAULT NULL,
  `jenis_layanan` varchar(50) DEFAULT NULL,
  `harga` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  `nama_driver` varchar(100) DEFAULT NULL,
  `info_kendaraan` varchar(100) DEFAULT NULL,
  `tanggal` datetime DEFAULT CURRENT_TIMESTAMP,
  `rating` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `pesanan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table okejekdb.pesanan: ~0 rows (approximately)
INSERT INTO `pesanan` (`id`, `user_id`, `lokasi_jemput`, `tujuan`, `jenis_layanan`, `harga`, `status`, `nama_driver`, `info_kendaraan`, `tanggal`, `rating`) VALUES
	(9, 13, 'Purwokerto', 'Baturraden', 'motor', 20000.00, 'Selesai', 'rafa', 'Beat (R 1234 X)', '2025-11-27 08:58:52', 0),
	(10, 13, 'Stasiun Purwokerto', 'Unsoed', 'motor', 12000.00, 'Proses', 'aldino', 'Beat (R 1234 X)', '2025-11-27 10:13:50', 0);

-- Dumping structure for table okejekdb.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `no_telepon` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` varchar(20) DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table okejekdb.users: ~0 rows (approximately)
INSERT INTO `users` (`id`, `nama`, `email`, `no_telepon`, `password`, `created_at`, `role`) VALUES
	(10, 'Super Admin', 'admin@okejek.com', NULL, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2025-11-26 13:19:46', 'admin'),
	(11, 'adminnew', 'adminnew@okejek.com', NULL, '$2b$10$X3hPewpVwetQ/jFRiE/cjeAZ4Zl.lvO9x18aGbOYQ4Itgu10aD4da', '2025-11-26 13:35:49', 'admin'),
	(13, 'anton', 'anton@gmail.com', NULL, '$2b$10$4KVUKvLVZyR5iVl/vhpnQecn5JdQCpNhwYDv0SFsY4kGYukBFKu2G', '2025-11-26 13:59:15', 'user'),
	(19, 'aldino', 'aldinn@gmail.com', '081318975088', '$2b$10$iCEz5tOKfH9RrQFDiovZuOT7kg0QUyZ5p6eGmYD4Li4KaAvmK1DsW', '2025-11-27 02:28:32', 'driver');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
