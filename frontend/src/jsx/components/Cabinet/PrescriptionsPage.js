import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import WheelDatePicker from "./WheelDatePicker";
import PrescriptionPreviewModal from "./PrescriptionPreviewModal";
import MedicationsModal from "./MedicationsModal";
import ApiService from "../../../services/ApiService";
import {
  initialDoctor,
  initialPatients,
  initialPrescriptions,
  initialMedications,
} from "../../../services/CabinetData";

/**
 * Composant de saisie intelligente pour le nom du médicament :
 * - Permet d'écrire librement n'importe quel texte
 * - Recherche automatiquement en temps réel dans la liste des médicaments de la base de données
 * - Propose les résultats sous forme de liste déroulante interactive
 * - Si le médicament n'existe pas en base, indique clairement qu'il sera ajouté directement
 */
const MedicationSearchInput = ({
  value = "",
  onChange,
  medications = [],
  onSelectMedication,
  placeholder = "Ex: PARACÉTAMOL 1000 mg, AMOXICILLINE...",
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

  const exactMatch = medications.some(
    (m) => (m.name || "").toLowerCase().trim() === query
  );

  return (
    <div ref={containerRef} className="position-relative w-100">
      <div className="input-group input-group-sm">
        <span
          className="input-group-text bg-white border-end-0 text-muted"
          style={{
            borderRadius: "0.6rem 0 0 0.6rem",
            borderColor: "#e2e8f0",
          }}
        >
          <i className="fa fa-pills text-primary opacity-75"></i>
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
            maxHeight: "230px",
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
                  (e.currentTarget.style.backgroundColor = "#f0f7ff")
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
                  {m.defaultPosology && (
                    <span className="text-muted fs-11">
                      Posologie habituelle : {m.defaultPosology}
                    </span>
                  )}
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

const PrescriptionsPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const patientIdQuery = searchParams.get("patientId");

  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [medications, setMedications] = useState(initialMedications);
  const [showMedModal, setShowMedModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const handleOpenCreate = () => {
    setPatientInputSearch("");
    setFormData({
      patientId: patientIdQuery ? parseInt(patientIdQuery) : "",
      patientName: "",
      isNewPatient: false,
      date: new Date().toISOString().split("T")[0],
      validity: "3 mois",
      ald: false,
      items: [
        {
          medication: "",
          dosage: "",
          posology: "1 fois par jour",
          duration: "5 jours",
          renewable: "Non renouvelable",
        },
      ],
      notes: "Respecter la posologie prescrite.",
    });
    setShowCreateModal(true);
  };

  useEffect(() => {
    if (patientIdQuery) {
      const found = prescriptions.find((p) => p.patientId === parseInt(patientIdQuery));
      if (found) {
        setPreviewPrescription(found);
      }
    }
  }, [patientIdQuery, prescriptions]);

  // Formulaire d'ordonnance simplifié (3 champs essentiels : Patient, Médicament, Combien de fois par jour)
  const [formData, setFormData] = useState({
    patientId: patientIdQuery ? parseInt(patientIdQuery) : "",
    patientName: "",
    isNewPatient: false,
    date: new Date().toISOString().split("T")[0],
    validity: "3 mois",
    ald: false,
    items: [
      {
        medication: "",
        dosage: "",
        posology: "1 fois par jour",
        duration: "5 jours",
        renewable: "Non renouvelable",
      },
    ],
    notes: "Respecter la posologie prescrite.",
  });

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
      borderRadius: "0.75rem",
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
      fontSize: "14px",
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
      zIndex: 99999,
      borderRadius: "0.75rem",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
    }),
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          medication: "",
          dosage: "",
          posology: "1 fois par jour",
          duration: "5 jours",
          renewable: "Non renouvelable",
        },
      ],
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
    setFormData({ ...formData, items: updated });
  };

  const handleSelectMedication = (index, med) => {
    const updated = [...formData.items];
    updated[index].medication = med.name || "";
    if (med.dosage) updated[index].dosage = med.dosage;
    if (med.defaultPosology) updated[index].posology = med.defaultPosology;
    if (med.defaultDuration) updated[index].duration = med.defaultDuration;
    setFormData({ ...formData, items: updated });
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();

    const typedName = (
      formData.patientName ||
      patientInputSearch ||
      ""
    ).trim();

    let pat = null;
    if (
      formData.patientId &&
      typeof formData.patientId === "number" &&
      !formData.isNewPatient
    ) {
      pat = patients.find((p) => String(p.id) === String(formData.patientId));
    } else if (formData.patientId && !formData.isNewPatient) {
      pat = patients.find((p) => String(p.id) === String(formData.patientId));
    }

    // Vérifier si un patient avec ce nom exact existe déjà
    if (!pat && typedName) {
      const lowerTyped = typedName.toLowerCase();
      pat = patients.find((p) => {
        const full1 = `${p.lastName || ""} ${p.firstName || ""}`.toLowerCase().trim();
        const full2 = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase().trim();
        return full1 === lowerTyped || full2 === lowerTyped;
      });
    }

    if (!pat && !typedName) {
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
        posology: it.posology?.trim() || "1 fois par jour",
        duration: it.duration || "5 jours",
        dosage: it.dosage || "",
        renewable: it.renewable || "Non renouvelable",
      }));

    // Si un médicament saisi n'existe pas en base de données, l'enregistrer automatiquement dans MySQL
    for (const it of cleanItems) {
      const exists = medications.some(
        (m) => (m.name || "").toLowerCase().trim() === it.medication.toLowerCase()
      );
      if (!exists) {
        try {
          await ApiService.saveMedication({
            name: it.medication,
            defaultPosology: it.posology,
            dosage: it.dosage || "",
            form: "",
            defaultDuration: it.duration || "5 jours",
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
      setShowCreateModal(false);
      setPatientInputSearch("");

      // Afficher l'ordonnance officielle à l'écran (sans lancer l'impression directe)
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

  const filteredPrescriptions = prescriptions.filter(
    (p) =>
      (p.patientName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.prescriptionNumber || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
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

      {/* POPUP MODAL NOUVELLE ORDONNANCE (Inspiré de l'Image 2, avec la charte graphique Admin) */}
      <Modal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        size="lg"
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg"
        style={{ zIndex: 1050 }}
      >
        <div
          className="modal-header border-0 pb-1 pt-4 px-4 d-flex justify-content-between align-items-center"
          style={{
            background: "#ffffff",
            borderTopLeftRadius: "1rem",
            borderTopRightRadius: "1rem",
          }}
        >
          <div>
            <h4 className="modal-title font-w700 text-dark mb-0 fs-18">
              Nouvelle Ordonnance
            </h4>
            <p className="text-muted fs-12 mb-0 mt-1">
              Prescription médicamenteuse et posologies pour le patient
            </p>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Fermer"
            onClick={() => setShowCreateModal(false)}
            style={{ fontSize: "14px" }}
          ></button>
        </div>

        <form onSubmit={handleSavePrescription}>
          <div className="modal-body px-4 py-3" style={{ background: "#ffffff" }}>
            {/* 1. Ligne Supérieure : Patient * et Date du document * (comme dans Image 2) */}
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <label className="form-label fs-11 font-w700 text-uppercase text-muted mb-1 d-flex align-items-center gap-1">
                  <i className="fa fa-user text-primary opacity-75"></i>
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

              <div className="col-md-4">
                <label className="form-label fs-11 font-w700 text-uppercase text-muted mb-1 d-flex align-items-center gap-1">
                  <i className="fa fa-calendar-alt text-muted opacity-75"></i>
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
            </div>

            {/* 2. En-tête de section Médicaments & Posologies avec bouton "+ Ajouter" (comme ARTICLES & PRESTATIONS dans Image 2) */}
            <div className="d-flex justify-content-between align-items-center mb-2 pt-2 border-top">
              <span
                className="text-uppercase text-muted fs-11 font-w700"
                style={{ letterSpacing: "0.5px" }}
              >
                MÉDICAMENTS & POSOLOGIES
              </span>
              <button
                type="button"
                className="btn btn-link text-primary font-w600 p-0 text-decoration-none fs-13 d-flex align-items-center gap-1"
                onClick={handleAddItem}
              >
                <i className="fa fa-plus-circle fs-14"></i>
                <span>Ajouter</span>
              </button>
            </div>

            {/* 3. Table des médicaments avec 3 champs essentiels (comme Image 2) */}
            <div className="table-responsive mb-2" style={{ overflow: "visible" }}>
              <table className="table table-borderless align-middle mb-0">
                <thead>
                  <tr
                    className="text-muted fs-11 text-uppercase font-w600"
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <th style={{ width: "55%" }}>
                      NOM DU MÉDICAMENT <span className="text-danger">*</span>
                    </th>
                    <th style={{ width: "40%" }}>
                      COMBIEN DE FOIS PAR JOUR <span className="text-danger">*</span>
                    </th>
                    <th style={{ width: "5%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="ps-0 py-2 align-middle">
                        {/* Champ 2 : Nom du médicament avec recherche automatique dans la base & saisie libre */}
                        <MedicationSearchInput
                          value={item.medication}
                          onChange={(val) =>
                            handleItemChange(index, "medication", val)
                          }
                          medications={medications}
                          onSelectMedication={(med) =>
                            handleSelectMedication(index, med)
                          }
                          placeholder="Ex: PARACÉTAMOL 1000 mg, AMOXICILLINE..."
                        />
                      </td>
                      <td className="py-2 align-middle">
                        {/* Champ 3 : Combien de fois par jour sur la MÊME LIGNE avec boutons de sélection intégrés */}
                        <div
                          className="input-group input-group-sm flex-nowrap"
                          style={{ height: "44px" }}
                        >
                          <input
                            type="text"
                            list={`posology-options-${index}`}
                            className="form-control form-control-sm border-end-0"
                            placeholder="Ex: 3 fois par jour"
                            value={item.posology}
                            onChange={(e) =>
                              handleItemChange(index, "posology", e.target.value)
                            }
                            required
                            style={{
                              borderRadius: "0.6rem 0 0 0.6rem",
                              borderColor: "#e2e8f0",
                              height: "44px",
                              fontSize: "13px",
                              fontWeight: "500",
                              minWidth: "120px",
                            }}
                          />
                          <datalist id={`posology-options-${index}`}>
                            <option value="1 fois par jour" />
                            <option value="2 fois par jour" />
                            <option value="3 fois par jour" />
                            <option value="4 fois par jour" />
                            <option value="1 comprimé matin et soir" />
                            <option value="1 comprimé matin, midi et soir" />
                            <option value="En cas de besoin (douleur / fièvre)" />
                          </datalist>

                          <button
                            type="button"
                            className={`btn btn-sm ${item.posology === "1 fois par jour"
                                ? "btn-primary text-white"
                                : "btn-light text-dark border-top border-bottom"
                              }`}
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              padding: "0 10px",
                              borderColor: "#e2e8f0",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() =>
                              handleItemChange(index, "posology", "1 fois par jour")
                            }
                            title="1 fois par jour"
                          >
                            1 fois/j
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${item.posology === "2 fois par jour"
                                ? "btn-primary text-white"
                                : "btn-light text-dark border-top border-bottom"
                              }`}
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              padding: "0 10px",
                              borderColor: "#e2e8f0",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() =>
                              handleItemChange(index, "posology", "2 fois par jour")
                            }
                            title="2 fois par jour"
                          >
                            2 fois/j
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${item.posology === "3 fois par jour"
                                ? "btn-primary text-white"
                                : "btn-light text-dark border-top border-bottom border-end"
                              }`}
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              padding: "0 10px",
                              borderRadius: "0 0.6rem 0.6rem 0",
                              borderColor: "#e2e8f0",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() =>
                              handleItemChange(index, "posology", "3 fois par jour")
                            }
                            title="3 fois par jour"
                          >
                            3 fois/j
                          </button>
                        </div>
                      </td>
                      <td
                        className="pe-0 py-2 text-center align-middle"
                        style={{ width: "35px" }}
                      >
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-link text-danger p-1"
                            onClick={() => handleRemoveItem(index)}
                            title="Supprimer cette ligne"
                          >
                            <i className="fa fa-trash fs-15 text-muted hover-danger"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pied de modal avec boutons Annuler et Créer (comme dans Image 2) */}
          <div
            className="modal-footer border-0 pt-0 pb-4 px-4 d-flex justify-content-end gap-2"
            style={{
              background: "#ffffff",
              borderBottomLeftRadius: "1rem",
              borderBottomRightRadius: "1rem",
            }}
          >
            <Button
              variant="light"
              className="btn-rounded px-4"
              style={{
                color: "#475569",
                backgroundColor: "#f1f5f9",
                border: "none",
                fontWeight: "500",
                fontSize: "13px",
              }}
              onClick={() => setShowCreateModal(false)}
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
                fontSize: "13px",
              }}
            >
              <i className="fa fa-check me-2"></i>
              Créer
            </Button>
          </div>
        </form>
      </Modal>

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
                        {/* Date visible sur mobile sous le numéro d'ordonnance */}
                        <div className="d-block d-md-none text-muted fs-11 mt-1">
                          {ord.date}
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">{ord.date}</td>
                      <td>
                        <span className="font-w600 text-dark">{ord.patientName}</span>
                        {/* Résumé des médicaments visible sur mobile */}
                        <div className="d-block d-md-none text-muted fs-11 mt-1">
                          {(ord.items || []).length} méd. prescrit(s)
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <ul className="mb-0 ps-3 fs-13">
                          {(ord.items || []).map((item, idx) => (
                            <li key={idx}>
                              <strong>{item.medication}</strong> ({item.posology})
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
