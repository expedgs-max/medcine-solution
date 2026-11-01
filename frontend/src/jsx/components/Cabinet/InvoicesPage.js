import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import { WheelDatePickerModal } from "./WheelDatePicker";
import ApiService from "../../../services/ApiService";
import {
  initialDoctor,
  initialPatients,
  initialInvoices,
} from "../../../services/CabinetData";
import qrPortalImg from "../../../images/qr-portal.png";

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const [formInvoice, setFormInvoice] = useState({
    patientId: "",
    actDescription: "Consultation de médecine générale",
    amount: 2500,
  });

  // Chargement des factures et patients depuis MySQL
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [invData, patData] = await Promise.all([
          ApiService.getInvoices(),
          ApiService.getPatients(),
        ]);
        if (Array.isArray(invData) && invData.length > 0) {
          setInvoices(invData);
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
            setFormInvoice((prev) => ({ ...prev, patientId: clean[0].id }));
          }
        }
      } catch (err) {
        console.warn("Erreur chargement factures MySQL :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const cleanPatientName = (name) => {
    if (!name) return "Patiente De Passage";
    const cleaned = name.replace(/\s*\(sc\)/gi, "").replace(/sans compte/gi, "").trim();
    if (!cleaned || cleaned.toLowerCase() === "patient" || cleaned.toLowerCase() === "patiente") {
      return "Patiente De Passage";
    }
    return cleaned;
  };

  const getPatientPassword = (inv) => {
    if (!inv || inv.isGuest || !inv.patientId) return "";
    if (inv.patientName && (inv.patientName.includes('(sc)') || inv.patientName.toLowerCase().includes('sans compte'))) return "";
    if (inv.patientPassword) return inv.patientPassword;
    const pat = patients.find((p) => p.id === inv.patientId);
    if (pat?.password) return pat.password;
    if (pat) {
      const l = (pat.lastName || "").trim().charAt(0).toLowerCase() || "p";
      const f = (pat.firstName || "").trim().charAt(0).toLowerCase() || "a";
      const digits = (pat.phone || "").replace(/\D/g, "");
      const d3 = digits.length >= 3 ? digits.slice(-3) : digits.padStart(3, "0");
      return `${l}${f}${d3}`;
    }
    const nameParts = (inv.patientName || "").trim().split(" ");
    const l = nameParts[0]?.charAt(0).toLowerCase() || "p";
    const f = nameParts[1]?.charAt(0).toLowerCase() || "a";
    const phoneDigits = (inv.patientPhone || "").replace(/\D/g, "");
    const d3 = phoneDigits.length >= 3 ? phoneDigits.slice(-3) : "123";
    return `${l}${f}${d3}`;
  };

  const handleActChange = (act) => {
    switch (act) {
      case "G":
        setFormInvoice({
          ...formInvoice,
          actDescription: "Consultation de médecine générale",
          amount: 2500,
        });
        break;
      case "G_MEG":
        setFormInvoice({
          ...formInvoice,
          actDescription: "Consultation Enfant / Pédiatrie",
          amount: 3000,
        });
        break;
      case "G_ECG":
        setFormInvoice({
          ...formInvoice,
          actDescription: "Consultation avec Électrocardiogramme (ECG)",
          amount: 3500,
        });
        break;
      case "VISITE":
        setFormInvoice({
          ...formInvoice,
          actDescription: "Visite médicale à domicile",
          amount: 3500,
        });
        break;
      default:
        break;
    }
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    const pat =
      patients.find((p) => p.id === parseInt(formInvoice.patientId)) ||
      patients[0] || { id: 1, firstName: "Patient", lastName: "" };

    const newInv = {
      id: invoices.length + 1,
      invoiceNumber: `FAC-2024-025${invoices.length + 2}`,
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`.trim(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      actDescription: formInvoice.actDescription,
      amount: parseFloat(formInvoice.amount),
    };

    setInvoices([newInv, ...invoices]);
    setShowNewModal(false);

    try {
      await ApiService.saveInvoice({
        patientId: pat.id,
        invoiceNumber: newInv.invoiceNumber,
        date: newInv.date,
        actDescription: newInv.actDescription,
        amount: newInv.amount,
        status: "Payée",
      });
    } catch (err) {
      console.warn("Erreur synchronisation facture MySQL :", err);
    }

    Swal.fire({
      icon: "success",
      title: "Facture enregistrée avec succès",
      text: `Facture #${newInv.invoiceNumber} enregistrée pour ${newInv.patientName}.`,
      confirmButtonColor: "#1e60d5",
    });
  };

  // Helpers de date & navigation par jour
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  })();

  const formatDateFr = (dateStr) => {
    if (!dateStr) return "";
    const clean = String(dateStr).trim().split("T")[0].split(" ")[0];
    const parts = clean.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getInvDateStr = (inv) => {
    if (!inv || !inv.date) return "";
    return String(inv.date).trim().split("T")[0].split(" ")[0];
  };

  const handlePrevDay = () => {
    const base = selectedDate ? new Date(selectedDate) : new Date(todayStr);
    base.setDate(base.getDate() - 1);
    const year = base.getFullYear();
    const month = String(base.getMonth() + 1).padStart(2, "0");
    const day = String(base.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const base = selectedDate ? new Date(selectedDate) : new Date(todayStr);
    base.setDate(base.getDate() + 1);
    const year = base.getFullYear();
    const month = String(base.getMonth() + 1).padStart(2, "0");
    const day = String(base.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Caisse Aujourd'hui (fixe et toujours calculée pour aujourd'hui)
  const todayInvoices = invoices.filter((inv) => getInvDateStr(inv) === todayStr);
  const todayRevenue = todayInvoices.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const todayCount = todayInvoices.length;

  // Factures selon la date sélectionnée (ou toutes si aucune date sélectionnée)
  const dateFilteredInvoices = selectedDate
    ? invoices.filter((inv) => getInvDateStr(inv) === selectedDate)
    : invoices;

  const currentTotal = dateFilteredInvoices.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const currentCount = dateFilteredInvoices.length;
  const currentAvg = Math.round(currentTotal / (currentCount || 1));

  // Filtrage final avec recherche texte
  const filteredInvoices = dateFilteredInvoices.filter((inv) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      (inv.patientName || "").toLowerCase().includes(search) ||
      (inv.invoiceNumber || "").toLowerCase().includes(search) ||
      (inv.actDescription || "").toLowerCase().includes(search)
    );
  });

  return (
    <>
      <PageTitle motherMenu="Gestion administrative" activeMenu="Factures" />

      {/* Barre d'action supérieure avec Recherche et Sélecteur Voir par Jour */}
      <div className="form-head d-flex mb-3 mb-md-4 align-items-center flex-wrap justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Recherche */}
          <div className="input-group search-area" style={{ width: "auto", minWidth: "250px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher facture, patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="input-group-text">
              <i className="flaticon-381-search-2"></i>
            </span>
          </div>

          {/* Outil "Voir par jour" & navigation de date */}
          <div className="d-flex align-items-center bg-white border rounded-3 p-1 gap-1 shadow-sm flex-wrap">
            <button
              type="button"
              className={`btn btn-xs ${!selectedDate ? "btn-primary" : "btn-light"}`}
              onClick={() => setSelectedDate("")}
              style={{ fontWeight: "600", borderRadius: "6px" }}
              title="Afficher toutes les factures"
            >
              Toutes les dates
            </button>
            <button
              type="button"
              className={`btn btn-xs ${selectedDate === todayStr ? "btn-success text-white" : "btn-light"}`}
              onClick={() => setSelectedDate(todayStr)}
              style={{ fontWeight: "600", borderRadius: "6px" }}
              title="Voir la caisse et factures d'aujourd'hui"
            >
              <i className="fa fa-calendar-day me-1"></i> Aujourd'hui
            </button>
            <div className="vr my-1 mx-1 d-none d-sm-block" style={{ opacity: 0.2 }}></div>
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-xs btn-light px-2"
                onClick={handlePrevDay}
                title="Jour précédent"
                style={{ borderRadius: "6px" }}
              >
                <i className="fa fa-chevron-left fs-11"></i>
              </button>
              <button
                type="button"
                className="btn btn-xs btn-light px-2 d-flex align-items-center gap-1 border"
                style={{
                  height: "30px",
                  fontSize: "12px",
                  fontWeight: "600",
                  borderRadius: "6px",
                  backgroundColor: selectedDate ? "rgba(30, 96, 213, 0.08)" : "#f8fafc",
                  color: selectedDate ? "#1e60d5" : "#334155",
                  borderColor: selectedDate ? "#1e60d5" : "#e2e8f0",
                }}
                onClick={() => setShowDatePickerModal(true)}
                title="Sélectionner une date avec la roue calendrier"
              >
                <i className="fa fa-calendar-alt text-primary"></i>
                <span>{selectedDate ? formatDateFr(selectedDate) : "Choisir date"}</span>
              </button>
              <WheelDatePickerModal
                isOpen={showDatePickerModal}
                onClose={() => setShowDatePickerModal(false)}
                initialDate={selectedDate || todayStr}
                onConfirm={(newDate) => setSelectedDate(newDate)}
                title="SÉLECTIONNER LE JOUR"
              />
              <button
                type="button"
                className="btn btn-xs btn-light px-2"
                onClick={handleNextDay}
                title="Jour suivant"
                style={{ borderRadius: "6px" }}
              >
                <i className="fa fa-chevron-right fs-11"></i>
              </button>
              {selectedDate && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline-danger px-2 ms-1"
                  onClick={() => setSelectedDate("")}
                  title="Effacer le filtre et voir toutes les dates"
                  style={{ borderRadius: "6px" }}
                >
                  <i className="fa fa-times"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          className="btn-rounded ms-auto"
          onClick={() => setShowNewModal(true)}
        >
          <i className="flaticon-381-add-1 me-2"></i> Émettre une Facture
        </Button>
      </div>

      {/* Cartes métriques de facturation & Total Caisse Aujourd'hui */}
      <div className="row">
        {/* Carte 1 : Total Caisse Aujourd'hui */}
        <div className="col-xl-3 col-sm-6">
          <div
            className="card widget-stat"
            onClick={() => setSelectedDate(todayStr)}
            style={{
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              border: selectedDate === todayStr ? "2px solid #10b981" : "none",
            }}
            title="Cliquer pour afficher les factures d'aujourd'hui"
          >
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm">
                  <i className="flaticon-381-calendar-1 fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">Caisse Aujourd'hui</p>
                  <h3 className="text-success font-w700 mb-0">
                    {todayRevenue.toLocaleString("fr-DZ")} DA
                  </h3>
                  <small className="text-muted font-w500">
                    {todayCount} acte{todayCount > 1 ? "s" : ""} encaissé{todayCount > 1 ? "s" : ""}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte 2 : Total Facturé / Caisse du jour sélectionné */}
        <div className="col-xl-3 col-sm-6">
          <div
            className="card widget-stat"
            onClick={() => selectedDate ? setSelectedDate("") : null}
            style={{
              cursor: selectedDate ? "pointer" : "default",
              border: !selectedDate ? "2px solid #1e60d5" : "none",
            }}
            title={selectedDate ? "Cliquer pour réafficher le total global" : ""}
          >
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm">
                  <i className="flaticon-381-calculator fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted font-w600">
                    {selectedDate ? (selectedDate === todayStr ? "Total Aujourd'hui" : `Caisse du ${formatDateFr(selectedDate)}`) : "Total Facturé"}
                  </p>
                  <h3 className="text-primary font-w700 mb-0">
                    {currentTotal.toLocaleString("fr-DZ")} DA
                  </h3>
                  <small className="text-muted">
                    {currentCount} facture{currentCount > 1 ? "s" : ""} {selectedDate ? "ce jour" : "au total"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte 3 : Nombre d'actes */}
        <div className="col-xl-3 col-sm-6">
          <div className="card widget-stat">
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-warning text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm">
                  <i className="flaticon-381-notepad-1 fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted font-w600">
                    {selectedDate ? "Actes du jour" : "Nombre d'actes"}
                  </p>
                  <h3 className="text-warning font-w700 mb-0">{currentCount}</h3>
                  <small className="text-muted">
                    {selectedDate ? "Actes enregistrés ce jour" : "Actes médicaux enregistrés"}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carte 4 : Moyenne par acte */}
        <div className="col-xl-3 col-sm-6">
          <div className="card widget-stat">
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-info text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm">
                  <i className="flaticon-381-diamond fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted font-w600">Moyenne par acte</p>
                  <h3 className="text-info font-w700 mb-0">
                    {currentAvg.toLocaleString("fr-DZ")} DA
                  </h3>
                  <small className="text-muted">Montant moyen facturé</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="card">
        <div className="card-header border-0 pb-0">
          <div>
            <h4 className="card-title">Factures & Feuilles de Soins Électroniques</h4>
            <p className="text-muted fs-13 mb-0">
              Cabinet Médical de Gynécologie Obstétrique • Dr N. BELBACHIR OULD HENNIA
            </p>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th className="d-none d-md-table-cell"><strong>N° FACTURE</strong></th>
                  <th style={{ minWidth: "85px" }}><strong>DATE</strong></th>
                  <th><strong>PATIENT</strong></th>
                  <th className="d-none d-md-table-cell"><strong>ACTE MÉDICAL</strong></th>
                  <th style={{ minWidth: "80px" }}><strong>MONTANT</strong></th>
                  <th className="text-end" style={{ width: "95px" }}><strong>ACTIONS</strong></th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      Aucune facture trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="d-none d-md-table-cell">
                        <strong className="text-primary">{inv.invoiceNumber}</strong>
                      </td>
                      <td>
                        <span className="text-dark font-w500">{inv.date}</span>
                        <small className="text-muted d-block">🕒 {inv.time || "10:30"}</small>
                      </td>
                      <td>
                        {inv.isGuest || !inv.patientId || String(inv.patientName || "").toLowerCase().includes("(sc)") ? (
                          <span className="font-w600 text-dark">
                            {cleanPatientName(inv.patientName)}
                          </span>
                        ) : (
                          <Link
                            to={`/admin/patient-details?id=${inv.patientId}`}
                            className="font-w600 text-dark hover-primary"
                          >
                            {cleanPatientName(inv.patientName)}
                          </Link>
                        )}
                        {/* Numéro de facture visible sur mobile sous le patient */}
                        <div className="d-block d-md-none text-muted fs-11 mt-1">
                          {inv.invoiceNumber}
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="text-dark fs-13">{inv.actDescription}</span>
                      </td>
                      <td>
                        <strong className="text-success fs-13 fs-md-15">{inv.amount.toLocaleString("fr-DZ")} DA</strong>
                      </td>
                      <td style={{ width: "95px", whiteSpace: "nowrap" }} className="text-end pe-0">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-xs"
                          onClick={() => setPreviewInvoice(inv)}
                          title="Imprimer / Voir la facture"
                        >
                          <i className="flaticon-381-print me-1"></i>
                          <span className="d-none d-sm-inline">Facture</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Nouvelle Facture */}
      <Modal show={showNewModal} onHide={() => setShowNewModal(false)} size="lg" centered>
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="flaticon-381-calculator me-2 text-primary"></i>
            Émettre une Facture d'Honoraires Médicaux
          </h5>
          <button type="button" className="btn-close" onClick={() => setShowNewModal(false)}></button>
        </div>
        <form onSubmit={handleSaveInvoice}>
          <div className="modal-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label font-w600">Patient *</label>
                <select
                  className="form-control"
                  value={formInvoice.patientId}
                  onChange={(e) =>
                    setFormInvoice({ ...formInvoice, patientId: e.target.value })
                  }
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {(p.lastName || "").toUpperCase()} {p.firstName || ""} ({p.fileNumber || ""})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label font-w600">Acte standardisé</label>
                <select
                  className="form-control"
                  onChange={(e) => handleActChange(e.target.value)}
                  defaultValue="G"
                >
                  <option value="G">Consultation médecine générale (2 500 DA)</option>
                  <option value="G_MEG">Consultation enfant / pédiatrie (3 000 DA)</option>
                  <option value="G_ECG">Consultation + Électrocardiogramme (3 500 DA)</option>
                  <option value="VISITE">Visite médicale à domicile (3 500 DA)</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label font-w600">Libellé de l'acte</label>
              <input
                type="text"
                className="form-control"
                value={formInvoice.actDescription}
                onChange={(e) =>
                  setFormInvoice({ ...formInvoice, actDescription: e.target.value })
                }
                required
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <label className="form-label font-w600">Montant total (DA) *</label>
                <input
                  type="number"
                  step="1"
                  className="form-control"
                  value={formInvoice.amount}
                  onChange={(e) =>
                    setFormInvoice({ ...formInvoice, amount: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="danger" light onClick={() => setShowNewModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Enregistrer la facture
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Aperçu & Impression Facture Format Ticket 80 mm */}
      <Modal
        show={!!previewInvoice}
        onHide={() => setPreviewInvoice(null)}
        centered
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
            #simple-invoice-printable,
            #simple-invoice-printable * {
              visibility: visible !important;
            }
            #simple-invoice-printable {
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
        <div className="modal-header py-2 px-3">
          <h5 className="modal-title font-w600 fs-16">Facture (Format Ticket 80 mm)</h5>
          <button type="button" className="btn-close" onClick={() => setPreviewInvoice(null)}></button>
        </div>
        <div className="modal-body p-3 d-flex justify-content-center" style={{ backgroundColor: "#f8fafc" }}>
          {previewInvoice && (
            <div
              id="simple-invoice-printable"
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
                  {initialDoctor.name || "Dr N. BELBACHIR OULD HENNIA"}
                </h5>
                <div className="text-primary font-w600" style={{ fontSize: "12px" }}>
                  {initialDoctor.title || "Cabinet Médical de Gynécologie Obstétrique"}
                </div>
                <div className="text-muted" style={{ fontSize: "11px", marginTop: "2px" }}>
                  Tél: {initialDoctor.phone || "0560 06 74 66"} • Oran
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
                    {cleanPatientName(previewInvoice.patientName)}
                  </strong>
                </div>
              </div>

              {/* 3. TYPE DE CONSULTATION */}
              <div className="py-2 mb-2" style={{ borderBottom: "1px dashed #cbd5e1" }}>
                <span className="text-muted d-block text-uppercase" style={{ fontSize: "11px", fontWeight: "600" }}>
                  Type de consultation
                </span>
                <div className="text-dark font-w600 mt-1" style={{ fontSize: "13px" }}>
                  {previewInvoice.actDescription || "Consultation Médicale"}
                </div>
              </div>

              {/* 4. LE PRIX (MONTANT) */}
              <div className="py-3 text-center mb-2" style={{ borderBottom: "1px dashed #cbd5e1", backgroundColor: "#f0fdf4", borderRadius: "6px" }}>
                <span className="text-muted text-uppercase d-block" style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" }}>
                  Total à payer
                </span>
                <div className="font-w800 mt-1" style={{ fontSize: "24px", color: "#059669", letterSpacing: "0.5px" }}>
                  {previewInvoice.amount ? previewInvoice.amount.toLocaleString("fr-DZ") : "0"} DA
                </div>
              </div>

              {/* 5. CODE QR & ACCÈS PORTAIL */}
              <div className="pt-2 text-center">
                <div
                  style={{
                    background: "#ffffff",
                    padding: "6px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    display: "inline-block",
                  }}
                >
                  <img
                    src={qrPortalImg}
                    alt="Code QR Portail Patient"
                    style={{
                      width: "88px",
                      height: "88px",
                      display: "block",
                    }}
                  />
                </div>
                <div className="mt-1 font-w600 text-primary" style={{ fontSize: "11px" }}>
                  Scanner le Code QR
                </div>
                <div className="text-muted" style={{ fontSize: "10px" }}>
                  Accès au portail patient en ligne
                </div>

                {getPatientPassword(previewInvoice) && (
                  <div className="mt-2 p-1 px-2 rounded bg-light d-inline-block border" style={{ fontSize: "11px" }}>
                    <span className="text-muted">Code d'accès : </span>
                    <strong className="text-dark font-monospace">{getPatientPassword(previewInvoice)}</strong>
                  </div>
                )}
              </div>

              {/* PIED DE TICKET */}
              <div className="text-center mt-3 pt-2 text-muted" style={{ borderTop: "1px dashed #cbd5e1", fontSize: "10px" }}>
                Merci pour votre confiance • Bon rétablissement
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer py-2 px-3">
          <Button variant="secondary" size="sm" onClick={() => setPreviewInvoice(null)}>
            Fermer
          </Button>
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            <i className="flaticon-381-print me-1"></i> Imprimer Ticket 80mm
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default InvoicesPage;
