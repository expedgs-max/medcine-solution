import React from "react";
import { Modal, Button } from "react-bootstrap";

const PrescriptionPreviewModal = ({ show, onHide, prescription }) => {
  if (!prescription) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A5 portrait; /* 148mm x 210mm */
            margin: 0;
          }
          html, body {
            width: 148mm !important;
            height: 210mm !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Masquer tous les composants du site */
          body * {
            visibility: hidden !important;
          }
          /* Afficher uniquement la feuille d'ordonnance A5 */
          #printable-prescription-sheet,
          #printable-prescription-sheet * {
            visibility: visible !important;
          }
          #printable-prescription-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 148mm !important;
            height: 210mm !important;
            max-width: 148mm !important;
            max-height: 210mm !important;
            margin: 0 !important;
            padding: 8mm 10mm 10mm 10mm !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Masquer les en-têtes et boutons lors de l'impression */
          .modal-backdrop,
          .modal-header,
          .modal-footer,
          .btn,
          .btn-close,
          .no-print {
            display: none !important;
          }
          .modal,
          .modal-dialog,
          .modal-content,
          .modal-body {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
            overflow: visible !important;
          }
        }
      `}</style>

      <Modal show={show} onHide={onHide} centered className="prescription-modal" dialogClassName="modal-md">
        <div className="modal-header no-print py-2 px-3">
          <h5 className="modal-title fs-15 d-flex align-items-center font-w600">
            <i className="flaticon-381-print me-2 text-primary"></i>
            Aperçu de l'ordonnance médicale • Format A5 (148 × 210 mm)
          </h5>
          <button type="button" className="btn-close" onClick={onHide}></button>
        </div>

        <div className="modal-body p-3 bg-light d-flex justify-content-center">
          {/* Feuille officielle d'ordonnance imprimable au format A5 (148 × 210 mm) */}
          <div
            id="printable-prescription-sheet"
            className="p-4 bg-white shadow-sm border rounded"
            style={{
              width: "100%",
              maxWidth: "520px",
              minHeight: "720px",
              color: "#1a202c",
              position: "relative",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* ============================================================== */}
            {/* EN-TÊTE OFFICIEL BILINGUE (FRANÇAIS - ARABE)                   */}
            {/* Reproduction exacte de l'en-tête de la praticienne             */}
            {/* ============================================================== */}
            <div className="d-flex justify-content-between align-items-start">
              {/* Volet Français (Gauche) */}
              <div className="text-start" style={{ direction: "ltr", flex: 1 }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    color: "#163759",
                    fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                    letterSpacing: "0.2px",
                    lineHeight: "1.2",
                  }}
                >
                  Dr N. BELBACHIR OULD HENNIA
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontStyle: "italic",
                    color: "#2c5f8a",
                    fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                    marginTop: "3px",
                    lineHeight: "1.25",
                  }}
                >
                  Médecin Spécialiste en Gynécologie Obstétrique
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontStyle: "italic",
                    color: "#2c5f8a",
                    fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                    lineHeight: "1.25",
                  }}
                >
                  Échographie
                </div>
              </div>

              {/* Volet Arabe (Droite) */}
              <div className="text-end" style={{ direction: "rtl", flex: 1 }}>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#163759",
                    fontFamily: "'Amiri', 'Traditional Arabic', 'Cairo', 'Segoe UI', Tahoma, sans-serif",
                    lineHeight: "1.2",
                  }}
                >
                  الدكتورة ن. بلبشير ولد هنية
                </div>
                <div
                  style={{
                    fontSize: "12.5px",
                    color: "#2c5f8a",
                    fontFamily: "'Amiri', 'Traditional Arabic', 'Cairo', 'Segoe UI', Tahoma, sans-serif",
                    marginTop: "3px",
                    lineHeight: "1.25",
                  }}
                >
                  طبيبة مختصة في أمراض النساء والتوليد
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#2c5f8a",
                    fontFamily: "'Amiri', 'Traditional Arabic', 'Cairo', 'Segoe UI', Tahoma, sans-serif",
                    lineHeight: "1.25",
                  }}
                >
                  الفحص بالصدى (إيكوغرافيا)
                </div>
              </div>
            </div>

            {/* Ligne séparatrice officielle bleu marine */}
            <div
              style={{
                height: "2.5px",
                backgroundColor: "#163759",
                width: "100%",
                marginTop: "10px",
                marginBottom: "16px",
              }}
            ></div>

            {/* Métadonnées : Date, N° d'ordonnance et Patient */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div>
                <span className="text-muted" style={{ fontSize: "11.5px" }}>Patient(e) :</span>
                <div className="font-w700 text-dark" style={{ fontSize: "15px" }}>
                  {(prescription.patientName || "").replace(/\s*\(sc\)\s*/gi, "").trim()}
                </div>
              </div>
              <div className="text-end">
                <div className="text-muted" style={{ fontSize: "11.5px" }}>
                  Le : <strong className="text-dark" style={{ fontSize: "13px" }}>{prescription.date}</strong>
                </div>
              </div>
            </div>

            {/* Titre central ORDONNANCE */}
            <div className="text-center my-3">
              <span
                style={{
                  fontFamily: "'Times New Roman', Times, 'Georgia', serif",
                  fontSize: "18px",
                  fontWeight: "bold",
                  letterSpacing: "3.5px",
                  color: "#163759",
                  borderBottom: "2px solid #163759",
                  paddingBottom: "3px",
                  display: "inline-block",
                }}
              >
                ORDONNANCE
              </span>
            </div>

            {/* Liste des Médicaments et Traitements */}
            <div className="my-2 px-1" style={{ flex: 1, minHeight: "280px" }}>
              <ol className="ps-3" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                {prescription.items && prescription.items.map((item, idx) => (
                  <li key={idx} className="mb-3">
                    <div className="d-flex justify-content-between align-items-baseline">
                      <strong className="text-dark" style={{ fontSize: "15px" }}>
                        {item.medication}
                      </strong>
                    </div>
                    <div className="ps-2 text-dark font-w500 mt-1" style={{ fontSize: "13px" }}>
                      • {item.posology}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Pied de page officiel de l'ordonnance A5 */}
            <div
              className="text-center text-muted pt-2 border-top"
              style={{
                fontSize: "9.5px",
                lineHeight: "1.4",
                marginTop: "auto",
              }}
            >
              Cabinet Médical de Gynécologie Obstétrique — Échographie • Haï Essedikia, Avenue Seghier Benali, Oran • Tél : 0560 06 74 66
            </div>
          </div>
        </div>

        <div className="modal-footer no-print py-2 px-3">
          <Button variant="secondary" size="sm" onClick={onHide}>
            Fermer
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} className="px-4">
            <i className="flaticon-381-print me-1"></i> Imprimer l'ordonnance (A5)
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default PrescriptionPreviewModal;
