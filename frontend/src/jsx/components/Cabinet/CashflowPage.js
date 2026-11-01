import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import WheelDatePicker from "./WheelDatePicker";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";

const formatDA = (amount) => {
  const num = Math.round(Number(amount) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " DA";
};

const formatDateFr = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const CashflowPage = () => {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState({ all: [], recettes: [], depenses: [] });
  const [summary, setSummary] = useState({
    totalRecettes: 0,
    totalDepenses: 0,
    soldeCaisse: 0,
    todayRecettes: 0,
    todayDepenses: 0,
    beneficeJour: 0,
    monthRecettes: 0,
    monthDepenses: 0,
    totalEntries: 0,
  });

  // Navigation entre vue principale et gestion des catégories
  const [viewMode, setViewMode] = useState("journal"); // 'journal' | 'categories'

  // Filtres
  const [filterType, setFilterType] = useState("ALL"); // 'ALL' | 'RECETTE' | 'DEPENSE'
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Écriture (Création / Modification)
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const initialFormState = {
    id: null,
    type: "RECETTE", // 'RECETTE' | 'DEPENSE'
    amount: "",
    entryDate: new Date().toISOString().split("T")[0],
    partyName: "",
    partyPhone: "",
    category: "",
    paymentMethod: "Espèces",
    notes: "",
    attachmentPath: null,
    attachmentName: null,
  };

  const [formEntry, setFormEntry] = useState(initialFormState);

  // Modal Prévisualisation Justificatif
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // État formulaire ajout rapide de catégorie
  const [newRecetteCategory, setNewRecetteCategory] = useState("");
  const [newDepenseCategory, setNewDepenseCategory] = useState("");

  // État modification en ligne d'une catégorie
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  // Chargement des données depuis l'API backend MySQL
  const loadCashflowData = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getCashflow();
      if (data) {
        if (Array.isArray(data.entries)) setEntries(data.entries);
        if (data.categories) setCategories(data.categories);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Erreur chargement journal de caisse :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashflowData();
  }, []);

  // Définir la catégorie par défaut selon le type
  useEffect(() => {
    if (!formEntry.category) {
      if (formEntry.type === "RECETTE" && categories.recettes?.length > 0) {
        setFormEntry((prev) => ({ ...prev, category: categories.recettes[0].name }));
      } else if (formEntry.type === "DEPENSE" && categories.depenses?.length > 0) {
        setFormEntry((prev) => ({ ...prev, category: categories.depenses[0].name }));
      }
    }
  }, [formEntry.type, categories]);

  // Ouverture modal d'ajout
  const handleOpenAdd = (defaultType = "RECETTE") => {
    setIsEditing(false);
    const catList = defaultType === "RECETTE" ? categories.recettes : categories.depenses;
    const defaultCat = catList && catList.length > 0 ? catList[0].name : (defaultType === "RECETTE" ? "CONSULTATION MÉDICALE" : "AUTRE DÉPENSE");

    setFormEntry({
      ...initialFormState,
      type: defaultType,
      category: defaultCat,
      entryDate: new Date().toISOString().split("T")[0],
    });
    setShowEntryModal(true);
  };

  // Ouverture modal d'édition
  const handleOpenEdit = (entry) => {
    setIsEditing(true);
    setFormEntry({
      id: entry.id,
      type: entry.type,
      amount: entry.amount,
      entryDate: entry.entryDate,
      partyName: entry.partyName,
      partyPhone: entry.partyPhone || "",
      category: entry.category,
      paymentMethod: entry.paymentMethod || "Espèces",
      notes: entry.notes || "",
      attachmentPath: entry.attachmentPath,
      attachmentName: entry.attachmentName,
    });
    setShowEntryModal(true);
  };

  // Gestion du fichier justificatif
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormEntry((prev) => ({
        ...prev,
        attachmentPath: event.target.result,
        attachmentName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setFormEntry((prev) => ({
      ...prev,
      attachmentPath: null,
      attachmentName: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Enregistrement de l'écriture
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!formEntry.amount || Number(formEntry.amount) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Montant invalide",
        text: "Veuillez saisir un montant valide supérieur à 0 DA.",
        confirmButtonColor: "#1e60d5",
      });
      return;
    }
    if (!formEntry.partyName.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Tiers obligatoire",
        text: "Veuillez renseigner le nom du client ou fournisseur.",
        confirmButtonColor: "#1e60d5",
      });
      return;
    }

    try {
      await ApiService.saveCashEntry(formEntry);
      setShowEntryModal(false);
      Swal.fire({
        icon: "success",
        title: isEditing ? "Écriture modifiée" : "Écriture enregistrée",
        text: `L'opération de ${formEntry.type === "RECETTE" ? "recette" : "dépense"} a été enregistrée avec succès.`,
        timer: 2000,
        showConfirmButton: false,
      });
      loadCashflowData();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: "Impossible d'enregistrer : " + err.message,
        confirmButtonColor: "#1e60d5",
      });
    }
  };

  // Suppression d'une écriture
  const handleDeleteEntry = (entry) => {
    Swal.fire({
      title: "Confirmer la suppression ?",
      html: `Êtes-vous sûr de vouloir supprimer l'écriture <b>${entry.reference}</b> de <b>${formatDA(entry.amount)}</b> ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await ApiService.deleteCashEntry(entry.id);
          Swal.fire({
            icon: "success",
            title: "Supprimé !",
            text: "L'écriture a été retirée du journal de caisse.",
            timer: 1800,
            showConfirmButton: false,
          });
          loadCashflowData();
        } catch (err) {
          Swal.fire("Erreur", "Impossible de supprimer : " + err.message, "error");
        }
      }
    });
  };

  // Ajout d'une catégorie
  const handleAddCategory = async (type, name) => {
    if (!name.trim()) return;
    try {
      await ApiService.saveCashCategory({ type, name: name.trim() });
      if (type === "RECETTE") setNewRecetteCategory("");
      else setNewDepenseCategory("");
      Swal.fire({
        icon: "success",
        title: "Catégorie ajoutée",
        timer: 1500,
        showConfirmButton: false,
      });
      loadCashflowData();
    } catch (err) {
      Swal.fire("Erreur", "Impossible d'ajouter : " + err.message, "error");
    }
  };

  // Modification en ligne d'une catégorie
  const handleStartEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleSaveEditCategory = async (cat, newName) => {
    const trimmed = (newName || "").trim();
    if (!trimmed) {
      Swal.fire("Attention", "Le nom de la catégorie ne peut pas être vide", "warning");
      return;
    }
    try {
      await ApiService.saveCashCategory({
        id: cat.id,
        type: cat.type || (categories.recettes?.some((r) => r.id === cat.id) ? "RECETTE" : "DEPENSE"),
        name: trimmed,
      });
      setEditingCategoryId(null);
      setEditingCategoryName("");
      Swal.fire({
        icon: "success",
        title: "Catégorie modifiée",
        timer: 1500,
        showConfirmButton: false,
      });
      loadCashflowData();
    } catch (err) {
      Swal.fire("Erreur", "Impossible de modifier la catégorie : " + err.message, "error");
    }
  };

  // Suppression d'une catégorie
  const handleDeleteCategory = (cat) => {
    Swal.fire({
      title: "Supprimer la catégorie ?",
      text: `Voulez-vous supprimer « ${cat.name} » ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await ApiService.deleteCashCategory(cat.id);
          loadCashflowData();
        } catch (err) {
          Swal.fire("Erreur", err.message, "error");
        }
      }
    });
  };

  // Tri chronologique descendant : le plus récent (date d'opération + heure/création + id) TOUJOURS en 1er
  const sortedEntries = [...entries].sort((a, b) => {
    const dComp = (b.entryDate || "").localeCompare(a.entryDate || "");
    if (dComp !== 0) return dComp;
    const cComp = (b.createdAt || "").localeCompare(a.createdAt || "");
    if (cComp !== 0) return cComp;
    return (b.id || 0) - (a.id || 0);
  });

  // Filtrage des écritures
  const filteredEntries = sortedEntries.filter((item) => {
    if (filterType !== "ALL" && item.type !== filterType) return false;
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase();
      const ref = (item.reference || "").toLowerCase();
      const party = (item.partyName || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const notes = (item.notes || "").toLowerCase();
      const phone = (item.partyPhone || "").toLowerCase();
      return (
        ref.includes(q) ||
        party.includes(q) ||
        cat.includes(q) ||
        notes.includes(q) ||
        phone.includes(q)
      );
    }
    return true;
  });

  const recettesCount = entries.filter((e) => e.type === "RECETTE").length;
  const depensesCount = entries.filter((e) => e.type === "DEPENSE").length;

  return (
    <>
      <PageTitle motherMenu="Gestion administrative" activeMenu="Journal de Caisse" />

      {/* ========================================================================= */}
      {/* VUE 1 : JOURNAL DE CAISSE PRINCIPAL                                       */}
      {/* ========================================================================= */}
      {viewMode === "journal" && (
        <div className="row">
          <div className="col-12">
            {/* EN-TÊTE PRINCIPAL */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
              <div>
                <h3 className="font-w700 text-dark mb-1 d-flex align-items-center gap-2">
                  <i className="fa fa-cash-register text-primary"></i>
                  Journal de Caisse
                </h3>
                <p className="text-muted fs-14 mb-0">
                  Suivi en temps réel des encaissements, décaissements et du solde de caisse
                </p>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant="outline-secondary"
                  className="btn-rounded fs-13 d-flex align-items-center gap-1"
                  onClick={() => setViewMode("categories")}
                >
                  <i className="flaticon-381-settings-1 me-1"></i>
                  Paramètres Catégories
                </Button>

                <Button
                  variant="outline-primary"
                  className="btn-rounded fs-13"
                  onClick={loadCashflowData}
                  disabled={loading}
                  title="Rafraîchir les écritures"
                >
                  <i className={`flaticon-381-refresh me-1 ${loading ? "fa-spin" : ""}`}></i>
                  Actualiser
                </Button>

                <Button
                  variant="primary"
                  className="btn-rounded fs-13 font-w600"
                  onClick={() => handleOpenAdd("RECETTE")}
                  style={{ background: "#111827", borderColor: "#111827" }}
                >
                  <i className="flaticon-381-plus me-1 font-w700"></i>
                  + RECETTE / DÉPENSE
                </Button>
              </div>
            </div>

            {/* KPI CARDS (5 CARTES EN LIGNE COMME DANS LA CAPTURE) */}
            <div className="row mb-3 g-3">
              {/* Carte 1: TOTAL RECETTES ENCAISSÉES */}
              <div className="col-xl col-lg-4 col-sm-6">
                <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
                  <div className="card-body p-3">
                    <span className="text-muted fs-11 text-uppercase font-w700 letter-spacing-1 d-block mb-1">
                      TOTAL RECETTES ENCAISSÉES
                    </span>
                    <h4 className="font-w800 mb-1" style={{ color: "#10b981", fontSize: "20px" }}>
                      +{formatDA(summary.totalRecettes)}
                    </h4>
                    <small className="text-muted fs-12">
                      Recettes globales enregistrées
                    </small>
                  </div>
                </div>
              </div>

              {/* Carte 2: BÉNÉFICE JOURNALIER */}
              <div className="col-xl col-lg-4 col-sm-6">
                <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
                  <div className="card-body p-3">
                    <span className="text-muted fs-11 text-uppercase font-w700 letter-spacing-1 d-block mb-1">
                      BÉNÉFICE JOURNALIER
                    </span>
                    <h4
                      className="font-w800 mb-1"
                      style={{
                        color: summary.beneficeJour >= 0 ? "#10b981" : "#ef4444",
                        fontSize: "20px",
                      }}
                    >
                      {summary.beneficeJour >= 0 ? "+" : ""}
                      {formatDA(summary.beneficeJour)}
                    </h4>
                    <small className="text-muted fs-12">
                      Aujourd'hui ({formatDateFr(new Date().toISOString().split("T")[0])})
                    </small>
                  </div>
                </div>
              </div>

              {/* Carte 3: DÉCAISSEMENTS ACHATS / DÉPENSES */}
              <div className="col-xl col-lg-4 col-sm-6">
                <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
                  <div className="card-body p-3">
                    <span className="text-muted fs-11 text-uppercase font-w700 letter-spacing-1 d-block mb-1">
                      DÉCAISSEMENTS / CHARGES
                    </span>
                    <h4 className="font-w800 mb-1" style={{ color: "#ef4444", fontSize: "20px" }}>
                      -{formatDA(summary.totalDepenses)}
                    </h4>
                    <small className="text-muted fs-12">
                      Charges, fournitures & loyer
                    </small>
                  </div>
                </div>
              </div>

              {/* Carte 4: AUTRES RECETTES / DÉPENSES */}
              <div className="col-xl col-lg-6 col-sm-6">
                <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
                  <div className="card-body p-3">
                    <span className="text-muted fs-11 text-uppercase font-w700 letter-spacing-1 d-block mb-1">
                      ACTIVITÉ DU MOIS
                    </span>
                    <h4
                      className="font-w800 mb-1"
                      style={{
                        color: (summary.monthRecettes - summary.monthDepenses) >= 0 ? "#10b981" : "#ef4444",
                        fontSize: "20px",
                      }}
                    >
                      {(summary.monthRecettes - summary.monthDepenses) >= 0 ? "+" : ""}
                      {formatDA(summary.monthRecettes - summary.monthDepenses)}
                    </h4>
                    <small className="text-muted fs-11">
                      Recettes: +{formatDA(summary.monthRecettes)} | Dépenses: -{formatDA(summary.monthDepenses)}
                    </small>
                  </div>
                </div>
              </div>

              {/* Carte 5: BÉNÉFICE NET / SOLDE CAISSE */}
              <div className="col-xl col-lg-6 col-sm-12">
                <div
                  className="card shadow-sm border-0 h-100"
                  style={{
                    borderRadius: "14px",
                    background: summary.soldeCaisse >= 0 ? "#f0fdf4" : "#fef2f2",
                    border: `1.5px solid ${summary.soldeCaisse >= 0 ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  <div className="card-body p-3">
                    <span className="text-muted fs-11 text-uppercase font-w700 letter-spacing-1 d-block mb-1">
                      BÉNÉFICE NET / SOLDE CAISSE
                    </span>
                    <h4
                      className="font-w800 mb-1"
                      style={{
                        color: summary.soldeCaisse >= 0 ? "#059669" : "#dc2626",
                        fontSize: "22px",
                      }}
                    >
                      {summary.soldeCaisse >= 0 ? "+" : ""}
                      {formatDA(summary.soldeCaisse)}
                    </h4>
                    <small className="text-muted fs-12">
                      Total Encaissé - Total Décaissé
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* CARTE PRINCIPALE : FILTRES & TABLEAU DES ÉCRITURES COMPTABLES */}
            <div className="card shadow-sm border-0" style={{ borderRadius: "14px", height: "auto" }}>
              {/* Barre de Filtres et Recherche intégrée */}
              <div className="card-header border-0 pb-2 pt-3 px-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 w-100">
                  {/* Onglets Filtres */}
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-sm rounded-pill font-w600 px-3"
                      style={{
                        backgroundColor: filterType === "ALL" ? "#2563eb" : "#ffffff",
                        color: filterType === "ALL" ? "#ffffff" : "#475569",
                        border: filterType === "ALL" ? "1.5px solid #2563eb" : "1.5px solid #cbd5e1",
                        boxShadow: filterType === "ALL" ? "0 2px 6px rgba(37, 99, 235, 0.25)" : "none",
                        fontSize: "13px",
                      }}
                      onClick={() => setFilterType("ALL")}
                    >
                      TOUT JOURNAL ({entries.length})
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm rounded-pill font-w600 px-3"
                      style={{
                        backgroundColor: filterType === "RECETTE" ? "#16a34a" : "#ffffff",
                        color: filterType === "RECETTE" ? "#ffffff" : "#475569",
                        border: filterType === "RECETTE" ? "1.5px solid #16a34a" : "1.5px solid #cbd5e1",
                        boxShadow: filterType === "RECETTE" ? "0 2px 6px rgba(22, 163, 74, 0.25)" : "none",
                        fontSize: "13px",
                      }}
                      onClick={() => setFilterType("RECETTE")}
                    >
                      ↓ RECETTES ({recettesCount})
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm rounded-pill font-w600 px-3"
                      style={{
                        backgroundColor: filterType === "DEPENSE" ? "#dc2626" : "#ffffff",
                        color: filterType === "DEPENSE" ? "#ffffff" : "#475569",
                        border: filterType === "DEPENSE" ? "1.5px solid #dc2626" : "1.5px solid #cbd5e1",
                        boxShadow: filterType === "DEPENSE" ? "0 2px 6px rgba(220, 38, 38, 0.25)" : "none",
                        fontSize: "13px",
                      }}
                      onClick={() => setFilterType("DEPENSE")}
                    >
                      ↑ DÉPENSES ({depensesCount})
                    </button>
                  </div>

                  {/* Recherche */}
                  <div style={{ minWidth: "260px", maxWidth: "340px", flex: 1 }}>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white border-end-0">
                        <i className="flaticon-381-search-2 text-muted"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Rechercher par réf, nom, note..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setSearchTerm("")}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu Tableau */}
              <div className="card-body p-0">
                {/* Indicateur de defilement horizontal sur telephone */}
                <div className="d-flex align-items-center justify-content-between p-2 d-md-none text-muted fs-11 border-bottom bg-light">
                  <span><i className="fa fa-list me-1 text-primary"></i>{filteredEntries.length} écriture{filteredEntries.length > 1 ? 's' : ''}</span>
                  <span className="badge badge-sm badge-light text-primary border d-flex align-items-center gap-1 py-1 px-2">
                    <i className="fa fa-arrows-h"></i> Glisser droite / gauche (prix & actions)
                  </span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ width: "100%", minWidth: "540px" }}>
                    <thead className="table-light text-muted fs-11 text-uppercase">
                      <tr>
                        <th style={{ minWidth: "105px", width: "105px" }} className="ps-2 ps-md-4">TYPE</th>
                        <th className="d-none d-md-table-cell">N° COMMANDE / RÉF</th>
                        <th style={{ minWidth: "160px" }}>CLIENT / FOURNISSEUR</th>
                        <th className="d-none d-md-table-cell">CATÉGORIE</th>
                        <th className="d-none d-md-table-cell">NOTE / MOTIF</th>
                        <th className="text-end" style={{ minWidth: "135px" }}>MONTANT</th>
                        <th className="text-center d-none d-md-table-cell">DATE</th>
                        <th className="text-end pe-3 pe-md-4" style={{ minWidth: "95px", width: "95px" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5 text-muted">
                            <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                            Chargement des écritures comptables...
                          </td>
                        </tr>
                      ) : filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5 text-muted">
                            <i className="flaticon-381-folder-1 fs-30 d-block mb-2 text-muted"></i>
                            Aucune écriture comptable trouvée pour ces critères.
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((row) => {
                          const isRecette = row.type === "RECETTE";
                          return (
                            <tr key={row.id}>
                              {/* TYPE */}
                              <td className="ps-2 ps-md-4">
                                <span
                                  className="badge font-w700 px-2 py-1 fs-11"
                                  style={{
                                    backgroundColor: isRecette ? "#047857" : "#b91c1c",
                                    color: "#ffffff",
                                    borderRadius: "4px",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  {isRecette ? "↓ RECETTE" : "↑ DÉPENSE"}
                                </span>
                              </td>

                              {/* N° COMMANDE / RÉF */}
                              <td className="d-none d-md-table-cell">
                                <div className="font-w600 text-dark fs-13 mb-1">
                                  {row.reference}
                                </div>
                                {row.attachmentPath && (
                                  <button
                                    type="button"
                                    className="badge bg-light text-primary border border-primary font-w600 p-1 px-2 border-0"
                                    style={{ background: "#eff6ff", cursor: "pointer" }}
                                    onClick={() =>
                                      setPreviewAttachment({
                                        name: row.attachmentName || row.reference,
                                        path: row.attachmentPath,
                                      })
                                    }
                                  >
                                    <i className="flaticon-381-file me-1"></i>
                                    Justificatif
                                  </button>
                                )}
                              </td>

                              {/* CLIENT / FOURNISSEUR */}
                              <td>
                                <div className="font-w600 text-dark fs-13">
                                  {(row.partyName || "").replace(/\s*\(sc\)/gi, "").trim() || "—"}
                                </div>
                                {row.partyPhone && (
                                  <small className="text-muted d-block fs-11">
                                    <i className="flaticon-381-phone me-1 text-success"></i>
                                    {row.partyPhone}
                                  </small>
                                )}
                                {/* Date et catégorie visibles sur mobile sous le nom */}
                                <div className="d-block d-md-none text-muted fs-11 mt-1">
                                  {formatDateFr(row.entryDate)} • {row.category}
                                </div>
                              </td>

                              {/* CATÉGORIE */}
                              <td className="d-none d-md-table-cell">
                                <span className="font-w500 text-dark fs-13">
                                  {row.category}
                                </span>
                              </td>

                              {/* NOTE / MOTIF */}
                              <td className="d-none d-md-table-cell">
                                <span className="fs-13 text-secondary text-truncate d-inline-block" style={{ maxWidth: "240px" }}>
                                  {row.notes || "—"}
                                </span>
                              </td>

                              {/* MONTANT TOTAL */}
                              <td className="text-end" style={{ minWidth: "135px", whiteSpace: "nowrap" }}>
                                <div
                                  className="font-w800 fs-13 fs-md-14"
                                  style={{ color: isRecette ? "#10b981" : "#ef4444" }}
                                >
                                  {isRecette ? "+" : "-"}
                                  {formatDA(row.amount)}
                                </div>
                                <small className="text-muted fs-11 d-block">
                                  {row.paymentMethod || "Espèces"}
                                </small>
                              </td>

                              {/* DATE */}
                              <td className="text-center fs-12 text-muted font-w500 d-none d-md-table-cell">
                                {formatDateFr(row.entryDate)}
                              </td>

                              {/* ACTIONS */}
                              <td className="text-end pe-3 pe-md-4" style={{ minWidth: "95px", width: "95px", whiteSpace: "nowrap" }}>
                                <div className="d-flex justify-content-end gap-1">
                                  {row.attachmentPath && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-info p-1 px-2 rounded"
                                      title="Voir le justificatif"
                                      onClick={() =>
                                        setPreviewAttachment({
                                          name: row.attachmentName || row.reference,
                                          path: row.attachmentPath,
                                        })
                                      }
                                    >
                                      <i className="flaticon-381-view"></i>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary p-1 px-2 rounded"
                                    title="Modifier cette écriture"
                                    onClick={() => handleOpenEdit(row)}
                                  >
                                    <i className="flaticon-381-edit"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger p-1 px-2 rounded"
                                    title="Supprimer cette écriture"
                                    onClick={() => handleDeleteEntry(row)}
                                  >
                                    <i className="flaticon-381-trash-1"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VUE 2 : PARAMÈTRES DES CATÉGORIES (CAPTURES 4)                            */}
      {/* ========================================================================= */}
      {viewMode === "categories" && (
        <div className="row">
          <div className="col-12">
            {/* EN-TÊTE PAGE CATÉGORIES */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
              <div>
                <h3 className="font-w700 text-dark mb-1">Paramètres des Catégories de Caisse</h3>
                <p className="text-muted fs-14 mb-0">
                  Ajouter, modifier ou supprimer les catégories d'opérations (Recettes et Dépenses)
                </p>
              </div>

              <Button
                variant="outline-dark"
                className="btn-rounded fs-13 font-w600"
                onClick={() => setViewMode("journal")}
              >
                ← Retour au Journal de Caisse
              </Button>
            </div>

            <div className="row g-4">
              {/* COLONNE GAUCHE : CATÉGORIES DE RECETTES */}
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
                  <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
                    <h5 className="font-w700 text-success mb-0 d-flex align-items-center gap-2">
                      <span className="badge bg-success text-white p-1">↓</span>
                      Catégories de Recettes (+ Entrées)
                    </h5>

                  </div>

                  <div className="card-body">
                    {/* Formulaire ajout catégorie recette */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddCategory("RECETTE", newRecetteCategory);
                      }}
                      className="d-flex gap-2 mb-4"
                    >
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nouvelle catégorie de recette..."
                        value={newRecetteCategory}
                        onChange={(e) => setNewRecetteCategory(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary text-nowrap font-w600 px-3"
                        disabled={!newRecetteCategory.trim()}
                      >
                        + Ajouter
                      </button>
                    </form>

                    {/* Liste des catégories de recettes */}
                    <div className="d-flex flex-column gap-2">
                      {categories.recettes?.map((cat) => {
                        const isEditingThis = editingCategoryId === cat.id;
                        return (
                          <div
                            key={cat.id}
                            className="d-flex justify-content-between align-items-center p-3 rounded"
                            style={{
                              background: isEditingThis ? "#ecfdf5" : "#f8fafc",
                              border: isEditingThis ? "1.5px solid #10b981" : "1px solid #e2e8f0",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {isEditingThis ? (
                              <div className="d-flex align-items-center gap-2 flex-grow-1 me-2">
                                <span
                                  style={{
                                    width: "9px",
                                    height: "9px",
                                    borderRadius: "50%",
                                    background: "#10b981",
                                    display: "inline-block",
                                  }}
                                ></span>
                                <input
                                  type="text"
                                  className="form-control form-control-sm font-w600"
                                  style={{ fontSize: "13px" }}
                                  value={editingCategoryName}
                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSaveEditCategory(cat, editingCategoryName);
                                    } else if (e.key === "Escape") {
                                      handleCancelEditCategory();
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  style={{
                                    width: "9px",
                                    height: "9px",
                                    borderRadius: "50%",
                                    background: "#10b981",
                                    display: "inline-block",
                                  }}
                                ></span>
                                <span className="font-w700 text-dark fs-13 text-uppercase">
                                  {cat.name}
                                </span>
                              </div>
                            )}

                            <div className="d-flex gap-1 align-items-center">
                              {isEditingThis ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success p-1 px-2 rounded text-white"
                                    title="Enregistrer la modification"
                                    onClick={() => handleSaveEditCategory(cat, editingCategoryName)}
                                  >
                                    <i className="fa fa-check"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary p-1 px-2 rounded"
                                    title="Annuler"
                                    onClick={handleCancelEditCategory}
                                  >
                                    <i className="fa fa-times"></i>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary p-1 px-2 rounded"
                                    title="Modifier la catégorie"
                                    onClick={() => handleStartEditCategory(cat)}
                                  >
                                    <i className="fa fa-pencil"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger p-1 px-2 rounded"
                                    title="Supprimer la catégorie"
                                    onClick={() => handleDeleteCategory(cat)}
                                  >
                                    <i className="flaticon-381-trash-1"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* COLONNE DROITE : CATÉGORIES DE DÉPENSES */}
              <div className="col-lg-6">
                <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "14px" }}>
                  <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
                    <h5 className="font-w700 text-danger mb-0 d-flex align-items-center gap-2">
                      <span className="badge bg-danger text-white p-1">↑</span>
                      Catégories de Dépenses (- Sorties)
                    </h5>

                  </div>

                  <div className="card-body">
                    {/* Formulaire ajout catégorie dépense */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddCategory("DEPENSE", newDepenseCategory);
                      }}
                      className="d-flex gap-2 mb-4"
                    >
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nouvelle catégorie de dépense..."
                        value={newDepenseCategory}
                        onChange={(e) => setNewDepenseCategory(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-primary text-nowrap font-w600 px-3"
                        disabled={!newDepenseCategory.trim()}
                      >
                        + Ajouter
                      </button>
                    </form>

                    {/* Liste des catégories de dépenses */}
                    <div className="d-flex flex-column gap-2">
                      {categories.depenses?.map((cat) => {
                        const isEditingThis = editingCategoryId === cat.id;
                        return (
                          <div
                            key={cat.id}
                            className="d-flex justify-content-between align-items-center p-3 rounded"
                            style={{
                              background: isEditingThis ? "#fef2f2" : "#f8fafc",
                              border: isEditingThis ? "1.5px solid #ef4444" : "1px solid #e2e8f0",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {isEditingThis ? (
                              <div className="d-flex align-items-center gap-2 flex-grow-1 me-2">
                                <span
                                  style={{
                                    width: "9px",
                                    height: "9px",
                                    borderRadius: "50%",
                                    background: "#ef4444",
                                    display: "inline-block",
                                  }}
                                ></span>
                                <input
                                  type="text"
                                  className="form-control form-control-sm font-w600"
                                  style={{ fontSize: "13px" }}
                                  value={editingCategoryName}
                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSaveEditCategory(cat, editingCategoryName);
                                    } else if (e.key === "Escape") {
                                      handleCancelEditCategory();
                                    }
                                  }}
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <div className="d-flex align-items-center gap-2">
                                <span
                                  style={{
                                    width: "9px",
                                    height: "9px",
                                    borderRadius: "50%",
                                    background: "#ef4444",
                                    display: "inline-block",
                                  }}
                                ></span>
                                <span className="font-w700 text-dark fs-13 text-uppercase">
                                  {cat.name}
                                </span>
                              </div>
                            )}

                            <div className="d-flex gap-1 align-items-center">
                              {isEditingThis ? (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success p-1 px-2 rounded text-white"
                                    title="Enregistrer la modification"
                                    onClick={() => handleSaveEditCategory(cat, editingCategoryName)}
                                  >
                                    <i className="fa fa-check"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary p-1 px-2 rounded"
                                    title="Annuler"
                                    onClick={handleCancelEditCategory}
                                  >
                                    <i className="fa fa-times"></i>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary p-1 px-2 rounded"
                                    title="Modifier la catégorie"
                                    onClick={() => handleStartEditCategory(cat)}
                                  >
                                    <i className="fa fa-pencil"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger p-1 px-2 rounded"
                                    title="Supprimer la catégorie"
                                    onClick={() => handleDeleteCategory(cat)}
                                  >
                                    <i className="flaticon-381-trash-1"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1 : NOUVELLE ÉCRITURE COMPTABLE (RECETTE / DÉPENSE) (CAPTURE 3)    */}
      {/* ========================================================================= */}
      <Modal
        show={showEntryModal}
        onHide={() => setShowEntryModal(false)}
        size="lg"
        centered
        backdrop="static"
      >
        <form onSubmit={handleSaveEntry}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="font-w700 text-dark fs-18">
              {isEditing
                ? "MODIFIER L'ÉCRITURE COMPTABLE"
                : `NOUVELLE ÉCRITURE COMPTABLE (${formEntry.type === "RECETTE" ? "RECETTE" : "DÉPENSE"})`}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="pt-3">
            {/* TOGGLE RECETTE / DÉPENSE */}
            <div className="row g-2 mb-4">
              <div className="col-6">
                <button
                  type="button"
                  className={`btn w-100 py-3 font-w700 fs-14 rounded-3 d-flex align-items-center justify-content-center gap-2 ${
                    formEntry.type === "RECETTE"
                      ? "btn-success text-white shadow-sm"
                      : "btn-outline-secondary"
                  }`}
                  style={formEntry.type === "RECETTE" ? { background: "#059669", borderColor: "#059669" } : {}}
                  onClick={() => setFormEntry({ ...formEntry, type: "RECETTE" })}
                >
                  <i className="flaticon-381-download"></i>
                  ↓ RECETTE (+ ENTRÉE)
                </button>
              </div>

              <div className="col-6">
                <button
                  type="button"
                  className={`btn w-100 py-3 font-w700 fs-14 rounded-3 d-flex align-items-center justify-content-center gap-2 ${
                    formEntry.type === "DEPENSE"
                      ? "btn-danger text-white shadow-sm"
                      : "btn-outline-secondary"
                  }`}
                  style={formEntry.type === "DEPENSE" ? { background: "#dc2626", borderColor: "#dc2626" } : {}}
                  onClick={() => setFormEntry({ ...formEntry, type: "DEPENSE" })}
                >
                  <i className="flaticon-381-upload"></i>
                  ↑ DÉPENSE (- SORTIE)
                </button>
              </div>
            </div>

            {/* CHAMPS MONTANT & DATE */}
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <label className="form-label font-w600 fs-13">
                  MONTANT (DA) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    className="form-control form-control-lg font-w700 text-dark"
                    placeholder="0.00 DA"
                    value={formEntry.amount}
                    onChange={(e) => setFormEntry({ ...formEntry, amount: e.target.value })}
                    required
                  />
                  <span className="input-group-text bg-light font-w700">DA</span>
                </div>
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label font-w600 fs-13">
                  DATE D'OPÉRATION <span className="text-danger">*</span>
                </label>
                <WheelDatePicker
                  className="form-control form-control-lg"
                  value={formEntry.entryDate}
                  onChange={(e) => setFormEntry({ ...formEntry, entryDate: e.target.value })}
                  title="DATE D'OPÉRATION"
                  required
                />
              </div>
            </div>

            {/* CLIENT / FOURNISSEUR & TÉLÉPHONE */}
            <div className="row mb-3">
              <div className="col-md-6 mb-2">
                <label className="form-label font-w600 fs-13">
                  {formEntry.type === "RECETTE" ? "CLIENT / PATIENT (TIERS) *" : "FOURNISSEUR / BÉNÉFICIAIRE (TIERS) *"}
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={
                    formEntry.type === "RECETTE"
                      ? "Ex: Mme Benali Amina (Patient Passager)"
                      : "Ex: Sonelgaz, Algérie Télécom, Pharmacie..."
                  }
                  value={formEntry.partyName}
                  onChange={(e) => setFormEntry({ ...formEntry, partyName: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-6 mb-2">
                <label className="form-label font-w600 fs-13">
                  TÉLÉPHONE (OPTIONNEL)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: 0550123456"
                  value={formEntry.partyPhone}
                  onChange={(e) => setFormEntry({ ...formEntry, partyPhone: e.target.value })}
                />
              </div>
            </div>

            {/* CATÉGORIE & MODE DE RÈGLEMENT */}
            <div className="row mb-3">
              <div className="col-md-7 mb-2">
                <label className="form-label font-w600 fs-13">
                  CATÉGORIE / NATURE DE L'OPÉRATION <span className="text-danger">*</span>
                </label>

                <select
                  className="form-control"
                  value={formEntry.category}
                  onChange={(e) => setFormEntry({ ...formEntry, category: e.target.value })}
                  required
                >
                  {(formEntry.type === "RECETTE" ? categories.recettes : categories.depenses)?.map(
                    (c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    )
                  )}
                  <option value="AUTRE">AUTRE</option>
                </select>
              </div>

              <div className="col-md-5 mb-2">
                <label className="form-label font-w600 fs-13">
                  MODE DE RÈGLEMENT
                </label>
                <select
                  className="form-control"
                  value={formEntry.paymentMethod}
                  onChange={(e) => setFormEntry({ ...formEntry, paymentMethod: e.target.value })}
                >
                  <option value="Espèces">Espèces (Cash)</option>
                  <option value="Virement bancaire">Virement bancaire</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Carte CIB / Edahabia">Carte CIB / Edahabia</option>
                </select>
              </div>
            </div>

            {/* NOTE / MOTIF / DESCRIPTION */}
            <div className="mb-3">
              <label className="form-label font-w600 fs-13">
                NOTE / MOTIF / DESCRIPTION
              </label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Description détaillée de l'opération (ex: Consultation + Échographie T1, Facture internet fibre, etc.)..."
                value={formEntry.notes}
                onChange={(e) => setFormEntry({ ...formEntry, notes: e.target.value })}
              ></textarea>
            </div>

            {/* PIÈCE JOINTE / JUSTIFICATIF */}
            <div className="mb-2">
              <label className="form-label font-w600 fs-13">
                PIÈCE JOINTE / JUSTIFICATIF (FACTURE, REÇU, BON DE CAISSE)
              </label>

              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />

              {formEntry.attachmentPath ? (
                <div
                  className="d-flex align-items-center justify-content-between p-3 rounded"
                  style={{ background: "#f0fdf4", border: "1px dashed #10b981" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <i className="flaticon-381-file-1 fs-20 text-success"></i>
                    <div>
                      <strong className="d-block fs-13 text-dark">
                        {formEntry.attachmentName || "Justificatif_joint"}
                      </strong>
                      <small className="text-muted fs-11">Fichier prêt à être enregistré</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleRemoveAttachment}
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <div
                  className="p-4 text-center rounded"
                  style={{
                    border: "2px dashed #cbd5e1",
                    background: "#f8fafc",
                    cursor: "pointer",
                  }}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <i className="flaticon-381-upload fs-24 text-primary d-block mb-1"></i>
                  <span className="font-w600 text-dark fs-13">
                    Choisir un fichier depuis cet appareil (Photo, PDF, Facture)
                  </span>
                  <small className="text-muted d-block fs-11 mt-1">
                    Glisser-déposer ou cliquer pour sélectionner un document
                  </small>
                </div>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="outline-secondary"
              className="btn-rounded px-4"
              onClick={() => setShowEntryModal(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              type="submit"
              className="btn-rounded px-4 font-w600"
              style={{ background: "#111827", borderColor: "#111827" }}
            >
              {isEditing ? "Enregistrer les modifications" : "Enregistrer Écriture"}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2 : PRÉVISUALISATION DU JUSTIFICATIF                              */}
      {/* ========================================================================= */}
      <Modal
        show={!!previewAttachment}
        onHide={() => setPreviewAttachment(null)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="fs-16 font-w700">
            Justificatif : {previewAttachment?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-3">
          {previewAttachment?.path && previewAttachment.path.startsWith("data:application/pdf") ? (
            <iframe
              src={previewAttachment.path}
              title="Aperçu PDF"
              width="100%"
              height="550px"
              style={{ border: "none" }}
            ></iframe>
          ) : (
            <img
              src={previewAttachment?.path}
              alt="Justificatif"
              style={{ maxWidth: "100%", maxHeight: "550px", objectFit: "contain" }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setPreviewAttachment(null)}>
            Fermer
          </Button>
          {previewAttachment?.path && (
            <a
              href={previewAttachment.path}
              download={previewAttachment.name || "justificatif"}
              className="btn btn-primary"
            >
              Télécharger
            </a>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CashflowPage;
