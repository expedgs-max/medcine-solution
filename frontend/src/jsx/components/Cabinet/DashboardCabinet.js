import React, { useState, useContext, useEffect } from "react";
import loadable from "@loadable/component";
import pMinDelay from "p-min-delay";
import { Modal, Button, Badge } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { ThemeContext } from "../../../context/ThemeContext";
import Swal from "sweetalert2";
import ApiService from "../../../services/ApiService";

import {
  initialDoctor,
  initialAppointments,
  initialPatients,
  initialWaitingRoom,
  initialInvoices,
} from "../../../services/CabinetData";
const VisitorChart = loadable(() =>
  pMinDelay(import("../Dashboard/charts/home/VisitorChart"), 600)
);
// ChartCircle hidden

const DashboardCabinet = () => {
  const navigate = useNavigate();
  const { changeBackground } = useContext(ThemeContext);

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [waitingRoom, setWaitingRoom] = useState(() => {
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
    } catch {
      // ignore
    }
    return [];
  });
  const [showRdvModal, setShowRdvModal] = useState(false);
  const [newRdv, setNewRdv] = useState({
    patientId: "",
    time: "15:00",
    reason: "Consultation générale",
  });

  const fetchDashboardData = async () => {
    try {
      const [patData, aptData, waitData, invData] = await Promise.all([
        ApiService.getPatients().catch(() => []),
        ApiService.getAppointments().catch(() => []),
        ApiService.getWaitingRoom().catch(() => []),
        ApiService.getInvoices().catch(() => []),
      ]);

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
          setNewRdv((prev) => ({ ...prev, patientId: clean[0].id }));
        }
      }

      if (Array.isArray(aptData)) {
        setAppointments(aptData);
      }

      if (Array.isArray(waitData)) {
        const cleanWait = waitData.filter((w) => {
          const name = (w.patientName || w.patient_name || "").toLowerCase().trim();
          return (
            !name.includes("sophie") &&
            !name.includes("bernard") &&
            !name.includes("marc") &&
            !name.includes("lemoine")
          );
        });
        setWaitingRoom(cleanWait);
        try {
          localStorage.setItem("cabinet_waiting_list", JSON.stringify(cleanWait));
        } catch (e) {}
      }

      if (Array.isArray(invData)) {
        setInvoices(invData);
      }
    } catch (e) {
      console.warn("Erreur chargement données dashboard :", e);
    }
  };

  useEffect(() => {
    changeBackground({ value: "light", label: "Light" });
    fetchDashboardData();

    const onFocus = () => fetchDashboardData();
    window.addEventListener("focus", onFocus);

    let channel;
    try {
      channel = new BroadcastChannel("waiting_room_display_channel");
      channel.onmessage = (event) => {
        if (event.data?.type === "UPDATE_LIST" && Array.isArray(event.data.list)) {
          setWaitingRoom(event.data.list);
        }
      };
    } catch (e) {}

    const handleStorage = (e) => {
      if (
        e.key === "new_appointment_booked" ||
        e.key === "cabinet_client_appointments" ||
        e.key === "cabinet_appointments"
      ) {
        fetchDashboardData();
      }
      if (e.key === "cabinet_waiting_list" && e.newValue) {
        try {
          setWaitingRoom(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener("storage", handleStorage);

    const intervalTimer = setInterval(() => {
      fetchDashboardData();
    }, 15000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", handleStorage);
      clearInterval(intervalTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Date locale d'aujourd'hui (YYYY-MM-DD)
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  // Rendez-vous programmés pour aujourd'hui
  const todayAppointmentsList = appointments
    .filter((a) => (a.date || "").trim() === todayStr)
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // Statistiques calculées du cabinet
  const totalPatientsCount = patients.length; // Nombre réel de patients en DB
  const todayAppointments = todayAppointmentsList.length;
  const waitingCount = waitingRoom.filter((w) => w.status === "En attente" || (w.status && w.status.toLowerCase().includes("attente"))).length;
  const completedToday = todayAppointmentsList.filter((a) => a.status === "Terminé" || a.status === "En consultation" || a.status === "Arrivé").length;
  const getInvDateStr = (inv) => {
    if (!inv) return "";
    const raw = inv.date || inv.invoice_date || inv.createdAt || inv.created_at || "";
    return String(raw).trim().split("T")[0].split(" ")[0];
  };

  const todayRevenue = (invoices.length > 0 ? invoices : initialInvoices)
    .filter((inv) => (inv.status === "Payée" || inv.status === "Encaissé") && getInvDateStr(inv) === todayStr)
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const pendingInvoicesAmount = (invoices.length > 0 ? invoices : initialInvoices)
    .filter((inv) => inv.status !== "Payée")
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  const handleCreateRdv = (e) => {
    e.preventDefault();
    const pat = patients.find((p) => p.id === parseInt(newRdv.patientId)) || patients[0];
    if (!pat) {
      Swal.fire("Attention", "Veuillez d'abord enregistrer un patient dans le répertoire.", "warning");
      return;
    }
    const created = {
      id: appointments.length + 1,
      patientId: pat.id,
      patientName: `${pat.firstName || ""} ${pat.lastName || ""}`.trim(),
      phone: pat.phone || "",
      date: new Date().toISOString().split("T")[0],
      time: newRdv.time,
      duration: "20 min",
      reason: newRdv.reason,
      status: "Confirmé",
      notes: "Pris depuis le tableau de bord",
    };
    setAppointments([...appointments, created]);
    setShowRdvModal(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Terminé":
        return <Badge bg="success" className="badge-lg">Terminé</Badge>;
      case "En consultation":
        return <Badge bg="primary" className="badge-lg">En consultation</Badge>;
      case "Arrivé":
        return <Badge bg="warning" className="badge-lg text-white">Arrivé</Badge>;
      case "Confirmé":
        return <Badge bg="info" className="badge-lg">Confirmé</Badge>;
      case "Absent":
      case "Annulé":
        return <Badge bg="danger" className="badge-lg">Absent</Badge>;
      default:
        return <Badge bg="secondary" className="badge-lg">{status}</Badge>;
    }
  };

  return (
    <>
      {/* En-tête de bienvenue du Cabinet */}
      <div className="form-head d-flex mb-3 mb-md-4 align-items-start flex-wrap justify-content-between">
        <div className="me-auto d-lg-block">
          <h3 className="text-primary font-w600 mb-1">
            Bonjour, {initialDoctor.name}
          </h3>
          <p className="mb-0 text-muted">
            {initialDoctor.title} • {initialDoctor.convention} • Cabinet Saint-Honoré
          </p>
        </div>
        <div className="d-flex align-items-center flex-wrap gap-2 mt-2 mt-sm-0">
          <Link to="/admin/appointments" className="btn btn-outline-primary btn-rounded">
            <i className="flaticon-381-calendar-1 me-2"></i> Voir l'agenda
          </Link>
          <Button
            variant="primary"
            className="btn-rounded"
            onClick={() => setShowRdvModal(true)}
          >
            <i className="flaticon-381-add-1 me-2"></i> Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Cartes métriques Cabinet (4 colonnes fidèles à Mediqu) */}
      <div className="row">
        <div className="col-xl-3 col-sm-6">
          <div className="card widget-stat">
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                  <i className="flaticon-381-user-7 fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">Patients du cabinet</p>
                  <h3 className="text-primary font-w600 mb-0">{totalPatientsCount}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card widget-stat">
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-info text-white rounded-circle d-flex align-items-center justify-content-center">
                  <i className="flaticon-381-calendar-1 fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">RDV du jour</p>
                  <h3 className="text-info font-w600 mb-0">{todayAppointments}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card widget-stat">
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-warning text-white rounded-circle d-flex align-items-center justify-content-center">
                  <i className="flaticon-381-clock fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">En salle d'attente</p>
                  <h3 className="text-warning font-w600 mb-0">{waitingCount}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card widget-stat">
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-success text-white rounded-circle d-flex align-items-center justify-content-center">
                  <i className="flaticon-381-diamond fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">Recettes du jour</p>
                  <h3 className="text-success font-w600 mb-0">{todayRevenue.toLocaleString("fr-DZ")} DA</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rangée Principale : Graphiques & Activités du Cabinet */}
      <div className="row">
        {/* Graphique de fréquentation du site public en temps réel */}
        <div className="col-12">
          <div className="card">
            <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h4 className="card-title mb-0">Visites du Site Public</h4>
                <p className="mb-0 text-muted fs-13 mt-1">
                  Fréquentation et volume des visiteurs du portail patient
                </p>
              </div>
              <a
                href="/patient-portal"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary btn-xxs"
                style={{ borderRadius: "20px", fontSize: "11.5px", padding: "3px 10px" }}
                title="Tester le site public dans un nouvel onglet"
              >
                <i className="fa fa-external-link me-1"></i> Portail Patient
              </a>
            </div>
            <div className="card-body px-3 pt-2 pb-0">
              <div id="chartStrock">
                <VisitorChart />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rangée : Rendez-vous du jour & Salle d'attente en direct */}
      <div className="row">
        {/* Rendez-vous du jour au cabinet */}
        <div className="col-xl-8 col-lg-12">
          <div className="card">
            <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center flex-wrap">
              <div>
                <h4 className="card-title">Agenda du jour</h4>
                <p className="text-muted fs-13 mb-0">
                  {todayAppointments} créneaux programmés • {completedToday} honorés
                </p>
              </div>
              <Link to="/admin/appointments" className="btn btn-sm btn-outline-primary mt-2 mt-sm-0">
                Gérer l'agenda complet <i className="flaticon-381-next ms-1"></i>
              </Link>
            </div>
            <div className="card-body">
              <div className="table-responsive d-none d-md-block">
                <table className="table table-hover mb-0" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "80px", minWidth: "75px" }}><strong>HEURE</strong></th>
                      <th><strong>PATIENT</strong></th>
                      <th className="d-none d-md-table-cell"><strong>DATE</strong></th>
                      <th className="d-none d-md-table-cell"><strong>TÉLÉPHONE</strong></th>
                      <th className="d-none d-sm-table-cell"><strong>STATUT</strong></th>
                      <th className="text-end" style={{ width: "95px" }}><strong>ACTION</strong></th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAppointmentsList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          <i className="flaticon-381-calendar-1 fs-24 d-block mb-2 text-primary opacity-50"></i>
                          Aucun rendez-vous programmé pour aujourd'hui
                        </td>
                      </tr>
                    ) : (
                      todayAppointmentsList.map((rdv) => (
                        <tr key={rdv.id}>
                          <td>
                            <span className="badge badge-light text-primary font-w600" style={{ fontSize: "11px", padding: "4px 8px" }}>
                              <i className="flaticon-381-clock me-1"></i>
                              {rdv.time}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={rdv.patientId ? `/admin/patient-details?id=${rdv.patientId}` : "#"}
                              className="font-w600 text-dark hover-primary"
                            >
                              {(rdv.patientName || "Patient").replace(/\s*\(sc\)/gi, "").trim()}
                            </Link>
                            {/* Date et statut visibles sous le nom sur petit écran */}
                            <div className="d-block d-md-none text-muted fs-11 mt-1">
                              {rdv.date}
                            </div>
                            <div className="d-block d-sm-none mt-1">
                              {getStatusBadge(rdv.status)}
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <span className="text-muted">{rdv.date}</span>
                          </td>
                          <td className="d-none d-md-table-cell">{rdv.phone || "—"}</td>
                          <td className="d-none d-sm-table-cell">{getStatusBadge(rdv.status)}</td>
                          <td style={{ width: "95px", whiteSpace: "nowrap" }} className="text-end pe-0">
                            <div className="d-flex gap-1 justify-content-end">
                              {rdv.status === "Arrivé" && (
                                <button
                                  className="btn btn-primary btn-xs"
                                  onClick={() => navigate("/admin/consultations")}
                                  title="Lancer la consultation"
                                >
                                  Consulter
                                </button>
                              )}
                              {rdv.status === "Confirmé" && (
                                <button
                                  className="btn btn-outline-success btn-xs"
                                  onClick={async () => {
                                    try {
                                      const cleanId = typeof rdv.id === "string" && rdv.id.startsWith("RDV-")
                                        ? parseInt(rdv.id.replace("RDV-", ""), 10)
                                        : parseInt(rdv.id, 10) || rdv.id;
                                      await ApiService.updateAppointment({ id: cleanId, status: "Arrivé" });
                                      setAppointments((prev) =>
                                        prev.map((a) => (a.id === rdv.id ? { ...a, status: "Arrivé" } : a))
                                      );
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  title="Marquer le patient comme arrivé en salle d'attente"
                                >
                                  Arrivé
                                </button>
                              )}
                              {rdv.status === "En attente" && (
                                <>
                                  <button
                                    className="btn btn-success btn-xs p-1 px-2"
                                    onClick={async () => {
                                      try {
                                        const cleanId = typeof rdv.id === "string" && rdv.id.startsWith("RDV-")
                                          ? parseInt(rdv.id.replace("RDV-", ""), 10)
                                          : parseInt(rdv.id, 10) || rdv.id;
                                        await ApiService.updateAppointment({ id: cleanId, status: "Confirmé" });
                                        setAppointments((prev) =>
                                          prev.map((a) => (a.id === rdv.id ? { ...a, status: "Confirmé" } : a))
                                        );
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }}
                                    title="Accepter le rendez-vous"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    className="btn btn-danger btn-xs p-1 px-2"
                                    onClick={async () => {
                                      try {
                                        await ApiService.deleteAppointment(rdv.id);
                                        setAppointments((prev) => prev.filter((a) => a.id !== rdv.id));
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }}
                                    title="Refuser et supprimer"
                                  >
                                    ✕
                                  </button>
                                </>
                              )}
                              <Link
                                to={rdv.patientId ? `/admin/patient-details?id=${rdv.patientId}` : "/admin/appointments"}
                                className="btn btn-light btn-xs"
                                title="Voir détails"
                              >
                                <i className="flaticon-381-folder"></i>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* VUE MOBILE SPÉCIALE : CARTES RDV DU JOUR POUR SMARTPHONE */}
              <div className="d-block d-md-none">
                {todayAppointmentsList.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="flaticon-381-calendar-1 fs-24 d-block mb-2 text-primary opacity-50"></i>
                    Aucun rendez-vous programmé pour aujourd'hui
                  </div>
                ) : (
                  todayAppointmentsList.map((rdv) => (
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
                        <span className="badge badge-light text-primary font-w700 fs-12">
                          <i className="flaticon-381-clock me-1"></i>
                          {rdv.time}
                        </span>
                        <span className="text-muted fs-11">{rdv.date}</span>
                      </div>

                      <div className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="text-muted fs-11 text-uppercase font-w600 d-block">
                              PATIENT
                            </span>
                            <h5 className="font-w700 text-dark mb-0 fs-15">
                              {(rdv.patientName || "Patient").replace(/\s*\(sc\)/gi, "").trim()}
                            </h5>
                          </div>
                          {getStatusBadge(rdv.status)}
                        </div>

                        {rdv.phone && (
                          <div className="mt-2 pt-2 border-top fs-12">
                            <a
                              href={`tel:${rdv.phone}`}
                              className="text-primary font-w600 text-decoration-none d-flex align-items-center gap-1"
                            >
                              <i className="fa fa-phone text-success"></i>
                              <span>{rdv.phone}</span>
                            </a>
                          </div>
                        )}
                      </div>

                      <div
                        className="p-2 px-3 border-top d-flex justify-content-end align-items-center gap-2"
                        style={{ backgroundColor: "#ffffff" }}
                      >
                        {rdv.status === "Arrivé" && (
                          <button
                            className="btn btn-primary btn-sm btn-rounded"
                            onClick={() => navigate("/admin/consultations")}
                          >
                            Consulter
                          </button>
                        )}
                        {rdv.status === "Confirmé" && (
                          <button
                            className="btn btn-outline-success btn-sm btn-rounded"
                            onClick={async () => {
                              try {
                                const cleanId = typeof rdv.id === "string" && rdv.id.startsWith("RDV-")
                                  ? parseInt(rdv.id.replace("RDV-", ""), 10)
                                  : parseInt(rdv.id, 10) || rdv.id;
                                await ApiService.updateAppointment({ id: cleanId, status: "Arrivé" });
                                setAppointments((prev) =>
                                  prev.map((a) => (a.id === rdv.id ? { ...a, status: "Arrivé" } : a))
                                );
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                          >
                            Marquer Arrivé
                          </button>
                        )}
                        {rdv.status === "En attente" && (
                          <>
                            <button
                              className="btn btn-outline-danger btn-sm btn-rounded"
                              onClick={async () => {
                                try {
                                  await ApiService.deleteAppointment(rdv.id);
                                  setAppointments((prev) => prev.filter((a) => a.id !== rdv.id));
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                            >
                              Refuser
                            </button>
                            <button
                              className="btn btn-success btn-sm btn-rounded text-white"
                              onClick={async () => {
                                try {
                                  const cleanId = typeof rdv.id === "string" && rdv.id.startsWith("RDV-")
                                    ? parseInt(rdv.id.replace("RDV-", ""), 10)
                                    : parseInt(rdv.id, 10) || rdv.id;
                                  await ApiService.updateAppointment({ id: cleanId, status: "Confirmé" });
                                  setAppointments((prev) =>
                                    prev.map((a) => (a.id === rdv.id ? { ...a, status: "Confirmé" } : a))
                                  );
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                            >
                              Accepter
                            </button>
                          </>
                        )}
                        <Link
                          to={rdv.patientId ? `/admin/patient-details?id=${rdv.patientId}` : "/admin/appointments"}
                          className="btn btn-outline-primary btn-sm btn-rounded"
                        >
                          Détails
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Salle d'attente en temps réel & Synthèse financière */}
        <div className="col-xl-4 col-lg-12">
          {/* Salle d'attente */}
          <div className="card">
            <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
              <div>
                <h4 className="card-title">Salle d'attente</h4>
                <p className="text-muted fs-13 mb-0">Accueil en cours</p>
              </div>
              <Link to="/admin/waiting-room" className="btn btn-xs btn-outline-warning">
                Direct
              </Link>
            </div>
            <div className="card-body">
              {waitingRoom.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="flaticon-381-clock fs-32 d-block mb-2"></i>
                  Aucun patient en salle d'attente.
                </div>
              ) : (
                <div className="widget-media">
                  <ul className="timeline">
                    {waitingRoom.map((w, idx) => (
                      <li key={idx}>
                        <div className={`timeline-panel ${w.status === "En consultation" ? "bg-light-primary" : ""}`}>
                          <div className="media me-2 media-primary">
                            <i className="flaticon-381-user-7"></i>
                          </div>
                          <div className="media-body">
                            <h6 className="mb-1 font-w600">{w.patientName}</h6>
                            <p className="mb-0 text-muted fs-12">
                              Arrivé à {w.arrivalTime} • RDV {w.appointmentTime}
                            </p>
                          </div>
                          <button
                            className="btn btn-primary btn-xs ms-2"
                            onClick={() => navigate("/admin/consultations")}
                          >
                            Appeler
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Synthèse financière du cabinet */}
          <div className="card">
            <div className="card-header border-0 pb-0">
              <h4 className="card-title">Caisse & Facturation</h4>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Recettes encaissées ce jour :</span>
                <span className="font-w600 text-success fs-16">{todayRevenue.toLocaleString("fr-DZ")} DA</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted">Factures en attente / télétransmises :</span>
                <span className="font-w600 text-warning fs-16">{pendingInvoicesAmount.toLocaleString("fr-DZ")} DA</span>
              </div>
              <div className="progress mb-3" style={{ height: "8px" }}>
                <div
                  className="progress-bar bg-success"
                  style={{ width: "70%" }}
                  role="progressbar"
                ></div>
                <div
                  className="progress-bar bg-warning"
                  style={{ width: "30%" }}
                  role="progressbar"
                ></div>
              </div>
              <div className="d-grid gap-2">
                <Link to="/admin/invoices" className="btn btn-outline-primary btn-sm">
                  <i className="flaticon-381-calculator me-1"></i> Consulter les factures
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nouveau Rendez-vous Rapide */}
      <Modal show={showRdvModal} onHide={() => setShowRdvModal(false)} centered>
        <div className="modal-header">
          <h5 className="modal-title">Nouveau Rendez-vous</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowRdvModal(false)}
          ></button>
        </div>
        <form onSubmit={handleCreateRdv}>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Sélectionner un Patient</label>
              <select
                className="form-control"
                value={newRdv.patientId}
                onChange={(e) => setNewRdv({ ...newRdv, patientId: e.target.value })}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.firstName || "")} {(p.lastName || "").toUpperCase()} ({p.fileNumber || ""})
                  </option>
                ))}
              </select>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Heure du RDV</label>
                <input
                  type="time"
                  className="form-control"
                  value={newRdv.time}
                  onChange={(e) => setNewRdv({ ...newRdv, time: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Durée</label>
                <select className="form-control" defaultValue="20 min">
                  <option>15 min</option>
                  <option>20 min</option>
                  <option>30 min</option>
                  <option>45 min</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Motif de consultation</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Consultation générale, renouvellement, certificat..."
                value={newRdv.reason}
                onChange={(e) => setNewRdv({ ...newRdv, reason: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="danger" light onClick={() => setShowRdvModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Enregistrer le RDV
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default DashboardCabinet;
