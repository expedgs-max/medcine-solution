import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import WheelDatePicker from "./WheelDatePicker";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button, Modal } from "react-bootstrap";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";
import { initialAppointments, initialPatients, initialWaitingRoom } from "../../../services/CabinetData";

const CARD_COLORS = [
  "#ef4444", // Red (Preeti Sharma, Rohan Verma)
  "#f97316", // Orange (Priya Reddy)
  "#ec4899", // Magenta/Pink (Rahul Singh)
  "#d946ef", // Purple (Aryan Desai)
  "#10b981", // Emerald (Sneha Gupta)
  "#eab308", // Yellow (Arjun Sharma)
  "#84cc16", // Lime (Ananya Kapoor)
  "#3b82f6", // Blue (Saravana kumar)
  "#8b5cf6", // Violet (Arjun Sekhar)
];

const calculateTicketNumber = (timeStr) => {
  if (!timeStr) return 1;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 1;
  const totalMin = h * 60 + m;
  const startMin = 9 * 60; // 09:00
  const diff = totalMin - startMin;
  if (diff < 0) return 1;
  return Math.floor(diff / 30) + 1;
};

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"
  const [listFilterScope, setListFilterScope] = useState("upcoming"); // "upcoming" (aujourd'hui & futur) | "all" (tout l'historique)
  const [activeView, setActiveView] = useState("timeGridWeek"); // "timeGridWeek" | "dayGridMonth"
  const [calendarTitle, setCalendarTitle] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();
  const [liveTime, setLiveTime] = useState(
    new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );

  const calendarRef = useRef(null);

  const defaultConsultationTypes = [
    { id: 1, name: "Consultation de médecine générale", duration: "20 min", price: 2500 },
    { id: 2, name: "Consultation gynécologique / spécialisée", duration: "25 min", price: 3000 },
    { id: 3, name: "Suivi de grossesse / Maternité", duration: "20 min", price: 2500 },
    { id: 4, name: "Échographie obstétricale (T1 / T2 / T3)", duration: "30 min", price: 4000 },
    { id: 5, name: "Échographie pelvienne / gynécologique", duration: "25 min", price: 3500 },
    { id: 6, name: "Consultation avec frottis / acte", duration: "30 min", price: 3500 },
    { id: 7, name: "Visite de contrôle / Bilan", duration: "15 min", price: 1500 },
  ];

  const [consultationTypesList, setConsultationTypesList] = useState(defaultConsultationTypes);
  const [defaultConsultationTypeName, setDefaultConsultationTypeName] = useState("Consultation de médecine générale");

  const [showModal, setShowModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [cabinetInfo, setCabinetInfo] = useState(() => {
    try {
      const saved = localStorage.getItem("cabinet_info");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { closedDays: "Vendredi: Fermé", closedDates: [] };
  });

  const getClosedDateMatch = (isoDate) => {
    if (!isoDate || !Array.isArray(cabinetInfo?.closedDates)) return null;
    return (
      cabinetInfo.closedDates.find((item) => {
        const start = item.startDate;
        const end = item.endDate || item.startDate;
        return start && isoDate >= start && isoDate <= end;
      }) || null
    );
  };

  const [editId, setEditId] = useState(null);
  const [isGuestPatient, setIsGuestPatient] = useState(false);
  const [formRdv, setFormRdv] = useState({
    customPatientName: "",
    patientId: 1,
    date: new Date().toISOString().split("T")[0],
    time: "14:00",
    duration: "20 min",
    consultationType: "Consultation de médecine générale",
    price: 2500,
    reason: "Consultation de médecine générale",
    status: "Confirmé",
    notes: "",
  });

  // Chargement des rendez-vous et des patients depuis MySQL
  const fetchAppointments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [aptData, patData, settData, cabData] = await Promise.all([
        ApiService.getAppointments(),
        ApiService.getPatients(),
        ApiService.getSettings().catch(() => null),
        ApiService.getCabinetInfo().catch(() => null),
      ]);
      if (cabData) {
        setCabinetInfo((prev) => ({ ...prev, ...cabData }));
        try {
          localStorage.setItem("cabinet_info", JSON.stringify(cabData));
        } catch (e) {}
      }
      if (Array.isArray(aptData)) {
        setAppointments(aptData);
      }
      if (settData) {
        if (Array.isArray(settData.consultationTypes) && settData.consultationTypes.length > 0) {
          setConsultationTypesList(settData.consultationTypes);
        }
        if (settData.defaultConsultationType) {
          setDefaultConsultationTypeName(settData.defaultConsultationType);
          const matched = (settData.consultationTypes || []).find((t) => t.name === settData.defaultConsultationType);
          const pr = matched ? matched.price : (settData.consultationPrice !== undefined ? settData.consultationPrice : 2500);
          const dur = matched?.duration || settData.defaultDuration || "20 min";
          setFormRdv((prev) => ({
            ...prev,
            consultationType: settData.defaultConsultationType,
            price: pr,
            duration: dur,
            reason: prev.reason === "Consultation de médecine générale" ? settData.defaultConsultationType : prev.reason,
          }));
        }
      }
      if (Array.isArray(patData)) {
        const clean = patData.filter((p) => {
          const last = (p.lastName || "").toLowerCase().trim();
          const first = (p.firstName || "").toLowerCase().trim();
          return (
            !["dubois", "lemoine", "bernard", "moreau", "belkacem"].includes(last) &&
            !["claire", "marc", "sophie", "lucas", "yasmine"].includes(first)
          );
        });
        setPatients(clean);
        if (clean.length > 0) {
          setFormRdv((prev) => ({ ...prev, patientId: clean[0].id }));
        }
      }
    } catch (err) {
      console.warn("Erreur chargement rendez-vous MySQL :", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const onFocus = () => fetchAppointments(true);
    window.addEventListener("focus", onFocus);

    const onStorage = (e) => {
      if (e.key === "new_appointment_booked" || e.key === "cabinet_client_appointments") {
        fetchAppointments(true);
      }
    };
    window.addEventListener("storage", onStorage);

    const timer = setInterval(() => fetchAppointments(true), 10000);
    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    }, 1000);

    // Défilement automatique vers l'heure actuelle sur la première case visible
    const scrollInitTimer = setTimeout(() => {
      const now = new Date();
      const currentSlot = `${String(Math.max(8, now.getHours())).padStart(2, "0")}:${now.getMinutes() >= 30 ? "30" : "00"}:00`;
      calendarRef.current?.getApi()?.scrollToTime(currentSlot);
    }, 350);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
      clearInterval(clockTimer);
      clearTimeout(scrollInitTimer);
    };
  }, []);

  // Calcul de l'heure de fin pour FullCalendar basé sur la durée réelle
  const calculateEndTime = (dateStr, timeStr, durationStr) => {
    const minutes = parseInt(durationStr, 10) || 60;
    const [h, m] = (timeStr || "09:00").split(":").map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const endH = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
    const endM = String(totalMinutes % 60).padStart(2, "0");
    return `${dateStr}T${endH}:${endM}:00`;
  };

  // Événements pour FullCalendar
  const pendingAppointments = appointments.filter(
    (a) =>
      a.status === "En attente" ||
      (a.status && a.status.toLowerCase().includes("attente"))
  );
  const pendingCount = pendingAppointments.length;

  const calendarEvents = appointments.map((rdv, idx) => ({
    id: String(rdv.id),
    title: `${rdv.time} - ${rdv.patientName}${rdv.phone ? ` (${rdv.phone})` : ""}`,
    start: `${rdv.date}T${rdv.time}:00`,
    end: calculateEndTime(rdv.date, rdv.time, rdv.duration || "60 min"),
    extendedProps: {
      ...rdv,
      accentColor: rdv.accentColor || CARD_COLORS[idx % CARD_COLORS.length],
    },
  }));

  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };
  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };
  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.today();
      const now = new Date();
      const currentSlot = `${String(Math.max(8, now.getHours())).padStart(2, "0")}:${now.getMinutes() >= 30 ? "30" : "00"}:00`;
      api.scrollToTime(currentSlot);
    }
  };
  const handleViewChange = (viewName) => {
    setActiveView(viewName);
    calendarRef.current?.getApi().changeView(viewName);
  };
  const handleDatesSet = (dateInfo) => {
    setCalendarTitle(dateInfo.view.title);
  };

  const handleEventDrop = (info) => {
    const pad = (n) => String(n).padStart(2, "0");
    const d = info.event.start;
    if (!d) return;
    const newDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const newTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

    let newDuration = "30 min";
    if (info.event.end) {
      const diffMin = Math.round((info.event.end - info.event.start) / (1000 * 60));
      newDuration = `${diffMin} min`;
    }

    setAppointments((prev) =>
      prev.map((app) =>
        String(app.id) === info.event.id
          ? {
              ...app,
              date: newDate,
              time: newTime,
              duration: newDuration,
            }
          : app
      )
    );

    // Synchronisation MySQL
    const cleanDropId = typeof info.event.id === "string" && info.event.id.startsWith("RDV-")
      ? parseInt(info.event.id.replace("RDV-", ""), 10)
      : parseInt(info.event.id, 10) || info.event.id;

    ApiService.updateAppointment({
      id: cleanDropId,
      date: newDate,
      time: newTime,
      duration: newDuration,
    }).catch((err) => console.warn("Erreur mise à jour rdv MySQL :", err));

    Swal.fire({
      icon: "success",
      title: "Rendez-vous déplacé !",
      text: `${info.event.extendedProps?.patientName || "Patient"} déplacé au ${newDate} à ${newTime} (${newDuration})`,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const handleEventResize = (info) => {
    if (!info.event.end || !info.event.start) return;
    const diffMin = Math.round((info.event.end - info.event.start) / (1000 * 60));
    const newDuration = `${diffMin} min`;

    setAppointments((prev) =>
      prev.map((app) =>
        String(app.id) === info.event.id
          ? {
              ...app,
              duration: newDuration,
            }
          : app
      )
    );

    // Synchronisation MySQL
    const cleanResizeId = typeof info.event.id === "string" && info.event.id.startsWith("RDV-")
      ? parseInt(info.event.id.replace("RDV-", ""), 10)
      : parseInt(info.event.id, 10) || info.event.id;

    ApiService.updateAppointment({
      id: cleanResizeId,
      duration: newDuration,
    }).catch((err) => console.warn("Erreur redimensionnement rdv MySQL :", err));

    Swal.fire({
      icon: "success",
      title: "Durée ajustée !",
      text: `Nouvelle durée : ${newDuration}`,
      timer: 1400,
      showConfirmButton: false,
    });
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setIsGuestPatient(false);
    const defType =
      consultationTypesList.find((t) => t.name === defaultConsultationTypeName) ||
      consultationTypesList[0] ||
      defaultConsultationTypes[0];
    setFormRdv({
      patientId: patients[0]?.id || initialPatients[0]?.id || "sans_compte",
      customPatientName: "",
      date: new Date().toISOString().split("T")[0],
      time: "10:00",
      duration: defType.duration || "20 min",
      consultationType: defType.name,
      price: defType.price || 2500,
      reason: defType.name,
      status: "Confirmé",
      notes: "",
    });
    setShowModal(true);
    setTimeout(() => {
      document.getElementById("rdv-form-card")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleOpenEdit = (rdv) => {
    setEditId(rdv.id);
    const isGuest = !rdv.patientId || String(rdv.patientId) === "sans_compte";
    setIsGuestPatient(isGuest);
    const matchedType = consultationTypesList.find(
      (t) => t.name === rdv.consultationType || t.name === rdv.reason
    );
    setFormRdv({
      patientId: isGuest ? "sans_compte" : rdv.patientId,
      customPatientName: isGuest ? (rdv.patientName || "") : "",
      phone: rdv.phone || "",
      date: rdv.date,
      time: rdv.time,
      duration: rdv.duration || "20 min",
      consultationType: rdv.consultationType || matchedType?.name || "Consultation de médecine générale",
      price: rdv.price !== undefined ? rdv.price : (matchedType?.price || 2500),
      reason: rdv.reason || "Consultation de médecine générale",
      status: rdv.status,
      notes: rdv.notes || "",
    });
    setShowModal(true);
    setTimeout(() => {
      document.getElementById("rdv-form-card")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  // Synchronisation automatique vers la salle d'attente quand le statut passe à Arrivé
  const syncArrivalToWaitingRoom = (item) => {
    try {
      const now = new Date();
      const arrTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const saved = localStorage.getItem("cabinet_waiting_list");
      const currentList = (saved ? JSON.parse(saved) : []).filter(
        (p) => p.patientName !== "Sophie Bernard" && p.patientName !== "Marc Lemoine"
      );

      const exists = currentList.some(
        (w) =>
          (item.appointmentId && w.appointmentId === item.appointmentId) ||
          (item.patientId && w.patientId === item.patientId && w.status !== "Terminé") ||
          (w.patientName && item.patientName && w.patientName.toLowerCase() === item.patientName.toLowerCase() && w.status !== "Terminé")
      );

      if (!exists) {
        const ticketNum = item.ticketNumber || calculateTicketNumber(item.appointmentTime || item.time);
        const newArrival = {
          id: Date.now(),
          ticketNumber: ticketNum,
          appointmentId: item.appointmentId || null,
          patientId: item.patientId || null,
          patientName: item.patientName || "Patient",
          phone: item.phone || "",
          appointmentTime: item.appointmentTime || "10:00",
          arrivalTime: arrTime,
          reason: item.reason || "Consultation générale",
          waitTimeMinutes: 0,
          status: "En attente",
        };

        const updatedList = [newArrival, ...currentList];
        localStorage.setItem("cabinet_waiting_list", JSON.stringify(updatedList));

        // Diffuser en direct aux autres onglets et à l'écran TV salle d'attente
        try {
          const channel = new BroadcastChannel("waiting_room_display_channel");
          channel.postMessage({ type: "UPDATE_LIST", list: updatedList });
          channel.close();
        } catch (e) {}

        // Enregistrer également dans MySQL pour persistance garantie
        ApiService.createWaitingArrival({
          patientId: item.patientId || null,
          patientName: item.patientName,
          phone: item.phone || "",
          appointmentId: item.appointmentId || null,
          ticketNumber: ticketNum,
          appointmentTime: item.appointmentTime,
          arrivalTime: arrTime,
          reason: item.reason,
        }).catch((err) => console.warn("Erreur createWaitingArrival MySQL :", err));
      }
    } catch (err) {
      console.warn("Erreur synchronisation salle d'attente locale :", err);
    }
  };

  const handleSaveRdv = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const closedHit = getClosedDateMatch(formRdv.date);
    if (closedHit) {
      Swal.fire({
        icon: "warning",
        title: "Cabinet fermé à cette date",
        text: `Le cabinet est fermé (${closedHit.reason || "Fermeture exceptionnelle"}) ${
          closedHit.endDate && closedHit.endDate !== closedHit.startDate
            ? `du ${closedHit.startDate} au ${closedHit.endDate}`
            : `le ${closedHit.startDate}`
        }. Veuillez choisir une autre date.`,
        confirmButtonColor: "#1e60d5",
      });
      return;
    }

    // Règle métier : Prévention des chevauchements réels de rendez-vous pour le praticien
    const toMinutes = (timeStr) => {
      const [h, m] = (timeStr || "09:00").split(":").map(Number);
      return h * 60 + m;
    };
    const formStart = toMinutes(formRdv.time);
    const formEnd = formStart + (parseInt(formRdv.duration, 10) || 20);

    const conflict = appointments.find((a) => {
      if (
        a.id === editId ||
        a.date !== formRdv.date ||
        a.status === "Annulé" ||
        a.status === "Absent"
      ) {
        return false;
      }
      const aStart = toMinutes(a.time);
      const aEnd = aStart + (parseInt(a.duration, 10) || 20);
      return formStart < aEnd && aStart < formEnd;
    });

    if (conflict) {
      Swal.fire({
        icon: "warning",
        title: "Créneau déjà occupé",
        text: `Le praticien a déjà un rendez-vous prévu de ${conflict.time} avec ${conflict.patientName} (${conflict.duration}). Veuillez choisir un autre horaire.`,
        confirmButtonColor: "#1e60d5",
      });
      return;
    }

    const isGuest = isGuestPatient || formRdv.patientId === "sans_compte" || !formRdv.patientId;
    let pFullName = "";
    let pId = null;
    let pPhone = formRdv.phone || "";

    if (isGuest) {
      pId = null;
      pFullName = (formRdv.customPatientName || "").trim() || "Patient(e) de passage";
    } else {
      const existingApt = editId ? appointments.find((a) => a.id === editId) : null;
      const patientList = patients && patients.length > 0 ? patients : initialPatients;
      const patient = patientList.find((p) => p.id === parseInt(formRdv.patientId)) || {
        id: formRdv.patientId ? parseInt(formRdv.patientId) : (existingApt?.patientId || null),
        firstName: existingApt?.firstName || (existingApt?.patientName?.split(" ")[0] || "Patient"),
        lastName: existingApt?.lastName || (existingApt?.patientName?.split(" ").slice(1).join(" ") || ""),
        phone: existingApt?.phone || "",
      };
      pId = patient.id || null;
      pFullName = (existingApt && String(formRdv.patientId || "") === String(existingApt.patientId || "")) 
        ? (existingApt.patientName || "Patient") 
        : `${patient.firstName} ${patient.lastName}`.trim();
      if (!pPhone) pPhone = patient.phone || "";
    }

    if (editId) {
      const cleanEditId = typeof editId === "string" && editId.startsWith("RDV-")
        ? parseInt(editId.replace("RDV-", ""), 10)
        : parseInt(editId, 10) || editId;

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === editId
            ? {
                ...a,
                patientId: pId,
                patientName: pFullName,
                phone: pPhone,
                date: formRdv.date,
                time: formRdv.time,
                duration: formRdv.duration,
                reason: formRdv.reason,
                consultationType: formRdv.consultationType || "Consultation générale",
                price: formRdv.price || 2500,
                status: formRdv.status,
                notes: formRdv.notes,
              }
            : a
        )
      );

      // Synchronisation MySQL
      try {
        await ApiService.updateAppointment({
          id: cleanEditId,
          patientId: pId,
          patientName: pFullName,
          phone: pPhone,
          date: formRdv.date,
          time: formRdv.time,
          duration: formRdv.duration,
          reason: formRdv.reason,
          consultationType: formRdv.consultationType || "Consultation générale",
          price: formRdv.price || 2500,
          status: formRdv.status,
          notes: formRdv.notes,
        });
      } catch (err) {
        console.warn("Erreur mise à jour rendez-vous MySQL :", err);
      }

      if (formRdv.status === "Arrivé") {
        syncArrivalToWaitingRoom({
          appointmentId: cleanEditId,
          patientId: pId,
          patientName: pFullName,
          phone: pPhone,
          appointmentTime: formRdv.time,
          reason: formRdv.reason,
        });

        Swal.fire({
          icon: "success",
          title: "Patient marqué comme Arrivé !",
          text: `${pFullName} a été ajouté(e) dans la Salle d'attente.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Rendez-vous mis à jour",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } else {
      let createdId = Date.now();
      try {
        const res = await ApiService.createAppointment({
          patientId: pId,
          patientName: pFullName,
          phone: pPhone,
          date: formRdv.date,
          time: formRdv.time,
          duration: formRdv.duration,
          reason: formRdv.reason,
          consultationType: formRdv.consultationType || "Consultation générale",
          price: formRdv.price || 2500,
          status: formRdv.status,
          notes: formRdv.notes,
        });
        if (res && res.data && res.data.id) {
          createdId = res.data.id;
        } else if (res && res.id) {
          createdId = res.id;
        }
      } catch (err) {
        console.warn("Erreur création rendez-vous MySQL :", err);
      }

      const newAppt = {
        id: createdId,
        patientId: pId,
        patientName: pFullName,
        phone: pPhone,
        date: formRdv.date,
        time: formRdv.time,
        duration: formRdv.duration,
        reason: formRdv.reason,
        consultationType: formRdv.consultationType || "Consultation générale",
        price: formRdv.price || 2500,
        status: formRdv.status,
        notes: formRdv.notes,
      };
      setAppointments((prev) => [...prev, newAppt]);

      if (formRdv.status === "Arrivé") {
        syncArrivalToWaitingRoom({
          appointmentId: createdId,
          patientId: pId,
          patientName: pFullName,
          phone: pPhone,
          appointmentTime: formRdv.time,
          reason: formRdv.reason,
        });

        Swal.fire({
          icon: "success",
          title: "Rendez-vous créé & Patient en Salle d'attente",
          text: `${pFullName} est enregistré(e) dans la salle d'attente.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Rendez-vous créé avec succès",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    }

    setShowModal(false);
  };

  const handleMarkArrived = async (rdv) => {
    if (!rdv) return;
    const cleanId = typeof rdv.id === "string" && rdv.id.startsWith("RDV-")
      ? parseInt(rdv.id.replace("RDV-", ""), 10)
      : parseInt(rdv.id, 10) || rdv.id;

    setAppointments((prev) =>
      prev.map((a) => (a.id === rdv.id ? { ...a, status: "Arrivé" } : a))
    );
    try {
      await ApiService.updateAppointment({ id: cleanId, status: "Arrivé" });
    } catch (err) {
      console.warn("Erreur mise à jour statut Arrivé :", err);
    }
    syncArrivalToWaitingRoom({
      appointmentId: cleanId,
      patientId: rdv.patientId || null,
      patientName: rdv.patientName || "Patient",
      phone: rdv.phone || "",
      ticketNumber: rdv.ticketNumber,
      appointmentTime: rdv.time,
      reason: rdv.reason || "Consultation générale",
    });
    Swal.fire({
      icon: "success",
      title: "Patient en Salle d'attente !",
      text: `${rdv.patientName || "Le patient"} a été marqué(e) comme Arrivé et ajouté(e) dans la Salle d'attente.`,
      timer: 1600,
      showConfirmButton: false,
    });
  };

  const handleAcceptRdv = async (rdv, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!rdv) return;
    const cleanId = typeof rdv.id === "string" && rdv.id.startsWith("RDV-")
      ? parseInt(rdv.id.replace("RDV-", ""), 10)
      : parseInt(rdv.id, 10) || rdv.id;

    try {
      setAppointments((prev) =>
        prev.map((a) => (a.id === rdv.id ? { ...a, status: "Confirmé" } : a))
      );
      await ApiService.updateAppointment({ id: cleanId, status: "Confirmé" });
      Swal.fire({
        icon: "success",
        title: "Rendez-vous accepté !",
        text: `Le rendez-vous de ${(rdv.patientName || "ce patient").replace(/\s*\(sc\)/gi, "").trim()} (${rdv.time}) est confirmé et le créneau est bloqué sur le site web.`,
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Erreur", "Impossible de valider : " + err.message, "error");
    }
  };

  const handleRefuseRdv = (rdv, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    Swal.fire({
      title: "Refuser ce rendez-vous ?",
      text: `Voulez-vous refuser le rendez-vous de ${(rdv.patientName || "ce patient").replace(/\s*\(sc\)/gi, "").trim()} (${rdv.time}) ? Le rendez-vous sera retiré et le créneau libéré dans la base de données.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f72b50",
      cancelButtonColor: "#6e6e6e",
      confirmButtonText: "Oui, refuser et retirer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setAppointments((prev) => prev.filter((a) => a.id !== rdv.id));
        try {
          await ApiService.deleteAppointment(rdv.id);
          Swal.fire({
            icon: "success",
            title: "Rendez-vous retiré",
            text: "Le rendez-vous a été retiré et le créneau est de nouveau libre.",
            timer: 1800,
            showConfirmButton: false,
          });
        } catch (e) {
          console.warn("Erreur suppression rdv MySQL :", e);
          Swal.fire("Erreur", "Erreur lors du retrait : " + e.message, "error");
        }
      }
    });
  };

  const handleDeleteRdv = (id) => {
    Swal.fire({
      title: "Annuler ce rendez-vous ?",
      text: "Le créneau sera libéré dans l'agenda.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f72b50",
      cancelButtonColor: "#6e6e6e",
      confirmButtonText: "Oui, annuler",
      cancelButtonText: "Fermer",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setAppointments(appointments.filter((a) => a.id !== id));
        try {
          await ApiService.deleteAppointment(id);
        } catch (e) {
          console.warn("Erreur suppression rdv MySQL :", e);
        }
        Swal.fire("Annulé", "Le rendez-vous a été annulé avec succès.", "success");
      }
    });
  };

  // Nombre de rendez-vous à venir (aujourd'hui et futurs)
  const upcomingCount = appointments.filter((rdv) => (rdv.date || "") >= todayStr).length;

  // Filtrage selon le mode sélectionné : Aujourd'hui & Futurs par défaut, ou Tout l'historique
  const baseAppointments = listFilterScope === "upcoming"
    ? appointments.filter((rdv) => (rdv.date || "") >= todayStr)
    : appointments;

  // Tri : pour à venir -> du plus proche au plus lointain (matin -> après-midi -> jours futurs)
  // pour historique -> du plus récent au plus ancien
  const sortedAppointments = [...baseAppointments].sort((a, b) => {
    if (listFilterScope === "upcoming") {
      const dComp = (a.date || "").localeCompare(b.date || "");
      if (dComp !== 0) return dComp;
      const tComp = (a.time || "").localeCompare(b.time || "");
      if (tComp !== 0) return tComp;
      return (a.id || 0) - (b.id || 0);
    } else {
      const dComp = (b.date || "").localeCompare(a.date || "");
      if (dComp !== 0) return dComp;
      const tComp = (b.time || "").localeCompare(a.time || "");
      if (tComp !== 0) return tComp;
      return (b.id || 0) - (a.id || 0);
    }
  });

  const filteredAppointments = sortedAppointments.filter((rdv) => {
    const matchStatus = filterStatus === "all" || rdv.status === filterStatus;
    const pName = (rdv.patientName || "").toLowerCase();
    const pReason = (rdv.reason || "").toLowerCase();
    const sTerm = (searchTerm || "").toLowerCase();
    return matchStatus && (pName.includes(sTerm) || pReason.includes(sTerm));
  });

  const getStatusBadge = (status) => {
    const isPending =
      status === "En attente" ||
      (status && status.toLowerCase().includes("attente"));
    return (
      <span
        className="appointment-status-badge"
        style={
          isPending
            ? {
                backgroundColor: "#fffbeb",
                color: "#b45309",
                borderColor: "#fde68a",
              }
            : {}
        }
      >
        <span
          className="status-dot"
          style={isPending ? { backgroundColor: "#f59e0b" } : {}}
        ></span>
        {status || "En attente"}
      </span>
    );
  };

  return (
    <>
      <PageTitle motherMenu="Principal" activeMenu="Agenda & Rendez-vous" />

      <style>{`
        /* Badge de statut épuré et sobre (sans multi-couleurs) */
        .appointment-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 14px;
          background-color: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 500;
          line-height: 1.2;
          white-space: nowrap;
          letter-spacing: 0.2px;
        }
        .appointment-status-badge .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #64748b;
          display: inline-block;
          flex-shrink: 0;
        }

        /* Boutons d'actions simples et modernes */
        .btn-action-simple {
          width: 32px;
          height: 32px;
          padding: 0;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }
        .btn-action-simple:hover {
          transform: translateY(-1px);
        }
        .btn-action-simple.btn-arrive:hover, .btn-action-simple.btn-arrive.active { background-color: #ecfdf5; border-color: #a7f3d0; color: #10b981; }
        .btn-action-simple.btn-edit:hover {
          background-color: #eff6ff;
          border-color: #bfdbfe;
          color: #1e60d5;
        }
        .btn-action-simple.btn-delete:hover {
          background-color: #fef2f2;
          border-color: #fecaca;
          color: #ef4444;
        }
      `}</style>

      {/* Barre d'action supérieure */}
      <div className="form-head d-flex mb-3 mb-md-4 align-items-center flex-wrap justify-content-between gap-2">
        {/* Recherche et filtres à gauche */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group search-area" style={{ width: "auto", minWidth: "250px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher patient / motif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="input-group-text">
              <i className="flaticon-381-search-2"></i>
            </span>
          </div>
        </div>

        {/* Boutons d'action et mode à droite */}
        <div className="d-flex align-items-center gap-2 flex-wrap ms-auto justify-content-end">
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "calendar" ? "btn-primary shadow-sm" : "btn-outline-primary"}`}
              style={{ borderRadius: "8px", fontWeight: 600, padding: "7px 16px" }}
              onClick={() => setViewMode("calendar")}
            >
              <i className="flaticon-381-calendar me-1"></i> Calendrier
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "list" ? "btn-primary shadow-sm" : "btn-outline-primary"}`}
              style={{ borderRadius: "8px", fontWeight: 600, padding: "7px 16px" }}
              onClick={() => setViewMode("list")}
            >
              <i className="flaticon-381-list me-1"></i> Liste
            </button>
          </div>

          <Button
            variant={showModal && !editId ? "outline-primary" : "primary"}
            className="btn-rounded"
            onClick={() => {
              if (showModal && !editId) {
                setShowModal(false);
              } else {
                handleOpenAdd();
              }
            }}
          >
            <i className={showModal && !editId ? "fa fa-times me-2" : "flaticon-381-add-1 me-2"}></i>
            {showModal && !editId ? "Fermer le formulaire" : "Prendre un Rendez-vous"}
          </Button>
        </div>
      </div>


      {/* Formulaire Ajout / Modification de RDV (Intégré dans la page sans popup) */}
      {showModal && (
        <div className="card mb-4" id="rdv-form-card">
          <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="card-title">
                {editId ? "Modifier le Rendez-vous" : "Nouveau Rendez-vous Cabinet"}
              </h4>
              <p className="text-muted fs-13 mb-0">
                {editId
                  ? "Mise à jour des informations du créneau de consultation"
                  : "Planification d'une nouvelle consultation dans l'agenda"}
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Fermer"
              onClick={() => setShowModal(false)}
            ></button>
          </div>
          <form onSubmit={handleSaveRdv}>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0 fw-bold">Patient</label>
                  </div>
                  
                  {/* Choix clair : Dossier existant ou Nom libre sans compte */}
                  <div className="btn-group btn-group-sm w-100 mb-2" role="group">
                    <button
                      type="button"
                      className={`btn ${!isGuestPatient ? "btn-primary shadow-sm" : "btn-outline-primary"}`}
                      style={{ fontSize: "12px", padding: "5px 8px" }}
                      onClick={() => {
                        setIsGuestPatient(false);
                        const firstId = patients[0]?.id || initialPatients[0]?.id || "";
                        setFormRdv((prev) => ({ ...prev, patientId: firstId }));
                      }}
                    >
                      <i className="fa fa-folder-open me-1"></i> Dossier existant
                    </button>
                    <button
                      type="button"
                      className={`btn ${isGuestPatient ? "btn-primary shadow-sm" : "btn-outline-primary"}`}
                      style={{ fontSize: "12px", padding: "5px 8px" }}
                      onClick={() => {
                        setIsGuestPatient(true);
                        setFormRdv((prev) => ({ ...prev, patientId: "sans_compte" }));
                      }}
                    >
                      <i className="fa fa-pencil me-1"></i> Nom libre (Sans compte)
                    </button>
                  </div>

                  {isGuestPatient ? (
                    <div>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-primary">
                          <i className="fa fa-user"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Tapez le nom & prénom (ex: Mohamed Belkacem)..."
                          value={formRdv.customPatientName || ""}
                          onChange={(e) => setFormRdv({ ...formRdv, customPatientName: e.target.value })}
                          required
                          autoFocus
                        />
                      </div>
                      <small className="text-muted d-block mt-1" style={{ fontSize: "11px" }}>
                        <i className="fa fa-info-circle me-1 text-primary"></i>
                        RDV enregistré directement avec ce nom (sans créer de dossier patient).
                      </small>
                    </div>
                  ) : (
                    <select
                      className="form-control"
                      value={formRdv.patientId}
                      onChange={(e) => {
                        if (e.target.value === "sans_compte") {
                          setIsGuestPatient(true);
                          setFormRdv({ ...formRdv, patientId: "sans_compte" });
                        } else {
                          setFormRdv({ ...formRdv, patientId: e.target.value });
                        }
                      }}
                    >
                      <option value="sans_compte">
                        ✍️ ＋ Saisir un nom sans compte (Passage)
                      </option>
                      {editId && !patients.some((p) => p.id === parseInt(formRdv.patientId)) && formRdv.patientId !== "sans_compte" && (
                        <option value={formRdv.patientId}>
                          {appointments.find((a) => a.id === editId)?.patientName || "Patient en cours"}
                        </option>
                      )}
                      {(patients && patients.length > 0 ? patients : initialPatients).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.firstName} {p.lastName} — ({p.fileNumber || `DOS-${p.id}`})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Date</label>
                  <WheelDatePicker
                    value={formRdv.date}
                    onChange={(e) => setFormRdv({ ...formRdv, date: e.target.value })}
                    title="DATE DU RENDEZ-VOUS"
                    required
                  />
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label">Heure</label>
                  <input
                    type="time"
                    className="form-control"
                    value={formRdv.time}
                    onChange={(e) => setFormRdv({ ...formRdv, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Numéro de téléphone"
                    value={formRdv.phone || ""}
                    onChange={(e) => setFormRdv({ ...formRdv, phone: e.target.value })}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Durée</label>
                  <select
                    className="form-control"
                    value={formRdv.duration}
                    onChange={(e) => setFormRdv({ ...formRdv, duration: e.target.value })}
                  >
                    <option value="15 min">15 minutes</option>
                    <option value="20 min">20 minutes</option>
                    <option value="25 min">25 minutes</option>
                    <option value="30 min">30 minutes</option>
                    <option value="45 min">45 minutes</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Statut</label>
                  <select
                    className="form-control"
                    value={formRdv.status}
                    onChange={(e) => setFormRdv({ ...formRdv, status: e.target.value })}
                  >
                    <option value="Confirmé">Confirmé</option>
                    <option value="Arrivé">Arrivé (Salle d'attente)</option>
                    <option value="En consultation">En consultation</option>
                    <option value="Terminé">Terminé</option>
                    <option value="Absent">Absent</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Notes internes</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Précisions utiles pour l'accueil ou le médecin..."
                  value={formRdv.notes}
                  onChange={(e) => setFormRdv({ ...formRdv, notes: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2 border-0 pt-0">
              <Button variant="danger" light onClick={() => setShowModal(false)}>
                Fermer
              </Button>
              <Button variant="primary" type="submit">
                {editId ? "Enregistrer" : "Confirmer le RDV"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Vue Calendrier ou Vue Liste */}
      {viewMode === "calendar" ? (
        <div className="card shadow-sm border-0 mb-4" style={{ borderRadius: "10px", overflow: "hidden" }}>
          {/* Topbar supérieure : Monthly / Weekly, Navigation, Request Approval (badge 7), Refresh */}
          <div className="cal-design-topbar px-3 px-md-4 py-2 d-flex align-items-center justify-content-between flex-wrap gap-2 bg-white border-bottom">
            {/* Onglets Monthly / Weekly */}
            <div className="d-flex align-items-center cal-tabs-nav">
              <button
                type="button"
                className={`cal-tab-btn ${activeView === "dayGridMonth" ? "active" : ""}`}
                onClick={() => handleViewChange("dayGridMonth")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`cal-tab-btn ${activeView === "timeGridWeek" ? "active" : ""}`}
                onClick={() => handleViewChange("timeGridWeek")}
              >
                Weekly
              </button>
            </div>

            {/* Navigation et Titre Mois/Année */}
            <div className="d-flex align-items-center gap-1 gap-md-2 cal-nav-group">
              <button
                type="button"
                className="btn btn-sm btn-outline-light text-secondary border cal-nav-btn"
                onClick={handlePrev}
                title="Précédent"
              >
                <i className="fa fa-chevron-left"></i>
              </button>
              <span className="cal-nav-title font-w600 text-dark px-1">
                {calendarTitle}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-light text-secondary border cal-nav-btn"
                onClick={handleNext}
                title="Suivant"
              >
                <i className="fa fa-chevron-right"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary ms-1 d-inline-flex align-items-center gap-1 cal-btn-today"
                onClick={handleToday}
                title="Revenir à aujourd'hui et centrer sur l'heure actuelle"
              >
                <i className="fa fa-calendar-check-o"></i>
                <span className="d-none d-sm-inline">Aujourd'hui</span>
                <span className="d-inline d-sm-none">Auj.</span>
              </button>
              <div
                className="d-none d-md-inline-flex align-items-center ms-2 px-2 py-1 rounded bg-light border text-primary font-w600 fs-12 shadow-sm"
                title="Heure réelle en direct"
              >
                <span className="spinner-grow spinner-grow-sm text-danger me-1" style={{ width: "7px", height: "7px" }}></span>
                <span>{liveTime}</span>
              </div>
            </div>

            {/* Actions à droite : Request Approval (badge 7) & Refresh */}
            <div className="d-flex align-items-center gap-1 gap-md-2">
              <button
                type="button"
                className="cal-btn-approval"
                onClick={() => setShowApprovalModal(true)}
                title={`Demandes de réservation en attente (${pendingCount})`}
                style={{
                  position: "relative",
                  background: pendingCount > 0 ? "rgba(239, 68, 68, 0.05)" : "#ffffff",
                  borderColor: pendingCount > 0 ? "#fca5a5" : "#e2e8f0",
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={pendingCount > 0 ? "#ef4444" : "currentColor"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`me-0 me-sm-1 ${pendingCount > 0 ? "text-danger" : "text-muted"}`}
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="d-none d-md-inline" style={{ color: pendingCount > 0 ? "#b91c1c" : "inherit", fontWeight: pendingCount > 0 ? 600 : 500 }}>
                  Demandes
                </span>
                {pendingCount > 0 && (
                  <span className="cal-badge-pill">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="cal-btn-refresh"
                onClick={async () => {
                  await fetchAppointments();
                  calendarRef.current?.getApi().refetchEvents();
                  Swal.fire({
                    icon: "success",
                    title: "Actualisé !",
                    timer: 800,
                    showConfirmButton: false,
                  });
                }}
                title="Actualiser l'agenda"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="me-0 me-sm-1"
                >
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                <span className="d-none d-md-inline">Refresh</span>
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            <style>{`
              .modern-calendar-wrapper {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                background-color: #ffffff;
              }

              /* Tabs Monthly / Weekly */
              .cal-tabs-nav {
                display: flex;
                align-items: center;
                gap: 4px;
              }
              .cal-tab-btn {
                background: none;
                border: none;
                padding: 10px 16px;
                font-size: 14px;
                font-weight: 500;
                color: #94a3b8;
                cursor: pointer;
                position: relative;
                transition: color 0.15s ease;
              }
              .cal-tab-btn:hover {
                color: #64748b;
              }
              .cal-tab-btn.active {
                color: #2563eb;
                font-weight: 600;
              }
              .cal-tab-btn.active::after {
                content: "";
                position: absolute;
                bottom: -9px;
                left: 14px;
                right: 14px;
                height: 2.5px;
                background-color: #2563eb;
                border-radius: 2px;
              }

              .cal-nav-title {
                font-size: 13.5px;
                letter-spacing: -0.2px;
              }
              .cal-nav-btn {
                width: 28px;
                height: 28px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                border-radius: 5px;
              }

              /* Approval Button with Badge */
              .cal-btn-approval {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 5px 12px;
                font-size: 11.5px;
                color: #475569;
                font-weight: 500;
                cursor: pointer;
                position: relative;
                transition: all 0.15s ease;
              }
              .cal-btn-approval:hover {
                background: #f8fafc;
                border-color: #cbd5e1;
              }
              .cal-badge-pill {
                position: absolute;
                top: -7px;
                right: -6px;
                background-color: #ef4444;
                color: #ffffff;
                font-size: 10px;
                font-weight: 700;
                min-width: 17px;
                height: 17px;
                border-radius: 9px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                box-shadow: 0 2px 4px rgba(239, 68, 68, 0.4);
              }

              /* Refresh Button */
              .cal-btn-refresh {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 5px 12px;
                font-size: 11.5px;
                color: #475569;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s ease;
              }
              .cal-btn-refresh:hover {
                background: #f8fafc;
                border-color: #cbd5e1;
                color: #2563eb;
              }

              /* FullCalendar Table Styles */
              .modern-calendar-wrapper .fc-theme-standard td,
              .modern-calendar-wrapper .fc-theme-standard th,
              .modern-calendar-wrapper .fc-theme-standard .fc-scrollgrid {
                border-color: #eaedf1 !important;
              }
              .modern-calendar-wrapper .fc-scrollgrid {
                border: none !important;
              }
              .modern-calendar-wrapper .fc-col-header {
                border-bottom: 1px solid #eaedf1 !important;
              }

              /* Clock icon in the top-left cell above time column */
              .modern-calendar-wrapper .fc-col-header-cell.fc-timegrid-axis {
                vertical-align: middle !important;
                text-align: center !important;
                background-color: #ffffff !important;
                border-right: 1px solid #eaedf1 !important;
                padding: 0 !important;
              }
              .modern-calendar-wrapper .fc-col-header-cell.fc-timegrid-axis .fc-timegrid-axis-cushion {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 100% !important;
                height: 100% !important;
                padding: 10px 0 !important;
              }
              .modern-calendar-wrapper .fc-col-header-cell.fc-timegrid-axis .fc-timegrid-axis-cushion::before {
                content: "";
                display: inline-block;
                width: 18px;
                height: 18px;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: center;
                background-size: contain;
              }

              /* Ligne rouge temps réel et flèche heure actuelle */
              .modern-calendar-wrapper .fc-timegrid-now-indicator-line {
                border-color: #ef4444 !important;
                border-width: 2.5px !important;
                z-index: 10 !important;
              }
              .modern-calendar-wrapper .fc-timegrid-now-indicator-arrow {
                border-color: #ef4444 !important;
                border-top-color: transparent !important;
                border-bottom-color: transparent !important;
                border-width: 6px !important;
                z-index: 10 !important;
              }

              /* Days Header Styling */
              .modern-calendar-wrapper .fc-col-header-cell {
                background-color: #ffffff !important;
                padding: 12px 0 !important;
              }
              .cal-custom-day-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              }
              .cal-day-num {
                font-size: 15.5px;
                font-weight: 800;
                color: #0f172a;
              }
              .cal-day-name {
                font-size: 13px;
                font-weight: 600;
                color: #64748b;
              }
              .cal-day-pill-today {
                background-color: #2563eb;
                color: #ffffff !important;
                font-size: 13px;
                font-weight: 800;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
              }
              .cal-header-today .cal-day-name {
                color: #2563eb;
                font-weight: 700;
              }
              .cal-header-sunday .cal-day-num,
              .cal-header-sunday .cal-day-name {
                color: #ef4444 !important;
              }

              /* Time Column & Slots (15-min intervals) - Agrandis et bien visibles */
              .modern-calendar-wrapper .fc-timegrid-slot-label-cushion {
                font-size: 13px !important;
                font-weight: 700 !important;
                color: #475569 !important;
                padding: 0 12px 0 14px !important;
                text-align: right !important;
                font-family: inherit !important;
                display: inline-block !important;
              }
              .modern-calendar-wrapper tr:not(.fc-timegrid-slot-minor) .fc-timegrid-slot-label-cushion {
                font-size: 15px !important;
                font-weight: 800 !important;
                color: #0f172a !important;
              }
              .modern-calendar-wrapper .fc-timegrid-slot {
                height: 92px !important;
              }
              .modern-calendar-wrapper .fc-timegrid-slot-lane {
                height: 92px !important;
              }
              .modern-calendar-wrapper .fc-timegrid-slot-label {
                height: 92px !important;
                vertical-align: middle !important;
              }
              .modern-calendar-wrapper .fc-timegrid-slot-minor {
                border-top: 1px dashed #e2e8f0 !important;
              }

              /* Petit icone plus gris dans les creneaux vides de l agenda */
              .modern-calendar-wrapper .fc-timegrid-col:not(.fc-timegrid-axis) .fc-timegrid-col-frame {
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='92' viewBox='0 0 24 92'%3E%3Cg stroke='%2394a3b8' stroke-width='1.8' stroke-linecap='round'%3E%3Cline x1='12' y1='68' x2='12' y2='80'/%3E%3Cline x1='6' y1='74' x2='18' y2='74'/%3E%3C/g%3E%3C/svg%3E");
                background-repeat: repeat-y;
                background-position: right 14px top 0px;
                background-size: 24px 92px;
              }
              .modern-calendar-wrapper .fc-timegrid-axis .fc-timegrid-col-frame {
                background-image: none !important;
              }

              /* Appointment Card Container with Drag & Drop styling */
              .modern-calendar-wrapper .fc-timegrid-event-harness {
                padding: 3px 5px !important;
              }
              .modern-calendar-wrapper .fc-timegrid-event,
              .modern-calendar-wrapper .fc-v-event {
                background: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 9px !important;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.04) !important;
                margin: 0 !important;
                overflow: hidden !important;
                cursor: grab !important;
                transition: transform 0.1s ease, box-shadow 0.15s ease-in-out !important;
              }
              .modern-calendar-wrapper .fc-timegrid-event:active {
                cursor: grabbing !important;
              }
              .modern-calendar-wrapper .fc-timegrid-event:hover {
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.14) !important;
                transform: translateY(-1px);
              }
              .modern-calendar-wrapper .fc-event-main {
                padding: 0 !important;
                height: 100% !important;
                display: flex !important;
                flex-direction: column !important;
              }

              .cal-card-box {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 100%;
                position: relative;
                background: #ffffff;
                border-radius: 9px;
                overflow: hidden;
              }
              .cal-card-top-stripe {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 5px;
                border-top-left-radius: 8px;
                border-top-right-radius: 8px;
              }
              .cal-card-content {
                padding: 5px 8px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 100%;
                min-height: 0;
                gap: 4px;
              }
              .cal-patient-name {
                font-size: 13px;
                font-weight: 700;
                color: #0f172a;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.25;
                margin-top: 2px;
                letter-spacing: -0.2px;
              }
              .cal-patient-reason {
                font-size: 11.5px;
                color: #475569;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.25;
                margin-top: 2px;
              }
              .cal-card-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 4px;
                padding-top: 3px;
              }
              .cal-card-time {
                font-size: 12px;
                color: #1e293b;
                font-weight: 600;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                letter-spacing: -0.1px;
              }
              .cal-badge-new {
                background-color: #16a34a;
                color: #ffffff;
                font-size: 9.5px;
                font-weight: 700;
                padding: 2px 7px;
                border-radius: 5px;
                letter-spacing: 0.3px;
                line-height: 1.2;
                text-transform: uppercase;
              }

              /* ========================================================
                 Ajustements mobiles et tablettes (Téléphone)
                 ======================================================== */
              @media (max-width: 768px) {
                .cal-design-topbar {
                  padding: 8px 10px !important;
                  gap: 6px !important;
                }
                .cal-tab-btn {
                  padding: 6px 10px !important;
                  font-size: 13px !important;
                }
                .cal-nav-group {
                  width: 100%;
                  justify-content: center;
                  order: 3;
                  margin-top: 2px;
                }
                .cal-nav-title {
                  font-size: 12px !important;
                  max-width: 155px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  text-align: center;
                }
                .cal-btn-today {
                  padding: 3px 8px !important;
                  font-size: 12px !important;
                }
                .cal-btn-approval {
                  padding: 5px 8px !important;
                  font-size: 11px !important;
                }
                .cal-btn-refresh {
                  padding: 5px 8px !important;
                  font-size: 11px !important;
                }

                /* AUCUN défilement horizontal sur mobile (pas de scroll droite/gauche) */
                .modern-calendar-wrapper {
                  overflow-x: hidden !important;
                  width: 100% !important;
                  max-width: 100% !important;
                }
                .modern-calendar-wrapper .fc,
                .modern-calendar-wrapper .fc-timeGridWeek-view,
                .modern-calendar-wrapper .fc-dayGridMonth-view,
                .modern-calendar-wrapper .fc-scrollgrid {
                  width: 100% !important;
                  max-width: 100% !important;
                  min-width: 0 !important;
                }

                /* ========================================================
                   Affichage garanti de la colonne du TEMPS (Heures) sur mobile
                   ======================================================== */
                /* Largeur nette pour la colonne des heures */
                .modern-calendar-wrapper .fc-col-header-cell.fc-timegrid-axis,
                .modern-calendar-wrapper .fc-timegrid-slot-label,
                .modern-calendar-wrapper .fc-timegrid-cols .fc-timegrid-axis {
                  width: 44px !important;
                  min-width: 44px !important;
                  max-width: 46px !important;
                }

                /* Cellule d'en-tête (au-dessus des heures) */
                .modern-calendar-wrapper .fc-col-header-cell.fc-timegrid-axis {
                  background-color: #ffffff !important;
                  z-index: 10 !important;
                }

                /* La colonne axis dans cols DOIT être transparente (pour ne pas masquer les heures) */
                .modern-calendar-wrapper .fc-timegrid-cols .fc-timegrid-axis {
                  background: transparent !important;
                  background-color: transparent !important;
                  box-shadow: none !important;
                  pointer-events: none !important;
                }

                /* Cellules des heures (08:00, 09:00, etc.) parfaitement visibles */
                .modern-calendar-wrapper .fc-timegrid-slot-label {
                  height: 60px !important;
                  vertical-align: middle !important;
                  position: relative !important;
                  z-index: 8 !important;
                  background-color: #ffffff !important;
                  border-right: 1px solid #eaedf1 !important;
                  padding: 0 !important;
                  visibility: visible !important;
                }

                .modern-calendar-wrapper .fc-timegrid-slot,
                .modern-calendar-wrapper .fc-timegrid-slot-lane {
                  height: 60px !important;
                }

                .modern-calendar-wrapper .fc-timegrid-slot-label-frame {
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  width: 100% !important;
                  height: 100% !important;
                }

                .modern-calendar-wrapper .fc-timegrid-slot-label-cushion,
                .modern-calendar-wrapper tr .fc-timegrid-slot-label-cushion,
                .modern-calendar-wrapper tr:not(.fc-timegrid-slot-minor) .fc-timegrid-slot-label-cushion {
                  font-size: 10.5px !important;
                  font-weight: 800 !important;
                  color: #0f172a !important;
                  display: block !important;
                  text-align: center !important;
                  padding: 0 1px !important;
                  white-space: nowrap !important;
                  opacity: 1 !important;
                  visibility: visible !important;
                }

                /* Petit icone plus gris dans les creneaux vides (mobile 60px) */
                .modern-calendar-wrapper .fc-timegrid-col:not(.fc-timegrid-axis) .fc-timegrid-col-frame {
                  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='60' viewBox='0 0 20 60'%3E%3Cg stroke='%2394a3b8' stroke-width='1.8' stroke-linecap='round'%3E%3Cline x1='10' y1='44' x2='10' y2='54'/%3E%3Cline x1='5' y1='49' x2='15' y2='49'/%3E%3C/g%3E%3C/svg%3E");
                  background-repeat: repeat-y;
                  background-position: right 6px top 0px;
                  background-size: 20px 60px;
                }
                .modern-calendar-wrapper .fc-timegrid-axis .fc-timegrid-col-frame {
                  background-image: none !important;
                }

                /* En-tête des jours empilé verticalement pour éviter tout chevauchement */
                .cal-custom-day-header {
                  flex-direction: column !important;
                  gap: 2px !important;
                  padding: 4px 0 !important;
                }
                .cal-day-num {
                  font-size: 12px !important;
                  line-height: 1.1;
                }
                .cal-day-name {
                  font-size: 11px !important;
                  line-height: 1.1;
                }
                .cal-day-pill-today {
                  width: 24px !important;
                  height: 24px !important;
                  font-size: 11px !important;
                }
                .cal-card-content {
                  padding: 4px 6px !important;
                  gap: 2px !important;
                }
                .cal-patient-name {
                  font-size: 12px !important;
                }
                .cal-patient-reason {
                  font-size: 10.5px !important;
                }
                .cal-card-time {
                  font-size: 9px !important;
                }
                .cal-badge-new {
                  font-size: 8px !important;
                  padding: 1px 4px !important;
                }
              }
            `}</style>

            <div className="modern-calendar-wrapper notranslate" translate="no">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={false}
                firstDay={new Date().getDay()}
                slotMinTime="08:00:00"
                slotMaxTime="18:00:00"
                slotDuration="00:30:00"
                slotLabelInterval="00:30:00"
                snapDuration="00:30:00"
                scrollTime={`${String(Math.max(8, new Date().getHours())).padStart(2, "0")}:${new Date().getMinutes() >= 30 ? "30" : "00"}:00`}
                scrollTimeReset={false}
                editable={true}
                droppable={true}
                eventResizableFromStart={true}
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  omitZeroMinute: false,
                }}
                datesSet={handleDatesSet}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                dayHeaderContent={(arg) => {
                  const d = arg.date;
                  const dayNum = d.getDate();
                  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
                  const dayName = dayNames[d.getDay()];
                  const isSunday = d.getDay() === 0;
                  const isFriday = d.getDay() === 5;
                  const isoD = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const closedMatch = getClosedDateMatch(isoD);
                  const isToday = arg.isToday;

                  return (
                    <div
                      className={`cal-custom-day-header ${isToday ? "cal-header-today" : ""} ${isSunday || isFriday || closedMatch ? "cal-header-sunday" : ""}`}
                      title={closedMatch ? `Fermé : ${closedMatch.reason || "Jour férié / Vacances"}` : undefined}
                    >
                      {isToday ? (
                        <span className="cal-day-pill-today">{dayNum}</span>
                      ) : (
                        <span className="cal-day-num">{dayNum}</span>
                      )}
                      <span className="cal-day-name">
                        {closedMatch && (
                          <span className="badge bg-danger text-white me-1" style={{ fontSize: "9px", padding: "2px 5px" }}>
                            Fermé
                          </span>
                        )}
                        {isToday ? (
                          <>
                            <span className="d-none d-md-inline">Aujourd'hui</span>
                            <span className="d-inline d-md-none">{dayName}</span>
                          </>
                        ) : (
                          dayName
                        )}
                      </span>
                    </div>
                  );
                }}
                slotEventOverlap={false}
                allDaySlot={false}
                nowIndicator={true}
                events={calendarEvents}
                eventContent={(eventInfo) => {
                  const rdv = eventInfo.event.extendedProps || {};
                  const accent = rdv.accentColor || "#ef4444";
                  const startTime = rdv.time || "09:00";

                  // Calcul du format d'heure "09:00 - 10:00"
                  const durationMin = parseInt(rdv.duration, 10) || 60;
                  const [h, m] = startTime.split(":").map(Number);
                  const totalMin = h * 60 + m + durationMin;
                  const endH = Math.floor(totalMin / 60);
                  const endM = String(totalMin % 60).padStart(2, "0");
                  const timeRange = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} - ${String(endH).padStart(2, "0")}:${endM}`;

                  const isConfirmed = Boolean(
                    rdv.status &&
                    (rdv.status.toLowerCase().startsWith("confirm") ||
                     rdv.status.toLowerCase().startsWith("arriv") ||
                     rdv.status.toLowerCase().startsWith("termin") ||
                     rdv.status.toLowerCase().startsWith("en consult"))
                  );
                  return (
                    <div className="cal-card-box">
                      <div
                        className="cal-card-top-stripe"
                        style={{ backgroundColor: accent }}
                      />
                      <div className="cal-card-content">
                        <div>
                          <div className="d-flex justify-content-between align-items-start gap-1">
                            <div className="cal-patient-name text-truncate" title={rdv.patientName} style={{ minWidth: 0, flex: 1 }}>
                              {(rdv.patientName || "").replace(/\s*\(sc\)/gi, "").trim()}
                            </div>

                            {/* 2 Icônes : ✓ Accepter & ✕ Refuser (affichées tant que non accepté ; masquées dès que accepté) */}
                            {!isConfirmed && (
                              <div
                                className="d-flex align-items-center gap-1 flex-shrink-0"
                                style={{ position: "relative", zIndex: 10 }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn p-0 d-inline-flex align-items-center justify-content-center shadow-xs"
                                  style={{
                                    width: "21px",
                                    height: "21px",
                                    minWidth: "21px",
                                    borderRadius: "50%",
                                    background: "#10b981",
                                    color: "#ffffff",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  title="Accepter ce rendez-vous (bloquer le créneau sur le site web)"
                                  onClick={(e) => handleAcceptRdv(rdv, e)}
                                >
                                  <i className="fa fa-check" style={{ fontSize: "10px", fontWeight: "bold" }}></i>
                                </button>

                                <button
                                  type="button"
                                  className="btn p-0 d-inline-flex align-items-center justify-content-center shadow-xs"
                                  style={{
                                    width: "21px",
                                    height: "21px",
                                    minWidth: "21px",
                                    borderRadius: "50%",
                                    background: "#ffffff",
                                    color: "#ef4444",
                                    border: "1.5px solid #ef4444",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  title="Refuser et supprimer ce rendez-vous"
                                  onClick={(e) => handleRefuseRdv(rdv, e)}
                                >
                                  <i className="fa fa-times" style={{ fontSize: "10px", fontWeight: "bold" }}></i>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="cal-patient-reason" title={rdv.date}>
                            {rdv.phone && <div style={{ fontWeight: 600, color: "#0f172a" }}>📞 {rdv.phone}</div>}
                            <div>{rdv.date}</div>
                          </div>
                        </div>

                        <div className="cal-card-footer d-flex justify-content-between align-items-center mt-1">
                          <span className="cal-card-time">
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ marginRight: "3px", flexShrink: 0 }}
                            >
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {rdv.time || timeRange}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
                eventClick={(info) => {
                  const rdv = appointments.find((a) => String(a.id) === info.event.id);
                  if (rdv) handleOpenEdit(rdv);
                }}
                dateClick={(info) => {
                  const clickedDate = info.dateStr.split("T")[0];
                  const clickedTime = info.dateStr.split("T")[1]?.substring(0, 5) || "09:00";
                  const defType =
                    consultationTypesList.find((t) => t.name === defaultConsultationTypeName) ||
                    consultationTypesList[0] ||
                    defaultConsultationTypes[0];
                  setEditId(null);
                  setIsGuestPatient(false);
                  setFormRdv({
                    patientId: patients[0]?.id || initialPatients[0]?.id || "sans_compte",
                    customPatientName: "",
                    date: clickedDate,
                    time: clickedTime,
                    duration: defType.duration || "20 min",
                    consultationType: defType.name,
                    price: defType.price || 2500,
                    reason: defType.name,
                    status: "Confirmé",
                    notes: "",
                  });
                  setShowModal(true);
                  setTimeout(() => {
                    document.getElementById("rdv-form-card")?.scrollIntoView({ behavior: "smooth" });
                  }, 50);
                }}
                height="auto"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header border-0 pb-2 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <h4 className="card-title mb-1">
                {listFilterScope === "upcoming" ? "Rendez-vous d'Aujourd'hui & À venir" : "Historique de toutes les réservations"}
              </h4>
              <p className="text-muted fs-12 mb-0">
                {listFilterScope === "upcoming"
                  ? "Affichage des rendez-vous à partir d'aujourd'hui (les rendez-vous passés d'hier sont masqués)."
                  : "Historique complet de toutes les réservations enregistrées au cabinet."}
              </p>
            </div>

            {/* Boutons de bascule : À venir vs Tout l'historique */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${listFilterScope === "upcoming" ? "btn-primary shadow-sm font-w600" : "btn-outline-primary"}`}
                style={{ borderRadius: "8px 0 0 8px", fontSize: "12px", padding: "6px 14px" }}
                onClick={() => setListFilterScope("upcoming")}
              >
                <i className="fa fa-calendar-check-o me-1"></i>
                Aujourd'hui & À venir ({upcomingCount})
              </button>
              <button
                type="button"
                className={`btn ${listFilterScope === "all" ? "btn-primary shadow-sm font-w600" : "btn-outline-primary"}`}
                style={{ borderRadius: "0 8px 8px 0", fontSize: "12px", padding: "6px 14px" }}
                onClick={() => setListFilterScope("all")}
              >
                <i className="fa fa-history me-1"></i>
                Tout l'historique ({appointments.length})
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive d-none d-md-block">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th><strong>DATE & HEURE</strong></th>
                    <th><strong>PATIENT</strong></th>
                    <th className="d-none d-md-table-cell"><strong>DURÉE</strong></th>
                    <th className="d-none d-md-table-cell"><strong>TÉLÉPHONE</strong></th>
                    <th className="d-none d-md-table-cell"><strong>STATUT</strong></th>
                    <th className="text-end"><strong>ACTIONS</strong></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        Aucun rendez-vous ne correspond aux critères.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((rdv) => (
                      <tr key={rdv.id}>
                        <td>
                          <div><strong>{rdv.date}</strong> à {rdv.time}</div>
                          <span className="badge badge-xs badge-info light mt-1">
                            Ticket N° {rdv.ticketNumber || calculateTicketNumber(rdv.time)}
                          </span>
                        </td>
                        <td>
                          <span className="font-w600 text-dark d-block">
                            {(rdv.patientName || "").replace(/\s*\(sc\)/gi, "").trim()}
                            
                          </span>
                          <div className="d-block d-md-none mt-1">
                            {getStatusBadge(rdv.status)}
                            <span className="text-muted fs-11 ms-2">⏱ {rdv.duration}</span>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">{rdv.duration}</td>
                        <td className="d-none d-md-table-cell">{rdv.phone}</td>
                        <td className="d-none d-md-table-cell">{getStatusBadge(rdv.status)}</td>
                        <td className="text-end">
                          {rdv.status === "En attente" || (rdv.status && rdv.status.toLowerCase().includes("attente")) ? (
                            <div className="d-inline-flex align-items-center gap-2">
                              {/* 2 icônes pour demande de réservation : ✓ Accepter & ✕ Refuser */}
                              <button
                                type="button"
                                className="btn p-0 d-inline-flex align-items-center justify-content-center shadow-xs"
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  minWidth: "28px",
                                  borderRadius: "50%",
                                  background: "#10b981",
                                  color: "#ffffff",
                                  border: "none",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 5px rgba(16, 185, 129, 0.3)",
                                  transition: "all 0.15s ease",
                                }}
                                title="Accepter ce rendez-vous (bloquer le créneau sur le site web)"
                                onClick={(e) => handleAcceptRdv(rdv, e)}
                              >
                                <i className="fa fa-check" style={{ fontSize: "12px", fontWeight: "bold" }}></i>
                              </button>

                              <button
                                type="button"
                                className="btn p-0 d-inline-flex align-items-center justify-content-center shadow-xs"
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  minWidth: "28px",
                                  borderRadius: "50%",
                                  background: "#ffffff",
                                  color: "#ef4444",
                                  border: "1.5px solid #ef4444",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 5px rgba(239, 68, 68, 0.15)",
                                  transition: "all 0.15s ease",
                                }}
                                title="Refuser et supprimer ce rendez-vous"
                                onClick={(e) => handleRefuseRdv(rdv, e)}
                              >
                                <i className="fa fa-times" style={{ fontSize: "12px", fontWeight: "bold" }}></i>
                              </button>
                            </div>
                          ) : (
                            <div className="d-inline-flex align-items-center gap-2">
                              <button
                                type="button"
                                className={`btn-action-simple btn-arrive ${rdv.status === "Arrivé" ? "active" : ""}`}
                                onClick={() => handleMarkArrived(rdv)}
                                title="Marquer comme Arrivé (Ajouter à la salle d'attente)"
                              >
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                  <circle cx="8.5" cy="7" r="4" />
                                  <polyline points="17 11 19 13 23 9" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="btn-action-simple btn-edit"
                                onClick={() => handleOpenEdit(rdv)}
                                title="Modifier"
                              >
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                className="btn-action-simple btn-delete"
                                onClick={() => handleDeleteRdv(rdv.id)}
                                title="Supprimer"
                              >
                                <svg
                                  width="15"
                                  height="15"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* VUE MOBILE SPÉCIALE : CARTES RDV POUR SMARTPHONE */}
            <div className="d-block d-md-none">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  Aucun rendez-vous ne correspond aux critères.
                </div>
              ) : (
                filteredAppointments.map((rdv) => (
                  <div
                    key={rdv.id}
                    className="card border mb-3 shadow-none"
                    style={{
                      borderRadius: "0.85rem",
                      borderColor: "#e2e8f0",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <div
                      className="p-3 border-bottom d-flex justify-content-between align-items-center"
                      style={{ backgroundColor: "#f8fafc" }}
                    >
                      <span className="badge badge-info light font-w700 fs-12">
                        Ticket N° {rdv.ticketNumber || calculateTicketNumber(rdv.time)}
                      </span>
                      <span className="font-w600 text-dark fs-12 d-flex align-items-center gap-1">
                        <i className="fa fa-clock-o text-primary"></i>
                        {rdv.date} à {rdv.time}
                      </span>
                    </div>

                    <div className="p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="text-muted fs-11 text-uppercase font-w600 d-block">
                            PATIENT
                          </span>
                          <h5 className="font-w700 text-dark mb-0 fs-15">
                            {(rdv.patientName || "").replace(/\s*\(sc\)/gi, "").trim()}
                          </h5>
                        </div>
                        {getStatusBadge(rdv.status)}
                      </div>

                      <div className="d-flex align-items-center gap-3 mt-2 pt-2 border-top fs-12">
                        <span className="text-muted d-flex align-items-center gap-1">
                          <i className="fa fa-hourglass-half text-primary"></i>
                          <span>{rdv.duration}</span>
                        </span>
                        {rdv.phone && (
                          <a
                            href={`tel:${rdv.phone}`}
                            className="text-primary font-w600 text-decoration-none d-flex align-items-center gap-1"
                          >
                            <i className="fa fa-phone text-success"></i>
                            <span>{rdv.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div
                      className="p-2 px-3 border-top d-flex justify-content-end align-items-center gap-2"
                      style={{ backgroundColor: "#ffffff" }}
                    >
                      {rdv.status === "En attente" || (rdv.status && rdv.status.toLowerCase().includes("attente")) ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger btn-rounded d-flex align-items-center gap-1 px-3"
                            onClick={(e) => handleRefuseRdv(rdv, e)}
                            style={{ fontSize: "12px", fontWeight: "600" }}
                          >
                            <i className="fa fa-times"></i>
                            <span>Refuser</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-success btn-rounded text-white d-flex align-items-center gap-1 px-3"
                            onClick={(e) => handleAcceptRdv(rdv, e)}
                            style={{ fontSize: "12px", fontWeight: "600" }}
                          >
                            <i className="fa fa-check"></i>
                            <span>Accepter</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={`btn btn-sm btn-rounded d-flex align-items-center gap-1 px-3 ${
                              rdv.status === "Arrivé"
                                ? "btn-success text-white"
                                : "btn-outline-primary"
                            }`}
                            onClick={() => handleMarkArrived(rdv)}
                            style={{ fontSize: "12px", fontWeight: "600" }}
                          >
                            <i className="fa fa-check-circle"></i>
                            <span>{rdv.status === "Arrivé" ? "Arrivé" : "Marquer Arrivé"}</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info btn-rounded d-flex align-items-center gap-1 px-2"
                            onClick={() => handleOpenEdit(rdv)}
                            title="Modifier"
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger btn-rounded d-flex align-items-center gap-1 px-2"
                            onClick={() => handleDeleteRdv(rdv.id)}
                            title="Supprimer"
                          >
                            <i className="fa fa-trash"></i>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal Liste des Demandes de Réservation en Attente */}
      <Modal
        show={showApprovalModal}
        onHide={() => setShowApprovalModal(false)}
        size="lg"
        centered
        enforceFocus={false}
        restoreFocus={false}
      >
        <Modal.Header closeButton style={{ borderBottom: "1px solid #f1f5f9", padding: "16px 20px" }}>
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: pendingCount > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(37, 99, 235, 0.1)",
                color: pendingCount > 0 ? "#ef4444" : "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i className="fa fa-calendar-check-o fs-18"></i>
            </div>
            <div>
              <Modal.Title style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                Demandes de Réservation en Ligne
              </Modal.Title>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {pendingCount === 0
                  ? "Aucune nouvelle demande en attente"
                  : `${pendingCount} demande${pendingCount > 1 ? "s" : ""} en attente de confirmation`}
              </div>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px", maxHeight: "65vh", overflowY: "auto", background: "#f8fafc" }}>
          {pendingAppointments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                background: "#ffffff",
                borderRadius: "14px",
                border: "1px dashed #cbd5e1",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <i className="fa fa-check fs-24"></i>
              </div>
              <h5 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                Toutes les demandes sont traitées
              </h5>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Dès qu'un client réserve en ligne sur le portail patient, la demande apparaîtra ici et incrémentera le compteur.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {pendingAppointments.map((rdv) => (
                <div
                  key={rdv.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderLeft: "4px solid #f59e0b",
                    borderRadius: "12px",
                    padding: "16px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div style={{ minWidth: "220px", flex: 1 }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                        {(rdv.patientName || "Patient").replace(/\s*\(sc\)/gi, "").trim()}
                      </span>
                      {rdv.ticketNumber && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: "rgba(37, 99, 235, 0.1)",
                            color: "#2563eb",
                          }}
                        >
                          Ticket #{rdv.ticketNumber}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: "700",
                          padding: "2px 7px",
                          borderRadius: "999px",
                          background: "rgba(245, 158, 11, 0.12)",
                          color: "#d97706",
                        }}
                      >
                        En attente
                      </span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "12.5px", color: "#475569" }}>
                      {rdv.phone && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                          📞 {rdv.phone}
                        </span>
                      )}
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        📅 {rdv.date} à 🕒 {rdv.time}
                      </span>
                      {rdv.reason && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#64748b" }}>
                          🏷️ {rdv.reason}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 shadow-xs"
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                      }}
                      onClick={async () => {
                        await handleAcceptRdv(rdv);
                      }}
                      title="Accepter le rendez-vous et bloquer le créneau sur le site web"
                    >
                      <i className="fa fa-check"></i>
                      <span>Accepter</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                      style={{
                        padding: "7px 14px",
                        borderRadius: "8px",
                        fontSize: "12.5px",
                        fontWeight: "600",
                      }}
                      onClick={() => {
                        handleRefuseRdv(rdv);
                      }}
                      title="Refuser et supprimer ce rendez-vous"
                    >
                      <i className="fa fa-times"></i>
                      <span>Refuser</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #f1f5f9", padding: "12px 20px" }}>
          <Button variant="secondary" size="sm" onClick={() => setShowApprovalModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
};

export default AppointmentsPage;
