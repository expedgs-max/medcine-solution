import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import WheelDatePicker from "./WheelDatePicker";
import PrescriptionPreviewModal from "./PrescriptionPreviewModal";
import MedicationsModal, { MEDICATION_TYPES } from "./MedicationsModal";
import ApiService from "../../../services/ApiService";
import {
  initialDoctor,
  initialPatients,
  initialPrescriptions,
  initialMedications,
} from "../../../services/CabinetData";

/**
 * Composant de saisie intelligente pour le nom du médicament :
 * - Recherche en temps réel dans la liste des médicaments MySQL
 * - Saisie libre autorisée
 * - Propose les résultats sous forme de menu déroulant propre
 */
const MedicationSearchInput = ({
  value = "",
  onChange,
  medications = [],
  onSelectMedication,
  placeholder = "Rechercher ou saisir un médicament...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const query = (value || "").trim().toLowerCase();

  const filtered = query
    ? medications
      .filter((m) => (m.name || "").toLowerCase().includes(query))
      .slice(0, 8)
    : medications.slice(0, 8);

  return (
    <div ref={containerRef} className="position-relative w-100">
      <div className="input-group input-group-sm">
        <span
          className="input-group-text bg-white border-end-0 text-primary"
          style={{
            borderRadius: "0.6rem 0 0 0.6rem",
            borderColor: "#e2e8f0",
          }}
        >
          <i className="fa fa-pills text-primary"></i>
        </span>
        <input
          type="text"
          className="form-control form-control-sm border-start-0"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          required
          autoComplete="off"
          style={{
            borderRadius: "0 0.6rem 0.6rem 0",
            borderColor: "#e2e8f0",
            height: "44px",
            fontSize: "13px",
            fontWeight: "500",
            backgroundColor: "#ffffff",
            color: "#1e293b",
          }}
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <div
          className="shadow-lg border rounded-3 position-absolute bg-white w-100"
          style={{
            top: "100%",
            left: 0,
            marginTop: "4px",
            zIndex: 99999,
            maxHeight: "240px",
            overflowY: "auto",
            borderColor: "#e2e8f0",
          }}
        >
          <div className="py-1">
            {filtered.map((m, idx) => (
              <div
                key={m.id || `${m.name}-${idx}`}
                className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center"
                style={{
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#eff6ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectMedication(m);
                  setIsOpen(false);
                }}
              >
                <div>
                  <strong className="text-dark fs-13 d-block">
                    {m.name}
                  </strong>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    {m.form && (
                      <span
                        className="badge text-primary"
                        style={{
                          backgroundColor: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          fontSize: "10.5px",
                          fontWeight: "600",
                        }}
                      >
                        <i className="fa fa-medkit me-1"></i>
                        {m.form}
                      </span>
                    )}
                    {m.defaultPosology && (
                      <span className="text-muted fs-11">
                        Posologie : {m.defaultPosology}
                      </span>
                    )}
                  </div>
                </div>
                <span className="badge bg-light text-primary fs-11 border">
                  En base
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const createEmptyItem = () => ({
  medication: "",
  form: "",
  posology: "",      // VIDE par défaut
  mealTiming: "",    // VIDE par défaut
  duration: "",      // VIDE par défaut
  dosage: "",
  renewable: "Non renouvelable",
});

const PrescriptionsPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const patientIdQuery = searchParams.get("patientId");

  const [viewMode, setViewMode] = useState("list"); // "list" ou "create"
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState(initialMedications);
  const [showMedModal, setShowMedModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [previewPrescription, setPreviewPrescription] = useState(null);

  useEffect(() => {
    // 1. Récupérer toutes les ordonnances enregistrées dans MySQL
    ApiService.getPrescriptions().then((data) => {
      if (data && Array.isArray(data)) {
        const clean = data.filter((p) => {
          const name = (p.patientName || "").toLowerCase();
          return !["dubois", "lemoine", "bernard", "moreau"].some((demo) =>
            name.includes(demo)
          );
        });
        setPrescriptions(clean);
      }
    });

    // 2. Médicaments
    ApiService.getMedications().then((data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        setMedications(data);
      }
    });

    // 3. Patients
    ApiService.getPatients().then((data) => {
      if (data && Array.isArray(data)) {
        const clean = data.filter((p) => {
          const last = (p.lastName || "").toLowerCase().trim();
          const first = (p.firstName || "").toLowerCase().trim();
          return (
            !["dubois", "lemoine", "bernard", "moreau", "belkacem"].includes(last) &&
            !["claire", "marc", "sophie", "lucas", "yasmine"].includes(first)
          );
        });
        setPatients(clean);
      }
    });
  }, []);

  const [patientInputSearch, setPatientInputSearch] = useState("");

  const [formData, setFormData] = useState({
    patientId: patientIdQuery ? parseInt(patientIdQuery) : "",
    patientName: "",
    isNewPatient: false,
    date: new Date().toISOString().split("T")[0],
    validity: "3 mois",
    ald: false,
    items: [createEmptyItem()],
    notes: "Respecter la posologie prescrite.",
  });

  const handleOpenCreate = () => {
    setPatientInputSearch("");
    setFormData({
      patientId: patientIdQuery ? parseInt(patientIdQuery) : "",
      patientName: "",
      isNewPatient: false,
      date: new Date().toISOString().split("T")[0],
      validity: "3 mois",
      ald: false,
      items: [createEmptyItem()],
      notes: "Respecter la posologie prescrite.",
    });
    setViewMode("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (patientIdQuery) {
      const found = prescriptions.find((p) => p.patientId === parseInt(patientIdQuery));
      if (found) {
        setPreviewPrescription(found);
      }
    }
  }, [patientIdQuery, prescriptions]);

  const patientOptions = patients.map((p) => ({
    value: p.id,
    label: `${(p.lastName || "").toUpperCase()} ${p.firstName || ""} — ${p.fileNumber || ""} (Née le ${p.dob || ""} • ${p.age || 0} ans)`,
    patient: p,
  }));

  const selectedPatientOption = formData.patientId
    ? patientOptions.find((opt) => String(opt.value) === String(formData.patientId)) ||
    (formData.patientName
      ? { value: formData.patientId, label: formData.patientName }
      : null)
    : formData.patientName
      ? { value: "new_patient", label: formData.patientName }
      : null;

  const patientSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "45px",
      borderRadius: "0.6rem",
      borderColor: state.isFocused ? "#1e60d5" : "#e2e8f0",
      boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(30, 96, 213, 0.15)" : "none",
      backgroundColor: "#ffffff",
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
      color: state.isSelected ? "#ffffff" : "#1e293b",
      fontSize: "13px",
      cursor: "pointer",
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: "14px",
      fontWeight: "600",
      color: "#1e293b",
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: "13px",
      color: "#94a3b8",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
    menu: (base) => ({
      ...base,
      zIndex: 99999,
      borderRadius: "0.75rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)",
    }),
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, createEmptyItem()],
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = value;
    if (field === "medication") {
      const found = (medications || []).find(
        (m) => (m.name || "").toLowerCase().trim() === (value || "").toLowerCase().trim()
      );
      if (found && found.form) {
        updated[index].form = found.form;
      }
    }
    setFormData({ ...formData, items: updated });
  };

  const handleSelectMedication = (index, med) => {
    const updated = [...formData.items];
    updated[index].medication = med.name || "";
    updated[index].form = med.form || "";
    if (med.dosage) updated[index].dosage = med.dosage;
    setFormData({ ...formData, items: updated });
  };

  const handleSavePrescription = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const typedName = (patientInputSearch || "").trim();
    let pat = patients.find((p) => p.id === formData.patientId);

    if (!pat && !typedName && !formData.patientName) {
      Swal.fire({
        icon: "warning",
        title: "Patient requis",
        text: "Veuillez sélectionner un(e) patient(e) ou écrire un nom pour créer son dossier médical.",
        confirmButtonColor: "#1e60d5",
      });
      return;
    }

    const hasMedication = formData.items.some(
      (it) => it.medication && it.medication.trim().length > 0
    );
    if (!hasMedication) {
      Swal.fire({
        icon: "warning",
        title: "Médicament requis",
        text: "Veuillez renseigner au moins un nom de médicament.",
        confirmButtonColor: "#1e60d5",
      });
      return;
    }

    let createdNewDossier = false;

    // Si le nom n'existe pas dans la base de données, CRÉER UN NOUVEAU DOSSIER MÉDICAL !
    if (!pat && typedName) {
      const parts = typedName.split(/\s+/);
      const lastName = parts[0].toUpperCase();
      const firstName = parts.length > 1 ? parts.slice(1).join(" ") : "";

      try {
        const createRes = await ApiService.createPatient({
          firstName: firstName || typedName,
          lastName: lastName || typedName,
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
          firstName: firstName || typedName,
          lastName: lastName || typedName,
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
          firstName: firstName || typedName,
          lastName: lastName || typedName,
          status: "Actif",
        };
        setPatients((prev) => [pat, ...prev]);
        createdNewDossier = true;
      }
    }

    const cleanItems = formData.items
      .filter((it) => it.medication && it.medication.trim().length > 0)
      .map((it) => ({
        ...it,
        medication: it.medication.trim(),
        form: it.form?.trim() || "",
        posology: it.posology?.trim() || "",
        instructions: it.mealTiming?.trim() || it.instructions?.trim() || "",
        mealTiming: it.mealTiming?.trim() || "",
        duration: it.duration?.trim() || "",
        dosage: it.dosage || "",
        renewable: it.renewable || "Non renouvelable",
      }));

    // Auto-sauvegarde du médicament dans MySQL s'il est nouveau
    for (const it of cleanItems) {
      const exists = medications.some(
        (m) => (m.name || "").toLowerCase().trim() === it.medication.toLowerCase()
      );
      if (!exists) {
        try {
          await ApiService.saveMedication({
            name: it.medication,
            form: it.form || "",
            defaultPosology: it.posology,
            dosage: it.dosage || "",
            defaultDuration: it.duration || "",
            category: "Général",
          });
        } catch (err) {
          console.warn("Erreur auto-sauvegarde nouveau médicament :", err);
        }
      }
    }

    // Rafraîchir la liste locale des médicaments
    try {
      const refreshedMeds = await ApiService.getMedications();
      if (Array.isArray(refreshedMeds) && refreshedMeds.length > 0) {
        setMedications(refreshedMeds);
        localStorage.setItem("cabinet_medications", JSON.stringify(refreshedMeds));
      }
    } catch (e) { }

    try {
      const dateToUse = formData.date || new Date().toISOString().split("T")[0];
      const year = new Date(dateToUse).getFullYear() || new Date().getFullYear();
      const prescNum = `ORD-${year}-${String(prescriptions.length + 1).padStart(4, "0")}`;

      const res = await ApiService.savePrescription({
        patientId: pat.id,
        prescriptionNumber: prescNum,
        date: dateToUse,
        validity: formData.validity || "3 mois",
        ald: formData.ald || false,
        doctorName: initialDoctor.name,
        notes: formData.notes || "Respecter la posologie prescrite.",
        items: cleanItems,
      });

      const newOrd = {
        id: res?.data?.id || Date.now(),
        prescriptionNumber: prescNum,
        patientId: pat.id,
        patientName: `${pat.firstName || ""} ${pat.lastName || ""}`.trim(),
        patientDetails: {
          dob: pat.dob || "-",
          fileNumber: pat.fileNumber || "NOUVEAU DOSSIER",
        },
        date: dateToUse,
        validity: formData.validity || "3 mois",
        ald: formData.ald || false,
        doctorName: initialDoctor.name,
        items: cleanItems,
        notes: formData.notes || "Respecter la posologie prescrite.",
        validated: true,
      };

      setPrescriptions([newOrd, ...prescriptions]);
      setViewMode("list");
      setPatientInputSearch("");

      // Afficher l'ordonnance officielle à l'écran prête à être imprimée
      setPreviewPrescription(newOrd);

      if (createdNewDossier) {
        Swal.fire({
          icon: "success",
          title: "Dossier médical créé & Ordonnance prête",
          html: `Dossier médical <strong>${pat.fileNumber}</strong> créé pour <strong>${pat.lastName} ${pat.firstName}</strong>.<br/>Prescription <strong>#${newOrd.prescriptionNumber}</strong> enregistrée.`,
          confirmButtonColor: "#1e60d5",
          timer: 2500,
        });
      }
    } catch (err) {
      console.error("Erreur sauvegarde ordonnance :", err);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible d'enregistrer l'ordonnance : " + err.message,
        confirmButtonColor: "#1e60d5",
      });
    }
  };

  const handleDeletePrescription = (id, num) => {
    Swal.fire({
      title: "Supprimer cette ordonnance ?",
      text: `Êtes-vous sûr de vouloir supprimer l'ordonnance ${num || ""} ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await ApiService.deletePrescription(id);
          setPrescriptions((prev) => prev.filter((p) => p.id !== id));
          Swal.fire({
            icon: "success",
            title: "Ordonnance supprimée",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (err) {
          console.error("Erreur suppression ordonnance :", err);
        }
      }
    });
  };

  // Tri chronologique descendant : ordonnance la plus récente TOUJOURS en 1er
  const sortedPrescriptions = [...prescriptions].sort((a, b) => {
    const dComp = (b.date || "").localeCompare(a.date || "");
    if (dComp !== 0) return dComp;
    const tComp = (b.time || "").localeCompare(a.time || "");
    if (tComp !== 0) return tComp;
    return (b.id || 0) - (a.id || 0);
  });

  const filteredPrescriptions = sortedPrescriptions.filter(
    (p) =>
      (p.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.prescriptionNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* ============================================================== */}
      {/* VUE 1 : CRÉATION PLEINE PAGE (AUCUN POPUP, DESIGN SOIGNÉ)      */}
      {/* ============================================================== */}
      {viewMode === "create" ? (
        <div>
          <PageTitle motherMenu="Ordonnances" activeMenu="Rédiger une Ordonnance" />

          {/* Barre d'en-tête de la page de rédaction */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-primary"
                className="btn-rounded d-flex align-items-center gap-2"
                onClick={() => setViewMode("list")}
                style={{
                  fontWeight: "600",
                  borderColor: "#1e60d5",
                  color: "#1e60d5",
                  backgroundColor: "#ffffff",
                }}
              >
                <i className="fa fa-arrow-left"></i>
                <span>Retour aux ordonnances</span>
              </Button>
              <div>
                <h3 className="font-w700 text-dark mb-0 fs-20">
                  Nouvelle Ordonnance Médicale
                </h3>
                <p className="text-muted fs-12 mb-0">
                  Prescription détaillée, posologies et durée du traitement
                </p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="light"
                className="btn-rounded px-4"
                onClick={() => setViewMode("list")}
                style={{
                  fontWeight: "600",
                  color: "#1e293b",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                }}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                className="btn-rounded px-4"
                onClick={handleSavePrescription}
                style={{
                  backgroundColor: "#1e60d5",
                  borderColor: "#1e60d5",
                  fontWeight: "600",
                  boxShadow: "0 4px 12px rgba(30, 96, 213, 0.25)",
                }}
              >
                <i className="fa fa-check me-2"></i>
                Enregistrer l'ordonnance
              </Button>
            </div>
          </div>

          <form onSubmit={handleSavePrescription}>
            {/* CARTE 1 : INFORMATIONS PATIENT & DATE */}
            <div
              className="card border-0 shadow-sm mb-4"
              style={{
                borderRadius: "1rem",
                backgroundColor: "#ffffff",
                border: "1px solid #eef2f6",
              }}
            >
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fs-11 font-w700 text-uppercase text-dark mb-1 d-flex align-items-center gap-2">
                      <i className="fa fa-user text-primary"></i>
                      <span>PATIENT <span className="text-danger">*</span></span>
                    </label>
                    <CreatableSelect
                      isSearchable={true}
                      isClearable={true}
                      placeholder="Rechercher ou saisir un nouveau nom de patient..."
                      options={patientOptions}
                      value={selectedPatientOption}
                      styles={patientSelectStyles}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                      inputValue={patientInputSearch}
                      onInputChange={(val, actionMeta) => {
                        if (actionMeta.action === "input-change") {
                          setPatientInputSearch(val);
                        }
                      }}
                      onChange={(selected) => {
                        if (!selected) {
                          setFormData({
                            ...formData,
                            patientId: "",
                            patientName: "",
                            isNewPatient: false,
                          });
                          setPatientInputSearch("");
                          return;
                        }

                        if (selected.patient) {
                          setFormData({
                            ...formData,
                            patientId: selected.value,
                            patientName: `${selected.patient.firstName || ""} ${selected.patient.lastName || ""}`.trim(),
                            isNewPatient: false,
                          });
                          setPatientInputSearch("");
                        } else {
                          setFormData({
                            ...formData,
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
                        setFormData({
                          ...formData,
                          patientId: `new_${Date.now()}`,
                          patientName: clean,
                          isNewPatient: true,
                        });
                        setPatientInputSearch("");
                      }}
                      formatCreateLabel={(inputValue) => (
                        <span>
                          <i className="fa fa-user-plus text-primary me-2"></i>
                          Créer le dossier médical de : <strong className="text-primary">"{inputValue}"</strong>
                        </span>
                      )}
                      noOptionsMessage={({ inputValue }) =>
                        inputValue
                          ? `Appuyez sur Entrée pour créer le dossier médical de "${inputValue}"`
                          : "Tapez le nom, prénom ou n° dossier pour rechercher"
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fs-11 font-w700 text-uppercase text-dark mb-1 d-flex align-items-center gap-2">
                      <i className="fa fa-calendar-alt text-primary"></i>
                      <span>DATE DU DOCUMENT <span className="text-danger">*</span></span>
                    </label>
                    <WheelDatePicker
                      value={formData.date || new Date().toISOString().split("T")[0]}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      title="DATE DU DOCUMENT"
                      required
                      style={{ height: "45px" }}
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fs-11 font-w700 text-uppercase text-dark mb-1 d-flex align-items-center gap-2">
                      <i className="fa fa-clock text-primary"></i>
                      <span>VALIDITÉ</span>
                    </label>
                    <select
                      className="form-control"
                      value={formData.validity || "3 mois"}
                      onChange={(e) =>
                        setFormData({ ...formData, validity: e.target.value })
                      }
                      style={{
                        height: "45px",
                        borderRadius: "0.6rem",
                        borderColor: "#e2e8f0",
                        backgroundColor: "#ffffff",
                        fontWeight: "600",
                        color: "#1e293b",
                      }}
                    >
                      <option value="1 mois">1 mois</option>
                      <option value="3 mois">3 mois</option>
                      <option value="6 mois">6 mois</option>
                      <option value="12 mois">12 mois</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CARTE 2 : LISTE DES MÉDICAMENTS (PLEINE LARGEUR, TRÈS CONFORTABLE) */}
            <div
              className="card border-0 shadow-sm mb-4"
              style={{
                borderRadius: "1rem",
                backgroundColor: "#ffffff",
                border: "1px solid #eef2f6",
              }}
            >
              <div className="card-header bg-white border-0 pt-4 px-4 pb-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="font-w700 text-dark mb-0 fs-16 d-flex align-items-center gap-2">
                    <i className="fa fa-pills text-primary"></i>
                    <span>Médicaments & Traitements</span>
                  </h5>
                  <p className="text-muted fs-12 mb-0">
                    Renseignez les médicaments prescrits, leurs posologies et durées
                  </p>
                </div>
                <Button
                  variant="outline-primary"
                  className="btn-rounded btn-sm d-flex align-items-center gap-2"
                  onClick={handleAddItem}
                  style={{
                    fontWeight: "600",
                    borderColor: "#1e60d5",
                    color: "#1e60d5",
                    backgroundColor: "#f0f7ff",
                  }}
                >
                  <i className="fa fa-plus-circle fs-14"></i>
                  <span>Ajouter un médicament</span>
                </Button>
              </div>

              <div className="card-body px-4 py-3">
                <div className="table-responsive" style={{ overflow: "visible" }}>
                  <table className="table table-borderless align-middle mb-0">
                    <thead>
                      <tr
                        className="text-dark fs-11 text-uppercase font-w700"
                        style={{ borderBottom: "2px solid #eef2f6" }}
                      >
                        <th style={{ width: "3%", color: "#1e293b" }}>#</th>
                        <th style={{ width: "32%", color: "#1e293b" }}>
                          MÉDICAMENT <span className="text-danger">*</span>
                        </th>
                        <th style={{ width: "16%", color: "#1e293b" }}>
                          CATÉGORIE / FORME
                        </th>
                        <th style={{ width: "20%", color: "#1e293b" }}>
                          COMBIEN DE FOIS / JOUR
                        </th>
                        <th style={{ width: "16%", color: "#1e293b" }}>
                          AVANT OU APRÈS REPAS
                        </th>
                        <th style={{ width: "10%", color: "#1e293b" }}>
                          DURÉE
                        </th>
                        <th style={{ width: "3%" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr
                          key={index}
                          style={{ borderBottom: "1px solid #f1f5f9" }}
                        >
                          <td className="text-dark fs-12 font-w700 text-center align-middle">
                            #{index + 1}
                          </td>
                          <td className="py-3 align-middle">
                            <MedicationSearchInput
                              value={item.medication}
                              onChange={(val) =>
                                handleItemChange(index, "medication", val)
                              }
                              medications={medications}
                              onSelectMedication={(med) =>
                                handleSelectMedication(index, med)
                              }
                              placeholder="Rechercher ou saisir un médicament..."
                            />
                          </td>
                          <td className="py-3 align-middle">
                            <select
                              className="form-control form-control-sm"
                              value={item.form || ""}
                              onChange={(e) =>
                                handleItemChange(index, "form", e.target.value)
                              }
                              style={{
                                height: "44px",
                                fontSize: "13px",
                                fontWeight: item.form ? "600" : "400",
                                borderRadius: "0.6rem",
                                borderColor: "#e2e8f0",
                                backgroundColor: "#ffffff",
                                color: item.form ? "#1e60d5" : "#94a3b8",
                                cursor: "pointer",
                              }}
                            >
                              <option value="" style={{ color: "#94a3b8" }}>
                                -- Sélectionner le type --
                              </option>
                              {item.form &&
                                !MEDICATION_TYPES.some(
                                  (t) =>
                                    t.value.toLowerCase() === item.form.toLowerCase() ||
                                    t.label.toLowerCase() === item.form.toLowerCase()
                                ) && (
                                  <option value={item.form} style={{ color: "#1e293b" }}>
                                    {item.form}
                                  </option>
                                )}
                              {MEDICATION_TYPES.map((t) => (
                                <option
                                  key={t.value}
                                  value={t.value}
                                  style={{ color: "#1e293b" }}
                                >
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 align-middle">
                            <input
                              type="text"
                              list={`posology-options-${index}`}
                              className="form-control form-control-sm"
                              placeholder="Ex: 2 fois par jour..."
                              value={item.posology}
                              onChange={(e) =>
                                handleItemChange(index, "posology", e.target.value)
                              }
                              style={{
                                height: "44px",
                                fontSize: "13px",
                                fontWeight: "500",
                                borderRadius: "0.6rem",
                                borderColor: "#e2e8f0",
                                backgroundColor: "#ffffff",
                                color: "#1e293b",
                              }}
                            />
                            <datalist id={`posology-options-${index}`}>
                              <option value="1 fois par jour" />
                              <option value="2 fois par jour" />
                              <option value="3 fois par jour" />
                              <option value="4 fois par jour" />
                              <option value="1 comprimé matin et soir" />
                              <option value="1 comprimé matin, midi et soir" />
                              <option value="1 cuillère matin et soir" />
                              <option value="1 sachet le matin" />
                              <option value="En cas de besoin (douleur / fièvre)" />
                            </datalist>
                          </td>
                          <td className="py-3 align-middle">
                            <input
                              type="text"
                              list={`meal-options-${index}`}
                              className="form-control form-control-sm"
                              placeholder="Ex: Après les repas..."
                              value={item.mealTiming}
                              onChange={(e) =>
                                handleItemChange(index, "mealTiming", e.target.value)
                              }
                              style={{
                                height: "44px",
                                fontSize: "13px",
                                fontWeight: "500",
                                borderRadius: "0.6rem",
                                borderColor: "#e2e8f0",
                                backgroundColor: "#ffffff",
                                color: "#1e293b",
                              }}
                            />
                            <datalist id={`meal-options-${index}`}>
                              <option value="Avant les repas" />
                              <option value="Pendant les repas" />
                              <option value="Après les repas" />
                              <option value="À jeun (le matin)" />
                              <option value="Au coucher" />
                              <option value="Entre les repas" />
                            </datalist>
                          </td>
                          <td className="py-3 align-middle">
                            <input
                              type="text"
                              list={`duration-options-${index}`}
                              className="form-control form-control-sm"
                              placeholder="Ex: 5 jours..."
                              value={item.duration}
                              onChange={(e) =>
                                handleItemChange(index, "duration", e.target.value)
                              }
                              style={{
                                height: "44px",
                                fontSize: "13px",
                                fontWeight: "500",
                                borderRadius: "0.6rem",
                                borderColor: "#e2e8f0",
                                backgroundColor: "#ffffff",
                                color: "#1e293b",
                              }}
                            />
                            <datalist id={`duration-options-${index}`}>
                              <option value="3 jours" />
                              <option value="5 jours" />
                              <option value="7 jours" />
                              <option value="10 jours" />
                              <option value="15 jours" />
                              <option value="1 mois" />
                              <option value="2 mois" />
                              <option value="3 mois" />
                              <option value="Traitement continu" />
                            </datalist>
                          </td>
                          <td className="py-3 align-middle text-center">
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-link text-danger p-1"
                                onClick={() => handleRemoveItem(index)}
                                title="Supprimer cette ligne"
                              >
                                <i className="fa fa-trash fs-15 text-danger"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3">
                  <Button
                    variant="outline-primary"
                    className="btn-rounded btn-sm d-flex align-items-center gap-2"
                    onClick={handleAddItem}
                    style={{
                      fontWeight: "600",
                      borderColor: "#1e60d5",
                      color: "#1e60d5",
                      backgroundColor: "#f0f7ff",
                    }}
                  >
                    <i className="fa fa-plus-circle fs-14"></i>
                    <span>Ajouter un autre médicament</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* CARTE 3 : RECOMMANDATIONS & ACTIONS */}
            <div
              className="card border-0 shadow-sm mb-4"
              style={{
                borderRadius: "1rem",
                backgroundColor: "#ffffff",
                border: "1px solid #eef2f6",
              }}
            >
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fs-11 font-w700 text-uppercase text-dark mb-1 d-flex align-items-center gap-2">
                      <i className="fa fa-info-circle text-primary"></i>
                      <span>CONSIGNES PARTICULIÈRES & RECOMMANDATIONS POUR LE PATIENT</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.notes || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Ex: Respecter la posologie prescrite. Revenir en consultation si persistance des douleurs."
                      style={{
                        height: "45px",
                        borderRadius: "0.6rem",
                        borderColor: "#e2e8f0",
                        backgroundColor: "#ffffff",
                        fontSize: "13px",
                        color: "#1e293b",
                      }}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end align-items-center gap-2 mt-4 pt-3 border-top">
                  <Button
                    variant="light"
                    className="btn-rounded px-4"
                    onClick={() => setViewMode("list")}
                    style={{
                      fontWeight: "600",
                      color: "#1e293b",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="btn-rounded px-4"
                    style={{
                      backgroundColor: "#1e60d5",
                      borderColor: "#1e60d5",
                      fontWeight: "600",
                      boxShadow: "0 4px 12px rgba(30, 96, 213, 0.25)",
                    }}
                  >
                    <i className="fa fa-check me-2"></i>
                    Enregistrer l'ordonnance
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ============================================================== */
        /* VUE 2 : REGISTRE DES ORDONNANCES (LISTE PRINCIPALE)            */
        /* ============================================================== */
        <div>
          <PageTitle motherMenu="Gestion médicale" activeMenu="Ordonnances" />

          {/* Barre d'action supérieure */}
          <div className="form-head d-flex mb-3 mb-md-4 align-items-center flex-wrap justify-content-between gap-2">
            <div className="input-group search-area" style={{ width: "auto", minWidth: "260px" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par patient, n° ordonnance..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="input-group-text">
                <i className="flaticon-381-search-2"></i>
              </span>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
              <Button
                variant="outline-primary"
                className="btn-rounded"
                onClick={() => setShowMedModal(true)}
                title="Base et répertoire des médicaments"
              >
                <i className="fa fa-pills me-2"></i> Médicaments
              </Button>

              <Button
                variant="primary"
                className="btn-rounded"
                onClick={handleOpenCreate}
              >
                <i className="flaticon-381-add-1 me-2"></i> Rédiger une Ordonnance
              </Button>
            </div>
          </div>

          {/* Tableau des ordonnances */}
          <div className="card">
            <div className="card-header border-0 pb-0">
              <div>
                <h4 className="card-title">Registre des Ordonnances Médicales</h4>
                <p className="text-muted fs-13 mb-0">
                  Validées et signées numériquement par le {initialDoctor.name}
                </p>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover mb-0" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: "105px" }}><strong>N° ORDONNANCE</strong></th>
                      <th className="d-none d-md-table-cell"><strong>DATE</strong></th>
                      <th><strong>PATIENT</strong></th>
                      <th className="d-none d-md-table-cell"><strong>MÉDICAMENTS PRESCRITS</strong></th>
                      <th className="d-none d-md-table-cell"><strong>VALIDITÉ</strong></th>
                      <th className="text-end" style={{ width: "125px" }}><strong>ACTIONS</strong></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrescriptions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          Aucune ordonnance trouvée.
                        </td>
                      </tr>
                    ) : (
                      filteredPrescriptions.map((ord) => (
                        <tr key={ord.id}>
                          <td>
                            <strong className="text-primary">{ord.prescriptionNumber}</strong>
                            <div className="d-block d-md-none text-muted fs-11 mt-1">
                              {ord.date}
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">{ord.date}</td>
                          <td>
                            <span className="font-w600 text-dark">{ord.patientName}</span>
                            <div className="d-block d-md-none text-muted fs-11 mt-1">
                              {(ord.items || []).length} méd. prescrit(s)
                            </div>
                          </td>
                          <td className="d-none d-md-table-cell">
                            <ul className="mb-0 ps-3 fs-13">
                              {(ord.items || []).map((item, idx) => (
                                <li key={idx}>
                                  <strong>{item.medication}</strong>
                                  {item.form && (
                                    <span
                                      className="badge badge-sm badge-info light border ms-1 py-0 px-1"
                                      style={{ fontSize: "10px" }}
                                    >
                                      {item.form}
                                    </span>
                                  )}
                                  {item.posology && ` — ${item.posology}`}
                                  {(item.instructions || item.mealTiming) && (
                                    <span className="text-muted ms-1">
                                      ({item.instructions || item.mealTiming})
                                    </span>
                                  )}
                                  {item.duration && (
                                    <span className="text-primary font-w500 ms-1">
                                      [{item.duration}]
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="d-none d-md-table-cell">{ord.validity}</td>
                          <td style={{ width: "125px", whiteSpace: "nowrap" }} className="text-end pe-0">
                            <div className="d-flex align-items-center justify-content-end">
                              <button
                                type="button"
                                className="btn btn-primary shadow btn-xs sharp me-1"
                                onClick={() => setPreviewPrescription(ord)}
                                title="Aperçu & Impression officielle"
                              >
                                <i className="fa fa-print"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger shadow btn-xs sharp"
                                onClick={() =>
                                  handleDeletePrescription(
                                    ord.id,
                                    ord.prescriptionNumber
                                  )
                                }
                                title="Supprimer l'ordonnance"
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prévisualisation & Impression Officielle d'Ordonnance avec En-tête Bilingue Officiel */}
      <PrescriptionPreviewModal
        show={!!previewPrescription}
        onHide={() => setPreviewPrescription(null)}
        prescription={previewPrescription}
      />

      {/* Datalist pour autocomplétion rapide de la saisie */}
      <datalist id="medications-catalog-datalist">
        {medications.map((m, mIdx) => (
          <option key={m.id || `${m.name}-${mIdx}`} value={m.name}>
            {m.dosage ? `${m.dosage} - ${m.defaultPosology || ""}` : ""}
          </option>
        ))}
      </datalist>

      {/* Modal Répertoire & Base Médicaments */}
      <MedicationsModal
        show={showMedModal}
        onHide={() => setShowMedModal(false)}
        medications={medications}
        onMedicationsUpdated={setMedications}
      />
    </>
  );
};

export default PrescriptionsPage;
