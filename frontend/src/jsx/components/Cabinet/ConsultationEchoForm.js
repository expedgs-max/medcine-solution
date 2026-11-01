import React, { useState, useEffect, useRef } from "react";
import { Button, Modal } from "react-bootstrap";
import CreatableSelect from "react-select/creatable";
import Swal from "sweetalert2";
import WheelDatePicker from "./WheelDatePicker";
import ApiService from "../../../services/ApiService";
import { initialMedications } from "../../../services/CabinetData";

/**
 * Composant de recherche et sélection de médicament en temps réel (identique à admin/ordonnances)
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
                  <div className="font-w600 text-dark fs-13">{m.name}</div>
                  {m.defaultPosology && (
                    <small className="text-muted fs-11">
                      {m.defaultPosology}
                    </small>
                  )}
                </div>
                <span className="badge badge-sm badge-light text-primary fs-11">
                  Sélectionner
                </span>
              </div>
            ))}
          </div>
          {query && !exactMatch && (
            <div
              className="px-3 py-2 text-muted fs-11 bg-light border-top"
              style={{ fontStyle: "italic" }}
            >
              <i className="fa fa-info-circle me-1"></i>
              Nouveau médicament libre : "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
};

// Formules médicales de l'échographie
export const lccToAge = (mm) => {
  if (!mm || mm <= 0) return "";
  const days = Math.round(8.052 * Math.sqrt((mm / 10) * 1.037) + 23.73);
  return `${Math.floor(days / 7)} SA + ${days % 7} j`;
};

export const calcHadlock = (bip, pc, ca, lf) => {
  const BPD = bip ? parseFloat(bip) / 10 : null;
  const HC = pc ? parseFloat(pc) / 10 : null;
  const AC = ca ? parseFloat(ca) / 10 : null;
  const FL = lf ? parseFloat(lf) / 10 : null;
  if (!BPD || !HC || !AC || !FL) return null;
  const log10 =
    1.3596 +
    0.0064 * HC +
    0.0424 * AC +
    0.174 * FL +
    0.00061 * BPD * AC -
    0.00386 * AC * FL;
  return Math.round(Math.pow(10, log10));
};

export const calcAgeFromDate = (ddn) => {
  if (!ddn) return "";
  const today = new Date();
  const d = new Date(ddn);
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age > 0 ? `${age} ans` : "";
};

export const calcTermeDDR = (ddr) => {
  if (!ddr) return "";
  const diff = Math.floor((new Date() - new Date(ddr)) / 86400000);
  if (diff < 0 || diff > 320) return "";
  return `${Math.floor(diff / 7)} SA + ${diff % 7} j`;
};

export const calcDDRC = (sa, j, dateRef) => {
  const saNum = parseInt(sa);
  const jNum = parseInt(j) || 0;
  if (!saNum || !dateRef || isNaN(saNum)) return { termeCorr: "", ddrcVal: "" };
  const termeCorr = `${saNum} SA + ${jNum} j`;
  const ref = new Date(dateRef);
  ref.setDate(ref.getDate() - (saNum * 7 + jNum));
  const ddrcVal =
    String(ref.getDate()).padStart(2, "0") +
    "/" +
    String(ref.getMonth() + 1).padStart(2, "0") +
    "/" +
    ref.getFullYear();
  return { termeCorr, ddrcVal };
};

const DEFAULT_PRESELECTS = {
  // OB 1
  ob1_nbemb: "1",
  ob1_vita: "Positive",
  ob1_cn_sel: "Normale (< 3 mm)",
  ob1_osnasal: "Présent",
  ob1_ductus: "Normal",
  ob1_tropho: "Diffus, bien inséré",
  ob1_uterus: "Normal",
  ob1_annexes: "Libres",
  // OB 2
  ob2_vita: "Positive",
  ob2_pres: "Céphalique",
  ob2_crane: "Normal",
  ob2_face: "Normale",
  ob2_coeur: "4 cavités d'aspect normal",
  ob2_thorax: "Normal",
  ob2_abdo: "Normal",
  ob2_rachis: "Normal",
  ob2_membres: "Normaux",
  ob2_paroi: "Intègre",
  ob2_placenta: "Postérieur",
  ob2_la: "En quantité normale",
  ob2_col: "Long et fermé",
  // OB 3
  ob3_vita: "Positive",
  ob3_pres: "Céphalique",
  ob3_placenta: "Postérieur",
  ob3_maturite: "Grade I",
  ob3_la: "En quantité normale",
  ob3_dop_ombi: "Normal",
  ob3_dop_acm: "Normal",
  // GYN
  gyn_voie: "Sus-abdominale",
  gyn_vessie: "En réplétion suffisante",
  gyn_ut_pos: "Antéversé",
  gyn_ut_cont: "Réguliers",
  gyn_ut_echo: "Homogène",
  gyn_myometre: "Normal",
  gyn_endo_lv: "Centrée",
  gyn_endo_asp: "Normal",
  gyn_od_asp: "Normal",
  gyn_og_asp: "Normal",
  gyn_col: "Normal",
  gyn_douglas: "Libre",
  // GG T1
  ggt1_chorio: "Bichoriale biamniotique (BCBA)",
  ggt1_a_vita: "Positive",
  ggt1_a_cn_sel: "Normale (< 3 mm)",
  ggt1_a_osn: "Présent",
  ggt1_b_vita: "Positive",
  ggt1_b_cn_sel: "Normale (< 3 mm)",
  ggt1_b_osn: "Présent",
  ggt1_tropho: "Bien insérés",
  ggt1_uterus: "Normal",
  ggt1_annexes: "Libres",
  // GG T2-T3
  ggt23_chorio: "Bichoriale biamniotique (BCBA)",
  ggt23_a_vita: "Positive",
  ggt23_a_pres: "Céphalique",
  ggt23_a_pla: "Postérieur",
  ggt23_a_la: "Normal",
  ggt23_a_dop_o: "Normal",
  ggt23_a_dop_acm: "Normal",
  ggt23_b_vita: "Positive",
  ggt23_b_pres: "Siège",
  ggt23_b_pla: "Antérieur",
  ggt23_b_la: "Normal",
  ggt23_b_dop_o: "Normal",
  ggt23_b_dop_acm: "Normal",
};

const ConsultationEchoForm = ({
  patients = [],
  medications = [],
  initialPatientId = null,
  initialDoctor = {},
  onSave,
  onPrintEcho,
  onPrintPrescription,
  onCancel,
}) => {
  // Sélection du type d'examen
  const [examType, setExamType] = useState("ob2");

  // Données Patiente
  const [patientId, setPatientId] = useState(
    initialPatientId ? String(initialPatientId) : (patients[0]?.id ? String(patients[0].id) : "1")
  );
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [ddn, setDdn] = useState("");
  const [dateExam, setDateExam] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [ddr, setDdr] = useState("");
  const [ddrcSa, setDdrcSa] = useState("");
  const [ddrcJ, setDdrcJ] = useState("");
  const [ddrcDate, setDdrcDate] = useState("");

  // Antécédents
  const [chkGp, setChkGp] = useState(false);
  const [gestite, setGestite] = useState("");
  const [parite, setParite] = useState("");
  const [chkCesar, setChkCesar] = useState(false);
  const [nbCesar, setNbCesar] = useState("1");
  const [chkAvb, setChkAvb] = useState(false);
  const [nbAvb, setNbAvb] = useState("1");
  const [chkFc, setChkFc] = useState(false);
  const [nbFc, setNbFc] = useState("1");
  const [chkHta, setChkHta] = useState(false);
  const [chkDiabete, setChkDiabete] = useState(false);
  const [chkAutresAtcd, setChkAutresAtcd] = useState(false);
  const [autresAtcd, setAutresAtcd] = useState("");

  // Données des examens (valeurs & champs autre)
  const [formData, setFormData] = useState({ ...DEFAULT_PRESELECTS });
  const [autreInputs, setAutreInputs] = useState({});

  // Prescription Médicale (Ordonnance intégrée & Popup Modal)
  const [showPrescription, setShowPrescription] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [patientInputSearch, setPatientInputSearch] = useState("");
  const [localMedications, setLocalMedications] = useState(
    medications && medications.length > 0 ? medications : initialMedications
  );

  useEffect(() => {
    if (medications && medications.length > 0) {
      setLocalMedications(medications);
    } else {
      ApiService.getMedications()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setLocalMedications(data);
          }
        })
        .catch(() => {});
    }
  }, [medications]);

  const [prescriptionItems, setPrescriptionItems] = useState([
    {
      medication: "",
      dosage: "",
      posology: "1 fois par jour",
      duration: "5 jours",
      renewable: "Non renouvelable",
    },
  ]);

  // Cotation
  const [billingCode, setBillingCode] = useState(
    "Échographie obstétrique (4 000 DA)"
  );

  // Auto-remplissage patiente
  useEffect(() => {
    if (patientId === "guest") {
      setNom("Patiente");
      setPrenom("De Passage");
      setDdn("");
      return;
    }
    if (patients && patients.length > 0) {
      const p = patients.find((pat) => String(pat.id) === String(patientId)) || patients[0];
      if (p) {
        setNom(p.lastName || "");
        setPrenom(p.firstName || "");
        setDdn(p.dob || "");
      }
    }
  }, [patientId, patients]);

  // Synchronisation Cotation selon l'examen
  useEffect(() => {
    if (examType === "gyn") {
      setBillingCode("Échographie pelvienne (3 500 DA)");
    } else if (examType === "ggt1" || examType === "ggt23") {
      setBillingCode("Échographie obstétrique gémellaire (4 500 DA)");
    } else {
      setBillingCode("Échographie obstétrique (4 000 DA)");
    }
  }, [examType]);

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAutreChange = (key, value) => {
    setAutreInputs((prev) => ({ ...prev, [key]: value }));
  };

  // Calculs réactifs
  const ageDisplay = calcAgeFromDate(ddn);
  const termeDdrDisplay = calcTermeDDR(ddr);
  const { termeCorr: termeDdrcDisplay, ddrcVal: ddrcValDisplay } = calcDDRC(
    ddrcSa,
    ddrcJ,
    ddrcDate
  );

  // LCC age
  const ob1LccAge = lccToAge(formData.ob1_lcc);
  const ggt1ALccAge = lccToAge(formData.ggt1_a_lcc);
  const ggt1BLccAge = lccToAge(formData.ggt1_b_lcc);

  // Poids Hadlock
  const ob2Poids = calcHadlock(
    formData.ob2_bip,
    formData.ob2_pc,
    formData.ob2_ca,
    formData.ob2_lf
  );
  const ob3Poids = calcHadlock(
    formData.ob3_bip,
    formData.ob3_pc,
    formData.ob3_ca,
    formData.ob3_lf
  );
  const ggt23APoids = calcHadlock(
    formData.ggt23_a_bip,
    formData.ggt23_a_pc,
    formData.ggt23_a_ca,
    formData.ggt23_a_lf
  );
  const ggt23BPoids = calcHadlock(
    formData.ggt23_b_bip,
    formData.ggt23_b_pc,
    formData.ggt23_b_ca,
    formData.ggt23_b_lf
  );

  // Discordance
  const discordance =
    ggt23APoids && ggt23BPoids
      ? Math.round(
          ((Math.max(ggt23APoids, ggt23BPoids) -
            Math.min(ggt23APoids, ggt23BPoids)) /
            Math.max(ggt23APoids, ggt23BPoids)) *
            100
        )
      : null;

  // Insertion de conclusion type
  const handleInsertConclusion = (targetKey, type) => {
    const terme = termeDdrDisplay || "__ SA + __ j";
    let text = "";
    if (type === "ob") {
      text = `Grossesse monofoetale évolutive estimée à ${terme}.`;
    } else if (type === "gg") {
      text = `Grossesse gémellaire évolutive estimée à ${terme}.`;
    } else if (type === "gyn") {
      text = "Échographie pelvienne sans anomalie visible.";
    }
    handleFieldChange(targetKey, text);
  };

  // Gestion du patient dans le popup Modal
  const patientOptions = [
    {
      value: "guest",
      label: "Patiente de passage (sans dossier)",
      patient: { id: "guest", firstName: "Patiente", lastName: "De Passage" },
    },
    ...patients.map((p) => ({
      value: String(p.id),
      label: `${p.lastName || ""} ${p.firstName || ""} (DOS-${p.dossierNumber || p.id})`.trim(),
      patient: p,
    })),
  ];

  const selectedPatientOption =
    patientId === "guest"
      ? patientOptions[0]
      : patientOptions.find((opt) => String(opt.value) === String(patientId)) || {
          value: patientId,
          label: `${nom} ${prenom}`.trim() || "Patiente sélectionnée",
        };

  const handleSelectPatientInModal = (selected) => {
    if (!selected) {
      setPatientId("guest");
      setNom("Patiente");
      setPrenom("De Passage");
      setDdn("");
      setPatientInputSearch("");
      return;
    }
    if (selected.value === "guest") {
      setPatientId("guest");
      setNom("Patiente");
      setPrenom("De Passage");
      setDdn("");
      setPatientInputSearch("");
    } else if (selected.patient) {
      setPatientId(String(selected.patient.id || selected.value));
      setNom(selected.patient.lastName || "");
      setPrenom(selected.patient.firstName || "");
      setDdn(selected.patient.dob || "");
      setPatientInputSearch("");
    } else {
      setPatientId("guest");
      setNom(selected.label || selected.value);
      setPrenom("");
      setDdn("");
      setPatientInputSearch("");
    }
  };

  // Gestion des médicaments de l'ordonnance
  const handleAddMed = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      { medication: "", dosage: "", posology: "1 fois par jour", duration: "5 jours", renewable: "Non renouvelable" },
    ]);
  };

  const handleMedChange = (index, field, val) => {
    const updated = [...prescriptionItems];
    updated[index][field] = val;
    setPrescriptionItems(updated);
  };

  const handleRemoveMed = (index) => {
    if (prescriptionItems.length > 1) {
      setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
    }
  };

  const handleSelectPredefinedMed = (index, medName) => {
    const found = localMedications.find(
      (m) => (m.name || "").toLowerCase() === (medName || "").toLowerCase()
    );
    const updated = [...prescriptionItems];
    if (found) {
      updated[index].medication = found.name;
      if (found.defaultPosology) updated[index].posology = found.defaultPosology;
      if (found.dosage) updated[index].dosage = found.dosage;
      if (found.defaultDuration) updated[index].duration = found.defaultDuration;
    } else {
      updated[index].medication = medName;
    }
    setPrescriptionItems(updated);
  };

  const handleConfirmPrescriptionModal = (e) => {
    if (e) e.preventDefault();
    const hasValidMed = prescriptionItems.some(
      (item) => item.medication && item.medication.trim() !== ""
    );
    if (!hasValidMed) {
      Swal.fire({
        icon: "warning",
        title: "Médicament requis",
        text: "Veuillez renseigner au moins un médicament pour valider l'ordonnance.",
        confirmButtonColor: "#1e60d5",
      });
      return;
    }
    setShowPrescription(true);
    setShowPrescriptionModal(false);
    Swal.fire({
      icon: "success",
      title: "Ordonnance rattachée !",
      text: `${prescriptionItems.filter((i) => i.medication && i.medication.trim()).length} médicament(s) rattaché(s) à la consultation échographique.`,
      timer: 1800,
      showConfirmButton: false,
    });
  };

  // Construction de l'objet de consultation et ordonnance pour sauvegarde ou impression
  const buildCurrentData = () => {
    const selectedPatient =
      patients.find((p) => String(p.id) === String(patientId)) || patients[0];

    // Synthèse de conclusion et diagnostic
    let conclusionText = "";
    if (examType === "ob1") conclusionText = formData.ob1_conclu || "Échographie T1 normale";
    else if (examType === "ob2") conclusionText = formData.ob2_conclu || "Échographie T2 normale";
    else if (examType === "ob3") conclusionText = formData.ob3_conclu || "Échographie T3 normale";
    else if (examType === "gyn") conclusionText = formData.gyn_conclu || "Échographie pelvienne normale";
    else if (examType === "ggt1") conclusionText = formData.ggt1_conclu || "Grossesse gémellaire T1 normale";
    else if (examType === "ggt23") conclusionText = formData.ggt23_conclu || "Grossesse gémellaire T2/T3";

    const titles = {
      ob1: "Échographie Obstétricale — 1er Trimestre",
      ob2: "Échographie Obstétricale — 2ème Trimestre",
      ob3: "Échographie Obstétricale — 3ème Trimestre",
      gyn: "Échographie Gynécologique",
      ggt1: "Grossesse Gémellaire — 1er Trimestre",
      ggt23: "Grossesse Gémellaire — 2ème / 3ème Trimestre",
    };

    const hasPrescription =
      showPrescription &&
      prescriptionItems.some((i) => i.medication && i.medication.trim());
    const validItems = prescriptionItems.filter((i) => i.medication && i.medication.trim());

    const prescData = hasPrescription
      ? {
          id: Date.now(),
          prescriptionNumber: `ORD-${new Date().getFullYear()}-009${Math.floor(Math.random() * 90) + 10}`,
          patientId: selectedPatient?.id || 1,
          patientName: `${selectedPatient?.firstName || prenom} ${selectedPatient?.lastName || nom}`,
          date: dateExam,
          validity: "3 mois",
          ald: false,
          doctorName: initialDoctor.name || "Dr N. BELBACHIR OULD HENNIA",
          items: validItems,
          notes: conclusionText,
          validated: true,
        }
      : null;

    const isGuest = patientId === "guest" || !selectedPatient;
    const cleanGuestName = `${nom} ${prenom}`.replace(/\s*\(sc\)/gi, "").trim();
    const guestDisplayName = cleanGuestName || "Patiente De Passage";
    const payload = {
      patientId: isGuest ? null : (selectedPatient?.id || null),
      patientName: isGuest ? guestDisplayName : `${selectedPatient?.firstName || prenom} ${selectedPatient?.lastName || nom}`.replace(/\s*\(sc\)/gi, "").trim(),
      isGuest,
      date: dateExam,
      time: `${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, "0")}`,
      reason: titles[examType] || "Échographie",
      billingCode,
      examType,
      patientDetails: {
        nom,
        prenom,
        ddn,
        age: ageDisplay,
        ddr,
        termeDdr: termeDdrDisplay,
        ddrc: { sa: ddrcSa, j: ddrcJ, date: ddrcDate, termeCorr: termeDdrcDisplay, ddrcVal: ddrcValDisplay },
      },
      atcd: {
        gestite: chkGp ? gestite : null,
        parite: chkGp ? parite : null,
        cesarienne: chkCesar ? nbCesar : null,
        avb: chkAvb ? nbAvb : null,
        faussesCouches: chkFc ? nbFc : null,
        hta: chkHta,
        diabete: chkDiabete,
        autres: chkAutresAtcd ? autresAtcd : null,
      },
      echoData: { ...formData, autreInputs },
      calculated: {
        ob1LccAge,
        ob2Poids,
        ob3Poids,
        ggt1ALccAge,
        ggt1BLccAge,
        ggt23APoids,
        ggt23BPoids,
        discordance,
      },
      vitals: {
        bp: "120/80",
        weight: "65",
        ddr: ddr || "-",
        terme: termeDdrDisplay || (examType === "gyn" ? "-" : "En cours"),
      },
      diagnosis: conclusionText,
      recommendations: "Suivi obstétrico-gynécologique régulier conforme aux protocoles.",
      examFindings: `Examen clinique et compte-rendu échographique (${titles[examType]}).`,
      echoFindings: conclusionText,
      prescriptionCreated: hasPrescription,
      prescriptionData: prescData,
      status: "Clôturée",
    };

    return { payload, prescData };
  };

  // Soumission
  const handleSubmit = (e) => {
    e.preventDefault();
    const { payload, prescData } = buildCurrentData();
    if (onSave) {
      onSave(payload, prescData);
    }
  };

  // Impression Échographie (ne ferme pas, n'enregistre pas)
  const handlePrintEchoOnly = () => {
    const { payload } = buildCurrentData();
    if (onPrintEcho) {
      onPrintEcho(payload);
    }
  };

  // Impression Ordonnance (ne ferme pas, n'enregistre pas)
  const handlePrintPrescriptionOnly = () => {
    const { prescData } = buildCurrentData();
    const selectedPatient =
      patients.find((p) => String(p.id) === String(patientId)) || patients[0];

    const finalPresc =
      prescData || {
        id: Date.now(),
        prescriptionNumber: `ORD-${new Date().getFullYear()}-0099`,
        patientId: selectedPatient?.id || 1,
        patientName: `${selectedPatient?.firstName || prenom} ${selectedPatient?.lastName || nom}`,
        date: dateExam,
        validity: "3 mois",
        ald: false,
        doctorName: initialDoctor.name || "Dr N. BELBACHIR OULD HENNIA",
        items: [
          {
            medication: "SPASFON comprimé",
            dosage: "80 mg",
            posology: "1 comprimé 3 fois par jour si spasmes ou douleurs",
            duration: "5 jours",
            renewable: "Non renouvelable",
          },
        ],
        notes: "Respecter la posologie.",
        validated: true,
      };

    if (onPrintPrescription) {
      onPrintPrescription(finalPresc);
    }
  };

  return (
    <div className="card mb-4 border border-primary shadow-sm" id="consultation-form-card">
      <style>{`
        .crecho-header {
          border-bottom: 2px solid #1a3a5c;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .crecho-header table { width: 100%; border-collapse: collapse; }
        .crecho-header td { vertical-align: middle; }
        .crecho-header .fr-name { font-size: 15px; font-weight: bold; color: #1a3a5c; }
        .crecho-header .fr-sub { font-size: 12px; color: #2d6a9f; font-style: italic; }
        .crecho-header .ar-name { font-size: 16px; font-weight: bold; color: #1a3a5c; text-align: right; direction: rtl; }
        .crecho-header .ar-sub-txt { font-size: 13px; color: #2d6a9f; text-align: right; direction: rtl; }
        .crecho-doc-title {
          text-align: center;
          font-size: 15px;
          font-weight: bold;
          color: #1a3a5c;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 6px 0 12px;
        }
        .crecho-zone {
          border: 1px solid #c0d3e8;
          border-radius: 5px;
          background: #f8fbff;
          padding: 10px 14px;
          margin-bottom: 12px;
        }
        .crecho-zone-title {
          font-size: 12px;
          font-weight: bold;
          color: #1a3a5c;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid #c0d3e8;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        .crecho-field-group {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .crecho-lbl {
          font-weight: 600;
          color: #1a3a5c;
          font-size: 12.5px;
          white-space: nowrap;
        }
        .crecho-sub-title {
          font-size: 12px;
          font-weight: bold;
          color: #2d6a9f;
          margin: 10px 0 6px;
          border-bottom: 1px dashed #b0c4d8;
          padding-bottom: 2px;
        }
        .crecho-twin-col {
          flex: 1;
          border: 1px solid #c0d3e8;
          border-radius: 6px;
          padding: 10px 12px;
          background: #ffffff;
        }
        .crecho-twin-title {
          font-weight: bold;
          color: #fff;
          background: #1a3a5c;
          text-align: center;
          padding: 4px 8px;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 12.5px;
        }
        .crecho-zone select,
        .crecho-zone input,
        .crecho-field-group select,
        .crecho-field-group input {
          height: 34px !important;
          min-height: 34px !important;
          max-height: 34px !important;
          line-height: 1.4 !important;
          padding: 4px 8px !important;
          font-size: 13px !important;
          border: 1.5px solid #cbd5e1 !important;
          border-radius: 6px !important;
          background-color: #ffffff !important;
          color: #0f172a !important;
          box-sizing: border-box !important;
          vertical-align: middle !important;
        }
        .crecho-field-group select {
          padding-right: 22px !important;
        }
        .crecho-radio-pill {
          cursor: pointer;
          font-weight: 600;
          color: #334155;
          padding: 7px 16px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          transition: all 0.15s ease-in-out;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          user-select: none;
          font-size: 13px;
        }
        .crecho-radio-pill:hover {
          border-color: #3b82f6;
          color: #1d4ed8;
          background: #eff6ff;
        }
        .crecho-radio-pill.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
        }
        .term-badge-val {
          font-weight: bold;
          color: #b03a2e;
          font-size: 12.5px;
          min-width: 80px;
        }
        .poids-badge-val {
          font-weight: bold;
          color: #7d3c98;
          font-size: 13px;
          margin: 4px 0;
        }
      `}</style>

      {/* En-tête Médical Officiel */}
      <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
        <div className="w-100">
          <div className="crecho-header">
            <table>
              <tbody>
                <tr>
                  <td>
                    <span className="fr-name">{initialDoctor.name || "Dr N. BELBACHIR OULD HENNIA"}</span>
                    <div className="fr-sub">Médecin Spécialiste en Gynécologie Obstétrique • Échographie</div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <span className="ar-name">الدكتورة ن. بلبشير ولد هنية</span>
                    <div className="ar-sub-txt">طبيبة مختصة في أمراض النساء والتوليد • الفحص بالصدى</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="crecho-doc-title">Compte Rendu Échographique & Consultation Clinique</div>
        </div>
        <button
          type="button"
          className="btn-close align-self-start"
          aria-label="Fermer"
          onClick={onCancel}
        ></button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card-body pt-2">
          {/* Sélection Patiente du Cabinet */}
          <div className="p-3 mb-3 rounded-3 border d-flex align-items-center justify-content-between flex-wrap gap-2" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
            <div className="d-flex align-items-center gap-2 flex-grow-1">
              <span className="crecho-lbl">
                <i className="flaticon-381-user-7 me-1 text-primary"></i> Sélection Patiente :
              </span>
              <select
                className="form-control form-control-sm w-auto flex-grow-1"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              >
                <option value="guest">👤 Patiente De Passage (sans compte / sans dossier)</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.lastName.toUpperCase()} {p.firstName} — {p.fileNumber} (Née le {p.dob || "-"})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* 1. Zone Patiente */}
          <div className="crecho-zone">
            <div className="crecho-zone-title">Informations Patiente</div>
            <div className="row g-2 align-items-center">
              <div className="col-md-3 col-6">
                <div className="crecho-field-group w-100">
                  <span className="crecho-lbl">Nom :</span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="crecho-field-group w-100">
                  <span className="crecho-lbl">Prénom :</span>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="crecho-field-group w-100">
                  <span className="crecho-lbl">DDN :</span>
                  <WheelDatePicker
                    className="form-control form-control-sm"
                    value={ddn}
                    onChange={(e) => setDdn(e.target.value)}
                    title="DATE DE NAISSANCE"
                  />
                  {ageDisplay && (
                    <span className="badge badge-light border ms-1">{ageDisplay}</span>
                  )}
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="crecho-field-group w-100">
                  <span className="crecho-lbl">Date examen :</span>
                  <WheelDatePicker
                    className="form-control form-control-sm"
                    value={dateExam}
                    onChange={(e) => setDateExam(e.target.value)}
                    title="DATE DE L'EXAMEN"
                  />
                </div>
              </div>
            </div>

            {/* Ligne DDR & Terme */}
            <div className="row g-2 align-items-center mt-2 pt-2 border-top">
              <div className="col-md-6 col-12">
                <div className="crecho-field-group">
                  <span className="crecho-lbl">DDR (Dernières règles) :</span>
                  <WheelDatePicker
                    className="form-control form-control-sm"
                    style={{ width: "160px" }}
                    value={ddr}
                    onChange={(e) => setDdr(e.target.value)}
                    title="DATE DES DERNIÈRES RÈGLES"
                  />
                  <span className="crecho-lbl ms-2">→ Terme :</span>
                  <span className="term-badge-val">{termeDdrDisplay || "—"}</span>
                </div>
              </div>
              <div className="col-md-6 col-12">
                <div className="crecho-field-group">
                  <span className="crecho-lbl">Terme écho datation :</span>
                  <input
                    type="number"
                    min="5"
                    max="42"
                    placeholder="SA"
                    className="form-control form-control-sm"
                    style={{ width: "55px" }}
                    value={ddrcSa}
                    onChange={(e) => setDdrcSa(e.target.value)}
                  />
                  <span className="text-muted fs-11">SA +</span>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    placeholder="j"
                    className="form-control form-control-sm"
                    style={{ width: "45px" }}
                    value={ddrcJ}
                    onChange={(e) => setDdrcJ(e.target.value)}
                  />
                  <span className="text-muted fs-11">j le</span>
                  <WheelDatePicker
                    className="form-control form-control-sm"
                    style={{ width: "160px" }}
                    value={ddrcDate}
                    onChange={(e) => setDdrcDate(e.target.value)}
                    title="DATE ÉCHOGRAPHIE"
                  />
                  {ddrcValDisplay && (
                    <span className="text-primary font-w600 fs-12 ms-1">
                      (DDRC : {ddrcValDisplay})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Zone Antécédents */}
          <div className="crecho-zone">
            <div className="crecho-zone-title">Antécédents</div>
            <div className="d-flex flex-wrap gap-3 align-items-center fs-13">
              {/* Gestité / Parité */}
              <div className="d-flex align-items-center gap-1">
                <input
                  type="checkbox"
                  id="chk-gp"
                  checked={chkGp}
                  onChange={(e) => setChkGp(e.target.checked)}
                />
                <label htmlFor="chk-gp" className="crecho-lbl mb-0">Gestité :</label>
                <select
                  className="form-control form-control-sm py-0 px-1"
                  style={{ width: "50px" }}
                  value={gestite}
                  onChange={(e) => setGestite(e.target.value)}
                >
                  <option value="">-</option>
                  {[...Array(11).keys()].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <label className="crecho-lbl mb-0 ms-1">Parité :</label>
                <select
                  className="form-control form-control-sm py-0 px-1"
                  style={{ width: "50px" }}
                  value={parite}
                  onChange={(e) => setParite(e.target.value)}
                >
                  <option value="">-</option>
                  {[...Array(11).keys()].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {chkGp && gestite !== "" && parite !== "" && (
                  <span className="badge badge-primary light ms-1 font-w600">
                    G{gestite}P{parite}
                  </span>
                )}
              </div>

              {/* Césarienne */}
              <div className="d-flex align-items-center gap-1">
                <input
                  type="checkbox"
                  id="chk-cesar"
                  checked={chkCesar}
                  onChange={(e) => setChkCesar(e.target.checked)}
                />
                <label htmlFor="chk-cesar" className="crecho-lbl mb-0">Utérus cicatriciel</label>
                {chkCesar && (
                  <select
                    className="form-control form-control-sm py-0 px-1 ms-1"
                    style={{ width: "55px" }}
                    value={nbCesar}
                    onChange={(e) => setNbCesar(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} cés.</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Accouchement voie basse */}
              <div className="d-flex align-items-center gap-1">
                <input
                  type="checkbox"
                  id="chk-avb"
                  checked={chkAvb}
                  onChange={(e) => setChkAvb(e.target.checked)}
                />
                <label htmlFor="chk-avb" className="crecho-lbl mb-0">AVB</label>
                {chkAvb && (
                  <select
                    className="form-control form-control-sm py-0 px-1 ms-1"
                    style={{ width: "50px" }}
                    value={nbAvb}
                    onChange={(e) => setNbAvb(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Fausses couches */}
              <div className="d-flex align-items-center gap-1">
                <input
                  type="checkbox"
                  id="chk-fc"
                  checked={chkFc}
                  onChange={(e) => setChkFc(e.target.checked)}
                />
                <label htmlFor="chk-fc" className="crecho-lbl mb-0">Fausse(s) couche(s)</label>
                {chkFc && (
                  <select
                    className="form-control form-control-sm py-0 px-1 ms-1"
                    style={{ width: "50px" }}
                    value={nbFc}
                    onChange={(e) => setNbFc(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* HTA & Diabète */}
              <div className="d-flex align-items-center gap-2">
                <label className="d-flex align-items-center gap-1 mb-0 crecho-lbl">
                  <input
                    type="checkbox"
                    checked={chkHta}
                    onChange={(e) => setChkHta(e.target.checked)}
                  />
                  HTA
                </label>
                <label className="d-flex align-items-center gap-1 mb-0 crecho-lbl">
                  <input
                    type="checkbox"
                    checked={chkDiabete}
                    onChange={(e) => setChkDiabete(e.target.checked)}
                  />
                  Diabète
                </label>
              </div>

              {/* Autres */}
              <div className="d-flex align-items-center gap-1">
                <input
                  type="checkbox"
                  id="chk-autres"
                  checked={chkAutresAtcd}
                  onChange={(e) => setChkAutresAtcd(e.target.checked)}
                />
                <label htmlFor="chk-autres" className="crecho-lbl mb-0">Autres ATCD :</label>
                {chkAutresAtcd && (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Préciser..."
                    style={{ width: "160px" }}
                    value={autresAtcd}
                    onChange={(e) => setAutresAtcd(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 3. Sélecteur Type d'Examen */}
          <div className="p-3 mb-3 rounded-3 text-center" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)" }}>
            <span className="crecho-lbl me-3 d-inline-block">Type d'examen :</span>
            <div className="d-inline-flex flex-wrap gap-2 justify-content-center">
              {[
                { id: "ob1", label: "OB 1 (1er Trimestre)" },
                { id: "ob2", label: "OB 2 (Morphologique)" },
                { id: "ob3", label: "OB 3 (3ème Trimestre)" },
                { id: "gyn", label: "GYN (Pelvienne)" },
                { id: "ggt1", label: "GG T1 (Jumeaux T1)" },
                { id: "ggt23", label: "GG T2-T3 (Jumeaux T2/T3)" },
              ].map((t) => (
                <div
                  key={t.id}
                  className={`crecho-radio-pill ${examType === t.id ? "active" : ""}`}
                  onClick={() => setExamType(t.id)}
                >
                  <input
                    type="radio"
                    name="examType"
                    checked={examType === t.id}
                    onChange={() => setExamType(t.id)}
                    className="d-none"
                  />
                  <span>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* SECTION OB 1 : 1er Trimestre */}
          {/* ========================================================= */}
          {examType === "ob1" && (
            <div className="crecho-zone" style={{ borderLeft: "4px solid #1a3a5c" }}>
              <div className="crecho-zone-title">Échographie Obstétricale — 1er Trimestre</div>

              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Nombre d'embryon(s) :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob1_nbemb || "1"}
                      onChange={(e) => handleFieldChange("ob1_nbemb", e.target.value)}
                    >
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option value="autre">Autre</option>
                    </select>
                    {formData.ob1_nbemb === "autre" && (
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Préciser..."
                        style={{ width: "120px" }}
                        value={autreInputs.ob1_nbemb || ""}
                        onChange={(e) => handleAutreChange("ob1_nbemb", e.target.value)}
                      />
                    )}
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Vitalité :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob1_vita || "Positive"}
                      onChange={(e) => handleFieldChange("ob1_vita", e.target.value)}
                    >
                      <option>Positive</option>
                      <option>Négative</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LCC & Robinson */}
              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">LCC :</span>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "70px" }}
                      value={formData.ob1_lcc || ""}
                      onChange={(e) => handleFieldChange("ob1_lcc", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                    <span className="crecho-lbl ms-2">→ Âge gestationnel (Robinson) :</span>
                    <span className="term-badge-val">{ob1LccAge || "—"}</span>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Clarté nucale (CN) :</span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob1_cn || ""}
                      onChange={(e) => handleFieldChange("ob1_cn", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                    <select
                      className="form-control form-control-sm w-auto ms-1"
                      value={formData.ob1_cn_sel || "Normale (< 3 mm)"}
                      onChange={(e) => handleFieldChange("ob1_cn_sel", e.target.value)}
                    >
                      <option>Normale (&lt; 3 mm)</option>
                      <option>Augmentée (≥ 3 mm)</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Os nasal :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob1_osnasal || "Présent"}
                      onChange={(e) => handleFieldChange("ob1_osnasal", e.target.value)}
                    >
                      <option>Présent</option>
                      <option>Absent</option>
                      <option>Non visualisé</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Ductus venosus :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob1_ductus || "Normal"}
                      onChange={(e) => handleFieldChange("ob1_ductus", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Anormal</option>
                      <option>Non visualisé</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Trophoblaste :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob1_tropho || "Diffus, bien inséré"}
                      onChange={(e) => handleFieldChange("ob1_tropho", e.target.value)}
                    >
                      <option>Diffus, bien inséré</option>
                      <option>Bas inséré</option>
                      <option>Décollement marginal</option>
                      <option>Décollement rétroplacentaire</option>
                      <option>Prævia</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Utérus / Annexes :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob1_uterus || "Normal"}
                      onChange={(e) => handleFieldChange("ob1_uterus", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Fibrome(s)</option>
                      <option>Malformation utérine</option>
                    </select>
                    <select
                      className="form-control form-control-sm w-auto ms-1"
                      value={formData.ob1_annexes || "Libres"}
                      onChange={(e) => handleFieldChange("ob1_annexes", e.target.value)}
                    >
                      <option>Annexes libres</option>
                      <option>Kyste ovarien droit</option>
                      <option>Kyste ovarien gauche</option>
                      <option>Corps jaune</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Conclusion OB 1 */}
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="crecho-sub-title mb-0 border-0">Conclusion :</span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-xs"
                    onClick={() => handleInsertConclusion("ob1_conclu", "ob")}
                  >
                    📝 Insérer conclusion type
                  </button>
                </div>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Conclusion..."
                  value={formData.ob1_conclu || ""}
                  onChange={(e) => handleFieldChange("ob1_conclu", e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION OB 2 : Morphologique 2ème Trimestre */}
          {/* ========================================================= */}
          {examType === "ob2" && (
            <div className="crecho-zone" style={{ borderLeft: "4px solid #1a3a5c" }}>
              <div className="crecho-zone-title">Échographie Obstétricale — 2ème Trimestre (Morphologique)</div>

              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Vitalité :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob2_vita || "Positive"}
                      onChange={(e) => handleFieldChange("ob2_vita", e.target.value)}
                    >
                      <option>Positive</option>
                      <option>Négative</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Présentation :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob2_pres || "Céphalique"}
                      onChange={(e) => handleFieldChange("ob2_pres", e.target.value)}
                    >
                      <option>Céphalique</option>
                      <option>Siège</option>
                      <option>Transverse</option>
                      <option>Oblique</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Biométrie Hadlock */}
              <div className="crecho-sub-title">Biométrie Fœtale & Estimation de Poids (Hadlock) :</div>
              <div className="row g-2 align-items-center mb-2">
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">BIP :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob2_bip || ""}
                      onChange={(e) => handleFieldChange("ob2_bip", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">PC :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob2_pc || ""}
                      onChange={(e) => handleFieldChange("ob2_pc", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">CA :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob2_ca || ""}
                      onChange={(e) => handleFieldChange("ob2_ca", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">LF :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob2_lf || ""}
                      onChange={(e) => handleFieldChange("ob2_lf", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">DAT :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob2_dat || ""}
                      onChange={(e) => handleFieldChange("ob2_dat", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
              </div>
              {ob2Poids && (
                <div className="poids-badge-val">
                  <i className="fa fa-calculator me-1"></i> Poids fœtal estimé (Hadlock) : <strong>{ob2Poids} g</strong>
                </div>
              )}

              {/* Morphologie Fœtale */}
              <div className="crecho-sub-title">Morphologie fœtale complète :</div>
              <div className="row g-2 mb-2">
                {[
                  { key: "ob2_crane", label: "Crâne & encéphale", opts: ["Normal", "Ventriculomégalie", "Non visualisé"] },
                  { key: "ob2_face", label: "Face & profil", opts: ["Normale", "Non visualisée"] },
                  { key: "ob2_coeur", label: "Cœur (4 cavités)", opts: ["4 cavités d'aspect normal", "Non visualisé"] },
                  { key: "ob2_thorax", label: "Thorax & poumons", opts: ["Normal", "Non visualisé"] },
                  { key: "ob2_abdo", label: "Abdomen", opts: ["Normal", "Non visualisé"] },
                  { key: "ob2_rachis", label: "Rachis", opts: ["Normal", "Non visualisé"] },
                  { key: "ob2_membres", label: "Membres (4)", opts: ["Normaux", "Non visualisés"] },
                  { key: "ob2_paroi", label: "Paroi abdominale", opts: ["Intègre", "Non visualisée"] },
                ].map((item) => (
                  <div key={item.key} className="col-md-6 col-12">
                    <div className="crecho-field-group w-100 justify-content-between">
                      <span className="crecho-lbl">{item.label} :</span>
                      <select
                        className="form-control form-control-sm w-auto"
                        value={formData[item.key] || item.opts[0]}
                        onChange={(e) => handleFieldChange(item.key, e.target.value)}
                      >
                        {item.opts.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Placenta, Liquide, Col */}
              <div className="row g-2 mb-2 mt-2 pt-2 border-top">
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Placenta :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob2_placenta || "Postérieur"}
                      onChange={(e) => handleFieldChange("ob2_placenta", e.target.value)}
                    >
                      <option>Postérieur</option>
                      <option>Antérieur</option>
                      <option>Fundique</option>
                      <option>Latéral droit</option>
                      <option>Latéral gauche</option>
                      <option>Bas inséré</option>
                      <option>Prævia</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Liquide amniotique :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob2_la || "En quantité normale"}
                      onChange={(e) => handleFieldChange("ob2_la", e.target.value)}
                    >
                      <option>En quantité normale</option>
                      <option>Oligoamnios</option>
                      <option>Hydramnios</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Col utérin :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob2_col || "Long et fermé"}
                      onChange={(e) => handleFieldChange("ob2_col", e.target.value)}
                    >
                      <option>Long et fermé</option>
                      <option>Raccourci</option>
                      <option>Ouvert</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Conclusion OB 2 */}
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="crecho-sub-title mb-0 border-0">Conclusion :</span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-xs"
                    onClick={() => handleInsertConclusion("ob2_conclu", "ob")}
                  >
                    📝 Insérer conclusion type
                  </button>
                </div>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Conclusion..."
                  value={formData.ob2_conclu || ""}
                  onChange={(e) => handleFieldChange("ob2_conclu", e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION OB 3 : 3ème Trimestre */}
          {/* ========================================================= */}
          {examType === "ob3" && (
            <div className="crecho-zone" style={{ borderLeft: "4px solid #1a3a5c" }}>
              <div className="crecho-zone-title">Échographie Obstétricale — 3ème Trimestre & Doppler</div>

              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Vitalité :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob3_vita || "Positive"}
                      onChange={(e) => handleFieldChange("ob3_vita", e.target.value)}
                    >
                      <option>Positive</option>
                      <option>Négative</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Présentation :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob3_pres || "Céphalique"}
                      onChange={(e) => handleFieldChange("ob3_pres", e.target.value)}
                    >
                      <option>Céphalique</option>
                      <option>Siège</option>
                      <option>Transverse</option>
                      <option>Oblique</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Biométrie Hadlock */}
              <div className="crecho-sub-title">Biométrie Fœtale & Estimation de Poids :</div>
              <div className="row g-2 align-items-center mb-2">
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">BIP :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob3_bip || ""}
                      onChange={(e) => handleFieldChange("ob3_bip", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">PC :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob3_pc || ""}
                      onChange={(e) => handleFieldChange("ob3_pc", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">CA :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob3_ca || ""}
                      onChange={(e) => handleFieldChange("ob3_ca", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">LF :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob3_lf || ""}
                      onChange={(e) => handleFieldChange("ob3_lf", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-auto">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">DAT :</span>
                    <input
                      type="number"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.ob3_dat || ""}
                      onChange={(e) => handleFieldChange("ob3_dat", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
              </div>
              {ob3Poids && (
                <div className="poids-badge-val">
                  <i className="fa fa-calculator me-1"></i> Poids fœtal estimé (Hadlock) : <strong>{ob3Poids} g</strong>
                </div>
              )}

              {/* Placenta, Maturité & LA */}
              <div className="row g-2 mb-2">
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Placenta :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob3_placenta || "Postérieur"}
                      onChange={(e) => handleFieldChange("ob3_placenta", e.target.value)}
                    >
                      <option>Postérieur</option>
                      <option>Antérieur</option>
                      <option>Fundique</option>
                      <option>Latéral droit</option>
                      <option>Latéral gauche</option>
                      <option>Bas inséré</option>
                      <option>Prævia</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Maturité (Grannum) :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob3_maturite || "Grade I"}
                      onChange={(e) => handleFieldChange("ob3_maturite", e.target.value)}
                    >
                      <option>Grade 0</option>
                      <option>Grade I</option>
                      <option>Grade II</option>
                      <option>Grade III</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Liquide amniotique :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob3_la || "En quantité normale"}
                      onChange={(e) => handleFieldChange("ob3_la", e.target.value)}
                    >
                      <option>En quantité normale</option>
                      <option>Oligoamnios</option>
                      <option>Hydramnios</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Doppler */}
              <div className="crecho-sub-title">Exploration Doppler :</div>
              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Doppler Ombilical :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob3_dop_ombi || "Normal"}
                      onChange={(e) => handleFieldChange("ob3_dop_ombi", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Résistances augmentées</option>
                      <option>Diastole nulle</option>
                      <option>Reverse flow</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Doppler ACM (Cérébral) :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.ob3_dop_acm || "Normal"}
                      onChange={(e) => handleFieldChange("ob3_dop_acm", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Centralisé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Conclusion OB 3 */}
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="crecho-sub-title mb-0 border-0">Conclusion :</span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-xs"
                    onClick={() => handleInsertConclusion("ob3_conclu", "ob")}
                  >
                    📝 Insérer conclusion type
                  </button>
                </div>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Conclusion..."
                  value={formData.ob3_conclu || ""}
                  onChange={(e) => handleFieldChange("ob3_conclu", e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION GYN : Échographie Gynécologique Pelvienne */}
          {/* ========================================================= */}
          {examType === "gyn" && (
            <div className="crecho-zone" style={{ borderLeft: "4px solid #1a3a5c" }}>
              <div className="crecho-zone-title">Échographie Gynécologique (Pelvienne & Endovaginale)</div>

              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Voie d'abord :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.gyn_voie || "Sus-abdominale"}
                      onChange={(e) => handleFieldChange("gyn_voie", e.target.value)}
                    >
                      <option>Sus-abdominale</option>
                      <option>Endovaginale</option>
                      <option>Sus-abdominale et endovaginale</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Vessie :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.gyn_vessie || "En réplétion suffisante"}
                      onChange={(e) => handleFieldChange("gyn_vessie", e.target.value)}
                    >
                      <option>En réplétion suffisante</option>
                      <option>Vide</option>
                      <option>Examen par voie endovaginale</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Utérus */}
              <div className="crecho-sub-title">Utérus :</div>
              <div className="row g-2 mb-2 align-items-center">
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Position :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.gyn_ut_pos || "Antéversé"}
                      onChange={(e) => handleFieldChange("gyn_ut_pos", e.target.value)}
                    >
                      <option>Antéversé</option>
                      <option>Rétroversé</option>
                      <option>Intermédiaire</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Dimensions :</span>
                    <input
                      type="number"
                      placeholder="L"
                      className="form-control form-control-sm"
                      style={{ width: "50px" }}
                      value={formData.gyn_ut_l || ""}
                      onChange={(e) => handleFieldChange("gyn_ut_l", e.target.value)}
                    />
                    <span>×</span>
                    <input
                      type="number"
                      placeholder="l"
                      className="form-control form-control-sm"
                      style={{ width: "50px" }}
                      value={formData.gyn_ut_w || ""}
                      onChange={(e) => handleFieldChange("gyn_ut_w", e.target.value)}
                    />
                    <span>×</span>
                    <input
                      type="number"
                      placeholder="H"
                      className="form-control form-control-sm"
                      style={{ width: "50px" }}
                      value={formData.gyn_ut_h || ""}
                      onChange={(e) => handleFieldChange("gyn_ut_h", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Myomètre :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.gyn_myometre || "Normal"}
                      onChange={(e) => handleFieldChange("gyn_myometre", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Fibrome sous-muqueux</option>
                      <option>Fibrome intramural</option>
                      <option>Fibrome sous-séreux</option>
                      <option>Adénomyose</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Endomètre */}
              <div className="crecho-sub-title">Endomètre & Cavité :</div>
              <div className="row g-2 mb-2">
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Épaisseur :</span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="mm"
                      className="form-control form-control-sm"
                      style={{ width: "65px" }}
                      value={formData.gyn_endo_ep || ""}
                      onChange={(e) => handleFieldChange("gyn_endo_ep", e.target.value)}
                    />
                    <span className="text-muted fs-11">mm</span>
                  </div>
                </div>
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Ligne de vacuité :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.gyn_endo_lv || "Centrée"}
                      onChange={(e) => handleFieldChange("gyn_endo_lv", e.target.value)}
                    >
                      <option>Centrée</option>
                      <option>Déviée</option>
                      <option>Discontinue</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Aspect :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.gyn_endo_asp || "Normal"}
                      onChange={(e) => handleFieldChange("gyn_endo_asp", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Hyperéchogène</option>
                      <option>Hypoéchogène</option>
                      <option>Polype endocavitaire</option>
                      <option>Hyperplasie</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ovaires Droit & Gauche */}
              <div className="crecho-sub-title">Ovaires & Annexes :</div>
              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="p-2 border rounded bg-white">
                    <span className="crecho-lbl d-block text-primary mb-1">Ovaire droit :</span>
                    <div className="d-flex align-items-center gap-1 mb-1">
                      <input
                        type="number"
                        placeholder="L"
                        className="form-control form-control-sm"
                        style={{ width: "45px" }}
                        value={formData.gyn_od_l || ""}
                        onChange={(e) => handleFieldChange("gyn_od_l", e.target.value)}
                      />
                      <span>×</span>
                      <input
                        type="number"
                        placeholder="l"
                        className="form-control form-control-sm"
                        style={{ width: "45px" }}
                        value={formData.gyn_od_w || ""}
                        onChange={(e) => handleFieldChange("gyn_od_w", e.target.value)}
                      />
                      <span>×</span>
                      <input
                        type="number"
                        placeholder="H"
                        className="form-control form-control-sm"
                        style={{ width: "45px" }}
                        value={formData.gyn_od_h || ""}
                        onChange={(e) => handleFieldChange("gyn_od_h", e.target.value)}
                      />
                      <span className="text-muted fs-11">mm</span>
                    </div>
                    <select
                      className="form-control form-control-sm"
                      value={formData.gyn_od_asp || "Normal"}
                      onChange={(e) => handleFieldChange("gyn_od_asp", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Kyste fonctionnel</option>
                      <option>Kyste organique</option>
                      <option>Follicule dominant</option>
                      <option>SOPK (micropolykystique)</option>
                      <option>Endométriome</option>
                      <option>Hydrosalpinx</option>
                      <option>Kyste dermoïde</option>
                      <option>Non visualisé</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-6 col-12">
                  <div className="p-2 border rounded bg-white">
                    <span className="crecho-lbl d-block text-primary mb-1">Ovaire gauche :</span>
                    <div className="d-flex align-items-center gap-1 mb-1">
                      <input
                        type="number"
                        placeholder="L"
                        className="form-control form-control-sm"
                        style={{ width: "45px" }}
                        value={formData.gyn_og_l || ""}
                        onChange={(e) => handleFieldChange("gyn_og_l", e.target.value)}
                      />
                      <span>×</span>
                      <input
                        type="number"
                        placeholder="l"
                        className="form-control form-control-sm"
                        style={{ width: "45px" }}
                        value={formData.gyn_og_w || ""}
                        onChange={(e) => handleFieldChange("gyn_og_w", e.target.value)}
                      />
                      <span>×</span>
                      <input
                        type="number"
                        placeholder="H"
                        className="form-control form-control-sm"
                        style={{ width: "45px" }}
                        value={formData.gyn_og_h || ""}
                        onChange={(e) => handleFieldChange("gyn_og_h", e.target.value)}
                      />
                      <span className="text-muted fs-11">mm</span>
                    </div>
                    <select
                      className="form-control form-control-sm"
                      value={formData.gyn_og_asp || "Normal"}
                      onChange={(e) => handleFieldChange("gyn_og_asp", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Kyste fonctionnel</option>
                      <option>Kyste organique</option>
                      <option>Follicule dominant</option>
                      <option>SOPK (micropolykystique)</option>
                      <option>Endométriome</option>
                      <option>Hydrosalpinx</option>
                      <option>Kyste dermoïde</option>
                      <option>Non visualisé</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Col & Douglas */}
              <div className="row g-2 mb-2">
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Col utérin :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.gyn_col || "Normal"}
                      onChange={(e) => handleFieldChange("gyn_col", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Kyste(s) de Naboth</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="crecho-field-group">
                    <span className="crecho-lbl">Cul-de-sac de Douglas :</span>
                    <select
                      className="form-control form-control-sm w-auto"
                      value={formData.gyn_douglas || "Libre"}
                      onChange={(e) => handleFieldChange("gyn_douglas", e.target.value)}
                    >
                      <option>Libre</option>
                      <option>Épanchement minime</option>
                      <option>Épanchement modéré</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Conclusion GYN */}
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="crecho-sub-title mb-0 border-0">Conclusion :</span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-xs"
                    onClick={() => handleInsertConclusion("gyn_conclu", "gyn")}
                  >
                    📝 Insérer conclusion type
                  </button>
                </div>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Conclusion..."
                  value={formData.gyn_conclu || ""}
                  onChange={(e) => handleFieldChange("gyn_conclu", e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION GG T1 : Jumeaux 1er Trimestre */}
          {/* ========================================================= */}
          {examType === "ggt1" && (
            <div className="crecho-zone" style={{ borderLeft: "4px solid #1a3a5c" }}>
              <div className="crecho-zone-title">Grossesse Gémellaire — 1er Trimestre</div>

              <div className="crecho-field-group mb-2">
                <span className="crecho-lbl">Chorionicité :</span>
                <select
                  className="form-control form-control-sm w-auto"
                  value={formData.ggt1_chorio || "Bichoriale biamniotique (BCBA)"}
                  onChange={(e) => handleFieldChange("ggt1_chorio", e.target.value)}
                >
                  <option>Bichoriale biamniotique (BCBA)</option>
                  <option>Monochoriale biamniotique (MCBA)</option>
                  <option>Monochoriale monoamniotique (MCMA)</option>
                </select>
              </div>

              <div className="d-flex gap-2 flex-wrap mb-2">
                {/* Fœtus A */}
                <div className="crecho-twin-col">
                  <div className="crecho-twin-title">Fœtus A</div>
                  <div className="mb-2">
                    <span className="crecho-lbl fs-12">Vitalité :</span>
                    <select
                      className="form-control form-control-sm"
                      value={formData.ggt1_a_vita || "Positive"}
                      onChange={(e) => handleFieldChange("ggt1_a_vita", e.target.value)}
                    >
                      <option>Positive</option>
                      <option>Négative</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <span className="crecho-lbl fs-12">LCC :</span>
                    <div className="d-flex align-items-center gap-1">
                      <input
                        type="number"
                        placeholder="mm"
                        className="form-control form-control-sm"
                        style={{ width: "65px" }}
                        value={formData.ggt1_a_lcc || ""}
                        onChange={(e) => handleFieldChange("ggt1_a_lcc", e.target.value)}
                      />
                      <span className="text-muted fs-11">mm</span>
                    </div>
                    {ggt1ALccAge && (
                      <span className="term-badge-val d-block mt-1">→ {ggt1ALccAge}</span>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="crecho-lbl fs-12">Clarté nucale (CN) :</span>
                    <select
                      className="form-control form-control-sm"
                      value={formData.ggt1_a_cn_sel || "Normale (< 3 mm)"}
                      onChange={(e) => handleFieldChange("ggt1_a_cn_sel", e.target.value)}
                    >
                      <option>Normale (&lt; 3 mm)</option>
                      <option>Augmentée (≥ 3 mm)</option>
                    </select>
                  </div>
                  <div>
                    <span className="crecho-lbl fs-12">Os nasal :</span>
                    <select
                      className="form-control form-control-sm"
                      value={formData.ggt1_a_osn || "Présent"}
                      onChange={(e) => handleFieldChange("ggt1_a_osn", e.target.value)}
                    >
                      <option>Présent</option>
                      <option>Absent</option>
                    </select>
                  </div>
                </div>

                {/* Fœtus B */}
                <div className="crecho-twin-col">
                  <div className="crecho-twin-title">Fœtus B</div>
                  <div className="mb-2">
                    <span className="crecho-lbl fs-12">Vitalité :</span>
                    <select
                      className="form-control form-control-sm"
                      value={formData.ggt1_b_vita || "Positive"}
                      onChange={(e) => handleFieldChange("ggt1_b_vita", e.target.value)}
                    >
                      <option>Positive</option>
                      <option>Négative</option>
                    </select>
                  </div>
                  <div className="mb-2">
                    <span className="crecho-lbl fs-12">LCC :</span>
                    <div className="d-flex align-items-center gap-1">
                      <input
                        type="number"
                        placeholder="mm"
                        className="form-control form-control-sm"
                        style={{ width: "65px" }}
                        value={formData.ggt1_b_lcc || ""}
                        onChange={(e) => handleFieldChange("ggt1_b_lcc", e.target.value)}
                      />
                      <span className="text-muted fs-11">mm</span>
                    </div>
                    {ggt1BLccAge && (
                      <span className="term-badge-val d-block mt-1">→ {ggt1BLccAge}</span>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="crecho-lbl fs-12">Clarté nucale (CN) :</span>
                    <select
                      className="form-control form-control-sm"
                      value={formData.ggt1_b_cn_sel || "Normale (< 3 mm)"}
                      onChange={(e) => handleFieldChange("ggt1_b_cn_sel", e.target.value)}
                    >
                      <option>Normale (&lt; 3 mm)</option>
                      <option>Augmentée (≥ 3 mm)</option>
                    </select>
                  </div>
                  <div>
                    <span className="crecho-lbl fs-12">Os nasal :</span>
                    <select
                      className="form-control form-control-sm"
                      value={formData.ggt1_b_osn || "Présent"}
                      onChange={(e) => handleFieldChange("ggt1_b_osn", e.target.value)}
                    >
                      <option>Présent</option>
                      <option>Absent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Conclusion GG T1 */}
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="crecho-sub-title mb-0 border-0">Conclusion :</span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-xs"
                    onClick={() => handleInsertConclusion("ggt1_conclu", "gg")}
                  >
                    📝 Insérer conclusion type
                  </button>
                </div>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Conclusion..."
                  value={formData.ggt1_conclu || ""}
                  onChange={(e) => handleFieldChange("ggt1_conclu", e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION GG T2-T3 : Jumeaux 2ème/3ème Trimestre */}
          {/* ========================================================= */}
          {examType === "ggt23" && (
            <div className="crecho-zone" style={{ borderLeft: "4px solid #1a3a5c" }}>
              <div className="crecho-zone-title">Grossesse Gémellaire — 2ème / 3ème Trimestre & Biométrie Comparée</div>

              <div className="crecho-field-group mb-2">
                <span className="crecho-lbl">Chorionicité :</span>
                <select
                  className="form-control form-control-sm w-auto"
                  value={formData.ggt23_chorio || "Bichoriale biamniotique (BCBA)"}
                  onChange={(e) => handleFieldChange("ggt23_chorio", e.target.value)}
                >
                  <option>Bichoriale biamniotique (BCBA)</option>
                  <option>Monochoriale biamniotique (MCBA)</option>
                  <option>Monochoriale monoamniotique (MCMA)</option>
                </select>
              </div>

              <div className="d-flex gap-2 flex-wrap mb-2">
                {/* Fœtus A */}
                <div className="crecho-twin-col">
                  <div className="crecho-twin-title">Fœtus A</div>
                  <div className="row g-1 mb-2">
                    <div className="col-6">
                      <span className="crecho-lbl fs-11">Vitalité :</span>
                      <select
                        className="form-control form-control-sm"
                        value={formData.ggt23_a_vita || "Positive"}
                        onChange={(e) => handleFieldChange("ggt23_a_vita", e.target.value)}
                      >
                        <option>Positive</option>
                        <option>Négative</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <span className="crecho-lbl fs-11">Présentation :</span>
                      <select
                        className="form-control form-control-sm"
                        value={formData.ggt23_a_pres || "Céphalique"}
                        onChange={(e) => handleFieldChange("ggt23_a_pres", e.target.value)}
                      >
                        <option>Céphalique</option>
                        <option>Siège</option>
                        <option>Transverse</option>
                      </select>
                    </div>
                  </div>
                  <div className="crecho-sub-title fs-11">Biométrie Hadlock A :</div>
                  <div className="d-flex flex-wrap gap-1 mb-1">
                    <input
                      type="number"
                      placeholder="BIP"
                      className="form-control form-control-sm"
                      style={{ width: "55px" }}
                      value={formData.ggt23_a_bip || ""}
                      onChange={(e) => handleFieldChange("ggt23_a_bip", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="PC"
                      className="form-control form-control-sm"
                      style={{ width: "55px" }}
                      value={formData.ggt23_a_pc || ""}
                      onChange={(e) => handleFieldChange("ggt23_a_pc", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="CA"
                      className="form-control form-control-sm"
                      style={{ width: "55px" }}
                      value={formData.ggt23_a_ca || ""}
                      onChange={(e) => handleFieldChange("ggt23_a_ca", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="LF"
                      className="form-control form-control-sm"
                      style={{ width: "55px" }}
                      value={formData.ggt23_a_lf || ""}
                      onChange={(e) => handleFieldChange("ggt23_a_lf", e.target.value)}
                    />
                  </div>
                  {ggt23APoids && (
                    <div className="poids-badge-val fs-12">
                      Poids A : <strong>{ggt23APoids} g</strong>
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="crecho-lbl fs-11">Doppler Ombilical A :</span>
                    <select
                      className="form-control form-control-sm"
                      value={formData.ggt23_a_dop_o || "Normal"}
                      onChange={(e) => handleFieldChange("ggt23_a_dop_o", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Résistances augmentées</option>
                      <option>Diastole nulle</option>
                    </select>
                  </div>
                </div>

                {/* Fœtus B */}
                <div className="crecho-twin-col">
                  <div className="crecho-twin-title">Fœtus B</div>
                  <div className="row g-1 mb-2">
                    <div className="col-6">
                      <span className="crecho-lbl fs-11">Vitalité :</span>
                      <select
                        className="form-control form-control-sm"
                        value={formData.ggt23_b_vita || "Positive"}
                        onChange={(e) => handleFieldChange("ggt23_b_vita", e.target.value)}
                      >
                        <option>Positive</option>
                        <option>Négative</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <span className="crecho-lbl fs-11">Présentation :</span>
                      <select
                        className="form-control form-control-sm"
                        value={formData.ggt23_b_pres || "Siège"}
                        onChange={(e) => handleFieldChange("ggt23_b_pres", e.target.value)}
                      >
                        <option>Céphalique</option>
                        <option>Siège</option>
                        <option>Transverse</option>
                      </select>
                    </div>
                  </div>
                  <div className="crecho-sub-title fs-11">Biométrie Hadlock B :</div>
                  <div className="d-flex flex-wrap gap-1 mb-1">
                    <input
                      type="number"
                      placeholder="BIP"
                      className="form-control form-control-sm"
                      style={{ width: "55px" }}
                      value={formData.ggt23_b_bip || ""}
                      onChange={(e) => handleFieldChange("ggt23_b_bip", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="PC"
                      className="form-control form-control-sm"
                      style={{ width: "55px" }}
                      value={formData.ggt23_b_pc || ""}
                      onChange={(e) => handleFieldChange("ggt23_b_pc", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="CA"
                      className="form-control form-control-sm"
                      style={{ width: "55px" }}
                      value={formData.ggt23_b_ca || ""}
                      onChange={(e) => handleFieldChange("ggt23_b_ca", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="LF"
                      className="form-control form-control-sm"
                      style={{ width: "55px" }}
                      value={formData.ggt23_b_lf || ""}
                      onChange={(e) => handleFieldChange("ggt23_b_lf", e.target.value)}
                    />
                  </div>
                  {ggt23BPoids && (
                    <div className="poids-badge-val fs-12">
                      Poids B : <strong>{ggt23BPoids} g</strong>
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="crecho-lbl fs-11">Doppler Ombilical B :</span>
                    <select
                      className="form-control form-control-sm"
                      value={formData.ggt23_b_dop_o || "Normal"}
                      onChange={(e) => handleFieldChange("ggt23_b_dop_o", e.target.value)}
                    >
                      <option>Normal</option>
                      <option>Résistances augmentées</option>
                      <option>Diastole nulle</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Discordance automatique */}
              {discordance !== null && (
                <div className={`p-2 border rounded text-center my-2 ${discordance >= 20 ? "bg-light-danger text-danger font-w700" : "bg-light text-success font-w600"}`}>
                  <i className="fa fa-chart-line me-1"></i> Discordance de croissance fœtale : {discordance} %
                  {discordance >= 20 ? " (Alerte : Discordance significative ≥ 20%)" : " (Concordant < 20%)"}
                </div>
              )}

              {/* Conclusion GG T2-T3 */}
              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="crecho-sub-title mb-0 border-0">Conclusion :</span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-xs"
                    onClick={() => handleInsertConclusion("ggt23_conclu", "gg")}
                  >
                    📝 Insérer conclusion type
                  </button>
                </div>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Conclusion..."
                  value={formData.ggt23_conclu || ""}
                  onChange={(e) => handleFieldChange("ggt23_conclu", e.target.value)}
                ></textarea>
              </div>
            </div>
          )}

          {/* 4. Prescription Médicale (Bouton & Carte rattachée) */}
          {showPrescription && prescriptionItems.some((i) => i.medication && i.medication.trim() !== "") ? (
            <div className="mt-3 p-3 border rounded bg-white shadow-sm mb-3" style={{ borderLeft: "4px solid #10b981" }} id="echo-prescription-section">
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-light text-success p-2 rounded-circle" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)" }}>
                    <i className="flaticon-381-file-1 fs-16 text-success"></i>
                  </span>
                  <div>
                    <h6 className="font-w700 mb-0 text-dark fs-14">Ordonnance Médicale Rattachée</h6>
                    <span className="text-muted fs-12">
                      {prescriptionItems.filter((i) => i.medication && i.medication.trim()).length} médicament(s) prescrit(s)
                    </span>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    type="button"
                    onClick={() => setShowPrescriptionModal(true)}
                    className="d-flex align-items-center btn-rounded"
                  >
                    <i className="fa fa-pencil-alt me-1"></i> Modifier
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    type="button"
                    onClick={handlePrintPrescriptionOnly}
                    className="d-flex align-items-center btn-rounded"
                  >
                    <i className="fa fa-print me-1"></i> Imprimer
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setShowPrescription(false);
                      setPrescriptionItems([
                        { medication: "", dosage: "", posology: "1 fois par jour", duration: "5 jours", renewable: "Non renouvelable" }
                      ]);
                    }}
                    className="d-flex align-items-center btn-rounded"
                  >
                    <i className="fa fa-trash me-1"></i> Supprimer
                  </Button>
                </div>
              </div>
              <div className="table-responsive mt-2">
                <table className="table table-sm table-borderless mb-0">
                  <tbody>
                    {prescriptionItems
                      .filter((item) => item.medication && item.medication.trim())
                      .map((item, idx) => (
                        <tr key={idx} className="border-bottom">
                          <td className="ps-0 py-2" style={{ width: "55%" }}>
                            <i className="fa fa-pills text-primary me-2"></i>
                            <strong className="text-dark fs-13">{item.medication}</strong>
                          </td>
                          <td className="py-2 text-muted fs-12" style={{ width: "45%" }}>
                            <i className="fa fa-clock text-muted me-1"></i>
                            {item.posology || "1 fois par jour"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="mt-3 mb-3">
              <Button
                variant="success"
                type="button"
                size="sm"
                onClick={() => setShowPrescriptionModal(true)}
                className="d-flex align-items-center text-white"
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                <i className="flaticon-381-file-1 me-1"></i>
                Faire l'ordonnance médicale
              </Button>
            </div>
          )}
        </div>

        {/* Pied de formulaire avec Actions */}
        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2 border-top">
          <div className="text-muted fs-12">
            Cabinet Médical Dr N. BELBACHIR OULD HENNIA • Es-Seddikia, Oran
          </div>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <Button
              variant="outline-primary"
              type="button"
              onClick={handlePrintEchoOnly}
              className="d-flex align-items-center"
              title="Imprimer le compte-rendu d'échographie"
            >
              <i className="flaticon-381-print me-1"></i> Imprimer Échographie
            </Button>
            <Button
              variant="outline-success"
              type="button"
              onClick={handlePrintPrescriptionOnly}
              disabled={!(showPrescription && prescriptionItems.some((i) => i.medication && i.medication.trim() !== ""))}
              style={!(showPrescription && prescriptionItems.some((i) => i.medication && i.medication.trim() !== "")) ? { opacity: 0.45, cursor: "not-allowed" } : {}}
              className="d-flex align-items-center"
              title="Imprimer l'ordonnance médicale"
            >
              <i className="flaticon-381-file-1 me-1"></i> Imprimer Ordonnance
            </Button>
            <Button variant="danger" light onClick={onCancel} type="button">
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              <i className="flaticon-381-check-2 me-1"></i> Enregistrer
            </Button>
          </div>
        </div>
      </form>

      {/* POPUP MODAL NOUVELLE ORDONNANCE (Identique à admin/ordonnances) */}
      <Modal
        show={showPrescriptionModal}
        onHide={() => setShowPrescriptionModal(false)}
        size="lg"
        centered
        backdrop="static"
        contentClassName="border-0 shadow-lg"
        style={{ zIndex: 1055 }}
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
            onClick={() => setShowPrescriptionModal(false)}
            style={{ fontSize: "14px" }}
          ></button>
        </div>

        <form onSubmit={handleConfirmPrescriptionModal}>
          <div className="modal-body px-4 py-3" style={{ background: "#ffffff" }}>
            {/* 1. Ligne Supérieure : Patient * et Date du document * */}
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
                  onChange={handleSelectPatientInModal}
                  onCreateOption={(inputValue) => {
                    const clean = inputValue.trim();
                    if (!clean) return;
                    setPatientId("guest");
                    setNom(clean);
                    setPrenom("");
                    setDdn("");
                    setPatientInputSearch("");
                  }}
                  formatCreateLabel={(inputValue) => (
                    <span>
                      <i className="fa fa-user-plus text-primary me-2"></i>
                      Dossier patiente de passage : <strong className="text-primary">"{inputValue}"</strong>
                    </span>
                  )}
                  noOptionsMessage={({ inputValue }) =>
                    inputValue
                      ? `Appuyez sur Entrée pour utiliser "${inputValue}"`
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
                  value={dateExam || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDateExam(e.target.value)}
                  title="DATE DU DOCUMENT"
                  required
                  style={{ height: "45px" }}
                />
              </div>
            </div>

            {/* 2. En-tête de section Médicaments & Posologies avec bouton "+ Ajouter" */}
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
                onClick={handleAddMed}
              >
                <i className="fa fa-plus-circle fs-14"></i>
                <span>Ajouter</span>
              </button>
            </div>

            {/* 3. Table des médicaments avec 3 champs essentiels */}
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
                  {prescriptionItems.map((item, index) => (
                    <tr key={index}>
                      <td className="ps-0 py-2 align-middle">
                        <MedicationSearchInput
                          value={item.medication}
                          onChange={(val) =>
                            handleMedChange(index, "medication", val)
                          }
                          medications={localMedications}
                          onSelectMedication={(med) =>
                            handleSelectPredefinedMed(index, med.name)
                          }
                          placeholder="Ex: PARACÉTAMOL 1000 mg, AMOXICILLINE..."
                        />
                      </td>
                      <td className="py-2 align-middle">
                        <div
                          className="input-group input-group-sm flex-nowrap"
                          style={{ height: "44px" }}
                        >
                          <input
                            type="text"
                            list={`echo-modal-posology-options-${index}`}
                            className="form-control form-control-sm border-end-0"
                            placeholder="Ex: 3 fois par jour"
                            value={item.posology}
                            onChange={(e) =>
                              handleMedChange(index, "posology", e.target.value)
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
                          <datalist id={`echo-modal-posology-options-${index}`}>
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
                            className={`btn btn-sm ${
                              item.posology === "1 fois par jour"
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
                              handleMedChange(index, "posology", "1 fois par jour")
                            }
                            title="1 fois par jour"
                          >
                            1 fois/j
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              item.posology === "2 fois par jour"
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
                              handleMedChange(index, "posology", "2 fois par jour")
                            }
                            title="2 fois par jour"
                          >
                            2 fois/j
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${
                              item.posology === "3 fois par jour"
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
                              handleMedChange(index, "posology", "3 fois par jour")
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
                        {prescriptionItems.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-link text-danger p-1"
                            onClick={() => handleRemoveMed(index)}
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

          {/* Pied de modal avec boutons Annuler et Valider */}
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
              onClick={() => setShowPrescriptionModal(false)}
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
              Valider l'ordonnance
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ConsultationEchoForm;
