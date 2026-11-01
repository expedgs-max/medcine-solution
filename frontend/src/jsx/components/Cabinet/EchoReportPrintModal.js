import React from "react";
import { Modal, Button } from "react-bootstrap";

const EchoReportPrintModal = ({ show, onHide, consultation, doctor }) => {
  if (!consultation) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("printable-echo-sheet");
    if (!printContent) {
      window.print();
      return;
    }

    // Retirer tout ancien iframe d'impression
    const oldIframe = document.getElementById("echo-print-iframe");
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "echo-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "100%";
    iframe.style.bottom = "100%";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Compte Rendu Échographique - ${consultation.consultationNumber || ""}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: Georgia, 'Times New Roman', serif;
              color: #1a1a2e;
              font-size: 13px;
              width: 100%;
            }
            .crecho-sheet {
              background: #ffffff;
              padding: 0;
              margin: 0;
              width: 100%;
            }
            .crecho-header-table {
              width: 100%;
              border-collapse: collapse;
              border-bottom: 2.5px solid #1a3a5c;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .crecho-header-table td {
              vertical-align: middle;
            }
            .crecho-title {
              text-align: center;
              font-size: 15px;
              font-weight: bold;
              color: #1a3a5c;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin: 8px 0 14px;
            }
            .crecho-box {
              border: 1px solid #c0d3e8;
              border-radius: 5px;
              background: #f8fbff;
              padding: 8px 12px;
              margin-bottom: 10px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .crecho-box-title {
              font-size: 11px;
              font-weight: bold;
              color: #1a3a5c;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 1px solid #c0d3e8;
              padding-bottom: 3px;
              margin-bottom: 6px;
            }
            .crecho-lbl-bold {
              font-weight: bold;
              color: #1a3a5c;
            }
            .crecho-footer-txt {
              border-top: 1.5px solid #1a3a5c;
              text-align: center;
              font-size: 11px;
              color: #1a3a5c;
              margin-top: 20px;
              padding-top: 6px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .d-flex { display: flex !important; }
            .justify-content-between { justify-content: space-between !important; }
            .flex-wrap { flex-wrap: wrap !important; }
            .gap-1 { gap: 0.25rem !important; }
            .gap-2 { gap: 0.5rem !important; }
            .gap-3 { gap: 1rem !important; }
            .mb-0 { margin-bottom: 0 !important; }
            .mb-1 { margin-bottom: 0.25rem !important; }
            .mb-2 { margin-bottom: 0.5rem !important; }
            .mt-1 { margin-top: 0.25rem !important; }
            .mt-2 { margin-top: 0.5rem !important; }
            .pt-1 { padding-top: 0.25rem !important; }
            .p-2 { padding: 0.5rem !important; }
            .border { border: 1px solid #c0d3e8 !important; }
            .border-top { border-top: 1px solid #c0d3e8 !important; }
            .rounded { border-radius: 0.25rem !important; }
            .bg-white { background-color: #fff !important; }
            .text-dark { color: #212529 !important; }
            .text-muted { color: #6c757d !important; }
            .fs-12 { font-size: 12px !important; }
            .fs-13 { font-size: 13px !important; }
            .font-w600 { font-weight: 600 !important; }
            .d-block { display: block !important; }
            .badge { display: inline-block; padding: 0.25em 0.4em; font-size: 75%; font-weight: 700; line-height: 1; text-align: center; white-space: nowrap; vertical-align: baseline; border-radius: 0.25rem; }
            .badge-light { color: #333; background-color: #f8f9fa; }
            .row { display: flex; flex-wrap: wrap; margin-right: -4px; margin-left: -4px; }
            .col-6 { flex: 0 0 auto; width: 50%; padding-right: 4px; padding-left: 4px; }
            .col-12 { flex: 0 0 auto; width: 100%; padding-right: 4px; padding-left: 4px; }
          </style>
        </head>
        <body>
          <div class="crecho-sheet">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Print error:", err);
        window.print();
      }
    }, 250);
  };

  const echo = consultation.echoData || {};
  const pt = consultation.patientDetails || {};
  const atcd = consultation.atcd || {};
  const calc = consultation.calculated || {};

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <div className="modal-header d-print-none">
        <h5 className="modal-title font-w600 text-primary">
          <i className="flaticon-381-notepad me-2"></i>
          Compte Rendu Échographique — {consultation.consultationNumber || ""}
        </h5>
        <button type="button" className="btn-close" onClick={onHide}></button>
      </div>

      <div className="modal-body p-4 bg-light">
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm 12mm;
            }
            html, body {
              width: 100% !important;
              height: auto !important;
              min-height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Cacher tout ce qui est dans body sauf le modal */
            body > *:not(.modal):not(.fade) {
              display: none !important;
            }
            .modal {
              position: static !important;
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: visible !important;
            }
            .modal-dialog,
            .modal-dialog-centered {
              position: static !important;
              display: block !important;
              margin: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
              min-height: 0 !important;
              transform: none !important;
              align-items: flex-start !important;
            }
            .modal-content,
            .modal-body {
              position: static !important;
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
              overflow: visible !important;
            }
            .modal-header,
            .modal-footer,
            .modal-backdrop,
            .btn,
            .btn-close,
            .d-print-none {
              display: none !important;
            }
            #printable-echo-sheet {
              display: block !important;
              position: static !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #ffffff !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
          .crecho-sheet {
            background: #ffffff;
            border: 1px solid #c0d3e8;
            box-shadow: 0 4px 15px rgba(0,0,0,0.06);
            padding: 20px 25px;
            font-family: Georgia, 'Times New Roman', serif;
            color: #1a1a2e;
            font-size: 13px;
          }
          .crecho-header-table { width: 100%; border-collapse: collapse; border-bottom: 2.5px solid #1a3a5c; padding-bottom: 8px; margin-bottom: 12px; }
          .crecho-header-table td { vertical-align: middle; }
          .crecho-title {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            color: #1a3a5c;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 8px 0 14px;
          }
          .crecho-box {
            border: 1px solid #c0d3e8;
            border-radius: 5px;
            background: #f8fbff;
            padding: 8px 12px;
            margin-bottom: 10px;
          }
          .crecho-box-title {
            font-size: 11px;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #c0d3e8;
            padding-bottom: 3px;
            margin-bottom: 6px;
          }
          .crecho-lbl-bold { font-weight: bold; color: #1a3a5c; }
          .crecho-footer-txt {
            border-top: 1.5px solid #1a3a5c;
            text-align: center;
            font-size: 11px;
            color: #1a3a5c;
            margin-top: 20px;
            padding-top: 6px;
          }
        `}</style>

        <div id="printable-echo-sheet" className="crecho-sheet">
          {/* En-tête Bilingue Officiel */}
          <table className="crecho-header-table">
            <tbody>
              <tr>
                <td style={{ textAlign: "left", width: "50%" }}>
                  <div style={{ fontSize: "15px", fontWeight: "bold", color: "#1a3a5c" }}>
                    {doctor?.name || "Dr N. BELBACHIR OULD HENNIA"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#2d6a9f", fontStyle: "italic" }}>
                    {doctor?.specialty || "Médecin Spécialiste en Gynécologie Obstétrique"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#2d6a9f", fontStyle: "italic" }}>
                    Échographie
                  </div>
                </td>
                <td style={{ textAlign: "right", width: "50%", direction: "rtl", fontFamily: "Arial, sans-serif" }}>
                  <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a3a5c" }}>
                    الدكتورة ن. بلبشير ولد هنية
                  </div>
                  <div style={{ fontSize: "13px", color: "#2d6a9f" }}>
                    طبيبة مختصة في أمراض النساء والتوليد
                  </div>
                  <div style={{ fontSize: "13px", color: "#2d6a9f" }}>
                    الفحص بالصدى
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Titre */}
          <div className="crecho-title">Compte Rendu Échographique</div>

          {/* Informations Patiente */}
          <div className="crecho-box">
            <div className="crecho-box-title">Informations Patiente</div>
            <div className="d-flex justify-content-between flex-wrap gap-2 mb-1">
              <div>
                <span className="crecho-lbl-bold">Nom & Prénom : </span>
                <span>{(consultation.patientName || "").replace(/\s*\(sc\)\s*/gi, "").trim()}</span>
              </div>
              <div>
                <span className="crecho-lbl-bold">Date d'examen : </span>
                <span>{consultation.date}</span>
              </div>
              {pt.age && (
                <div>
                  <span className="crecho-lbl-bold">Âge : </span>
                  <span>{pt.age}</span>
                </div>
              )}
            </div>
            {(pt.ddr || pt.termeDdr) && (
              <div className="d-flex gap-3 flex-wrap mt-1 pt-1 border-top">
                {pt.ddr && (
                  <div>
                    <span className="crecho-lbl-bold">DDR : </span>
                    <span>{pt.ddr}</span>
                  </div>
                )}
                {pt.termeDdr && (
                  <div>
                    <span className="crecho-lbl-bold">Terme actuel : </span>
                    <strong style={{ color: "#b03a2e" }}>{pt.termeDdr}</strong>
                  </div>
                )}
                {pt.ddrc?.ddrcVal && (
                  <div>
                    <span className="crecho-lbl-bold">DDRC (écho) : </span>
                    <span>{pt.ddrc.ddrcVal}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Antécédents si présents */}
          {(atcd.gestite || atcd.parite || atcd.cesarienne || atcd.hta || atcd.diabete || atcd.autres || atcd.avb || atcd.faussesCouches) && (
            <div className="crecho-box">
              <div className="crecho-box-title">Antécédents</div>
              <div className="d-flex flex-wrap gap-3">
                {(atcd.gestite || atcd.parite) && (
                  <span><strong className="crecho-lbl-bold">Parité : </strong>{atcd.gestite ? `G${atcd.gestite}` : ""}{atcd.parite ? `P${atcd.parite}` : ""}</span>
                )}
                {atcd.cesarienne && (
                  <span><strong className="crecho-lbl-bold">Césarienne(s) : </strong>{atcd.cesarienne}</span>
                )}
                {atcd.avb && (
                  <span><strong className="crecho-lbl-bold">AVB : </strong>{atcd.avb}</span>
                )}
                {atcd.faussesCouches && (
                  <span><strong className="crecho-lbl-bold">Fausse(s) couche(s) : </strong>{atcd.faussesCouches}</span>
                )}
                {atcd.hta && <span className="badge badge-light border">HTA</span>}
                {atcd.diabete && <span className="badge badge-light border">Diabète</span>}
                {atcd.autres && (
                  <span><strong className="crecho-lbl-bold">Autres : </strong>{atcd.autres}</span>
                )}
              </div>
            </div>
          )}

          {/* Examen & Mesures */}
          <div className="crecho-box" style={{ borderLeft: "4px solid #1a3a5c" }}>
            <div className="crecho-box-title">{consultation.reason || "Examen Échographique"}</div>

            {/* Mesures calculées principales */}
            <div className="row g-2 mb-2">
              {calc.ob1LccAge && (
                <div className="col-6">
                  <span className="crecho-lbl-bold">Âge gestationnel (Robinson) : </span>
                  <strong style={{ color: "#b03a2e" }}>{calc.ob1LccAge}</strong>
                </div>
              )}
              {calc.ob2Poids && (
                <div className="col-6">
                  <span className="crecho-lbl-bold">Poids fœtal estimé (Hadlock) : </span>
                  <strong style={{ color: "#7d3c98" }}>{calc.ob2Poids} g</strong>
                </div>
              )}
              {calc.ob3Poids && (
                <div className="col-6">
                  <span className="crecho-lbl-bold">Poids fœtal estimé (Hadlock) : </span>
                  <strong style={{ color: "#7d3c98" }}>{calc.ob3Poids} g</strong>
                </div>
              )}
              {(calc.discordance !== null && calc.discordance !== undefined && calc.discordance !== "" && !isNaN(calc.discordance)) && (
                <div className="col-12">
                  <span className="crecho-lbl-bold">Discordance de croissance : </span>
                  <strong>{calc.discordance} %</strong>
                </div>
              )}
              {(echo.ob2_bip || echo.ob2_pc || echo.ob2_ca || echo.ob2_lf || echo.ob3_bip || echo.ob3_pc || echo.ob3_ca || echo.ob3_lf || echo.ob1_lcc) && (
                <div className="col-12 mb-1 pt-1 border-top">
                  <span className="crecho-lbl-bold me-2">Biométrie :</span>
                  {echo.ob1_lcc && <span className="me-2">LCC: <strong>{echo.ob1_lcc} mm</strong></span>}
                  {(echo.ob2_bip || echo.ob3_bip) && <span className="me-2">BIP: <strong>{echo.ob2_bip || echo.ob3_bip} mm</strong></span>}
                  {(echo.ob2_pc || echo.ob3_pc) && <span className="me-2">PC: <strong>{echo.ob2_pc || echo.ob3_pc} mm</strong></span>}
                  {(echo.ob2_ca || echo.ob3_ca) && <span className="me-2">CA: <strong>{echo.ob2_ca || echo.ob3_ca} mm</strong></span>}
                  {(echo.ob2_lf || echo.ob3_lf) && <span className="me-2">LF: <strong>{echo.ob2_lf || echo.ob3_lf} mm</strong></span>}
                </div>
              )}
            </div>

            {/* Observations cliniques */}
            {consultation.examFindings && (
              <div className="mb-2">
                <span className="crecho-lbl-bold d-block mb-1">Observations :</span>
                <p className="mb-0 text-dark fs-13" style={{ whiteSpace: "pre-wrap" }}>
                  {consultation.examFindings}
                </p>
              </div>
            )}
          </div>

          {/* Conclusion */}
          <div className="crecho-box">
            <div className="crecho-box-title">Conclusion Médicale</div>
            <div className="p-2 border rounded bg-white font-w600 text-dark fs-13">
              {consultation.diagnosis || consultation.echoFindings || "Examen sans anomalie décelable."}
            </div>
            {consultation.recommendations && (
              <div className="mt-2 text-muted fs-12">
                <strong className="crecho-lbl-bold">Conduite à tenir : </strong>
                {consultation.recommendations}
              </div>
            )}
          </div>

          {/* Pied de page officiel du cabinet */}
          <div className="crecho-footer-txt">
            Haï Essedikia, Avenue Seghier Benali, Oran &nbsp;|&nbsp; ☎ 0560 06 74 66
          </div>
        </div>
      </div>

      <div className="modal-footer d-print-none">
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          <i className="flaticon-381-print me-1"></i> Imprimer le Compte Rendu
        </Button>
      </div>
    </Modal>
  );
};

export default EchoReportPrintModal;
