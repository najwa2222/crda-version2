-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 11, 2025 at 11:06 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `base_crda`
--

-- --------------------------------------------------------

--
-- Table structure for table `rapport`
--

CREATE TABLE `rapport` (
  `id` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `cin` varchar(255) NOT NULL,
  `numero_transaction` varchar(255) DEFAULT NULL,
  `sujet` varchar(255) NOT NULL,
  `surface` decimal(10,2) NOT NULL,
  `limites_terrain` text NOT NULL,
  `localisation` varchar(255) NOT NULL,
  `superficie_batiments_anciens` decimal(10,2) NOT NULL,
  `observations` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `rapport`
--

INSERT INTO `rapport` (`id`, `nom`, `prenom`, `cin`, `numero_transaction`, `sujet`, `surface`, `limites_terrain`, `localisation`, `superficie_batiments_anciens`, `observations`) VALUES
(4, 'test', 'test', '12345678', '12345678', 'حفر بئر', '1234.00', '1234', '1234', '1234.00', '1234');

-- --------------------------------------------------------

--
-- Table structure for table `results`
--

CREATE TABLE `results` (
  `id` int(11) NOT NULL,
  `sujet` varchar(255) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `cin` varchar(255) NOT NULL,
  `numero_transaction` varchar(255) NOT NULL,
  `statut` enum('بصدد الدرس','مقبول','مرفوض') NOT NULL DEFAULT 'بصدد الدرس'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `results`
--

INSERT INTO `results` (`id`, `sujet`, `nom`, `prenom`, `cin`, `numero_transaction`, `statut`) VALUES
(18, 'حفر بئر', 'test', 'test', '12345678', '12345678', 'مقبول');

-- --------------------------------------------------------

--
-- Table structure for table `services_utilisateur`
--

CREATE TABLE `services_utilisateur` (
  `id` int(11) NOT NULL,
  `prenom` varchar(255) DEFAULT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `cin` varchar(255) NOT NULL,
  `numero_transaction` varchar(255) DEFAULT NULL,
  `certificat_propriete_terre` tinyint(1) DEFAULT NULL,
  `copie_piece_identite_fermier` tinyint(1) DEFAULT NULL,
  `copie_piece_identite_nationale` tinyint(1) DEFAULT NULL,
  `demande_but` tinyint(1) DEFAULT NULL,
  `copie_contrat_location_terrain` tinyint(1) DEFAULT NULL,
  `autres_documents` tinyint(1) DEFAULT NULL,
  `sujet` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'قيد الانتظار'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services_utilisateur`
--

INSERT INTO `services_utilisateur` (`id`, `prenom`, `nom`, `cin`, `numero_transaction`, `certificat_propriete_terre`, `copie_piece_identite_fermier`, `copie_piece_identite_nationale`, `demande_but`, `copie_contrat_location_terrain`, `autres_documents`, `sujet`, `status`) VALUES
(83, 'test', 'test', '12345678', '12345678', 1, 0, 1, 1, 0, 0, 'حفر بئر', 'تم');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('7Xo3Ny99F0MxFd0v1VPCPdgInuPCWt-X', 1744491934, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-04-12T21:05:34.148Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"}}'),
('d0AHnRnuidwhn3qV66x8VGKGk3yTeY8h', 1744483188, '{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2025-04-12T18:39:47.604Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"user\":{\"id\":2,\"email_user\":\"najwakarrouchi2222@gmail.com\",\"role_user\":\"gerant\",\"nom_user\":\"najwa\",\"prenom_user\":\"karrouchi\"}}');

-- --------------------------------------------------------

--
-- Table structure for table `utilisateur`
--

CREATE TABLE `utilisateur` (
  `id` int(11) NOT NULL,
  `nom_user` varchar(100) NOT NULL,
  `prenom_user` varchar(100) NOT NULL,
  `sex_user` enum('homme','femme') NOT NULL,
  `cin_user` varchar(15) NOT NULL,
  `email_user` varchar(255) NOT NULL,
  `password_user` varchar(255) NOT NULL,
  `role_user` enum('directeur','gerant','chef_dentreprise','pending') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status_user` enum('pending','approved','rejected') DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `utilisateur`
--

INSERT INTO `utilisateur` (`id`, `nom_user`, `prenom_user`, `sex_user`, `cin_user`, `email_user`, `password_user`, `role_user`, `created_at`, `status_user`) VALUES
(10, 'directeur', 'directeur', 'homme', '98765432', 'directeur@crda.com', '$2b$10$uWbOwlKaGKK7X5tKVTm6Euvwz1qJLSh1Pg5TpWAd7xxl4WGtu8eK2', 'directeur', '2025-04-11 20:59:41', 'approved'),
(11, 'chef', 'chef', 'femme', '14325544', 'chef@crda.com', '$2b$10$dX4nt39kPT9/VcV0JePDh.gys.mjdBAakTsAx56pg/ZTlzOhnATEu', 'chef_dentreprise', '2025-04-11 21:00:50', 'approved'),
(12, 'gerant', 'gerant', 'homme', '96268374', 'gerant@crda.com', '$2b$10$wFEHbAwY12YkYEy5WvdSQeTu1./6uL1qnDHfgq3g4iS5aWDkPRF.C', 'gerant', '2025-04-11 21:01:19', 'approved');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `rapport`
--
ALTER TABLE `rapport`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_cin_sujet` (`cin`,`sujet`),
  ADD KEY `idx_cin` (`cin`);

--
-- Indexes for table `results`
--
ALTER TABLE `results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_service` (`cin`,`sujet`);

--
-- Indexes for table `services_utilisateur`
--
ALTER TABLE `services_utilisateur`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_cin_sujet` (`cin`,`sujet`),
  ADD KEY `idx_cin` (`cin`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `utilisateur`
--
ALTER TABLE `utilisateur`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `rapport`
--
ALTER TABLE `rapport`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `results`
--
ALTER TABLE `results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `services_utilisateur`
--
ALTER TABLE `services_utilisateur`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `utilisateur`
--
ALTER TABLE `utilisateur`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `rapport`
--
ALTER TABLE `rapport`
  ADD CONSTRAINT `fk_rapport_service` FOREIGN KEY (`cin`,`sujet`) REFERENCES `services_utilisateur` (`cin`, `sujet`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
