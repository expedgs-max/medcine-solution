import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";
import {
  initialWaitingRoom,
  initialPatients,
} from "../../../services/CabinetData";

// Créneaux horaires officiels pour calcul du ticket réservé
const ALL_DAY_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

const calculateTicketNumber = (timeStr) => {
  if (!timeStr) return 1;
  const normalized = timeStr.trim().substring(0, 5).padStart(5, "0");
  const idx = ALL_DAY_SLOTS.indexOf(normalized);
  if (idx !== -1) return idx + 1;
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return 1;
  const totalMin = h * 60 + m;
  const startMin = 9 * 60; // 09:00
  const diff = totalMin - startMin;
  if (diff < 0) return 1;
  return Math.floor(diff / 30) + 1;
};

const WaitingRoomPage = () => {
  const navigate = useNavigate();
  const [waitingList, setWaitingList] = useState(() => {
    try {
      const saved = localStorage.getItem("cabinet_waiting_list");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (p) => p.patientName !== "Sophie Bernard" && p.patientName !== "Marc Lemoine"
          );
        }
      }
    } catch (e) {}
    return [];
  });
  const [patients, setPatients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientInputSearch, setPatientInputSearch] = useState("");
  const [newArrival, setNewArrival] = useState({
    patientId: "",
    patientName: "",
    isNewPatient: false,
    appointmentTime: "11:30",
    reason: "Consultation générale",
  });

  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: `${(p.firstName || "")} ${(p.lastName || "").toUpperCase()} (${p.fileNumber || ""})`,
    patient: p,
  }));

  const selectedPatientOption = newArrival.patientId
    ? patientOptions.find((opt) => String(opt.value) === String(newArrival.patientId)) ||
      (newArrival.patientName
        ? { value: newArrival.patientId, label: newArrival.patientName }
        : null)
    : newArrival.patientName
    ? { value: "new_patient", label: newArrival.patientName }
    : null;

  const patientSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "0.5rem",
      borderColor: state.isFocused ? "#1e60d5" : "#e4e7ea",
      boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(30, 96, 213, 0.15)" : "none",
      "&:hover": {
        borderColor: "#1e60d5",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#1e60d5"
        : state.isFocused
        ? "rgba(30, 96, 213, 0.08)"
        : "transparent",
      color: state.isSelected ? "#ffffff" : "#333333",
      fontSize: "13px",
      cursor: "pointer",
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: "13.5px",
      fontWeight: "500",
      color: "#333333",
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: "13px",
      color: "#9ca3af",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      borderRadius: "0.5rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    }),
  };
  const [activeCalledId, setActiveCalledId] = useState(() => {
    try {
      const saved = localStorage.getItem("current_called_patient");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.patientId || parsed.id || null;
      }
    } catch (e) {}
    return null;
  });

  const getTicketNum = (p) => {
    if (p?.ticketNumber && !isNaN(Number(p.ticketNumber))) {
      return Number(p.ticketNumber);
    }
    return calculateTicketNumber(p?.appointmentTime);
  };

  const broadcastWaitingList = (list) => {
    try {
      localStorage.setItem("cabinet_waiting_list", JSON.stringify(list));
      const channel = new BroadcastChannel("waiting_room_display_channel");
      channel.postMessage({ type: "UPDATE_LIST", list });
      channel.close();
    } catch (e) {}
  };

  useEffect(() => {
    // 1. Synchroniser depuis MySQL API uniquement (données réelles)
    const loadWaitingFromApi = async () => {
      try {
        const data = await ApiService.getWaitingRoom();
        if (Array.isArray(data)) {
          const filtered = data.filter(
            (p) => p.patientName !== "Sophie Bernard" && p.patientName !== "Marc Lemoine"
          );
          setWaitingList(filtered);
          localStorage.setItem("cabinet_waiting_list", JSON.stringify(filtered));
        }
      } catch (err) {
        console.warn("Erreur chargement salle d'attente MySQL :", err);
      }

      try {
        const pData = await ApiService.getPatients();
        const clean = (Array.isArray(pData) ? pData : []).filter((p) => {
          const last = (p.lastName || "").toLowerCase().trim();
          const first = (p.firstName || "").toLowerCase().trim();
          return (
            !["dubois", "lemoine", "bernard", "moreau", "belkacem"].includes(last) &&
            !["claire", "marc", "sophie", "lucas", "yasmine"].includes(first)
          );
        });
        setPatients(clean);
        if (clean.length > 0) {
          setNewArrival((prev) => ({ ...prev, patientId: clean[0].id }));
        }
      } catch (err) {
        console.warn("Erreur chargement patients dans salle d'attente :", err);
      }
    };
    loadWaitingFromApi();

    // 2. Écouter le BroadcastChannel pour les arrivées en direct (ex: depuis l'agenda)
    let channel;
    try {
      channel = new BroadcastChannel("waiting_room_display_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "UPDATE_LIST" && Array.isArray(event.data.list)) {
          setWaitingList(event.data.list);
        }
      };
    } catch (e) {}

    // 3. Écouter les modifications du localStorage (depuis l'agenda dans le même navigateur)
    const handleStorage = (e) => {
      if (e.key === "cabinet_waiting_list" && e.newValue) {
        try {
          setWaitingList(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Polling périodique léger toutes les 10 secondes
    const interval = setInterval(() => {
      loadWaitingFromApi();
    }, 10000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleCallPatient = (patient) => {
    setActiveCalledId(patient.id);

    // Retirer automatiquement le patient précédent de la liste d'attente (mis à "Terminé")
    const previousCalled = waitingList.filter(
      (p) => p.id !== patient.id && (p.status === "Appelé" || p.status === "En consultation" || p.id === activeCalledId)
    );
    for (const prev of previousCalled) {
      ApiService.updateWaitingStatus(prev.id, "Terminé").catch((e) =>
        console.warn("Erreur mise à jour statut Terminé :", e)
      );
    }

    // Mettre à jour la liste locale : le patient précédent est retiré, le nouveau passe à "Appelé"
    const updated = waitingList
      .filter(
        (p) => !(p.id !== patient.id && (p.status === "Appelé" || p.status === "En consultation" || p.id === activeCalledId))
      )
      .map((p) =>
        p.id === patient.id ? { ...p, status: "Appelé" } : p
      );
    setWaitingList(updated);
    broadcastWaitingList(updated);

    ApiService.updateWaitingStatus(patient.id, "Appelé").catch((e) =>
      console.warn("Erreur mise à jour statut MySQL :", e)
    );

    const ticketNum = patient.ticketNumber || calculateTicketNumber(patient.appointmentTime);
    const callPayload = {
      patientId: patient.patientId || patient.id,
      patientName: patient.patientName,
      ticketNumber: ticketNum,
      appointmentTime: patient.appointmentTime,
      doctorName: "Dr N. BELBACHIR OULD HENNIA",
      room: "Cabinet de Consultation N° 1",
      calledAt: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem("current_called_patient", JSON.stringify(callPayload));
      const channel = new BroadcastChannel("waiting_room_display_channel");
      channel.postMessage({ type: "CALL_PATIENT", data: callPayload });
      channel.close();
    } catch (e) {}

    Swal.fire({
      icon: "info",
      title: "Patient appelé !",
      text: `${patient.patientName} a été appelé(e) et affiché(e) en grand sur l'écran de la salle d'attente.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleStartConsultation = (patient) => {
    setActiveCalledId(patient.id);
    const updated = waitingList.map((p) =>
      p.id === patient.id ? { ...p, status: "En consultation" } : p
    );
    setWaitingList(updated);
    broadcastWaitingList(updated);

    ApiService.updateWaitingStatus(patient.id, "En consultation").catch((e) =>
      console.warn("Erreur mise à jour statut MySQL :", e)
    );

    if (patient.patientId) {
      navigate(`/consultations?patientId=${patient.patientId}`);
    } else {
      navigate(`/consultations?patientName=${encodeURIComponent(patient.patientName)}&appointmentId=${patient.appointmentId || ""}`);
    }
  };

  const handleRemovePatient = (id) => {
    Swal.fire({
      title: "Supprimer de la salle d'attente ?",
      text: "Le patient sera définitivement supprimé de la salle d'attente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#f72b50",
      cancelButtonColor: "#6c757d",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const updated = waitingList.filter((p) => p.id !== id);
        setWaitingList(updated);
        broadcastWaitingList(updated);

        // Suppression directe dans la base de données MySQL
        try {
          await ApiService.deleteWaitingPatient(id);
        } catch (err) {
          console.warn("Erreur suppression patient MySQL :", err);
        }

        Swal.fire({
          icon: "success",
          title: "Supprimé !",
          text: "Le patient a été supprimé de la salle d'attente.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleRegisterArrival = async (e) => {
    e.preventDefault();

    let typedName = (newArrival.patientName || "").trim();
    if (!typedName && patientInputSearch?.trim()) {
      typedName = patientInputSearch.trim();
    }

    let pat = null;
    let createdNewDossier = false;

    if (newArrival.patientId && !String(newArrival.patientId).startsWith("new_")) {
      pat = patients.find((p) => p.id === parseInt(newArrival.patientId));
    }

    // Si le patient n'existe pas ou un nouveau nom a été saisi -> CRÉER UN NOUVEAU DOSSIER MÉDICAL DANS MYSQL !
    if (!pat || newArrival.isNewPatient || String(newArrival.patientId).startsWith("new_")) {
      const nameToUse = typedName || newArrival.patientName || "Nouveau Patient";
      if (!nameToUse.trim()) {
        Swal.fire("Attention", "Veuillez sélectionner un patient ou écrire son nom pour créer son dossier médical.", "warning");
        return;
      }
      const parts = nameToUse.split(/\s+/);
      const lastName = parts[0] ? parts[0].toUpperCase() : "PATIENT";
      const firstName = parts.length > 1 ? parts.slice(1).join(" ") : nameToUse;

      try {
        const createRes = await ApiService.createPatient({
          firstName: firstName,
          lastName: lastName,
          gender: "Féminin",
          status: "Actif",
          bloodGroup: "O+",
          allergies: ["Aucune allergie connue"],
        });

        const createdData = createRes?.data || createRes;
        const newFileNum =
          createdData?.fileNumber ||
          `DOS-${new Date().getFullYear()}-${String(patients.length + 1).padStart(3, "0")}`;

        pat = {
          id: createdData?.id || Date.now(),
          fileNumber: newFileNum,
          firstName: firstName,
          lastName: lastName,
          ddr: "-",
          terme: "-",
          status: "Actif",
        };

        setPatients((prev) => [pat, ...prev]);
        createdNewDossier = true;
      } catch (err) {
        console.warn("Erreur création dossier médical :", err);
        const newFileNum = `DOS-${new Date().getFullYear()}-${String(patients.length + 1).padStart(3, "0")}`;
        pat = {
          id: Date.now(),
          fileNumber: newFileNum,
          firstName: firstName,
          lastName: lastName,
          ddr: "-",
          terme: "-",
          status: "Actif",
        };
        setPatients((prev) => [pat, ...prev]);
        createdNewDossier = true;
      }
    }

    if (!pat) {
      Swal.fire("Attention", "Impossible de valider l'arrivée. Veuillez renseigner le nom du patient.", "warning");
      return;
    }

    const now = new Date();
    const arrivalTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    try {
      const res = await ApiService.createWaitingArrival({
        patientId: pat.id,
        appointmentTime: newArrival.appointmentTime,
        arrivalTime: arrivalTime,
        reason: newArrival.reason,
      });

      const newId = res?.data?.id || Date.now();

      const created = {
        id: newId,
        patientId: pat.id,
        patientName: `${pat.firstName || ""} ${pat.lastName || ""}`.trim() || pat.name || "Patient",
        fileNumber: pat.fileNumber || `DOS-${pat.id}`,
        appointmentTime: newArrival.appointmentTime,
        arrivalTime: arrivalTime,
        reason: newArrival.reason,
        waitTimeMinutes: 0,
        status: "En attente",
      };

      const updated = [created, ...waitingList];
      setWaitingList(updated);
      broadcastWaitingList(updated);
      setShowAddModal(false);
      setPatientInputSearch("");
      setNewArrival({
        patientId: "",
        patientName: "",
        isNewPatient: false,
        appointmentTime: "11:30",
        reason: "Consultation générale",
      });

      if (createdNewDossier) {
        Swal.fire({
          icon: "success",
          title: "Dossier créé & Arrivée enregistrée !",
          html: `Le dossier médical <strong>${created.fileNumber}</strong> a été créé dans la base de données pour <strong>${created.patientName}</strong> et son arrivée a été validée.`,
          timer: 3000,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Arrivée enregistrée",
          text: `${created.patientName} a été ajouté(e) en salle d'attente.`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.warn("Erreur enregistrement arrivée :", err);
    }
  };

  const waitingCount = waitingList.filter((p) => p.status === "En attente").length;
  const inConsultCount = waitingList.filter((p) => p.status === "En consultation").length;

  // Patient actuellement en consultation ou appelé
  const currentInConsultation =
    (activeCalledId && waitingList.find((p) => p.id === activeCalledId || p.patientId === activeCalledId)) ||
    waitingList.find((p) => p.status === "En consultation") ||
    waitingList.find((p) => p.status === "Appelé") ||
    null;

  // Patients qui sont actuellement en attente
  const waitingPatients = waitingList.filter((p) => p.status === "En attente");

  // Calcul automatique du patient suivant selon l'ordre logique des numéros de tickets
  const getNextPatient = () => {
    if (waitingPatients.length === 0) return null;

    // Trier les patients en attente par numéro de ticket croissant (#1, #2, #3, ...)
    const sortedWaiting = [...waitingPatients].sort(
      (a, b) => getTicketNum(a) - getTicketNum(b)
    );

    if (currentInConsultation) {
      const currentTicket = getTicketNum(currentInConsultation);
      // Chercher le premier patient en attente dont le ticket est strictement supérieur à celui en cours
      const nextAfterCurrent = sortedWaiting.find(
        (p) => getTicketNum(p) > currentTicket
      );
      // Si trouvé, c'est le patient suivant
      if (nextAfterCurrent) return nextAfterCurrent;

      // Si aucun ticket n'est supérieur, le patient actuel est le dernier de la journée !
      return null;
    }

    // Si aucun patient n'est encore en consultation, commencer par le premier ticket en attente
    return sortedWaiting[0];
  };

  const nextPatientToCall = getNextPatient();

  const handleCallNextPatient = () => {
    const nextPatient = getNextPatient();
    if (!nextPatient) {
      Swal.fire({
        icon: "info",
        title: "Fin des consultations",
        text: "C'était le dernier patient de la journée. Il n'y a plus de patients dans la salle d'attente.",
        confirmButtonColor: "#1e60d5",
        confirmButtonText: "D'accord",
      });
      return;
    }
    handleCallPatient(nextPatient);
  };

  return (
    <>
      <PageTitle motherMenu="Principal" activeMenu="Salle d'attente" />

      {/* Barre d'action */}
      <div className="form-head d-flex mb-3 mb-md-4 align-items-center flex-wrap justify-content-between gap-2">
        <div className="d-flex align-items-center gap-3 text-muted fs-14">
          <span>
            <strong className="text-dark font-w600">{waitingCount}</strong> patient(s) en attente
          </span>
          {inConsultCount > 0 && (
            <span>
              • <strong className="text-primary font-w600">{inConsultCount}</strong> en consultation
            </span>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">


          <Button
            variant="primary"
            className="btn-rounded"
            onClick={() => setShowAddModal(true)}
          >
            <i className="flaticon-381-add-1 me-2"></i> Enregistrer une Arrivée
          </Button>
        </div>
      </div>

      {/* Tableau de la Salle d'attente en temps réel */}
      <div className="card">
        <div className="card-header border-0 pb-0 row align-items-center g-3">
          {/* Titre à gauche */}
          <div className="col-12 col-md-4 col-xl-4 text-start">
            <h4 className="card-title mb-1">Patients actuellement au cabinet</h4>
            <p className="text-muted fs-13 mb-0">
              Mise à jour en temps réel pour le cabinet et le secrétariat
            </p>
          </div>

          {/* Carré : Patient en consultation & Flèche > centrés au milieu de l'écran */}
          <div className="col-12 col-md-8 col-xl-4 d-flex justify-content-center justify-content-md-end justify-content-xl-center">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center px-3 py-2 rounded-3 border"
                style={{
                  backgroundColor: currentInConsultation ? "#f0fdf4" : "#f8fafc",
                  borderColor: currentInConsultation ? "#86efac" : "#e2e8f0",
                  minWidth: "240px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                }}
              >
                {currentInConsultation ? (
                  <>
                    <span
                      className="badge bg-success text-white font-w800 me-2"
                      style={{
                        fontSize: "13px",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      #{getTicketNum(currentInConsultation)}
                    </span>
                    <div className="text-truncate" style={{ maxWidth: "160px" }}>
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "#15803d",
                        }}
                      >
                        {currentInConsultation.status === "En consultation"
                          ? "En consultation"
                          : "Patient en cours"}
                      </div>
                      <strong className="text-dark fs-14 d-block text-truncate">
                        {currentInConsultation.patientName}
                      </strong>
                    </div>
                  </>
                ) : (
                  <div className="text-muted fs-13 d-flex align-items-center gap-2 py-1">
                    <i className="flaticon-381-user-9 opacity-50"></i>
                    <span>Aucun patient en consultation</span>
                  </div>
                )}
              </div>

              {/* Bouton Flèche > pour appeler directement le patient suivant selon le N° de ticket */}
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center justify-content-center shadow"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: "#1e60d5",
                  borderColor: "#1e60d5",
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onClick={handleCallNextPatient}
                title={
                  nextPatientToCall
                    ? `Appeler le patient suivant : ${nextPatientToCall.patientName} (Ticket #${getTicketNum(nextPatientToCall)})`
                    : "C'était le dernier patient de la journée (plus de patients en attente)"
                }
              >
                <i className="fa fa-chevron-right text-white"></i>
              </button>
            </div>
          </div>

          {/* Espace droit pour équilibrer le centrage exact sur grand écran */}
          <div className="d-none d-xl-block col-xl-4"></div>
        </div>
        <div className="card-body">
          <div className="table-responsive d-none d-md-block" style={{ overflowX: "hidden" }}>
            <table className="table table-hover mb-0" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "65px", minWidth: "55px" }}><strong>TICKET</strong></th>
                  <th className="d-none d-md-table-cell"><strong>ARRIVÉE</strong></th>
                  <th className="d-none d-md-table-cell"><strong>RDV PRÉVU</strong></th>
                  <th><strong>PATIENT</strong></th>
                  <th className="d-none d-md-table-cell"><strong>MOTIF</strong></th>
                  <th className="d-none d-md-table-cell"><strong>STATUT</strong></th>
                  <th className="text-end text-md-start" style={{ width: "95px" }}><strong>ACTIONS</strong></th>
                </tr>
              </thead>
              <tbody>
                {waitingList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <i className="flaticon-381-clock fs-36 d-block mb-2 text-primary"></i>
                      La salle d'attente est actuellement vide.
                    </td>
                  </tr>
                ) : (
                  waitingList.map((p) => (
                    <tr
                      key={p.id}
                      className={p.status === "En consultation" ? "bg-light-primary" : ""}
                    >
                      <td>
                        <span className="badge badge-info light font-w800" style={{ fontSize: "12px", padding: "4px 8px" }}>
                          #{p.ticketNumber || calculateTicketNumber(p.appointmentTime)}
                        </span>
                        {/* Heure d'arrivée visible sous le ticket uniquement sur mobile */}
                        <div className="d-block d-md-none text-primary font-w600 mt-1" style={{ fontSize: "11px" }}>
                          {p.arrivalTime}
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="font-w600 text-primary">
                          {p.arrivalTime}
                        </span>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="text-muted">{p.appointmentTime}</span>
                      </td>
                      <td>
                        {p.patientId ? (
                          <Link
                            to={`/patient-details?id=${p.patientId}`}
                            className="font-w600 text-dark hover-primary"
                          >
                            {p.patientName}
                          </Link>
                        ) : (
                          <span className="font-w600 text-dark">
                            {p.patientName}{" "}
                            {p.phone ? <div className="text-muted fs-12 mt-1">📞 {p.phone}</div> : null}
                          </span>
                        )}
                        {/* Motif et statut visibles sous le nom uniquement sur mobile */}
                        <div className="d-block d-md-none mt-1">
                          {p.reason && (
                            <div className="text-muted fs-11 text-truncate" style={{ maxWidth: "150px" }}>
                              {p.reason}
                            </div>
                          )}
                          <div className="mt-1">
                            <span className="appointment-status-badge" style={{ padding: "2px 6px", fontSize: "10px" }}>
                              <span className="status-dot"></span>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">{p.reason}</td>
                      <td className="d-none d-md-table-cell">
                        <span className="appointment-status-badge">
                          <span className="status-dot"></span>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center justify-content-end justify-content-md-start">
                          {p.status === "En attente" && (
                            <button
                              type="button"
                              className="btn btn-warning shadow btn-xs sharp me-1 text-white"
                              onClick={() => handleCallPatient(p)}
                              title="Appeler le patient dans le cabinet"
                            >
                              <i className="fa fa-bell"></i>
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-primary shadow btn-xs sharp me-1"
                            onClick={() => handleStartConsultation(p)}
                            title="Ouvrir la consultation clinique"
                          >
                            <i className="fa fa-stethoscope"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger shadow btn-xs sharp"
                            onClick={() => handleRemovePatient(p.id)}
                            title="Retirer de la salle d'attente"
                          >
                            <i className="fa fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* VUE MOBILE SPÉCIALE : CARTES SALLE D'ATTENTE POUR SMARTPHONE */}
          <div className="d-block d-md-none">
            {waitingList.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="flaticon-381-clock fs-36 d-block mb-2 text-primary"></i>
                La salle d'attente est actuellement vide.
              </div>
            ) : (
              waitingList.map((p) => (
                <div
                  key={p.id}
                  className={`card border mb-3 shadow-none ${p.status === "En consultation" ? "border-primary" : ""}`}
                  style={{
                    borderRadius: "0.85rem",
                    borderColor: p.status === "En consultation" ? "#1e60d5" : "#e2e8f0",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div
                    className="p-3 border-bottom d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: p.status === "En consultation" ? "#eff6ff" : "#f8fafc" }}
                  >
                    <span className="badge badge-info light font-w800 fs-13">
                      #{p.ticketNumber || calculateTicketNumber(p.appointmentTime)}
                    </span>
                    <span className="font-w600 text-dark fs-12 d-flex align-items-center gap-1">
                      <i className="fa fa-clock-o text-primary"></i>
                      Arrivée : {p.arrivalTime}
                    </span>
                  </div>

                  <div className="p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="text-muted fs-11 text-uppercase font-w600 d-block">
                          PATIENT
                        </span>
                        <h5 className="font-w700 text-dark mb-0 fs-15">
                          {p.patientName}
                        </h5>
                      </div>
                      <span className="appointment-status-badge" style={{ padding: "4px 8px", fontSize: "11px" }}>
                        <span className="status-dot"></span>
                        {p.status}
                      </span>
                    </div>

                    {(p.reason || p.phone) && (
                      <div className="mt-2 pt-2 border-top fs-12">
                        {p.reason && (
                          <div className="text-dark mb-1">
                            <span className="text-muted font-w600">Motif :</span> {p.reason}
                          </div>
                        )}
                        {p.phone && (
                          <a
                            href={`tel:${p.phone}`}
                            className="text-primary font-w600 text-decoration-none d-flex align-items-center gap-1"
                          >
                            <i className="fa fa-phone text-success"></i>
                            <span>{p.phone}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className="p-2 px-3 border-top d-flex justify-content-end align-items-center gap-2"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    {p.status === "En attente" && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-warning btn-rounded d-flex align-items-center gap-1 px-3 text-dark"
                        onClick={() => handleCallPatient(p)}
                        style={{ fontSize: "12px", fontWeight: "600" }}
                      >
                        <i className="fa fa-bell text-warning"></i>
                        <span>Appeler</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-primary btn-rounded d-flex align-items-center gap-1 px-3"
                      onClick={() => handleStartConsultation(p)}
                      style={{
                        backgroundColor: "#1e60d5",
                        borderColor: "#1e60d5",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      <i className="fa fa-stethoscope"></i>
                      <span>Consulter</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger btn-rounded d-flex align-items-center gap-1 px-2"
                      onClick={() => handleRemovePatient(p.id)}
                      title="Retirer"
                    >
                      <i className="fa fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Enregistrer Arrivée Patient */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <div className="modal-header">
          <h5 className="modal-title">Enregistrer l'arrivée d'un patient</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowAddModal(false)}
          ></button>
        </div>
        <form onSubmit={handleRegisterArrival}>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label font-w600">
                Patient(e) <span className="text-danger">*</span>
              </label>
              <CreatableSelect
                isSearchable={true}
                isClearable={true}
                placeholder="Sélectionner ou saisir un nouveau patient..."
                options={patientOptions}
                value={selectedPatientOption}
                styles={patientSelectStyles}
                inputValue={patientInputSearch}
                menuPortalTarget={document.body}
                formatCreateLabel={(inputValue) => `+ Créer "${inputValue}" (Nouveau dossier médical)`}
                onInputChange={(val, actionMeta) => {
                  if (actionMeta.action === "input-change") {
                    setPatientInputSearch(val);
                  }
                }}
                onChange={(selected) => {
                  if (!selected) {
                    setNewArrival({
                      ...newArrival,
                      patientId: "",
                      patientName: "",
                      isNewPatient: false,
                    });
                    setPatientInputSearch("");
                    return;
                  }
                  if (selected.patient) {
                    setNewArrival({
                      ...newArrival,
                      patientId: selected.value,
                      patientName: `${selected.patient.firstName || ""} ${selected.patient.lastName || ""}`.trim(),
                      isNewPatient: false,
                    });
                    setPatientInputSearch("");
                  } else {
                    setNewArrival({
                      ...newArrival,
                      patientId: `new_${Date.now()}`,
                      patientName: selected.label || selected.value,
                      isNewPatient: true,
                    });
                    setPatientInputSearch("");
                  }
                }}
                onCreateOption={(inputValue) => {
                  const clean = inputValue.trim();
                  if (!clean) return;
                  setNewArrival({
                    ...newArrival,
                    patientId: `new_${Date.now()}`,
                    patientName: clean,
                    isNewPatient: true,
                  });
                  setPatientInputSearch(clean);
                }}
              />
              {newArrival.isNewPatient || (patientInputSearch && !selectedPatientOption?.patient) ? (
                <div className="mt-2 p-2 rounded" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <small className="text-primary font-w600 d-flex align-items-center gap-1 fs-12">
                    <i className="fa fa-folder-plus"></i>
                    Nouveau patient : un dossier médical officiel sera automatiquement créé dans la base de données.
                  </small>
                </div>
              ) : (
                <small className="text-muted mt-1 d-block fs-11">
                  Recherchez un patient existant ou écrivez son nom pour créer son dossier médical automatiquement.
                </small>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Heure du rendez-vous prévu</label>
              <input
                type="time"
                className="form-control"
                value={newArrival.appointmentTime}
                onChange={(e) =>
                  setNewArrival({ ...newArrival, appointmentTime: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Motif</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Suivi tension, ordonnance..."
                value={newArrival.reason}
                onChange={(e) =>
                  setNewArrival({ ...newArrival, reason: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="danger" light onClick={() => setShowAddModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Valider l'arrivée
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default WaitingRoomPage;
