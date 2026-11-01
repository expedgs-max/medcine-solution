-- ============================================================
-- SCRIPT COMPLET D'IMPORTATION POUR HOST.DZ / CPANEL
-- Base de donnees: medcine-solution
-- ============================================================
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO';
SET NAMES utf8mb4;

-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: medcine_solution_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) DEFAULT NULL,
  `patient_name` varchar(150) DEFAULT NULL,
  `patient_phone` varchar(50) DEFAULT NULL,
  `patient_email` varchar(150) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `duration` varchar(30) DEFAULT '20 min',
  `reason` varchar(255) NOT NULL,
  `consultation_type` varchar(150) DEFAULT 'Consultation générale',
  `price` decimal(10,2) DEFAULT 2500.00,
  `status` enum('En attente','Confirmé','Arrivé','En consultation','Terminé','Absent','Annulé') NOT NULL DEFAULT 'En attente',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_appointments_doctor` (`doctor_id`),
  KEY `idx_appointment_date` (`appointment_date`,`appointment_time`),
  KEY `idx_appointment_status` (`status`),
  KEY `fk_appointments_patient` (`patient_id`),
  CONSTRAINT `fk_appointments_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `staff_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointments_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (8,NULL,'aloo','54321',NULL,1,'2026-10-25','11:30:00','30 min','Suivi de Grossesse','Suivi de grossesse / Maternité',2500.00,'Arrivé','[Ticket N° 6] Réservation en ligne depuis l\'application patient','2026-10-25 09:51:24','2026-10-26 09:33:20'),(10,NULL,'mohamed','0555555','mohamedguedaoui13@gmail.com',1,'2026-10-29','15:30:00','30 min','Consultation médicale','Consultation médicale',2500.00,'Arrivé','[Ticket N° 14] Réservation en ligne depuis l\'application patient','2026-10-28 11:43:30','2026-10-29 14:51:58'),(11,NULL,'mouh','06666666',NULL,1,'2026-10-29','08:30:00','25 min','Consultation médicale','Consultation gynécologique / spécialisée',3000.00,'Arrivé','[Ticket N° 2] Réservation en ligne depuis l\'application patient','2026-10-28 12:18:24','2026-10-29 15:02:08'),(12,NULL,'patient n','0550505025','mohamedguedaoui13@gmail.com',1,'2026-10-29','14:00:00','30 min','Consultation médicale','Consultation médicale',2500.00,'Arrivé','[Ticket N° 11] Réservation en ligne depuis l\'application patient','2026-10-28 12:28:29','2026-10-29 14:53:31'),(15,NULL,'aymen','05454545',NULL,1,'2026-10-29','16:00:00','30 min','Consultation médicale','Consultation médicale',2500.00,'Arrivé','[Ticket N° 15] Réservation en ligne depuis l\'application patient','2026-10-29 12:37:25','2026-10-29 14:53:28'),(16,NULL,'aymen-01','05454545',NULL,1,'2026-11-02','15:30:00','30 min','Consultation médicale','Consultation médicale',2500.00,'Confirmé','[Ticket N° 14] Réservation en ligne depuis l\'application patient','2026-10-29 12:38:57','2026-10-29 12:58:22'),(17,NULL,'aymen-03','25252525',NULL,1,'2026-11-01','14:00:00','30 min','Consultation médicale','Consultation médicale',2500.00,'Confirmé','[Ticket N° 11] Réservation en ligne depuis l\'application patient','2026-10-29 12:59:28','2026-10-29 13:00:23'),(18,NULL,'aymen-003','25252525',NULL,1,'2026-11-01','13:30:00','30 min','Consultation médicale','Consultation médicale',2500.00,'Confirmé','[Ticket N° 11] Réservation en ligne depuis l\'application patient','2026-10-29 13:00:12','2026-10-29 13:00:40'),(19,9,'test guedaou','0697037109',NULL,1,'2026-10-29','09:00:00','15 min','Consultation gynécologique / spécialisée','Consultation gynécologique / spécialisée',3000.00,'Arrivé','','2026-10-29 14:47:52','2026-10-29 14:53:37');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` datetime NOT NULL,
  `user_name` varchar(150) NOT NULL,
  `role` varchar(100) NOT NULL,
  `action` varchar(150) NOT NULL,
  `details` text NOT NULL,
  `ip_address` varchar(50) DEFAULT '127.0.0.1',
  `severity` enum('Information','Action médicale','Sécurité','Alerte') NOT NULL DEFAULT 'Information',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'2024-10-19 10:45:12','Dr N. BELBACHIR OULD HENNIA','Médecin','Consultation de dossier médical','Accès au dossier #DOS-2024-001 (Claire Dubois)','192.168.1.15','Information','2026-10-22 08:29:34'),(2,'2024-10-19 10:15:02','Sophie Vasseur','Secrétaire','Arrivée patient enregistrée','Enregistrement en salle d\'attente : Sophie Bernard (#DOS-2024-003)','192.168.1.20','Information','2026-10-22 08:29:34'),(3,'2024-10-18 10:18:40','Dr N. BELBACHIR OULD HENNIA','Médecin','Validation ordonnance','Signature numérique de l\'ordonnance #ORD-2024-0090 pour Marc Lemoine','192.168.1.15','Action médicale','2026-10-22 08:29:34'),(4,'2024-10-18 09:30:15','Sophie Vasseur','Secrétaire','Création rendez-vous','RDV programmé le 2024-10-25 à 14:00 pour Yasmine Belkacem','192.168.1.20','Information','2026-10-22 08:29:34'),(5,'2024-10-17 18:00:21','Dr N. BELBACHIR OULD HENNIA','Médecin','Sauvegarde chiffrée','Sauvegarde locale et HDS sécurisée des dossiers patients réussie','192.168.1.15','Sécurité','2026-10-22 08:29:34');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cabinet_info`
--

DROP TABLE IF EXISTS `cabinet_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cabinet_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinic_name` varchar(150) NOT NULL DEFAULT 'Cabinet Médical de Gynécologie Obstétrique',
  `doctor_name` varchar(150) NOT NULL,
  `doctor_name_ar` varchar(150) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `title_ar` varchar(150) DEFAULT NULL,
  `specialty` varchar(150) NOT NULL,
  `sub_specialty` varchar(100) DEFAULT NULL,
  `rpps` varchar(50) DEFAULT NULL,
  `adeli` varchar(50) DEFAULT NULL,
  `siret` varchar(50) DEFAULT NULL,
  `order_number` varchar(50) DEFAULT NULL,
  `convention` varchar(100) DEFAULT 'Secteur Conventionné',
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `hours` varchar(255) DEFAULT NULL,
  `legal_notice` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `about_text` text DEFAULT NULL,
  `about_summary` text DEFAULT NULL,
  `slot_duration` int(11) DEFAULT 30,
  `slot_start_morning` varchar(10) DEFAULT '09:00',
  `slot_end_morning` varchar(10) DEFAULT '12:30',
  `slot_start_evening` varchar(10) DEFAULT '13:00',
  `slot_end_evening` varchar(10) DEFAULT '18:00',
  `secretary_phone` varchar(50) DEFAULT '0560 06 74 66',
  `closed_days` varchar(100) DEFAULT 'Vendredi: Fermé',
  `maps_url` text DEFAULT NULL,
  `maps_iframe` text DEFAULT NULL,
  `doctor_photo` longtext DEFAULT NULL,
  `closed_dates` longtext DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cabinet_info`
--

LOCK TABLES `cabinet_info` WRITE;
/*!40000 ALTER TABLE `cabinet_info` DISABLE KEYS */;
INSERT INTO `cabinet_info` VALUES (1,'Cabinet Médical belbachir','Dr N. BELBACHIR OULD HENNIA','الدكتورة ن. بلبشير ولد هنية','Médecin Spécialiste en Gynécologie Obstétrique','طبيبة مختصة في أمراض النساء والتوليد','Gynécologie Obstétrique & Échographie','Échographie','10104892341','751293842','482 918 274 00018','31/24891','Secteur Conventionné','dr.belbachir@cabinet-medical.dz','01 42 68 50 10','Haï Seddikia (ex-Cité Boulanger), Cité 340 Logements, Bâtiment 18/A, Oran','Sam - Jeu: 09:00 - 18:00 | Ven: Fermé','Membre d\'une association de gestion agréée par l\'administration fiscale, acceptant à ce titre le règlement des honoraires par chèque et carte bancaire.','2026-10-22 08:29:34','2026-10-29 12:43:52','Cabinet médical de gynécologie obstétrique et d\'échographie du Dr N. BELBACHIR OULD HENNIA, situé à Haï Essedikia (Avenue Seghier Benali) à Oran.\n\nDédié à la santé et au bien-être de la femme, notre cabinet assure un suivi bienveillant et personnalisé de votre grossesse, de la conception jusqu\'au terme. Équipée des dernières technologies d\'imagerie ultrasonore avec Doppler couleur et rendu 3D/4D HD Live, la praticienne réalise vos bilans morphologiques et diagnostics prénataux avec la plus haute précision.\n\nNous assurons également les consultations de gynécologie générale, le dépistage précoce, les bilans de fertilité et la contraception, dans un cadre serein privilégiant l\'écoute attentive, le respect du secret médical et la ponctualité.','Cabinet médical moderne dédié à la santé féminine, au suivi complet de la grossesse, au diagnostic prénatal et aux échographies obstétricales et pelviennes de haute précision.',30,'09:00','12:30','13:00','16:00','0560 06 74 66','Vendredi: Fermé','https://maps.google.com/?q=Gynecologue+Belbachir+Ouldhennia!5e0','https://maps.google.com/maps?q=35.714476270634655,-0.6038324575020871&hl=fr&z=17&output=embed','/doctor.jpg','[]');
/*!40000 ALTER TABLE `cabinet_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_categories`
--

DROP TABLE IF EXISTS `cash_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cash_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('RECETTE','DEPENSE') NOT NULL,
  `name` varchar(100) NOT NULL,
  `color` varchar(20) DEFAULT '#1e60d5',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_categories`
--

LOCK TABLES `cash_categories` WRITE;
/*!40000 ALTER TABLE `cash_categories` DISABLE KEYS */;
INSERT INTO `cash_categories` VALUES (1,'RECETTE','CONSULTATION MÉDICALE','#1e60d5','2026-10-26 12:49:26'),(2,'RECETTE','ÉCHOGRAPHIE & DIAGNOSTIC','#1e60d5','2026-10-26 12:49:26'),(3,'RECETTE','ACTE MÉDICAL / SOINS','#1e60d5','2026-10-26 12:49:26'),(4,'RECETTE','VERSEMENT PATIENT','#1e60d5','2026-10-26 12:49:26'),(5,'RECETTE','AUTRE RECETTE','#1e60d5','2026-10-26 12:49:26'),(6,'DEPENSE','ACHAT MARCHANDISE / STOCK','#1e60d5','2026-10-26 12:49:26'),(7,'DEPENSE','FOURNITURES & CONSOMMABLES','#1e60d5','2026-10-26 12:49:26'),(8,'DEPENSE','LOYER & CHARGES','#1e60d5','2026-10-26 12:49:26'),(9,'DEPENSE','ÉLECTRICITÉ, GAZ & EAU','#1e60d5','2026-10-26 12:49:26'),(10,'DEPENSE','INTERNET & TÉLÉPHONIE','#1e60d5','2026-10-26 12:49:26'),(11,'DEPENSE','SALAIRES PERSONNEL','#1e60d5','2026-10-26 12:49:26'),(12,'DEPENSE','MARKETING & PUBLICITÉ','#1e60d5','2026-10-26 12:49:26'),(13,'DEPENSE','AUTRE DÉPENSE','#1e60d5','2026-10-26 12:49:26');
/*!40000 ALTER TABLE `cash_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_entries`
--

DROP TABLE IF EXISTS `cash_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cash_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('RECETTE','DEPENSE') NOT NULL DEFAULT 'RECETTE',
  `reference` varchar(50) NOT NULL,
  `party_name` varchar(150) NOT NULL,
  `party_phone` varchar(50) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `entry_date` date NOT NULL,
  `payment_method` varchar(50) DEFAULT 'Espèces',
  `notes` text DEFAULT NULL,
  `attachment_path` longtext DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `operator` varchar(100) DEFAULT 'Dr N. BELBACHIR OULD HENNIA',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  KEY `entry_date` (`entry_date`),
  KEY `category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_entries`
--

LOCK TABLES `cash_entries` WRITE;
/*!40000 ALTER TABLE `cash_entries` DISABLE KEYS */;
INSERT INTO `cash_entries` VALUES (1,'DEPENSE','DEP-20261022-164801','Internet Sonelgaz / Telecom','041 53 00 00','INTERNET & TÉLÉPHONIE',1000.00,'2026-10-22','Espèces','Abonnement internet fibre du cabinet médical',NULL,'recu_internet.pdf','Dr N. BELBACHIR OULD HENNIA','2026-10-26 12:49:26','2026-10-26 12:49:26'),(5,'RECETTE','REC-20261026-132937','sss','555','ACTE MÉDICAL / SOINS',100.00,'2026-10-26','Espèces','',NULL,NULL,'Dr N. BELBACHIR OULD HENNIA','2026-10-26 13:29:37','2026-10-26 13:29:37'),(6,'RECETTE','REC-20261026-134427','t','','ACTE MÉDICAL / SOINS',400.00,'2026-10-26','Espèces','',NULL,NULL,'Dr N. BELBACHIR OULD HENNIA','2026-10-26 13:44:27','2026-10-26 13:44:27'),(7,'RECETTE','REC-20261028-0010','test guedaoui','0697037109','CONSULTATION MÉDICALE',3000.00,'2026-10-28','Espèces','Consultation gynécologique / spécialisée — Réf: CS-2026-01014',NULL,NULL,'Dr N. BELBACHIR OULD HENNIA','2026-10-28 13:33:26','2026-10-28 13:33:26'),(8,'RECETTE','REC-20261028-009','test guedaoui','0697037109','CONSULTATION MÉDICALE',3000.00,'2026-10-28','Espèces','Consultation gynécologique / spécialisée — Réf: CS-2026-01013',NULL,NULL,'Dr N. BELBACHIR OULD HENNIA','2026-10-28 13:33:26','2026-10-28 13:33:26'),(9,'RECETTE','REC-20261028-0011','Patiente De Passage (sc)','','CONSULTATION MÉDICALE',3000.00,'2026-10-28','Espèces','Consultation urgente de passage — Réf: CS-2026-0011',NULL,NULL,'Dr N. BELBACHIR OULD HENNIA','2026-10-28 16:06:18','2026-10-28 16:06:18'),(10,'RECETTE','REC-20261029-0012','test guedaou','0697037109','ÉCHOGRAPHIE & DIAGNOSTIC',4000.00,'2026-10-29','Espèces','Échographie Obstétricale — 2ème Trimestre — Réf: CS-2026-01012',NULL,NULL,'Dr N. BELBACHIR OULD HENNIA','2026-10-29 11:47:02','2026-10-29 11:47:02');
/*!40000 ALTER TABLE `cash_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinical_examinations`
--

DROP TABLE IF EXISTS `clinical_examinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clinical_examinations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `consultation_id` int(11) DEFAULT NULL,
  `exam_date` date NOT NULL,
  `bp_systolic` int(11) DEFAULT NULL,
  `bp_diastolic` int(11) DEFAULT NULL,
  `heart_rate` int(11) DEFAULT NULL,
  `temperature` decimal(4,1) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `height` decimal(5,2) DEFAULT NULL,
  `bmi` decimal(4,1) DEFAULT NULL,
  `spo2` int(11) DEFAULT NULL,
  `blood_sugar` decimal(4,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_exam_consultation` (`consultation_id`),
  KEY `idx_exam_patient_date` (`patient_id`,`exam_date`),
  CONSTRAINT `fk_exam_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_exam_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinical_examinations`
--

LOCK TABLES `clinical_examinations` WRITE;
/*!40000 ALTER TABLE `clinical_examinations` DISABLE KEYS */;
INSERT INTO `clinical_examinations` VALUES (1,2,NULL,'2024-10-18',145,88,76,36.9,84.00,178.00,26.5,97,1.28,'Pression artérielle légèrement élevée, glycémie à surveiller.','2026-10-22 08:29:34'),(2,2,NULL,'2024-07-15',140,85,72,36.7,85.20,178.00,26.9,98,1.34,'Consultation antérieure de contrôle.','2026-10-22 08:29:34'),(3,1,1,'2024-10-14',120,75,68,36.8,58.00,165.00,21.3,99,0.92,'Paramètres vitaux optimaux.','2026-10-22 08:29:34'),(4,3,2,'2024-10-17',115,70,78,37.1,54.50,168.00,19.3,99,0.90,'Pas de fièvre, pouls régulier.','2026-10-22 08:29:34');
/*!40000 ALTER TABLE `clinical_examinations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultations`
--

DROP TABLE IF EXISTS `consultations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consultations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `consultation_number` varchar(50) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `consultation_date` date NOT NULL,
  `consultation_time` time NOT NULL,
  `reason` varchar(255) NOT NULL,
  `bp` varchar(20) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `temperature` decimal(4,1) DEFAULT NULL,
  `heart_rate` int(11) DEFAULT NULL,
  `ddr` date DEFAULT NULL COMMENT 'Date des dernières règles',
  `terme` varchar(50) DEFAULT NULL COMMENT 'Terme en SA',
  `symptoms` text DEFAULT NULL,
  `exam_findings` text DEFAULT NULL,
  `echo_type` varchar(150) DEFAULT NULL,
  `echo_findings` text DEFAULT NULL,
  `echo_conclusion` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `prescription_created` tinyint(1) DEFAULT 0,
  `prescription_id` int(11) DEFAULT NULL,
  `billing_code` varchar(150) DEFAULT NULL,
  `status` enum('En cours','Clôturée','Archivée') NOT NULL DEFAULT 'Clôturée',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `patient_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `consultation_number` (`consultation_number`),
  KEY `fk_consultations_patient` (`patient_id`),
  KEY `fk_consultations_doctor` (`doctor_id`),
  KEY `fk_consultations_appointment` (`appointment_id`),
  KEY `idx_consultation_date` (`consultation_date`),
  CONSTRAINT `fk_consultations_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_consultations_doctor` FOREIGN KEY (`doctor_id`) REFERENCES `staff_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_consultations_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultations`
--

LOCK TABLES `consultations` WRITE;
/*!40000 ALTER TABLE `consultations` DISABLE KEYS */;
INSERT INTO `consultations` VALUES (9,'CS-2026-01013',9,1,NULL,'2026-10-28','14:23:00','Consultation gynécologique / spécialisée','120/80',65.00,37.0,72,NULL,'-',NULL,'Examen clinique normal.',NULL,'','','Bilan médical de contrôle normal','Respecter les règles hygiéno-diététiques et le traitement prescrit.',0,NULL,'Consultation gynécologique / spécialisée (3 000 DA)','Clôturée','2026-10-28 13:23:58','2026-10-28 13:23:58',NULL),(10,'CS-2026-01014',9,1,NULL,'2026-10-28','14:24:00','Consultation gynécologique / spécialisée','120/80',65.00,37.0,72,NULL,'-',NULL,'Examen clinique normal.',NULL,'','','Bilan médical de contrôle normal','Respecter les règles hygiéno-diététiques et le traitement prescrit.',1,7,'Consultation gynécologique / spécialisée (3 000 DA)','Clôturée','2026-10-28 13:25:25','2026-10-28 13:25:25',NULL),(11,'CS-2026-0011',NULL,1,NULL,'2026-10-28','17:05:00','Consultation urgente de passage',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'Bilan normal','Bilan normal','Aucun traitement',0,NULL,'Consultation gynécologique / spécialisée (3 000 DA)','Clôturée','2026-10-28 16:06:18','2026-10-28 16:06:18','Patiente De Passage (sc)'),(12,'CS-2026-01012',9,1,NULL,'2026-10-29','12:47:00','Échographie Obstétricale — 2ème Trimestre','120/80',65.00,NULL,NULL,NULL,'En cours',NULL,'Examen clinique et compte-rendu échographique (Échographie Obstétricale — 2ème Trimestre).','Échographie OB2','Échographie T2 normale','Échographie T2 normale','Échographie T2 normale','Suivi obstétrico-gynécologique régulier conforme aux protocoles.',0,NULL,'Échographie obstétrique (4 000 DA)','Clôturée','2026-10-29 11:47:02','2026-10-29 11:47:02','test guedaou');
/*!40000 ALTER TABLE `consultations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `consultation_id` int(11) DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `act_description` text NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `covered_amo` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prise en charge CNAS / Assurance obligatoire',
  `covered_amc` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Prise en charge Mutuelle / Complémentaire',
  `patient_remaining` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` varchar(50) DEFAULT 'Espèces',
  `status` enum('Payée','Télétransmise','En attente','Annulée') NOT NULL DEFAULT 'En attente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `patient_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `fk_invoices_patient` (`patient_id`),
  KEY `fk_invoices_consultation` (`consultation_id`),
  KEY `idx_invoice_status` (`status`),
  CONSTRAINT `fk_invoices_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoices_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES (1,'FAC-2024-0248',1,1,'2024-10-14','Consultation de médecine générale',2500.00,2000.00,500.00,0.00,'Espèces','Payée','2026-10-22 08:29:34','2026-10-22 08:29:34',NULL),(2,'FAC-2024-0249',2,NULL,'2024-10-18','Consultation suivi pathologie chronique + ECG',3500.00,3500.00,0.00,0.00,'Tiers-Payant CNAS','Télétransmise','2026-10-22 08:29:34','2026-10-22 08:29:34',NULL),(3,'FAC-2024-0250',3,2,'2024-10-17','Consultation générale',2500.00,0.00,0.00,2500.00,'En attente','En attente','2026-10-22 08:29:34','2026-10-22 08:29:34',NULL),(4,'FAC-2024-0251',4,NULL,'2024-10-10','Consultation pédiatrique (Enfant)',3000.00,2400.00,600.00,0.00,'Espèces','Payée','2026-10-22 08:29:34','2026-10-22 08:29:34',NULL),(6,'FAC-2026-0006',5,4,'2026-10-25','Échographie obstétricale T2 (4 000 DA)',4000.00,0.00,0.00,4000.00,'Espèces','Payée','2026-10-25 11:38:31','2026-10-25 11:38:31',NULL),(11,'FAC-2026-0011-24',9,9,'2026-10-28','Consultation gynécologique / spécialisée (3 000 DA)',2500.00,0.00,0.00,2500.00,'Espèces','Payée','2026-10-28 13:23:58','2026-10-28 13:23:58',NULL),(12,'FAC-2026-0012-60',9,10,'2026-10-28','Consultation gynécologique / spécialisée (3 000 DA)',2500.00,0.00,0.00,2500.00,'Espèces','Payée','2026-10-28 13:25:25','2026-10-28 13:25:25',NULL),(13,'FAC-2026-0013-71',NULL,11,'2026-10-28','Consultation gynécologique / spécialisée (3 000 DA)',3000.00,0.00,0.00,3000.00,'Espèces','Payée','2026-10-28 16:06:18','2026-10-28 16:06:18','Patiente De Passage (sc)'),(14,'FAC-2026-0014-63',9,12,'2026-10-29','Échographie obstétrique (4 000 DA)',4000.00,0.00,0.00,4000.00,'Espèces','Payée','2026-10-29 11:47:02','2026-10-29 11:47:02','test guedaou');
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_documents`
--

DROP TABLE IF EXISTS `medical_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medical_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `consultation_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `category` enum('Analyses de laboratoire','Imagerie & Radiologie','Certificats médicaux','Comptes rendus spécialistes','Autre') NOT NULL,
  `doc_date` date NOT NULL,
  `author` varchar(150) DEFAULT NULL,
  `file_path` longtext DEFAULT NULL,
  `file_size` varchar(50) DEFAULT NULL,
  `file_type` varchar(20) DEFAULT 'PDF',
  `status` varchar(50) DEFAULT 'Validé',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_docs_patient` (`patient_id`),
  KEY `fk_docs_consultation` (`consultation_id`),
  CONSTRAINT `fk_docs_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_docs_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_documents`
--

LOCK TABLES `medical_documents` WRITE;
/*!40000 ALTER TABLE `medical_documents` DISABLE KEYS */;
INSERT INTO `medical_documents` VALUES (1,2,NULL,'Bilan sanguin complet & HbA1c','Analyses de laboratoire','2024-10-15','Laboratoire d\'Analyses Médicales Pyramides',NULL,'420 Ko','PDF','Validé par le médecin','2026-10-22 08:29:34','2026-10-22 08:29:34'),(2,1,1,'Radiographie thoracique face/profil','Imagerie & Radiologie','2024-05-12','Centre d\'Imagerie Paris Centre',NULL,'2.4 Mo','PDF','Validé','2026-10-22 08:29:34','2026-10-22 08:29:34'),(3,4,NULL,'Certificat médical d\'aptitude à la natation','Certificats médicaux','2024-09-08','Dr N. BELBACHIR OULD HENNIA',NULL,'180 Ko','PDF','Délivré','2026-10-22 08:29:34','2026-10-22 08:29:34'),(4,3,2,'Compte rendu consultation Neurologie','Comptes rendus spécialistes','2024-06-20','Dr. H. Vaneau (Neurologue)',NULL,'310 Ko','PDF','Archivé','2026-10-22 08:29:34','2026-10-22 08:29:34'),(5,5,4,'Ordonnance Médicale #ORD-2026-TEST','Autre','2026-10-25','Dr N. BELBACHIR OULD HENNIA',NULL,'Ordonnance','Prescription','Validée','2026-10-25 10:48:12','2026-10-25 10:48:12'),(6,5,4,'Compte-Rendu Échographique (Échographie Morphologique T2)','Imagerie & Radiologie','2026-10-25','Dr N. BELBACHIR OULD HENNIA',NULL,'Compte-rendu officiel','Échographie','Archivé','2026-10-25 10:48:12','2026-10-25 10:48:12'),(13,9,10,'Ordonnance Médicale #ORD-2026-0020','Autre','2026-10-28','Dr N. BELBACHIR OULD HENNIA',NULL,'Ordonnance','Prescription','Validée','2026-10-28 13:25:25','2026-10-28 13:25:25'),(14,9,NULL,'Bilan Sanguin & NFS','Analyses de laboratoire','2026-10-29','Dr N. BELBACHIR OULD HENNIA',NULL,'450 Ko','PDF','Validé','2026-10-29 08:47:03','2026-10-29 08:47:03'),(18,9,NULL,'radio','Imagerie & Radiologie','2026-10-29','Centre d\'Imagerie / Dr N. BELBACHIR OULD HENNIA','uploads/documents/doc_9_1793264590_f10c2430.png','46 Ko','PNG','Validé','2026-10-29 09:03:10','2026-10-29 09:03:10'),(19,9,12,'Compte-Rendu Échographique (Échographie OB2)','Imagerie & Radiologie','2026-10-29','Dr N. BELBACHIR OULD HENNIA',NULL,'Compte-rendu officiel','Échographie','Archivé','2026-10-29 11:47:02','2026-10-29 11:47:02');
/*!40000 ALTER TABLE `medical_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medications`
--

DROP TABLE IF EXISTS `medications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `form` varchar(100) DEFAULT NULL,
  `default_posology` varchar(255) DEFAULT NULL,
  `default_duration` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medications`
--

LOCK TABLES `medications` WRITE;
/*!40000 ALTER TABLE `medications` DISABLE KEYS */;
INSERT INTO `medications` VALUES (1,'AMOXICILLINE 1g','1g','Comprimé dispersible','1 comprimé matin et soir','7 jours','Antibiotique','2026-10-22 08:41:47'),(2,'AUGMENTIN 1g/125mg','1g','Comprimé pelliculé','1 comprimé matin et soir au cours du repas','7 jours','Antibiotique','2026-10-22 08:41:47'),(3,'PARACÉTAMOL 1000 mg','1000 mg','Comprimé','1 comprimé toutes les 6 heures si douleur/fièvre (max 3g/j)','5 jours','Antalgique','2026-10-22 08:41:47'),(4,'SPASFON 80mg','80 mg','Lyoc','2 lyocs au moment des douleurs, à renouveler si besoin','5 jours','Antispasmodique','2026-10-22 08:41:47'),(5,'INUVAIR 100 µg/6 µg','100/6 µg','Solution pour inhalation','2 inhalations matin et soir','1 mois','Pneumologie','2026-10-22 08:41:47'),(6,'VENTOLINE 100 µg','100 µg','Aérosol-doseur','1 à 2 bouffées en cas de gêne respiratoire','Selon besoin','Pneumologie','2026-10-22 08:41:47'),(7,'AMLODIPINE 5 mg','5 mg','Comprimé','1 comprimé le matin','3 mois','Cardiologie','2026-10-22 08:41:47'),(8,'METFORMINE 1000 mg','1000 mg','Comprimé pelliculé','1 comprimé au milieu des 2 principaux repas','3 mois','Diabétologie','2026-10-22 08:41:47'),(9,'KARDEGIC 75 mg','75 mg','Sachet','1 sachet par jour au milieu d\'un repas','3 mois','Cardiologie','2026-10-22 08:41:47'),(10,'OMÉPRAZOLE 20 mg','20 mg','Gélule','1 gélule le matin à jeun','1 mois','Gastro-entérologie','2026-10-22 08:41:47'),(11,'ACIDE FOLIQUE 5 MG','5 mg','Comprimé','1 comprimé par jour','1 mois','Gynécologie','2026-10-22 08:41:47'),(12,'TARDYFERON B9','50 mg','Comprimé','1 comprimé par jour avant le repas','1 mois','Hématologie','2026-10-22 08:41:47'),(13,'GYNO-PEVARYL 150 mg','150 mg','Ovule','1 ovule au coucher pendant 3 jours','3 jours','Gynécologie','2026-10-22 08:41:47'),(14,'FLAGYL 500 mg','500 mg','Comprimé','1 comprimé matin et soir pendant les repas','7 jours','Anti-infectieux','2026-10-22 08:41:47'),(15,'AZITHROMYCINE 500 mg','500 mg','Comprimé','1 comprimé par jour pendant 3 jours','3 jours','Antibiotique','2026-10-22 08:41:47'),(16,'CEFIXIME 200 mg','200 mg','Comprimé','1 comprimé matin et soir','8 jours','Antibiotique','2026-10-22 08:41:47'),(17,'IBUPROFÈNE 400 mg','400 mg','Comprimé','1 comprimé au cours du repas, max 3 par jour','5 jours','Anti-inflammatoire','2026-10-22 08:41:47');
/*!40000 ALTER TABLE `medications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `display_time` varchar(100) DEFAULT NULL,
  `type` enum('info','success','warning','primary','danger') NOT NULL DEFAULT 'info',
  `icon` varchar(100) DEFAULT 'flaticon-381-clock',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'Patient en salle d\'attente','Sophie Bernard est arrivée pour son rendez-vous de 10:15.','Il y a 10 minutes','info','flaticon-381-clock',0,'2026-10-22 08:29:34'),(2,'Résultat d\'analyse reçu','Bilan biologique disponible pour Marc Lemoine (Labo Pyramides).','Il y a 1 heure','success','flaticon-381-file-1',0,'2026-10-22 08:29:34'),(3,'Rappel facture impayée','Facture FAC-2024-0250 en attente de règlement (2 500 DA).','Il y a 2 jours','warning','flaticon-381-calculator',1,'2026-10-22 08:29:34'),(4,'Sauvegarde HDS effectuée','Sauvegarde quotidienne conforme RGPD & Secret Médical réalisée avec succès.','Hier à 22:00','primary','flaticon-381-shield',1,'2026-10-22 08:29:34');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_allergies`
--

DROP TABLE IF EXISTS `patient_allergies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient_allergies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `allergy` varchar(255) NOT NULL,
  `severity` enum('Faible','Modérée','Sévère','Non précisée') DEFAULT 'Non précisée',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_allergies_patient` (`patient_id`),
  CONSTRAINT `fk_allergies_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_allergies`
--

LOCK TABLES `patient_allergies` WRITE;
/*!40000 ALTER TABLE `patient_allergies` DISABLE KEYS */;
INSERT INTO `patient_allergies` VALUES (1,1,'Pénicilline','Sévère','2026-10-22 08:29:34'),(2,1,'Arachides','Modérée','2026-10-22 08:29:34'),(3,2,'Aucune allergie connue','Non précisée','2026-10-22 08:29:34'),(4,3,'AINS (Ibuprofène)','Modérée','2026-10-22 08:29:34'),(5,4,'Acariens','Faible','2026-10-22 08:29:34'),(6,4,'Poils de chat','Faible','2026-10-22 08:29:34'),(7,5,'Iode de contraste','Sévère','2026-10-22 08:29:34'),(9,9,'allergiie test','Non précisée','2026-10-28 12:47:02');
/*!40000 ALTER TABLE `patient_allergies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_chronic_diseases`
--

DROP TABLE IF EXISTS `patient_chronic_diseases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient_chronic_diseases` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `disease` varchar(255) NOT NULL,
  `diagnosed_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_diseases_patient` (`patient_id`),
  CONSTRAINT `fk_diseases_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_chronic_diseases`
--

LOCK TABLES `patient_chronic_diseases` WRITE;
/*!40000 ALTER TABLE `patient_chronic_diseases` DISABLE KEYS */;
INSERT INTO `patient_chronic_diseases` VALUES (1,1,'Asthme modéré',NULL,NULL,'2026-10-22 08:29:34'),(2,2,'Hypertension Artérielle',NULL,NULL,'2026-10-22 08:29:34'),(3,2,'Diabète Type 2',NULL,NULL,'2026-10-22 08:29:34'),(4,3,'Migraines cataméniales',NULL,NULL,'2026-10-22 08:29:34'),(5,4,'Eczéma atopique',NULL,NULL,'2026-10-22 08:29:34'),(6,5,'Hypothyroïdie fruste',NULL,NULL,'2026-10-22 08:29:34'),(8,9,'athme',NULL,NULL,'2026-10-28 12:47:02');
/*!40000 ALTER TABLE `patient_chronic_diseases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_regular_treatments`
--

DROP TABLE IF EXISTS `patient_regular_treatments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient_regular_treatments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `treatment` varchar(255) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_treatments_patient` (`patient_id`),
  CONSTRAINT `fk_treatments_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_regular_treatments`
--

LOCK TABLES `patient_regular_treatments` WRITE;
/*!40000 ALTER TABLE `patient_regular_treatments` DISABLE KEYS */;
INSERT INTO `patient_regular_treatments` VALUES (1,1,'Ventoline 100µg (si besoin)',NULL,NULL,'2026-10-22 08:29:34'),(2,1,'Inuvair 100/6 (matin et soir)',NULL,NULL,'2026-10-22 08:29:34'),(3,2,'Metformine 1000mg',NULL,NULL,'2026-10-22 08:29:34'),(4,2,'Amlodipine 5mg',NULL,NULL,'2026-10-22 08:29:34'),(5,3,'Zomig 2.5mg (en crise)',NULL,NULL,'2026-10-22 08:29:34'),(6,4,'Crème émolliente',NULL,NULL,'2026-10-22 08:29:34'),(7,4,'Desloratadine sirop',NULL,NULL,'2026-10-22 08:29:34'),(8,5,'Lévothyrox 75µg',NULL,NULL,'2026-10-22 08:29:34');
/*!40000 ALTER TABLE `patient_regular_treatments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `file_number` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` enum('Féminin','Masculin','Autre') NOT NULL DEFAULT 'Féminin',
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `secu_number` varchar(50) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `gravida` int(11) DEFAULT 0 COMMENT 'Nombre de grossesses (G)',
  `para` int(11) DEFAULT 0 COMMENT 'Nombre d''accouchements (P)',
  `abortions` int(11) DEFAULT 0 COMMENT 'Nombre de fausses couches ou IVG (A)',
  `cesarean` int(11) DEFAULT 0 COMMENT 'Nombre de césariennes (C)',
  `living_children` int(11) DEFAULT 0 COMMENT 'Enfants vivants (E)',
  `last_visit` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Actif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `file_number` (`file_number`),
  KEY `idx_patient_name` (`last_name`,`first_name`),
  KEY `idx_patient_phone` (`phone`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` VALUES (1,'DOS-2024-001','Claire','Dubois','1988-04-12',36,'Féminin','06 12 34 56 78','claire.dubois@email.fr','dc678','15 rue de Rivoli, 75001 Paris','2 88 04 75 123 456 78','A+',2,1,0,0,1,'2024-10-14','Suivi régulier','2026-10-22 08:29:34','2026-10-26 09:27:38'),(2,'DOS-2024-002','Marc','Lemoine','1962-09-23',62,'Masculin','06 98 76 54 32','marc.lemoine@email.fr','lm432','8 boulevard Sébastopol, 75004 Paris','1 62 09 75 987 654 32','O+',0,0,0,0,0,'2024-10-18','Suivi régulier','2026-10-22 08:29:34','2026-10-26 09:27:38'),(3,'DOS-2024-003','Sophie','Bernard','1995-11-05',28,'Féminin','07 45 67 89 01','sophie.bernard@email.fr','bs901','42 avenue de l\'Opéra, 75002 Paris','2 95 11 75 456 789 01','B+',1,0,0,0,0,'2024-10-17','Actif','2026-10-22 08:29:34','2026-10-26 09:27:38'),(4,'DOS-2024-004','Lucas','Moreau','2018-06-15',6,'Masculin','06 33 22 11 00','parents.moreau@email.fr','ml100','3 rue Montmartre, 75001 Paris','1 18 06 75 332 211 00','A-',0,0,0,0,0,'2024-10-10','Suivi régulier','2026-10-22 08:29:34','2026-10-26 09:27:38'),(5,'DOS-2024-005','Yasmine','Belkacem','1979-02-28',45,'Féminin','06 55 44 33 22','y.belkacem@email.fr','by322','19 rue de Turbigo, 75003 Paris','2 79 02 75 554 433 22','O-',2,1,0,0,2,'2026-10-25','Actif','2026-10-22 08:29:34','2026-10-26 09:27:38'),(9,'DOS-2026-008','test','guedaou','2002-10-12',24,'Féminin','0697037109','guedaoui@gmail.com','gt109','','','O+',0,0,0,0,0,'2026-10-29','Actif','2026-10-28 12:47:02','2026-10-29 11:47:02');
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receipt_number` varchar(50) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(50) DEFAULT NULL,
  `patient_name` varchar(150) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_time` time NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `method` varchar(50) NOT NULL DEFAULT 'Espèces',
  `operator` varchar(150) NOT NULL,
  `status` enum('Encaissé','Annulé','Remboursé') NOT NULL DEFAULT 'Encaissé',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `fk_payments_invoice` (`invoice_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,'REC-2024-0182',2,'FAC-2024-0249','Marc Lemoine','2024-10-18','10:30:00',3500.00,'Tiers-Payant CNAS','Sophie Vasseur','Encaissé','2026-10-22 08:29:34'),(2,'REC-2024-0181',1,'FAC-2024-0248','Claire Dubois','2024-10-14','09:40:00',2500.00,'Espèces','Sophie Vasseur','Encaissé','2026-10-22 08:29:34'),(3,'REC-2024-0180',4,'FAC-2024-0251','Lucas Moreau','2024-10-10','11:25:00',3000.00,'Chèque','Dr N. BELBACHIR OULD HENNIA','Encaissé','2026-10-22 08:29:34');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescription_items`
--

DROP TABLE IF EXISTS `prescription_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prescription_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prescription_id` int(11) NOT NULL,
  `medication` varchar(255) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `posology` text NOT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `renewable` varchar(100) DEFAULT 'Non renouvelable',
  `instructions` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_items_prescription` (`prescription_id`),
  CONSTRAINT `fk_items_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescription_items`
--

LOCK TABLES `prescription_items` WRITE;
/*!40000 ALTER TABLE `prescription_items` DISABLE KEYS */;
INSERT INTO `prescription_items` VALUES (1,1,'INUVAIR 100 µg/6 µg solution pour inhalation','100/6 µg','2 inhalations matin et soir','10 jours puis 1 matin et soir','Renouvelable 2 fois',NULL),(2,1,'VENTOLINE 100 µg/dose aérosol-doseur','100 µg','1 à 2 bouffées en cas de gêne respiratoire','Flacon d\'urgence','1 flacon',NULL),(3,2,'AMLODIPINE 5 mg comprimé','5 mg','1 comprimé le matin','3 mois','Renouvelable 1 fois',NULL),(4,2,'METFORMINE 1000 mg comprimé pelliculé','1000 mg','1 comprimé au milieu des 2 principaux repas','3 mois','Renouvelable 1 fois',NULL),(12,7,'PARACÉTAMOL 1000 mg','1000 mg','1 comprimé toutes les 6 heures si douleur/fièvre (max 3g/j)','5 jours','Non renouvelable',NULL);
/*!40000 ALTER TABLE `prescription_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prescriptions`
--

DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prescription_number` varchar(50) NOT NULL,
  `consultation_id` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_name` varchar(150) NOT NULL,
  `prescription_date` date NOT NULL,
  `validity` varchar(50) DEFAULT '3 mois',
  `ald` tinyint(1) DEFAULT 0 COMMENT 'Affection Longue Durée',
  `notes` text DEFAULT NULL,
  `validated` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `patient_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prescription_number` (`prescription_number`),
  KEY `fk_prescriptions_patient` (`patient_id`),
  KEY `fk_prescriptions_consultation` (`consultation_id`),
  KEY `idx_prescription_date` (`prescription_date`),
  CONSTRAINT `fk_prescriptions_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prescriptions_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prescriptions`
--

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
INSERT INTO `prescriptions` VALUES (1,'ORD-2024-0089',1,1,'Dr N. BELBACHIR OULD HENNIA','2024-10-14','3 mois',0,'Bien rincer la bouche à l\'eau après inhalation. Revoir si besoin.',1,'2026-10-22 08:29:34','2026-10-22 08:29:34',NULL),(2,'ORD-2024-0090',NULL,2,'Dr N. BELBACHIR OULD HENNIA','2024-10-18','6 mois',1,'Bilan sanguin de contrôle (créatininémie, HbA1c) à réaliser dans 3 mois.',1,'2026-10-22 08:29:34','2026-10-22 08:29:34',NULL),(7,'ORD-2026-0020',10,9,'Dr N. BELBACHIR OULD HENNIA','2026-10-28','3 mois',0,'Respecter les règles hygiéno-diététiques et le traitement prescrit.',1,'2026-10-28 13:25:25','2026-10-28 13:25:25',NULL);
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `default_duration` varchar(30) DEFAULT '20 min',
  `slot_interval` varchar(30) DEFAULT '15 min',
  `default_consultation_type` varchar(150) DEFAULT 'Consultation de médecine générale',
  `consultation_price` decimal(10,2) DEFAULT 2500.00,
  `consultation_types` text DEFAULT NULL,
  `sms_reminders` tinyint(1) DEFAULT 1,
  `email_reminders` tinyint(1) DEFAULT 1,
  `reminder_hours_before` int(11) DEFAULT 24,
  `auto_backup` tinyint(1) DEFAULT 1,
  `backup_frequency` varchar(100) DEFAULT 'Quotidienne (23:00)',
  `session_timeout_minutes` int(11) DEFAULT 30,
  `two_factor_auth` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'25 min','15 min','Consultation gynécologique / spécialisée',3000.00,'[{\"id\":1,\"name\":\"Consultation de médecine générale\",\"duration\":\"20 min\",\"price\":2500,\"active\":true},{\"id\":2,\"name\":\"Consultation gynécologique \\/ spécialisée\",\"duration\":\"25 min\",\"price\":3000,\"active\":true},{\"id\":3,\"name\":\"Suivi de grossesse \\/ Maternité\",\"duration\":\"20 min\",\"price\":25,\"active\":true},{\"id\":4,\"name\":\"Échographie obstétricale (T1 \\/ T2 \\/ T3)\",\"duration\":\"30 min\",\"price\":40,\"active\":true},{\"id\":5,\"name\":\"Échographie pelvienne \\/ gynécologique\",\"duration\":\"25 min\",\"price\":3500,\"active\":true},{\"id\":6,\"name\":\"Consultation avec frottis \\/ acte\",\"duration\":\"30 min\",\"price\":3500,\"active\":true},{\"id\":7,\"name\":\"Visite de contrôle \\/ Bilan\",\"duration\":\"15 min\",\"price\":1500,\"active\":true}]',1,1,24,1,'Quotidienne (23:00)',30,1,'2026-10-26 10:05:20');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_visits`
--

DROP TABLE IF EXISTS `site_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `site_visits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `visited_at` datetime NOT NULL DEFAULT current_timestamp(),
  `page` varchar(150) DEFAULT '/patient-portal',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `device_type` varchar(30) DEFAULT 'desktop',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_visited_at` (`visited_at`)
) ENGINE=InnoDB AUTO_INCREMENT=539 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_visits`
--

LOCK TABLES `site_visits` WRITE;
/*!40000 ALTER TABLE `site_visits` DISABLE KEYS */;
INSERT INTO `site_visits` VALUES (1,'2026-10-12 20:31:09','/patient-portal','127.0.0.58',NULL,'desktop','2026-10-26 11:45:17'),(2,'2026-10-12 22:09:50','/patient-portal','127.0.0.79',NULL,'desktop','2026-10-26 11:45:17'),(3,'2026-10-12 15:24:10','/patient-portal#auth','127.0.0.1',NULL,'mobile','2026-10-26 11:45:17'),(4,'2026-10-12 14:47:00','/patient-portal#auth','127.0.0.66',NULL,'tablet','2026-10-26 11:45:17'),(5,'2026-10-12 11:46:49','/patient-portal#booking','127.0.0.54',NULL,'mobile','2026-10-26 11:45:17'),(6,'2026-10-12 10:14:30','/patient-portal#booking','127.0.0.4',NULL,'mobile','2026-10-26 11:45:17'),(7,'2026-10-12 15:42:15','/patient-portal#auth','127.0.0.24',NULL,'mobile','2026-10-26 11:45:17'),(8,'2026-10-12 14:04:39','/patient-portal#booking','127.0.0.78',NULL,'mobile','2026-10-26 11:45:17'),(9,'2026-10-12 14:09:01','/patient-portal#booking','127.0.0.21',NULL,'mobile','2026-10-26 11:45:17'),(10,'2026-10-12 11:03:36','/patient-portal#auth','127.0.0.31',NULL,'mobile','2026-10-26 11:45:17'),(11,'2026-10-12 12:35:28','/patient-portal','127.0.0.63',NULL,'mobile','2026-10-26 11:45:17'),(12,'2026-10-12 10:04:47','/patient-portal','127.0.0.24',NULL,'desktop','2026-10-26 11:45:17'),(13,'2026-10-12 21:29:23','/patient-portal','127.0.0.36',NULL,'desktop','2026-10-26 11:45:17'),(14,'2026-10-12 11:13:08','/patient-portal','127.0.0.19',NULL,'desktop','2026-10-26 11:45:17'),(15,'2026-10-12 21:00:17','/patient-portal#booking','127.0.0.60',NULL,'desktop','2026-10-26 11:45:17'),(16,'2026-10-12 20:09:09','/patient-portal#booking','127.0.0.23',NULL,'mobile','2026-10-26 11:45:17'),(17,'2026-10-12 10:50:42','/patient-portal#auth','127.0.0.59',NULL,'tablet','2026-10-26 11:45:17'),(18,'2026-10-12 17:27:45','/patient-portal#auth','127.0.0.77',NULL,'desktop','2026-10-26 11:45:17'),(19,'2026-10-12 22:54:40','/patient-portal','127.0.0.73',NULL,'mobile','2026-10-26 11:45:17'),(20,'2026-10-12 11:42:59','/patient-portal','127.0.0.78',NULL,'mobile','2026-10-26 11:45:17'),(21,'2026-10-12 22:06:50','/patient-portal','127.0.0.50',NULL,'mobile','2026-10-26 11:45:17'),(22,'2026-10-12 22:43:46','/patient-portal#auth','127.0.0.13',NULL,'mobile','2026-10-26 11:45:17'),(23,'2026-10-12 18:11:47','/patient-portal#auth','127.0.0.83',NULL,'desktop','2026-10-26 11:45:17'),(24,'2026-10-12 09:39:57','/patient-portal','127.0.0.43',NULL,'mobile','2026-10-26 11:45:17'),(25,'2026-10-12 14:35:52','/patient-portal','127.0.0.52',NULL,'tablet','2026-10-26 11:45:17'),(26,'2026-10-12 08:43:31','/patient-portal#booking','127.0.0.75',NULL,'mobile','2026-10-26 11:45:17'),(27,'2026-10-12 16:48:18','/patient-portal','127.0.0.79',NULL,'mobile','2026-10-26 11:45:17'),(28,'2026-10-12 16:08:12','/patient-portal','127.0.0.1',NULL,'mobile','2026-10-26 11:45:17'),(29,'2026-10-12 16:01:51','/patient-portal#booking','127.0.0.100',NULL,'mobile','2026-10-26 11:45:17'),(30,'2026-10-12 19:17:38','/patient-portal#auth','127.0.0.53',NULL,'tablet','2026-10-26 11:45:17'),(31,'2026-10-12 19:30:24','/patient-portal#booking','127.0.0.23',NULL,'mobile','2026-10-26 11:45:17'),(32,'2026-10-12 08:01:53','/patient-portal#booking','127.0.0.81',NULL,'desktop','2026-10-26 11:45:17'),(33,'2026-10-12 19:38:49','/patient-portal','127.0.0.67',NULL,'mobile','2026-10-26 11:45:17'),(34,'2026-10-12 14:12:12','/patient-portal','127.0.0.15',NULL,'tablet','2026-10-26 11:45:17'),(35,'2026-10-12 18:49:44','/patient-portal#auth','127.0.0.41',NULL,'desktop','2026-10-26 11:45:17'),(36,'2026-10-12 15:20:57','/patient-portal#booking','127.0.0.18',NULL,'mobile','2026-10-26 11:45:17'),(37,'2026-10-12 13:41:37','/patient-portal#booking','127.0.0.56',NULL,'desktop','2026-10-26 11:45:17'),(38,'2026-10-13 16:41:00','/patient-portal#auth','127.0.0.88',NULL,'mobile','2026-10-26 11:45:17'),(39,'2026-10-13 12:08:06','/patient-portal#auth','127.0.0.29',NULL,'desktop','2026-10-26 11:45:17'),(40,'2026-10-13 09:54:04','/patient-portal','127.0.0.65',NULL,'tablet','2026-10-26 11:45:17'),(41,'2026-10-13 12:53:25','/patient-portal#booking','127.0.0.88',NULL,'mobile','2026-10-26 11:45:17'),(42,'2026-10-13 14:19:15','/patient-portal#booking','127.0.0.90',NULL,'mobile','2026-10-26 11:45:17'),(43,'2026-10-13 22:44:14','/patient-portal#auth','127.0.0.14',NULL,'mobile','2026-10-26 11:45:17'),(44,'2026-10-13 11:35:40','/patient-portal','127.0.0.40',NULL,'mobile','2026-10-26 11:45:17'),(45,'2026-10-13 17:56:18','/patient-portal#booking','127.0.0.94',NULL,'mobile','2026-10-26 11:45:17'),(46,'2026-10-13 16:55:06','/patient-portal#auth','127.0.0.97',NULL,'desktop','2026-10-26 11:45:17'),(47,'2026-10-13 08:51:11','/patient-portal#auth','127.0.0.61',NULL,'tablet','2026-10-26 11:45:17'),(48,'2026-10-13 22:37:32','/patient-portal#booking','127.0.0.74',NULL,'tablet','2026-10-26 11:45:17'),(49,'2026-10-13 13:44:12','/patient-portal','127.0.0.13',NULL,'tablet','2026-10-26 11:45:17'),(50,'2026-10-13 14:49:55','/patient-portal','127.0.0.47',NULL,'mobile','2026-10-26 11:45:17'),(51,'2026-10-13 16:36:27','/patient-portal','127.0.0.26',NULL,'desktop','2026-10-26 11:45:17'),(52,'2026-10-13 16:06:03','/patient-portal#auth','127.0.0.63',NULL,'tablet','2026-10-26 11:45:17'),(53,'2026-10-13 15:29:51','/patient-portal#auth','127.0.0.45',NULL,'mobile','2026-10-26 11:45:17'),(54,'2026-10-13 10:42:38','/patient-portal#booking','127.0.0.8',NULL,'tablet','2026-10-26 11:45:17'),(55,'2026-10-13 15:31:50','/patient-portal#booking','127.0.0.39',NULL,'mobile','2026-10-26 11:45:17'),(56,'2026-10-13 22:23:25','/patient-portal#booking','127.0.0.6',NULL,'mobile','2026-10-26 11:45:17'),(57,'2026-10-13 18:38:13','/patient-portal','127.0.0.90',NULL,'desktop','2026-10-26 11:45:17'),(58,'2026-10-13 22:30:55','/patient-portal','127.0.0.12',NULL,'mobile','2026-10-26 11:45:17'),(59,'2026-10-13 16:31:44','/patient-portal#booking','127.0.0.81',NULL,'tablet','2026-10-26 11:45:17'),(60,'2026-10-14 15:16:41','/patient-portal#booking','127.0.0.89',NULL,'mobile','2026-10-26 11:45:17'),(61,'2026-10-14 18:06:33','/patient-portal#auth','127.0.0.32',NULL,'desktop','2026-10-26 11:45:17'),(62,'2026-10-14 12:48:47','/patient-portal','127.0.0.96',NULL,'tablet','2026-10-26 11:45:17'),(63,'2026-10-14 16:32:53','/patient-portal','127.0.0.15',NULL,'desktop','2026-10-26 11:45:17'),(64,'2026-10-14 15:22:05','/patient-portal','127.0.0.92',NULL,'desktop','2026-10-26 11:45:17'),(65,'2026-10-14 10:48:06','/patient-portal#booking','127.0.0.71',NULL,'desktop','2026-10-26 11:45:17'),(66,'2026-10-14 19:16:57','/patient-portal#booking','127.0.0.91',NULL,'mobile','2026-10-26 11:45:17'),(67,'2026-10-14 18:34:24','/patient-portal#auth','127.0.0.63',NULL,'mobile','2026-10-26 11:45:17'),(68,'2026-10-14 12:40:43','/patient-portal#auth','127.0.0.2',NULL,'desktop','2026-10-26 11:45:17'),(69,'2026-10-14 14:52:39','/patient-portal#auth','127.0.0.5',NULL,'tablet','2026-10-26 11:45:17'),(70,'2026-10-14 13:45:52','/patient-portal#booking','127.0.0.45',NULL,'desktop','2026-10-26 11:45:17'),(71,'2026-10-14 18:29:45','/patient-portal#auth','127.0.0.40',NULL,'desktop','2026-10-26 11:45:17'),(72,'2026-10-14 19:40:27','/patient-portal#booking','127.0.0.3',NULL,'mobile','2026-10-26 11:45:17'),(73,'2026-10-14 22:21:03','/patient-portal#auth','127.0.0.21',NULL,'desktop','2026-10-26 11:45:17'),(74,'2026-10-14 13:22:52','/patient-portal#auth','127.0.0.30',NULL,'desktop','2026-10-26 11:45:17'),(75,'2026-10-14 16:58:33','/patient-portal','127.0.0.45',NULL,'tablet','2026-10-26 11:45:17'),(76,'2026-10-14 11:47:14','/patient-portal','127.0.0.52',NULL,'mobile','2026-10-26 11:45:17'),(77,'2026-10-14 15:05:04','/patient-portal#auth','127.0.0.11',NULL,'mobile','2026-10-26 11:45:17'),(78,'2026-10-14 17:12:40','/patient-portal#auth','127.0.0.22',NULL,'mobile','2026-10-26 11:45:17'),(79,'2026-10-14 08:04:30','/patient-portal','127.0.0.5',NULL,'tablet','2026-10-26 11:45:17'),(80,'2026-10-14 15:20:53','/patient-portal#booking','127.0.0.47',NULL,'mobile','2026-10-26 11:45:17'),(81,'2026-10-14 14:32:56','/patient-portal#booking','127.0.0.47',NULL,'desktop','2026-10-26 11:45:17'),(82,'2026-10-14 10:41:45','/patient-portal#auth','127.0.0.42',NULL,'desktop','2026-10-26 11:45:17'),(83,'2026-10-14 17:04:04','/patient-portal#auth','127.0.0.100',NULL,'tablet','2026-10-26 11:45:17'),(84,'2026-10-14 22:45:24','/patient-portal','127.0.0.100',NULL,'desktop','2026-10-26 11:45:17'),(85,'2026-10-14 08:05:35','/patient-portal','127.0.0.76',NULL,'mobile','2026-10-26 11:45:17'),(86,'2026-10-15 20:38:16','/patient-portal#booking','127.0.0.56',NULL,'mobile','2026-10-26 11:45:17'),(87,'2026-10-15 16:54:45','/patient-portal#auth','127.0.0.74',NULL,'mobile','2026-10-26 11:45:17'),(88,'2026-10-15 14:46:09','/patient-portal#auth','127.0.0.79',NULL,'tablet','2026-10-26 11:45:17'),(89,'2026-10-15 11:52:09','/patient-portal#auth','127.0.0.39',NULL,'mobile','2026-10-26 11:45:17'),(90,'2026-10-15 19:11:39','/patient-portal','127.0.0.67',NULL,'mobile','2026-10-26 11:45:17'),(91,'2026-10-15 13:53:07','/patient-portal','127.0.0.15',NULL,'tablet','2026-10-26 11:45:17'),(92,'2026-10-15 16:31:58','/patient-portal#booking','127.0.0.33',NULL,'mobile','2026-10-26 11:45:17'),(93,'2026-10-15 09:24:58','/patient-portal','127.0.0.30',NULL,'tablet','2026-10-26 11:45:17'),(94,'2026-10-15 13:23:44','/patient-portal#booking','127.0.0.65',NULL,'desktop','2026-10-26 11:45:17'),(95,'2026-10-15 17:57:40','/patient-portal','127.0.0.44',NULL,'mobile','2026-10-26 11:45:17'),(96,'2026-10-15 18:29:08','/patient-portal','127.0.0.58',NULL,'tablet','2026-10-26 11:45:17'),(97,'2026-10-15 18:46:35','/patient-portal','127.0.0.86',NULL,'desktop','2026-10-26 11:45:17'),(98,'2026-10-15 16:57:27','/patient-portal#booking','127.0.0.10',NULL,'desktop','2026-10-26 11:45:17'),(99,'2026-10-15 09:37:45','/patient-portal','127.0.0.26',NULL,'mobile','2026-10-26 11:45:17'),(100,'2026-10-15 15:27:38','/patient-portal#auth','127.0.0.29',NULL,'mobile','2026-10-26 11:45:17'),(101,'2026-10-15 14:30:24','/patient-portal#auth','127.0.0.71',NULL,'mobile','2026-10-26 11:45:17'),(102,'2026-10-15 22:40:28','/patient-portal','127.0.0.73',NULL,'tablet','2026-10-26 11:45:17'),(103,'2026-10-15 21:37:52','/patient-portal#booking','127.0.0.38',NULL,'mobile','2026-10-26 11:45:17'),(104,'2026-10-15 17:37:53','/patient-portal#booking','127.0.0.94',NULL,'mobile','2026-10-26 11:45:17'),(105,'2026-10-15 18:46:36','/patient-portal','127.0.0.15',NULL,'mobile','2026-10-26 11:45:17'),(106,'2026-10-15 22:57:18','/patient-portal','127.0.0.72',NULL,'desktop','2026-10-26 11:45:17'),(107,'2026-10-15 12:41:28','/patient-portal','127.0.0.6',NULL,'mobile','2026-10-26 11:45:17'),(108,'2026-10-15 18:04:49','/patient-portal','127.0.0.14',NULL,'mobile','2026-10-26 11:45:17'),(109,'2026-10-15 22:28:48','/patient-portal','127.0.0.92',NULL,'mobile','2026-10-26 11:45:17'),(110,'2026-10-15 10:30:23','/patient-portal#auth','127.0.0.90',NULL,'mobile','2026-10-26 11:45:17'),(111,'2026-10-15 09:51:26','/patient-portal','127.0.0.12',NULL,'mobile','2026-10-26 11:45:17'),(112,'2026-10-15 21:30:37','/patient-portal#booking','127.0.0.95',NULL,'mobile','2026-10-26 11:45:17'),(113,'2026-10-15 16:29:23','/patient-portal','127.0.0.76',NULL,'desktop','2026-10-26 11:45:17'),(114,'2026-10-15 21:57:16','/patient-portal#auth','127.0.0.60',NULL,'desktop','2026-10-26 11:45:17'),(115,'2026-10-15 20:53:48','/patient-portal#booking','127.0.0.76',NULL,'tablet','2026-10-26 11:45:17'),(116,'2026-10-15 15:48:41','/patient-portal#auth','127.0.0.2',NULL,'mobile','2026-10-26 11:45:17'),(117,'2026-10-15 14:36:55','/patient-portal#booking','127.0.0.73',NULL,'mobile','2026-10-26 11:45:17'),(118,'2026-10-15 08:46:34','/patient-portal','127.0.0.43',NULL,'tablet','2026-10-26 11:45:17'),(119,'2026-10-15 12:48:52','/patient-portal#booking','127.0.0.25',NULL,'mobile','2026-10-26 11:45:17'),(120,'2026-10-16 21:02:25','/patient-portal','127.0.0.76',NULL,'mobile','2026-10-26 11:45:17'),(121,'2026-10-16 21:52:14','/patient-portal#booking','127.0.0.94',NULL,'mobile','2026-10-26 11:45:17'),(122,'2026-10-16 10:02:24','/patient-portal','127.0.0.37',NULL,'desktop','2026-10-26 11:45:17'),(123,'2026-10-16 17:46:08','/patient-portal#booking','127.0.0.55',NULL,'mobile','2026-10-26 11:45:17'),(124,'2026-10-16 11:37:29','/patient-portal#booking','127.0.0.93',NULL,'mobile','2026-10-26 11:45:17'),(125,'2026-10-16 15:42:35','/patient-portal#auth','127.0.0.31',NULL,'mobile','2026-10-26 11:45:17'),(126,'2026-10-16 13:12:50','/patient-portal#booking','127.0.0.84',NULL,'desktop','2026-10-26 11:45:17'),(127,'2026-10-16 14:11:41','/patient-portal#booking','127.0.0.86',NULL,'mobile','2026-10-26 11:45:17'),(128,'2026-10-16 21:38:55','/patient-portal','127.0.0.91',NULL,'tablet','2026-10-26 11:45:17'),(129,'2026-10-16 10:45:57','/patient-portal#booking','127.0.0.94',NULL,'desktop','2026-10-26 11:45:17'),(130,'2026-10-16 18:10:50','/patient-portal#auth','127.0.0.80',NULL,'mobile','2026-10-26 11:45:17'),(131,'2026-10-16 12:20:51','/patient-portal#auth','127.0.0.19',NULL,'tablet','2026-10-26 11:45:17'),(132,'2026-10-16 11:29:39','/patient-portal#booking','127.0.0.7',NULL,'tablet','2026-10-26 11:45:17'),(133,'2026-10-16 20:17:40','/patient-portal','127.0.0.8',NULL,'mobile','2026-10-26 11:45:17'),(134,'2026-10-16 18:42:28','/patient-portal','127.0.0.93',NULL,'desktop','2026-10-26 11:45:17'),(135,'2026-10-16 19:50:59','/patient-portal#auth','127.0.0.5',NULL,'desktop','2026-10-26 11:45:17'),(136,'2026-10-16 12:00:00','/patient-portal#auth','127.0.0.1',NULL,'tablet','2026-10-26 11:45:17'),(137,'2026-10-16 14:24:30','/patient-portal#booking','127.0.0.69',NULL,'tablet','2026-10-26 11:45:17'),(138,'2026-10-16 14:50:08','/patient-portal#auth','127.0.0.48',NULL,'mobile','2026-10-26 11:45:17'),(139,'2026-10-16 15:35:15','/patient-portal#booking','127.0.0.76',NULL,'tablet','2026-10-26 11:45:17'),(140,'2026-10-16 21:03:49','/patient-portal#auth','127.0.0.16',NULL,'mobile','2026-10-26 11:45:17'),(141,'2026-10-17 11:26:36','/patient-portal#auth','127.0.0.42',NULL,'tablet','2026-10-26 11:45:17'),(142,'2026-10-17 14:57:27','/patient-portal','127.0.0.14',NULL,'desktop','2026-10-26 11:45:17'),(143,'2026-10-17 08:59:20','/patient-portal#auth','127.0.0.77',NULL,'mobile','2026-10-26 11:45:17'),(144,'2026-10-17 15:35:55','/patient-portal#booking','127.0.0.19',NULL,'desktop','2026-10-26 11:45:17'),(145,'2026-10-17 11:47:45','/patient-portal#auth','127.0.0.27',NULL,'mobile','2026-10-26 11:45:17'),(146,'2026-10-17 11:29:13','/patient-portal','127.0.0.43',NULL,'desktop','2026-10-26 11:45:17'),(147,'2026-10-17 11:51:55','/patient-portal#booking','127.0.0.90',NULL,'tablet','2026-10-26 11:45:17'),(148,'2026-10-17 14:32:16','/patient-portal','127.0.0.18',NULL,'mobile','2026-10-26 11:45:17'),(149,'2026-10-17 15:23:39','/patient-portal#booking','127.0.0.92',NULL,'tablet','2026-10-26 11:45:17'),(150,'2026-10-17 08:14:54','/patient-portal#booking','127.0.0.100',NULL,'mobile','2026-10-26 11:45:17'),(151,'2026-10-17 21:41:58','/patient-portal','127.0.0.27',NULL,'tablet','2026-10-26 11:45:17'),(152,'2026-10-17 11:21:30','/patient-portal#booking','127.0.0.25',NULL,'tablet','2026-10-26 11:45:17'),(153,'2026-10-17 19:47:00','/patient-portal','127.0.0.15',NULL,'desktop','2026-10-26 11:45:17'),(154,'2026-10-18 22:33:00','/patient-portal#auth','127.0.0.64',NULL,'desktop','2026-10-26 11:45:17'),(155,'2026-10-18 19:20:47','/patient-portal#booking','127.0.0.7',NULL,'mobile','2026-10-26 11:45:17'),(156,'2026-10-18 13:58:05','/patient-portal#auth','127.0.0.65',NULL,'mobile','2026-10-26 11:45:17'),(157,'2026-10-18 17:45:22','/patient-portal#auth','127.0.0.4',NULL,'desktop','2026-10-26 11:45:17'),(158,'2026-10-18 10:31:46','/patient-portal','127.0.0.17',NULL,'desktop','2026-10-26 11:45:17'),(159,'2026-10-18 12:51:27','/patient-portal#booking','127.0.0.46',NULL,'desktop','2026-10-26 11:45:17'),(160,'2026-10-18 10:35:37','/patient-portal#booking','127.0.0.41',NULL,'desktop','2026-10-26 11:45:17'),(161,'2026-10-18 12:49:30','/patient-portal#auth','127.0.0.36',NULL,'desktop','2026-10-26 11:45:17'),(162,'2026-10-18 10:12:32','/patient-portal#auth','127.0.0.97',NULL,'mobile','2026-10-26 11:45:17'),(163,'2026-10-18 15:02:05','/patient-portal#auth','127.0.0.4',NULL,'mobile','2026-10-26 11:45:17'),(164,'2026-10-18 17:47:07','/patient-portal','127.0.0.61',NULL,'tablet','2026-10-26 11:45:17'),(165,'2026-10-18 20:04:24','/patient-portal#booking','127.0.0.84',NULL,'desktop','2026-10-26 11:45:17'),(166,'2026-10-19 19:46:26','/patient-portal','127.0.0.44',NULL,'mobile','2026-10-26 11:45:17'),(167,'2026-10-19 12:54:34','/patient-portal','127.0.0.51',NULL,'tablet','2026-10-26 11:45:17'),(168,'2026-10-19 13:27:42','/patient-portal#booking','127.0.0.13',NULL,'tablet','2026-10-26 11:45:17'),(169,'2026-10-19 12:00:11','/patient-portal#auth','127.0.0.9',NULL,'mobile','2026-10-26 11:45:17'),(170,'2026-10-19 13:47:56','/patient-portal#auth','127.0.0.10',NULL,'mobile','2026-10-26 11:45:17'),(171,'2026-10-19 08:49:19','/patient-portal#auth','127.0.0.75',NULL,'mobile','2026-10-26 11:45:17'),(172,'2026-10-19 12:33:52','/patient-portal','127.0.0.2',NULL,'desktop','2026-10-26 11:45:17'),(173,'2026-10-19 14:44:24','/patient-portal#auth','127.0.0.76',NULL,'mobile','2026-10-26 11:45:17'),(174,'2026-10-19 22:51:59','/patient-portal#auth','127.0.0.79',NULL,'tablet','2026-10-26 11:45:17'),(175,'2026-10-19 11:42:05','/patient-portal#auth','127.0.0.46',NULL,'desktop','2026-10-26 11:45:17'),(176,'2026-10-19 10:57:17','/patient-portal#booking','127.0.0.9',NULL,'tablet','2026-10-26 11:45:17'),(177,'2026-10-19 10:34:58','/patient-portal','127.0.0.30',NULL,'mobile','2026-10-26 11:45:17'),(178,'2026-10-19 11:23:51','/patient-portal#booking','127.0.0.48',NULL,'mobile','2026-10-26 11:45:17'),(179,'2026-10-19 20:59:23','/patient-portal#booking','127.0.0.42',NULL,'tablet','2026-10-26 11:45:17'),(180,'2026-10-19 20:25:52','/patient-portal#booking','127.0.0.30',NULL,'tablet','2026-10-26 11:45:17'),(181,'2026-10-19 08:00:30','/patient-portal','127.0.0.74',NULL,'mobile','2026-10-26 11:45:17'),(182,'2026-10-19 10:05:29','/patient-portal#booking','127.0.0.37',NULL,'desktop','2026-10-26 11:45:17'),(183,'2026-10-19 16:52:25','/patient-portal#auth','127.0.0.71',NULL,'mobile','2026-10-26 11:45:17'),(184,'2026-10-19 09:31:39','/patient-portal','127.0.0.34',NULL,'mobile','2026-10-26 11:45:17'),(185,'2026-10-20 09:24:58','/patient-portal','127.0.0.73',NULL,'tablet','2026-10-26 11:45:17'),(186,'2026-10-20 18:27:49','/patient-portal#auth','127.0.0.26',NULL,'mobile','2026-10-26 11:45:17'),(187,'2026-10-20 22:37:57','/patient-portal#booking','127.0.0.54',NULL,'mobile','2026-10-26 11:45:17'),(188,'2026-10-20 15:22:28','/patient-portal#auth','127.0.0.20',NULL,'desktop','2026-10-26 11:45:17'),(189,'2026-10-20 15:43:25','/patient-portal','127.0.0.29',NULL,'tablet','2026-10-26 11:45:17'),(190,'2026-10-20 21:54:58','/patient-portal#auth','127.0.0.21',NULL,'tablet','2026-10-26 11:45:17'),(191,'2026-10-20 10:23:49','/patient-portal#auth','127.0.0.27',NULL,'mobile','2026-10-26 11:45:17'),(192,'2026-10-20 13:18:59','/patient-portal#booking','127.0.0.72',NULL,'tablet','2026-10-26 11:45:17'),(193,'2026-10-20 14:18:43','/patient-portal#auth','127.0.0.55',NULL,'mobile','2026-10-26 11:45:17'),(194,'2026-10-20 21:23:43','/patient-portal#booking','127.0.0.52',NULL,'mobile','2026-10-26 11:45:17'),(195,'2026-10-20 09:58:58','/patient-portal','127.0.0.81',NULL,'mobile','2026-10-26 11:45:17'),(196,'2026-10-20 08:23:10','/patient-portal#auth','127.0.0.96',NULL,'mobile','2026-10-26 11:45:17'),(197,'2026-10-20 08:24:23','/patient-portal','127.0.0.11',NULL,'mobile','2026-10-26 11:45:17'),(198,'2026-10-20 13:06:26','/patient-portal#auth','127.0.0.70',NULL,'mobile','2026-10-26 11:45:17'),(199,'2026-10-20 12:03:31','/patient-portal','127.0.0.84',NULL,'mobile','2026-10-26 11:45:17'),(200,'2026-10-20 10:03:55','/patient-portal','127.0.0.15',NULL,'desktop','2026-10-26 11:45:17'),(201,'2026-10-20 13:28:05','/patient-portal#booking','127.0.0.34',NULL,'mobile','2026-10-26 11:45:17'),(202,'2026-10-20 16:00:55','/patient-portal','127.0.0.73',NULL,'mobile','2026-10-26 11:45:17'),(203,'2026-10-20 09:43:22','/patient-portal','127.0.0.15',NULL,'mobile','2026-10-26 11:45:17'),(204,'2026-10-20 13:21:11','/patient-portal#auth','127.0.0.37',NULL,'mobile','2026-10-26 11:45:17'),(205,'2026-10-20 10:37:44','/patient-portal#auth','127.0.0.35',NULL,'mobile','2026-10-26 11:45:17'),(206,'2026-10-20 09:24:54','/patient-portal#booking','127.0.0.28',NULL,'desktop','2026-10-26 11:45:17'),(207,'2026-10-20 15:33:45','/patient-portal#auth','127.0.0.40',NULL,'mobile','2026-10-26 11:45:17'),(208,'2026-10-20 20:16:41','/patient-portal','127.0.0.87',NULL,'desktop','2026-10-26 11:45:17'),(209,'2026-10-20 20:35:36','/patient-portal','127.0.0.14',NULL,'desktop','2026-10-26 11:45:17'),(210,'2026-10-20 18:52:46','/patient-portal#auth','127.0.0.71',NULL,'mobile','2026-10-26 11:45:17'),(211,'2026-10-20 17:57:52','/patient-portal','127.0.0.82',NULL,'mobile','2026-10-26 11:45:17'),(212,'2026-10-20 09:55:26','/patient-portal#auth','127.0.0.74',NULL,'desktop','2026-10-26 11:45:17'),(213,'2026-10-20 19:07:53','/patient-portal','127.0.0.49',NULL,'tablet','2026-10-26 11:45:17'),(214,'2026-10-20 11:01:36','/patient-portal#auth','127.0.0.86',NULL,'desktop','2026-10-26 11:45:17'),(215,'2026-10-20 15:27:39','/patient-portal','127.0.0.51',NULL,'mobile','2026-10-26 11:45:17'),(216,'2026-10-20 21:29:02','/patient-portal#auth','127.0.0.77',NULL,'mobile','2026-10-26 11:45:17'),(217,'2026-10-20 11:03:39','/patient-portal#auth','127.0.0.96',NULL,'mobile','2026-10-26 11:45:17'),(218,'2026-10-20 19:23:48','/patient-portal#auth','127.0.0.28',NULL,'tablet','2026-10-26 11:45:17'),(219,'2026-10-20 15:02:27','/patient-portal','127.0.0.54',NULL,'mobile','2026-10-26 11:45:17'),(220,'2026-10-20 14:42:47','/patient-portal#auth','127.0.0.6',NULL,'desktop','2026-10-26 11:45:17'),(221,'2026-10-20 13:21:12','/patient-portal#auth','127.0.0.76',NULL,'mobile','2026-10-26 11:45:17'),(222,'2026-10-20 21:32:39','/patient-portal#auth','127.0.0.13',NULL,'desktop','2026-10-26 11:45:17'),(223,'2026-10-21 11:49:02','/patient-portal#booking','127.0.0.100',NULL,'tablet','2026-10-26 11:45:17'),(224,'2026-10-21 15:40:37','/patient-portal#booking','127.0.0.4',NULL,'desktop','2026-10-26 11:45:17'),(225,'2026-10-21 16:53:00','/patient-portal#auth','127.0.0.30',NULL,'mobile','2026-10-26 11:45:17'),(226,'2026-10-21 18:24:15','/patient-portal','127.0.0.63',NULL,'mobile','2026-10-26 11:45:17'),(227,'2026-10-21 08:08:26','/patient-portal#auth','127.0.0.98',NULL,'mobile','2026-10-26 11:45:17'),(228,'2026-10-21 15:47:42','/patient-portal#booking','127.0.0.69',NULL,'mobile','2026-10-26 11:45:17'),(229,'2026-10-21 13:47:28','/patient-portal#booking','127.0.0.60',NULL,'mobile','2026-10-26 11:45:17'),(230,'2026-10-21 08:12:22','/patient-portal#auth','127.0.0.76',NULL,'mobile','2026-10-26 11:45:17'),(231,'2026-10-21 13:18:25','/patient-portal#booking','127.0.0.38',NULL,'tablet','2026-10-26 11:45:17'),(232,'2026-10-21 10:50:16','/patient-portal#booking','127.0.0.73',NULL,'tablet','2026-10-26 11:45:17'),(233,'2026-10-21 21:09:47','/patient-portal#auth','127.0.0.40',NULL,'tablet','2026-10-26 11:45:17'),(234,'2026-10-21 08:54:01','/patient-portal#auth','127.0.0.51',NULL,'desktop','2026-10-26 11:45:17'),(235,'2026-10-22 20:58:14','/patient-portal#booking','127.0.0.17',NULL,'mobile','2026-10-26 11:45:17'),(236,'2026-10-22 10:50:06','/patient-portal#auth','127.0.0.83',NULL,'tablet','2026-10-26 11:45:17'),(237,'2026-10-22 21:50:07','/patient-portal#booking','127.0.0.6',NULL,'tablet','2026-10-26 11:45:17'),(238,'2026-10-22 17:13:15','/patient-portal','127.0.0.96',NULL,'tablet','2026-10-26 11:45:17'),(239,'2026-10-22 10:36:42','/patient-portal','127.0.0.28',NULL,'tablet','2026-10-26 11:45:17'),(240,'2026-10-22 20:49:25','/patient-portal','127.0.0.45',NULL,'desktop','2026-10-26 11:45:17'),(241,'2026-10-22 15:52:12','/patient-portal','127.0.0.50',NULL,'desktop','2026-10-26 11:45:17'),(242,'2026-10-22 08:08:24','/patient-portal#auth','127.0.0.55',NULL,'tablet','2026-10-26 11:45:17'),(243,'2026-10-22 13:12:20','/patient-portal','127.0.0.17',NULL,'mobile','2026-10-26 11:45:17'),(244,'2026-10-22 21:42:40','/patient-portal#booking','127.0.0.89',NULL,'mobile','2026-10-26 11:45:17'),(245,'2026-10-22 22:04:33','/patient-portal','127.0.0.77',NULL,'desktop','2026-10-26 11:45:17'),(246,'2026-10-22 11:24:11','/patient-portal#booking','127.0.0.72',NULL,'mobile','2026-10-26 11:45:17'),(247,'2026-10-22 21:21:58','/patient-portal#auth','127.0.0.22',NULL,'tablet','2026-10-26 11:45:17'),(248,'2026-10-22 20:58:56','/patient-portal#auth','127.0.0.80',NULL,'tablet','2026-10-26 11:45:17'),(249,'2026-10-22 20:32:15','/patient-portal','127.0.0.24',NULL,'mobile','2026-10-26 11:45:17'),(250,'2026-10-22 13:08:54','/patient-portal#auth','127.0.0.75',NULL,'mobile','2026-10-26 11:45:17'),(251,'2026-10-22 09:18:03','/patient-portal#booking','127.0.0.72',NULL,'tablet','2026-10-26 11:45:17'),(252,'2026-10-22 08:55:16','/patient-portal','127.0.0.15',NULL,'mobile','2026-10-26 11:45:17'),(253,'2026-10-22 17:36:59','/patient-portal#auth','127.0.0.30',NULL,'desktop','2026-10-26 11:45:17'),(254,'2026-10-22 12:21:44','/patient-portal#auth','127.0.0.60',NULL,'mobile','2026-10-26 11:45:17'),(255,'2026-10-22 15:04:24','/patient-portal#booking','127.0.0.9',NULL,'mobile','2026-10-26 11:45:17'),(256,'2026-10-22 15:20:27','/patient-portal#auth','127.0.0.13',NULL,'mobile','2026-10-26 11:45:17'),(257,'2026-10-22 19:25:17','/patient-portal#auth','127.0.0.3',NULL,'mobile','2026-10-26 11:45:17'),(258,'2026-10-22 13:05:52','/patient-portal','127.0.0.83',NULL,'mobile','2026-10-26 11:45:17'),(259,'2026-10-22 21:48:34','/patient-portal#auth','127.0.0.24',NULL,'tablet','2026-10-26 11:45:17'),(260,'2026-10-22 09:28:10','/patient-portal#booking','127.0.0.18',NULL,'mobile','2026-10-26 11:45:17'),(261,'2026-10-22 22:21:38','/patient-portal','127.0.0.99',NULL,'mobile','2026-10-26 11:45:17'),(262,'2026-10-23 08:46:22','/patient-portal','127.0.0.34',NULL,'mobile','2026-10-26 11:45:17'),(263,'2026-10-23 22:03:02','/patient-portal','127.0.0.7',NULL,'mobile','2026-10-26 11:45:17'),(264,'2026-10-23 20:26:07','/patient-portal#auth','127.0.0.49',NULL,'desktop','2026-10-26 11:45:17'),(265,'2026-10-23 09:28:14','/patient-portal','127.0.0.84',NULL,'tablet','2026-10-26 11:45:17'),(266,'2026-10-23 19:39:52','/patient-portal#booking','127.0.0.54',NULL,'tablet','2026-10-26 11:45:17'),(267,'2026-10-23 10:19:25','/patient-portal#booking','127.0.0.11',NULL,'mobile','2026-10-26 11:45:17'),(268,'2026-10-23 22:38:59','/patient-portal','127.0.0.4',NULL,'mobile','2026-10-26 11:45:17'),(269,'2026-10-23 19:49:57','/patient-portal#booking','127.0.0.12',NULL,'tablet','2026-10-26 11:45:17'),(270,'2026-10-23 21:12:58','/patient-portal#booking','127.0.0.48',NULL,'mobile','2026-10-26 11:45:17'),(271,'2026-10-23 13:30:28','/patient-portal','127.0.0.37',NULL,'mobile','2026-10-26 11:45:17'),(272,'2026-10-23 15:18:49','/patient-portal#auth','127.0.0.85',NULL,'mobile','2026-10-26 11:45:17'),(273,'2026-10-23 10:00:32','/patient-portal','127.0.0.92',NULL,'mobile','2026-10-26 11:45:17'),(274,'2026-10-23 20:08:06','/patient-portal#auth','127.0.0.11',NULL,'mobile','2026-10-26 11:45:17'),(275,'2026-10-23 09:41:07','/patient-portal#booking','127.0.0.60',NULL,'tablet','2026-10-26 11:45:17'),(276,'2026-10-23 09:32:12','/patient-portal#auth','127.0.0.31',NULL,'mobile','2026-10-26 11:45:17'),(277,'2026-10-23 14:03:38','/patient-portal#auth','127.0.0.54',NULL,'tablet','2026-10-26 11:45:17'),(278,'2026-10-23 19:39:08','/patient-portal','127.0.0.72',NULL,'desktop','2026-10-26 11:45:17'),(279,'2026-10-23 18:26:06','/patient-portal#auth','127.0.0.22',NULL,'mobile','2026-10-26 11:45:17'),(280,'2026-10-23 18:46:54','/patient-portal#auth','127.0.0.88',NULL,'mobile','2026-10-26 11:45:17'),(281,'2026-10-23 16:55:23','/patient-portal#auth','127.0.0.74',NULL,'desktop','2026-10-26 11:45:17'),(282,'2026-10-23 10:13:05','/patient-portal','127.0.0.79',NULL,'mobile','2026-10-26 11:45:17'),(283,'2026-10-23 10:21:43','/patient-portal#auth','127.0.0.81',NULL,'desktop','2026-10-26 11:45:17'),(284,'2026-10-23 19:55:39','/patient-portal#auth','127.0.0.64',NULL,'tablet','2026-10-26 11:45:17'),(285,'2026-10-23 16:53:53','/patient-portal','127.0.0.55',NULL,'tablet','2026-10-26 11:45:17'),(286,'2026-10-23 16:04:15','/patient-portal','127.0.0.86',NULL,'mobile','2026-10-26 11:45:17'),(287,'2026-10-23 14:37:41','/patient-portal','127.0.0.68',NULL,'mobile','2026-10-26 11:45:17'),(288,'2026-10-23 08:54:23','/patient-portal#auth','127.0.0.1',NULL,'desktop','2026-10-26 11:45:17'),(289,'2026-10-23 11:27:47','/patient-portal#booking','127.0.0.89',NULL,'mobile','2026-10-26 11:45:17'),(290,'2026-10-23 14:40:03','/patient-portal#booking','127.0.0.71',NULL,'mobile','2026-10-26 11:45:17'),(291,'2026-10-23 18:18:21','/patient-portal#booking','127.0.0.95',NULL,'mobile','2026-10-26 11:45:17'),(292,'2026-10-23 20:53:46','/patient-portal#booking','127.0.0.40',NULL,'mobile','2026-10-26 11:45:17'),(293,'2026-10-23 20:05:31','/patient-portal#booking','127.0.0.26',NULL,'tablet','2026-10-26 11:45:17'),(294,'2026-10-23 21:18:47','/patient-portal','127.0.0.33',NULL,'mobile','2026-10-26 11:45:17'),(295,'2026-10-23 11:56:18','/patient-portal','127.0.0.66',NULL,'mobile','2026-10-26 11:45:17'),(296,'2026-10-23 17:18:31','/patient-portal','127.0.0.66',NULL,'mobile','2026-10-26 11:45:17'),(297,'2026-10-23 21:30:10','/patient-portal#booking','127.0.0.58',NULL,'mobile','2026-10-26 11:45:17'),(298,'2026-10-23 08:44:35','/patient-portal','127.0.0.95',NULL,'mobile','2026-10-26 11:45:17'),(299,'2026-10-24 19:12:23','/patient-portal#auth','127.0.0.15',NULL,'desktop','2026-10-26 11:45:17'),(300,'2026-10-24 17:01:40','/patient-portal#auth','127.0.0.67',NULL,'tablet','2026-10-26 11:45:17'),(301,'2026-10-24 16:34:07','/patient-portal','127.0.0.64',NULL,'mobile','2026-10-26 11:45:17'),(302,'2026-10-24 22:34:37','/patient-portal#auth','127.0.0.92',NULL,'tablet','2026-10-26 11:45:17'),(303,'2026-10-24 13:17:29','/patient-portal','127.0.0.35',NULL,'desktop','2026-10-26 11:45:17'),(304,'2026-10-24 16:13:16','/patient-portal#booking','127.0.0.38',NULL,'tablet','2026-10-26 11:45:17'),(305,'2026-10-24 20:11:50','/patient-portal','127.0.0.19',NULL,'desktop','2026-10-26 11:45:17'),(306,'2026-10-24 18:59:59','/patient-portal#booking','127.0.0.38',NULL,'tablet','2026-10-26 11:45:17'),(307,'2026-10-24 08:50:31','/patient-portal#booking','127.0.0.93',NULL,'mobile','2026-10-26 11:45:17'),(308,'2026-10-24 09:29:31','/patient-portal','127.0.0.60',NULL,'mobile','2026-10-26 11:45:17'),(309,'2026-10-24 21:42:51','/patient-portal#booking','127.0.0.7',NULL,'mobile','2026-10-26 11:45:17'),(310,'2026-10-24 22:23:17','/patient-portal#auth','127.0.0.8',NULL,'mobile','2026-10-26 11:45:17'),(311,'2026-10-24 19:56:41','/patient-portal#auth','127.0.0.34',NULL,'mobile','2026-10-26 11:45:17'),(312,'2026-10-24 17:16:36','/patient-portal','127.0.0.76',NULL,'tablet','2026-10-26 11:45:17'),(313,'2026-10-24 13:14:57','/patient-portal','127.0.0.26',NULL,'mobile','2026-10-26 11:45:17'),(314,'2026-10-24 22:19:29','/patient-portal#auth','127.0.0.35',NULL,'mobile','2026-10-26 11:45:17'),(315,'2026-10-24 18:35:28','/patient-portal','127.0.0.88',NULL,'mobile','2026-10-26 11:45:17'),(316,'2026-10-25 08:47:59','/patient-portal#booking','127.0.0.65',NULL,'tablet','2026-10-26 11:45:17'),(317,'2026-10-25 15:47:25','/patient-portal','127.0.0.74',NULL,'mobile','2026-10-26 11:45:17'),(318,'2026-10-25 22:09:45','/patient-portal','127.0.0.71',NULL,'mobile','2026-10-26 11:45:17'),(319,'2026-10-25 15:21:21','/patient-portal#booking','127.0.0.99',NULL,'tablet','2026-10-26 11:45:17'),(320,'2026-10-25 14:01:45','/patient-portal#auth','127.0.0.4',NULL,'mobile','2026-10-26 11:45:17'),(321,'2026-10-25 16:35:15','/patient-portal#booking','127.0.0.14',NULL,'tablet','2026-10-26 11:45:17'),(322,'2026-10-25 09:33:59','/patient-portal','127.0.0.24',NULL,'desktop','2026-10-26 11:45:17'),(323,'2026-10-25 17:33:20','/patient-portal#booking','127.0.0.24',NULL,'desktop','2026-10-26 11:45:17'),(324,'2026-10-25 14:12:44','/patient-portal#auth','127.0.0.53',NULL,'tablet','2026-10-26 11:45:17'),(325,'2026-10-25 21:41:17','/patient-portal#auth','127.0.0.33',NULL,'mobile','2026-10-26 11:45:17'),(326,'2026-10-25 10:48:28','/patient-portal#booking','127.0.0.39',NULL,'mobile','2026-10-26 11:45:17'),(327,'2026-10-25 10:12:15','/patient-portal','127.0.0.34',NULL,'tablet','2026-10-26 11:45:17'),(328,'2026-10-25 20:19:23','/patient-portal','127.0.0.59',NULL,'mobile','2026-10-26 11:45:17'),(329,'2026-10-25 08:18:22','/patient-portal#booking','127.0.0.88',NULL,'tablet','2026-10-26 11:45:17'),(330,'2026-10-25 12:26:39','/patient-portal','127.0.0.27',NULL,'desktop','2026-10-26 11:45:17'),(331,'2026-10-25 21:11:04','/patient-portal','127.0.0.31',NULL,'tablet','2026-10-26 11:45:17'),(332,'2026-10-25 10:33:34','/patient-portal','127.0.0.46',NULL,'mobile','2026-10-26 11:45:17'),(333,'2026-10-25 21:13:24','/patient-portal#auth','127.0.0.31',NULL,'tablet','2026-10-26 11:45:17'),(334,'2026-10-25 17:17:46','/patient-portal#booking','127.0.0.44',NULL,'mobile','2026-10-26 11:45:17'),(335,'2026-10-25 08:35:09','/patient-portal#auth','127.0.0.30',NULL,'desktop','2026-10-26 11:45:17'),(336,'2026-10-25 13:20:23','/patient-portal','127.0.0.41',NULL,'mobile','2026-10-26 11:45:17'),(337,'2026-10-25 13:50:02','/patient-portal#auth','127.0.0.99',NULL,'mobile','2026-10-26 11:45:17'),(338,'2026-10-25 16:16:04','/patient-portal','127.0.0.96',NULL,'desktop','2026-10-26 11:45:17'),(339,'2026-10-25 11:27:52','/patient-portal#auth','127.0.0.2',NULL,'desktop','2026-10-26 11:45:17'),(340,'2026-10-25 12:49:57','/patient-portal#booking','127.0.0.29',NULL,'desktop','2026-10-26 11:45:17'),(341,'2026-10-25 16:09:30','/patient-portal','127.0.0.89',NULL,'desktop','2026-10-26 11:45:17'),(342,'2026-10-25 12:00:16','/patient-portal#booking','127.0.0.95',NULL,'mobile','2026-10-26 11:45:17'),(343,'2026-10-25 15:54:21','/patient-portal#auth','127.0.0.7',NULL,'mobile','2026-10-26 11:45:17'),(344,'2026-10-25 14:30:38','/patient-portal#booking','127.0.0.16',NULL,'mobile','2026-10-26 11:45:17'),(345,'2026-10-25 19:44:43','/patient-portal#booking','127.0.0.94',NULL,'mobile','2026-10-26 11:45:17'),(346,'2026-10-25 19:44:45','/patient-portal#auth','127.0.0.1',NULL,'mobile','2026-10-26 11:45:17'),(347,'2026-10-25 13:47:13','/patient-portal#auth','127.0.0.46',NULL,'mobile','2026-10-26 11:45:17'),(348,'2026-10-25 09:36:09','/patient-portal','127.0.0.20',NULL,'mobile','2026-10-26 11:45:17'),(349,'2026-10-25 12:09:00','/patient-portal#booking','127.0.0.12',NULL,'mobile','2026-10-26 11:45:17'),(350,'2026-10-25 16:13:40','/patient-portal','127.0.0.79',NULL,'desktop','2026-10-26 11:45:17'),(351,'2026-10-25 16:31:10','/patient-portal','127.0.0.39',NULL,'mobile','2026-10-26 11:45:17'),(352,'2026-10-25 14:07:46','/patient-portal#booking','127.0.0.6',NULL,'mobile','2026-10-26 11:45:17'),(353,'2026-10-26 18:27:27','/patient-portal#auth','127.0.0.86',NULL,'mobile','2026-10-26 11:45:17'),(354,'2026-10-26 16:31:54','/patient-portal','127.0.0.88',NULL,'tablet','2026-10-26 11:45:17'),(355,'2026-10-26 16:24:11','/patient-portal','127.0.0.40',NULL,'mobile','2026-10-26 11:45:17'),(356,'2026-10-26 08:05:34','/patient-portal#booking','127.0.0.37',NULL,'tablet','2026-10-26 11:45:17'),(357,'2026-10-26 12:34:23','/patient-portal#auth','127.0.0.65',NULL,'mobile','2026-10-26 11:45:17'),(358,'2026-10-26 20:51:59','/patient-portal','127.0.0.1',NULL,'mobile','2026-10-26 11:45:17'),(359,'2026-10-26 21:19:40','/patient-portal#auth','127.0.0.49',NULL,'desktop','2026-10-26 11:45:17'),(360,'2026-10-26 14:39:16','/patient-portal#auth','127.0.0.77',NULL,'desktop','2026-10-26 11:45:17'),(361,'2026-10-26 11:23:19','/patient-portal#auth','127.0.0.76',NULL,'desktop','2026-10-26 11:45:17'),(362,'2026-10-26 09:22:32','/patient-portal#auth','127.0.0.24',NULL,'desktop','2026-10-26 11:45:17'),(363,'2026-10-26 16:29:10','/patient-portal','127.0.0.33',NULL,'mobile','2026-10-26 11:45:17'),(364,'2026-10-26 22:38:13','/patient-portal#booking','127.0.0.95',NULL,'desktop','2026-10-26 11:45:17'),(365,'2026-10-26 21:06:56','/patient-portal#auth','127.0.0.93',NULL,'mobile','2026-10-26 11:45:17'),(366,'2026-10-26 13:08:07','/patient-portal','127.0.0.79',NULL,'mobile','2026-10-26 11:45:17'),(367,'2026-10-26 08:35:46','/patient-portal#booking','127.0.0.42',NULL,'desktop','2026-10-26 11:45:17'),(368,'2026-10-26 10:30:33','/patient-portal','127.0.0.87',NULL,'tablet','2026-10-26 11:45:17'),(369,'2026-10-26 08:10:07','/patient-portal#auth','127.0.0.65',NULL,'mobile','2026-10-26 11:45:17'),(370,'2026-10-26 17:20:51','/patient-portal#booking','127.0.0.72',NULL,'mobile','2026-10-26 11:45:17'),(371,'2026-10-26 12:45:24','/patient-portal','127.0.0.1','curl/8.21.0','desktop','2026-10-26 11:45:24'),(372,'2026-10-26 12:46:51','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 11:46:51'),(373,'2026-10-26 12:46:51','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 11:46:51'),(374,'2026-10-26 12:48:33','/patient-portal','127.0.0.1','curl/8.21.0','desktop','2026-10-26 11:48:33'),(375,'2026-10-26 13:16:01','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 12:16:01'),(376,'2026-10-26 13:17:04','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 12:17:04'),(377,'2026-10-26 13:17:04','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 12:17:04'),(378,'2026-10-26 13:17:52','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 12:17:52'),(379,'2026-10-26 13:29:31','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 12:29:31'),(380,'2026-10-26 13:35:13','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 12:35:13'),(381,'2026-10-26 13:35:43','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 12:35:43'),(382,'2026-10-26 13:35:44','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 12:35:44'),(383,'2026-10-26 13:43:49','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 12:43:49'),(384,'2026-10-26 13:43:49','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 12:43:49'),(385,'2026-10-26 13:46:27','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 12:46:27'),(386,'2026-10-26 13:46:33','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 12:46:33'),(387,'2026-10-26 14:11:49','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 13:11:49'),(388,'2026-10-26 14:11:50','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 13:11:50'),(389,'2026-10-26 14:11:50','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 13:11:50'),(390,'2026-10-26 14:12:33','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 13:12:33'),(391,'2026-10-26 14:12:33','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 13:12:33'),(392,'2026-10-26 14:46:18','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 13:46:18'),(393,'2026-10-26 14:46:18','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 13:46:18'),(394,'2026-10-26 14:46:18','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 13:46:18'),(395,'2026-10-26 14:46:19','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 13:46:19'),(396,'2026-10-26 15:13:40','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:13:40'),(397,'2026-10-26 15:13:40','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:13:40'),(398,'2026-10-26 15:13:40','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:13:40'),(399,'2026-10-26 15:13:40','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:13:40'),(400,'2026-10-26 15:14:15','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:14:15'),(401,'2026-10-26 15:14:15','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:14:15'),(402,'2026-10-26 15:22:26','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:22:26'),(403,'2026-10-26 15:22:26','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:22:26'),(404,'2026-10-26 15:27:52','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:27:52'),(405,'2026-10-26 15:27:52','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:27:52'),(406,'2026-10-26 15:27:53','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:27:53'),(407,'2026-10-26 15:27:53','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:27:53'),(408,'2026-10-26 15:29:25','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:29:25'),(409,'2026-10-26 15:29:25','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:29:25'),(410,'2026-10-26 15:30:29','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:30:29'),(411,'2026-10-26 15:30:29','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:30:29'),(412,'2026-10-26 15:46:11','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:46:11'),(413,'2026-10-26 15:46:11','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:46:11'),(414,'2026-10-26 15:46:11','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 14:46:11'),(415,'2026-10-26 15:46:12','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 14:46:12'),(416,'2026-10-26 16:01:06','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 15:01:06'),(417,'2026-10-26 16:01:06','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 15:01:06'),(418,'2026-10-26 16:01:46','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 15:01:46'),(419,'2026-10-26 16:01:46','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 15:01:46'),(420,'2026-10-26 16:02:09','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 15:02:09'),(421,'2026-10-26 16:02:09','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 15:02:09'),(422,'2026-10-26 16:02:30','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-26 15:02:30'),(423,'2026-10-26 16:02:30','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 15:02:30'),(424,'2026-10-26 16:16:50','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 15:16:50'),(425,'2026-10-26 16:16:50','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-26 15:16:50'),(426,'2026-10-27 10:07:07','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:07:07'),(427,'2026-10-27 10:07:07','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:07:07'),(428,'2026-10-27 10:07:22','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:07:22'),(429,'2026-10-27 10:07:22','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:07:22'),(430,'2026-10-27 10:28:10','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:28:10'),(431,'2026-10-27 10:28:20','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:28:20'),(432,'2026-10-27 10:28:36','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:28:36'),(433,'2026-10-27 10:28:58','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:28:58'),(434,'2026-10-27 10:29:14','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:29:14'),(435,'2026-10-27 10:29:22','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:29:22'),(436,'2026-10-27 10:29:38','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 09:29:38'),(437,'2026-10-27 10:55:51','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 09:55:51'),(438,'2026-10-27 11:01:28','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:01:28'),(439,'2026-10-27 11:01:28','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:01:28'),(440,'2026-10-27 11:02:00','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:02:00'),(441,'2026-10-27 11:02:00','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:02:00'),(442,'2026-10-27 11:02:26','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:02:26'),(443,'2026-10-27 11:02:26','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:02:26'),(444,'2026-10-27 11:07:29','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:07:29'),(445,'2026-10-27 11:07:29','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:07:29'),(446,'2026-10-27 11:08:25','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:08:25'),(447,'2026-10-27 11:31:09','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:31:09'),(448,'2026-10-27 11:31:09','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:31:09'),(449,'2026-10-27 11:37:42','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 10:37:42'),(450,'2026-10-27 11:43:20','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 10:43:20'),(451,'2026-10-27 11:43:20','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 10:43:20'),(452,'2026-10-27 11:43:21','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 10:43:21'),(453,'2026-10-27 12:01:31','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-27 11:01:31'),(454,'2026-10-27 12:34:25','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 11:34:25'),(455,'2026-10-27 12:34:25','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 11:34:25'),(456,'2026-10-27 12:40:21','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 11:40:21'),(457,'2026-10-27 12:40:21','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','desktop','2026-10-27 11:40:21'),(458,'2026-10-27 13:08:56','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 12:08:56'),(459,'2026-10-27 13:10:36','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 12:10:36'),(460,'2026-10-27 13:16:46','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 12:16:46'),(461,'2026-10-27 14:18:37','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 13:18:37'),(462,'2026-10-27 14:18:37','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 13:18:37'),(463,'2026-10-27 15:12:33','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 14:12:33'),(464,'2026-10-27 15:12:44','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 14:12:44'),(465,'2026-10-27 15:12:44','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 14:12:44'),(466,'2026-10-27 15:13:00','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 14:13:00'),(467,'2026-10-27 15:13:13','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 14:13:13'),(468,'2026-10-27 15:13:57','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 14:13:57'),(469,'2026-10-27 15:14:07','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36','mobile','2026-10-27 14:14:07'),(470,'2026-10-28 12:38:49','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-28 11:38:49'),(471,'2026-10-28 12:38:49','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 14; SM-F956U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-28 11:38:49'),(472,'2026-10-28 12:40:15','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-28 11:40:15'),(473,'2026-10-28 12:40:15','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-28 11:40:15'),(474,'2026-10-28 12:42:49','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 11:42:49'),(475,'2026-10-28 12:42:49','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 11:42:49'),(476,'2026-10-28 12:43:11','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 11:43:11'),(477,'2026-10-28 12:57:05','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 11:57:05'),(478,'2026-10-28 12:57:05','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 11:57:05'),(479,'2026-10-28 13:15:01','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 12:15:01'),(480,'2026-10-28 13:20:41','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 12:20:41'),(481,'2026-10-28 13:33:17','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 12:33:17'),(482,'2026-10-28 13:38:24','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 12:38:24'),(483,'2026-10-28 13:38:24','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 12:38:24'),(484,'2026-10-28 13:46:11','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 12:46:11'),(485,'2026-10-28 14:30:03','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:30:03'),(486,'2026-10-28 14:32:29','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:32:29'),(487,'2026-10-28 14:32:29','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:32:29'),(488,'2026-10-28 14:43:39','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:43:39'),(489,'2026-10-28 14:43:39','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:43:39'),(490,'2026-10-28 14:43:40','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:43:40'),(491,'2026-10-28 14:43:40','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:43:40'),(492,'2026-10-28 14:43:43','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:43:43'),(493,'2026-10-28 14:43:44','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:43:44'),(494,'2026-10-28 14:44:20','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:44:20'),(495,'2026-10-28 14:58:35','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:58:35'),(496,'2026-10-28 14:58:35','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 13:58:35'),(497,'2026-10-28 15:00:26','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-28 14:00:26'),(498,'2026-10-28 15:00:26','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-28 14:00:26'),(499,'2026-10-28 15:00:51','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 14:00:51'),(500,'2026-10-28 15:00:51','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 14:00:51'),(501,'2026-10-28 15:02:50','/patient-portal','127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','mobile','2026-10-28 14:02:50'),(502,'2026-10-29 09:16:33','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:16:33'),(503,'2026-10-29 09:16:33','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:16:33'),(504,'2026-10-29 09:29:48','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:29:48'),(505,'2026-10-29 09:29:48','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:29:48'),(506,'2026-10-29 09:39:09','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:39:09'),(507,'2026-10-29 09:39:09','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:39:09'),(508,'2026-10-29 09:39:15','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:39:15'),(509,'2026-10-29 09:39:15','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:39:15'),(510,'2026-10-29 09:50:24','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:50:24'),(511,'2026-10-29 09:50:24','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:50:24'),(512,'2026-10-29 09:52:06','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:52:06'),(513,'2026-10-29 09:52:06','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 08:52:06'),(514,'2026-10-29 10:02:24','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 09:02:24'),(515,'2026-10-29 10:02:24','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 09:02:24'),(516,'2026-10-29 10:03:19','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 09:03:19'),(517,'2026-10-29 10:03:19','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 09:03:19'),(518,'2026-10-29 10:17:15','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 09:17:15'),(519,'2026-10-29 11:03:32','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 10:03:32'),(520,'2026-10-29 11:03:32','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 10:03:32'),(521,'2026-10-29 12:13:55','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 11:13:55'),(522,'2026-10-29 12:13:55','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 11:13:55'),(523,'2026-10-29 12:51:23','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 11:51:23'),(524,'2026-10-29 12:51:23','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 11:51:23'),(525,'2026-10-29 13:04:17','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 12:04:17'),(526,'2026-10-29 13:04:18','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 12:04:18'),(527,'2026-10-29 13:11:25','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 12:11:25'),(528,'2026-10-29 13:22:38','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 12:22:38'),(529,'2026-10-29 13:28:34','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 12:28:34'),(530,'2026-10-29 13:40:23','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-29 12:40:23'),(531,'2026-10-29 13:40:23','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-29 12:40:23'),(532,'2026-10-29 13:41:35','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-29 12:41:35'),(533,'2026-10-29 13:45:16','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-29 12:45:16'),(534,'2026-10-29 13:45:16','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-29 12:45:16'),(535,'2026-10-29 14:00:58','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-29 13:00:58'),(536,'2026-10-29 14:00:58','/patient-portal','127.0.0.1','Mozilla/5.0 (Linux; Android 16; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36','mobile','2026-10-29 13:00:58'),(537,'2026-10-29 14:27:09','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 13:27:09'),(538,'2026-10-29 14:27:09','/patient-portal','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36','desktop','2026-10-29 13:27:09');
/*!40000 ALTER TABLE `site_visits` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `smtp_settings`
--

DROP TABLE IF EXISTS `smtp_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `smtp_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enabled` tinyint(1) DEFAULT 1,
  `host` varchar(255) DEFAULT 'smtp.gmail.com',
  `port` int(11) DEFAULT 587,
  `encryption` varchar(20) DEFAULT 'tls',
  `username` varchar(255) DEFAULT 'dr.belbachir@cabinet-medical.dz',
  `password` varchar(255) DEFAULT '',
  `from_name` varchar(255) DEFAULT 'Cabinet Médical Dr Belbachir',
  `reply_to` varchar(255) DEFAULT 'dr.belbachir@cabinet-medical.dz',
  `trigger_booking_confirm` tinyint(1) DEFAULT 1,
  `trigger_admin_alert` tinyint(1) DEFAULT 1,
  `trigger_reminder` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `smtp_settings`
--

LOCK TABLES `smtp_settings` WRITE;
/*!40000 ALTER TABLE `smtp_settings` DISABLE KEYS */;
INSERT INTO `smtp_settings` VALUES (1,1,'smtp.gmail.com',587,'tls','dr.belbachir@cabinet-medical.dz','secretAppKey123','Cabinet Médical Dr Belbachir','dr.belbachir@cabinet-medical.dz',1,1,1,'2026-10-26 11:29:38');
/*!40000 ALTER TABLE `smtp_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_users`
--

DROP TABLE IF EXISTS `staff_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staff_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(120) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` varchar(100) NOT NULL,
  `type` enum('doctor','secretary','admin') NOT NULL DEFAULT 'secretary',
  `status` enum('Actif','Inactif','Suspendu') NOT NULL DEFAULT 'Actif',
  `access_level` varchar(150) DEFAULT NULL,
  `permission_agenda` varchar(100) DEFAULT 'Plein accès',
  `permission_medical_records` varchar(100) DEFAULT 'Restreint',
  `permission_prescriptions` varchar(100) DEFAULT 'Aucun accès',
  `permission_billing` varchar(100) DEFAULT 'Enregistrement des règlements',
  `permission_settings` varchar(100) DEFAULT 'Lecture seule',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_users`
--

LOCK TABLES `staff_users` WRITE;
/*!40000 ALTER TABLE `staff_users` DISABLE KEYS */;
INSERT INTO `staff_users` VALUES (1,'Dr N. BELBACHIR OULD HENNIA','dr.belbachir@cabinet-medical.dz','admin','$2y$10$cLxLlg.WZDyJWd24OU0Mae8to7Vq3GfKfmL3K0/2rQTSOlsoCEtGS','01 42 68 50 10','Médecin Titulaire (Super Admin)','doctor','Actif','Médecin Titulaire (Super Admin)','Plein accès','Plein accès (Secret médical)','Édition et signature numérique','Plein accès','Plein accès','2026-10-29 10:55:47','2026-10-22 08:29:34','2026-10-29 09:55:47');
/*!40000 ALTER TABLE `staff_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ultrasound_reports`
--

DROP TABLE IF EXISTS `ultrasound_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ultrasound_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_number` varchar(50) NOT NULL,
  `consultation_id` int(11) DEFAULT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `exam_type` enum('ob1','ob2','ob3','gyn','ggt1','ggt23') NOT NULL,
  `exam_date` date NOT NULL,
  `indication` varchar(255) DEFAULT NULL,
  `ddr` date DEFAULT NULL,
  `terme_sa` varchar(50) DEFAULT NULL,
  `pregnancy_type` varchar(100) DEFAULT 'Unique',
  `bip_mm` decimal(5,2) DEFAULT NULL COMMENT 'Diamètre bipariétal (mm)',
  `pc_mm` decimal(5,2) DEFAULT NULL COMMENT 'Périmètre crânien (mm)',
  `ca_mm` decimal(5,2) DEFAULT NULL COMMENT 'Circonférence abdominale (mm)',
  `lf_mm` decimal(5,2) DEFAULT NULL COMMENT 'Longueur fémorale (mm)',
  `lcc_mm` decimal(5,2) DEFAULT NULL COMMENT 'Longueur cranio-caudale (mm)',
  `cn_mm` decimal(4,2) DEFAULT NULL COMMENT 'Clarté nucale (mm)',
  `cervelet_mm` decimal(5,2) DEFAULT NULL,
  `epf_hadlock_g` int(11) DEFAULT NULL COMMENT 'Estimation poids fœtal Hadlock (g)',
  `morphology_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Organes, cerveau, 4 cavités, membres, placenta' CHECK (json_valid(`morphology_details`)),
  `doppler_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Artères utérines, ombilicale, ACM' CHECK (json_valid(`doppler_details`)),
  `gynecology_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Utérus, endomètre, ovaires D/G, Douglas' CHECK (json_valid(`gynecology_details`)),
  `findings` text DEFAULT NULL,
  `conclusion` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `patient_name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_number` (`report_number`),
  KEY `fk_echo_consultation` (`consultation_id`),
  KEY `fk_echo_patient` (`patient_id`),
  CONSTRAINT `fk_echo_consultation` FOREIGN KEY (`consultation_id`) REFERENCES `consultations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_echo_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ultrasound_reports`
--

LOCK TABLES `ultrasound_reports` WRITE;
/*!40000 ALTER TABLE `ultrasound_reports` DISABLE KEYS */;
INSERT INTO `ultrasound_reports` VALUES (7,'CR-ECHO-2026-0004-94',12,9,'ob2','2026-10-29','Échographie Obstétricale — 2ème Trimestre',NULL,'En cours','Unique',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"ob1_nbemb\":\"1\",\"ob1_vita\":\"Positive\",\"ob1_cn_sel\":\"Normale (< 3 mm)\",\"ob1_osnasal\":\"Présent\",\"ob1_ductus\":\"Normal\",\"ob1_tropho\":\"Diffus, bien inséré\",\"ob1_uterus\":\"Normal\",\"ob1_annexes\":\"Libres\",\"ob2_vita\":\"Positive\",\"ob2_pres\":\"Céphalique\",\"ob2_crane\":\"Normal\",\"ob2_face\":\"Normale\",\"ob2_coeur\":\"4 cavités d\'aspect normal\",\"ob2_thorax\":\"Normal\",\"ob2_abdo\":\"Normal\",\"ob2_rachis\":\"Normal\",\"ob2_membres\":\"Normaux\",\"ob2_paroi\":\"Intègre\",\"ob2_placenta\":\"Postérieur\",\"ob2_la\":\"En quantité normale\",\"ob2_col\":\"Long et fermé\",\"ob3_vita\":\"Positive\",\"ob3_pres\":\"Céphalique\",\"ob3_placenta\":\"Postérieur\",\"ob3_maturite\":\"Grade I\",\"ob3_la\":\"En quantité normale\",\"ob3_dop_ombi\":\"Normal\",\"ob3_dop_acm\":\"Normal\",\"gyn_voie\":\"Sus-abdominale\",\"gyn_vessie\":\"En réplétion suffisante\",\"gyn_ut_pos\":\"Antéversé\",\"gyn_ut_cont\":\"Réguliers\",\"gyn_ut_echo\":\"Homogène\",\"gyn_myometre\":\"Normal\",\"gyn_endo_lv\":\"Centrée\",\"gyn_endo_asp\":\"Normal\",\"gyn_od_asp\":\"Normal\",\"gyn_og_asp\":\"Normal\",\"gyn_col\":\"Normal\",\"gyn_douglas\":\"Libre\",\"ggt1_chorio\":\"Bichoriale biamniotique (BCBA)\",\"ggt1_a_vita\":\"Positive\",\"ggt1_a_cn_sel\":\"Normale (< 3 mm)\",\"ggt1_a_osn\":\"Présent\",\"ggt1_b_vita\":\"Positive\",\"ggt1_b_cn_sel\":\"Normale (< 3 mm)\",\"ggt1_b_osn\":\"Présent\",\"ggt1_tropho\":\"Bien insérés\",\"ggt1_uterus\":\"Normal\",\"ggt1_annexes\":\"Libres\",\"ggt23_chorio\":\"Bichoriale biamniotique (BCBA)\",\"ggt23_a_vita\":\"Positive\",\"ggt23_a_pres\":\"Céphalique\",\"ggt23_a_pla\":\"Postérieur\",\"ggt23_a_la\":\"Normal\",\"ggt23_a_dop_o\":\"Normal\",\"ggt23_a_dop_acm\":\"Normal\",\"ggt23_b_vita\":\"Positive\",\"ggt23_b_pres\":\"Siège\",\"ggt23_b_pla\":\"Antérieur\",\"ggt23_b_la\":\"Normal\",\"ggt23_b_dop_o\":\"Normal\",\"ggt23_b_dop_acm\":\"Normal\",\"ob2_dat\":\"44\",\"autreInputs\":[]}',NULL,NULL,'Échographie T2 normale','Échographie T2 normale','2026-10-29 11:47:02','2026-10-29 11:47:02','test guedaou');
/*!40000 ALTER TABLE `ultrasound_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `v_monthly_revenue`
--

DROP TABLE IF EXISTS `v_monthly_revenue`;
/*!50001 DROP VIEW IF EXISTS `v_monthly_revenue`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_monthly_revenue` AS SELECT
 1 AS `month`,
  1 AS `method`,
  1 AS `transaction_count`,
  1 AS `total_collected` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_patient_summary`
--

DROP TABLE IF EXISTS `v_patient_summary`;
/*!50001 DROP VIEW IF EXISTS `v_patient_summary`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_patient_summary` AS SELECT
 1 AS `id`,
  1 AS `file_number`,
  1 AS `full_name`,
  1 AS `gender`,
  1 AS `dob`,
  1 AS `age`,
  1 AS `phone`,
  1 AS `email`,
  1 AS `secu_number`,
  1 AS `blood_group`,
  1 AS `status`,
  1 AS `total_consultations`,
  1 AS `total_prescriptions`,
  1 AS `total_invoices`,
  1 AS `total_billed`,
  1 AS `total_outstanding` */;
SET character_set_client = @saved_cs_client;

--
-- Temporary table structure for view `v_today_appointments`
--

DROP TABLE IF EXISTS `v_today_appointments`;
/*!50001 DROP VIEW IF EXISTS `v_today_appointments`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_today_appointments` AS SELECT
 1 AS `appointment_id`,
  1 AS `appointment_date`,
  1 AS `appointment_time`,
  1 AS `duration`,
  1 AS `reason`,
  1 AS `appointment_status`,
  1 AS `patient_id`,
  1 AS `file_number`,
  1 AS `patient_name`,
  1 AS `phone`,
  1 AS `gender`,
  1 AS `age` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `waiting_room`
--

DROP TABLE IF EXISTS `waiting_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `waiting_room` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) DEFAULT NULL,
  `patient_name` varchar(150) DEFAULT NULL,
  `patient_phone` varchar(50) DEFAULT NULL,
  `appointment_id` int(11) DEFAULT NULL,
  `ticket_number` int(11) DEFAULT NULL,
  `appointment_time` time DEFAULT NULL,
  `arrival_time` time NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `wait_time_minutes` int(11) DEFAULT 0,
  `status` enum('En attente','Appelé','En consultation','Terminé') NOT NULL DEFAULT 'En attente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_waiting_appointment` (`appointment_id`),
  KEY `fk_waiting_patient` (`patient_id`),
  CONSTRAINT `fk_waiting_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_waiting_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `waiting_room`
--

LOCK TABLES `waiting_room` WRITE;
/*!40000 ALTER TABLE `waiting_room` DISABLE KEYS */;
INSERT INTO `waiting_room` VALUES (10,NULL,'patient','055050',NULL,NULL,'16:00:00','11:56:20','Consultation médicale',0,'En attente','2026-10-29 10:56:20','2026-10-29 10:56:20'),(12,NULL,'mouh','06666666',11,NULL,'08:30:00','13:21:39','Consultation médicale',0,'Appelé','2026-10-29 12:21:39','2026-10-29 12:22:05'),(13,NULL,'mohamed','0555555',10,NULL,'15:30:00','15:51:58','Consultation médicale',0,'Appelé','2026-10-29 14:51:58','2026-10-29 14:52:06'),(14,NULL,'aymen','05454545',15,NULL,'16:00:00','15:53:28','Consultation médicale',0,'En attente','2026-10-29 14:53:28','2026-10-29 14:53:28'),(15,NULL,'patient n','0550505025',12,NULL,'14:00:00','15:53:31','Consultation médicale',0,'En attente','2026-10-29 14:53:31','2026-10-29 14:53:31'),(16,9,'test guedaou','0697037109',19,NULL,'09:00:00','15:53:37','Consultation gynécologique / spécialisée',0,'En attente','2026-10-29 14:53:37','2026-10-29 14:53:37');
/*!40000 ALTER TABLE `waiting_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'medcine_solution_db'
--

--
-- Final view structure for view `v_monthly_revenue`
--

/*!50001 DROP VIEW IF EXISTS `v_monthly_revenue`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */

/*!50001 VIEW `v_monthly_revenue` AS select date_format(`payments`.`payment_date`,'%Y-%m') AS `month`,`payments`.`method` AS `method`,count(0) AS `transaction_count`,sum(`payments`.`amount`) AS `total_collected` from `payments` where `payments`.`status` = 'Encaissé' group by date_format(`payments`.`payment_date`,'%Y-%m'),`payments`.`method` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_patient_summary`
--

/*!50001 DROP VIEW IF EXISTS `v_patient_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */

/*!50001 VIEW `v_patient_summary` AS select `p`.`id` AS `id`,`p`.`file_number` AS `file_number`,concat(`p`.`first_name`,' ',`p`.`last_name`) AS `full_name`,`p`.`gender` AS `gender`,`p`.`dob` AS `dob`,`p`.`age` AS `age`,`p`.`phone` AS `phone`,`p`.`email` AS `email`,`p`.`secu_number` AS `secu_number`,`p`.`blood_group` AS `blood_group`,`p`.`status` AS `status`,count(distinct `c`.`id`) AS `total_consultations`,count(distinct `pr`.`id`) AS `total_prescriptions`,count(distinct `i`.`id`) AS `total_invoices`,coalesce(sum(`i`.`amount`),0) AS `total_billed`,coalesce(sum(`i`.`patient_remaining`),0) AS `total_outstanding` from (((`patients` `p` left join `consultations` `c` on(`c`.`patient_id` = `p`.`id`)) left join `prescriptions` `pr` on(`pr`.`patient_id` = `p`.`id`)) left join `invoices` `i` on(`i`.`patient_id` = `p`.`id`)) group by `p`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_today_appointments`
--

/*!50001 DROP VIEW IF EXISTS `v_today_appointments`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */

/*!50001 VIEW `v_today_appointments` AS select `a`.`id` AS `appointment_id`,`a`.`appointment_date` AS `appointment_date`,`a`.`appointment_time` AS `appointment_time`,`a`.`duration` AS `duration`,`a`.`reason` AS `reason`,`a`.`status` AS `appointment_status`,`p`.`id` AS `patient_id`,`p`.`file_number` AS `file_number`,concat(`p`.`first_name`,' ',`p`.`last_name`) AS `patient_name`,`p`.`phone` AS `phone`,`p`.`gender` AS `gender`,`p`.`age` AS `age` from (`appointments` `a` join `patients` `p` on(`p`.`id` = `a`.`patient_id`)) where `a`.`appointment_date` = curdate() order by `a`.`appointment_time` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-29 16:17:47

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE=@OLD_SQL_MODE;
-- FIN DE L'IMPORTATION
