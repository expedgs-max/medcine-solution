import React, { useState, useEffect } from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";
import {
  initialPayments,
  initialPatients,
  initialDoctor,
} from "../../../services/CabinetData";

const PaymentsPage = () => {
  const [payments, setPayments] = useState(initialPayments);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [methodFilter, setMethodFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const [formPayment, setFormPayment] = useState({
    patientId: "",
    invoiceNumber: "FAC-2024-0250",
    amount: 2500,
    method: "Espèces",
    operator: initialDoctor.name,
    notes: "",
  });

  // Chargement des règlements depuis MySQL
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [payData, patData] = await Promise.all([
          ApiService.getPayments(),
          ApiService.getPatients(),
        ]);
        if (Array.isArray(payData) && payData.length > 0) {
          setPayments(payData);
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
            setFormPayment((prev) => ({ ...prev, patientId: clean[0].id }));
          }
        }
      } catch (err) {
        console.warn("Erreur chargement règlements MySQL :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getPatientPassword = (item) => {
    if (!item) return "";
    const pat = patients.find(
      (p) =>
        p.id === item.patientId ||
        `${p.firstName} ${p.lastName}`.trim().toLowerCase() ===
          (item.patientName || "").trim().toLowerCase()
    );
    if (pat?.password) return pat.password;
    if (pat) {
      const l = (pat.lastName || "").trim().charAt(0).toLowerCase() || "p";
      const f = (pat.firstName || "").trim().charAt(0).toLowerCase() || "a";
      const digits = (pat.phone || "").replace(/\D/g, "");
      const d3 = digits.length >= 3 ? digits.slice(-3) : digits.padStart(3, "0");
      return `${l}${f}${d3}`;
    }
    const nameParts = (item.patientName || "").trim().split(" ");
    const l = nameParts[0]?.charAt(0).toLowerCase() || "p";
    const f = nameParts[1]?.charAt(0).toLowerCase() || "a";
    return `${l}${f}123`;
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    const pat =
      patients.find((p) => p.id === parseInt(formPayment.patientId)) ||
      patients[0] || { id: 1, firstName: "Patient", lastName: "" };
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const created = {
      id: payments.length + 1,
      date: now.toISOString().split("T")[0],
      time: timeStr,
      receiptNumber: `REC-2024-018${payments.length + 3}`,
      patientName: `${pat.firstName} ${pat.lastName}`.trim(),
      invoiceNumber: formPayment.invoiceNumber,
      amount: parseFloat(formPayment.amount),
      method: formPayment.method,
      operator: formPayment.operator,
      status: "Encaissé",
    };

    setPayments([created, ...payments]);
    setShowAddModal(false);

    try {
      await ApiService.savePayment({
        patientName: created.patientName,
        invoiceNumber: created.invoiceNumber,
        receiptNumber: created.receiptNumber,
        date: created.date,
        time: created.time,
        amount: created.amount,
        method: created.method,
        operator: created.operator,
        status: "Encaissé",
      });
    } catch (err) {
      console.warn("Erreur synchronisation règlement MySQL :", err);
    }

    Swal.fire({
      icon: "success",
      title: "Règlement enregistré !",
      text: `Reçu #${created.receiptNumber} généré (${created.amount.toLocaleString("fr-DZ")} DA).`,
      confirmButtonColor: "#1e60d5",
    });
  };

  const filteredPayments = payments.filter((p) => {
    if (methodFilter === "all") return true;
    return p.method.includes(methodFilter);
  });

  // Totaux de caisse
  const totalCaisseJour = payments.reduce((acc, curr) => acc + curr.amount, 0);
  const totalCb = payments
    .filter((p) => p.method.includes("Carte"))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalEspeces = payments
    .filter((p) => p.method.includes("Espèces"))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalCheques = payments
    .filter((p) => p.method.includes("Chèque"))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <>
      <PageTitle motherMenu="Gestion administrative" activeMenu="Paiements / Caisse" />

      {/* Barre d'action supérieure */}
      <div className="form-head d-flex mb-3 mb-md-4 align-items-center flex-wrap justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="text-muted fs-13 d-none d-sm-inline">Filtrer par mode :</span>
          <select
            className="form-control default-select" style={{ width: "auto", minWidth: "210px" }}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="all">Tous les modes de paiement</option>
            <option value="Carte">Carte Bancaire</option>
            <option value="Espèces">Espèces</option>
            <option value="Chèque">Chèque</option>
            <option value="Tiers-Payant">Tiers-Payant CPAM</option>
          </select>
        </div>

        <Button
          variant="primary"
          className="btn-rounded ms-auto"
          onClick={() => setShowAddModal(true)}
        >
          <i className="flaticon-381-add-1 me-2"></i> Encaisser un Règlement
        </Button>
      </div>

      {/* Cartes récapitulatives de Caisse */}
      <div className="row">
        <div className="col-xl-3 col-sm-6">
          <div className="card widget-stat">
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-success text-white rounded-circle d-flex align-items-center justify-content-center">
                  <i className="flaticon-381-diamond fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">Total Caisse du Jour</p>
                  <h3 className="text-success font-w600 mb-0">{totalCaisseJour.toLocaleString("fr-DZ")} DA</h3>
                  <small className="text-muted">Tous règlements</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-sm-6">
          <div className="card widget-stat">
            <div className="card-body p-4">
              <div className="media align-items-center">
                <span className="me-3 icon-bx-lg bg-primary text-white rounded-circle d-flex align-items-center justify-content-center">
                  <i className="flaticon-381-credit-card fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">Cartes Bancaires (TPE / CIB)</p>
                  <h3 className="text-primary font-w600 mb-0">{totalCb.toLocaleString("fr-DZ")} DA</h3>
                  <small className="text-muted">Télécollecte bancaire</small>
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
                  <i className="flaticon-381-box fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">Espèces en Tiroir</p>
                  <h3 className="text-info font-w600 mb-0">{totalEspeces.toLocaleString("fr-DZ")} DA</h3>
                  <small className="text-muted">Caisse physique</small>
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
                  <i className="flaticon-381-notepad fs-24"></i>
                </span>
                <div className="media-body text-end">
                  <p className="mb-1 text-muted">Chèques à déposer</p>
                  <h3 className="text-warning font-w600 mb-0">{totalCheques.toLocaleString("fr-DZ")} DA</h3>
                  <small className="text-muted">Bordereau prêt</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journal des encaissements */}
      <div className="card">
        <div className="card-header border-0 pb-0">
          <div>
            <h4 className="card-title">Journal Quotidien des Encaissements</h4>
            <p className="text-muted fs-13 mb-0">
              Traçabilité financière du cabinet conforme aux exigences comptables
            </p>
          </div>
        </div>
        <div className="card-body">
          {/* Indicateur de defilement horizontal sur telephone */}
          <div className="d-flex align-items-center justify-content-between mb-2 d-md-none text-muted fs-11 px-1">
            <span><i className="fa fa-list me-1 text-primary"></i>{filteredPayments.length} encaissement{filteredPayments.length > 1 ? 's' : ''}</span>
            <span className="badge badge-sm badge-light text-primary border d-flex align-items-center gap-1 py-1 px-2">
              <i className="fa fa-arrows-h"></i> Glisser droite / gauche (prix & actions)
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-hover" style={{ width: "100%", minWidth: "560px" }}>
              <thead>
                <tr>
                  <th className="d-none d-md-table-cell"><strong>N° REÇU</strong></th>
                  <th style={{ minWidth: "110px" }}><strong>DATE & HEURE</strong></th>
                  <th style={{ minWidth: "150px" }}><strong>PATIENT</strong></th>
                  <th className="d-none d-md-table-cell"><strong>RÉF. FACTURE</strong></th>
                  <th className="text-end" style={{ minWidth: "120px" }}><strong>MONTANT</strong></th>
                  <th className="d-none d-md-table-cell"><strong>MODE DE RÈGLEMENT</strong></th>
                  <th className="d-none d-md-table-cell"><strong>OPÉRATEUR</strong></th>
                  <th className="d-none d-md-table-cell"><strong>STATUT</strong></th>
                  <th className="text-end pe-3" style={{ minWidth: "90px" }}><strong>ACTION</strong></th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-5 text-muted">
                      Aucun encaissement enregistré.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id}>
                      <td className="d-none d-md-table-cell">
                        <strong className="text-primary">{pay.receiptNumber}</strong>
                      </td>
                      <td>
                        <div>{pay.date}</div>
                        <small className="text-muted fs-11">à {pay.time}</small>
                        <div className="d-block d-md-none mt-1">
                          <span className="badge badge-xs badge-light border text-primary">{pay.receiptNumber}</span>
                        </div>
                      </td>
                      <td>
                        <strong className="text-dark d-block">{pay.patientName}</strong>
                        <div className="d-block d-md-none mt-1">
                          <span className="badge badge-xs badge-primary light me-1">{pay.method}</span>
                          <span className="text-muted fs-11">{pay.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="badge badge-light border">{pay.invoiceNumber}</span>
                      </td>
                      <td>
                        <strong className="text-success fs-14">{pay.amount.toLocaleString("fr-DZ")} DA</strong>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="badge badge-primary light">{pay.method}</span>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="text-muted fs-13">{pay.operator}</span>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <Badge bg="success" className="light">{pay.status}</Badge>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-primary btn-xs"
                          onClick={() => setPreviewReceipt(pay)}
                          title="Imprimer le reçu"
                        >
                          <i className="flaticon-381-print me-1"></i> Reçu
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

      {/* Modal Encaisser un règlement */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="flaticon-381-diamond me-2 text-primary"></i>
            Enregistrer un Règlement
          </h5>
          <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
        </div>
        <form onSubmit={handleSavePayment}>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label font-w600">Patient *</label>
              <select
                className="form-control"
                value={formPayment.patientId}
                onChange={(e) =>
                  setFormPayment({ ...formPayment, patientId: e.target.value })
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

            <div className="mb-3">
              <label className="form-label font-w600">Réf. Facture / Acte</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: FAC-2024-0250"
                value={formPayment.invoiceNumber}
                onChange={(e) =>
                  setFormPayment({ ...formPayment, invoiceNumber: e.target.value })
                }
                required
              />
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label font-w600">Montant versé (DA) *</label>
                <input
                  type="number"
                  step="1"
                  className="form-control"
                  value={formPayment.amount}
                  onChange={(e) =>
                    setFormPayment({ ...formPayment, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label font-w600">Mode de paiement *</label>
                <select
                  className="form-control"
                  value={formPayment.method}
                  onChange={(e) =>
                    setFormPayment({ ...formPayment, method: e.target.value })
                  }
                >
                  <option value="Carte Bancaire">Carte Bancaire (TPE)</option>
                  <option value="Espèces">Espèces</option>
                  <option value="Chèque">Chèque</option>
                  <option value="Tiers-Payant CPAM">Tiers-Payant CPAM</option>
                  <option value="Virement bancaire">Virement bancaire</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label font-w600">Encaissé par (Opérateur)</label>
              <select
                className="form-control"
                value={formPayment.operator}
                onChange={(e) =>
                  setFormPayment({ ...formPayment, operator: e.target.value })
                }
              >
                <option value="Sophie Vasseur">Sophie Vasseur (Secrétaire)</option>
                <option value={initialDoctor.name}>{initialDoctor.name} (Médecin)</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="danger" light onClick={() => setShowAddModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Valider l'encaissement
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Reçu de Paiement Imprimable */}
      <Modal
        show={!!previewReceipt}
        onHide={() => setPreviewReceipt(null)}
        centered
      >
        <div className="modal-header">
          <h5 className="modal-title">Reçu de Paiement Patient</h5>
          <button type="button" className="btn-close" onClick={() => setPreviewReceipt(null)}></button>
        </div>
        <div className="modal-body p-4 bg-light">
          {previewReceipt && (
            <div className="p-4 bg-white border rounded text-center">
              <h5 className="text-primary font-w600 mb-1">{initialDoctor.address}</h5>
              <p className="text-muted fs-12 mb-3">{initialDoctor.name} • {initialDoctor.specialty}</p>
              <div className="badge badge-success mb-3">PAIEMENT ACQUITTÉ</div>
              <h2 className="text-dark font-w700 mb-2">{previewReceipt.amount.toLocaleString("fr-DZ")} DA</h2>
              <p className="fs-13 text-muted mb-1">
                Règlement par <strong>{previewReceipt.method}</strong>
              </p>
              <p className="fs-12 text-muted mb-1">
                Patient : <strong>{previewReceipt.patientName}</strong>
              </p>
              <div className="p-2 mb-2 rounded border bg-light d-inline-block">
                <span className="fs-12 text-muted me-2">🔑 Mot de passe Client :</span>
                <span
                  className="badge bg-primary text-white font-w700 fs-13 px-2 py-1"
                  style={{ letterSpacing: "1px", fontFamily: "monospace" }}
                >
                  {getPatientPassword(previewReceipt)}
                </span>
              </div>
              <p className="fs-12 text-muted mb-0">
                N° Reçu : {previewReceipt.receiptNumber} • Facture : {previewReceipt.invoiceNumber}
              </p>
              <p className="fs-11 text-muted mt-2">
                Date : {previewReceipt.date} à {previewReceipt.time} • Opérateur : {previewReceipt.operator}
              </p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => setPreviewReceipt(null)}>
            Fermer
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <i className="flaticon-381-print me-1"></i> Imprimer le reçu
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default PaymentsPage;
