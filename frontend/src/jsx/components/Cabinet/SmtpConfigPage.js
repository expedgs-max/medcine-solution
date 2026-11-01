import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";

const SmtpConfigPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [smtp, setSmtp] = useState({
    enabled: true,
    host: "smtp.gmail.com",
    port: 587,
    encryption: "tls",
    username: "dr.belbachir@cabinet-medical.dz",
    password: "",
    fromName: "Cabinet Médical Dr Belbachir",
    replyTo: "dr.belbachir@cabinet-medical.dz",
    triggerBookingConfirm: true,
    triggerAdminAlert: true,
    triggerReminder: true,
  });

  useEffect(() => {
    const fetchSmtp = async () => {
      try {
        setLoading(true);
        const data = await ApiService.getSmtpSettings();
        if (data) {
          setSmtp((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.error("Erreur chargement SMTP :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSmtp();
  }, []);

  // Sélection du type de chiffrement et mise à jour du port par défaut
  const handleSelectEncryption = (enc) => {
    let port = 587;
    if (enc === "ssl") port = 465;
    else if (enc === "none") port = 25;
    setSmtp((prev) => ({
      ...prev,
      encryption: enc,
      port: port,
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await ApiService.updateSmtpSettings(smtp);
      Swal.fire({
        icon: "success",
        title: "Configuration SMTP enregistrée",
        text: "Les paramètres du serveur SMTP ont été enregistrés avec succès.",
        confirmButtonColor: "#1e60d5",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur d'enregistrement",
        text: "Impossible d'enregistrer dans MySQL : " + err.message,
        confirmButtonColor: "#1e60d5",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConn(true);
      const res = await ApiService.testSmtpConnection(smtp);
      if (res && res.status === "success") {
        Swal.fire({
          icon: "success",
          title: "Connexion réussie !",
          text: res.message || `Le serveur ${smtp.host}:${smtp.port} est accessible et réactif.`,
          confirmButtonColor: "#1e60d5",
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "Test de connexion",
          text: res?.message || `Vérification effectuée pour ${smtp.host}:${smtp.port}.`,
          confirmButtonColor: "#1e60d5",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "warning",
        title: "Test de connexion",
        text: `Vérifiez que le serveur ${smtp.host} et le port ${smtp.port} sont autorisés sur votre réseau.`,
        confirmButtonColor: "#1e60d5",
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleSendTestEmail = async () => {
    const { value: testEmail } = await Swal.fire({
      title: "Envoyer un Email de Test",
      input: "email",
      inputLabel: "Adresse email destinataire pour le test :",
      inputValue: smtp.username || "dr.belbachir@cabinet-medical.dz",
      showCancelButton: true,
      confirmButtonText: "Envoyer le test",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#1e60d5",
      inputValidator: (val) => {
        if (!val) return "Veuillez saisir une adresse email valide";
      },
    });

    if (testEmail) {
      try {
        setSendingTest(true);
        const res = await ApiService.sendTestSmtpEmail({
          ...smtp,
          targetEmail: testEmail,
        });
        Swal.fire({
          icon: "success",
          title: "Email envoyé !",
          text: res?.message || `L'email de test a été transmis à ${testEmail}.`,
          confirmButtonColor: "#1e60d5",
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Échec de l'envoi",
          text: "Impossible d'envoyer l'email : " + err.message,
          confirmButtonColor: "#1e60d5",
        });
      } finally {
        setSendingTest(false);
      }
    }
  };

  return (
    <>
      <PageTitle motherMenu="Cabinet et configuration" activeMenu="Configuration SMTP" />

      {/* Onglets de navigation entre Paramètres, SMTP et Mon Cabinet */}
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <Link to="/admin/settings" className="btn btn-sm btn-outline-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-settings-2 me-1"></i> Tarifs & Consultations
        </Link>
        <button type="button" className="btn btn-sm btn-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-email me-1"></i> Configuration SMTP
        </button>
        <Link to="/admin/clinic" className="btn btn-sm btn-outline-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-home-2 me-1"></i> Mon Cabinet
        </Link>
      </div>

      <div className="card">
        <div className="card-header border-0 pb-0 d-flex justify-content-between align-items-center">
          <div>
            <h4 className="card-title d-flex align-items-center">
              <i className="flaticon-381-email me-2 text-primary"></i>
              Configuration SMTP (Serveur Email)
            </h4>
          </div>
          <div>
            {smtp.enabled ? (
              <span className="badge badge-success light">ACTIF</span>
            ) : (
              <span className="badge badge-secondary light">INACTIF</span>
            )}
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Chargement de la configuration SMTP...</p>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* Activation du service SMTP */}
              <div
                className="p-3 mb-4 rounded border"
                style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
              >
                <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0 mb-0">
                  <div>
                    <label
                      className="form-check-label font-w600 text-dark fs-15 mb-0"
                      htmlFor="smtpEnabledSwitch"
                      style={{ cursor: "pointer" }}
                    >
                      Activer le Service SMTP
                    </label>
                    <small className="text-muted d-block mt-1">
                      Envoi automatique des confirmations de rendez-vous et notifications
                    </small>
                  </div>
                  <input
                    className="form-check-input ms-3"
                    type="checkbox"
                    id="smtpEnabledSwitch"
                    checked={smtp.enabled}
                    onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })}
                    style={{ width: "2.5em", height: "1.3em", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* Ligne 1 : Serveur Hôte et Port */}
              <div className="row mb-3">
                <div className="col-md-8 mb-2">
                  <label className="form-label font-w500">Serveur Hôte SMTP *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: smtp.gmail.com ou smtp.votredomaine.com"
                    value={smtp.host || ""}
                    onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4 mb-2">
                  <label className="form-label font-w500">Port SMTP *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="587"
                    value={smtp.port || 587}
                    onChange={(e) => setSmtp({ ...smtp, port: parseInt(e.target.value, 10) || 587 })}
                    required
                  />
                </div>
              </div>

              {/* Ligne 2 : Chiffrement & Sécurité */}
              <div className="mb-3">
                <label className="form-label font-w500 d-block">Chiffrement & Sécurité</label>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className={`btn btn-sm btn-rounded ${
                      smtp.encryption === "tls" ? "btn-primary" : "btn-outline-primary"
                    } px-4 py-2`}
                    onClick={() => handleSelectEncryption("tls")}
                  >
                    TLS (Port 587)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm btn-rounded ${
                      smtp.encryption === "ssl" ? "btn-primary" : "btn-outline-primary"
                    } px-4 py-2`}
                    onClick={() => handleSelectEncryption("ssl")}
                  >
                    SSL (Port 465)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm btn-rounded ${
                      smtp.encryption === "none" ? "btn-primary" : "btn-outline-primary"
                    } px-4 py-2`}
                    onClick={() => handleSelectEncryption("none")}
                  >
                    Aucun (Port 25)
                  </button>
                </div>
              </div>

              {/* Ligne 3 : Identifiant & Mot de passe */}
              <div className="row mb-3">
                <div className="col-md-6 mb-2">
                  <label className="form-label font-w500">Identifiant / Email SMTP d'Envoi *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: dr.belbachir@cabinet-medical.dz"
                    value={smtp.username || ""}
                    onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <label className="form-label font-w500">Mot de Passe SMTP / Clé d'Application *</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="••••••••••••"
                      value={smtp.password || ""}
                      onChange={(e) => setSmtp({ ...smtp, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-white"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Masquer" : "Afficher"}
                    >
                      <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"} text-muted`}></i>
                    </button>
                  </div>
                  <small className="text-muted d-block mt-1">
                    Pour Gmail, utilisez un "Mot de passe d'application" généré depuis votre compte Google.
                  </small>
                </div>
              </div>

              {/* Ligne 4 : Nom d'expéditeur et Email de réponse */}
              <div className="row mb-4">
                <div className="col-md-6 mb-2">
                  <label className="form-label font-w500">Nom d'Expéditeur ("From")</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Cabinet Médical Dr Belbachir"
                    value={smtp.fromName || ""}
                    onChange={(e) => setSmtp({ ...smtp, fromName: e.target.value })}
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <label className="form-label font-w500">Email de Réponse ("Reply-To")</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Ex: dr.belbachir@cabinet-medical.dz"
                    value={smtp.replyTo || ""}
                    onChange={(e) => setSmtp({ ...smtp, replyTo: e.target.value })}
                  />
                </div>
              </div>

              {/* Ligne 5 : Déclencheurs d'Emails Automatiques */}
              <div
                className="p-3 mb-4 rounded border"
                style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
              >
                <h6 className="font-w600 text-dark mb-3">
                  <i className="flaticon-381-send-1 me-2 text-primary"></i>
                  Déclencheurs d'Emails Automatiques
                </h6>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="triggerBookingConfirm"
                    checked={smtp.triggerBookingConfirm}
                    onChange={(e) => setSmtp({ ...smtp, triggerBookingConfirm: e.target.checked })}
                  />
                  <label className="form-check-label font-w500 ms-1" htmlFor="triggerBookingConfirm">
                    Envoyer un email de confirmation au patient lors de sa prise de rendez-vous
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="triggerAdminAlert"
                    checked={smtp.triggerAdminAlert}
                    onChange={(e) => setSmtp({ ...smtp, triggerAdminAlert: e.target.checked })}
                  />
                  <label className="form-check-label font-w500 ms-1" htmlFor="triggerAdminAlert">
                    Alerter le cabinet / praticien par email lors de chaque nouvelle réservation
                  </label>
                </div>
                <div className="form-check mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="triggerReminder"
                    checked={smtp.triggerReminder}
                    onChange={(e) => setSmtp({ ...smtp, triggerReminder: e.target.checked })}
                  />
                  <label className="form-check-label font-w500 ms-1" htmlFor="triggerReminder">
                    Envoyer un rappel de rendez-vous par email avant la consultation
                  </label>
                </div>
              </div>

              {/* Boutons d'Action */}
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top">
                <Button variant="primary" type="submit" className="btn-rounded" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Enregistrement en cours...
                    </>
                  ) : (
                    <>
                      <i className="flaticon-381-check-2 me-1"></i> Enregistrer
                    </>
                  )}
                </Button>

                <div className="d-flex gap-2">
                  <Button
                    variant="outline-primary"
                    type="button"
                    className="btn-rounded"
                    disabled={testingConn}
                    onClick={handleTestConnection}
                  >
                    {testingConn ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Test en cours...
                      </>
                    ) : (
                      <>
                        <i className="flaticon-381-send me-1"></i> Tester la Connexion SMTP
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline-secondary"
                    type="button"
                    className="btn-rounded"
                    disabled={sendingTest}
                    onClick={handleSendTestEmail}
                  >
                    {sendingTest ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <i className="flaticon-381-email me-1"></i> Envoyer un Email de Test
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default SmtpConfigPage;
