import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import ApiService from "../../services/ApiService";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, redirection vers le tableau de bord
    const authUser = localStorage.getItem("cabinet_auth_user");
    if (authUser) {
      navigate("/admin/dashboard");
    }
    // Pré-remplir l'identifiant mémorisé si existant
    const remembered = localStorage.getItem("cabinet_remember_user");
    if (remembered) {
      setUsername(remembered);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg("Veuillez renseigner votre nom d'utilisateur et votre mot de passe.");
      setLoading(false);
      return;
    }

    try {
      // Authentification directe depuis MySQL (staff_users)
      const res = await ApiService.login(cleanUser, cleanPass);

      if (res && res.status === "success" && res.data) {
        const user = res.data;
        const sessionUser = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          roleId: user.roleId,
          roleName: user.roleName || user.role,
          badgeColor: user.badgeColor,
          pages: user.pages,
          type: user.type,
          email: user.email,
          permissions: user.permissions,
          token: user.token,
          loginTime: user.loginTime || new Date().toISOString(),
        };
        localStorage.setItem("cabinet_auth_user", JSON.stringify(sessionUser));
        if (rememberMe) {
          localStorage.setItem("cabinet_remember_user", cleanUser);
        } else {
          localStorage.removeItem("cabinet_remember_user");
        }

        Swal.fire({
          icon: "success",
          title: "Accès Autorisé",
          text: `Bienvenue ${user.name}`,
          timer: 1400,
          showConfirmButton: false,
        });

        navigate("/admin/dashboard");
      } else {
        setLoading(false);
        setErrorMsg(res?.message || "Identifiant ou mot de passe incorrect.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || "Erreur de connexion au serveur de base de données.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0b1f3a 0%, #174075 50%, #1e60d5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
        }}
      >
        {/* En-tête Médical */}
        <div
          style={{
            background: "#ffffff",
            padding: "36px 30px 20px",
            textAlign: "center",
            borderBottom: "1px solid #eef2f6",
          }}
        >
          <div
            style={{
              width: "70px",
              height: "70px",
              margin: "0 auto 16px",
              background: "linear-gradient(135deg, #1e60d5, #0f3e8f)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 20px rgba(30, 96, 213, 0.35)",
            }}
          >
            <i className="flaticon-381-lock-2" style={{ fontSize: "30px", color: "#ffffff" }}></i>
          </div>

          <h4
            style={{
              color: "#0f2b48",
              fontWeight: 700,
              fontSize: "1.2rem",
              marginBottom: "4px",
            }}
          >
            Cabinet Médical Dr N. BELBACHIR
          </h4>

          <p
            style={{
              color: "#1e60d5",
              fontSize: "0.95rem",
              fontWeight: 600,
              marginBottom: "0",
              fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
            }}
            dir="rtl"
          >
            الدكتورة ن. بلبشير ولد هنية
          </p>
        </div>

        {/* Corps du Formulaire */}
        <div style={{ padding: "30px" }}>
          <div className="mb-3 text-center">
            <h5 style={{ fontWeight: 600, color: "#1e293b", fontSize: "1.05rem", marginBottom: "0" }}>
              Espace Administration Sécurisé
            </h5>
          </div>

          {errorMsg && (
            <div
              className="alert alert-danger d-flex align-items-center py-2 px-3 mb-3"
              style={{ fontSize: "0.85rem", borderRadius: "8px" }}
              role="alert"
            >
              <i className="fa fa-exclamation-triangle me-2 fs-14"></i>
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="notranslate" translate="no">
            {/* Nom d'utilisateur */}
            <div className="mb-3">
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Nom d'utilisateur <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-white"
                  style={{
                    borderColor: "#cbd5e1",
                    borderRight: "none",
                    borderRadius: "10px 0 0 10px",
                  }}
                >
                  <i className="flaticon-381-user-7 text-primary" style={{ fontSize: "16px" }}></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  style={{
                    borderColor: "#cbd5e1",
                    borderLeft: "none",
                    borderRadius: "0 10px 10px 0",
                    height: "46px",
                    fontSize: "0.92rem",
                  }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="mb-3">
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#334155",
                  marginBottom: "6px",
                }}
              >
                Mot de passe <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-white"
                  style={{
                    borderColor: "#cbd5e1",
                    borderRight: "none",
                    borderRadius: "10px 0 0 10px",
                  }}
                >
                  <i className="flaticon-381-key text-primary" style={{ fontSize: "16px" }}></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  style={{
                    borderColor: "#cbd5e1",
                    borderLeft: "none",
                    borderRight: "none",
                    height: "46px",
                    fontSize: "0.92rem",
                  }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-white"
                  style={{
                    borderColor: "#cbd5e1",
                    borderLeft: "none",
                    borderRadius: "0 10px 10px 0",
                    cursor: "pointer",
                  }}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  <i
                    className={showPassword ? "fa fa-eye-slash text-muted" : "fa fa-eye text-muted"}
                    style={{ fontSize: "14px" }}
                  ></i>
                </button>
              </div>
            </div>

            {/* Se souvenir de moi */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMeCheck"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label
                  className="form-check-label fs-13 text-muted"
                  htmlFor="rememberMeCheck"
                  style={{ cursor: "pointer" }}
                >
                  Se souvenir de moi
                </label>
              </div>
            </div>

            {/* Bouton de Connexion - Stabilisé contre insertBefore DOM mutations */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100 notranslate"
              translate="no"
              style={{
                height: "48px",
                borderRadius: "10px",
                fontSize: "0.95rem",
                fontWeight: 600,
                boxShadow: "0 8px 18px rgba(30, 96, 213, 0.3)",
              }}
            >
              <span className="d-flex align-items-center justify-content-center w-100">
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : (
                  <i className="fa fa-sign-in-alt me-2"></i>
                )}
                <span>{loading ? "Vérification des accès..." : "Se Connecter"}</span>
              </span>
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
