import React, { useState } from "react";
import { Dropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
/// Scroll
// import PerfectScrollbar from "react-perfect-scrollbar";

/// Image
// import profile from "../../../images/profile/17.jpg";  
// import profile2 from "../../../images/profile/pic1.jpg";
// import { set } from "date-fns/esm";



const Header = ({ onNote }) => {
    const [fullScreen, setFullScreen] = useState(false);
    const location = useLocation();

    // Récupération dynamique de l'utilisateur connecté
    let authUser = null;
    try {
      const stored = localStorage.getItem("cabinet_auth_user");
      if (stored) {
        authUser = JSON.parse(stored);
      }
    } catch (e) {}

    const userName = authUser?.name || "Dr N. BELBACHIR OULD HENNIA";

    // Calcul propre des initiales de l'avatar (ex: NB pour Dr N. BELBACHIR)
    const initials = (() => {
      if (!userName) return "NB";
      const cleaned = userName.replace(/^(dr\.?|docteur)\s+/i, "").trim();
      const parts = cleaned.split(/[\s.]+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return "NB";
    })();

    // Titres en français adaptés au cabinet médical
    const routeTitles = {
      "": "Tableau de bord",
      "dashboard": "Tableau de bord",
      "appointments": "Agenda & Rendez-vous",
      "patients": "Patients",
      "patient-details": "Dossier Patient",
      "waiting-room": "Salle d'attente",
      "affichage-salle-attente": "Écran Salle d'attente",
      "consultations": "Consultations",
      "medical-records": "Dossiers Médicaux",
      "prescriptions": "Ordonnances",
      "medical-documents": "Documents Médicaux",
      "invoices": "Factures",
      "payments": "Règlements & Caisse",
      "reports": "Rapports & Statistiques",
      "staff": "Utilisateurs",
      "clinic": "Mon Cabinet",
      "settings": "Paramètres",
      "smtp": "Configuration SMTP",
      "support": "Aide & Support",
      "profile": "Profil Praticien",
    };

    const cleanPath = (location.pathname || "").toLowerCase().replace(/^\/+|\/+$/g, "");
    const pathWithoutAdmin = cleanPath.replace(/^admin\/?/, "");
    const currentRouteKey = pathWithoutAdmin.split("/")[0] || "dashboard";
    const pageTitle = routeTitles[currentRouteKey] || (
      pathWithoutAdmin
        ? pathWithoutAdmin.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : "Tableau de bord"
    );
     

  const onFullScreen = () => {
    var elem = document.documentElement;
    setFullScreen(elem ? true : false);

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };
  const offFullScreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen();
    }
    setFullScreen(false);
  };

  return (
    <div className="header">
      <div className="header-content">
        <nav className="navbar navbar-expand">
          <div className="collapse navbar-collapse justify-content-between">
            <div className="header-left">
              <div
                className="dashboard_bar"
              >
                {pageTitle}
              </div>
            </div>

            <ul className="navbar-nav header-right d-flex flex-row align-items-center flex-nowrap mb-0 gap-2 pe-2 pe-md-3"> 
              <li className="nav-item dropdown notification_dropdown d-none d-xl-flex align-items-center">
                <a
                  href="/admin/affichage-salle-attente"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link"
                  title="Écran Salle d'attente (ouvrir dans une nouvelle fenêtre)"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    textDecoration: "none",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={22}
                    height={22}
                    stroke="currentColor"
                    strokeWidth={2}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </a>
              </li>
              <li className="nav-item d-none d-xl-flex align-items-center">
                <a
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm rounded-pill d-flex align-items-center gap-1 px-3 py-1 text-nowrap"
                  title="Ouvrir le portail patient dans une nouvelle fenêtre / nouvel onglet"
                >
                  <i className="fa fa-globe"></i>
                  <span>Portail Patient</span>
                </a>
              </li> 
              {fullScreen ? (
                <li
                  className="nav-item dropdown notification_dropdown d-none d-xl-flex align-items-center"
                  onClick={() => offFullScreen()}
                >
                  <Link className="nav-link dz-fullscreen active" to={"#"}>
                    <svg
                      id="icon-full"
                      viewBox="0 0 24 24"
                      width={26}
                      height={26}
                      stroke="currentColor"
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="css-i6dzq1"
                    >
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    <svg
                      id="icon-minimize"
                      width={26}
                      height={26}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-minimize"
                    >
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  </Link>
                </li>
              ) : (
                <li className="nav-item dropdown notification_dropdown d-none d-xl-flex align-items-center">
                  <Link
                    className="nav-link dz-fullscreen"
                    to="#"
                    onClick={() => onFullScreen()}
                  >
                    <svg
                      id="icon-full"
                      viewBox="0 0 24 24"
                      width={26}
                      height={26}
                      stroke="currentColor"
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="css-i6dzq1"
                    >
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                    <svg
                      id="icon-minimize"
                      width={26}
                      height={26}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-minimize"
                    >
                      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                    </svg>
                  </Link>
                </li>
              )}
              

              <Dropdown as="li" className="nav-item dropdown header-profile d-flex align-items-center me-1 me-sm-2">
                <Dropdown.Toggle
                  as={Link}
                  variant=""
                  className="nav-link i-false d-flex align-items-center text-decoration-none"
                  to="#"                  
                >

                  <div
                    className="avatar-initials rounded-circle d-flex align-items-center justify-content-center"
                    style={{
                      width: "38px",
                      height: "38px",
                      minWidth: "38px",
                      background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                      color: "#1d4ed8",
                      fontWeight: 700,
                      fontSize: "13px",
                      border: "1.5px solid #bfdbfe",
                      boxShadow: "0 1px 3px rgba(37, 99, 235, 0.12)",
                      letterSpacing: "0.5px",
                    }}
                    title={userName}
                  >
                    {initials}
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu
                  align="end"
                  className="dropdown-menu dropdown-menu-right"
                >
                  <Link to="/admin/profile" className="dropdown-item ai-icon">
                    <svg
                      id="icon-user1"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-primary"
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx={12} cy={7} r={4} />
                    </svg>
                    <span className="ms-2">Mon Profil </span>
                  </Link>
                  <Link to="/admin/clinic" className="dropdown-item ai-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-success"
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span className="ms-2">Mon Cabinet </span>
                  </Link>
                  <Link to="/admin/settings" className="dropdown-item ai-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-info"
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    <span className="ms-2">Paramètres </span>
                  </Link>
                  <Link
                    to="/login"
                    className="dropdown-item ai-icon"
                    onClick={() => {
                      localStorage.removeItem("cabinet_auth_user");
                    }}
                  >
                    <svg
                      id="icon-logout"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-danger"
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1={21} y1={12} x2={9} y2={12} />
                    </svg>
                    <span className="ms-2">Déconnexion </span>
                  </Link>
                </Dropdown.Menu>
              </Dropdown>
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default Header;
