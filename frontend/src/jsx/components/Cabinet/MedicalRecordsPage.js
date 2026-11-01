import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";
const MedicalRecordsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [unreadMap, setUnreadMap] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  const loadUnreadDocs = async () => {
    try {
      const allDocs = await ApiService.getDocuments();
      if (Array.isArray(allDocs)) {
        const map = {};
        let total = 0;
        allDocs.forEach((d) => {
          const isPortal =
            (d.status && d.status.toLowerCase().includes("patient")) ||
            (d.author && d.author.toLowerCase().includes("patient")) ||
            d.fileType === "TEXTE" ||
            d.fileType === "NOTE";
          const isUnread = !d.isRead && d.status !== "Lu par le médecin" && d.status !== "Lu";

          if (isPortal && isUnread && d.patientId) {
            map[d.patientId] = (map[d.patientId] || 0) + 1;
            total++;
          }
        });
        setUnreadMap(map);
        setTotalUnread(total);
      }
    } catch (e) {
      console.warn("Erreur chargement dépôts non lus :", e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [patientsData, consultsData] = await Promise.all([
          ApiService.getPatients(),
          ApiService.getConsultations().catch(() => []),
        ]);
        if (isMounted) {
          const clean = (Array.isArray(patientsData) ? patientsData : []).filter((p) => {
            const last = (p.lastName || "").toLowerCase().trim();
            const first = (p.firstName || "").toLowerCase().trim();
            return (
              !["dubois", "lemoine", "bernard", "moreau", "belkacem"].includes(last) &&
              !["claire", "marc", "sophie", "lucas", "yasmine"].includes(first)
            );
          });
          setPatients(clean);
          if (Array.isArray(consultsData)) {
            setConsultations(consultsData);
          }
        }
      } catch (err) {
        console.warn("Erreur chargement dossiers médicaux :", err);
      }
    };
    fetchData();
    loadUnreadDocs();
    const handleUpdate = () => loadUnreadDocs();
    window.addEventListener("portal_docs_updated", handleUpdate);
    const interval = setInterval(loadUnreadDocs, 15000);
    return () => {
      isMounted = false;
      window.removeEventListener("portal_docs_updated", handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
    const fileNum = (p.fileNumber || "").toLowerCase();
    const secu = p.secuNumber || "";
    const term = searchTerm.toLowerCase();
    return (
      fullName.includes(term) ||
      fileNum.includes(term) ||
      secu.includes(term)
    );
  });

  return (
    <>
      <PageTitle motherMenu="Gestion médicale" activeMenu="Dossiers médicaux" />

      {/* Barre d'action et recherche */}
      <div className="form-head d-flex mb-3 mb-md-4 align-items-center flex-wrap justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group search-area" style={{ width: "auto", minWidth: "260px" }}>
            <input
              type="text"
              className="form-control"
              placeholder="Rechercher par dossier, nom, n° sécu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="input-group-text">
              <i className="flaticon-381-search-2"></i>
            </span>
          </div>
          {totalUnread > 0 && (
            <span
              className="badge badge-danger"
              style={{
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "800",
                padding: "6px 12px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              title={`${totalUnread} transmission(s) non lue(s) reçue(s) depuis le portail public`}
            >
              <i className="fa fa-bell"></i>
              <span>{totalUnread} dépôt{totalUnread > 1 ? "s" : ""} patient non lu{totalUnread > 1 ? "s" : ""}</span>
            </span>
          )}
        </div>

        <Link to="/admin/patients" className="btn btn-primary btn-rounded ms-auto">
          <i className="flaticon-381-add-1 me-2"></i> Nouveau Dossier Patient
        </Link>
      </div>

      <style>{`
        .record-file-code {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 2px 8px;
          border-radius: 4px;
          letter-spacing: 0.3px;
        }
        .record-clean-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          color: #334155;
          font-size: 0.8125rem;
          font-weight: 500;
          line-height: 1.35;
        }
        .record-clean-tag .tag-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }
        .tag-dot.dot-danger {
          background-color: #dc2626;
        }
        .tag-dot.dot-warning {
          background-color: #d97706;
        }
        .tag-dot.dot-neutral {
          background-color: #94a3b8;
        }
      `}</style>

      {/* Cartes récapitulatives des dossiers patients */}
      <div className="row">
        {filteredPatients.map((p) => {
          const patientConsults = consultations.filter((c) => {
            if (c.patientId && String(c.patientId) === String(p.id)) return true;
            if (c.patientDetails && c.patientDetails.fileNumber && c.patientDetails.fileNumber === p.fileNumber) return true;
            if (c.patientName && p.lastName && p.firstName) {
              const cName = c.patientName.toLowerCase();
              if (cName.includes(p.lastName.toLowerCase()) && cName.includes(p.firstName.toLowerCase())) return true;
            }
            return false;
          });
          const consultCount = typeof p.consultationsCount === "number" && p.consultationsCount > 0
            ? Math.max(p.consultationsCount, patientConsults.length)
            : patientConsults.length;
          const latestVisitDate = (patientConsults.length > 0 && patientConsults[0].date) || p.lastVisit || "N/A";
          const hasAllergies = p.allergies && p.allergies.length > 0 && p.allergies[0] !== "Aucune allergie connue";

          return (
            <div key={p.id} className="col-xl-6 col-xxl-6 col-lg-12">
              <div className="card">
                <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-start">
                  <div>
                    <span className="record-file-code mb-1">
                      {p.fileNumber}
                    </span>
                    <h4 className="card-title mb-0 d-flex align-items-center flex-wrap gap-2">
                      <Link to={`/admin/patient-details?id=${p.id}`} className="hover-primary">
                        {p.lastName.toUpperCase()} {p.firstName}
                      </Link>
                      {unreadMap[p.id] > 0 && (
                        <span
                          className="badge badge-danger"
                          style={{
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "2px 7px",
                            borderRadius: "10px",
                            boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
                          }}
                          title={`${unreadMap[p.id]} nouveau(x) document(s) / texte(s) non lu(s)`}
                        >
                          {unreadMap[p.id]}
                        </span>
                      )}
                    </h4>
                    <p className="text-muted fs-12 mb-0">
                      {p.gender} • Né(e) le {p.dob} ({p.age || 35} ans) • Groupe {p.bloodGroup}
                    </p>
                  </div>
                  <div className="d-flex align-items-center">
                    <Link
                      to={`/admin/patient-details?id=${p.id}`}
                      className="btn btn-primary shadow btn-xs sharp me-1"
                      title="Ouvrir le dossier médical"
                    >
                      <i className="fa fa-folder-open"></i>
                    </Link>
                    <Link
                      to={`/admin/consultations?patientId=${p.id}`}
                      className="btn btn-success shadow btn-xs sharp"
                      title="Nouvelle consultation"
                    >
                      <i className="fa fa-stethoscope"></i>
                    </Link>
                  </div>
                </div>

                <div className="card-body">
                  {/* Allergies & Facteurs de risque */}
                  <div className="mb-3">
                    <span className="text-muted fs-12 d-block mb-1">
                      <strong>ALLERGIES & CONTRE-INDICATIONS :</strong>
                    </span>
                    {hasAllergies ? (
                      <div className="d-flex flex-wrap gap-2">
                        {p.allergies.map((all, i) => (
                          <span key={i} className="record-clean-tag">
                            <span className="tag-dot dot-danger"></span>
                            {all}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted fs-13">
                        Aucune allergie connue
                      </span>
                    )}
                  </div>

                  {/* Pathologies chroniques */}
                  <div className="mb-3">
                    <span className="text-muted fs-12 d-block mb-1">
                      <strong>PATHOLOGIES CHRONIQUES / ALD :</strong>
                    </span>
                    {p.chronicDiseases && p.chronicDiseases.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {p.chronicDiseases.map((dis, i) => (
                          <span key={i} className="record-clean-tag">
                            <span className="tag-dot dot-warning"></span>
                            {dis}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted fs-13">Aucune affection longue durée</span>
                    )}
                  </div>

                  {/* Traitements habituels */}
                  <div className="mb-3">
                    <span className="text-muted fs-12 d-block mb-1">
                      <strong>TRAITEMENTS EN COURS :</strong>
                    </span>
                    {p.regularTreatments && p.regularTreatments.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {p.regularTreatments.map((t, idx) => (
                          <span key={idx} className="record-clean-tag">
                            <span className="tag-dot dot-neutral"></span>
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted fs-13">Aucun traitement de fond</span>
                    )}
                  </div>

                  {/* Historique récent des consultations */}
                  <div className="border-top pt-2 d-flex justify-content-between align-items-center flex-wrap fs-12 text-muted">
                    <span className={consultCount > 0 ? "text-primary font-w600" : ""}>
                      <i className="flaticon-381-notepad me-1 text-primary"></i>
                      {consultCount} consultation(s) archivée(s)
                    </span>
                    <span>
                      Dernière visite : <strong>{latestVisitDate}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default MedicalRecordsPage;
