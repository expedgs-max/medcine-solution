import React, { useState, useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import WheelDatePicker from "./WheelDatePicker";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";
import { initialDoctor } from "../../../services/CabinetData";

const DAYS_OF_WEEK = [
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
];

const ClinicProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [clinic, setClinic] = useState({
    clinicName: "Cabinet Médical belbachir",
    doctorName: initialDoctor.name,
    doctorNameAr: "الدكتورة ن. بلبشير ولد هنية • طبيبة مختصة",
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
    secretaryPhone: "0560 06 74 66",
    address: initialDoctor.address,
    hours: "Samedi — Jeudi: 09:00 — 18:00",
    closedDays: "Vendredi: Fermé",
    closedDates: [],
    aboutText: "",
    aboutSummary: "",
    slotDuration: 30,
    slotStartMorning: "09:00",
    slotEndMorning: "12:30",
    slotStartEvening: "13:00",
    slotEndEvening: "18:00",
    mapsUrl: "https://maps.google.com/?q=Gynecologue+Belbachir+Ouldhennia!5e0",
    mapsIframe: "",
    doctorPhoto: "/doctor.jpg",
    legalNotice:
      "Membre d'une association de gestion agréée par l'administration fiscale, acceptant à ce titre le règlement des honoraires par chèque et carte bancaire.",
  });

  const [newClosure, setNewClosure] = useState({
    mode: "single",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "Jour férié",
  });

  const handleAddClosure = async () => {
    if (!newClosure.startDate) return;
    const start = newClosure.startDate;
    const end =
      newClosure.mode === "range" && newClosure.endDate && newClosure.endDate >= start
        ? newClosure.endDate
        : start;
    const entry = {
      id: Date.now(),
      startDate: start,
      endDate: end,
      reason: (newClosure.reason || "").trim() || (start !== end ? "Vacances / Congé" : "Jour férié"),
    };
    const updatedDates = [...(Array.isArray(clinic.closedDates) ? clinic.closedDates : []), entry];
    const updatedClinic = { ...clinic, closedDates: updatedDates };
    setClinic(updatedClinic);
    try {
      localStorage.setItem("cabinet_info", JSON.stringify(updatedClinic));
      await ApiService.updateCabinetInfo(updatedClinic);
    } catch (e) {}
    Swal.fire({
      icon: "success",
      title: start !== end ? "Période de fermeture ajoutée" : "Jour de fermeture ajouté",
      text:
        start !== end
          ? `Le cabinet sera fermé du ${start} au ${end} (${entry.reason}).`
          : `Le cabinet sera fermé le ${start} (${entry.reason}).`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  const handleRemoveClosure = async (id) => {
    const updatedDates = (Array.isArray(clinic.closedDates) ? clinic.closedDates : []).filter(
      (item) => item.id !== id
    );
    const updatedClinic = { ...clinic, closedDates: updatedDates };
    setClinic(updatedClinic);
    try {
      localStorage.setItem("cabinet_info", JSON.stringify(updatedClinic));
      await ApiService.updateCabinetInfo(updatedClinic);
    } catch (e) {}
  };

  // Gestion de la sélection interactive des jours de fermeture
  const toggleClosedDay = (dayKey) => {
    const current = (clinic.closedDays || "").toLowerCase();
    const order = ["samedi", "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi"];
    
    let activeKeys = order.filter((k) => current.includes(k));
    
    if (activeKeys.includes(dayKey)) {
      activeKeys = activeKeys.filter((k) => k !== dayKey);
    } else {
      activeKeys.push(dayKey);
      activeKeys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    }
    
    if (activeKeys.length === 0) {
      setClinic({ ...clinic, closedDays: "Aucun (Ouvert 7j/7)" });
    } else {
      const labels = activeKeys.map((k) => {
        const found = DAYS_OF_WEEK.find((d) => d.key === k);
        return found ? found.label : k;
      });
      const formatted = labels.length === 1 
        ? `${labels[0]}: Fermé`
        : labels.length === 2 
          ? `${labels[0]} & ${labels[1]}: Fermé`
          : `${labels.join(", ")}: Fermé`;
      setClinic({ ...clinic, closedDays: formatted });
    }
  };

  // Gestion du téléversement et compression automatique de la photo
  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Format non supporté",
        text: "Veuillez sélectionner une image (JPG, PNG ou WEBP).",
        confirmButtonColor: "#1e60d5",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionnement fluide si l'image est très lourde (> 1000px)
        const canvas = document.createElement("canvas");
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
        setClinic((prev) => ({
          ...prev,
          doctorPhoto: optimizedDataUrl,
        }));

        Swal.fire({
          icon: "info",
          title: "Nouvelle photo chargée",
          text: "La photo est prête en aperçu. Cliquez sur « Enregistrer » pour valider la mise en ligne.",
          timer: 3000,
          showConfirmButton: false,
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = () => {
    setClinic((prev) => ({
      ...prev,
      doctorPhoto: "/doctor.jpg",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Chargement des coordonnées officielles depuis la base de données MySQL
  useEffect(() => {
    const fetchClinicInfo = async () => {
      try {
        setLoading(true);
        const data = await ApiService.getCabinetInfo();
        if (data) {
          setClinic((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.error("Erreur chargement coordonnées cabinet :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClinicInfo();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await ApiService.updateCabinetInfo(clinic);
      try {
        localStorage.setItem("cabinet_info", JSON.stringify(clinic));
      } catch (err) {}
      Swal.fire({
        icon: "success",
        title: "Informations enregistrées",
        text: "Toutes les informations du cabinet et du site public ont été enregistrées avec succès.",
        confirmButtonColor: "#1e60d5",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur d'enregistrement",
        text: "Impossible d'enregistrer : " + err.message,
        confirmButtonColor: "#1e60d5",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle motherMenu="Cabinet et configuration" activeMenu="Mon cabinet" />

      {/* Onglets de navigation entre Paramètres, SMTP et Mon Cabinet */}
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <Link to="/admin/settings" className="btn btn-sm btn-outline-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-settings-2 me-1"></i> Tarifs & Consultations
        </Link>
        <Link to="/admin/smtp" className="btn btn-sm btn-outline-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-email me-1"></i> Configuration SMTP
        </Link>
        <button type="button" className="btn btn-sm btn-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-home-2 me-1"></i> Mon Cabinet
        </button>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card">
            <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
              <div>
                <h4 className="card-title">Fiche d'Identité & Configuration du Cabinet</h4>
                <p className="text-muted fs-13 mb-0">
                  Ces informations officielles figurent sur le site public, ordonnances et factures
                </p>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status"></div>
                  <p className="mt-2 text-muted">Chargement des coordonnées depuis MySQL...</p>
                </div>
              ) : (
                <form onSubmit={handleSave}>
                  <h5 className="text-primary font-w600 mb-3 border-bottom pb-2">
                    1. Identification de la Structure & Praticien
                  </h5>
                  <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                      <label className="form-label font-w500">Nom du Cabinet Médical *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clinic.clinicName || ""}
                        onChange={(e) => setClinic({ ...clinic, clinicName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label font-w500">Médecin Titulaire Exploitant *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clinic.doctorName || ""}
                        onChange={(e) => setClinic({ ...clinic, doctorName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Titre & Qualification</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clinic.title || ""}
                        onChange={(e) => setClinic({ ...clinic, title: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Spécialité déclarée *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clinic.specialty || ""}
                        onChange={(e) => setClinic({ ...clinic, specialty: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Titre & Praticien en Arabe (Site Public)</label>
                      <input
                        type="text"
                        className="form-control"
                        dir="rtl"
                        value={clinic.doctorNameAr || ""}
                        onChange={(e) => setClinic({ ...clinic, doctorNameAr: e.target.value })}
                      />
                    </div>
                  </div>

                  <h5 className="text-primary font-w600 mt-4 mb-3 border-bottom pb-2 d-flex align-items-center">
                    <i className="flaticon-381-picture me-2"></i>
                    2. Photo Officielle du Médecin (Affichée sur le Site Public)
                  </h5>
                  <div
                    className="card mb-4"
                    style={{
                      background: "#f8fafd",
                      border: "1px solid #e2e8f0",
                      borderRadius: "14px",
                      overflow: "hidden",
                    }}
                  >
                    <div className="card-body p-3 p-md-4">
                      <div className="row align-items-center">
                        {/* Cadre Aperçu en direct façon portail patient */}
                        <div className="col-lg-4 col-md-5 text-center mb-3 mb-md-0">
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              maxWidth: "280px",
                              margin: "0 auto",
                              borderRadius: "16px",
                              overflow: "hidden",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
                              border: "3px solid #10b981",
                              background: "#0c1713",
                            }}
                          >
                            <img
                              src={clinic.doctorPhoto || "/doctor.jpg"}
                              alt={clinic.doctorName || "Dr. Titulaire"}
                              style={{
                                width: "100%",
                                height: "210px",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                e.target.src = "/doctor.jpg";
                              }}
                            />
                            {/* Badge Consultations Ouvertes comme sur le site public */}
                            <div
                              style={{
                                position: "absolute",
                                top: "12px",
                                left: "12px",
                                background: "rgba(16, 185, 129, 0.95)",
                                color: "#ffffff",
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: "700",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                              }}
                            >
                              <span
                                style={{
                                  width: "7px",
                                  height: "7px",
                                  borderRadius: "50%",
                                  background: "#ffffff",
                                  display: "inline-block",
                                }}
                              ></span>
                              Consultations Ouvertes
                            </div>
                          </div>
                          <small className="text-muted d-block mt-2 font-w500 fs-12">
                            Aperçu réel sur l'accueil et la page À Propos
                          </small>
                        </div>

                        {/* Contrôles de sélection de fichier et d'URL */}
                        <div className="col-lg-8 col-md-7">
                          <h6 className="font-w600 text-dark mb-2">Modifier l'image affichée sur le site</h6>
                          <p className="text-muted fs-13 mb-3">
                            Cette image est la photo officielle du médecin affichée sur la page d'accueil du portail patient (au-dessus du bouton de réservation) ainsi que sur la fiche profil de la section « À Propos ».
                          </p>

                          <div className="d-flex flex-wrap gap-2 mb-3">
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/jpeg,image/png,image/webp,image/jpg"
                              style={{ display: "none" }}
                              onChange={handlePhotoUpload}
                            />
                            <button
                              type="button"
                              className="btn btn-primary btn-sm rounded"
                              onClick={() => fileInputRef.current && fileInputRef.current.click()}
                            >
                              <i className="flaticon-381-upload me-1"></i> Téléverser une photo (JPG, PNG, WEBP)
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm rounded"
                              onClick={handleResetPhoto}
                              title="Rétablir la photo par défaut du site"
                            >
                              <i className="flaticon-381-refresh me-1"></i> Rétablir photo par défaut
                            </button>
                          </div>

                          <div className="mt-3">
                            <label className="form-label font-w500 fs-13 mb-1">
                              Ou saisir / coller un lien direct d'image (URL web ou chemin local) :
                            </label>
                            <div className="input-group input-group-sm">
                              <span className="input-group-text bg-white">
                                <i className="flaticon-381-link"></i>
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="/doctor.jpg ou https://exemple.com/photo.jpg"
                                value={clinic.doctorPhoto || ""}
                                onChange={(e) => setClinic({ ...clinic, doctorPhoto: e.target.value })}
                              />
                              {clinic.doctorPhoto && clinic.doctorPhoto.startsWith("data:") && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={handleResetPhoto}
                                  title="Effacer la photo téléversée"
                                >
                                  Retirer
                                </button>
                              )}
                            </div>
                            <small className="text-muted fs-11 mt-1 d-block">
                              Formats supportés : JPEG, PNG, WEBP. L'image est automatiquement optimisée pour un chargement instantané.
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h5 className="text-primary font-w600 mt-4 mb-3 border-bottom pb-2">
                    3. Présentation du Cabinet (Site Public)
                  </h5>
                  <div className="mb-3">
                    <label className="form-label font-w500">Texte de présentation complet (Page d'accueil du site public)</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={clinic.aboutText || ""}
                      onChange={(e) => setClinic({ ...clinic, aboutText: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label font-w500">Résumé court du cabinet (Onglet À Propos du site public)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={clinic.aboutSummary || ""}
                      onChange={(e) => setClinic({ ...clinic, aboutSummary: e.target.value })}
                    ></textarea>
                  </div>

                  <h5 className="text-primary font-w600 mt-4 mb-3 border-bottom pb-2">
                    4. Paramètres de Réservation & Créneaux (Site Public)
                  </h5>
                  <div className="row mb-3">
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Durée d'un créneau de consultation *</label>
                      <select
                        className="form-control"
                        value={clinic.slotDuration || 30}
                        onChange={(e) => setClinic({ ...clinic, slotDuration: parseInt(e.target.value, 10) })}
                        required
                      >
                        <option value={15}>15 minutes</option>
                        <option value={20}>20 minutes</option>
                        <option value={25}>25 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={40}>40 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes (1 heure)</option>
                      </select>
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Heure début matin</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="09:00"
                        value={clinic.slotStartMorning || ""}
                        onChange={(e) => setClinic({ ...clinic, slotStartMorning: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Heure fin matin</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="12:30"
                        value={clinic.slotEndMorning || ""}
                        onChange={(e) => setClinic({ ...clinic, slotEndMorning: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Heure début après-midi</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="13:00"
                        value={clinic.slotStartEvening || ""}
                        onChange={(e) => setClinic({ ...clinic, slotStartEvening: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Heure fin après-midi</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="18:00"
                        value={clinic.slotEndEvening || ""}
                        onChange={(e) => setClinic({ ...clinic, slotEndEvening: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">
                        <i className="fa fa-calendar-times text-danger me-1"></i>
                        Jour(s) de fermeture (Liste rapide)
                      </label>
                      <select
                        className="form-control font-w500"
                        value={
                          [
                            "Vendredi: Fermé",
                            "Vendredi & Samedi: Fermé",
                            "Vendredi & Dimanche: Fermé",
                            "Samedi & Dimanche: Fermé",
                            "Samedi: Fermé",
                            "Dimanche: Fermé",
                            "Aucun (Ouvert 7j/7)",
                          ].includes(clinic.closedDays)
                            ? clinic.closedDays
                            : "custom"
                        }
                        onChange={(e) => {
                          if (e.target.value !== "custom") {
                            setClinic({ ...clinic, closedDays: e.target.value });
                          }
                        }}
                      >
                        <option value="Vendredi: Fermé">Vendredi uniquement (Vendredi: Fermé)</option>
                        <option value="Vendredi & Samedi: Fermé">Vendredi & Samedi (Week-end algérien)</option>
                        <option value="Vendredi & Dimanche: Fermé">Vendredi & Dimanche</option>
                        <option value="Samedi & Dimanche: Fermé">Samedi & Dimanche (Week-end standard)</option>
                        <option value="Samedi: Fermé">Samedi uniquement</option>
                        <option value="Dimanche: Fermé">Dimanche uniquement</option>
                        <option value="Aucun (Ouvert 7j/7)">Aucun (Ouvert 7j/7)</option>
                        <option value="custom">Sélection personnalisée (jours ci-dessous)</option>
                      </select>
                    </div>
                  </div>

                  {/* Sélecteur visuel interactif des jours fermés */}
                  <div className="mb-4 p-3 bg-white rounded border" style={{ borderColor: "#e2e8f0" }}>
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                      <label className="form-label font-w600 mb-0 text-dark">
                        <i className="fa fa-calendar-check text-primary me-2"></i>
                        Sélection des jours fermés (Cliquez pour cocher / décocher) :
                      </label>
                      <span className="badge badge-primary px-3 py-1 font-w600" style={{ fontSize: "13px" }}>
                        Actuel : {clinic.closedDays || "Vendredi: Fermé"}
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {DAYS_OF_WEEK.map((d) => {
                        const isClosed = (clinic.closedDays || "").toLowerCase().includes(d.key);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            className={`btn btn-sm ${isClosed ? "btn-danger shadow-sm" : "btn-outline-secondary"}`}
                            style={{
                              borderRadius: "20px",
                              padding: "6px 14px",
                              fontWeight: "600",
                              transition: "all 0.2s ease",
                            }}
                            onClick={() => toggleClosedDay(d.key)}
                          >
                            {isClosed ? `✕ ${d.label} (Fermé)` : `+ ${d.label}`}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-2 border-top" style={{ borderColor: "#f1f5f9" }}>
                      <small className="text-muted">
                        <i className="fa fa-info-circle me-1 text-info"></i>
                        Les jours marqués en rouge <strong>(Fermé)</strong> bloquent automatiquement les réservations sur le portail patient.
                      </small>
                    </div>
                  </div>

                  <h5 className="text-primary font-w600 mt-4 mb-3 border-bottom pb-2">
                    Jours Fériés & Vacances (Fermetures Exceptionnelles)
                  </h5>
                  {/* Fermetures exceptionnelles : Jours fériés & Vacances / Congés */}
                  <div className="mb-4 p-3 bg-white rounded border" style={{ borderColor: "#e2e8f0" }}>
                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                      <div>
                        <label className="form-label font-w600 mb-0 text-dark">
                          <i className="fa fa-calendar-times text-danger me-2"></i>
                          Jours fériés & Vacances / Congés (Fermetures exceptionnelles)
                        </label>
                        <small className="text-muted d-block">
                          Fermez le cabinet pour un jour précis (ex: Jour férié) ou plusieurs jours consécutifs (ex: Vacances / Congé).
                        </small>
                      </div>
                      <span className="badge badge-danger light px-3 py-1 font-w600">
                        {(Array.isArray(clinic.closedDates) ? clinic.closedDates : []).length} fermeture(s) programmée(s)
                      </span>
                    </div>

                    <div className="row g-2 align-items-end mb-3 p-3 rounded" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <div className="col-md-3">
                        <label className="form-label fs-12 font-w600 mb-1">Type de fermeture</label>
                        <select
                          className="form-control form-control-sm"
                          value={newClosure.mode}
                          onChange={(e) => {
                            const mode = e.target.value;
                            setNewClosure((prev) => ({
                              ...prev,
                              mode,
                              endDate: mode === "single" ? prev.startDate : prev.endDate,
                              reason:
                                mode === "range" && prev.reason === "Jour férié"
                                  ? "Vacances / Congé"
                                  : mode === "single" && prev.reason === "Vacances / Congé"
                                  ? "Jour férié"
                                  : prev.reason,
                            }));
                          }}
                        >
                          <option value="single">Un seul jour (Jour férié...)</option>
                          <option value="range">Plusieurs jours (Vacances / Congé)</option>
                        </select>
                      </div>

                      <div className={newClosure.mode === "range" ? "col-md-2" : "col-md-3"}>
                        <label className="form-label fs-12 font-w600 mb-1">
                          {newClosure.mode === "range" ? "Date de début *" : "Date du jour fermé *"}
                        </label>
                        <WheelDatePicker
                          className="form-control form-control-sm"
                          value={newClosure.startDate}
                          onChange={(e) =>
                            setNewClosure((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                              endDate: prev.mode === "single" || prev.endDate < e.target.value ? e.target.value : prev.endDate,
                            }))
                          }
                          title="DATE DE DÉBUT"
                        />
                      </div>

                      {newClosure.mode === "range" && (
                        <div className="col-md-2">
                          <label className="form-label fs-12 font-w600 mb-1">Date de fin *</label>
                          <WheelDatePicker
                            className="form-control form-control-sm"
                            value={newClosure.endDate}
                            onChange={(e) => setNewClosure((prev) => ({ ...prev, endDate: e.target.value }))}
                            title="DATE DE FIN"
                          />
                        </div>
                      )}

                      <div className={newClosure.mode === "range" ? "col-md-3" : "col-md-4"}>
                        <label className="form-label fs-12 font-w600 mb-1">Motif (Jour férié, Vacances...)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          list="closure-reasons-list"
                          placeholder="Ex: Jour férié, Vacances, Congrès..."
                          value={newClosure.reason}
                          onChange={(e) => setNewClosure((prev) => ({ ...prev, reason: e.target.value }))}
                        />
                        <datalist id="closure-reasons-list">
                          <option value="Jour férié" />
                          <option value="Vacances / Congé annuel" />
                          <option value="Aïd El-Fitr (Férié)" />
                          <option value="Aïd El-Adha (Férié)" />
                          <option value="Formation / Congrès médical" />
                          <option value="Fermeture exceptionnelle" />
                        </datalist>
                      </div>

                      <div className="col-md-2 d-grid">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm font-w600"
                          onClick={handleAddClosure}
                        >
                          <i className="fa fa-plus me-1"></i> Fermer {newClosure.mode === "range" ? "la période" : "ce jour"}
                        </button>
                      </div>
                    </div>

                    {Array.isArray(clinic.closedDates) && clinic.closedDates.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {clinic.closedDates.map((item) => {
                          const isRange = item.endDate && item.endDate !== item.startDate;
                          return (
                            <div
                              key={item.id || `${item.startDate}-${item.endDate}`}
                              className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded"
                              style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#991b1b",
                                fontSize: "13px",
                              }}
                            >
                              <i className="fa fa-ban text-danger"></i>
                              <div>
                                <strong>
                                  {isRange ? `Du ${item.startDate} au ${item.endDate}` : `Le ${item.startDate}`}
                                </strong>
                                {item.reason && <span className="ms-1 text-muted">({item.reason})</span>}
                              </div>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-danger ms-1 py-0 px-2"
                                title="Supprimer cette fermeture"
                                onClick={() => handleRemoveClosure(item.id)}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-muted fs-12">
                        Aucune fermeture exceptionnelle (jour férié ou vacances) programmée pour le moment.
                      </div>
                    )}
                  </div>

                  <h5 className="text-primary font-w600 mt-4 mb-3 border-bottom pb-2">
                    5. Coordonnées, Contact & Localisation
                  </h5>
                  <div className="row mb-3">
                    <div className="col-md-6 mb-2">
                      <label className="form-label font-w500">Adresse géographique du cabinet *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clinic.address || ""}
                        onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3 mb-2">
                      <label className="form-label font-w500">Téléphone Secrétariat & RDV *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clinic.secretaryPhone || ""}
                        onChange={(e) => setClinic({ ...clinic, secretaryPhone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3 mb-2">
                      <label className="form-label font-w500">Téléphone du standard</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clinic.phone || ""}
                        onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Email professionnel</label>
                      <input
                        type="email"
                        className="form-control"
                        value={clinic.email || ""}
                        onChange={(e) => setClinic({ ...clinic, email: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Horaires d'accueil & de consultation</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Samedi — Jeudi: 09:00 — 18:00"
                        value={clinic.hours || ""}
                        onChange={(e) => setClinic({ ...clinic, hours: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-label font-w500">Lien Google Maps (Ouvrir GPS)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://maps.google.com/..."
                        value={clinic.mapsUrl || ""}
                        onChange={(e) => setClinic({ ...clinic, mapsUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label font-w500">Lien d'intégration Carte Google Maps (Iframe)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="https://www.google.com/maps/embed?..."
                      value={clinic.mapsIframe || ""}
                      onChange={(e) => setClinic({ ...clinic, mapsIframe: e.target.value })}
                    />
                  </div>

                  <div className="d-flex justify-content-end">
                    <Button variant="primary" type="submit" className="btn-rounded" disabled={saving}>
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Enregistrement en cours...
                        </>
                      ) : (
                        <>
                          <i className="flaticon-381-check-2 me-1"></i> Enregistrer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClinicProfilePage;
