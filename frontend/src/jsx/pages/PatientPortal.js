import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import PrescriptionPreviewModal from "../components/Cabinet/PrescriptionPreviewModal";
import EchoReportPrintModal from "../components/Cabinet/EchoReportPrintModal";
import confetti from "canvas-confetti";
import "../../css/patient-portal.css";
import ApiService from "../../services/ApiService";
import { jsPDF } from "jspdf";
import {




  Camera,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Lock,
  Key,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  Send,
  X,
  ArrowRight,
  Sun,
  Sunset,
  Home,
  Info,
  FileText,
  Receipt,
  Activity,
  Download,
  Folder,
  UploadCloud,
} from "lucide-react";

const getCleanMapIframeUrl = (url) => {
  if (!url || url.includes("embed?pb=") || url.includes("!1s0x")) {
    return "https://maps.google.com/maps?q=35.714476270634655,-0.6038324575020871&hl=fr&z=17&output=embed";
  }
  return url;
};


// Générateur dynamique de créneaux horaires selon la durée configurée (ex: 20 min, 30 min, 40 min...)
const generateSlots = (startStr = "09:00", endStr = "12:30", step = 30) => {
  const [sh, sm] = (startStr || "09:00").split(":").map(Number);
  const [eh, em] = (endStr || "12:30").split(":").map(Number);
  const startMin = (isNaN(sh) ? 9 : sh) * 60 + (isNaN(sm) ? 0 : sm);
  const endMin = (isNaN(eh) ? 12 : eh) * 60 + (isNaN(em) ? 30 : em);
  const stepMin = Math.max(10, parseInt(step, 10) || 30);
  const list = [];
  for (let m = startMin; m <= endMin; m += stepMin) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    list.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return list;
};

// URL API dynamique : bascule automatiquement entre dev local (port 8000) et hébergeur en ligne
const getApiUrl = (endpoint) => {
  if (process.env.REACT_APP_API_URL) {
    return `${process.env.REACT_APP_API_URL}/${endpoint}`;
  }
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return `http://127.0.0.1:8000/api/${endpoint}`;
  }
  return `/backend/api/${endpoint}`;
};

// Helper universel pour formater et sécuriser les URLs de photos de profil
const formatPatientPhoto = (photo) => {
  if (!photo) return "";
  if (photo.startsWith("data:") || photo.startsWith("blob:")) return photo;

  // Si c'est déjà une URL absolue http(s)
  if (photo.startsWith("http://") || photo.startsWith("https://")) {
    // Si l'URL absolue pointe vers /uploads/ sans /backend/ sur un hébergeur en ligne (ex: belbachir.azizbtph.com)
    if (photo.includes("/uploads/") && !photo.includes("/backend/uploads/") && !photo.includes(":8000")) {
      return photo.replace("/uploads/", "/backend/uploads/");
    }
    return photo;
  }

  // Si c'est un chemin relatif (ex: uploads/avatars/...)
  const cleanPath = photo.startsWith("/") ? photo.slice(1) : photo;
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return `http://127.0.0.1:8000/${cleanPath}`;
    }
    return `${window.location.origin}/backend/${cleanPath}`;
  }
  return `/backend/${cleanPath}`;
};

// Détermination de la vue active selon le chemin de l'URL
const getViewFromPath = (pathname) => {
  const p = (pathname || "").toLowerCase().replace(/\/+$/, "") || "/";
  if (p === "/agenda" || p === "/rendez-vous" || p === "/schedule") return "schedule";
  if (p === "/profil" || p === "/espace-patient" || p === "/mon-dossier" || p === "/profile") return "profile";
  if (p === "/a-propos" || p === "/about") return "about";
  if (p === "/confirmation") return "confirmed";
  return "doctor";
};

export default function PatientPortal() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation entre vues: 'doctor' (/) | 'schedule' (/agenda) | 'profile' (/profil) | 'about' (/a-propos) | 'confirmed' (/confirmation)
  const [view, setViewState] = useState(() => getViewFromPath(location?.pathname));

  // Mise à jour de la vue et synchronisation de l'URL dans la barre du navigateur
  const setView = (newView, replace = false) => {
    let targetPath = "/";
    if (newView === "schedule") targetPath = "/agenda";
    else if (newView === "profile") targetPath = "/profil";
    else if (newView === "about") targetPath = "/a-propos";
    else if (newView === "confirmed") targetPath = "/confirmation";
    else targetPath = "/";

    setViewState(newView);
    if (location?.pathname !== targetPath) {
      navigate(targetPath, { replace });
    }
  };

  // Synchronisation lorsque l'URL change (ex: bouton Précédent / Suivant du navigateur ou saisie directe)
  useEffect(() => {
    const target = getViewFromPath(location?.pathname);
    setViewState(target);
  }, [location?.pathname]);

  // Enregistrement de la visite en temps réel dans MySQL (Portail Public)
  useEffect(() => {
    try {
      const isMobile = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      ApiService.recordSiteVisit("/patient-portal", isMobile ? "mobile" : "desktop");
    } catch (e) {
      // Ignorer silencieusement si hors ligne
    }
  }, []);

  // Informations officielles et dynamiques du cabinet synchronisées avec MySQL & Mon Cabinet
  const [clinicInfo, setClinicInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("cabinet_info");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      clinicName: "Cabinet Médical belbachir",
      doctorName: "Dr N. BELBACHIR OULD HENNIA",
      doctorNameAr: "الدكتورة ن. بلبشير ولد هنية • طبيبة مختصة",
      specialty: "Spécialiste Gynécologie Obstétrique & Échographie",
      aboutText: "Cabinet médical de gynécologie obstétrique et d'échographie du Dr N. BELBACHIR OULD HENNIA, situé à Haï Essedikia (Avenue Seghier Benali) à Oran.\n\nDédié à la santé et au bien-être de la femme, notre cabinet assure un suivi bienveillant et personnalisé de votre grossesse, de la conception jusqu'au terme. Équipée des dernières technologies d'imagerie ultrasonore avec Doppler couleur et rendu 3D/4D HD Live, la praticienne réalise vos bilans morphologiques et diagnostics prénataux avec la plus haute précision.\n\nNous assurons également les consultations de gynécologie générale, le dépistage précoce, les bilans de fertilité et la contraception, dans un cadre serein privilégiant l'écoute attentive, le respect du secret médical et la ponctualité.",
      aboutSummary: "Cabinet médical moderne dédié à la santé féminine, au suivi complet de la grossesse, au diagnostic prénatal et aux échographies obstétricales et pelviennes de haute précision.",
      hours: "Samedi — Jeudi: 09:00 — 18:00",
      closedDays: "Vendredi: Fermé",
      closedDates: [],
      address: "Haï Seddikia (ex-Cité Boulanger), Cité 340 Logements, Bâtiment 18/A, Oran",
      secretaryPhone: "0560 06 74 66",
      phone: "041 53 97 82",
      mapsUrl: "https://maps.google.com/?q=Gynecologue+Belbachir+Ouldhennia!5e0",
      mapsIframe: "https://maps.google.com/maps?q=35.714476270634655,-0.6038324575020871&hl=fr&z=17&output=embed",
      slotDuration: 30,
      slotStartMorning: "09:00",
      slotEndMorning: "12:30",
      slotStartEvening: "13:00",
      slotEndEvening: "18:00",
      doctorPhoto: "/doctor.jpg",
    };
  });

  useEffect(() => {
    fetch(getApiUrl("cabinet_info.php"))
      .then((res) => res.json())
      .then((resData) => {
        if (resData && resData.status === "success" && resData.data) {
          setClinicInfo((prev) => ({ ...prev, ...resData.data }));
          try {
            localStorage.setItem("cabinet_info", JSON.stringify(resData.data));
          } catch (e) {}
        }
      })
      .catch((err) => console.warn("Erreur chargement cabinet_info :", err));
  }, []);

  // Créneaux horaires générés dynamiquement selon la durée de créneau configurée dans Mon Cabinet
  const morningSlots = useMemo(() => {
    return generateSlots(
      clinicInfo.slotStartMorning || "09:00",
      clinicInfo.slotEndMorning || "12:30",
      clinicInfo.slotDuration || 30
    );
  }, [clinicInfo.slotStartMorning, clinicInfo.slotEndMorning, clinicInfo.slotDuration]);

  const eveningSlots = useMemo(() => {
    return generateSlots(
      clinicInfo.slotStartEvening || "13:00",
      clinicInfo.slotEndEvening || "17:30",
      clinicInfo.slotDuration || 30
    );
  }, [clinicInfo.slotStartEvening, clinicInfo.slotEndEvening, clinicInfo.slotDuration]);

  const allDaySlots = useMemo(() => {
    return [...morningSlots, ...eveningSlots];
  }, [morningSlots, eveningSlots]);

  // Calcule l'ordre de passage / numéro de ticket journalier selon l'heure choisie
  const getTicketNumber = (slotTime) => {
    if (!slotTime) return 1;
    const normalized = slotTime.trim().padStart(5, "0");
    const idx = allDaySlots.indexOf(normalized);
    if (idx !== -1) return idx + 1;
    return 1;
  };

  // Liste des réservations du patient
  const [patientAppointments, setPatientAppointments] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cabinet_client_appointments") || "[]");
    } catch {
      return [];
    }
  });

  // ===================================================================
  // GESTION DU TEMPS RÉEL (HEURE & DATE DE L'APPAREIL) & CALENDRIER DYNAMIQUE
  // ===================================================================
  const now = new Date();
  const currentDayNumber = now.getDate(); // Jour actuel de l'appareil (ex: 22)
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const MONTH_NAMES = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Mois & Année affichés dans la vue calendrier
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());

  // Vérifie si un jour fait partie des jours de fermeture du cabinet configurés dans Mon Cabinet
  // Vérifie si une date (YYYY-MM-DD) fait partie des fermetures exceptionnelles (jours fériés / vacances)
  const getClosedDateInfo = (day, month = calendarMonth, year = calendarYear) => {
    if (!Array.isArray(clinicInfo.closedDates) || clinicInfo.closedDates.length === 0) return null;
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return (
      clinicInfo.closedDates.find((item) => {
        const start = item.startDate;
        const end = item.endDate || item.startDate;
        return start && iso >= start && iso <= end;
      }) || null
    );
  };

  // Vérifie si un jour fait partie des jours de fermeture du cabinet configurés dans Mon Cabinet
  const isClosedDay = (day, month = calendarMonth, year = calendarYear) => {
    if (getClosedDateInfo(day, month, year)) return true;
    const d = new Date(year, month, day).getDay(); // 0 = Dimanche, 1 = Lundi, ... 5 = Vendredi, 6 = Samedi
    const closedStr = (clinicInfo.closedDays || "Vendredi: Fermé").toLowerCase();

    // Si le cabinet est ouvert 7j/7
    if (closedStr.includes("aucun") || closedStr.includes("ouvert 7")) return false;

    if (d === 0 && (closedStr.includes("dimanche") || closedStr.includes("dim"))) return true;
    if (d === 1 && (closedStr.includes("lundi") || closedStr.includes("lun"))) return true;
    if (d === 2 && (closedStr.includes("mardi") || closedStr.includes("mar"))) return true;
    if (d === 3 && (closedStr.includes("mercredi") || closedStr.includes("mer"))) return true;
    if (d === 4 && (closedStr.includes("jeudi") || closedStr.includes("jeu"))) return true;
    if (d === 5 && (closedStr.includes("vendredi") || closedStr.includes("ven"))) return true;
    if (d === 6 && (closedStr.includes("samedi") || closedStr.includes("sam"))) return true;

    return false;
  };

  const isWeekdayClosed = (dayIndex) => {
    const closedStr = (clinicInfo.closedDays || "Vendredi: Fermé").toLowerCase();
    if (closedStr.includes("aucun") || closedStr.includes("ouvert 7")) return false;
    if (dayIndex === 0 && (closedStr.includes("dimanche") || closedStr.includes("dim"))) return true;
    if (dayIndex === 1 && (closedStr.includes("lundi") || closedStr.includes("lun"))) return true;
    if (dayIndex === 2 && (closedStr.includes("mardi") || closedStr.includes("mar"))) return true;
    if (dayIndex === 3 && (closedStr.includes("mercredi") || closedStr.includes("mer"))) return true;
    if (dayIndex === 4 && (closedStr.includes("jeudi") || closedStr.includes("jeu"))) return true;
    if (dayIndex === 5 && (closedStr.includes("vendredi") || closedStr.includes("ven"))) return true;
    if (dayIndex === 6 && (closedStr.includes("samedi") || closedStr.includes("sam"))) return true;
    return false;
  };

  const isFriday = isClosedDay;

  // Vérifie si un jour est déjà passé par rapport à aujourd'hui
  const isDayPast = (day, month = calendarMonth, year = calendarYear) => {
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const target = new Date(year, month, day).getTime();
    return target < todayZero;
  };

  // Date complète sélectionnée par l'utilisateur pour le RDV
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  // Vérifie si un créneau horaire ("14:30") est déjà passé
  const isSlotPast = (slot, day, month, year) => {
    const d = day !== undefined ? day : selectedDay;
    const m = month !== undefined ? month : selectedMonth;
    const y = year !== undefined ? year : selectedYear;
    if (isDayPast(d, m, y)) return true;
    const isToday =
      d === now.getDate() &&
      m === now.getMonth() &&
      y === now.getFullYear();
    if (!isToday) return false;
    const [h, min] = slot.split(":").map(Number);
    return (h * 60 + min) <= currentTotalMinutes;
  };

  // Vérifie s'il reste des créneaux disponibles aujourd'hui
  const hasFutureSlotsToday = allDaySlots.some(
    (s) => !isSlotPast(s, currentDayNumber, now.getMonth(), now.getFullYear())
  );

  // Jour initial par défaut : aujourd'hui s'il reste des créneaux, sinon le prochain jour ouvrable
  const getInitialDay = () => {
    if (hasFutureSlotsToday && !isFriday(currentDayNumber, now.getMonth(), now.getFullYear())) {
      return currentDayNumber;
    }
    let next = currentDayNumber + 1;
    const maxDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    while (isFriday(next, now.getMonth(), now.getFullYear()) && next <= maxDays) {
      next++;
    }
    return Math.min(next, maxDays);
  };

  const [selectedDay, setSelectedDay] = useState(getInitialDay);

  // Liste des créneaux horaires déjà occupés / bloqués pour la date sélectionnée (synchronisé MySQL)
  const [occupiedSlots, setOccupiedSlots] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchOccupiedSlots = async () => {
      try {
        const monthStr = String(selectedMonth + 1).padStart(2, "0");
        const dayStr = String(selectedDay).padStart(2, "0");
        const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
        const res = await fetch(getApiUrl(`appointments.php?date=${dateStr}`));
        const resJson = await res.json();
        if (active && resJson && Array.isArray(resJson.data)) {
          // Bloquer les créneaux dont le statut n'est pas "Annulé" ou "Refusé"
          const booked = resJson.data
            .filter((a) => a.status !== "Annulé" && a.status !== "Refusé")
            .map((a) => (a.time || "").slice(0, 5));
          setOccupiedSlots(booked);
        }
      } catch (err) {
        console.warn("Erreur chargement créneaux occupés:", err);
      }
    };
    fetchOccupiedSlots();
    return () => {
      active = false;
    };
  }, [selectedDay, selectedMonth, selectedYear]);

  // Si la date sélectionnée devient fermée suite au chargement des jours fériés / vacances, avancer au prochain jour ouvert
  useEffect(() => {
    if (isClosedDay(selectedDay, selectedMonth, selectedYear)) {
      let d = selectedDay;
      let m = selectedMonth;
      let y = selectedYear;
      for (let i = 0; i < 60; i++) {
        const maxD = new Date(y, m + 1, 0).getDate();
        d++;
        if (d > maxD) {
          d = 1;
          m++;
          if (m > 11) {
            m = 0;
            y++;
          }
        }
        if (!isClosedDay(d, m, y)) {
          setSelectedDay(d);
          setSelectedMonth(m);
          setSelectedYear(y);
          break;
        }
      }
    }
  }, [clinicInfo.closedDates, clinicInfo.closedDays]);

  // Période initiale par défaut (matin ou après-midi selon l'heure de l'appareil)
  const getInitialPeriod = (day, month = now.getMonth(), year = now.getFullYear()) => {
    const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    if (isToday && currentTotalMinutes >= 12 * 60 + 30) {
      return "soir";
    }
    return "matin";
  };

  // Premier créneau horaire disponible
  const getFirstAvailableSlot = (day, period, month, year) => {
    const m = month !== undefined ? month : selectedMonth;
    const y = year !== undefined ? year : selectedYear;
    const slots = period === "matin" ? morningSlots : eveningSlots;
    const available = slots.filter((s) => !isSlotPast(s, day, m, y) && !occupiedSlots.includes(s));
    if (available.length > 0) return available[0];
    const otherSlots = period === "matin" ? eveningSlots : morningSlots;
    const otherAvailable = otherSlots.filter((s) => !isSlotPast(s, day, m, y) && !occupiedSlots.includes(s));
    return otherAvailable.length > 0 ? otherAvailable[0] : (slots[0] || "09:00");
  };

  useEffect(() => {
    if (occupiedSlots.includes(selectedTime)) {
      const validSlot = getFirstAvailableSlot(selectedDay, timePeriod, selectedMonth, selectedYear);
      if (validSlot && validSlot !== selectedTime) setSelectedTime(validSlot);
    }
  }, [occupiedSlots]);

  const initialPeriod = getInitialPeriod(selectedDay, selectedMonth, selectedYear);
  const [timePeriod, setTimePeriod] = useState(initialPeriod);
  const [selectedTime, setSelectedTime] = useState(() =>
    getFirstAvailableSlot(selectedDay, initialPeriod, selectedMonth, selectedYear)
  );

  // Direction de l'animation de slide ('left' ou 'right')
  const [slideDirection, setSlideDirection] = useState("right");

  // Changement de période avec sélection automatique du premier créneau valide
  const handleSwitchPeriod = (newPeriod) => {
    if (newPeriod === timePeriod) return;
    setSlideDirection(newPeriod === "soir" ? "left" : "right");
    setTimePeriod(newPeriod);
    const slots = newPeriod === "matin" ? morningSlots : eveningSlots;
    const available = slots.filter((s) => !isSlotPast(s, selectedDay, selectedMonth, selectedYear));
    if (available.length > 0 && (!slots.includes(selectedTime) || isSlotPast(selectedTime, selectedDay, selectedMonth, selectedYear))) {
      setSelectedTime(available[0]);
    }
  };

  // Gestion des gestes Swipe (Touch & Mouse Drag) entre Matin et Soir
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);
  const isDraggingRef = useRef(false);

  const handleTouchStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    touchStartXRef.current = clientX;
    touchStartYRef.current = clientY;
    isDraggingRef.current = true;
  };

  const handleTouchEnd = (e) => {
    if (!isDraggingRef.current || touchStartXRef.current === null) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const diffX = clientX - touchStartXRef.current;
    const diffY = clientY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isDraggingRef.current = false;

    // Détection du swipe horizontal (seuil minimum 35px et plus horizontal que vertical)
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.1) {
      if (diffX < 0) {
        // Swipe vers la gauche (doigt glissé vers la gauche) -> Après-midi / Soir
        handleSwitchPeriod("soir");
      } else {
        // Swipe vers la droite (doigt glissé vers la droite) -> Matin
        handleSwitchPeriod("matin");
      }
    }
  };

  // Navigation entre les mois
  const canGoPrevMonth =
    calendarYear > now.getFullYear() ||
    (calendarYear === now.getFullYear() && calendarMonth > now.getMonth());

  // Direction de l'animation des mois ('left' ou 'right')
  const [monthSlideDirection, setMonthSlideDirection] = useState("left");

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    setMonthSlideDirection("right");
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setMonthSlideDirection("left");
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  // Gestion du swipe (tactile & souris) pour changer de mois
  const monthTouchStartXRef = useRef(null);
  const monthTouchStartYRef = useRef(null);
  const monthIsDraggingRef = useRef(false);

  const handleMonthTouchStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    monthTouchStartXRef.current = clientX;
    monthTouchStartYRef.current = clientY;
    monthIsDraggingRef.current = true;
  };

  const handleMonthTouchEnd = (e) => {
    if (!monthIsDraggingRef.current || monthTouchStartXRef.current === null) return;
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const diffX = clientX - monthTouchStartXRef.current;
    const diffY = clientY - monthTouchStartYRef.current;

    monthTouchStartXRef.current = null;
    monthTouchStartYRef.current = null;
    monthIsDraggingRef.current = false;

    // Détection du swipe horizontal (seuil minimum 35px, plus horizontal que vertical)
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY) * 1.1) {
      if (diffX < 0) {
        // Glisser vers la gauche -> Mois suivant
        handleNextMonth();
      } else {
        // Glisser vers la droite -> Mois précédent
        if (canGoPrevMonth) {
          handlePrevMonth();
        }
      }
    }
  };

  // Calcul dynamique des jours du mois affiché pour la grille
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const leadingOffset = (firstDayOfWeek + 6) % 7; // Semaine commence le Lundi (0)
  const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();
  const leadingPaddingDays = [];
  for (let i = leadingOffset - 1; i >= 0; i--) {
    leadingPaddingDays.push(daysInPrevMonth - i);
  }
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const totalCells = leadingOffset + daysInMonth;
  const trailingCount = (7 - (totalCells % 7)) % 7;
  const trailingPaddingDays = Array.from({ length: trailingCount }, (_, i) => i + 1);

  // Vérifie si la date sélectionnée correspond à la date d'aujourd'hui
  const isTodaySelected =
    selectedDay === now.getDate() &&
    selectedMonth === now.getMonth() &&
    selectedYear === now.getFullYear();

  // Gestion du clic sur un jour du calendrier
  const handleSelectDay = (day) => {
    if (isDayPast(day, calendarMonth, calendarYear) || isFriday(day, calendarMonth, calendarYear)) return;
    const isToday =
      day === now.getDate() &&
      calendarMonth === now.getMonth() &&
      calendarYear === now.getFullYear();
    if (isToday && !hasFutureSlotsToday) return;

    setSelectedDay(day);
    setSelectedMonth(calendarMonth);
    setSelectedYear(calendarYear);

    let nextPeriod = timePeriod;
    if (isToday) {
      const morningAvailable = morningSlots.some((s) => !isSlotPast(s, day, calendarMonth, calendarYear));
      if (!morningAvailable) {
        nextPeriod = "soir";
        setTimePeriod("soir");
      }
    }

    if (isSlotPast(selectedTime, day, calendarMonth, calendarYear)) {
      const validSlot = getFirstAvailableSlot(day, nextPeriod, calendarMonth, calendarYear);
      setSelectedTime(validSlot);
    }
  };

  const [authenticatedPatient, setAuthenticatedPatient] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cabinet_patient_auth") || "null");
    } catch {
      return null;
    }
  });

  const profilePhotoInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState("");
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const displayPhoto = formatPatientPhoto(authenticatedPatient?.photo || "");

  useEffect(() => {
    setPhotoLoadError(false);
  }, [authenticatedPatient?.photo]);

  const handleProfilePhotoClick = () => {
    if (!authenticatedPatient) return;
    if (profilePhotoInputRef.current) {
      profilePhotoInputRef.current.click();
    }
  };

  const handleProfilePhotoChange = async (e) => {
    if (!authenticatedPatient || !authenticatedPatient.id) return;
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop volumineuse (taille maximale : 5 Mo).");
      return;
    }

    try {
      setUploadingPhoto(true);
      setPhotoFeedback("");

      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;

        try {
          const resp = await fetch(getApiUrl("patients.php?action=upload_photo"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: authenticatedPatient.id,
              photo: base64Data,
            }),
          });

          const json = await resp.json();
          if (json.status === "success" && (json.data?.photo || base64Data)) {
            const newPhotoUrl = formatPatientPhoto(json.data?.photo || base64Data);
            const updated = {
              ...authenticatedPatient,
              photo: newPhotoUrl,
            };
            setPhotoLoadError(false);
            setAuthenticatedPatient(updated);
            localStorage.setItem("cabinet_patient_auth", JSON.stringify(updated));
            setPhotoFeedback("Photo de profil mise à jour et enregistrée !");
            setTimeout(() => setPhotoFeedback(""), 3500);
          } else {
            alert(json.message || "Erreur lors de l'enregistrement de la photo");
          }
        } catch (err) {
          console.error("Erreur upload photo:", err);
          alert("Erreur de connexion au serveur lors de l'enregistrement de la photo.");
        } finally {
          setUploadingPhoto(false);
          if (e.target) e.target.value = "";
        }
      };

      reader.onerror = () => {
        setUploadingPhoto(false);
        alert("Erreur lors de la lecture du fichier image.");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingPhoto(false);
      console.error(err);
    }
  };

  const [patientName, setPatientName] = useState(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("cabinet_patient_auth") || "null");
      if (auth && (auth.firstName || auth.lastName)) {
        return `${auth.firstName} ${auth.lastName}`.trim();
      }
    } catch {}
    return "";
  });

  const [patientPhone, setPatientPhone] = useState(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("cabinet_patient_auth") || "null");
      if (auth && auth.phone) {
        return auth.phone;
      }
    } catch {}
    return "";
  });

  const [patientEmail, setPatientEmail] = useState(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("cabinet_patient_auth") || "null");
      if (auth && auth.email) {
        return auth.email;
      }
    } catch {}
    return "";
  });

  const [patientPassword, setPatientPassword] = useState(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("cabinet_patient_auth") || "null");
      if (auth && auth.password) {
        return auth.password;
      }
    } catch {}
    return "";
  });

  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Documents médicaux du patient (Factures, Ordonnances, Échographies, Documents)
  const [patientInvoices, setPatientInvoices] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [patientEchographies, setPatientEchographies] = useState([]);
  const [patientDocuments, setPatientDocuments] = useState([]);
  const [patientDocsLoading, setPatientDocsLoading] = useState(false);

  // Modales d'aperçu identiques à l'admin panel (Ordonnances, Échographies, Factures, Documents)
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedEchoConsultation, setSelectedEchoConsultation] = useState(null);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [previewingDoc, setPreviewingDoc] = useState(null);

  // Sections déroulantes / accordéon (wishlist style) pour RDV et documents médicaux
  const [openSections, setOpenSections] = useState({
    homeAppointments: true,
    appointments: false,
    invoices: false,
    prescriptions: false,
    echographies: false,
    documents: false,
    uploadDoc: false,
  });

  // Nouvel état pour déposer un document ou envoyer un texte au cabinet
  const [uploadDocTitle, setUploadDocTitle] = useState("");
  const [uploadDocCategory, setUploadDocCategory] = useState("Autre");
  const [uploadDocText, setUploadDocText] = useState("");
  const [uploadDocFile, setUploadDocFile] = useState(null);
  const [uploadDocFilePreview, setUploadDocFilePreview] = useState(null);
  const [uploadDocSubmitting, setUploadDocSubmitting] = useState(false);
  const [uploadDocSuccess, setUploadDocSuccess] = useState("");
  const [uploadDocError, setUploadDocError] = useState("");
  const uploadFileInputRef = useRef(null);

  // Horloge réactive pour retirer automatiquement de l'accueil les RDV dont la date/heure est passée
  const [currentClock, setCurrentClock] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentClock(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Analyse la date et l'heure d'un rendez-vous ("29 Octobre 2026" ou "2026-10-29")
  const parseAppointmentDateTime = (apt) => {
    if (!apt) return null;
    const rawDate = String(apt.isoDate || apt.date || "").trim();
    if (!rawDate) return null;

    let year = NaN;
    let monthIndex = NaN;
    let day = NaN;

    const isoMatch = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      monthIndex = parseInt(isoMatch[2], 10) - 1;
      day = parseInt(isoMatch[3], 10);
    } else {
      const parts = rawDate.split(/\s+/);
      if (parts.length >= 3) {
        day = parseInt(parts[0], 10);
        const mName = parts[1].toLowerCase();
        monthIndex = MONTH_NAMES.findIndex((m) => m.toLowerCase() === mName);
        year = parseInt(parts[2], 10);
      }
    }

    if (isNaN(year) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11 || isNaN(day)) {
      return null;
    }

    let hours = 23;
    let minutes = 59;
    if (apt.time) {
      const tParts = String(apt.time).trim().split(":").map(Number);
      if (!isNaN(tParts[0])) hours = tParts[0];
      if (!isNaN(tParts[1])) minutes = tParts[1];
    }

    return new Date(year, monthIndex, day, hours, minutes, 0, 0);
  };

  // Rendez-vous actifs à venir (affichés sur la page d'Accueil ; retirés automatiquement dès que la date/heure est passée)
  const homeAppointments = useMemo(() => {
    return patientAppointments.filter((apt) => {
      if (!apt || apt.hiddenFromHome) return false;
      if (apt.status && ["Terminé", "Annulé", "Absent"].includes(apt.status)) {
        return false;
      }
      const aptDate = parseAppointmentDateTime(apt);
      if (!aptDate) return true;
      return aptDate.getTime() > currentClock.getTime();
    });
  }, [patientAppointments, currentClock]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Charger l'ensemble des documents médicaux du patient connecté
  const loadPatientMedicalData = async (patientObj) => {
    if (!patientObj || !patientObj.id) return;
    setPatientDocsLoading(true);

    const pid = patientObj.id;
    const cleanPhone = (patientObj.phone || "").replace(/\D/g, "");

    // 1. Factures
    try {
      const invResp = await fetch(getApiUrl(`invoices.php?patient_id=${pid}`));
      const invJson = await invResp.json();
      if (invJson && Array.isArray(invJson.data)) {
        setPatientInvoices(invJson.data);
      } else {
        const invList = await ApiService.getInvoices(pid);
        if (Array.isArray(invList)) {
          const filtered = invList.filter(
            (i) =>
              Number(i.patientId) === Number(pid) ||
              (cleanPhone && (i.patientPhone || "").replace(/\D/g, "") === cleanPhone)
          );
          setPatientInvoices(filtered);
        }
      }
    } catch (e) {
      console.warn("Erreur chargement factures patient :", e);
    }

    // 2. Ordonnances
    try {
      const prescResp = await fetch(getApiUrl(`prescriptions.php?patient_id=${pid}`));
      const prescJson = await prescResp.json();
      if (prescJson && Array.isArray(prescJson.data)) {
        setPatientPrescriptions(prescJson.data);
      } else {
        const pList = await ApiService.getPrescriptions(pid);
        if (Array.isArray(pList)) {
          const filtered = pList.filter((p) => Number(p.patientId) === Number(pid));
          setPatientPrescriptions(filtered);
        }
      }
    } catch (e) {
      console.warn("Erreur chargement ordonnances patient :", e);
    }

    // 3. Échographies & 4. Documents Médicaux
    try {
      const echosList = [];
      const docsList = [];

      try {
        const docsResp = await fetch(getApiUrl(`documents.php?patient_id=${pid}`));
        const docsJson = await docsResp.json();
        let rawDocs = [];
        if (docsJson && Array.isArray(docsJson.data)) {
          rawDocs = docsJson.data;
        } else {
          rawDocs = await ApiService.getDocuments(pid);
        }

        if (Array.isArray(rawDocs)) {
          rawDocs.forEach((d) => {
            const cat = (d.category || "").toLowerCase();
            const tit = (d.title || "").toLowerCase();
            if (
              cat.includes("écho") ||
              cat.includes("echo") ||
              cat.includes("imagerie") ||
              cat.includes("radio") ||
              tit.includes("écho") ||
              tit.includes("echo")
            ) {
              echosList.push({
                id: `doc-${d.id}`,
                title: d.title || "Échographie",
                date: d.date || d.doc_date,
                author: d.author || clinicInfo.doctorName || "Dr N. BELBACHIR",
                fileDataUrl: d.fileDataUrl,
                filePath: d.filePath,
                isDocument: true,
              });
            }

            // Document médical (fichier joint, analyse, bilan, certificat, compte-rendu, etc.)
            const isPurePrescText = tit.startsWith("ordonnance médicale #") && !d.fileDataUrl && !d.filePath;
            if (!isPurePrescText) {
              docsList.push({
                id: d.id,
                title: d.title || "Document Médical",
                date: d.date || d.doc_date,
                category: d.category || "Document Médical",
                author: d.author || clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA",
                fileDataUrl: d.fileDataUrl,
                filePath: d.filePath,
                fileType: d.fileType || "PDF",
                fileSize: d.fileSize || "Document",
                status: d.status || "Validé",
                notes: d.notes,
              });
            }
          });
        }
      } catch (err) {
        console.warn("Erreur documents :", err);
      }

      try {
        const csResp = await fetch(getApiUrl(`consultations.php?patient_id=${pid}`));
        const csJson = await csResp.json();
        if (csJson && Array.isArray(csJson.data)) {
          csJson.data.forEach((c) => {
            if (c.echoType || c.echoFindings || c.echoConclusion || c.ultrasoundReport) {
              echosList.push({
                id: `cs-${c.id}`,
                consultationNumber: c.consultationNumber,
                patientName: c.patientName,
                title: c.echoType || `Compte-rendu d'échographie (${c.reason || "Examen"})`,
                date: c.date,
                author: clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA",
                echoFindings: c.echoFindings,
                echoConclusion: c.echoConclusion,
                echoType: c.echoType,
                echoData: c.echoData,
                ultrasoundReport: c.ultrasoundReport,
                diagnosis: c.diagnosis,
                recommendations: c.recommendations,
                examFindings: c.examFindings,
                atcd: c.atcd,
                calculated: c.calculated,
                patientDetails: c.patientDetails,
                rawConsultation: c,
                isConsultation: true,
              });
            }
          });
        }
      } catch (err) {
        console.warn("Erreur consultations :", err);
      }

      setPatientEchographies(echosList);
      setPatientDocuments(docsList);
    } catch (e) {
      console.warn("Erreur chargement documents/échographies patient :", e);
    } finally {
      setPatientDocsLoading(false);
    }
  };

  // Synchronisation automatique si le patient est déjà connecté
  useEffect(() => {
    if (authenticatedPatient && authenticatedPatient.id) {
      loadPatientMedicalData(authenticatedPatient);
      // Synchroniser la photo du patient depuis MySQL si non présente dans le cache local
      if (!authenticatedPatient.photo) {
        fetch(getApiUrl(`patients.php?id=${authenticatedPatient.id}`))
          .then((res) => res.json())
          .then((json) => {
            const freshPatient = json?.data && json.data[0];
            if (freshPatient?.photo) {
              const updated = { ...authenticatedPatient, photo: freshPatient.photo };
              setAuthenticatedPatient(updated);
              localStorage.setItem("cabinet_patient_auth", JSON.stringify(updated));
            }
          })
          .catch(() => {});
      }
    }
  }, [authenticatedPatient?.id]);

  // Création du PDF d'ordonnance
  const createPrescriptionPdf = (presc) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pName = authenticatedPatient
      ? `${authenticatedPatient.lastName || ""} ${authenticatedPatient.firstName || ""}`.trim()
      : (patientName || "Patient");
    const pFile = authenticatedPatient ? authenticatedPatient.fileNumber : "";

    // En-tête officiel Cabinet
    pdf.setDrawColor(26, 58, 92);
    pdf.setLineWidth(0.8);
    pdf.line(15, 28, 195, 28);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(26, 58, 92);
    pdf.text((clinicInfo.clinicName || "CABINET DE GYNECOLOGIE OBSTETRIQUE").toUpperCase(), 15, 14);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(45, 106, 159);
    pdf.text(clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA", 15, 19);

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(clinicInfo.specialty || "Medecin Specialiste en Gynecologie Obstetrique - Echographie", 15, 23);
    pdf.text(`${clinicInfo.address || "Cite 500 Logements, Es-Senia, Oran"} | Tel : ${clinicInfo.secretaryPhone || clinicInfo.phone || "0550 50 50 25"}`, 15, 27);

    // Titre
    pdf.setFillColor(245, 249, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(15, 33, 180, 11, 2, 2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(26, 58, 92);
    pdf.text("ORDONNANCE MEDICALE", 105, 40, { align: "center" });

    // Bloc Informations Patient
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(220, 225, 230);
    pdf.roundedRect(15, 48, 180, 20, 1, 1, "FD");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("Patient(e) :", 20, 56);
    pdf.text("Date :", 20, 63);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${pName.toUpperCase()} ${pFile ? "(" + pFile + ")" : ""}`, 50, 56);
    pdf.text(`${presc.date || new Date().toISOString().split("T")[0]}`, 50, 63);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("N° Ordonnance :", 115, 56);
    pdf.text("Validite :", 115, 63);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${presc.prescriptionNumber || "ORD-" + presc.id}`, 145, 56);
    pdf.text(`${presc.validity || "3 mois"}`, 145, 63);

    // Section Traitements
    let curY = 76;
    pdf.setFillColor(248, 251, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(26, 58, 92);
    pdf.text("PRESCRIPTIONS MEDICAMENTEUSES", 20, curY + 5.5);
    curY += 14;

    const items = Array.isArray(presc.items) && presc.items.length > 0
      ? presc.items
      : [{ medication: "Traitement selon avis medical", posology: "Selon protocole", duration: "Selon prescription" }];

    items.forEach((item, idx) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(26, 58, 92);
      pdf.text(`${idx + 1}. ${item.medication || item.nom || "Medicament"}`, 22, curY);
      curY += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(60, 60, 60);
      pdf.text(`- Posologie : ${item.posology || item.posologie || "-"} | Duree : ${item.duration || item.duree || "-"}`, 25, curY);
      curY += 7;
    });

    if (presc.notes) {
      curY += 4;
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8.5);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Instructions : ${presc.notes}`, 22, curY);
    }

    // Signature
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(26, 58, 92);
    pdf.text("Le Medecin Traitant", 140, 240);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(clinicInfo.doctorName || "Dr N. BELBACHIR", 140, 246);

    return { pdf, filename: `${presc.prescriptionNumber || "Ordonnance"}_${pName.replace(/\s+/g, "_")}.pdf` };
  };

  // Prévisualisation de l'ordonnance dans la modale officielle (identique à l'admin panel)
  const handleViewPrescription = (presc) => {
    try {
      const pName = presc.patientName || (authenticatedPatient ? `${authenticatedPatient.lastName || ""} ${authenticatedPatient.firstName || ""}`.trim() : (patientName || "Patient"));
      let items = presc.items;
      if (typeof items === "string") {
        try {
          items = JSON.parse(items);
        } catch (e) {
          items = [];
        }
      }
      if (!Array.isArray(items) || items.length === 0) {
        items = [{ medication: "Traitement selon avis médical", posology: "Selon protocole", duration: "Selon prescription", renewable: "Non renouvelable" }];
      }
      setSelectedPrescription({
        ...presc,
        prescriptionNumber: presc.prescriptionNumber || `ORD-${presc.id || "001"}`,
        patientName: pName,
        date: presc.date || new Date().toISOString().split("T")[0],
        items: items,
      });
    } catch (err) {
      console.error("Erreur visualisation ordonnance :", err);
    }
  };

  // Génération et téléchargement de l'ordonnance en PDF
  // eslint-disable-next-line no-unused-vars
  const handleDownloadPrescription = (presc) => {
    try {
      const { pdf, filename } = createPrescriptionPdf(presc);
      pdf.save(filename);
    } catch (err) {
      console.error("Erreur generation ordonnance PDF :", err);
    }
  };

  // Création du PDF d'échographie
  const createEchographyPdf = (echo) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pName = authenticatedPatient
      ? `${authenticatedPatient.lastName || ""} ${authenticatedPatient.firstName || ""}`.trim()
      : (patientName || "Patient");
    const pFile = authenticatedPatient ? authenticatedPatient.fileNumber : "";

    // En-tête officiel Cabinet
    pdf.setDrawColor(26, 58, 92);
    pdf.setLineWidth(0.8);
    pdf.line(15, 28, 195, 28);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(26, 58, 92);
    pdf.text((clinicInfo.clinicName || "CABINET DE GYNECOLOGIE OBSTETRIQUE").toUpperCase(), 15, 14);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(45, 106, 159);
    pdf.text(clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA", 15, 19);

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(clinicInfo.specialty || "Medecin Specialiste en Gynecologie Obstetrique - Echographie", 15, 23);
    pdf.text(`${clinicInfo.address || "Cite 500 Logements, Es-Senia, Oran"} | Tel : ${clinicInfo.secretaryPhone || clinicInfo.phone || "0550 50 50 25"}`, 15, 27);

    // Titre
    pdf.setFillColor(245, 249, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(15, 33, 180, 11, 2, 2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(26, 58, 92);
    pdf.text("COMPTE-RENDU D'EXAMEN ECHOGRAPHIQUE", 105, 40, { align: "center" });

    // Bloc Informations Patient
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(220, 225, 230);
    pdf.roundedRect(15, 48, 180, 22, 1, 1, "FD");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("Nom & Prenom :", 20, 56);
    pdf.text("N Dossier :", 20, 63);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${pName.toUpperCase()}`, 55, 56);
    pdf.text(`${pFile || "DOS-" + (authenticatedPatient?.id || "")}`, 55, 63);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("Date d'examen :", 115, 56);
    pdf.text("Type examen :", 115, 63);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${echo.date || new Date().toISOString().split("T")[0]}`, 145, 56);
    pdf.text(`${echo.echoType || echo.title || "Echographie"}`, 145, 63);

    let curY = 76;

    const echoData = echo.echoData || (echo.ultrasoundReport?.morphology_details) || {};
    const hasBiom = echoData.bip || echoData.femur || echoData.pa || echo.bip || echo.femur;
    if (hasBiom) {
      pdf.setFillColor(248, 251, 255);
      pdf.setDrawColor(192, 211, 232);
      pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(26, 58, 92);
      pdf.text("BIOMETRIE FOETALE & MESURES", 20, curY + 5.5);
      curY += 13;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(40, 40, 40);
      const bText = [
        echoData.bip || echo.bip ? `BIP: ${echoData.bip || echo.bip} mm` : null,
        echoData.femur || echo.femur ? `LF: ${echoData.femur || echo.femur} mm` : null,
        echoData.pa || echo.pa ? `DAT/PA: ${echoData.pa || echo.pa} mm` : null,
        echoData.cc || echo.cc ? `PC/CC: ${echoData.cc || echo.cc} mm` : null,
      ].filter(Boolean).join("  |  ");
      if (bText) {
        pdf.text(bText, 20, curY);
        curY += 8;
      }
    }

    // Observations morphologiques
    pdf.setFillColor(248, 251, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(26, 58, 92);
    pdf.text("OBSERVATIONS MORPHOLOGIQUES", 20, curY + 5.5);
    curY += 13;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(30, 30, 30);
    const obs = echo.echoFindings || echo.examFindings || echo.notes || "Examen echographique sans anomalie morphologique decelable. Activite cardiaque et mouvements foetaux presents. Liquide amniotique en quantite normale.";
    const obsLines = pdf.splitTextToSize(obs, 170);
    pdf.text(obsLines, 20, curY);
    curY += obsLines.length * 5 + 6;

    // Conclusion
    pdf.setFillColor(248, 251, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(26, 58, 92);
    pdf.text("CONCLUSION MEDICALE", 20, curY + 5.5);
    curY += 13;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(26, 58, 92);
    const concl = echo.echoConclusion || echo.diagnosis || "Grossesse evolutive sans anomalie morphologique decelable.";
    const conclLines = pdf.splitTextToSize(concl, 170);
    pdf.text(conclLines, 20, curY);

    // Signature
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(26, 58, 92);
    pdf.text("Le Medecin Echographiste", 135, 240);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(clinicInfo.doctorName || "Dr N. BELBACHIR", 135, 246);

    return { pdf, filename: `Echographie_${(echo.title || "CR").replace(/\s+/g, "_")}_${pName.replace(/\s+/g, "_")}.pdf` };
  };

  // Prévisualisation du compte-rendu d'échographie dans la modale officielle (identique à l'admin panel)
  const handleViewEchography = (echo) => {
    try {
      if (echo.fileDataUrl || (echo.isDocument && echo.filePath)) {
        const fileSrc = echo.fileDataUrl || echo.filePath;
        const fType = (echo.fileType || "").toUpperCase();
        const isImg = fType.includes("IMAGE") || ["PNG", "JPG", "JPEG", "WEBP"].includes(fType) || (fileSrc && fileSrc.startsWith("data:image"));
        setPreviewingDoc({
          title: echo.title || "Compte-Rendu Échographique",
          category: "Imagerie & Radiologie",
          date: echo.date,
          author: echo.author || clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA",
          fileDataUrl: fileSrc,
          isImage: isImg,
          type: echo.fileType || (isImg ? "JPG" : "PDF"),
        });
        return;
      }

      const pName = authenticatedPatient
        ? `${authenticatedPatient.lastName || ""} ${authenticatedPatient.firstName || ""}`.trim()
        : (patientName || "Patiente");

      const consultObj = {
        id: echo.id || Date.now(),
        consultationNumber: echo.consultationNumber || `CS-${(echo.date || "2026-10-31").replace(/-/g, "")}-01`,
        patientName: pName,
        date: echo.date || new Date().toISOString().split("T")[0],
        reason: echo.title || echo.echoType || "Compte Rendu Échographique",
        echoFindings: echo.echoFindings,
        echoConclusion: echo.echoConclusion,
        diagnosis: echo.diagnosis || echo.echoConclusion || echo.echoFindings || "Examen échographique sans anomalie décelable.",
        recommendations: echo.recommendations,
        examFindings: echo.examFindings,
        echoData: echo.echoData || {},
        patientDetails: echo.patientDetails || {
          nom: authenticatedPatient?.lastName || pName,
          prenom: authenticatedPatient?.firstName || "",
          age: authenticatedPatient?.age ? `${authenticatedPatient.age} ans` : (authenticatedPatient?.dob ? `${new Date().getFullYear() - parseInt(authenticatedPatient.dob)} ans` : "-"),
          ddr: authenticatedPatient?.ddr || "-",
          termeDdr: authenticatedPatient?.terme || "-",
        },
        atcd: echo.atcd || {},
        calculated: echo.calculated || {},
        ...(echo.rawConsultation || {}),
      };

      setSelectedEchoConsultation(consultObj);
    } catch (err) {
      console.error("Erreur visualisation echographie :", err);
    }
  };

  // Téléchargement du compte-rendu d'échographie en PDF
  // eslint-disable-next-line no-unused-vars
  const handleDownloadEchography = (echo) => {
    try {
      if (echo.fileDataUrl) {
        const link = document.createElement("a");
        link.href = echo.fileDataUrl;
        link.download = `${echo.title || "Echographie"}.pdf`;
        link.click();
        return;
      }
      const { pdf, filename } = createEchographyPdf(echo);
      pdf.save(filename);
    } catch (err) {
      console.error("Erreur generation echographie PDF :", err);
    }
  };

  // Création du PDF de facture
  const createInvoicePdf = (inv) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pName = authenticatedPatient
      ? `${authenticatedPatient.lastName || ""} ${authenticatedPatient.firstName || ""}`.trim()
      : (inv.patientName || patientName || "Patient");
    const pFile = authenticatedPatient ? authenticatedPatient.fileNumber : (inv.fileNumber || "");

    // En-tête officiel Cabinet
    pdf.setDrawColor(26, 58, 92);
    pdf.setLineWidth(0.8);
    pdf.line(15, 28, 195, 28);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(26, 58, 92);
    pdf.text((clinicInfo.clinicName || "CABINET DE GYNECOLOGIE OBSTETRIQUE").toUpperCase(), 15, 14);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(45, 106, 159);
    pdf.text(clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA", 15, 19);

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(clinicInfo.specialty || "Medecin Specialiste en Gynecologie Obstetrique - Echographie", 15, 23);
    pdf.text(`${clinicInfo.address || "Cite 500 Logements, Es-Senia, Oran"} | Tel : ${clinicInfo.secretaryPhone || clinicInfo.phone || "0550 50 50 25"}`, 15, 27);

    // Titre
    pdf.setFillColor(245, 249, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(15, 33, 180, 11, 2, 2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(26, 58, 92);
    pdf.text("NOTE D'HONORAIRES / FACTURE MEDICALE", 105, 40, { align: "center" });

    // Bloc Informations Patient
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(220, 225, 230);
    pdf.roundedRect(15, 48, 180, 22, 1, 1, "FD");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("Patient(e) :", 20, 56);
    pdf.text("N Dossier :", 20, 63);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${pName.toUpperCase()}`, 55, 56);
    pdf.text(`${pFile || "-"}`, 55, 63);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("N Facture :", 115, 56);
    pdf.text("Date d'emission :", 115, 63);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${inv.invoiceNumber || "FAC-" + inv.id}`, 145, 56);
    pdf.text(`${inv.date || new Date().toISOString().split("T")[0]}`, 145, 63);

    // Prestations
    let curY = 76;
    pdf.setFillColor(26, 58, 92);
    pdf.rect(15, curY, 180, 9, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text("DESIGNATION DE L'ACTE MEDICAL", 20, curY + 6);
    pdf.text("MONTANT (DA)", 190, curY + 6, { align: "right" });
    curY += 9;

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(220, 225, 230);
    pdf.rect(15, curY, 180, 16, "FD");

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(30, 30, 30);
    const cleanDesc = (inv.actDescription || "Consultation medicale & Echographie")
      .replace(/[\u202F\u00A0\u2007\u2009]/g, " ");
    pdf.text(cleanDesc, 20, curY + 7);

    pdf.setFont("helvetica", "bold");
    const numAmount = Math.round(Number(inv.amount || inv.patientRemaining || 0));
    const formattedAmount = numAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " DA";
    pdf.text(formattedAmount, 190, curY + 7, { align: "right" });
    curY += 24;

    // Total
    pdf.setFillColor(245, 249, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(110, curY, 85, 20, 1, 1, "FD");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("Total Honoraires :", 115, curY + 7);
    pdf.text("Reglement :", 115, curY + 14);

    pdf.setFont("helvetica", "bold");
    pdf.text(formattedAmount, 190, curY + 7, { align: "right" });
    pdf.setFont("helvetica", "normal");
    const cleanPayment = (inv.paymentMethod || "Especes").replace(/[\u202F\u00A0\u2007\u2009]/g, " ");
    pdf.text(cleanPayment, 190, curY + 14, { align: "right" });

    // Signature
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(26, 58, 92);
    pdf.text("Cachet & Signature", 140, 230);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(clinicInfo.doctorName || "Dr N. BELBACHIR", 140, 236);

    return { pdf, filename: `${inv.invoiceNumber || "Facture"}_${pName.replace(/\s+/g, "_")}.pdf` };
  };

  // Prévisualisation de la facture dans la modale format Ticket 80 mm (identique à l'admin panel)
  const handleViewInvoice = (inv) => {
    try {
      const pName = inv.patientName || (authenticatedPatient ? `${authenticatedPatient.lastName || ""} ${authenticatedPatient.firstName || ""}`.trim() : (patientName || "Patient"));
      setPreviewInvoice({
        ...inv,
        patientName: pName,
        invoiceNumber: inv.invoiceNumber || `FAC-${inv.id || "001"}`,
        date: inv.date || new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Erreur visualisation facture :", err);
    }
  };

  // Téléchargement de la facture en PDF
  // eslint-disable-next-line no-unused-vars
  const handleDownloadInvoice = (inv) => {
    try {
      const { pdf, filename } = createInvoicePdf(inv);
      pdf.save(filename);
    } catch (err) {
      console.error("Erreur generation facture PDF :", err);
    }
  };

  // Création du PDF de document médical
  const createDocumentPdf = (doc) => {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pName = authenticatedPatient
      ? `${authenticatedPatient.lastName || ""} ${authenticatedPatient.firstName || ""}`.trim()
      : (patientName || "Patient");
    const pFile = authenticatedPatient ? authenticatedPatient.fileNumber : "";

    // En-tête officiel Cabinet
    pdf.setDrawColor(26, 58, 92);
    pdf.setLineWidth(0.8);
    pdf.line(15, 28, 195, 28);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(26, 58, 92);
    pdf.text((clinicInfo.clinicName || "CABINET DE GYNECOLOGIE OBSTETRIQUE").toUpperCase(), 15, 14);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(45, 106, 159);
    pdf.text(clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA", 15, 19);

    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(clinicInfo.specialty || "Medecin Specialiste en Gynecologie Obstetrique - Echographie", 15, 23);
    pdf.text(`${clinicInfo.address || "Cite 500 Logements, Es-Senia, Oran"} | Tel : ${clinicInfo.secretaryPhone || clinicInfo.phone || "0550 50 50 25"}`, 15, 27);

    // Titre
    pdf.setFillColor(245, 249, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(15, 33, 180, 11, 2, 2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(26, 58, 92);
    pdf.text((doc.title || "DOCUMENT MEDICAL").toUpperCase(), 105, 40, { align: "center" });

    // Bloc Informations Patient
    pdf.setFillColor(250, 250, 250);
    pdf.setDrawColor(220, 225, 230);
    pdf.roundedRect(15, 48, 180, 20, 1, 1, "FD");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("Patient(e) :", 20, 56);
    pdf.text("Date du document :", 20, 63);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${pName.toUpperCase()} ${pFile ? "(" + pFile + ")" : ""}`, 55, 56);
    pdf.text(`${doc.date || new Date().toISOString().split("T")[0]}`, 55, 63);

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(26, 58, 92);
    pdf.text("Categorie :", 115, 56);
    pdf.text("Praticien :", 115, 63);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(30, 30, 30);
    pdf.text(`${doc.category || "Medical"}`, 145, 56);
    pdf.text(`${doc.author || clinicInfo.doctorName || "Dr N. BELBACHIR"}`, 145, 63);

    // Contenu
    pdf.setFillColor(248, 251, 255);
    pdf.setDrawColor(192, 211, 232);
    pdf.roundedRect(15, 75, 180, 8, 1, 1, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(26, 58, 92);
    pdf.text("DETAILS & OBSERVATIONS DU DOCUMENT", 20, 80.5);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(30, 30, 30);
    const content = doc.notes || doc.description || "Document medical officiel delivre par le Cabinet Medical du Dr N. BELBACHIR OULD HENNIA.";
    const contentLines = pdf.splitTextToSize(content, 170);
    pdf.text(contentLines, 20, 92);

    // Signature
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9.5);
    pdf.setTextColor(26, 58, 92);
    pdf.text("Le Medecin Traitant", 140, 240);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(80, 80, 80);
    pdf.text(clinicInfo.doctorName || "Dr N. BELBACHIR", 140, 246);

    return { pdf, filename: `${(doc.title || "Document").replace(/\s+/g, "_")}_${pName.replace(/\s+/g, "_")}.pdf` };
  };

  // Gestion du dépôt de documents ou de textes par le patient connecté
  const handleSelectUploadFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (taille maximale : 15 Mo).");
      return;
    }

    setUploadDocFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadDocFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setUploadDocFilePreview(null);
    }
  };

  const handleRemoveUploadFile = () => {
    setUploadDocFile(null);
    setUploadDocFilePreview(null);
    if (uploadFileInputRef.current) {
      uploadFileInputRef.current.value = "";
    }
  };

  const handlePatientDocSubmit = async (e) => {
    e.preventDefault();
    if (!authenticatedPatient || !authenticatedPatient.id) {
      alert("Veuillez vous connecter pour déposer un document.");
      return;
    }

    const trimmedText = uploadDocText.trim();
    if (!trimmedText && !uploadDocFile) {
      setUploadDocError("Veuillez saisir un texte explicatif ou joindre un document.");
      return;
    }

    setUploadDocSubmitting(true);
    setUploadDocError("");
    setUploadDocSuccess("");

    try {
      let fileBase64 = null;
      let fileSizeStr = null;
      let fileTypeStr = "TEXTE";

      if (uploadDocFile) {
        fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(uploadDocFile);
        });

        const ext = uploadDocFile.name.split(".").pop()?.toUpperCase() || "DOCUMENT";
        fileTypeStr = ext;
        fileSizeStr =
          uploadDocFile.size > 1048576
            ? `${(uploadDocFile.size / 1048576).toFixed(1)} Mo`
            : `${Math.round(uploadDocFile.size / 1024)} Ko`;
      } else {
        fileSizeStr = `${trimmedText.length} car.`;
      }

      const docTitle =
        uploadDocTitle.trim() ||
        (trimmedText
          ? (trimmedText.length > 40 ? trimmedText.slice(0, 40) + "..." : trimmedText)
          : (uploadDocFile ? uploadDocFile.name.replace(/\.[^/.]+$/, "") : "Document transmis"));

      const payload = {
        patientId: authenticatedPatient.id,
        title: docTitle,
        notes: trimmedText || null,
        category: uploadDocCategory || "Autre",
        author: `Patient : ${authenticatedPatient.firstName || ""} ${authenticatedPatient.lastName || ""}`.trim(),
        filePath: fileBase64,
        fileType: fileTypeStr,
        fileSize: fileSizeStr,
        status: "Transmis par le patient",
        date: new Date().toISOString().split("T")[0],
      };

      const resp = await fetch(getApiUrl("documents.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await resp.json();

      if (json.status === "success") {
        setUploadDocSuccess("Votre document / message a été transmis avec succès et enregistré dans votre dossier !");
        setUploadDocTitle("");
        setUploadDocText("");
        setUploadDocCategory("Autre");
        handleRemoveUploadFile();

        // Recharger immédiatement les documents du patient depuis MySQL
        await loadPatientMedicalData(authenticatedPatient);
        try {
          window.dispatchEvent(new CustomEvent("portal_docs_updated"));
        } catch (e) {}

        setTimeout(() => {
          setUploadDocSuccess("");
        }, 5000);
      } else {
        setUploadDocError(json.message || "Erreur lors de l'enregistrement du document.");
      }
    } catch (err) {
      console.error("Erreur dépot document :", err);
      setUploadDocError("Erreur réseau ou connexion au serveur impossible.");
    } finally {
      setUploadDocSubmitting(false);
    }
  };

  // Prévisualisation d'un document médical dans la modale (identique à l'admin panel)
  const handleViewDocument = (doc) => {
    try {
      const fileSrc = doc.fileDataUrl || doc.filePath;
      const fType = (doc.fileType || doc.type || "").toUpperCase();
      const isImg =
        fType.includes("IMAGE") ||
        ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(fType) ||
        (fileSrc && fileSrc.startsWith("data:image")) ||
        /\.(jpe?g|png|webp|gif)(\?.*)?$/i.test(fileSrc || "");

      setPreviewingDoc({
        title: doc.title || "Document Médical",
        notes: doc.notes || "",
        category: doc.category || "Document Médical",
        date: doc.date || doc.doc_date || new Date().toISOString().split("T")[0],
        author: doc.author || clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA",
        fileDataUrl: fileSrc,
        isImage: isImg,
        type: fType || (isImg ? "JPG" : "PDF"),
      });
    } catch (err) {
      console.error("Erreur visualisation document :", err);
    }
  };

  // Téléchargement d'un document médical (fichier joint ou PDF généré)
  // eslint-disable-next-line no-unused-vars
  const handleDownloadDocument = async (doc) => {
    try {
      if (doc.fileDataUrl || doc.filePath) {
        const fileSrc = doc.fileDataUrl || doc.filePath;
        const fType = (doc.fileType || "").toLowerCase();
        const ext = fType.includes("png")
          ? "png"
          : (fType.includes("jp") ? "jpg" : (fType.includes("webp") ? "webp" : "pdf"));
        const filename = `${(doc.title || "document").replace(/[^a-zA-Z0-9_-]/g, "_")}.${ext}`;

        if (fileSrc.startsWith("http://") || fileSrc.startsWith("https://")) {
          try {
            const resp = await fetch(fileSrc);
            const blob = await resp.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
            return;
          } catch (e) {
            // fallback classique si fetch échoue
          }
        }

        const link = document.createElement("a");
        link.href = fileSrc;
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const { pdf, filename } = createDocumentPdf(doc);
      pdf.save(filename);
    } catch (err) {
      console.error("Erreur telechargement document :", err);
    }
  };

  const handlePatientLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const cleanInputPhone = (patientPhone || "").replace(/\D/g, "");
    const cleanInputPwd = (patientPassword || "").trim().toLowerCase();

    if (!cleanInputPhone) {
      setAuthError("Veuillez saisir votre numéro de téléphone.");
      return;
    }
    if (!cleanInputPwd) {
      setAuthError("Veuillez saisir votre mot de passe (indiqué sur votre ticket de caisse).");
      return;
    }

    try {
      setAuthLoading(true);
      const resp = await fetch(getApiUrl("patients.php"));
      const json = await resp.json();
      const patientsList = json && json.data ? json.data : [];

      const matched = patientsList.find((p) => {
        const pDigits = (p.phone || "").replace(/\D/g, "");
        const pPwd = (p.password || "").trim().toLowerCase();
        const phoneMatch =
          pDigits === cleanInputPhone ||
          (pDigits.length >= 8 &&
            cleanInputPhone.length >= 8 &&
            (pDigits.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(pDigits)));
        return phoneMatch && pPwd === cleanInputPwd;
      });

      if (matched) {
        setAuthenticatedPatient(matched);
        const fullName = `${matched.firstName} ${matched.lastName}`.trim();
        setPatientName(fullName);
        if (matched.email) {
          setPatientEmail(matched.email);
        }
        localStorage.setItem("cabinet_patient_auth", JSON.stringify(matched));
        setAuthSuccess(`Bienvenue ${fullName} ! Vous êtes connecté(e) à votre dossier.`);

        try {
          localStorage.removeItem("cabinet_patient_guest_photo");
        } catch (e) {}

        // Charger factures, ordonnances et échographies
        loadPatientMedicalData(matched);

        // Charger les rendez-vous du patient depuis MySQL
        try {
          const aptsResp = await fetch(getApiUrl("appointments.php"));
          const aptsJson = await aptsResp.json();
          if (aptsJson && aptsJson.data) {
            const myApts = aptsJson.data.filter((a) => {
              const aDigits = (a.phone || "").replace(/\D/g, "");
              return (
                (a.patientId && Number(a.patientId) === Number(matched.id)) ||
                (aDigits && aDigits === cleanInputPhone) ||
                (a.patientName &&
                  matched.lastName &&
                  a.patientName.toLowerCase().includes(matched.lastName.toLowerCase()))
              );
            });
            if (myApts.length > 0) {
              setPatientAppointments(myApts);
              localStorage.setItem("cabinet_client_appointments", JSON.stringify(myApts));
            }
          }
        } catch (err) {
          console.warn("Erreur chargement rendez-vous :", err);
        }
      } else {
        setAuthError(
          "Numéro de téléphone ou mot de passe incorrect. Le mot de passe est inscrit sur votre ticket de caisse."
        );
      }
    } catch (err) {
      console.error("Erreur connexion patient :", err);
      setAuthError("Impossible de contacter le serveur. Veuillez réessayer.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePatientLogout = () => {
    setAuthenticatedPatient(null);
    setPatientName("");
    setPatientPhone("");
    setPatientPassword("");
    setPatientEmail("");
    setAuthSuccess("");
    setAuthError("");
    setPatientInvoices([]);
    setPatientPrescriptions([]);
    setPatientEchographies([]);
    setPatientDocuments([]);
    localStorage.removeItem("cabinet_patient_auth");
  };

  const consultationReason = "Consultation médicale";
  const consultationPrice = 2500;

  // Confirmation state
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Assistant IA tiroir
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChat, setAiChat] = useState(() => [
    {
      sender: "ai",
      text: "Bonjour ! Je suis l'assistant médical virtuel. Comment puis-je vous aider dans votre prise de rendez-vous aujourd'hui ?",
    },
  ]);

  // Gestion de la confirmation du RDV
  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!patientName.trim() || !patientPhone.trim()) {
      alert("Veuillez renseigner votre nom complet et votre numéro de téléphone.");
      return;
    }

    if (isClosedDay(selectedDay, selectedMonth, selectedYear)) {
      alert("Le cabinet est fermé à cette date. Veuillez sélectionner un autre jour disponible.");
      return;
    }
    if (isDayPast(selectedDay) || isSlotPast(selectedTime, selectedDay)) {
      alert("Ce créneau horaire est déjà passé. Veuillez sélectionner un horaire futur disponible.");
      return;
    }
    if (occupiedSlots.includes(selectedTime)) {
      alert("Ce créneau horaire est déjà réservé et bloqué par le cabinet. Veuillez choisir un autre créneau disponible.");
      return;
    }

    const ticketNumber = getTicketNumber(selectedTime);

    const dayStr = String(selectedDay).padStart(2, "0");
    const monthStr = String(selectedMonth + 1).padStart(2, "0");

    const bookingData = {
      id: "RDV-" + Math.floor(1000 + Math.random() * 9000),
      ticketNumber: ticketNumber, // Numéro de ticket / passage journalier (ex: 1 pour 09:00, 2 pour 09:30...)
      doctorName: clinicInfo.doctorName || "Dr. N. BELBACHIR OULD HENNIA",
      specialty: clinicInfo.specialty || "Gynécologie Obstétrique & Échographie",
      date: `${selectedDay} ${MONTH_NAMES[selectedMonth]} ${selectedYear}`,
      isoDate: `${selectedYear}-${monthStr}-${dayStr}`,
      time: selectedTime,
      patientName: patientName.trim(),
      patientPhone: patientPhone.trim(),
      patientEmail: patientEmail.trim(),
      email: patientEmail.trim(),
      consultationType: consultationReason,
      reason: consultationReason,
      status: "En attente",
      price: `${Number(consultationPrice).toLocaleString("fr-FR")} DA`,
      location: clinicInfo.address || "Haï Essedikia, Avenue Seghier Benali, Oran",
      createdAt: new Date().toISOString(),
    };

    // Synchronisation en direct avec la Base de Données MySQL (table appointments & patients)
    try {
      const resp = await fetch(getApiUrl("appointments.php"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: authenticatedPatient && authenticatedPatient.id ? authenticatedPatient.id : null,
          patientName: patientName.trim(),
          patientPhone: patientPhone.trim(),
          patientEmail: patientEmail.trim(),
          email: patientEmail.trim(),
          date: `${selectedYear}-${monthStr}-${dayStr}`,
          time: selectedTime,
          duration: "30 min",
          reason: consultationReason,
          consultationType: consultationReason,
          price: consultationPrice,
          status: "En attente",
          notes: `[Ticket N° ${ticketNumber}] Réservation en ligne depuis l'application patient`,
        }),
      });
      const resJson = await resp.json();
      if (resJson && resJson.status === "success" && resJson.data?.id) {
        bookingData.id = "RDV-" + resJson.data.id;
      }
    } catch (err) {
      console.warn("Erreur enregistrement rendez-vous MySQL :", err);
    }

    // Sauvegarde locale
    try {
      const existing = JSON.parse(localStorage.getItem("cabinet_client_appointments") || "[]");
      existing.unshift(bookingData);
      localStorage.setItem("cabinet_client_appointments", JSON.stringify(existing));
      localStorage.setItem("new_appointment_booked", String(Date.now()));
      setPatientAppointments(existing);
    } catch (err) {
      console.error(err);
    }

    // Animation Confetti festive
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0284c7", "#38bdf8", "#0ea5e9", "#ffffff"],
      });
    } catch (e) {
      // fallback
    }

    setConfirmedBooking(bookingData);
    setView("confirmed");
  };

  // Envoi de message à l'assistant IA
  const handleSendAiMessage = (e) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    const userText = aiQuestion.trim();
    const newHistory = [...aiChat, { sender: "user", text: userText }];
    setAiChat(newHistory);
    setAiQuestion("");

    // Réponse intelligente simulée
    setTimeout(() => {
      let reply = `Pour préparer votre consultation avec le ${clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA"}, veuillez apporter vos anciennes échographies, bilans sanguins récents et votre carnet de santé.`;
      const lower = userText.toLowerCase();

      if (lower.includes("tarif") || lower.includes("prix") || lower.includes("cout")) {
        reply = "La consultation avec examen clinique est assurée au cabinet. Des examens et échographies spécialisées sont également réalisés.";
      } else if (lower.includes("adresse") || lower.includes("où") || lower.includes("lieu") || lower.includes("localisation")) {
        reply = `Le cabinet est situé à ${clinicInfo.address || "Haï Essedikia, Avenue Seghier Benali, Oran"}. Le secrétariat est joignable au ${clinicInfo.secretaryPhone || clinicInfo.phone || "0560 06 74 66"}.`;
      } else if (lower.includes("urgence") || lower.includes("douleur") || lower.includes("urgent")) {
        reply = `En cas d'urgence médicale aiguë, contactez directement le cabinet au ${clinicInfo.secretaryPhone || clinicInfo.phone || "0560 06 74 66"} ou rendez-vous au service d'urgence le plus proche.`;
      } else if (lower.includes("grossesse") || lower.includes("echo") || lower.includes("bébé")) {
        reply = "Le cabinet est équipé d'un appareil d'échographie haute définition avec Doppler couleur et rendu 3D/4D pour un suivi optimal.";
      }

      setAiChat((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 600);
  };

  return (
    <div className="patient-portal-page">
      <div className="app-device-wrapper">

      {/* Contenu Déroulant */}
      <div className="screen-scroll">
        {/* =================================================================== */}
        {/* VUE 1 : PRÉSENTATION DU DOCTEUR AVEC GRAND BOUTON DE RÉSERVATION    */}
        {/* =================================================================== */}
        {view === "doctor" && (
          <div className="fade-in-up">

            {/* Titre Principal centré */}
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <h2
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  letterSpacing: "-0.5px",
                  lineHeight: "1.2",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                {clinicInfo.doctorName || "Dr. N. BELBACHIR OULD HENNIA"}
              </h2>
              <p style={{ color: "#0284c7", fontSize: "13.5px", fontWeight: "700", marginTop: "6px", marginBottom: 0 }}>
                {clinicInfo.specialty || "Spécialiste Gynécologie Obstétrique & Échographie"}
              </p>
              {clinicInfo.doctorNameAr && (
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "3px", marginBottom: 0 }}>
                  {clinicInfo.doctorNameAr}
                </p>
              )}
            </div>

            {/* Carte Portrait du Médecin (Cliquable pour ouvrir le calendrier de réservation) */}
            <div
              className="doctor-hero-card"
              onClick={() => setView("schedule")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setView("schedule");
                }
              }}
              title="Cliquer pour afficher le calendrier de réservation"
              style={{ cursor: "pointer" }}
            >
              <div className="doctor-img-container">
                <img
                  src={clinicInfo.doctorPhoto || "/doctor.jpg"}
                  alt={clinicInfo.doctorName || "Dr. N. BELBACHIR OULD HENNIA"}
                  className="doctor-img"
                  onError={(e) => {
                    // Fallback élégant si l'image est indisponible
                    e.target.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop";
                  }}
                />
                <div className="doctor-img-overlay"></div>
              </div>
            </div>

            {/* Présentation du Cabinet (En environ 10 lignes) */}
            <div className="glass-panel" style={{ padding: "18px", marginBottom: "20px" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.65",
                  margin: 0,
                  whiteSpace: "pre-line",
                }}
              >
                {clinicInfo.aboutText || "Cabinet médical de gynécologie obstétrique et d'échographie du Dr N. BELBACHIR OULD HENNIA, situé à Haï Essedikia (Avenue Seghier Benali) à Oran."}
              </p>
            </div>

            {/* GRAND BOUTON POUR RÉSERVER (Demandé explicitement par l'utilisateur) */}
            <button
              className="btn-primary-mint"
              onClick={() => setView("schedule")}
              style={{ padding: "18px 24px", fontSize: "16px", marginBottom: "16px" }}
            >
              <Calendar size={20} />
              <span>Réserver un Rendez-vous</span>
              <ArrowRight size={18} style={{ marginLeft: "auto" }} />
            </button>

            {/* MES RENDEZ-VOUS A VENIR SUR LA PAGE D'ACCUEIL (Affiches uniquement s'il y a des rendez-vous) */}
            {homeAppointments && homeAppointments.length > 0 && (
              <div
                className="glass-panel"
                style={{
                  padding: "8px 14px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ marginBottom: openSections.homeAppointments ? "10px" : "0px" }}>
                  <div
                    onClick={() => toggleSection("homeAppointments")}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: openSections.homeAppointments ? "10px" : "0px",
                      cursor: "pointer",
                      userSelect: "none",
                      padding: "8px 4px",
                      borderRadius: "10px",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(2, 132, 199, 0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Calendar size={15} color="var(--accent-mint)" />
                      <span>Mes Rendez-vous ({homeAppointments.length})</span>
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Voulez-vous masquer vos rendez-vous de la page d'accueil ? (Ils resteront disponibles dans votre Profil)")) {
                            const updated = patientAppointments.map((a) => ({ ...a, hiddenFromHome: true }));
                            setPatientAppointments(updated);
                            localStorage.setItem("cabinet_client_appointments", JSON.stringify(updated));
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(239, 68, 68, 0.85)",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Effacer
                      </button>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: "rgba(2, 132, 199, 0.08)",
                          color: "var(--accent-mint)",
                        }}
                      >
                        {openSections.homeAppointments ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </div>
                    </div>
                  </div>

                  {openSections.homeAppointments && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "6px" }}>
                      {homeAppointments.map((apt, index) => (
                        <div
                          key={apt.id || index}
                          style={{
                            padding: "13px 14px",
                            background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
                            border: "1px solid rgba(2, 132, 199, 0.18)",
                            borderLeft: "3px solid var(--accent-mint)",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(2, 132, 199, 0.05)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "var(--accent-mint)" }}>
                                {apt.id || "RDV"}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(2, 132, 199, 0.1)",
                                  color: "var(--accent-mint)",
                                  fontWeight: "800",
                                  border: "1px solid rgba(2, 132, 199, 0.25)",
                                }}
                              >
                                Ticket #{apt.ticketNumber || getTicketNumber(apt.time)}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "10.5px",
                                padding: "3px 9px",
                                borderRadius: "999px",
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "#059669",
                                border: "1px solid rgba(16, 185, 129, 0.25)",
                                fontWeight: "700",
                              }}
                            >
                              {apt.status || "Confirmé"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Calendar size={13} color="var(--accent-mint)" />
                              {apt.date}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={13} color="var(--accent-mint)" />
                              {apt.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* VUE 2 : CALENDRIER DE RÉSERVATION (Exactement comme la capture)     */}
        {/* =================================================================== */}
        {view === "schedule" && (
          <div className="fade-in-up">
            {/* Top Bar avec retour */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <button
                className="btn-icon-circle"
                onClick={() => setView("doctor")}
                title="Retour à la présentation"
              >
                <ChevronLeft size={22} />
              </button>
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "var(--text-primary)",
                  }}
                >
                  {clinicInfo.doctorName || "Dr. N. BELBACHIR"}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    color: "var(--accent-mint)",
                    fontWeight: "600",
                  }}
                >
                  {clinicInfo.specialty || "Gynécologie Obstétrique"}
                </span>
              </div>
              <div style={{ width: "40px" }} />
            </div>



            {/* SECTION SCHEDULE / CALENDRIER DYNAMIQUE */}
            <div className="glass-panel" style={{ padding: "18px 16px", marginBottom: "16px" }}>
              {/* Zone Swipeable entre les mois */}
              <div
                className="calendar-month-swipe-wrapper"
                onTouchStart={handleMonthTouchStart}
                onTouchEnd={handleMonthTouchEnd}
                onMouseDown={handleMonthTouchStart}
                onMouseUp={handleMonthTouchEnd}
                title="Glissez vers la gauche ou la droite pour changer de mois"
              >
                <div className="schedule-header">
                  <div className="schedule-title">Calendrier</div>
                  <div className="schedule-month-nav" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      disabled={!canGoPrevMonth}
                      title={canGoPrevMonth ? "Mois précédent" : "Impossible de réserver dans le passé"}
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: canGoPrevMonth ? "var(--text-primary)" : "rgba(255, 255, 255, 0.2)",
                        cursor: canGoPrevMonth ? "pointer" : "not-allowed",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <span style={{ minWidth: "115px", textAlign: "center", fontWeight: "700", color: "var(--text-primary)", fontSize: "13px" }}>
                      {MONTH_NAMES[calendarMonth]} {calendarYear}
                    </span>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      title="Mois suivant"
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        border: "1px solid rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        width: "28px",
                        height: "28px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* En-tête des jours de la semaine en français : L M M J V S D */}
                <div className="calendar-weekdays">
                  {[
                    { l: "L", title: "Lundi", idx: 1 },
                    { l: "M", title: "Mardi", idx: 2 },
                    { l: "M", title: "Mercredi", idx: 3 },
                    { l: "J", title: "Jeudi", idx: 4 },
                    { l: "V", title: "Vendredi", idx: 5 },
                    { l: "S", title: "Samedi", idx: 6 },
                    { l: "D", title: "Dimanche", idx: 0 },
                  ].map((w) => {
                    const closed = isWeekdayClosed(w.idx);
                    return (
                      <span
                        key={w.title}
                        title={closed ? `${w.title} (Cabinet fermé)` : w.title}
                        style={closed ? { color: "rgba(239, 68, 68, 0.8)", fontWeight: "700" } : undefined}
                      >
                        {w.l}
                      </span>
                    );
                  })}
                </div>

                {/* Grille dynamique du calendrier selon le mois et l'année avec animation fluide */}
                <div
                  key={`${calendarYear}-${calendarMonth}`}
                  className={`calendar-grid ${monthSlideDirection === "left" ? "slots-slide-from-right" : "slots-slide-from-left"}`}
                >
                  {/* Jours de fin du mois précédent */}
                  {leadingPaddingDays.map((padDay) => (
                    <div key={`prev-${padDay}`} className="calendar-day-cell" style={{ opacity: 0.15, cursor: "not-allowed" }}>
                      {padDay}
                    </div>
                  ))}

                  {/* Jours du mois sélectionné */}
                  {currentMonthDays.map((d) => {
                    const isPast = isDayPast(d, calendarMonth, calendarYear);
                    const isToday =
                      d === now.getDate() &&
                      calendarMonth === now.getMonth() &&
                      calendarYear === now.getFullYear();
                    const isDayFriday = isFriday(d, calendarMonth, calendarYear);
                    const closedException = getClosedDateInfo(d, calendarMonth, calendarYear);
                    const isAvailable = !isPast && !isDayFriday && (!isToday || hasFutureSlotsToday);
                    const isSelected =
                      selectedDay === d &&
                      selectedMonth === calendarMonth &&
                      selectedYear === calendarYear;

                    let cellClass = "calendar-day-cell";
                    let cellTitle = "";
                    if (isSelected) {
                      cellClass += " available selected";
                      cellTitle = `Sélectionné : ${d} ${MONTH_NAMES[calendarMonth]} ${calendarYear}`;
                    } else if (isAvailable) {
                      cellClass += " available";
                      cellTitle = isToday
                        ? `Aujourd'hui (${d} ${MONTH_NAMES[calendarMonth]}) - Créneaux disponibles`
                        : `${d} ${MONTH_NAMES[calendarMonth]} ${calendarYear} (Disponible)`;
                    } else if (isPast) {
                      cellClass += " past";
                      cellTitle = `${d} ${MONTH_NAMES[calendarMonth]} ${calendarYear} (Passé - non réservable)`;
                    } else if (isDayFriday) {
                      cellClass += " closed";
                      cellTitle = `${d} ${MONTH_NAMES[calendarMonth]} ${calendarYear} (Cabinet fermé${closedException?.reason ? ` : ${closedException.reason}` : ""})`;
                    } else if (isToday && !hasFutureSlotsToday) {
                      cellClass += " past";
                      cellTitle = `Aujourd'hui (${d} ${MONTH_NAMES[calendarMonth]}) : Plus aucun créneau disponible`;
                    }

                    return (
                      <div
                        key={`curr-${d}`}
                        className={cellClass}
                        title={cellTitle}
                        onClick={isAvailable ? () => handleSelectDay(d) : undefined}
                      >
                        {d}
                      </div>
                    );
                  })}

                  {/* Jours de début du mois suivant */}
                  {trailingPaddingDays.map((padDay) => (
                    <div key={`next-${padDay}`} className="calendar-day-cell" style={{ opacity: 0.15, cursor: "not-allowed" }}>
                      {padDay}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone Swipeable entre Matin et Après-midi */}
              <div
                className="slots-swipe-wrapper"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                title="Glissez vers la gauche ou la droite pour basculer entre Matin et Après-midi"
              >
                {/* Sélecteur Période : Matin ou Après-midi */}
                <div
                  style={{
                    display: "flex",
                    background: "rgba(255, 255, 255, 0.04)",
                    borderRadius: "14px",
                    padding: "4px",
                    marginTop: "16px",
                    marginBottom: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    gap: "6px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSwitchPeriod("matin")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 8px",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: timePeriod === "matin" ? "800" : "600",
                      fontSize: "12.5px",
                      transition: "all 0.25s ease",
                      background: timePeriod === "matin" ? "#0284c7" : "transparent",
                      color: timePeriod === "matin" ? "#ffffff" : "var(--text-secondary)",
                      boxShadow: timePeriod === "matin" ? "0 4px 15px rgba(2, 132, 199, 0.35)" : "none",
                    }}
                  >
                    <Sun size={15} color={timePeriod === "matin" ? "#ffffff" : "#eab308"} />
                    <span>Matin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchPeriod("soir")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 8px",
                      borderRadius: "10px",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: timePeriod === "soir" ? "800" : "600",
                      fontSize: "12.5px",
                      transition: "all 0.25s ease",
                      background: timePeriod === "soir" ? "#0284c7" : "transparent",
                      color: timePeriod === "soir" ? "#ffffff" : "var(--text-secondary)",
                      boxShadow: timePeriod === "soir" ? "0 4px 15px rgba(2, 132, 199, 0.35)" : "none",
                    }}
                  >
                    <Sunset size={15} color={timePeriod === "soir" ? "#ffffff" : "#f59e0b"} />
                    <span>Après-midi</span>
                  </button>
                </div>

                {/* Contenu animé lors du Swipe */}
                <div
                  key={timePeriod}
                  className={slideDirection === "left" ? "slots-slide-from-right" : "slots-slide-from-left"}
                >
                  {/* Titre des Créneaux du Matin ou du Soir */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                      }}
                    >
                      Créneaux ({isTodaySelected ? `Aujourd'hui, ${selectedDay}` : `${selectedDay} ${MONTH_NAMES[selectedMonth]}`}) :
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--accent-mint)",
                        fontWeight: "700",
                      }}
                    >
                      {timePeriod === "matin" ? "Matin" : "Après-midi"}
                    </span>
                  </div>

                  {/* Grille des créneaux horaires avec blocage des heures passées */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    {(timePeriod === "matin" ? morningSlots : eveningSlots).map((slot) => {
                      const isPast = isSlotPast(slot, selectedDay, selectedMonth, selectedYear);
                      const isBooked = occupiedSlots.includes(slot);
                      const isDisabled = isPast || isBooked;
                      const isSelected = selectedTime === slot && !isDisabled;

                      return (
                        <div
                          key={slot}
                          className={`time-slot-pill ${isDisabled ? "disabled" : isSelected ? "selected" : ""}`}
                          onClick={!isDisabled ? () => setSelectedTime(slot) : undefined}
                          style={
                            isBooked && !isPast
                              ? {
                                  opacity: 0.6,
                                  cursor: "not-allowed",
                                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                                  borderColor: "#fca5a5",
                                  color: "#dc2626",
                                }
                              : {}
                          }
                          title={
                            isPast
                              ? `${slot} (Passé - non réservable)`
                              : isBooked
                              ? `${slot} (Créneau déjà réservé et bloqué par le cabinet)`
                              : `Réserver pour ${slot}`
                          }
                        >
                          <span>{slot}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message d'alerte contextuel si tous les créneaux de la période sont passés aujourd'hui */}
                  {isTodaySelected && (timePeriod === "matin" ? morningSlots : eveningSlots).every((s) => isSlotPast(s, selectedDay, selectedMonth, selectedYear)) && (
                    <div
                      style={{
                        padding: "9px 12px",
                        borderRadius: "10px",
                        background: "rgba(234, 179, 8, 0.1)",
                        border: "1px solid rgba(234, 179, 8, 0.25)",
                        color: "#fef08a",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        marginTop: "6px",
                        marginBottom: "8px",
                      }}
                    >
                      <span>
                        ⚠️ Créneaux {timePeriod === "matin" ? "du matin" : "de l'après-midi"} passés pour aujourd'hui.
                      </span>
                      {timePeriod === "matin" && eveningSlots.some((s) => !isSlotPast(s, selectedDay)) && (
                        <button
                          type="button"
                          onClick={() => handleSwitchPeriod("soir")}
                          style={{
                            background: "rgba(234, 179, 8, 0.3)",
                            border: "none",
                            color: "#fff",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Après-midi →
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Indicateur visuel élégant de Swipe */}
                <div className="slots-swipe-hint">
                  <ChevronLeft size={12} />
                  <span>Glisser (swipe) pour alterner Matin / Après-midi</span>
                  <ChevronRight size={12} />
                </div>
              </div>

            </div>

            {/* Formulaire Coordonnées Patiente */}
            <form onSubmit={handleConfirmBooking} className="glass-panel" style={{ padding: "18px 16px", marginBottom: "20px" }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <User size={16} color="var(--accent-mint)" />
                <span>Coordonnées pour la Réservation</span>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Nom & Prénom de la Patiente *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    name="booking_patient_name"
                    autoComplete="name"
                    className="glass-input"
                    placeholder=""
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    style={{ paddingLeft: "36px" }}
                    required
                  />
                  <User
                    size={16}
                    color="var(--accent-mint)"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Numéro de Téléphone (Mobile) *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="tel"
                    name="booking_patient_phone"
                    autoComplete="tel"
                    className="glass-input"
                    placeholder=""
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    style={{ paddingLeft: "36px" }}
                    required
                  />
                  <Phone
                    size={16}
                    color="var(--accent-mint)"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Adresse E-mail
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    className="glass-input"
                    placeholder=""
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    style={{ paddingLeft: "36px" }}
                  />
                  <Mail
                    size={16}
                    color="var(--accent-mint)"
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>


              {/* Bouton de confirmation finale */}
              <button
                type="submit"
                className="btn-primary-mint"
                style={{ padding: "16px", fontSize: "15px" }}
              >
                <CheckCircle2 size={18} />
                <span>
                  Confirmer pour le {selectedDay} {MONTH_NAMES[selectedMonth].slice(0, 3)}. à {selectedTime}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* VUE 3 : CONFIRMATION FESTIVE DU RENDEZ-VOUS                         */}
        {/* =================================================================== */}
        {view === "confirmed" && confirmedBooking && (
          <div className="fade-in-up" style={{ textAlign: "center", padding: "10px 0 30px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(187, 247, 208, 0.15)",
                border: "2px solid var(--accent-mint)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                boxShadow: "0 0 30px var(--accent-mint-glow)",
              }}
            >
              <CheckCircle2 size={36} color="var(--accent-mint)" />
            </div>

            <h3 style={{ fontSize: "22px", fontWeight: "800", color: "var(--text-primary)", marginBottom: "6px" }}>
              Rendez-vous Confirmé !
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "20px" }}>
              Votre demande a été enregistrée avec succès au cabinet.
            </p>

            {/* CARTE NUMÉRO DE PASSAGE / TICKET DU JOUR */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.18), rgba(5, 150, 105, 0.08))",
                border: "1.5px solid var(--accent-mint)",
                borderRadius: "16px",
                padding: "20px 16px",
                marginBottom: "20px",
                boxShadow: "0 8px 30px rgba(16, 185, 129, 0.2)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "1.2px",
                  color: "var(--accent-mint)",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                VOTRE NUMÉRO DE PASSAGE DU JOUR
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                  color: "#ffffff",
                  fontSize: "38px",
                  fontWeight: "900",
                  margin: "6px auto",
                  boxShadow: "0 0 30px rgba(2, 132, 199, 0.45)",
                }}
              >
                {confirmedBooking.ticketNumber || getTicketNumber(confirmedBooking.time)}
              </div>

              <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-primary)", marginTop: "8px" }}>
                Ticket N° {confirmedBooking.ticketNumber || getTicketNumber(confirmedBooking.time)} ({confirmedBooking.time})
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Ordre de passage estimé pour le {confirmedBooking.date}
              </div>
            </div>

            {/* Ticket / Reçu de réservation */}
            <div
              className="glass-panel"
              style={{
                padding: "20px",
                textAlign: "left",
                marginBottom: "24px",
                border: "1px dashed var(--accent-mint)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  Code Réservation
                </span>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--accent-mint)" }}>
                  {confirmedBooking.id}
                </span>
              </div>

              <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px", marginBottom: "12px" }}>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "var(--text-primary)" }}>
                  {confirmedBooking.doctorName}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {confirmedBooking.specialty}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Date</span>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                    {confirmedBooking.date}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Heure</span>
                  <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-mint)" }}>
                    {confirmedBooking.time}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>N° Passage</span>
                  <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--accent-mint)" }}>
                    Ticket #{confirmedBooking.ticketNumber || getTicketNumber(confirmedBooking.time)}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Patiente</span>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)" }}>
                  {confirmedBooking.patientName} ({confirmedBooking.patientPhone})
                  {confirmedBooking.patientEmail ? ` • ${confirmedBooking.patientEmail}` : ""}
                </div>
              </div>
            </div>

            <button
              className="btn-primary-mint"
              onClick={() => setView("doctor")}
              style={{ marginBottom: "10px" }}
            >
              <span>Retour à l'Accueil</span>
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* VUE 3 : PROFIL PATIENT & HISTORIQUE DES RENDEZ-VOUS                 */}
        {/* =================================================================== */}
        {view === "profile" && (
          <div className="fade-in-up">
            {/* Header Profil */}
            <div style={{ marginBottom: "18px" }}>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  letterSpacing: "-0.5px",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Mon Espace Patient
              </h2>
              <p style={{ color: "var(--accent-mint)", fontSize: "12.5px", fontWeight: "600", marginTop: "4px" }}>
                Gérez vos rendez-vous et vos informations
              </p>
            </div>

            {/* Carte Profil Utilisateur */}
            <div
              className="glass-panel"
              style={{
                padding: "16px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                border: authenticatedPatient ? "1px solid rgba(2, 132, 199, 0.35)" : "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>
                <div
                  onClick={authenticatedPatient ? handleProfilePhotoClick : undefined}
                  style={{
                    position: "relative",
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(14, 165, 233, 0.1))",
                    border: (authenticatedPatient && displayPhoto) ? "2.5px solid var(--accent-mint)" : "1.5px solid rgba(2, 132, 199, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent-mint)",
                    flexShrink: 0,
                    cursor: authenticatedPatient ? "pointer" : "default",
                    overflow: "hidden",
                    boxShadow: authenticatedPatient ? "0 2px 10px rgba(16, 185, 129, 0.2)" : "none",
                    transition: authenticatedPatient ? "transform 0.2s ease, box-shadow 0.2s ease" : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (authenticatedPatient) {
                      e.currentTarget.style.transform = "scale(1.06)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (authenticatedPatient) {
                      e.currentTarget.style.transform = "scale(1)";
                    }
                  }}
                  title={authenticatedPatient ? "Cliquer pour changer votre photo de profil" : undefined}
                >
                  {authenticatedPatient && displayPhoto && !photoLoadError ? (
                    <img
                      src={displayPhoto}
                      alt={patientName || "Photo de profil"}
                      onError={() => setPhotoLoadError(true)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <User size={28} />
                  )}

                  {/* Overlay pendant chargement */}
                  {authenticatedPatient && uploadingPhoto && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                      }}
                    >
                      <div className="spinner-border spinner-border-sm text-white" role="status" style={{ width: "16px", height: "16px" }}></div>
                    </div>
                  )}

                  {/* Badge appareil photo pour modifier : affiché UNIQUEMENT si le patient est connecté */}
                  {authenticatedPatient && !uploadingPhoto && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(15, 23, 42, 0.65)",
                        backdropFilter: "blur(2px)",
                        height: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                      }}
                      title="Changer la photo de profil"
                    >
                      <Camera size={11} />
                    </div>
                  )}
                </div>

                {/* Input fichier masque pour changer la photo - accessible uniquement si le patient est connecté */}
                {authenticatedPatient && (
                  <input
                    type="file"
                    ref={profilePhotoInputRef}
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleProfilePhotoChange}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {authenticatedPatient
                      ? `${authenticatedPatient.firstName} ${authenticatedPatient.lastName}`
                      : (patientName.trim() || "Patient(e)")}
                  </div>
                  {authenticatedPatient ? (
                    <>
                      <div style={{ fontSize: "11.5px", color: "var(--accent-mint)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Dossier : <strong>{authenticatedPatient.fileNumber}</strong> • Tél : {authenticatedPatient.phone}
                      </div>
                      {photoFeedback && (
                        <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600", marginTop: "3px" }}>
                          <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                          {photoFeedback}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                        Connectez-vous avec votre numéro et mot de passe
                      </div>
                      {photoFeedback && (
                        <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600", marginTop: "3px" }}>
                          <CheckCircle2 size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                          {photoFeedback}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Bouton de deconnexion place sur la carte profil a droite */}
              {authenticatedPatient && (
                <button
                  type="button"
                  onClick={handlePatientLogout}
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.35)",
                    color: "#ef4444",
                    borderRadius: "10px",
                    padding: "8px 14px",
                    fontSize: "12.5px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.22)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
                  }}
                  title="Se déconnecter de mon espace patient"
                >
                  <LogOut size={15} />
                  <span>Déconnexion</span>
                </button>
              )}
            </div>

            {/* Formulaire de Connexion : Masque automatiquement quand le patient est connecte */}
            {!authenticatedPatient && (
              <div className="glass-panel" style={{ padding: "18px 16px", marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "7px" }}>
                    <Key size={16} color="var(--accent-mint)" />
                    <span>Mes Identifiants (Téléphone & Mot de Passe)</span>
                  </div>
                </div>

                <form onSubmit={handlePatientLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "11.5px", color: "var(--text-secondary)", display: "block", marginBottom: "5px", fontWeight: "600" }}>
                      Numéro de Téléphone *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="tel"
                        className="glass-input"
                        placeholder="Numéro de téléphone"
                        value={patientPhone}
                        onChange={(e) => {
                          setPatientPhone(e.target.value);
                          setAuthError("");
                        }}
                        style={{ padding: "11px 12px 11px 36px", fontSize: "13.5px" }}
                        required
                      />
                      <Phone size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <label style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, fontWeight: "600" }}>
                        Mot de passe *
                      </label>
                      <span style={{ fontSize: "10.5px", color: "var(--accent-mint)" }}>
                        Sur votre ticket de caisse
                      </span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="glass-input"
                        placeholder="Mot de passe"
                        value={patientPassword}
                        onChange={(e) => {
                          setPatientPassword(e.target.value);
                          setAuthError("");
                        }}
                        style={{ padding: "11px 40px 11px 36px", fontSize: "13.5px", letterSpacing: showPassword ? "0.5px" : "2px" }}
                        required
                      />
                      <Lock size={15} color="var(--text-muted)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <div style={{ fontSize: "11.5px", color: "#dc2626", fontWeight: "600", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 10px" }}>
                      {authError}
                    </div>
                  )}

                  {authSuccess && (
                    <div style={{ fontSize: "11.5px", color: "#059669", fontWeight: "600", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "8px 10px" }}>
                      {authSuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-primary-mint"
                    style={{ padding: "12px 16px", fontSize: "13px", marginTop: "4px" }}
                  >
                    <LogIn size={15} />
                    <span>{authLoading ? "Connexion en cours..." : "Se connecter & Accéder à mon dossier"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Conteneur Cartes Médicales & Rendez-vous (Wishlist Glass Panel) */}
            <div
              className="glass-panel"
              style={{
                padding: "8px 14px",
                marginBottom: "20px",
              }}
            >
              {/* Section Rendez-vous */}
              <div style={{ marginBottom: openSections.appointments ? "14px" : "0px" }}>
                <div
                  onClick={() => toggleSection("appointments")}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: openSections.appointments ? "10px" : "0px",
                    cursor: "pointer",
                    userSelect: "none",
                    padding: "8px 4px",
                    borderRadius: "10px",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Calendar size={15} color="var(--accent-mint)" />
                    <span>Mes Rendez-vous ({patientAppointments.length})</span>
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {patientAppointments.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm("Voulez-vous effacer l'historique local de vos rendez-vous ?")) {
                            localStorage.removeItem("cabinet_client_appointments");
                            setPatientAppointments([]);
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(239, 68, 68, 0.8)",
                          fontSize: "11px",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Effacer
                      </button>
                    )}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "6px",
                        background: "rgba(2, 132, 199, 0.08)",
                        color: "var(--accent-mint)",
                      }}
                    >
                      {openSections.appointments ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </div>
                  </div>
                </div>

                {openSections.appointments && (
                  patientAppointments.length === 0 ? (
                    <div
                      style={{
                        padding: "20px 16px",
                        textAlign: "center",
                        background: "rgba(241, 245, 249, 0.7)",
                        border: "1px dashed var(--border-subtle)",
                        borderRadius: "14px",
                        marginBottom: "6px",
                      }}
                    >
                      <Calendar size={30} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>
                        Aucun rendez-vous enregistré
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 12px" }}>
                        Vous n'avez pas encore de consultation programmée auprès du {clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA"}.
                      </p>
                      <button
                        className="btn-primary-mint"
                        onClick={() => setView("schedule")}
                        style={{ padding: "10px 18px", fontSize: "12.5px", margin: "0 auto" }}
                      >
                        <Calendar size={15} />
                        <span>Prendre un Rendez-vous</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "6px" }}>
                      {patientAppointments.map((apt, index) => (
                        <div
                          key={apt.id || index}
                          style={{
                            padding: "13px 14px",
                            background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
                            border: "1px solid rgba(2, 132, 199, 0.18)",
                            borderLeft: "3px solid var(--accent-mint)",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(2, 132, 199, 0.05)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "11.5px", fontWeight: "800", color: "var(--accent-mint)" }}>
                                {apt.id || "RDV"}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  padding: "2px 8px",
                                  borderRadius: "6px",
                                  background: "rgba(2, 132, 199, 0.1)",
                                  color: "var(--accent-mint)",
                                  fontWeight: "800",
                                  border: "1px solid rgba(2, 132, 199, 0.25)",
                                }}
                              >
                                Ticket #{apt.ticketNumber || getTicketNumber(apt.time)}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "10.5px",
                                padding: "3px 9px",
                                borderRadius: "999px",
                                background: "rgba(16, 185, 129, 0.12)",
                                color: "#059669",
                                border: "1px solid rgba(16, 185, 129, 0.25)",
                                fontWeight: "700",
                              }}
                            >
                              Confirmé
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: "500" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Calendar size={13} color="var(--accent-mint)" />
                              {apt.date}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={13} color="var(--accent-mint)" />
                              {apt.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Sections Médicales : Factures, Ordonnances, Échographies, Documents */}
              {authenticatedPatient && (
                <>
                  <div style={{ height: "1px", background: "rgba(2, 132, 199, 0.1)", margin: "4px 0" }} />

                  {/* Section Factures */}
                  <div style={{ marginBottom: openSections.invoices ? "14px" : "0px" }}>
                    <div
                      onClick={() => toggleSection("invoices")}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: openSections.invoices ? "10px" : "0px",
                        cursor: "pointer",
                        userSelect: "none",
                        padding: "8px 4px",
                        borderRadius: "10px",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(2, 132, 199, 0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <Receipt size={15} color="var(--accent-mint)" />
                        <span>Mes Factures ({patientInvoices.length})</span>
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: "rgba(2, 132, 199, 0.08)",
                          color: "var(--accent-mint)",
                        }}
                      >
                        {openSections.invoices ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </div>
                    </div>

                    {openSections.invoices && (
                      patientInvoices.length === 0 ? (
                        <div
                          style={{
                            padding: "18px 16px",
                            textAlign: "center",
                            background: "rgba(241, 245, 249, 0.7)",
                            border: "1px dashed var(--border-subtle)",
                            borderRadius: "14px",
                            marginBottom: "6px",
                          }}
                        >
                          <Receipt size={26} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                          <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                            Aucune facture enregistrée
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "6px" }}>
                          {patientInvoices.map((inv, index) => (
                            <div
                              key={inv.id || index}
                              style={{
                                padding: "13px 14px",
                                background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
                                border: "1px solid rgba(2, 132, 199, 0.18)",
                                borderLeft: "3px solid var(--accent-mint)",
                                borderRadius: "12px",
                                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.05)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.35", wordBreak: "break-word" }}>
                                    {inv.invoiceNumber || `FAC-${inv.id}`}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 8px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                                      <Calendar size={13} color="var(--accent-mint)" />
                                      <span>{inv.date}</span>
                                    </span>
                                    <span style={{ opacity: 0.4 }}>•</span>
                                    <span style={{ color: "var(--accent-mint)", fontWeight: "700", whiteSpace: "nowrap" }}>
                                      {Number(inv.amount || inv.patientRemaining || 0).toLocaleString("fr-FR")} DA
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "auto" }}>
                                  <button
                                    onClick={() => handleViewInvoice(inv)}
                                    style={{
                                      background: "#ffffff",
                                      color: "var(--accent-mint)",
                                      border: "1px solid rgba(2, 132, 199, 0.25)",
                                      borderRadius: "8px",
                                      padding: "7px 14px",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      whiteSpace: "nowrap",
                                      transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(2, 132, 199, 0.1)";
                                      e.currentTarget.style.borderColor = "var(--accent-mint)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#ffffff";
                                      e.currentTarget.style.borderColor = "rgba(2, 132, 199, 0.25)";
                                    }}
                                    title="Visualiser la facture"
                                  >
                                    <Eye size={14} />
                                    <span>Voir</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  <div style={{ height: "1px", background: "rgba(2, 132, 199, 0.1)", margin: "4px 0" }} />

                  {/* Section Ordonnances */}
                  <div style={{ marginBottom: openSections.prescriptions ? "14px" : "0px" }}>
                    <div
                      onClick={() => toggleSection("prescriptions")}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: openSections.prescriptions ? "10px" : "0px",
                        cursor: "pointer",
                        userSelect: "none",
                        padding: "8px 4px",
                        borderRadius: "10px",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(2, 132, 199, 0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <FileText size={15} color="var(--accent-mint)" />
                        <span>Mes Ordonnances ({patientPrescriptions.length})</span>
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: "rgba(2, 132, 199, 0.08)",
                          color: "var(--accent-mint)",
                        }}
                      >
                        {openSections.prescriptions ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </div>
                    </div>

                    {openSections.prescriptions && (
                      patientPrescriptions.length === 0 ? (
                        <div
                          style={{
                            padding: "18px 16px",
                            textAlign: "center",
                            background: "rgba(241, 245, 249, 0.7)",
                            border: "1px dashed var(--border-subtle)",
                            borderRadius: "14px",
                            marginBottom: "6px",
                          }}
                        >
                          <FileText size={26} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                          <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                            Aucune ordonnance enregistrée
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "6px" }}>
                          {patientPrescriptions.map((presc, index) => (
                            <div
                              key={presc.id || index}
                              style={{
                                padding: "13px 14px",
                                background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
                                border: "1px solid rgba(2, 132, 199, 0.18)",
                                borderLeft: "3px solid var(--accent-mint)",
                                borderRadius: "12px",
                                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.05)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.35", wordBreak: "break-word" }}>
                                    {presc.prescriptionNumber || `ORD-${presc.id}`}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 8px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                                      <Calendar size={13} color="var(--accent-mint)" />
                                      <span>{presc.date}</span>
                                    </span>
                                    <span style={{ opacity: 0.4 }}>•</span>
                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {presc.doctorName || clinicInfo.doctorName || "Dr N. BELBACHIR"}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "auto" }}>
                                  <button
                                    onClick={() => handleViewPrescription(presc)}
                                    style={{
                                      background: "#ffffff",
                                      color: "var(--accent-mint)",
                                      border: "1px solid rgba(2, 132, 199, 0.25)",
                                      borderRadius: "8px",
                                      padding: "7px 14px",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      whiteSpace: "nowrap",
                                      transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(2, 132, 199, 0.1)";
                                      e.currentTarget.style.borderColor = "var(--accent-mint)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#ffffff";
                                      e.currentTarget.style.borderColor = "rgba(2, 132, 199, 0.25)";
                                    }}
                                    title="Visualiser l'ordonnance"
                                  >
                                    <Eye size={14} />
                                    <span>Voir</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  <div style={{ height: "1px", background: "rgba(2, 132, 199, 0.1)", margin: "4px 0" }} />

                  {/* Section Échographies */}
                  <div style={{ marginBottom: openSections.echographies ? "14px" : "0px" }}>
                    <div
                      onClick={() => toggleSection("echographies")}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: openSections.echographies ? "10px" : "0px",
                        cursor: "pointer",
                        userSelect: "none",
                        padding: "8px 4px",
                        borderRadius: "10px",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(2, 132, 199, 0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <Activity size={15} color="var(--accent-mint)" />
                        <span>Mes Échographies ({patientEchographies.length})</span>
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: "rgba(2, 132, 199, 0.08)",
                          color: "var(--accent-mint)",
                        }}
                      >
                        {openSections.echographies ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </div>
                    </div>

                    {openSections.echographies && (
                      patientEchographies.length === 0 ? (
                        <div
                          style={{
                            padding: "18px 16px",
                            textAlign: "center",
                            background: "rgba(241, 245, 249, 0.7)",
                            border: "1px dashed var(--border-subtle)",
                            borderRadius: "14px",
                            marginBottom: "6px",
                          }}
                        >
                          <Activity size={26} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                          <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                            Aucune échographie enregistrée
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "6px" }}>
                          {patientEchographies.map((echo, index) => (
                            <div
                              key={echo.id || index}
                              style={{
                                padding: "13px 14px",
                                background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
                                border: "1px solid rgba(2, 132, 199, 0.18)",
                                borderLeft: "3px solid var(--accent-mint)",
                                borderRadius: "12px",
                                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.05)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.35", wordBreak: "break-word" }}>
                                    {echo.title || echo.echoType || "Compte-rendu d'échographie"}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 8px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                                      <Calendar size={13} color="var(--accent-mint)" />
                                      <span>{echo.date}</span>
                                    </span>
                                    <span style={{ opacity: 0.4 }}>•</span>
                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {echo.author || echo.doctorName || clinicInfo.doctorName || "Dr N. BELBACHIR"}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "auto" }}>
                                  <button
                                    onClick={() => handleViewEchography(echo)}
                                    style={{
                                      background: "#ffffff",
                                      color: "var(--accent-mint)",
                                      border: "1px solid rgba(2, 132, 199, 0.25)",
                                      borderRadius: "8px",
                                      padding: "7px 14px",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      whiteSpace: "nowrap",
                                      transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(2, 132, 199, 0.1)";
                                      e.currentTarget.style.borderColor = "var(--accent-mint)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#ffffff";
                                      e.currentTarget.style.borderColor = "rgba(2, 132, 199, 0.25)";
                                    }}
                                    title="Visualiser le compte-rendu d'échographie"
                                  >
                                    <Eye size={14} />
                                    <span>Voir</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  <div style={{ height: "1px", background: "rgba(2, 132, 199, 0.1)", margin: "4px 0" }} />

                  {/* Section Documents Médicaux */}
                  <div style={{ marginBottom: openSections.documents ? "14px" : "0px" }}>
                    <div
                      onClick={() => toggleSection("documents")}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: openSections.documents ? "10px" : "0px",
                        cursor: "pointer",
                        userSelect: "none",
                        padding: "8px 4px",
                        borderRadius: "10px",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(2, 132, 199, 0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <Folder size={15} color="var(--accent-mint)" />
                        <span>Mes Documents ({patientDocuments.length})</span>
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: "rgba(2, 132, 199, 0.08)",
                          color: "var(--accent-mint)",
                        }}
                      >
                        {openSections.documents ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </div>
                    </div>

                    {openSections.documents && (
                      patientDocuments.length === 0 ? (
                        <div
                          style={{
                            padding: "18px 16px",
                            textAlign: "center",
                            background: "rgba(241, 245, 249, 0.7)",
                            border: "1px dashed var(--border-subtle)",
                            borderRadius: "14px",
                            marginBottom: "6px",
                          }}
                        >
                          <Folder size={26} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                          <div style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                            Aucun document enregistré
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "6px" }}>
                          {patientDocuments.map((doc, index) => (
                            <div
                              key={doc.id || index}
                              style={{
                                padding: "13px 14px",
                                background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
                                border: "1px solid rgba(2, 132, 199, 0.18)",
                                borderLeft: "3px solid var(--accent-mint)",
                                borderRadius: "12px",
                                boxShadow: "0 2px 8px rgba(2, 132, 199, 0.05)",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                                  <div style={{ fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary)", lineHeight: "1.35", wordBreak: "break-word" }}>
                                    {doc.title || "Document Médical"}
                                  </div>
                                  {doc.notes && (
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "3px", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      "{doc.notes}"
                                    </div>
                                  )}
                                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px 8px", fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
                                      <Calendar size={13} color="var(--accent-mint)" />
                                      <span>{doc.date || new Date().toISOString().split("T")[0]}</span>
                                    </span>
                                    <span style={{ opacity: 0.4 }}>•</span>
                                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {doc.category || doc.author || clinicInfo.doctorName || "Dr N. BELBACHIR"}
                                    </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "auto" }}>
                                  <button
                                    onClick={() => handleViewDocument(doc)}
                                    style={{
                                      background: "#ffffff",
                                      color: "var(--accent-mint)",
                                      border: "1px solid rgba(2, 132, 199, 0.25)",
                                      borderRadius: "8px",
                                      padding: "7px 14px",
                                      fontSize: "12px",
                                      fontWeight: "700",
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      whiteSpace: "nowrap",
                                      transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(2, 132, 199, 0.1)";
                                      e.currentTarget.style.borderColor = "var(--accent-mint)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "#ffffff";
                                      e.currentTarget.style.borderColor = "rgba(2, 132, 199, 0.25)";
                                    }}
                                    title="Visualiser le document"
                                  >
                                    <Eye size={14} />
                                    <span>Voir</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>

                  <div style={{ height: "1px", background: "rgba(2, 132, 199, 0.1)", margin: "4px 0" }} />

                  {/* Section Déposer un Document ou Message (pour les patients connectés) */}
                  <div style={{ marginBottom: openSections.uploadDoc ? "14px" : "0px" }}>
                    <div
                      onClick={() => toggleSection("uploadDoc")}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: openSections.uploadDoc ? "10px" : "0px",
                        cursor: "pointer",
                        userSelect: "none",
                        padding: "8px 4px",
                        borderRadius: "10px",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(2, 132, 199, 0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <UploadCloud size={15} color="var(--accent-mint)" />
                        <span>Déposer un document / Message</span>
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: "rgba(2, 132, 199, 0.08)",
                          color: "var(--accent-mint)",
                        }}
                      >
                        {openSections.uploadDoc ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </div>
                    </div>

                    {openSections.uploadDoc && (
                      <div
                        style={{
                          padding: "16px",
                          background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
                          border: "1px solid rgba(2, 132, 199, 0.2)",
                          borderLeft: "3px solid var(--accent-mint)",
                          borderRadius: "14px",
                          boxShadow: "0 2px 10px rgba(2, 132, 199, 0.06)",
                          marginBottom: "10px",
                        }}
                      >
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 14px", lineHeight: "1.5" }}>
                          Transmettez une analyse, une radio, un compte-rendu ou un message écrit à votre médecin. Vous pouvez envoyer un document avec texte ou <strong>un texte seul</strong> sans fichier joint.
                        </p>

                        {uploadDocSuccess && (
                          <div
                            style={{
                              padding: "10px 14px",
                              background: "rgba(16, 185, 129, 0.12)",
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                              borderRadius: "10px",
                              color: "#059669",
                              fontSize: "12.5px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "12px",
                            }}
                          >
                            <CheckCircle2 size={16} />
                            <span>{uploadDocSuccess}</span>
                          </div>
                        )}

                        {uploadDocError && (
                          <div
                            style={{
                              padding: "10px 14px",
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: "10px",
                              color: "#dc2626",
                              fontSize: "12.5px",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "12px",
                            }}
                          >
                            <X size={16} />
                            <span>{uploadDocError}</span>
                          </div>
                        )}

                        <form onSubmit={handlePatientDocSubmit}>
                          {/* Titre / Objet */}
                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
                              Titre ou Objet <span style={{ fontWeight: "400", color: "var(--text-muted)" }}>(optionnel si texte fourni)</span>
                            </label>
                            <input
                              type="text"
                              value={uploadDocTitle}
                              onChange={(e) => setUploadDocTitle(e.target.value)}
                              placeholder="Ex: Analyse sanguine, Radio, Demande de conseil..."
                              style={{
                                width: "100%",
                                padding: "9px 12px",
                                fontSize: "13px",
                                borderRadius: "8px",
                                border: "1px solid var(--border-subtle)",
                                background: "#ffffff",
                                color: "var(--text-primary)",
                                outline: "none",
                              }}
                            />
                          </div>

                          {/* Catégorie */}
                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
                              Catégorie
                            </label>
                            <select
                              value={uploadDocCategory}
                              onChange={(e) => setUploadDocCategory(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "9px 12px",
                                fontSize: "13px",
                                borderRadius: "8px",
                                border: "1px solid var(--border-subtle)",
                                background: "#ffffff",
                                color: "var(--text-primary)",
                                outline: "none",
                              }}
                            >
                              <option value="Autre">Autre / Message pour le médecin</option>
                              <option value="Analyses de laboratoire">Analyses de laboratoire (Bilan sanguin, Urine...)</option>
                              <option value="Imagerie & Radiologie">Imagerie & Radiologie (Échographie, Radio, Scanner...)</option>
                              <option value="Comptes rendus spécialistes">Comptes rendus spécialistes</option>
                              <option value="Certificats médicaux">Certificats médicaux / Ordonnances</option>
                            </select>
                          </div>

                          {/* Texte / Message */}
                          <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
                              Texte / Message pour le médecin <span style={{ fontWeight: "400", color: "var(--text-muted)" }}>(peut être envoyé seul)</span>
                            </label>
                            <textarea
                              rows={3}
                              value={uploadDocText}
                              onChange={(e) => setUploadDocText(e.target.value)}
                              placeholder="Rédigez ici vos explications, symptômes, questions ou remarques..."
                              style={{
                                width: "100%",
                                padding: "10px 12px",
                                fontSize: "13px",
                                borderRadius: "8px",
                                border: "1px solid var(--border-subtle)",
                                background: "#ffffff",
                                color: "var(--text-primary)",
                                outline: "none",
                                resize: "vertical",
                              }}
                            />
                          </div>

                          {/* Fichier joint (optionnel) */}
                          <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-primary)", marginBottom: "4px" }}>
                              Document joint <span style={{ fontWeight: "400", color: "var(--text-muted)" }}>(optionnel si vous envoyez un texte)</span>
                            </label>
                            <input
                              type="file"
                              ref={uploadFileInputRef}
                              onChange={handleSelectUploadFile}
                              accept="image/*,.pdf,.doc,.docx"
                              style={{ display: "none" }}
                            />

                            {!uploadDocFile ? (
                              <button
                                type="button"
                                onClick={() => uploadFileInputRef.current && uploadFileInputRef.current.click()}
                                style={{
                                  width: "100%",
                                  padding: "12px",
                                  border: "1.5px dashed rgba(2, 132, 199, 0.4)",
                                  borderRadius: "10px",
                                  background: "rgba(255, 255, 255, 0.7)",
                                  color: "var(--accent-mint)",
                                  fontSize: "12.5px",
                                  fontWeight: "600",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "8px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(2, 132, 199, 0.08)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.7)")}
                              >
                                <UploadCloud size={16} />
                                <span>Choisir un document ou une photo (PDF, JPG, PNG...)</span>
                              </button>
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 12px",
                                  background: "#ffffff",
                                  border: "1px solid rgba(2, 132, 199, 0.3)",
                                  borderRadius: "10px",
                                  gap: "10px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                  {uploadDocFilePreview ? (
                                    <img
                                      src={uploadDocFilePreview}
                                      alt="Aperçu"
                                      style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                                    />
                                  ) : (
                                    <div
                                      style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "6px",
                                        background: "rgba(2, 132, 199, 0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--accent-mint)",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <FileText size={18} />
                                    </div>
                                  )}
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {uploadDocFile.name}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                      {uploadDocFile.size > 1048576
                                        ? `${(uploadDocFile.size / 1048576).toFixed(1)} Mo`
                                        : `${Math.round(uploadDocFile.size / 1024)} Ko`}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={handleRemoveUploadFile}
                                  style={{
                                    background: "rgba(239, 68, 68, 0.1)",
                                    border: "none",
                                    color: "#ef4444",
                                    borderRadius: "6px",
                                    padding: "6px 10px",
                                    fontSize: "11.5px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    flexShrink: 0,
                                  }}
                                  title="Retirer ce fichier"
                                >
                                  <X size={13} />
                                  <span>Retirer</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Bouton de soumission */}
                          <button
                            type="submit"
                            disabled={uploadDocSubmitting || (!uploadDocText.trim() && !uploadDocFile)}
                            style={{
                              width: "100%",
                              padding: "11px",
                              borderRadius: "10px",
                              border: "none",
                              background: "linear-gradient(135deg, var(--accent-mint), #0284c7)",
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "700",
                              cursor: uploadDocSubmitting || (!uploadDocText.trim() && !uploadDocFile) ? "not-allowed" : "pointer",
                              opacity: uploadDocSubmitting || (!uploadDocText.trim() && !uploadDocFile) ? 0.6 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              boxShadow: "0 2px 10px rgba(2, 132, 199, 0.25)",
                              transition: "all 0.2s ease",
                            }}
                          >
                            {uploadDocSubmitting ? (
                              <>
                                <div className="spinner-border spinner-border-sm text-white" role="status" style={{ width: "14px", height: "14px" }}></div>
                                <span>Enregistrement dans votre dossier...</span>
                              </>
                            ) : (
                              <>
                                <Send size={15} />
                                <span>Enregistrer dans mon dossier médical</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VUE 4 : À PROPOS DU CABINET & INFORMATIONS PRATIQUES               */}
        {/* =================================================================== */}
        {view === "about" && (
          <div className="fade-in-up" style={{ paddingBottom: "24px" }}>
            {/* Header À Propos */}
            <div style={{ marginBottom: "18px" }}>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: "800",
                  letterSpacing: "-0.5px",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                À Propos du Cabinet
              </h2>
              <p style={{ color: "var(--accent-mint)", fontSize: "12.5px", fontWeight: "600", marginTop: "4px" }}>
                {clinicInfo.doctorName || "Dr. N. BELBACHIR OULD HENNIA"}
              </p>
            </div>

            {/* Carte Présentation Médecin */}
            <div className="glass-panel" style={{ padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "12px" }}>
                <img
                  src={clinicInfo.doctorPhoto || "/doctor.jpg"}
                  alt={clinicInfo.doctorName || "Dr. N. BELBACHIR OULD HENNIA"}
                  style={{
                    width: "58px",
                    height: "58px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #0284c7",
                    flexShrink: 0,
                  }}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=800&auto=format&fit=crop";
                  }}
                />
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                    {clinicInfo.doctorName || "Dr. N. BELBACHIR OULD HENNIA"}
                  </h4>
                  <div style={{ fontSize: "12px", color: "#0284c7", fontWeight: "700", marginTop: "2px" }}>
                    {clinicInfo.specialty || "Spécialiste Gynécologie Obstétrique & Échographie"}
                  </div>
                  {clinicInfo.doctorNameAr && (
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {clinicInfo.doctorNameAr}
                    </div>
                  )}
                </div>
              </div>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.55", margin: 0, whiteSpace: "pre-line" }}>
                {clinicInfo.aboutSummary || "Cabinet médical moderne dédié à la santé féminine, au suivi complet de la grossesse, au diagnostic prénatal et aux échographies obstétricales et pelviennes de haute précision."}
              </p>
            </div>

            {/* Horaires d'Ouverture */}
            <div className="glass-panel" style={{ padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Clock size={16} color="#0284c7" />
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                  Horaires des Consultations
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>{clinicInfo.hours ? (clinicInfo.hours.includes(":") ? clinicInfo.hours.split(":")[0] : clinicInfo.hours) : "Samedi — Jeudi"}</span>
                  <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>
                    {clinicInfo.slotStartMorning && clinicInfo.slotEndEvening
                      ? `${clinicInfo.slotStartMorning} — ${clinicInfo.slotEndEvening}`
                      : "09:00 — 18:00"}
                  </span>
                </div>
                {clinicInfo.closedDays && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>{clinicInfo.closedDays.includes(":") ? clinicInfo.closedDays.split(":")[0] : clinicInfo.closedDays}</span>
                    <span style={{ color: "#ef4444", fontWeight: "700" }}>
                      {clinicInfo.closedDays.includes(":") ? clinicInfo.closedDays.split(":")[1].trim() : "Fermé"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Coordonnées & Téléphone */}
            <div className="glass-panel" style={{ padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <MapPin size={16} color="#0284c7" />
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                  Adresse & Contact
                </span>
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: "700", lineHeight: "1.4", marginBottom: "14px", whiteSpace: "pre-line" }}>
                {clinicInfo.address || "Haï Essedikia (Avenue Seghier Benali), Oran"}
              </div>

              {/* Bouton d'appel direct */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <a
                  href={`tel:${(clinicInfo.secretaryPhone || clinicInfo.phone || "0560067466").replace(/\s+/g, "")}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    background: "rgba(2, 132, 199, 0.08)",
                    border: "1px solid rgba(2, 132, 199, 0.22)",
                    color: "#0284c7",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: "800",
                    letterSpacing: "0.5px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Phone size={17} />
                  <span>
                    {clinicInfo.secretaryPhone || clinicInfo.phone || "0560 06 74 66"}
                  </span>
                </a>
              </div>
            </div>

            {/* Carte de Localisation Interactive Google Maps */}
            <div className="glass-panel" style={{ padding: "16px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={16} color="#0284c7" />
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-primary)" }}>
                    Localisation sur la Carte
                  </span>
                </div>
                <a
                  href={clinicInfo.mapsUrl || "https://maps.google.com/?q=Gynecologue+Belbachir+Ouldhennia!5e0"}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "11px",
                    color: "#0284c7",
                    textDecoration: "none",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span>Ouvrir GPS</span>
                  <ArrowRight size={12} />
                </a>
              </div>

              {/* Cadre de la carte avec manipulation directe à la main (touch & zoom) */}
              <div
                style={{
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid rgba(187, 247, 208, 0.25)",
                  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.4)",
                  position: "relative",
                  height: "260px",
                  background: "rgba(0, 0, 0, 0.2)",
                }}
              >
                <iframe
                  title={`Localisation ${clinicInfo.clinicName || "Cabinet Médical"}`}
                  src={getCleanMapIframeUrl(clinicInfo.mapsIframe)}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>

              <div style={{ marginTop: "10px", fontSize: "11.5px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📍 {clinicInfo.clinicName || "Cabinet Médical"} — {clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA"}</span>
              </div>
            </div>

            {/* Bouton Prendre RDV */}
            <button
              className="btn-primary-mint"
              onClick={() => setView("schedule")}
              style={{ marginBottom: "20px" }}
            >
              <Calendar size={18} />
              <span>Prendre Rendez-vous en Ligne</span>
            </button>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* BARRE FLOTTANTE INFÉRIEURE (Home, Agenda, Profil, À propos)        */}
      {/* =================================================================== */}
      <div className="bottom-floating-nav">
        {/* 1. Home / Accueil */}
        <button
          className={`nav-tab-btn ${view === "doctor" ? "active" : ""}`}
          onClick={() => setView("doctor")}
          title="Accueil"
        >
          <Home size={19} />
          <span>Accueil</span>
        </button>

        {/* 2. Agenda */}
        <button
          className={`nav-tab-btn ${view === "schedule" ? "active" : ""}`}
          onClick={() => setView("schedule")}
          title="Agenda & Rendez-vous"
        >
          <Calendar size={19} />
          <span>Agenda</span>
        </button>

        {/* 3. Profil */}
        <button
          className={`nav-tab-btn ${view === "profile" ? "active" : ""}`}
          onClick={() => {
            try {
              const saved = JSON.parse(localStorage.getItem("cabinet_client_appointments") || "[]");
              setPatientAppointments(saved);
            } catch (e) {}
            setView("profile");
          }}
          title="Profil & Mes Rendez-vous"
        >
          {displayPhoto && !photoLoadError ? (
            <img
              src={displayPhoto}
              alt="Profil"
              onError={() => setPhotoLoadError(true)}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "1.5px solid var(--accent-mint)",
              }}
            />
          ) : (
            <User size={19} />
          )}
          <span>Profil</span>
        </button>

        {/* 4. À propos / About */}
        <button
          className={`nav-tab-btn ${view === "about" ? "active" : ""}`}
          onClick={() => setView("about")}
          title="À propos du cabinet"
        >
          <Info size={19} />
          <span>À propos</span>
        </button>
      </div>


      {/* =================================================================== */}
      {/* MODAL / TIROIR IA ASSISTANT                                         */}
      {/* =================================================================== */}
      {showAiModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(14px)",
            zIndex: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "fadeIn 0.25s ease",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAiModal(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              height: "85vh",
              maxHeight: "680px",
              background: "#ffffff",
              borderRadius: "24px",
              border: "1px solid rgba(2, 132, 199, 0.25)",
              boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
              display: "flex",
              flexDirection: "column",
              padding: "20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
          {/* Header IA */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "14px",
              borderBottom: "1px solid var(--border-subtle)",
              marginBottom: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "var(--accent-mint)",
                  color: "var(--accent-mint-dark)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h5 style={{ fontSize: "14px", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                  Assistant Médical IA
                </h5>
                <span style={{ fontSize: "10px", color: "var(--accent-mint)" }}>
                  {clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA"}
                </span>
              </div>
            </div>
            <button
              className="btn-icon-circle"
              style={{ width: "36px", height: "36px" }}
              onClick={() => setShowAiModal(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Corps de conversation */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "14px",
            }}
          >
            {aiChat.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "12px 14px",
                  borderRadius: "18px",
                  fontSize: "13px",
                  lineHeight: "1.4",
                  background:
                    msg.sender === "user"
                      ? "var(--accent-mint)"
                      : "rgba(255, 255, 255, 0.08)",
                  color:
                    msg.sender === "user"
                      ? "var(--accent-mint-dark)"
                      : "var(--text-primary)",
                  fontWeight: msg.sender === "user" ? "600" : "400",
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Suggestions rapides */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "10px" }}>
            {[
              "Tarif consultation ?",
              "Préparation échographie ?",
              "Adresse du cabinet ?",
            ].map((sugg, i) => (
              <button
                key={i}
                onClick={() => setAiQuestion(sugg)}
                style={{
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {sugg}
              </button>
            ))}
          </div>

          {/* Input de saisie */}
          <form onSubmit={handleSendAiMessage} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="glass-input"
              placeholder="Posez votre question médicale..."
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary-mint"
              style={{ width: "48px", height: "48px", padding: 0, flexShrink: 0 }}
            >
              <Send size={18} />
            </button>
          </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODALES D'APERÇU IDENTIQUES À CELLES DU PANNEAU D'ADMINISTRATION    */}
      {/* =================================================================== */}

      {/* 1. Modal Aperçu Officiel Ordonnance A5 (identique à l'admin panel) */}
      <PrescriptionPreviewModal
        show={!!selectedPrescription}
        onHide={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
      />

      {/* 2. Modal Aperçu Officiel Compte-Rendu Échographique (identique à l'admin panel) */}
      <EchoReportPrintModal
        show={!!selectedEchoConsultation}
        onHide={() => setSelectedEchoConsultation(null)}
        consultation={selectedEchoConsultation}
      />

      {/* 3. Modal Aperçu Facture Format Ticket 80 mm (identique à l'admin panel) */}
      <Modal
        show={!!previewInvoice}
        onHide={() => setPreviewInvoice(null)}
        centered
        className="invoice-preview-modal"
      >
        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            html, body {
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: hidden !important;
            }
            #simple-invoice-printable-portal,
            #simple-invoice-printable-portal * {
              visibility: visible !important;
            }
            #simple-invoice-printable-portal {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              max-width: 80mm !important;
              margin: 0 auto !important;
              padding: 5mm 4mm !important;
              box-sizing: border-box !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif !important;
              font-size: 12px !important;
            }
            .modal, .modal-dialog, .modal-content, .modal-body {
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }
            .modal-backdrop, .modal-header, .modal-footer, .btn, .btn-close, .no-print {
              display: none !important;
            }
          }
        `}</style>
        <div className="modal-header py-2 px-3 border-bottom">
          <h5 className="modal-title font-w600 fs-16 mb-0 text-dark">Facture (Format Ticket 80 mm)</h5>
          <button type="button" className="btn-close" onClick={() => setPreviewInvoice(null)}></button>
        </div>
        <div className="modal-body p-3 d-flex justify-content-center" style={{ backgroundColor: "#f8fafc" }}>
          {previewInvoice && (
            <div
              id="simple-invoice-printable-portal"
              className="bg-white p-3 rounded shadow-sm border"
              style={{
                width: "100%",
                maxWidth: "340px",
                color: "#1e293b",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              }}
            >
              {/* 1. NOM DU CABINET */}
              <div className="text-center pb-3 mb-2" style={{ borderBottom: "1px dashed #cbd5e1" }}>
                <h5 className="font-w700 text-dark mb-1" style={{ fontSize: "15px", letterSpacing: "0.2px" }}>
                  {clinicInfo.doctorName || "Dr N. BELBACHIR OULD HENNIA"}
                </h5>
                <div className="text-primary font-w600" style={{ fontSize: "12px" }}>
                  {clinicInfo.clinicName || "Cabinet Médical de Gynécologie Obstétrique"}
                </div>
                <div className="text-muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                  Tél: {clinicInfo.secretaryPhone || clinicInfo.phone || "0560 06 74 66"} • {clinicInfo.city || "Oran"}
                </div>
              </div>

              {/* 2. INFOS FACTURE & NOM DU PATIENT */}
              <div className="py-2 mb-2" style={{ borderBottom: "1px dashed #cbd5e1", fontSize: "12px" }}>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">N° Facture :</span>
                  <strong className="text-dark font-monospace">{previewInvoice.invoiceNumber}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Date :</span>
                  <span className="text-dark font-w500">
                    {previewInvoice.date} {previewInvoice.time ? `• ${previewInvoice.time}` : "• 10:30"}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2 pt-1" style={{ borderTop: "1px dotted #e2e8f0" }}>
                  <span className="text-muted">Patient(e) :</span>
                  <strong className="text-dark text-uppercase fs-13 font-w700">
                    {(previewInvoice.patientName || "").replace(/\s*\(sc\)\s*/gi, "").trim()}
                  </strong>
                </div>
              </div>

              {/* 3. TYPE DE CONSULTATION */}
              <div className="py-2 mb-2" style={{ borderBottom: "1px dashed #cbd5e1" }}>
                <span className="text-muted d-block text-uppercase" style={{ fontSize: "11px", fontWeight: "600" }}>
                  Type de consultation
                </span>
                <div className="text-dark font-w600 mt-1" style={{ fontSize: "13px" }}>
                  {previewInvoice.actDescription || previewInvoice.description || "Consultation Médicale"}
                </div>
              </div>

              {/* 4. LE PRIX (MONTANT) */}
              <div className="py-3 text-center mb-2" style={{ borderBottom: "1px dashed #cbd5e1", backgroundColor: "#f0fdf4", borderRadius: "6px" }}>
                <span className="text-muted text-uppercase d-block" style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" }}>
                  Total à payer
                </span>
                <div className="font-w800 mt-1" style={{ fontSize: "24px", color: "#059669", letterSpacing: "0.5px" }}>
                  {previewInvoice.amount ? Number(previewInvoice.amount).toLocaleString("fr-DZ") : "0"} DA
                </div>
              </div>

              {/* Statut du règlement */}
              <div className="d-flex justify-content-between align-items-center py-2" style={{ fontSize: "12px" }}>
                <span className="text-muted">Statut :</span>
                <span className="badge bg-success text-white">
                  {previewInvoice.status || "Réglé / Validé"}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer py-2 px-3 border-top">
          <Button variant="secondary" onClick={() => setPreviewInvoice(null)}>
            Fermer
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            Imprimer
          </Button>
        </div>
      </Modal>

      {/* 4. Lightbox / Modal d'Aperçu Photo et Document Médical (identique à l'admin panel) */}
      {previewingDoc && (
        <Modal
          show={!!previewingDoc}
          onHide={() => setPreviewingDoc(null)}
          centered
          size="lg"
        >
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title font-w700 text-dark mb-0">
                {previewingDoc.title}
              </h5>
              <small className="text-muted">
                {previewingDoc.category} • {previewingDoc.date} • {previewingDoc.author}
              </small>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setPreviewingDoc(null)}
            ></button>
          </div>
          <div className="modal-body text-center p-4">
            {previewingDoc.notes && (
              <div
                style={{
                  textAlign: "left",
                  background: "#f8fafc",
                  border: "1px solid rgba(2, 132, 199, 0.2)",
                  borderLeft: "4px solid var(--accent-mint)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  whiteSpace: "pre-wrap",
                  fontSize: "13.5px",
                  color: "var(--text-primary)",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ fontWeight: "700", marginBottom: "6px", color: "var(--accent-mint)", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Message / Note associée :
                </div>
                {previewingDoc.notes}
              </div>
            )}
            {previewingDoc.fileDataUrl && (previewingDoc.isImage || ["JPG", "JPEG", "PNG", "WEBP"].includes((previewingDoc.type || "").toUpperCase())) ? (
              <img
                src={previewingDoc.fileDataUrl}
                alt={previewingDoc.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  borderRadius: "10px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                }}
              />
            ) : previewingDoc.fileDataUrl ? (
              <iframe
                src={previewingDoc.fileDataUrl}
                title={previewingDoc.title}
                style={{
                  width: "100%",
                  height: "70vh",
                  border: "none",
                  borderRadius: "10px",
                }}
              />
            ) : (
              <div className="p-5 bg-light rounded text-center">
                <i className="fa fa-file-pdf fs-48 text-danger mb-3 d-block"></i>
                <h6 className="font-w600 text-dark">{previewingDoc.title}</h6>
                <p className="text-muted fs-13 mb-3">Fichier document {previewingDoc.type || "PDF"}</p>
              </div>
            )}
          </div>
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setPreviewingDoc(null)}
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}
      </div>
    </div>
  );
}
