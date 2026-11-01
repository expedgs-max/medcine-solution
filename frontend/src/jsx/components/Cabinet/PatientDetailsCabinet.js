import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import WheelDatePicker from "./WheelDatePicker";
import { Modal } from "react-bootstrap";
import Swal from "sweetalert2";
import PrescriptionPreviewModal from "./PrescriptionPreviewModal";
import EchoReportPrintModal from "./EchoReportPrintModal";
import { generatePatientPassword } from "./PatientsPage";
import ApiService from "../../../services/ApiService";
import { jsPDF } from "jspdf";
import {
  initialConsultations,
  initialPrescriptions,
  initialExaminations,
  initialDocuments,
  initialInvoices,
} from "../../../services/CabinetData";

const PatientDetailsCabinet = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const patientIdParam = parseInt(searchParams.get("id")) || null;

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientIdParam);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [selectedEchoConsultation, setSelectedEchoConsultation] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState("synthese");

  // État des documents du patient & formulaire d'ajout
  const [allDocuments, setAllDocuments] = useState(initialDocuments);
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState("Imagerie & Radiologie");
  const [docAuthor, setDocAuthor] = useState("Centre d'Imagerie / Dr N. BELBACHIR OULD HENNIA");
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [docFile, setDocFile] = useState(null);
  const [docFilePreview, setDocFilePreview] = useState(null);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const patientDocFileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchPatients = async () => {
      try {
        const data = await ApiService.getPatients();
        const clean = (Array.isArray(data) ? data : []).filter((p) => {
          const last = (p.lastName || "").toLowerCase().trim();
          const first = (p.firstName || "").toLowerCase().trim();
          return (
            !["dubois", "lemoine", "bernard", "moreau", "belkacem"].includes(last) &&
            !["claire", "marc", "sophie", "lucas", "yasmine"].includes(first)
          );
        });
        if (isMounted) {
          setPatients(clean);
          if (!selectedPatientId && clean.length > 0) {
            setSelectedPatientId(clean[0].id);
          }
        }
      } catch (err) {
        console.warn("Erreur chargement patients dans détails :", err);
      }
    };
    fetchPatients();
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId) return;
    let isMounted = true;
    const fetchMedicalRecord = async () => {
      try {
        const [cData, prData, docData, invData] = await Promise.all([
          ApiService.getConsultations(selectedPatientId),
          ApiService.getPrescriptions(),
          ApiService.getDocuments(selectedPatientId),
          ApiService.getInvoices(selectedPatientId),
        ]);
        if (isMounted) {
          if (Array.isArray(cData)) {
            setConsultations(cData);
          }
          if (Array.isArray(prData)) {
            setPrescriptions(prData);
          }
          if (Array.isArray(docData)) {
            setAllDocuments(docData);
          }
          if (Array.isArray(invData)) {
            setInvoices(invData);
          }
        }
      } catch (err) {
        console.warn("Erreur chargement dossier médical :", err);
      }
    };
    fetchMedicalRecord();
    return () => {
      isMounted = false;
    };
  }, [selectedPatientId]);

  const patient =
    patients.find((p) => p.id === selectedPatientId) || patients[0] || null;

  const patientConsultations = (
    consultations.length > 0 ? consultations : initialConsultations
  ).filter((c) => String(c.patientId) === String(patient?.id));

  const basePrescriptions = (
    prescriptions.length > 0 ? prescriptions : initialPrescriptions
  ).filter((p) => String(p.patientId) === String(patient?.id));

  const consultPrescriptions = patientConsultations
    .filter(
      (c) =>
        c.prescriptionData &&
        !basePrescriptions.some(
          (p) =>
            p.id === c.prescriptionData.id ||
            p.prescriptionNumber === c.prescriptionData.prescriptionNumber
        )
    )
    .map((c) => c.prescriptionData);

  const patientPrescriptions = [...basePrescriptions, ...consultPrescriptions];

  const patientExaminations = patient
    ? initialExaminations.filter((e) => e.patientId === patient.id)
    : [];
  const patientDocuments = patient
    ? allDocuments.filter((d) => d.patientId === patient.id)
    : [];
  const patientPortalUploads = patient
    ? allDocuments.filter(
        (d) =>
          d.patientId === patient.id &&
          ((d.status && d.status.toLowerCase().includes("patient")) ||
            (d.author && d.author.toLowerCase().includes("patient")) ||
            (d.fileType && ["TEXTE", "NOTE"].includes(d.fileType.toUpperCase())) ||
            (d.notes && d.notes.trim().length > 0 && d.author && d.author.toLowerCase().includes("patient")))
      )
    : [];
  const unreadPortalUploadsCount = patientPortalUploads.filter(
    (d) => !d.isRead && d.status !== "Lu par le médecin" && d.status !== "Lu"
  ).length;
  const patientInvoices = (
    invoices.length > 0 ? invoices : initialInvoices
  ).filter((i) => String(i.patientId) === String(patient?.id));

  const processDocumentFile = (file) => {
    if (!file) return;
    setDocFile(file);
    if (!docTitle) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setDocTitle(cleanName);
    }
    const ext = file.name.split(".").pop()?.toUpperCase() || "";
    if (["JPG", "JPEG", "PNG", "WEBP", "DICOM"].includes(ext)) {
      setDocCategory("Imagerie & Radiologie");
    } else if (["PDF", "DOC", "DOCX"].includes(ext)) {
      setDocCategory("Comptes rendus spécialistes");
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setDocFilePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    setShowAddDocForm(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      processDocumentFile(file);
    }
    if (patientDocFileInputRef.current) patientDocFileInputRef.current.value = "";
  };

  const handleResetDocForm = () => {
    setDocTitle("");
    setDocCategory("Imagerie & Radiologie");
    setDocAuthor("Centre d'Imagerie / Dr N. BELBACHIR OULD HENNIA");
    setDocDate(new Date().toISOString().split("T")[0]);
    setDocFile(null);
    setDocFilePreview(null);
    setShowAddDocForm(false);
  };

  const handleSaveDocument = async (e) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Titre requis",
        text: "Veuillez renseigner le titre du document.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    const fileSizeStr = docFile
      ? docFile.size > 1024 * 1024
        ? `${(docFile.size / (1024 * 1024)).toFixed(1)} Mo`
        : `${Math.round(docFile.size / 1024)} Ko`
      : "1.2 Mo";

    const isImage = docFile ? docFile.type.startsWith("image/") : false;
    const fileExt = docFile ? docFile.name.split(".").pop().toUpperCase() : "PDF";

    const newDocument = {
      id: Date.now(),
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      title: docTitle.trim(),
      category: docCategory,
      date: docDate,
      author: docAuthor.trim() || "Dr N. BELBACHIR OULD HENNIA",
      fileSize: fileSizeStr,
      type: fileExt,
      fileType: fileExt,
      isImage: isImage,
      fileDataUrl: docFilePreview || null,
      filePath: docFilePreview || null,
      fileName: docFile ? docFile.name : null,
      status: "Validé",
    };

    setAllDocuments((prev) => [newDocument, ...prev]);
    handleResetDocForm();

    try {
      const res = await ApiService.saveDocument({
        patientId: patient.id,
        title: newDocument.title,
        category: newDocument.category,
        date: newDocument.date,
        author: newDocument.author,
        filePath: newDocument.fileDataUrl,
        fileSize: newDocument.fileSize,
        fileType: newDocument.type,
        status: newDocument.status,
      });
      if (res && res.data && res.data.id) {
        newDocument.id = res.data.id;
      }
      const refreshedDocs = await ApiService.getDocuments(patient.id);
      if (Array.isArray(refreshedDocs)) {
        setAllDocuments(refreshedDocs);
      }
    } catch (err) {
      console.warn("Erreur sauvegarde document MySQL :", err);
    }

    Swal.fire({
      icon: "success",
      title: "Document rattaché avec succès",
      text: `Le document "${newDocument.title}" a été ajouté au dossier du patient.`,
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const handleDeleteDocument = (docId, title) => {
    Swal.fire({
      title: "Supprimer ce document ?",
      text: `Êtes-vous sûr de vouloir retirer "${title}" du dossier ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setAllDocuments((prev) => prev.filter((d) => d.id !== docId));
        try {
          await ApiService.deleteDocument(docId);
        } catch (err) {
          console.warn("Erreur suppression document MySQL :", err);
        }
        Swal.fire({
          icon: "success",
          title: "Document supprimé",
          timer: 1400,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleMarkDocRead = async (doc) => {
    if (!doc) return;
    const isAlreadyRead = doc.isRead || doc.status === "Lu par le médecin" || doc.status === "Lu";
    if (isAlreadyRead) return;

    // Décrémenter immédiatement le compteur dans le state React (mise à jour optimiste)
    setAllDocuments((prev) =>
      prev.map((d) =>
        d.id === doc.id
          ? { ...d, isRead: true, is_read: 1, status: "Lu par le médecin" }
          : d
      )
    );

    // Déclencher la mise à jour réactive du badge du menu latéral
    window.dispatchEvent(new CustomEvent("portal_docs_updated"));

    // Sauvegarde en base de données MySQL
    try {
      await ApiService.markDocumentAsRead(doc.id);
    } catch (e) {
      console.warn("Erreur marquage document lu:", e);
    }
  };

  const handleViewDoc = (doc) => {
    handleMarkDocRead(doc);
    if (doc.fileDataUrl) {
      setPreviewingDoc(doc);
      return;
    }
    const titleLower = (doc.title || "").toLowerCase();
    const isEcho =
      titleLower.includes("écho") ||
      titleLower.includes("echo") ||
      doc.category === "Imagerie & Radiologie";
    const isPresc =
      titleLower.includes("ordonnance") ||
      doc.category === "Prescription" ||
      doc.fileType === "Prescription";

    if (isEcho) {
      const matchCs =
        (doc.consultationId &&
          patientConsultations.find((c) => c.id === doc.consultationId)) ||
        patientConsultations.find(
          (c) =>
            c.date === doc.date &&
            (c.echoData || c.echoFindings || c.ultrasoundReport)
        ) ||
        patientConsultations[0];
      if (matchCs) {
        setSelectedEchoConsultation(matchCs);
        return;
      }
    }

    if (isPresc) {
      const matchPresc =
        patientPrescriptions.find(
          (p) =>
            p.prescriptionNumber && doc.title.includes(p.prescriptionNumber)
        ) ||
        patientPrescriptions.find((p) => p.date === doc.date) ||
        patientPrescriptions[0];
      if (matchPresc) {
        setSelectedPrescription(matchPresc);
        return;
      }
    }

    setPreviewingDoc(doc);
  };

  const handleDownloadDoc = (doc) => {
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

      const titleLower = (doc.title || "").toLowerCase();
      const isEcho =
        titleLower.includes("écho") ||
        titleLower.includes("echo") ||
        doc.category === "Imagerie & Radiologie";
      const isPresc =
        titleLower.includes("ordonnance") ||
        doc.category === "Prescription" ||
        doc.fileType === "Prescription";

      const matchCs =
        (doc.consultationId &&
          patientConsultations.find((c) => c.id === doc.consultationId)) ||
        patientConsultations.find((c) => c.date === doc.date) ||
        patientConsultations[0];

      const matchPresc =
        patientPrescriptions.find(
          (p) =>
            p.prescriptionNumber && doc.title.includes(p.prescriptionNumber)
        ) ||
        patientPrescriptions.find((p) => p.date === doc.date) ||
        patientPrescriptions[0];

      // En-tête officiel Cabinet
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

      // Titre Document Box
      pdf.setFillColor(245, 249, 255);
      pdf.setDrawColor(192, 211, 232);
      pdf.roundedRect(15, 33, 180, 11, 2, 2, "FD");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(26, 58, 92);
      const displayTitle = isEcho
        ? "COMPTE-RENDU D'EXAMEN ECHOGRAPHIQUE"
        : isPresc
        ? "ORDONNANCE MEDICALE"
        : (doc.title || "DOCUMENT MEDICAL").toUpperCase();
      pdf.text(displayTitle, 105, 40, { align: "center" });

      // Bloc Informations Patient
      pdf.setFillColor(250, 250, 250);
      pdf.setDrawColor(220, 225, 230);
      pdf.roundedRect(15, 48, 180, 26, 1, 1, "FD");

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 58, 92);
      pdf.text("Nom & Prenom :", 20, 55);
      pdf.text("N Dossier :", 20, 62);
      pdf.text("Date de naissance :", 20, 69);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 30, 30);
      pdf.text(
        `${(patient?.lastName || "").toUpperCase()} ${patient?.firstName || ""}`,
        55,
        55
      );
      pdf.text(`${patient?.fileNumber || "DOS-" + (patient?.id || "")}`, 55, 62);
      pdf.text(
        `${patient?.dob || "-"} (${patient?.age || "-"} ans)`,
        55,
        69
      );

      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(26, 58, 92);
      pdf.text("Date d'examen :", 115, 55);
      pdf.text("DDR :", 115, 62);
      pdf.text("Terme actuel :", 115, 69);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 30, 30);
      pdf.text(`${doc.date || matchCs?.date || "-"}`, 145, 55);
      pdf.text(`${patient?.ddr || matchCs?.vitals?.ddr || "-"}`, 145, 62);
      pdf.text(`${patient?.terme || matchCs?.vitals?.terme || "-"}`, 145, 69);

      let curY = 82;

      // Section Biométrie & Echographie
      if (isEcho) {
        const echoData = matchCs?.echoData || {};
        const ultra = matchCs?.ultrasoundReport || {};

        pdf.setFillColor(248, 251, 255);
        pdf.setDrawColor(192, 211, 232);
        pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(26, 58, 92);
        pdf.text(
          `BIOMETRIE FOETALE & MESURES (${matchCs?.echoType || "Echographie OB3"})`,
          20,
          curY + 5.5
        );
        curY += 12;

        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(26, 58, 92);
        pdf.text("BIP :", 20, curY);
        pdf.text("PC :", 65, curY);
        pdf.text("CA :", 110, curY);
        pdf.text("LF :", 155, curY);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(20, 20, 20);
        pdf.text(
          `${echoData.ob2_bip || echoData.ob3_bip || ultra.bip_mm || "-"} mm`,
          32,
          curY
        );
        pdf.text(
          `${echoData.ob2_pc || echoData.ob3_pc || ultra.pc_mm || "-"} mm`,
          75,
          curY
        );
        pdf.text(
          `${echoData.ob2_ca || echoData.ob3_ca || ultra.ca_mm || "-"} mm`,
          120,
          curY
        );
        pdf.text(
          `${echoData.ob2_lf || echoData.ob3_lf || ultra.lf_mm || "-"} mm`,
          165,
          curY
        );
        curY += 8;

        const epf =
          matchCs?.calculated?.ob2Poids ||
          matchCs?.calculated?.ob3Poids ||
          ultra.epf_hadlock_g;
        if (epf) {
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(125, 60, 152);
          pdf.text(`Estimation du Poids Foetal (Hadlock) : ${epf} g`, 20, curY);
          curY += 8;
        }

        // Observations morphologiques
        pdf.setFillColor(248, 251, 255);
        pdf.setDrawColor(192, 211, 232);
        pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(26, 58, 92);
        pdf.text("OBSERVATIONS MORPHOLOGIQUES", 20, curY + 5.5);
        curY += 13;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.5);
        pdf.setTextColor(30, 30, 30);
        const obs =
          matchCs?.examFindings ||
          matchCs?.echoFindings ||
          ultra.findings ||
          "Examen echographique sans anomalie morphologique decelable. Activite cardiaque et mouvements foetaux presents. Liquide amniotique en quantite normale.";
        const obsLines = pdf.splitTextToSize(obs, 170);
        pdf.text(obsLines, 20, curY);
        curY += obsLines.length * 5 + 6;

        // Conclusion
        pdf.setFillColor(248, 251, 255);
        pdf.setDrawColor(192, 211, 232);
        pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(26, 58, 92);
        pdf.text("CONCLUSION MEDICALE", 20, curY + 5.5);
        curY += 13;

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(26, 58, 92);
        const concl =
          matchCs?.diagnosis ||
          matchCs?.echoConclusion ||
          ultra.conclusion ||
          "Grossesse intra-uterine monofoetale evolutive sans anomalie morphologique decelable.";
        const conclLines = pdf.splitTextToSize(concl, 170);
        pdf.text(conclLines, 20, curY);
        curY += conclLines.length * 5 + 6;
      } else if (isPresc && matchPresc?.items) {
        // Section Ordonnance
        pdf.setFillColor(248, 251, 255);
        pdf.setDrawColor(192, 211, 232);
        pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(26, 58, 92);
        pdf.text("PRESCRIPTIONS MEDICAMENTEUSES", 20, curY + 5.5);
        curY += 14;

        (matchPresc.items || []).forEach((item, idx) => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(9);
          pdf.setTextColor(26, 58, 92);
          pdf.text(
            `${idx + 1}. ${item.medication || item.nom}`,
            22,
            curY
          );
          curY += 5;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8.5);
          pdf.setTextColor(60, 60, 60);
          pdf.text(
            `- Posologie : ${item.posology || item.posologie || "-"} | Duree : ${
              item.duration || item.duree || "-"
            }`,
            25,
            curY
          );
          curY += 7;
        });
      } else {
        // Document Général
        pdf.setFillColor(248, 251, 255);
        pdf.setDrawColor(192, 211, 232);
        pdf.roundedRect(15, curY, 180, 8, 1, 1, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.5);
        pdf.setTextColor(26, 58, 92);
        pdf.text("DETAILS DU DOCUMENT", 20, curY + 5.5);
        curY += 13;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(30, 30, 30);
        pdf.text(`Categorie : ${doc.category || "Dossier medical"}`, 22, curY);
        curY += 6;
        pdf.text(
          `Emetteur : ${doc.author || "Dr N. BELBACHIR OULD HENNIA"}`,
          22,
          curY
        );
        curY += 6;
        pdf.text(
          `Date d'enregistrement : ${
            doc.date || new Date().toISOString().split("T")[0]
          }`,
          22,
          curY
        );
        curY += 8;
        pdf.text(
          "Document certifie conforme et archive dans le dossier medical du patient.",
          22,
          curY
        );
        curY += 10;
      }

      // Cachet & Signature
      const signY = Math.max(curY + 10, 240);
      pdf.setDrawColor(192, 211, 232);
      pdf.roundedRect(120, signY, 75, 32, 1, 1, "D");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(26, 58, 92);
      pdf.text("Dr N. BELBACHIR OULD HENNIA", 125, signY + 6);
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Specialiste en Gynecologie Obstetrique", 125, signY + 11);
      pdf.text("Signature et Cachet Officiel", 125, signY + 17);

      // Footer
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
      console.error("Erreur génération PDF :", err);
      Swal.fire({
        icon: "error",
        title: "Erreur de téléchargement",
        text: "Impossible de générer le document : " + err.message,
      });
    }
  };

  if (!patient) {
    return (
      <div className="card text-center p-5 mt-4">
        <h4 className="text-muted">Aucun dossier patient sélectionné</h4>
        <p>Veuillez sélectionner ou créer un patient depuis le répertoire des patients.</p>
        <div>
          <Link to="/admin/patients" className="btn btn-primary">
            <i className="fa fa-arrow-left me-2"></i> Aller au répertoire des patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-dossier-wrapper">
      <style>{`
        .patient-dossier-wrapper {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #1e293b;
        }

        /* 1. Breadcrumb Bar */
        .patient-breadcrumb-bar {
          background: #ffffff;
          padding: 12px 20px;
          border-radius: 14px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .patient-breadcrumb-list {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
          font-size: 13.5px;
        }
        .patient-breadcrumb-list a {
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }
        .patient-breadcrumb-list a:hover {
          color: #2563eb;
        }
        .patient-breadcrumb-list .separator {
          color: #cbd5e1;
          font-weight: 300;
        }
        .patient-breadcrumb-list .current {
          color: #2563eb;
          font-weight: 600;
        }
        .patient-sync-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
        }
        .patient-sync-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #10b981;
          display: inline-block;
        }

        /* 2. Action Controls Bar */
        .patient-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }
        .patient-toolbar-left {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
        }
        .patient-btn-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid rgba(37, 99, 235, 0.6);
          color: #2563eb;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition: all 0.2s ease;
        }
        .patient-btn-back:hover {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #2563eb;
        }
        .patient-selector-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          padding: 4px 6px 4px 14px;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04);
        }
        .patient-selector-label {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          white-space: nowrap;
          margin: 0;
        }
        .patient-select-wrapper {
          position: relative;
          display: inline-block;
        }
        .patient-select-native {
          appearance: none;
          -webkit-appearance: none;
          background: #f8fafc;
          color: #1e293b;
          font-weight: 600;
          font-size: 12px;
          border-radius: 8px;
          padding: 6px 30px 6px 12px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          cursor: pointer;
          outline: none;
          transition: all 0.15s;
        }
        .patient-select-native:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .patient-select-arrow {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748b;
          display: flex;
          align-items: center;
        }

        .patient-toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .patient-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 9999px;
          background: #2563eb;
          color: #ffffff;
          font-weight: 600;
          font-size: 12px;
          border: none;
          text-decoration: none;
          box-shadow: 0 3px 10px -1px rgba(37, 99, 235, 0.35);
          transition: all 0.2s ease;
        }
        .patient-btn-primary:hover {
          background: #1d4ed8;
          color: #ffffff;
          box-shadow: 0 5px 14px -2px rgba(37, 99, 235, 0.45);
        }
        .patient-btn-emerald {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 20px;
          border-radius: 9999px;
          background: rgba(236, 253, 245, 0.85);
          color: #047857;
          border: 1px solid rgba(16, 185, 129, 0.7);
          font-weight: 600;
          font-size: 12px;
          text-decoration: none;
          box-shadow: 0 1px 3px rgba(16, 185, 129, 0.1);
          transition: all 0.2s ease;
        }
        .patient-btn-emerald:hover {
          background: #d1fae5;
          color: #065f46;
          border-color: #10b981;
        }

        /* 3. Patient Identity Card (NO AVATAR PHOTO) */
        .patient-identity-card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 2px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -2px rgba(15, 23, 42, 0.02);
          overflow: hidden;
          margin-bottom: 24px;
        }
        .patient-card-accent-top {
          height: 6px;
          width: 100%;
          background: linear-gradient(to right, #2563eb, #6366f1, #10b981);
        }
        .patient-card-inner {
          padding: 24px;
        }

        /* Top Row: Name + Badges */
        .patient-header-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .patient-name-bar {
          width: 6px;
          height: 32px;
          border-radius: 9999px;
          background: #2563eb;
          display: inline-block;
          flex-shrink: 0;
        }
        .patient-main-name {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.025em;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }
        .patient-badge-id {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          background: #f1f5f9;
          color: #334155;
          border: 1px solid rgba(226, 232, 240, 0.9);
        }
        .patient-badge-blood {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          background: #fff1f2;
          color: #be123c;
          border: 1px solid rgba(254, 205, 211, 0.8);
        }
        .patient-badge-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          background: #ecfdf5;
          color: #047857;
          border: 1px solid rgba(167, 243, 208, 0.8);
        }
        .patient-status-dot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
        }

        /* Demographic 3-Column Grid */
        .patient-demographics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding-top: 20px;
        }
        @media (max-width: 991px) {
          .patient-demographics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 767px) {
          .patient-demographics-grid {
            grid-template-columns: 1fr;
          }
        }
        .patient-demographic-cell {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(248, 250, 252, 0.85);
          border: 1px solid #f1f5f9;
        }
        .patient-cell-icon-wrap {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .patient-cell-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          margin: 0;
          line-height: 1.2;
        }
        .patient-cell-val {
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          margin: 3px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .patient-cell-val-sub {
          font-weight: 500;
          color: #64748b;
        }

        /* Clinical Alerts (Allergies & Pathologies) */
        .patient-alerts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }
        @media (max-width: 767px) {
          .patient-alerts-grid {
            grid-template-columns: 1fr;
          }
        }
        .patient-alert-card-rose {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(255, 241, 242, 0.7);
          border: 1px solid rgba(254, 205, 211, 0.85);
        }
        .patient-alert-pill-rose {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          background: #ffffff;
          color: #be123c;
          border: 1px solid #ffe4e6;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          flex-shrink: 0;
        }
        .patient-alert-pill-rose .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e11d48;
        }
        .patient-alert-text-rose {
          font-size: 13.5px;
          font-weight: 600;
          color: #4c0519;
        }

        .patient-alert-card-amber {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(254, 243, 199, 0.5);
          border: 1px solid rgba(253, 230, 138, 0.85);
        }
        .patient-alert-pill-amber {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          background: #ffffff;
          color: #92400e;
          border: 1px solid #fef3c7;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          flex-shrink: 0;
        }
        .patient-alert-pill-amber .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
        }
        .patient-alert-text-amber {
          font-size: 13.5px;
          font-weight: 600;
          color: #451a03;
        }

        /* 4. Tab Navigation Bar */
        .patient-tabs-nav-bar {
          display: flex;
          align-items: center;
          gap: 4px;
          border-bottom: 1px solid #e2e8f0;
          overflow-x: auto;
          margin-bottom: 24px;
          padding-bottom: 0;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .patient-tabs-nav-bar::-webkit-scrollbar {
          display: none;
        }
        @media (max-width: 768px) {
          .patient-tabs-nav-bar {
            gap: 6px;
            padding-bottom: 6px;
            flex-wrap: nowrap !important;
          }
          .patient-tab-btn {
            padding: 8px 12px !important;
            font-size: 11.5px !important;
            flex-shrink: 0;
          }
          .patient-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .patient-toolbar-left,
          .patient-toolbar-right {
            width: 100%;
            justify-content: space-between;
          }
          .patient-btn-back,
          .patient-selector-box,
          .patient-btn-primary,
          .patient-btn-emerald {
            width: 100%;
            justify-content: center;
          }
          .patient-card-inner {
            padding: 16px !important;
          }
          .patient-panel-card {
            padding: 16px !important;
          }
        }
        .patient-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .patient-tab-btn:hover {
          color: #0f172a;
          border-bottom-color: #cbd5e1;
        }
        .patient-tab-btn.active {
          color: #2563eb;
          font-weight: 700;
          border-bottom-color: #2563eb;
        }
        .patient-tab-btn.active svg {
          stroke: #2563eb;
        }

        /* 5. Panels */
        .patient-panel-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 2px 15px -3px rgba(15, 23, 42, 0.04);
          padding: 24px;
        }
        .patient-panel-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 16px;
          margin-bottom: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .patient-panel-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #2563eb;
          margin: 0;
        }
        .patient-panel-badge-pill {
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          background: #eff6ff;
          color: #2563eb;
        }
        .patient-med-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 10px;
          border-bottom: 1px solid #f1f5f9;
          border-radius: 10px;
          transition: background 0.15s;
        }
        .patient-med-row:last-child {
          border-bottom: none;
        }
        .patient-med-row:hover {
          background: #f8fafc;
        }
        .patient-med-tag {
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
          background: #f1f5f9;
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
        }
        .patient-box-item {
          padding: 14px 16px;
          border-radius: 12px;
          background: rgba(248, 250, 252, 0.85);
          border: 1px solid #f1f5f9;
          font-size: 13.5px;
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .patient-box-item:last-child {
          margin-bottom: 0;
        }
        .patient-box-item strong {
          color: #0f172a;
          font-weight: 700;
        }
      `}</style>

      {/* 1. BREADCRUMB BAR */}
      <nav aria-label="Breadcrumb" className="patient-breadcrumb-bar">
        <ol className="patient-breadcrumb-list">
          <li>
            <Link to="/admin/patients">Patients</Link>
          </li>
          <li className="separator">/</li>
          <li className="current">Dossier Patient</li>
        </ol>
        <span className="patient-sync-pill">
          <span className="patient-sync-dot"></span>
          Dossier synchronisé
        </span>
      </nav>

      {/* 2. ACTION CONTROLS BAR */}
      <div className="patient-toolbar">
        {/* Left: Retour + Sélecteur de Dossier */}
        <div className="patient-toolbar-left">
          <Link to="/admin/patients" className="patient-btn-back">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m12 8-4 4 4 4" />
              <path d="M16 12H8" />
            </svg>
            <span>Retour à la liste</span>
          </Link>

          <div className="patient-selector-box">
            <label htmlFor="patientSelectQuick" className="patient-selector-label">
              Changer de dossier :
            </label>
            <div className="patient-select-wrapper">
              <select
                id="patientSelectQuick"
                className="patient-select-native"
                value={patient?.id || ""}
                onChange={(e) => setSelectedPatientId(parseInt(e.target.value))}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {(p.lastName || "").toUpperCase()} {p.firstName || ""} ( {p.fileNumber || ""} )
                  </option>
                ))}
              </select>
              <span className="patient-select-arrow">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Primary Medical Actions */}
        <div className="patient-toolbar-right">
          <Link
            to={`/consultations?patientId=${patient.id}`}
            className="patient-btn-primary"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M3 15h6" />
              <path d="M6 12v6" />
            </svg>
            <span>Nouvelle consultation</span>
          </Link>

          <Link
            to={`/prescriptions?patientId=${patient.id}`}
            className="patient-btn-emerald"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              <path d="M8 13h2" />
              <path d="M14 13h2" />
              <path d="M8 17h2" />
              <path d="M14 17h2" />
            </svg>
            <span>Émettre Ordonnance</span>
          </Link>
        </div>
      </div>

      {/* 3. PATIENT IDENTITY CARD (STRICTLY NO PROFILE PICTURE / AVATAR) */}
      <section className="patient-identity-card">
        {/* Top decorative accent bar */}
        <div className="patient-card-accent-top"></div>

        <div className="patient-card-inner">
          {/* Top Row: Name + Badges */}
          <div className="patient-header-row">
            {/* Pure Typographic Accent Bar */}
            <div className="patient-name-bar"></div>

            <h2 className="patient-main-name">
              {patient.lastName.toUpperCase()} {patient.firstName}
            </h2>

            {/* Badge: Dossier ID */}
            <span className="patient-badge-id">{patient.fileNumber}</span>

            {/* Badge: Blood Group */}
            <span className="patient-badge-blood">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="#f43f5e"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </svg>
              Groupe {patient.bloodGroup}
            </span>

            {/* Badge: Follow-up Status */}
            <span className="patient-badge-status">
              <span className="patient-status-dot-pulse"></span>
              {patient.status}
            </span>
          </div>

          {/* Demographic & Contact Metadata Grid (4 Cards) */}
          <div className="patient-demographics-grid">
            {/* Card 1: Date of Birth */}
            <div className="patient-demographic-cell">
              <div className="patient-cell-icon-wrap">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 2v4" />
                  <path d="M16 2v4" />
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="patient-cell-label">Né(e) le</p>
                <p className="patient-cell-val">
                  {patient.dob}{" "}
                  <span className="patient-cell-val-sub">
                    ( {patient.age || 36} ans )
                  </span>
                </p>
              </div>
            </div>

            {/* Card 2: Phone */}
            <div className="patient-demographic-cell">
              <div className="patient-cell-icon-wrap">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="patient-cell-label">Tél</p>
                <p className="patient-cell-val">{patient.phone}</p>
              </div>
            </div>

            {/* Card 3: Email */}
            <div className="patient-demographic-cell">
              <div className="patient-cell-icon-wrap">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="patient-cell-label">Courriel</p>
                <p className="patient-cell-val">{patient.email || "Non renseigné"}</p>
              </div>
            </div>

            {/* Card 4: Mot de passe Portail Patient */}
            <div className="patient-demographic-cell" style={{ background: "rgba(240, 249, 255, 0.95)", border: "1px solid #bae6fd" }}>
              <div className="patient-cell-icon-wrap" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="7.5" cy="15.5" r="5.5" />
                  <path d="m21 2-9.6 9.6" />
                  <path d="m15.5 7.5 3 3L22 7l-3-3" />
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="patient-cell-label" style={{ color: "#0284c7" }}>Mot de passe portail</p>
                <p className="patient-cell-val" style={{ color: "#0369a1", fontFamily: "monospace", fontSize: "14px", letterSpacing: "1px" }}>
                  {patient.password || generatePatientPassword(patient.lastName, patient.firstName, patient.phone)}
                </p>
              </div>
            </div>
          </div>

          {/* High-Contrast Clinical Alerts (Allergies & Pathologies / ALD) */}
          <div className="patient-alerts-grid">
            {/* Alert 1: Allergies */}
            <div className="patient-alert-card-rose">
              <span className="patient-alert-pill-rose">
                <span className="dot"></span>
                Allergies :
              </span>
              <span className="patient-alert-text-rose">
                {patient.allergies && patient.allergies.length > 0
                  ? patient.allergies.join(", ")
                  : "Aucune allergie connue"}
              </span>
            </div>

            {/* Alert 2: Pathologies / ALD */}
            <div className="patient-alert-card-amber">
              <span className="patient-alert-pill-amber">
                <span className="dot"></span>
                Pathologies / ALD :
              </span>
              <span className="patient-alert-text-amber">
                {patient.chronicDiseases && patient.chronicDiseases.length > 0
                  ? patient.chronicDiseases.join(", ")
                  : "Aucune ALD déclarée"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NAVIGATION TABS (BARRE D'ONGLETS) */}
      <div className="patient-tabs-nav-bar">
        {/* Tab 1: Synthèse */}
        <button
          type="button"
          className={`patient-tab-btn ${activeTab === "synthese" ? "active" : ""}`}
          onClick={() => setActiveTab("synthese")}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            <path d="M8 10v4" />
            <path d="M12 10v2" />
            <path d="M16 10v6" />
          </svg>
          <span>Synthèse et antécédents</span>
        </button>

        {/* Tab 2: Consultations */}
        <button
          type="button"
          className={`patient-tab-btn ${activeTab === "consultations" ? "active" : ""}`}
          onClick={() => setActiveTab("consultations")}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="m9 14 2 2 4-4" />
          </svg>
          <span>Consultations ( {patientConsultations.length} )</span>
        </button>

        {/* Tab 3: Ordonnances */}
        <button
          type="button"
          className={`patient-tab-btn ${activeTab === "ordonnances" ? "active" : ""}`}
          onClick={() => setActiveTab("ordonnances")}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
          </svg>
          <span>Ordonnances ( {patientPrescriptions.length} )</span>
        </button>

        {/* Tab 4: Documents */}
        <button
          type="button"
          className={`patient-tab-btn ${activeTab === "documents" ? "active" : ""}`}
          onClick={() => setActiveTab("documents")}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 7h-3a2 2 0 0 1-2-2V2" />
            <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z" />
            <path d="M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h11" />
          </svg>
          <span>Documents ( {patientDocuments.length} )</span>
        </button>

        {/* Tab 6: Factures / Faits */}
        <button
          type="button"
          className={`patient-tab-btn ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="16" height="20" x="4" y="2" rx="2" />
            <line x1="8" x2="16" y1="6" y2="6" />
            <line x1="16" x2="16" y1="14" y2="18" />
            <path d="M16 10h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M12 14h.01" />
            <path d="M8 14h.01" />
            <path d="M12 18h.01" />
            <path d="M8 18h.01" />
          </svg>
          <span>Factures ( {patientInvoices.length} )</span>
        </button>

        {/* Tab 7: Dépôts & Textes du Patient (depuis le portail public) */}
        <button
          type="button"
          className={`patient-tab-btn ${activeTab === "portal_uploads" ? "active" : ""}`}
          onClick={() => setActiveTab("portal_uploads")}
          style={{
            position: "relative",
            ...(activeTab === "portal_uploads"
              ? { borderBottom: "2px solid #0284c7", color: "#0284c7" }
              : {}),
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
          </svg>
          <span>Dépôts Patient ( {patientPortalUploads.length} )</span>
          {unreadPortalUploadsCount > 0 && (
            <span
              className="badge badge-danger ms-2"
              style={{
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "12px",
                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "20px",
                height: "20px",
                lineHeight: "1",
              }}
              title={`${unreadPortalUploadsCount} transmission(s) non lue(s)`}
            >
              {unreadPortalUploadsCount}
            </span>
          )}
        </button>
      </div>

      {/* 5. TAB PANELS */}
      <div>
        {/* PANEL 1: SYNTHÈSE ET ANTÉCÉDENTS */}
        {activeTab === "synthese" && (
          <div className="row g-4">
            {/* Card 1: Traitements Habituels En Cours */}
            <div className="col-lg-6">
              <div className="patient-panel-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="patient-panel-card-header">
                    <div className="d-flex align-items-center gap-3">
                      <div className="patient-cell-icon-wrap">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                          <path d="m8.5 8.5 7 7" />
                        </svg>
                      </div>
                      <h3 className="patient-panel-card-title">
                        Traitements Habituels En Cours
                      </h3>
                    </div>
                    <span className="patient-panel-badge-pill">
                      {patient.regularTreatments ? patient.regularTreatments.length : 2} actifs
                    </span>
                  </div>

                  {patient.regularTreatments && patient.regularTreatments.length > 0 ? (
                    <div>
                      {patient.regularTreatments.map((t, idx) => {
                        let tag = "Traitement";
                        if (t.toLowerCase().includes("ventoline")) tag = "Inhalation";
                        else if (t.toLowerCase().includes("inuvair")) tag = "Traitement de fond";
                        else if (t.toLowerCase().includes("metformine")) tag = "Antidiabétique";
                        else if (t.toLowerCase().includes("amlodipine")) tag = "Antihypertenseur";

                        return (
                          <div key={idx} className="patient-med-row">
                            <div className="d-flex align-items-center gap-3">
                              <span
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  background: "#2563eb",
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              ></span>
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#334155",
                                }}
                              >
                                {t}
                              </span>
                            </div>
                            <span className="patient-med-tag">{tag}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted mb-0 py-3 text-center">
                      Aucun traitement au long cours enregistré.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Antécédents Médico-Chirurgicaux */}
            <div className="col-lg-6">
              <div className="patient-panel-card h-100">
                <div className="patient-panel-card-header">
                  <div className="d-flex align-items-center gap-3">
                    <div className="patient-cell-icon-wrap">
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                        <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                        <circle cx="20" cy="10" r="2" />
                      </svg>
                    </div>
                    <h3 className="patient-panel-card-title">
                      Antécédents Médico-Chirurgicaux
                    </h3>
                  </div>
                </div>

                <div>
                  {/* Médicaux */}
                  <div className="patient-box-item">
                    <strong>Médicaux : </strong>
                    <span style={{ color: "#475569" }}>
                      {patient.chronicDiseases && patient.chronicDiseases.length > 0
                        ? patient.chronicDiseases.join(", ")
                        : "Aucun"}
                    </span>
                  </div>

                  {/* Chirurgicaux */}
                  <div className="patient-box-item">
                    <strong>Chirurgicaux : </strong>
                    <span style={{ color: "#475569" }}>
                      {patient.surgicalHistory || "Aucun"}
                    </span>
                  </div>

                  {/* Familiaux */}
                  <div className="patient-box-item">
                    <strong>Familiaux : </strong>
                    <span style={{ color: "#475569" }}>
                      {patient.familyHistory || "Aucun"}
                    </span>
                  </div>

                  {/* Gynéco-Obstétriques */}
                  <div className="patient-box-item">
                    <strong>Gynéco-Obstétriques : </strong>
                    <span style={{ color: "#475569" }}>
                      {patient.gravida !== null && patient.gravida !== undefined
                        ? `Gestité G${patient.gravida} • Parité P${patient.para || 0} • Césarienne(s) : ${patient.cesarean || 0} • Fausse(s) couche(s) : ${patient.abortions || 0}`
                        : "G1P0, aucun antécédent particulier."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 2: CONSULTATIONS */}
        {activeTab === "consultations" && (
          <div className="patient-panel-card">
            <div className="patient-panel-card-header">
              <h3 className="patient-panel-card-title">Consultations médicales ({patientConsultations.length})</h3>
              <Link
                to={`/consultations?patientId=${patient.id}`}
                className="patient-btn-primary"
                style={{ padding: "6px 16px", fontSize: "11.5px" }}
              >
                + Démarrer une consultation
              </Link>
            </div>
            <div>
              {/* Détails de la consultation sélectionnée (style admin/consultations) */}
              {selectedConsultation && (
                <div className="p-3 mb-4 rounded-3 border border-primary bg-light shadow-sm" id="patient-consultation-details">
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                    <div>
                      <h5 className="mb-0 text-primary font-w600">
                        <i className="flaticon-381-notepad me-2"></i>
                        {selectedConsultation.consultationNumber} • {selectedConsultation.reason}
                      </h5>
                      <span className="text-muted fs-12">
                        Date : {selectedConsultation.date} à {selectedConsultation.time} • Cotation : {selectedConsultation.billingCode || "—"}
                      </span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="patient-badge-status">
                        <span className="patient-status-dot-pulse"></span>
                        {selectedConsultation.status || "Clôturée"}
                      </span>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary"
                        onClick={() => setSelectedConsultation(null)}
                      >
                        <i className="fa fa-times me-1"></i> Fermer
                      </button>
                    </div>
                  </div>

                  {/* Constantes vitales */}
                  <div className="row g-2 mb-3">
                    <div className="col-md-3 col-6">
                      <div className="p-2 border rounded text-center bg-white">
                        <span className="text-muted fs-11 d-block">Tension Artérielle</span>
                        <strong className="text-dark fs-13">{selectedConsultation.vitals?.bp || "-"} mmHg</strong>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 border rounded text-center bg-white">
                        <span className="text-muted fs-11 d-block">Poids</span>
                        <strong className="text-dark fs-13">{selectedConsultation.vitals?.weight ? `${selectedConsultation.vitals.weight} kg` : "-"}</strong>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 border rounded text-center bg-white">
                        <span className="text-muted fs-11 d-block">Température / DDR</span>
                        <strong className="text-dark fs-13">
                          {selectedConsultation.vitals?.temperature || selectedConsultation.vitals?.temp
                            ? `${selectedConsultation.vitals.temperature || selectedConsultation.vitals.temp} °C`
                            : (selectedConsultation.vitals?.ddr || "-")}
                        </strong>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 border rounded text-center bg-white">
                        <span className="text-muted fs-11 d-block">Pouls / Terme</span>
                        <strong className="text-dark fs-13">
                          {selectedConsultation.vitals?.heartRate || selectedConsultation.vitals?.hr
                            ? `${selectedConsultation.vitals.heartRate || selectedConsultation.vitals.hr} bpm`
                            : (selectedConsultation.vitals?.terme || "-")}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic & Observations */}
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="fs-12 font-w600 text-muted mb-1 d-block">DIAGNOSTIC (CIM-10)</label>
                      <div className="p-2.5 bg-white rounded border fs-13 text-dark font-w500" style={{ minHeight: "55px" }}>
                        {selectedConsultation.diagnosis || "Aucun diagnostic renseigné."}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="fs-12 font-w600 text-muted mb-1 d-block">OBSERVATIONS & EXAMEN</label>
                      <div className="p-2.5 bg-white rounded border fs-13 text-dark" style={{ minHeight: "55px" }}>
                        {selectedConsultation.examFindings || "Aucune observation."}
                        {selectedConsultation.recommendations ? ` — ${selectedConsultation.recommendations}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Échographie rattachée */}
                  {(selectedConsultation.echoFindings || selectedConsultation.echoType || selectedConsultation.ultrasoundReport) && (
                    <div
                      className="p-2.5 mb-2 rounded fs-13"
                      style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}
                    >
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                        <span className="font-w600 d-flex align-items-center gap-1">
                          <i className="fa fa-wave-square me-1"></i>
                          {selectedConsultation.echoType || "Compte-Rendu Échographique"}
                        </span>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-success d-flex align-items-center gap-1"
                          onClick={() => setSelectedEchoConsultation(selectedConsultation)}
                        >
                          <i className="fa fa-file-medical"></i> Compte-rendu complet
                        </button>
                      </div>
                      <div style={{ color: "#14532d" }}>
                        <strong>Conclusion : </strong>
                        {selectedConsultation.echoFindings || selectedConsultation.echoConclusion || selectedConsultation.ultrasoundReport?.findings || "Échographie enregistrée."}
                      </div>
                    </div>
                  )}

                  {/* Ordonnance rattachée */}
                  {(selectedConsultation.prescriptionCreated || selectedConsultation.prescriptionData) && (
                    <div
                      className="p-2.5 rounded fs-13 d-flex align-items-center justify-content-between flex-wrap gap-2"
                      style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <i className="fa fa-prescription text-primary"></i>
                        <span>
                          <strong>Ordonnance : </strong>
                          {selectedConsultation.prescriptionData?.items?.length
                            ? `${selectedConsultation.prescriptionData.items.length} médicament(s) prescrit(s)`
                            : "Prescription médicale établie"}
                        </span>
                      </div>
                      {selectedConsultation.prescriptionData && (
                        <button
                          type="button"
                          className="btn btn-xs btn-primary text-white"
                          onClick={() => setSelectedPrescription(selectedConsultation.prescriptionData)}
                        >
                          <i className="fa fa-print me-1"></i> Voir l'ordonnance
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tableau simple et épuré (identique à admin/consultations) */}
              {patientConsultations.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  Aucune consultation archivée pour ce patient.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: "110px" }}><strong>DATE & HEURE</strong></th>
                        <th><strong>MOTIF</strong></th>
                        <th className="d-none d-md-table-cell"><strong>DIAGNOSTIC (CIM-10)</strong></th>
                        <th className="d-none d-md-table-cell"><strong>COTATION</strong></th>
                        <th className="d-none d-sm-table-cell"><strong>STATUT</strong></th>
                        <th className="text-end" style={{ width: "140px" }}><strong>ACTIONS</strong></th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientConsultations.map((cs) => {
                        const isSelected = selectedConsultation?.id === cs.id;
                        return (
                          <tr
                            key={cs.id}
                            className={isSelected ? "table-primary" : ""}
                            style={{ cursor: "pointer" }}
                          >
                            <td style={{ whiteSpace: "nowrap" }} onClick={() => setSelectedConsultation(isSelected ? null : cs)}>
                              <strong className="text-primary">{cs.date}</strong>
                              <span className="text-muted fs-12 ms-2 d-none d-sm-inline">à {cs.time}</span>
                              <div className="d-block d-sm-none text-muted fs-11">{cs.time}</div>
                            </td>
                            <td onClick={() => setSelectedConsultation(isSelected ? null : cs)}>
                              <span className="font-w600 text-dark">{cs.reason}</span>
                              <div className="d-block d-md-none text-muted fs-11 mt-1">{cs.diagnosis}</div>
                            </td>
                            <td className="d-none d-md-table-cell" onClick={() => setSelectedConsultation(isSelected ? null : cs)}>
                              <span className="text-dark font-w500">{cs.diagnosis || "—"}</span>
                            </td>
                            <td className="d-none d-md-table-cell" onClick={() => setSelectedConsultation(isSelected ? null : cs)}>
                              <span className="text-dark font-w500">{cs.billingCode || "—"}</span>
                            </td>
                            <td className="d-none d-sm-table-cell" onClick={() => setSelectedConsultation(isSelected ? null : cs)}>
                              <span className="patient-badge-status" style={{ display: "inline-flex" }}>
                                <span className="patient-status-dot-pulse"></span>
                                {cs.status || "Clôturée"}
                              </span>
                            </td>
                            <td className="text-end pe-0" style={{ whiteSpace: "nowrap" }}>
                              <div className="d-flex justify-content-end align-items-center">
                                <button
                                  type="button"
                                  className={`btn ${isSelected ? "btn-primary" : "btn-info text-white"} shadow btn-xs sharp me-1`}
                                  onClick={() => setSelectedConsultation(isSelected ? null : cs)}
                                  title={isSelected ? "Masquer les détails" : "Afficher les détails de la consultation"}
                                >
                                  <i className="fa fa-eye"></i>
                                </button>
                                {(cs.echoFindings || cs.echoType || cs.ultrasoundReport) && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-success shadow btn-xs sharp me-1"
                                    onClick={() => setSelectedEchoConsultation(cs)}
                                    title="Aperçu du compte-rendu échographique"
                                  >
                                    <i className="fa fa-wave-square"></i>
                                  </button>
                                )}
                                {(cs.prescriptionCreated || cs.prescriptionData) && (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary shadow btn-xs sharp me-1"
                                    onClick={() => setSelectedPrescription(cs.prescriptionData)}
                                    title="Voir l'ordonnance"
                                  >
                                    <i className="fa fa-prescription"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 3: ORDONNANCES */}
        {activeTab === "ordonnances" && (
          <div className="patient-panel-card">
            <div className="patient-panel-card-header">
              <h3 className="patient-panel-card-title">
                Prescriptions & Ordonnances
              </h3>
              <Link
                to={`/prescriptions?patientId=${patient.id}`}
                className="patient-btn-emerald"
                style={{ padding: "6px 16px", fontSize: "11.5px" }}
              >
                + Nouvelle ordonnance
              </Link>
            </div>
            <div>
              {patientPrescriptions.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  Aucune ordonnance délivrée.
                </div>
              ) : (
                patientPrescriptions.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3 mb-3 border rounded-3"
                    style={{ background: "#f8fafc" }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <h6
                        className="font-w600 mb-0"
                        style={{ color: "#2563eb" }}
                      >
                        {ord.prescriptionNumber} — Du {ord.date} (Validité :{" "}
                        {ord.validity})
                      </h6>
                      <div className="d-flex gap-2 align-items-center">

                        <button
                          type="button"
                          className="patient-btn-back"
                          style={{ padding: "4px 12px", fontSize: "11px" }}
                          onClick={() => setSelectedPrescription(ord)}
                          title="Aperçu & Impression officielle"
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 6 2 18 2 18 9" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <rect width="12" height="8" x="6" y="14" />
                          </svg>
                          Imprimer
                        </button>
                      </div>
                    </div>
                    <ul className="mb-2 ps-3">
                      {ord.items.map((item, idx) => (
                        <li key={idx} className="mb-1 fs-13">
                          <strong>{item.medication}</strong> : {item.posology}{" "}
                          pendant {item.duration} ({item.renewable})
                        </li>
                      ))}
                    </ul>
                    <div className="text-muted fs-12">
                      <strong>Conseils :</strong> {ord.notes}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PANEL 4: DOCUMENTS & RÉSULTATS */}
        {activeTab === "documents" && (
          <div
            className="patient-panel-card position-relative"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDraggingDoc) setIsDraggingDoc(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDraggingDoc) setIsDraggingDoc(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.currentTarget.contains(e.relatedTarget)) return;
              setIsDraggingDoc(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingDoc(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processDocumentFile(e.dataTransfer.files[0]);
              }
            }}
          >
            {/* Overlay visuel lors du glisser-déposer de fichiers */}
            {isDraggingDoc && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(239, 246, 255, 0.95)",
                  backdropFilter: "blur(3px)",
                  WebkitBackdropFilter: "blur(3px)",
                  border: "3px dashed #2563eb",
                  borderRadius: "14px",
                  zIndex: 999,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: "65px",
                    height: "65px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(37, 99, 235, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                    fontSize: "28px",
                    marginBottom: "12px",
                  }}
                >
                  <i className="fa fa-cloud-upload-alt"></i>
                </div>
                <h5 className="font-w700 text-primary mb-1">Déposez votre document ici</h5>
                <p className="text-muted fs-13 mb-0">
                  Le document sera chargé et préparé pour l'archivage dans le dossier médical
                </p>
              </div>
            )}
            <div className="patient-panel-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h3 className="patient-panel-card-title">
                  Documents & Résultats rattachés
                </h3>
                <p className="text-muted fs-12 mb-0">
                  Imageries médicales, bilans d'analyses, scanners et comptes-rendus du patient
                </p>
              </div>
              <button
                type="button"
                className={`btn btn-sm ${showAddDocForm ? "btn-outline-secondary" : "btn-primary"} d-flex align-items-center gap-2`}
                style={{ borderRadius: "10px", fontWeight: "600", transition: "all 0.2s" }}
                onClick={() => setShowAddDocForm(!showAddDocForm)}
              >
                <i className={showAddDocForm ? "fa fa-times" : "fa fa-cloud-upload-alt"}></i>
                <span>{showAddDocForm ? "Fermer le formulaire" : "+ Ajouter un document"}</span>
              </button>
            </div>

            {/* FORMULAIRE INLINE D'IMPORT DE PHOTOS ET FICHIERS */}
            {showAddDocForm && (
              <div
                className="p-4 mb-4"
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "14px",
                  boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <span
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#eff6ff",
                        color: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fa fa-file-upload"></i>
                    </span>
                    <h5 className="font-w700 text-dark mb-0 fs-15">
                      Importer une photo ou un fichier depuis votre appareil
                    </h5>
                  </div>
                  <span className="badge bg-primary text-white fs-11 px-2 py-1">
                    Dossier {patient.fileNumber}
                  </span>
                </div>

                <form onSubmit={handleSaveDocument}>
                  <div className="row">
                    {/* Zone d'import de fichier / photo */}
                    <div className="col-12 mb-3">
                      <label className="form-label font-w600 fs-13 text-dark">
                        Photo ou Document depuis l'appareil
                      </label>
                      <div
                        style={{
                          border: docFile ? "2px solid #86efac" : isDraggingDoc ? "2px dashed #2563eb" : "2px dashed #cbd5e1",
                          borderRadius: "12px",
                          padding: "24px 16px",
                          textAlign: "center",
                          background: isDraggingDoc ? "#eff6ff" : docFile ? "#f0fdf4" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => {
                          if (patientDocFileInputRef.current) {
                            patientDocFileInputRef.current.click();
                          } else {
                            document.getElementById("patientDocFileInput")?.click();
                          }
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isDraggingDoc) setIsDraggingDoc(true);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingDoc(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            processDocumentFile(e.dataTransfer.files[0]);
                          }
                        }}
                      >
                        <input
                          type="file"
                          id="patientDocFileInput"
                          ref={patientDocFileInputRef}
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />

                        {docFile ? (
                          <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                            {docFilePreview && docFile && docFile.type && docFile.type.startsWith("image/") ? (
                              <img
                                src={docFilePreview}
                                alt="Aperçu"
                                style={{
                                  maxHeight: "95px",
                                  maxWidth: "140px",
                                  borderRadius: "8px",
                                  objectFit: "cover",
                                  border: "1px solid #86efac",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  width: "52px",
                                  height: "52px",
                                  borderRadius: "10px",
                                  background: "#ecfdf5",
                                  color: "#16a34a",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "24px",
                                }}
                              >
                                <i className="fa fa-file-pdf"></i>
                              </span>
                            )}
                            <div className="text-start">
                              <p className="font-w700 text-dark mb-0 fs-14">
                                {docFile.name}
                              </p>
                              <small className="text-muted">
                                {(docFile.size / 1024).toFixed(1)} Ko • {docFile.type || "Fichier sélectionné"}
                              </small>
                              <div className="mt-1">
                                <span className="badge bg-success text-white fs-11">
                                  <i className="fa fa-check me-1"></i> Prêt à être importé
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-xs ms-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocFile(null);
                                setDocFilePreview(null);
                              }}
                            >
                              <i className="fa fa-trash me-1"></i> Changer
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-2">
                              <span
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "50%",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "20px",
                                }}
                              >
                                <i className="fa fa-cloud-upload-alt"></i>
                              </span>
                            </div>
                            <p className="font-w600 text-dark mb-1 fs-14">
                              Glissez-déposez un document ici ou cliquez pour le sélectionner
                            </p>
                            <p className="text-muted fs-12 mb-0">
                              Photos (JPEG, PNG, WebP), scanners, radiographies, PDF, analyses médicales... (max 25 Mo)
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Champ Titre du document (Requis) */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-w600 fs-13 text-dark">
                        Titre du document <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Radiographie du thorax face/profil, Échographie abdominale, Bilan sanguin..."
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        required
                      />
                      <small className="text-muted fs-11">
                        Titre descriptif pour identifier rapidement le document dans le dossier
                      </small>
                    </div>

                    {/* Champ Catégorie */}
                    <div className="col-md-3 mb-3">
                      <label className="form-label font-w600 fs-13 text-dark">
                        Catégorie
                      </label>
                      <select
                        className="form-control"
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value)}
                      >
                        <option value="Imagerie & Radiologie">Imagerie & Radiologie</option>
                        <option value="Analyses de laboratoire">Analyses de laboratoire</option>
                        <option value="Comptes rendus spécialistes">Comptes rendus spécialistes</option>
                        <option value="Certificats médicaux">Certificats médicaux</option>
                        <option value="Ordonnance externe">Ordonnance externe</option>
                        <option value="Autre document médical">Autre document médical</option>
                      </select>
                    </div>

                    {/* Date */}
                    <div className="col-md-3 mb-3">
                      <label className="form-label font-w600 fs-13 text-dark">
                        Date du document
                      </label>
                      <WheelDatePicker
                        value={docDate}
                        onChange={(e) => setDocDate(e.target.value)}
                        title="DATE DU DOCUMENT"
                      />
                    </div>

                    {/* Émetteur / Source */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-w600 fs-13 text-dark">
                        Émetteur / Source
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Centre d'Imagerie, Laboratoire Pyramides, Dr Confrère..."
                        value={docAuthor}
                        onChange={(e) => setDocAuthor(e.target.value)}
                      />
                    </div>

                    {/* Boutons d'action */}
                    <div className="col-md-6 mb-3 d-flex align-items-end justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-light"
                        onClick={handleResetDocForm}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary d-flex align-items-center gap-2"
                      >
                        <i className="fa fa-check"></i>
                        <span>Enregistrer & Joindre au dossier</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th>Titre du document</th>
                    <th className="d-none d-md-table-cell">Catégorie</th>
                    <th className="d-none d-md-table-cell">Date</th>
                    <th className="d-none d-md-table-cell">Émetteur</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patientDocuments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5">
                        <div
                          style={{
                            border: "2px dashed #cbd5e1",
                            borderRadius: "14px",
                            padding: "36px 20px",
                            background: "#f8fafc",
                            cursor: "pointer",
                            maxWidth: "520px",
                            margin: "0 auto",
                            transition: "all 0.2s ease",
                          }}
                          onClick={() => {
                            setShowAddDocForm(true);
                            setTimeout(() => {
                              if (patientDocFileInputRef.current) patientDocFileInputRef.current.click();
                            }, 100);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isDraggingDoc) setIsDraggingDoc(true);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingDoc(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              processDocumentFile(e.dataTransfer.files[0]);
                            }
                          }}
                        >
                          <div
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "50%",
                              background: "#eff6ff",
                              color: "#2563eb",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "24px",
                              marginBottom: "12px",
                            }}
                          >
                            <i className="fa fa-cloud-upload-alt"></i>
                          </div>
                          <h5 className="font-w700 text-dark mb-1 fs-15">
                            Glissez-déposez vos documents ici
                          </h5>
                          <p className="text-muted fs-12 mb-3">
                            Comptes rendus, imageries médicales, bilans d'analyses, ordonnances externes (PDF, JPG, PNG, DOCX...)
                          </p>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm px-3 py-2 font-w600"
                            style={{ borderRadius: "8px" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAddDocForm(true);
                            }}
                          >
                            <i className="fa fa-plus me-1"></i> Importer le premier document
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    patientDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {doc.isImage || (doc.type && ["JPG", "JPEG", "PNG", "WEBP"].includes(doc.type.toUpperCase())) ? (
                              <span
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  background: "#fef3c7",
                                  color: "#d97706",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  cursor: doc.fileDataUrl ? "pointer" : "default",
                                }}
                                onClick={() => doc.fileDataUrl && setPreviewingDoc(doc)}
                                title="Voir l'image"
                              >
                                {doc.fileDataUrl ? (
                                  <img
                                    src={doc.fileDataUrl}
                                    alt=""
                                    style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "8px" }}
                                  />
                                ) : (
                                  <i className="fa fa-image fs-14"></i>
                                )}
                              </span>
                            ) : (
                              <span
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <i className="fa fa-file-pdf fs-14"></i>
                              </span>
                            )}
                            <div>
                              <strong className="text-dark d-block">{doc.title}</strong>
                              <small className="text-muted d-block">
                                {doc.fileSize || "Document"} • {doc.type || "PDF"}
                              </small>
                              {doc.notes && (
                                <small className="text-info d-block fst-italic mt-1" style={{ fontSize: "11.5px" }}>
                                  <i className="fa fa-comment-dots me-1"></i> "{doc.notes}"
                                </small>
                              )}
                              <div className="d-block d-md-none mt-1">
                                <span className="badge badge-xs badge-info light me-1">{doc.category}</span>
                                <span className="text-muted fs-11">{doc.date}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <span className="patient-med-tag">{doc.category}</span>
                        </td>
                        <td className="d-none d-md-table-cell">{doc.date}</td>
                        <td className="d-none d-md-table-cell">{doc.author}</td>
                        <td className="text-end">
                          <div className="d-inline-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-info"
                              onClick={() => handleViewDoc(doc)}
                              title="Aperçu et impression du document"
                            >
                              <i className="fa fa-eye me-1"></i> Voir
                            </button>
                            <button
                              type="button"
                              className="patient-btn-back"
                              style={{ padding: "4px 10px", fontSize: "11px" }}
                              onClick={() => handleDownloadDoc(doc)}
                              title="Télécharger le fichier"
                            >
                              <i className="fa fa-download me-1"></i> Télécharger
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-link text-danger p-0"
                              onClick={() => handleDeleteDocument(doc.id, doc.title)}
                              title="Supprimer du dossier"
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
        )}

        {/* PANEL 6: FAITS / FACTURES */}
        {activeTab === "invoices" && (
          <div className="patient-panel-card">
            <div className="patient-panel-card-header">
              <h3 className="patient-panel-card-title">
                Facturation du patient
              </h3>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    <th>N° Facture</th>
                    <th>Date</th>
                    <th className="d-none d-md-table-cell">Description de l'acte</th>
                    <th className="text-end">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {patientInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        <i className="fa fa-file-invoice fs-24 d-block mb-2 text-muted"></i>
                        Aucune facture enregistrée pour ce patient
                      </td>
                    </tr>
                  ) : (
                    patientInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <strong>{inv.invoiceNumber}</strong>
                          <div className="d-block d-md-none text-muted fs-11">{inv.actDescription}</div>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{inv.date}</td>
                        <td className="d-none d-md-table-cell">{inv.actDescription}</td>
                        <td className="text-end">
                          <strong className="text-dark">
                            {inv.amount.toLocaleString("fr-DZ")} DA
                          </strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PANEL 7: DÉPÔTS & TEXTES DU PATIENT DEPUIS LE SITE PUBLIC */}
        {activeTab === "portal_uploads" && (
          <div className="patient-panel-card">
            <div className="patient-panel-card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <h3 className="patient-panel-card-title d-flex align-items-center gap-2">
                  <i className="fa fa-cloud-download-alt text-primary"></i>
                  <span>Documents & Textes déposés par le patient</span>
                </h3>
                <p className="text-muted fs-12 mb-0">
                  Transmissions directes, documents joints, bilans et messages rédigés par le patient depuis le portail web
                </p>
              </div>
              <span className="badge badge-info light fs-12 px-3 py-2" style={{ borderRadius: "8px", fontWeight: "600" }}>
                {patientPortalUploads.length} transmission{patientPortalUploads.length > 1 ? "s" : ""} reçue{patientPortalUploads.length > 1 ? "s" : ""}
              </span>
            </div>

            <div className="p-3">
              {patientPortalUploads.length === 0 ? (
                <div className="text-center py-5">
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "rgba(2, 132, 199, 0.08)",
                      color: "#0284c7",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      marginBottom: "12px",
                    }}
                  >
                    <i className="fa fa-inbox"></i>
                  </div>
                  <h5 className="font-w600 text-dark mb-1">Aucun document ou texte déposé</h5>
                  <p className="text-muted fs-13 mb-0" style={{ maxWidth: "420px", margin: "0 auto" }}>
                    Lorsque le patient dépose un document (analyse, radio, compte-rendu) ou rédige un texte depuis son espace patient public, il apparaîtra ici avec son contenu intégral.
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {patientPortalUploads.map((doc) => {
                    const isImg =
                      doc.isImage ||
                      ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes((doc.type || doc.fileType || "").toUpperCase()) ||
                      (doc.fileDataUrl && doc.fileDataUrl.startsWith("data:image"));

                    return (
                      <div
                        key={doc.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderLeft: "4px solid #0284c7",
                          borderRadius: "12px",
                          padding: "16px",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* En-tête de la transmission */}
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                          <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                              <h5 className="font-w700 text-dark mb-0 fs-15">{doc.title}</h5>
                              <span className="badge badge-primary light fs-11" style={{ borderRadius: "6px" }}>
                                {doc.category || "Autre"}
                              </span>
                              {!doc.isRead && doc.status !== "Lu par le médecin" && doc.status !== "Lu" ? (
                                <span
                                  className="badge badge-danger"
                                  onClick={() => handleMarkDocRead(doc)}
                                  style={{
                                    backgroundColor: "#ef4444",
                                    color: "#ffffff",
                                    borderRadius: "6px",
                                    padding: "3px 8px",
                                    fontSize: "11px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                  title="Cliquer pour marquer comme lu"
                                >
                                  <i className="fa fa-envelope"></i>
                                  <span>Nouveau (Non lu)</span>
                                </span>
                              ) : (
                                <span
                                  className="badge badge-success light"
                                  style={{ borderRadius: "6px", fontSize: "11px" }}
                                >
                                  <i className="fa fa-check me-1"></i> Lu par le médecin
                                </span>
                              )}
                            </div>
                            <div className="text-muted fs-12 mt-1">
                              <i className="fa fa-calendar-alt me-1 text-primary"></i> {doc.date}
                              {doc.author && (
                                <>
                                  <span className="mx-2">•</span>
                                  <i className="fa fa-user me-1 text-secondary"></i> {doc.author}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Boutons d'action */}
                          <div className="d-flex align-items-center gap-2">
                            {!doc.isRead && doc.status !== "Lu par le médecin" && doc.status !== "Lu" && (
                              <button
                                type="button"
                                className="btn btn-xs btn-outline-success d-flex align-items-center gap-1"
                                onClick={() => handleMarkDocRead(doc)}
                                title="Marquer ce message/document comme lu"
                              >
                                <i className="fa fa-check"></i>
                                <span>Marquer comme lu</span>
                              </button>
                            )}
                            {(doc.fileDataUrl || doc.filePath) && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline-info d-flex align-items-center gap-1"
                                  onClick={() => handleViewDoc(doc)}
                                  title="Visualiser le document"
                                >
                                  <i className="fa fa-eye"></i>
                                  <span>Voir</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline-primary d-flex align-items-center gap-1"
                                  onClick={() => handleDownloadDoc(doc)}
                                  title="Télécharger le fichier"
                                >
                                  <i className="fa fa-download"></i>
                                  <span>Télécharger</span>
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-danger"
                              onClick={() => handleDeleteDocument(doc.id, doc.title)}
                              title="Supprimer cette transmission"
                            >
                              <i className="fa fa-trash"></i>
                            </button>
                          </div>
                        </div>

                        {/* Zone Texte / Message rédigé par le patient */}
                        {doc.notes ? (
                          <div
                            style={{
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              borderRadius: "10px",
                              padding: "12px 14px",
                              marginTop: "10px",
                              marginBottom: doc.filePath || doc.fileDataUrl ? "10px" : "0",
                            }}
                          >
                            <div className="d-flex align-items-center gap-2 text-success font-w600 fs-12 mb-1">
                              <i className="fa fa-comment-dots"></i>
                              <span>Message / Remarque du patient :</span>
                            </div>
                            <div
                              style={{
                                color: "#1e293b",
                                fontSize: "13.5px",
                                whiteSpace: "pre-wrap",
                                lineHeight: "1.5",
                              }}
                            >
                              {doc.notes}
                            </div>
                          </div>
                        ) : null}

                        {/* Fichier joint ou indicateur */}
                        {doc.fileDataUrl || doc.filePath ? (
                          <div
                            className="d-flex align-items-center gap-3 p-2 px-3 mt-2"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                            }}
                          >
                            {isImg ? (
                              <div
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "6px",
                                  overflow: "hidden",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                                onClick={() => handleViewDoc(doc)}
                                title="Agrandir l'image"
                              >
                                <img
                                  src={doc.fileDataUrl || doc.filePath}
                                  alt=""
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: "38px",
                                  height: "38px",
                                  borderRadius: "6px",
                                  background: "#eff6ff",
                                  color: "#2563eb",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "16px",
                                  flexShrink: 0,
                                }}
                              >
                                <i className="fa fa-file-pdf"></i>
                              </div>
                            )}

                            <div className="flex-grow-1 min-w-0">
                              <div className="font-w600 text-dark fs-13 text-truncate">
                                {doc.fileName || doc.title}
                              </div>
                              <small className="text-muted fs-11">
                                {doc.fileSize || "Fichier joint"} • {doc.type || doc.fileType || "Document"}
                              </small>
                            </div>
                          </div>
                        ) : (
                          !doc.notes && (
                            <div className="text-muted fs-12 fst-italic mt-2">
                              Transmission textuelle sans document joint
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Prévisualisation & Impression Officielle d'Ordonnance */}
      <PrescriptionPreviewModal
        show={!!selectedPrescription}
        onHide={() => setSelectedPrescription(null)}
        prescription={selectedPrescription}
      />

      {/* Modal Prévisualisation & Impression Officielle Compte-Rendu Échographique */}
      <EchoReportPrintModal
        show={!!selectedEchoConsultation}
        onHide={() => setSelectedEchoConsultation(null)}
        consultation={selectedEchoConsultation}
      />

      {/* Lightbox / Modal d'Aperçu Photo et Document */}
      {previewingDoc && (
        <Modal
          show={!!previewingDoc}
          onHide={() => setPreviewingDoc(null)}
          centered
          size="lg"
        >
          <div className="modal-header border-0 pb-0">
            <div>
              <h5 className="modal-title font-w700 text-dark mb-0">
                {previewingDoc.title}
              </h5>
              <small className="text-muted">
                {previewingDoc.category} • {previewingDoc.date} • {previewingDoc.author}
              </small>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setPreviewingDoc(null)}
            ></button>
          </div>
          <div className="modal-body text-center p-4">
            {previewingDoc.notes && (
              <div
                style={{
                  textAlign: "left",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderLeft: "4px solid #16a34a",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  whiteSpace: "pre-wrap",
                  fontSize: "13.5px",
                  color: "#1e293b",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ fontWeight: "700", marginBottom: "6px", color: "#16a34a", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <i className="fa fa-comment-dots me-1"></i> Message / Texte écrit par le patient :
                </div>
                {previewingDoc.notes}
              </div>
            )}
            {previewingDoc.fileDataUrl && (previewingDoc.isImage || ["JPG", "JPEG", "PNG", "WEBP"].includes((previewingDoc.type || "").toUpperCase())) ? (
              <img
                src={previewingDoc.fileDataUrl}
                alt={previewingDoc.title}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  objectFit: "contain",
                  borderRadius: "10px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                }}
              />
            ) : (
              <div className="p-5 bg-light rounded text-center">
                <i className="fa fa-file-pdf fs-48 text-danger mb-3 d-block"></i>
                <h6 className="font-w600 text-dark">{previewingDoc.title}</h6>
                <p className="text-muted fs-13 mb-3">Fichier document {previewingDoc.type || "PDF"}</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownloadDoc(previewingDoc)}
                >
                  <i className="fa fa-download me-1"></i> Télécharger le document
                </button>
              </div>
            )}
          </div>
          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setPreviewingDoc(null)}
            >
              Fermer
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleDownloadDoc(previewingDoc)}
            >
              <i className="fa fa-download me-1"></i> Télécharger
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PatientDetailsCabinet;

