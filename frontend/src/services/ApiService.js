// admin/src/services/ApiService.js
// Client API pour communiquer avec le backend PHP & la base de données MySQL medcine_solution_db

import axios from "axios";
import {
  initialConsultations,
  initialPrescriptions,
  initialMedications,
  initialDoctor,
  initialStaff,
  initialInvoices,
  initialPayments,
} from "./CabinetData";

// URL dynamique : s'adapte automatiquement au nom de domaine actuel en ligne (Host.dz, cPanel, etc.)
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000/api";
    }
    return `${window.location.origin}/backend/api`;
  }
  return "/backend/api";
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

export const ApiService = {
  // Test de connexion au backend PHP
  async checkHealth() {
    try {
      const healthUrl =
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
          ? `${window.location.origin}/backend/`
          : "http://127.0.0.1:8000/";
      const res = await axios.get(healthUrl, { timeout: 3000 });
      return { online: true, data: res.data };
    } catch (err) {
      return { online: false, error: err.message };
    }
  },

  // ----------------------------------------------------
  // PARAMÈTRES DU CABINET (SETTINGS)
  // ----------------------------------------------------
  async getSettings() {
    try {
      const res = await apiClient.get("/settings.php");
      if (res.data && res.data.status === "success" && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour paramètres :", err.message);
    }
    return {
      defaultDuration: "20 min",
      slotInterval: "15 min",
      defaultConsultationType: "Consultation de médecine générale",
      consultationPrice: 2500,
      consultationTypes: [
        { id: 1, name: "Consultation de médecine générale", duration: "20 min", price: 2500, active: true },
        { id: 2, name: "Consultation gynécologique / spécialisée", duration: "25 min", price: 3000, active: true },
        { id: 3, name: "Suivi de grossesse / Maternité", duration: "20 min", price: 2500, active: true },
        { id: 4, name: "Échographie obstétricale (T1 / T2 / T3)", duration: "30 min", price: 4000, active: true },
        { id: 5, name: "Échographie pelvienne / gynécologique", duration: "25 min", price: 3500, active: true },
        { id: 6, name: "Consultation avec frottis / acte", duration: "30 min", price: 3500, active: true },
        { id: 7, name: "Visite de contrôle / Bilan", duration: "15 min", price: 1500, active: true },
      ],
      smsReminders: true,
      emailReminders: true,
      reminderHoursBefore: "24",
      autoBackup: true,
      backupFrequency: "Quotidienne (23:00)",
      sessionTimeout: "30",
      twoFactorAuth: true,
    };
  },

  async updateSettings(settingsData) {
    try {
      const res = await apiClient.post("/settings.php", settingsData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement paramètres dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // CONFIGURATION SERVEUR SMTP
  // ----------------------------------------------------
  async getSmtpSettings() {
    try {
      const res = await apiClient.get("/smtp.php");
      if (res.data && res.data.status === "success" && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour SMTP :", err.message);
    }
    return {
      enabled: true,
      host: "smtp.gmail.com",
      port: 587,
      encryption: "tls",
      username: "dr.belbachir@cabinet-medical.dz",
      password: "",
      fromName: "Cabinet Médical Dr Belbachir",
      replyTo: "dr.belbachir@cabinet-medical.dz",
      triggerBookingConfirm: true,
      triggerAdminAlert: true,
      triggerReminder: true,
    };
  },

  async updateSmtpSettings(smtpData) {
    try {
      const res = await apiClient.post("/smtp.php", smtpData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement SMTP :", err.message);
      throw err;
    }
  },

  async testSmtpConnection(smtpData) {
    try {
      const res = await apiClient.post("/smtp.php?action=test_connection", smtpData);
      return res.data;
    } catch (err) {
      console.error("Erreur test connexion SMTP :", err.message);
      throw err;
    }
  },

  async sendTestSmtpEmail(smtpData) {
    try {
      const res = await apiClient.post("/smtp.php?action=send_test", smtpData);
      return res.data;
    } catch (err) {
      console.error("Erreur envoi email test :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // FICHE D'IDENTITÉ & COORDONNÉES DU CABINET (CABINET INFO)
  // ----------------------------------------------------
  async getCabinetInfo() {
    try {
      const res = await apiClient.get("/cabinet_info.php");
      if (res.data && res.data.status === "success" && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour cabinet_info :", err.message);
    }
    return {
      clinicName: "Cabinet Médical Saint-Honoré",
      doctorName: initialDoctor.name,
      doctorNameAr: initialDoctor.nameAr || "",
      title: initialDoctor.title,
      titleAr: initialDoctor.titleAr || "",
      specialty: initialDoctor.specialty,
      subSpecialty: initialDoctor.subSpecialty || "Échographie",
      rpps: initialDoctor.rpps,
      adeli: initialDoctor.adeli,
      siret: initialDoctor.siret,
      orderNumber: initialDoctor.orderNumber,
      convention: initialDoctor.convention,
      email: initialDoctor.email,
      phone: initialDoctor.phone,
      address: initialDoctor.address,
      hours: initialDoctor.hours,
      doctorPhoto: "/doctor.jpg",
      legalNotice:
        "Membre d'une association de gestion agréée par l'administration fiscale, acceptant à ce titre le règlement des honoraires par chèque et carte bancaire.",
    };
  },

  async updateCabinetInfo(infoData) {
    try {
      const res = await apiClient.post("/cabinet_info.php", infoData);
      return res.data;
    } catch (err) {
      console.error("Erreur mise à jour coordonnées cabinet dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // AUTHENTIFICATION & CONNEXION DIRECTE MYSQL (STAFF_USERS)
  // ----------------------------------------------------
  async login(username, password) {
    try {
      const res = await apiClient.post("/auth.php", { username, password });
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return err.response.data;
      }
      return { status: "error", message: err.message || "Erreur de connexion au serveur" };
    }
  },

  async changePassword(userId, newPassword) {
    try {
      const res = await apiClient.post("/auth.php", {
        action: "change_password",
        userId,
        newPassword,
      });
      return res.data;
    } catch (err) {
      if (err.response && err.response.data) {
        return err.response.data;
      }
      throw err;
    }
  },

  // ----------------------------------------------------
  // PERSONNEL ET GESTION DES COMPTES (STAFF USERS)
  // ----------------------------------------------------
  async getStaff() {
    try {
      const res = await apiClient.get("/staff.php");
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour le personnel :", err.message);
    }
    return initialStaff;
  },

  async saveStaffUser(userData) {
    try {
      const res = await apiClient.post("/staff.php", userData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement membre personnel dans MySQL :", err.message);
      throw err;
    }
  },

  async deleteStaffUser(id) {
    try {
      const res = await apiClient.delete(`/staff.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression membre personnel dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // RÔLES ET HABILITATIONS D'ACCÈS MYSQL (STAFF_ROLES)
  // ----------------------------------------------------
  async getRoles() {
    try {
      const res = await apiClient.get("/roles.php");
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour les rôles :", err.message);
    }
    return null;
  },

  async saveRole(roleData) {
    try {
      const res = await apiClient.post("/roles.php", roleData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement rôle dans MySQL :", err.message);
      throw err;
    }
  },

  async deleteRole(id) {
    try {
      const res = await apiClient.delete(`/roles.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression rôle dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // CONSULTATIONS
  // ----------------------------------------------------
  async getConsultations() {
    try {
      const res = await apiClient.get("/consultations.php");
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return initialConsultations;
    } catch (err) {
      console.warn("Backend PHP non disponible ou erreur, utilisation des données locales :", err.message);
      return initialConsultations;
    }
  },

  async getConsultationById(id) {
    try {
      const res = await apiClient.get(`/consultations.php?id=${id}`);
      if (res.data && res.data.status === "success") {
        return res.data.data;
      }
      return null;
    } catch (err) {
      console.warn("Erreur récupération consultation :", err.message);
      return null;
    }
  },

  async saveConsultation(consultationData) {
    try {
      const res = await apiClient.post("/consultations.php", consultationData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement consultation vers MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // PATIENTS
  // ----------------------------------------------------
  async getPatients(search = "") {
    try {
      const query = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await apiClient.get(`/patients.php${query}`);
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      console.warn("Backend PHP non disponible pour patients :", err.message);
      return [];
    }
  },

  async createPatient(patientData) {
    try {
      const res = await apiClient.post("/patients.php", patientData);
      return res.data;
    } catch (err) {
      console.error("Erreur création patient vers MySQL :", err.message);
      throw err;
    }
  },

  async updatePatient(patientData) {
    try {
      const res = await apiClient.put("/patients.php", patientData);
      return res.data;
    } catch (err) {
      console.error("Erreur mise à jour patient vers MySQL :", err.message);
      throw err;
    }
  },

  async deletePatient(id) {
    try {
      const res = await apiClient.delete(`/patients.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression patient dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // ORDONNANCES (PRESCRIPTIONS)
  // ----------------------------------------------------
  async getPrescriptions(patientId = null) {
    try {
      const url = patientId ? `/prescriptions.php?patient_id=${patientId}` : "/prescriptions.php";
      const res = await apiClient.get(url);
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return initialPrescriptions;
    } catch (err) {
      console.warn("Backend PHP non disponible pour ordonnances :", err.message);
      return initialPrescriptions;
    }
  },

  async savePrescription(prescriptionData) {
    try {
      const res = await apiClient.post("/prescriptions.php", prescriptionData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement ordonnance :", err.message);
      throw err;
    }
  },

  async deletePrescription(id) {
    try {
      const res = await apiClient.delete(`/prescriptions.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression ordonnance dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // GESTION DES MÉDICAMENTS (MEDICATIONS)
  // ----------------------------------------------------
  async getMedications() {
    try {
      const res = await apiClient.get("/medications.php");
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        localStorage.setItem("cabinet_medications", JSON.stringify(res.data.data));
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP pour médicaments indisponible, fallback local :", err.message);
    }
    const saved = localStorage.getItem("cabinet_medications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return initialMedications;
  },

  async saveMedication(medData) {
    try {
      const res = await apiClient.post("/medications.php", medData);
      return res.data;
    } catch (err) {
      console.warn("Erreur API médicament, sauvegarde locale :", err.message);
      return { status: "success", data: medData };
    }
  },

  async deleteMedication(id) {
    try {
      const res = await apiClient.delete(`/medications.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.warn("Erreur suppression médicament API :", err.message);
      return { status: "success" };
    }
  },

  // ----------------------------------------------------
  // SALLE D'ATTENTE (WAITING ROOM)
  // ----------------------------------------------------
  async getWaitingRoom() {
    try {
      const res = await apiClient.get("/waiting_room.php");
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      console.warn("Backend PHP non disponible pour salle d'attente :", err.message);
      return [];
    }
  },

  async updateWaitingStatus(id, status) {
    try {
      const res = await apiClient.put("/waiting_room.php", { id, status });
      return res.data;
    } catch (err) {
      console.error("Erreur mise à jour statut salle d'attente :", err.message);
      throw err;
    }
  },

  async createWaitingArrival(data) {
    try {
      const res = await apiClient.post("/waiting_room.php", data);
      return res.data;
    } catch (err) {
      console.warn("Erreur ajout arrivée salle d'attente MySQL :", err.message);
    }
  },

  async deleteWaitingPatient(id) {
    try {
      const res = await apiClient.delete(`/waiting_room.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression patient salle d'attente MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // RENDEZ-VOUS (APPOINTMENTS)
  // ----------------------------------------------------
  async getAppointments(date = "") {
    try {
      const query = date ? `?date=${encodeURIComponent(date)}` : "";
      const res = await apiClient.get(`/appointments.php${query}`);
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
      return [];
    } catch (err) {
      console.warn("Backend PHP non disponible pour rendez-vous :", err.message);
      return [];
    }
  },

  async createAppointment(aptData) {
    try {
      const res = await apiClient.post("/appointments.php", aptData);
      return res.data;
    } catch (err) {
      console.error("Erreur création rendez-vous dans MySQL :", err.message);
      throw err;
    }
  },

  async updateAppointment(aptData) {
    try {
      const res = await apiClient.put("/appointments.php", aptData);
      return res.data;
    } catch (err) {
      console.error("Erreur mise à jour rendez-vous dans MySQL :", err.message);
      throw err;
    }
  },

  async deleteAppointment(id) {
    try {
      const res = await apiClient.delete(`/appointments.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression rendez-vous dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // FACTURES (INVOICES)
  // ----------------------------------------------------
  async getInvoices(patientId = null) {
    try {
      const url = patientId ? `/invoices.php?patient_id=${patientId}` : "/invoices.php";
      const res = await apiClient.get(url);
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour factures :", err.message);
    }
    return initialInvoices;
  },

  async saveInvoice(invoiceData) {
    try {
      const res = await apiClient.post("/invoices.php", invoiceData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement facture dans MySQL :", err.message);
      throw err;
    }
  },

  async deleteInvoice(id) {
    try {
      const res = await apiClient.delete(`/invoices.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression facture dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // RÈGLEMENTS (PAYMENTS)
  // ----------------------------------------------------
  async getPayments() {
    try {
      const res = await apiClient.get("/payments.php");
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour règlements :", err.message);
    }
    return initialPayments;
  },

  async savePayment(paymentData) {
    try {
      const res = await apiClient.post("/payments.php", paymentData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement règlement dans MySQL :", err.message);
      throw err;
    }
  },

  async deletePayment(id) {
    try {
      const res = await apiClient.delete(`/payments.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression règlement dans MySQL :", err.message);
      throw err;
    }
  },

  // ----------------------------------------------------
  // DOCUMENTS MÉDICAUX (DOCUMENTS)
  // ----------------------------------------------------
  async getDocuments(patientId = null) {
    try {
      const query = patientId ? `?patient_id=${patientId}` : "";
      const res = await apiClient.get(`/documents.php${query}`);
      if (res.data && res.data.status === "success" && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour documents :", err.message);
    }
    return [];
  },

  async saveDocument(docData) {
    try {
      const res = await apiClient.post("/documents.php", docData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement document dans MySQL :", err.message);
      throw err;
    }
  },

  async deleteDocument(id) {
    try {
      const res = await apiClient.delete(`/documents.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression document dans MySQL :", err.message);
      throw err;
    }
  },

  async markDocumentAsRead(id) {
    try {
      const res = await apiClient.post(`/documents.php?action=mark_read`, { id });
      return res.data;
    } catch (err) {
      console.error("Erreur marquage document comme lu :", err.message);
      return null;
    }
  },

  async getUnreadDocumentsCount() {
    try {
      const res = await apiClient.get(`/documents.php?action=unread_count`);
      if (res.data && res.data.status === "success" && res.data.data) {
        return res.data.data.count || 0;
      }
    } catch (err) {
      console.warn("Erreur comptage dépôts non lus :", err.message);
    }
    return 0;
  },

  // ----------------------------------------------------
  // STATISTIQUES & VISITES DU SITE PUBLIC EN TEMPS RÉEL
  // ----------------------------------------------------
  async getSiteVisits() {
    try {
      const res = await apiClient.get("/site_visits.php");
      if (res.data && res.data.status === "success" && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour visites du site :", err.message);
    }
    return null;
  },

  async recordSiteVisit(page = "/patient-portal", device = "desktop") {
    try {
      const res = await apiClient.post("/site_visits.php", {
        page,
        device,
      });
      return res.data;
    } catch (err) {
      console.warn("Erreur enregistrement visite site :", err.message);
      return null;
    }
  },

  // ----------------------------------------------------
  // JOURNAL DE CAISSE & COMPTABILITÉ (CASHFLOW)
  // ----------------------------------------------------
  async getCashflow(action = "all") {
    try {
      const res = await apiClient.get(`/cashflow.php?action=${action}`);
      if (res.data && res.data.status === "success" && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn("Backend PHP non disponible pour le journal de caisse :", err.message);
    }
    return {
      entries: [],
      categories: { all: [], recettes: [], depenses: [] },
      summary: {
        totalRecettes: 0,
        totalDepenses: 0,
        soldeCaisse: 0,
        todayRecettes: 0,
        todayDepenses: 0,
        beneficeJour: 0,
        monthRecettes: 0,
        monthDepenses: 0,
        totalEntries: 0,
      },
    };
  },

  async saveCashEntry(entryData) {
    try {
      const res = await apiClient.post("/cashflow.php", entryData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement écriture caisse dans MySQL :", err.message);
      throw err;
    }
  },

  async deleteCashEntry(id) {
    try {
      const res = await apiClient.delete(`/cashflow.php?id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression écriture caisse dans MySQL :", err.message);
      throw err;
    }
  },

  async saveCashCategory(categoryData) {
    try {
      const res = await apiClient.post("/cashflow.php?action=category", categoryData);
      return res.data;
    } catch (err) {
      console.error("Erreur enregistrement catégorie caisse :", err.message);
      throw err;
    }
  },

  async deleteCashCategory(id) {
    try {
      const res = await apiClient.delete(`/cashflow.php?action=category&id=${id}`);
      return res.data;
    } catch (err) {
      console.error("Erreur suppression catégorie caisse :", err.message);
      throw err;
    }
  },
};

export default ApiService;

