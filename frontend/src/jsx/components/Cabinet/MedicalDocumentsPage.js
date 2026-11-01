import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Modal, Button, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";
import { jsPDF } from "jspdf";
import {
  initialDocuments,
  initialPatients,
} from "../../../services/CabinetData";

const MedicalDocumentsPage = () => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef(null);

  const [newDoc, setNewDoc] = useState({
    patientId: "",
    title: "",
    category: "Analyses de laboratoire",
    author: "Laboratoire d'analyses médicales",
    notes: "",
  });

  // Chargement des documents et patients depuis MySQL
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [docData, patData] = await Promise.all([
          ApiService.getDocuments(),
          ApiService.getPatients(),
        ]);
        if (Array.isArray(docData) && docData.length > 0) {
          setDocuments(docData);
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
            setNewDoc((prev) => ({ ...prev, patientId: clean[0].id }));
          }
        }
      } catch (err) {
        console.warn("Erreur chargement documents MySQL :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const processFile = (file) => {
    if (!file) return;
    setSelectedFile(file);
    if (!newDoc.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setNewDoc((prev) => ({ ...prev, title: cleanName }));
    }
    const ext = file.name.split(".").pop()?.toUpperCase() || "";
    if (["JPG", "JPEG", "PNG", "WEBP", "DICOM"].includes(ext)) {
      setNewDoc((prev) => ({ ...prev, category: "Imagerie & Radiologie" }));
    } else if (["PDF", "DOC", "DOCX"].includes(ext)) {
      setNewDoc((prev) => ({ ...prev, category: "Comptes rendus spécialistes" }));
    }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFilePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    const pat =
      patients.find((p) => p.id === parseInt(newDoc.patientId)) ||
      patients[0] || { id: 1, firstName: "Patient", lastName: "" };

    const fileSizeStr = selectedFile
      ? selectedFile.size > 1024 * 1024
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} Mo`
        : `${Math.round(selectedFile.size / 1024)} Ko`
      : "1.2 Mo";

    const isImg = selectedFile ? selectedFile.type.startsWith("image/") : false;
    const fileExt = selectedFile ? selectedFile.name.split(".").pop().toUpperCase() : "PDF";

    const created = {
      id: documents.length + 1,
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`.trim(),
      title: newDoc.title,
      category: newDoc.category,
      date: new Date().toISOString().split("T")[0],
      author: newDoc.author,
      fileSize: fileSizeStr,
      type: fileExt,
      isImage: isImg,
      fileDataUrl: filePreview || null,
      fileName: selectedFile ? selectedFile.name : null,
      status: "Validé par le médecin",
    };

    setDocuments([created, ...documents]);
    setShowAddModal(false);
    setSelectedFile(null);
    setFilePreview(null);

    // Synchronisation MySQL
    try {
      await ApiService.saveDocument({
        patientId: pat.id,
        title: newDoc.title,
        category: newDoc.category,
        date: created.date,
        author: newDoc.author,
        fileSize: fileSizeStr,
        fileType: fileExt,
        filePath: filePreview ? "data_url" : null,
        status: "Validé",
      });
    } catch (err) {
      console.warn("Erreur synchronisation document MySQL :", err);
    }

    Swal.fire({
      icon: "success",
      title: "Document archivé avec succès",
      text: `"${created.title}" a été associé avec succès au dossier de ${created.patientName}.`,
      confirmButtonColor: "#1e60d5",
    });
  };

  const handleDownload = (doc) => {
    if (doc.fileDataUrl) {
      const link = document.createElement("a");
      link.href = doc.fileDataUrl;
      link.download =
        doc.fileName || `${doc.title}.${(doc.type || "pdf").toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      pdf.setDrawColor(26, 58, 92);
      pdf.setLineWidth(0.8);
      pdf.line(15, 28, 195, 28);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(26, 58, 92);
      pdf.text("CABINET DE GYNECOLOGIE OBSTETRIQUE", 15, 14);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(45, 106, 159);
      pdf.text("Dr N. BELBACHIR OULD HENNIA", 15, 19);

      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(
        "Medecin Specialiste en Gynecologie Obstetrique - Echographie",
        15,
        23
      );
      pdf.text(
        "Cite 500 Logements, Bloc A, Es-Senia, Oran | Tel : 0550 50 50 25",
        15,
        27
      );

      pdf.setFillColor(245, 249, 255);
      pdf.setDrawColor(192, 211, 232);
      pdf.roundedRect(15, 33, 180, 11, 2, 2, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(26, 58, 92);
      pdf.text((doc.title || "DOCUMENT MEDICAL").toUpperCase(), 105, 40, {
        align: "center",
      });

      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(220, 225, 230);
      pdf.roundedRect(15, 48, 180, 22, 1, 1, "FD");

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 58, 92);
      pdf.text("Patient(e) :", 20, 56);
      pdf.text("Date du document :", 20, 63);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 30, 30);
      pdf.text(`${doc.patientName || "Patient"}`, 55, 56);
      pdf.text(`${doc.date || ""}`, 55, 63);

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 58, 92);
      pdf.text("Categorie :", 115, 56);
      pdf.text("Emetteur :", 115, 63);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 30, 30);
      pdf.text(`${doc.category || "General"}`, 140, 56);
      pdf.text(`${doc.author || "Dr Belbachir"}`, 140, 63);

      pdf.setFillColor(248, 251, 255);
      pdf.setDrawColor(192, 211, 232);
      pdf.roundedRect(15, 76, 180, 40, 1, 1, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.setTextColor(26, 58, 92);
      pdf.text("DETAILS & ATTESTATION", 20, 83);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(30, 30, 30);
      pdf.text(
        `Ce document officiel fait partie intégrante du dossier médical informatisé.`,
        20,
        91
      );
      pdf.text(
        `Type de pièce : ${doc.fileType || "Rapport / Analyse"} (${doc.fileSize || "Archive médicale"})`,
        20,
        98
      );
      pdf.text(
        `Statut d'homologation : ${doc.status || "Validé par le médecin"}`,
        20,
        105
      );

      // Cachet & Signature
      pdf.setDrawColor(192, 211, 232);
      pdf.roundedRect(120, 220, 75, 32, 1, 1, "D");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(26, 58, 92);
      pdf.text("Dr N. BELBACHIR OULD HENNIA", 125, 226);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Specialiste en Gynecologie Obstetrique", 125, 231);
      pdf.text("Signature et Cachet Officiel", 125, 237);

      pdf.setDrawColor(26, 58, 92);
      pdf.setLineWidth(0.4);
      pdf.line(15, 280, 195, 280);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(120, 120, 120);
      pdf.text(
        "Cabinet Medical Dr Belbachir - Es-Senia, Oran | Document officiel imprime le " +
          new Date().toLocaleDateString("fr-FR"),
        105,
        284,
        { align: "center" }
      );

      const cleanFileName = (doc.title || "document_medical")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");

      pdf.save(`${cleanFileName}.pdf`);

      Swal.fire({
        icon: "success",
        title: "Document téléchargé",
        text: `Le document "${doc.title}" a été téléchargé avec succès au format PDF.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Erreur PDF :", err);
      Swal.fire({
        icon: "error",
        title: "Erreur de téléchargement",
        text: "Impossible de générer le PDF : " + err.message,
      });
    }
  };

  // Tri chronologique descendant : document le plus récent (date + heure/création + id) TOUJOURS en 1er
  const sortedDocuments = [...documents].sort((a, b) => {
    const dComp = (b.date || "").localeCompare(a.date || "");
    if (dComp !== 0) return dComp;
    const cComp = (b.createdAt || "").localeCompare(a.createdAt || "");
    if (cComp !== 0) return cComp;
    return (b.id || 0) - (a.id || 0);
  });

  const filteredDocuments = sortedDocuments.filter((doc) => {
    const matchCat = categoryFilter === "all" || doc.category === categoryFilter;
    const matchSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <PageTitle motherMenu="Gestion médicale" activeMenu="Documents médicaux" />

      {/* Barre d'action supérieure */}
      <div className="form-head d-flex mb-3 mb-md-4 align-items-center flex-wrap justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group search-area" style={{ width: "auto", minWidth: "260px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher document, patient, labo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="input-group-text">
              <i className="flaticon-381-search-2"></i>
            </span>
          </div>

          <select
            className="form-control default-select" style={{ width: "auto", minWidth: "210px" }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Toutes les catégories</option>
            <option value="Analyses de laboratoire">Analyses de laboratoire</option>
            <option value="Imagerie & Radiologie">Imagerie & Radiologie</option>
            <option value="Certificats médicaux">Certificats médicaux</option>
            <option value="Comptes rendus spécialistes">Comptes rendus spécialistes</option>
          </select>
        </div>

        <Button
          variant="primary"
          className="btn-rounded ms-auto"
          onClick={() => setShowAddModal(true)}
        >
          <i className="flaticon-381-add-1 me-2"></i> Ajouter un Document
        </Button>
      </div>

      {/* Tableau des documents médicaux */}
      <div className="card">
        <div className="card-header border-0 pb-0">
          <div>
            <h4 className="card-title">Classement et Archivage Médical Sécurisé</h4>
            <p className="text-muted fs-13 mb-0">
              Biologie, radiologies, courriers spécialistes et certificats patients
            </p>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th><strong>TITRE DU DOCUMENT</strong></th>
                  <th><strong>PATIENT ASSOCIÉ</strong></th>
                  <th className="d-none d-md-table-cell"><strong>CATÉGORIE</strong></th>
                  <th className="d-none d-md-table-cell"><strong>DATE D'AJOUT</strong></th>
                  <th className="d-none d-md-table-cell"><strong>ÉMETTEUR / AUTEUR</strong></th>
                  <th className="d-none d-md-table-cell"><strong>TAILLE</strong></th>
                  <th className="d-none d-md-table-cell"><strong>STATUT</strong></th>
                  <th className="text-end" style={{ width: "95px" }}><strong>ACTIONS</strong></th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5 text-muted">
                      Aucun document médical trouvé dans cette catégorie.
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="flaticon-381-file-1 text-primary fs-20 me-2"></i>
                          <div>
                            <strong className="text-dark">{doc.title}</strong>
                            <span className="d-block text-muted fs-11">Format {doc.type}</span>
                            {/* Date et catégorie visibles sur mobile sous le titre */}
                            <div className="d-block d-md-none text-muted fs-11 mt-1">
                              {doc.date} • {doc.category}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/patient-details?id=${doc.patientId}`}
                          className="font-w600 text-dark hover-primary"
                        >
                          {doc.patientName}
                        </Link>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <Badge bg="light" text="dark" className="border">
                          {doc.category}
                        </Badge>
                      </td>
                      <td className="d-none d-md-table-cell">{doc.date}</td>
                      <td className="d-none d-md-table-cell">
                        <span className="text-muted fs-13">{doc.author}</span>
                      </td>
                      <td className="d-none d-md-table-cell">{doc.fileSize}</td>
                      <td className="d-none d-md-table-cell">
                        <Badge bg="success" className="light">{doc.status}</Badge>
                      </td>
                      <td style={{ width: "95px", whiteSpace: "nowrap" }} className="text-end pe-0">
                        <div className="d-flex justify-content-end align-items-center">
                          <button
                            type="button"
                            className="btn btn-info shadow btn-xs sharp me-1 text-white"
                            onClick={() => handleDownload(doc)}
                            title="Télécharger"
                          >
                            <i className="fa fa-download"></i>
                          </button>
                          <Link
                            to={`/admin/patient-details?id=${doc.patientId}`}
                            className="btn btn-primary shadow btn-xs sharp"
                            title="Voir le dossier"
                          >
                            <i className="fa fa-folder-open"></i>
                          </Link>
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

      {/* Modal Ajout Nouveau Document */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="flaticon-381-file me-2 text-primary"></i>
            Ajouter un document au dossier patient
          </h5>
          <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
        </div>
        <form onSubmit={handleAddDocument}>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label font-w600">Patient *</label>
              <select
                className="form-control"
                value={newDoc.patientId}
                onChange={(e) => setNewDoc({ ...newDoc, patientId: e.target.value })}
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
              <label className="form-label font-w600">Titre du document *</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Bilan lipidique, Radiographie rachis, Compte rendu cardio..."
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label font-w600">Catégorie *</label>
              <select
                className="form-control"
                value={newDoc.category}
                onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
              >
                <option value="Analyses de laboratoire">Analyses de laboratoire</option>
                <option value="Imagerie & Radiologie">Imagerie & Radiologie</option>
                <option value="Certificats médicaux">Certificats médicaux</option>
                <option value="Comptes rendus spécialistes">Comptes rendus spécialistes</option>
                <option value="Autre document médical">Autre document médical</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label font-w600">Auteur / Émetteur</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: Labo d'Analyses, Centre d'Imagerie, Dr. Confrère..."
                value={newDoc.author}
                onChange={(e) => setNewDoc({ ...newDoc, author: e.target.value })}
              />
            </div>

            <div className="mb-3">
              <label className="form-label font-w600">Photo ou Document médical</label>
              <div
                style={{
                  border: selectedFile ? "2px solid #86efac" : isDraggingFile ? "2px dashed #1e60d5" : "2px dashed #cbd5e1",
                  borderRadius: "10px",
                  padding: "20px 15px",
                  textAlign: "center",
                  background: isDraggingFile ? "#eff6ff" : selectedFile ? "#f0fdf4" : "#f8fafc",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isDraggingFile) setIsDraggingFile(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingFile(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingFile(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="d-none"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <div className="d-flex align-items-center justify-content-center gap-3">
                    {filePreview ? (
                      <img
                        src={filePreview}
                        alt="Aperçu"
                        style={{ width: "45px", height: "45px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    ) : (
                      <i className="fa fa-file-pdf fs-28 text-danger"></i>
                    )}
                    <div className="text-start">
                      <strong className="d-block fs-13 text-dark">{selectedFile.name}</strong>
                      <small className="text-muted">{(selectedFile.size / 1024).toFixed(1)} Ko</small>
                    </div>
                  </div>
                ) : (
                  <div>
                    <i className="fa fa-cloud-upload-alt fs-24 text-primary mb-2 d-block"></i>
                    <p className="font-w600 text-dark mb-1 fs-13">
                      Glissez-déposez un document ici ou cliquez pour sélectionner
                    </p>
                    <small className="text-muted">Photos (JPG, PNG, WebP), Scanners, Radios, PDF (max 25 Mo)</small>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="danger" light onClick={() => setShowAddModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Archiver dans le dossier
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default MedicalDocumentsPage;
