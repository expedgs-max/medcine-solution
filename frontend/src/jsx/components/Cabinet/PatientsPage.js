import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import WheelDatePicker from "./WheelDatePicker";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";

export const generatePatientPassword = (lastName, firstName, phone) => {
  const cleanLast = (lastName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const cleanFirst = (firstName || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const lastInitial = cleanLast.charAt(0) || "p";
  const firstInitial = cleanFirst.charAt(0) || "a";

  const digits = (phone || "").replace(/\D/g, "");
  const last3 = digits.length >= 3 ? digits.slice(-3) : (digits + "000").slice(-3);

  return `${lastInitial}${firstInitial}${last3}`;
};

const PatientsPage = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    firstName: "",
    lastName: "",
    dob: "",
    gender: "Féminin",
    phone: "",
    email: "",
    password: "",
    customPassword: false,
    address: "",
    secuNumber: "",
    bloodGroup: "A+",
    allergies: "",
    chronicDiseases: "",
  });

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getPatients();
      const cleanData = (Array.isArray(data) ? data : []).filter((p) => {
        const last = (p.lastName || "").toLowerCase().trim();
        const first = (p.firstName || "").toLowerCase().trim();
        return (
          !["dubois", "lemoine", "bernard", "moreau", "belkacem"].includes(last) &&
          !["claire", "marc", "sophie", "lucas", "yasmine"].includes(first)
        );
      });
      setPatients(cleanData);
    } catch (err) {
      console.error("Erreur chargement patients MySQL:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      fullName: "",
      firstName: "",
      lastName: "",
      dob: "1990-01-01",
      gender: "Féminin",
      phone: "",
      email: "",
      password: "",
      customPassword: false,
      address: "",
      secuNumber: "",
      bloodGroup: "A+",
      allergies: "",
      chronicDiseases: "",
    });
    setShowModal(true);
    setTimeout(() => {
      const el = document.getElementById("patient-form-card");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleOpenEdit = (p) => {
    setEditId(p.id);
    const full = `${(p.lastName || "").toUpperCase()} ${p.firstName || ""}`.trim();
    setFormData({
      fullName: full,
      firstName: p.firstName || "",
      lastName: p.lastName || "",
      dob: p.dob || "",
      gender: p.gender || "Féminin",
      phone: p.phone || "",
      email: p.email || "",
      password: p.password || generatePatientPassword(p.lastName, p.firstName, p.phone),
      customPassword: false,
      address: p.address || "",
      secuNumber: p.secuNumber || "",
      bloodGroup: p.bloodGroup || "A+",
      allergies: Array.isArray(p.allergies) ? p.allergies.join(", ") : p.allergies || "",
      chronicDiseases: Array.isArray(p.chronicDiseases) ? p.chronicDiseases.join(", ") : p.chronicDiseases || "",
    });
    setShowModal(true);
    setTimeout(() => {
      const el = document.getElementById("patient-form-card");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleFullNameChange = (val) => {
    const raw = (val || "").trim();
    const parts = raw.split(/\s+/);
    const lastName = parts[0] ? parts[0].toUpperCase() : "";
    const firstName = parts.length > 1 ? parts.slice(1).join(" ") : "";

    setFormData((prev) => {
      const autoPass = !prev.customPassword
        ? generatePatientPassword(lastName, firstName, prev.phone)
        : prev.password;
      return {
        ...prev,
        fullName: val,
        lastName,
        firstName,
        password: autoPass,
      };
    });
  };

  const handleNameOrPhoneChange = (field, val) => {
    setFormData((prev) => {
      const nextLast = field === "lastName" ? val : prev.lastName;
      const nextFirst = field === "firstName" ? val : prev.firstName;
      const nextPhone = field === "phone" ? val : prev.phone;
      const autoPass = !prev.customPassword
        ? generatePatientPassword(nextLast, nextFirst, nextPhone)
        : prev.password;
      return {
        ...prev,
        [field]: val,
        password: autoPass,
      };
    });
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    try {
      const allergiesArr = formData.allergies
        ? formData.allergies.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const chronicArr = formData.chronicDiseases
        ? formData.chronicDiseases.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const rawFull = (formData.fullName || `${formData.lastName || ""} ${formData.firstName || ""}`).trim();
      const parts = rawFull.split(/\s+/);
      const lastName = parts[0] ? parts[0].toUpperCase() : (formData.lastName ? formData.lastName.toUpperCase() : "PATIENT");
      const firstName = parts.length > 1 ? parts.slice(1).join(" ") : (formData.firstName ? formData.firstName.trim() : "");

      const patientPass = formData.password || generatePatientPassword(lastName, firstName, formData.phone);

      if (editId) {
        await ApiService.updatePatient({
          id: editId,
          firstName: firstName,
          lastName: lastName,
          dob: formData.dob,
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email,
          password: patientPass,
          address: formData.address,
          secuNumber: formData.secuNumber,
          bloodGroup: formData.bloodGroup,
          allergies: allergiesArr,
          chronicDiseases: chronicArr,
        });

        await loadPatients();
        setShowModal(false);
        Swal.fire({
          icon: "success",
          title: "Dossier patient mis à jour",
          text: "Les modifications ont été enregistrées.",
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        await ApiService.createPatient({
          firstName: firstName,
          lastName: lastName,
          dob: formData.dob,
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email,
          password: patientPass,
          address: formData.address,
          secuNumber: formData.secuNumber,
          bloodGroup: formData.bloodGroup,
          allergies: allergiesArr,
          chronicDiseases: chronicArr,
        });

        await loadPatients();
        setShowModal(false);
        Swal.fire({
          icon: "success",
          title: "Patient enregistré avec succès",
          html: `
            <p class="mb-3">Le nouveau patient a été enregistré.</p>
            <div style="background: rgba(14, 165, 233, 0.08); border: 1px solid #38bdf8; border-radius: 12px; padding: 14px; text-align: left;">
              <div style="color: #0284c7; font-weight: 700; font-size: 13px; text-transform: uppercase; margin-bottom: 6px;">
                <i class="fa fa-key me-1"></i> Accès Portail Patient Généré :
              </div>
              <div style="font-size: 14px; color: #1e293b;">
                • Patient : <strong>${lastName.toUpperCase()} ${firstName}</strong><br/>
                • Mot de passe généré : <strong style="font-size: 20px; color: #0284c7; letter-spacing: 1.5px; font-family: monospace;">${patientPass}</strong>
              </div>
              <small class="text-muted d-block mt-2">
                Format : 1ère lettre Nom (<strong>"${(formData.lastName[0] || '').toLowerCase()}"</strong>) + 1ère lettre Prénom (<strong>"${(formData.firstName[0] || '').toLowerCase()}"</strong>) + 3 derniers chiffres tél (<strong>"${(formData.phone.replace(/\\D/g, '').slice(-3))}"</strong>)
              </small>
            </div>
          `,
          confirmButtonText: "D'accord, compris",
          confirmButtonColor: "#0d6efd",
        });
      }
    } catch (err) {
      console.error("Erreur enregistrement patient:", err);
      Swal.fire({
        icon: "error",
        title: "Erreur d'enregistrement",
        text: err?.response?.data?.message || "Impossible de sauvegarder le patient.",
      });
    }
  };

  const handleDeletePatient = (id) => {
    Swal.fire({
      title: "Supprimer ce patient ?",
      text: "Le dossier sera définitivement supprimé.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f72b50",
      cancelButtonColor: "#6e6e6e",
      confirmButtonText: "Oui, supprimer définitivement",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await ApiService.deletePatient(id);
          await loadPatients();
          Swal.fire("Supprimé", "Le dossier patient a été supprimé.", "success");
        } catch (err) {
          console.error("Erreur suppression patient:", err);
          Swal.fire("Erreur", "Impossible de supprimer le patient.", "error");
        }
      }
    });
  };

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
    const fileNum = (p.fileNumber || "").toLowerCase();
    const phoneNum = p.phone || "";
    const term = searchTerm.toLowerCase();

    const matchSearch =
      fullName.includes(term) ||
      fileNum.includes(term) ||
      phoneNum.includes(term);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <PageTitle motherMenu="Principal" activeMenu="Patients" />

      {/* Barre d'action supérieure */}
      <div className="form-head d-flex mb-3 mb-md-4 align-items-center flex-wrap justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group search-area" style={{ width: "auto", minWidth: "260px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher par nom, dossier, tél..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="input-group-text">
              <i className="flaticon-381-search-2"></i>
            </span>
          </div>

        </div>

        <Button
          variant={showModal && !editId ? "outline-primary" : "primary"}
          className="btn-rounded ms-auto"
          onClick={() => {
            if (showModal && !editId) {
              setShowModal(false);
            } else {
              handleOpenAdd();
            }
          }}
        >
          <i className={showModal && !editId ? "fa fa-times me-2" : "flaticon-381-add-1 me-2"}></i>
          {showModal && !editId ? "Fermer le formulaire" : "Ajouter un Patient"}
        </Button>
      </div>

      {/* Formulaire Ajout / Modification de Patient (Intégré dans la page sans popup) */}
      {showModal && (
        <div className="card mb-4" id="patient-form-card">
          <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
            <div>
              <h4 className="card-title">
                {editId ? "Modifier la fiche patient" : "Créer un nouveau dossier patient"}
              </h4>
              <p className="text-muted fs-13 mb-0">
                {editId
                  ? "Mise à jour des coordonnées et alertes médicales du patient"
                  : "Renseignez les coordonnées et informations médicales pour créer le dossier"}
              </p>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Fermer"
              onClick={() => setShowModal(false)}
            ></button>
          </div>
          <form onSubmit={handleSavePatient}>
            <div className="card-body">
              <h6 className="text-primary font-w600 mb-3 border-bottom pb-2">
                Informations Administratives
              </h6>
              <div className="row">
                <div className="col-12 mb-3">
                  <label className="form-label font-w600">
                    Nom et Prénom <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: BENALI Amina ou Mohamed Guedaoui..."
                    value={formData.fullName !== undefined ? formData.fullName : `${formData.lastName || ""} ${formData.firstName || ""}`.trim()}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Date de naissance *</label>
                  <WheelDatePicker
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    title="DATE DE NAISSANCE"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Genre</label>
                  <select
                    className="form-control"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Féminin">Féminin</option>
                    <option value="Masculin">Masculin</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Groupe Sanguin</label>
                  <select
                    className="form-control"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                    <option>O+</option>
                    <option>O-</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Téléphone portable *</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="06 00 00 00 00"
                    value={formData.phone}
                    onChange={(e) => handleNameOrPhoneChange("phone", e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="patient@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label d-flex justify-content-between align-items-center">
                    <span>
                      <i className="fa fa-key text-primary me-1"></i> Mot de passe Portail Patient *
                    </span>
                    <span className="badge badge-xs badge-info light">1ère lettre Nom + Prénom + 3 chiffres tél</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-primary font-w700">
                      <i className="fa fa-lock"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control font-w700 text-primary"
                      style={{ fontSize: "15px", letterSpacing: "1px", fontFamily: "monospace" }}
                      placeholder=""
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value, customPassword: true })}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => {
                        const parts = (formData.fullName || "").trim().split(/\s+/);
                        const l = parts[0] || formData.lastName;
                        const f = parts.length > 1 ? parts.slice(1).join(" ") : formData.firstName;
                        const auto = generatePatientPassword(l, f, formData.phone);
                        setFormData({ ...formData, password: auto, customPassword: false });
                      }}
                      title="Régénérer automatiquement selon Nom, Prénom et Téléphone"
                    >
                      <i className="fa fa-sync-alt me-1"></i> Auto
                    </button>
                  </div>
                  <small className="text-muted fs-11">

                  </small>
                </div>
              </div>

              <h6 className="text-primary font-w600 mt-3 mb-3 border-bottom pb-2">
                Alertes Médicales (Confidentiel)
              </h6>

              <div className="mb-3">
                <label className="form-label text-danger font-w600">
                  Allergies et intolérances (séparées par une virgule)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Pénicilline, Arachides, Ibuprofène..."
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Pathologies chroniques / ALD (séparées par une virgule)
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: Diabète type 2, HTA, Asthme..."
                  value={formData.chronicDiseases}
                  onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
                />
              </div>
            </div>
            <div className="card-footer d-flex justify-content-end gap-2 border-0 pt-0">
              <Button variant="danger" light onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button variant="primary" type="submit">
                {editId ? "Enregistrer les modifications" : "Créer le dossier"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tableau des patients */}
      <div className="card">
        <div className="card-header border-0 pb-0">
          <div>
            <h4 className="card-title">Répertoire des Patients du Cabinet</h4>
            <p className="text-muted fs-13 mb-0">
              {filteredPatients.length} patient(s) répertorié(s)
            </p>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th><strong>NOM & PRÉNOM</strong></th>
                  <th className="d-none d-md-table-cell"><strong>DATE NAISS. (ÂGE)</strong></th>
                  <th className="d-none d-md-table-cell"><strong>TÉLÉPHONE</strong></th>
                  <th className="d-none d-md-table-cell"><strong>DERNIÈRE VISITE</strong></th>
                  <th className="text-end" style={{ width: "125px" }}><strong>ACTIONS</strong></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      <i className="fa fa-spinner fa-spin me-2"></i> Chargement des patients...
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      Aucun patient trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link
                          to={`/patient-details?id=${p.id}`}
                          className="font-w600 text-dark hover-primary"
                        >
                          {(p.lastName || "").toUpperCase()} {p.firstName || ""}
                        </Link>
                        <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                          <span className="text-muted fs-12">
                            {p.gender || "—"}
                            <span className="d-inline d-md-none ms-1">({p.age || 0} ans)</span>
                          </span>
                          <span
                            className="badge badge-xs badge-info light"
                            title="Mot de passe d'accès portail patient"
                            style={{ fontFamily: "monospace", fontSize: "11px", letterSpacing: "0.5px" }}
                          >
                            <i className="fa fa-key me-1 text-primary"></i>
                            {p.password || generatePatientPassword(p.lastName, p.firstName, p.phone)}
                          </span>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        {p.dob || "—"}{" "}
                        <span className="text-muted fs-12">({p.age || 0} ans)</span>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="font-w600">{p.phone}</span>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="text-muted">
                          {p.lastVisit || "N/A"}
                        </span>
                      </td>
                      <td style={{ width: "125px", whiteSpace: "nowrap" }} className="text-end pe-0">
                        <div className="d-flex align-items-center justify-content-end">
                          <Link
                            to={`/admin/patient-details?id=${p.id}`}
                            className="btn btn-primary shadow btn-xs sharp me-1"
                            title="Ouvrir le dossier médical"
                          >
                            <i className="fa fa-folder-open"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn btn-info shadow btn-xs sharp me-1 text-white"
                            onClick={() => handleOpenEdit(p)}
                            title="Modifier les coordonnées"
                          >
                            <i className="fa fa-pencil"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-success shadow btn-xs sharp me-1"
                            onClick={() => navigate(`/admin/consultations?patientId=${p.id}`)}
                            title="Démarrer consultation"
                          >
                            <i className="fa fa-stethoscope"></i>
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger shadow btn-xs sharp"
                            onClick={() => handleDeletePatient(p.id)}
                            title="Supprimer le patient"
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

    </>
  );
};

export default PatientsPage;
