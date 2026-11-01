import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";

const defaultConsultationTypesList = [
  { id: 1, name: "Consultation de médecine générale", duration: "20 min", price: 2500, active: true },
  { id: 2, name: "Consultation gynécologique / spécialisée", duration: "25 min", price: 3000, active: true },
  { id: 3, name: "Suivi de grossesse / Maternité", duration: "20 min", price: 2500, active: true },
  { id: 4, name: "Échographie obstétricale (T1 / T2 / T3)", duration: "30 min", price: 4000, active: true },
  { id: 5, name: "Échographie pelvienne / gynécologique", duration: "25 min", price: 3500, active: true },
  { id: 6, name: "Consultation avec frottis / acte", duration: "30 min", price: 3500, active: true },
  { id: 7, name: "Visite de contrôle / Bilan", duration: "15 min", price: 1500, active: true },
];

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    defaultDuration: "20 min",
    slotInterval: "15 min",
    defaultConsultationType: "Consultation de médecine générale",
    consultationPrice: 2500,
    consultationTypes: defaultConsultationTypesList,
    smsReminders: true,
    emailReminders: true,
    reminderHoursBefore: "24",
    autoBackup: true,
    backupFrequency: "Quotidienne (23:00)",
    sessionTimeout: "30",
    twoFactorAuth: true,
  });

  // Chargement depuis la base de données MySQL
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await ApiService.getSettings();
        if (data) {
          setSettings((prev) => ({
            ...prev,
            ...data,
            consultationTypes:
              Array.isArray(data.consultationTypes) && data.consultationTypes.length > 0
                ? data.consultationTypes
                : defaultConsultationTypesList,
            defaultConsultationType:
              data.defaultConsultationType || "Consultation de médecine générale",
            consultationPrice:
              data.consultationPrice !== undefined ? data.consultationPrice : 2500,
          }));
        }
      } catch (err) {
        console.error("Erreur chargement paramètres :", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleConsultationTypeChange = (typeName) => {
    const list = settings.consultationTypes || defaultConsultationTypesList;
    const found = list.find((t) => t.name === typeName);
    setSettings((prev) => ({
      ...prev,
      defaultConsultationType: typeName,
      consultationPrice: found ? found.price : prev.consultationPrice,
      defaultDuration: found?.duration ? found.duration : prev.defaultDuration,
    }));
  };

  const handleUpdateTypePrice = (typeId, newPrice) => {
    const numericPrice = parseFloat(newPrice) || 0;
    const list = settings.consultationTypes || defaultConsultationTypesList;
    const updated = list.map((t) =>
      t.id === typeId ? { ...t, price: numericPrice } : t
    );
    const updatedCurrent = updated.find((t) => t.name === settings.defaultConsultationType);
    setSettings((prev) => ({
      ...prev,
      consultationTypes: updated,
      consultationPrice: updatedCurrent ? updatedCurrent.price : prev.consultationPrice,
    }));
  };

  const handleAddConsultationType = () => {
    Swal.fire({
      title: "Ajouter un Type de Consultation",
      html: `
        <div class="text-start">
          <label class="form-label font-w500 mb-1">Nom de la consultation ou de l'acte :</label>
          <input id="swal-type-name" class="form-control mb-3" placeholder="Ex: Consultation Pédiatrique..." />
          
          <label class="form-label font-w500 mb-1">Tarif / Prix (DA) :</label>
          <input id="swal-type-price" type="number" step="100" class="form-control" placeholder="Ex: 3000" value="2500" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Ajouter",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#1e60d5",
      preConfirm: () => {
        const name = document.getElementById("swal-type-name").value.trim();
        const price = parseFloat(document.getElementById("swal-type-price").value) || 0;
        if (!name) {
          Swal.showValidationMessage("Veuillez saisir un nom pour ce type de consultation");
          return false;
        }
        return { name, price };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const newType = {
          id: Date.now(),
          name: result.value.name,
          price: result.value.price,
          active: true,
        };
        const updated = [...(settings.consultationTypes || defaultConsultationTypesList), newType];
        setSettings((prev) => ({
          ...prev,
          consultationTypes: updated,
        }));
        Swal.fire({
          icon: "success",
          title: "Type de consultation ajouté !",
          text: `"${newType.name}" avec tarif ${newType.price} DA a été ajouté.`,
          timer: 1600,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleDeleteConsultationType = (item) => {
    const list = settings.consultationTypes || defaultConsultationTypesList;
    if (list.length <= 1) {
      Swal.fire({
        icon: "warning",
        title: "Action impossible",
        text: "Vous devez conserver au moins un type de consultation dans la grille.",
        confirmButtonColor: "#1e60d5",
      });
      return;
    }

    Swal.fire({
      title: "Supprimer ce type de consultation ?",
      html: `Êtes-vous sûr de vouloir supprimer « <b>${item.name}</b> » de la grille tarifaire ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const updated = list.filter((t) => (t.id ? t.id !== item.id : t.name !== item.name));

        let newDefault = settings.defaultConsultationType;
        let newPrice = settings.consultationPrice;
        let newDuration = settings.defaultDuration;

        // Si on supprime le type actuellement actif par défaut, basculer sur le premier disponible
        if (item.name === settings.defaultConsultationType && updated.length > 0) {
          newDefault = updated[0].name;
          newPrice = updated[0].price;
          newDuration = updated[0].duration || "20 min";
        }

        const newSettings = {
          ...settings,
          consultationTypes: updated,
          defaultConsultationType: newDefault,
          consultationPrice: newPrice,
          defaultDuration: newDuration,
        };

        setSettings(newSettings);

        try {
          await ApiService.updateSettings(newSettings);
          localStorage.setItem("cabinet_settings", JSON.stringify(newSettings));
          Swal.fire({
            icon: "success",
            title: "Supprimé !",
            text: `Le type « ${item.name} » a été supprimé de la grille.`,
            timer: 1600,
            showConfirmButton: false,
          });
        } catch (err) {
          console.warn("Erreur mise à jour MySQL :", err);
          Swal.fire({
            icon: "success",
            title: "Supprimé !",
            text: `Le type « ${item.name} » a été retiré. Pensez à cliquer sur Enregistrer.`,
            timer: 1600,
            showConfirmButton: false,
          });
        }
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await ApiService.updateSettings(settings);
      // Synchroniser également dans localStorage pour réactivité immédiate de l'interface
      localStorage.setItem("cabinet_settings", JSON.stringify(settings));
      Swal.fire({
        icon: "success",
        title: "Paramètres enregistrés avec succès",
        text: "Le type de consultation, le tarif et les préférences de l'agenda sont enregistrés avec succès.",
        confirmButtonColor: "#1e60d5",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Erreur de synchronisation",
        text: "Impossible d'enregistrer dans MySQL : " + err.message,
        confirmButtonColor: "#1e60d5",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle motherMenu="Cabinet et configuration" activeMenu="Paramètres" />

      {/* Onglets de navigation entre Paramètres, SMTP et Mon Cabinet */}
      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
        <button type="button" className="btn btn-sm btn-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-settings-2 me-1"></i> Tarifs & Consultations
        </button>
        <Link to="/admin/smtp" className="btn btn-sm btn-outline-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-email me-1"></i> Configuration SMTP
        </Link>
        <Link to="/admin/clinic" className="btn btn-sm btn-outline-primary btn-rounded px-3 py-2">
          <i className="flaticon-381-home-2 me-1"></i> Mon Cabinet
        </Link>
      </div>

      <div className="card">
        <div className="card-header border-0 pb-0">
          <h4 className="card-title">Paramètres de Gestion du Cabinet Médical</h4>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Chargement des paramètres depuis MySQL...</p>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              {/* Styles pour éliminer complètement les fonds gris de Bootstrap */}
              <style>{`
                .settings-top-box {
                  background-color: #ffffff !important;
                  background: #ffffff !important;
                  border: 1px solid #edf2f7 !important;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
                }
                .settings-table-card {
                  background-color: #ffffff !important;
                  background: #ffffff !important;
                  border: 1px solid #edf2f7 !important;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
                }
                .settings-table {
                  --bs-table-bg: #ffffff !important;
                  --bs-table-accent-bg: transparent !important;
                  --bs-table-striped-bg: transparent !important;
                  background-color: #ffffff !important;
                }
                .settings-table thead,
                .settings-table thead tr,
                .settings-table thead th {
                  background-color: #ffffff !important;
                  background: #ffffff !important;
                  color: #1e293b !important;
                  border-bottom: 2px solid #edf2f7 !important;
                  font-weight: 600 !important;
                  padding: 14px 12px !important;
                }
                .settings-table tbody tr {
                  background-color: #ffffff !important;
                  background: #ffffff !important;
                }
                .settings-table tbody td {
                  background-color: #ffffff !important;
                  background: #ffffff !important;
                  border-color: #f1f5f9 !important;
                  vertical-align: middle !important;
                  padding: 12px 12px !important;
                }
                .settings-table tbody tr.active-item {
                  background-color: #f0f7ff !important;
                  background: #f0f7ff !important;
                }
                .settings-table tbody tr.active-item td {
                  background-color: #f0f7ff !important;
                  background: #f0f7ff !important;
                }
                .settings-table tbody tr:hover td {
                  background-color: #f8fbff !important;
                  background: #f8fbff !important;
                }
              `}</style>

              {/* Type de consultation et Prix de cette consultation */}
              <div className="row mb-4 p-3 rounded settings-top-box">
                <div className="col-md-6 mb-2">
                  <label className="form-label font-w600 text-dark d-flex align-items-center gap-1">
                    <i className="flaticon-381-notepad text-primary"></i>
                    <span>Type de consultation</span>
                  </label>
                  <select
                    className="form-control font-w500 bg-white"
                    value={settings.defaultConsultationType}
                    onChange={(e) => handleConsultationTypeChange(e.target.value)}
                  >
                    {(settings.consultationTypes || defaultConsultationTypesList).map((t) => (
                      <option key={t.id || t.name} value={t.name}>
                        {t.name} — ({Number(t.price).toLocaleString("fr-FR")} DA)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6 mb-2">
                  <label className="form-label font-w600 text-dark d-flex align-items-center gap-1">
                    <i className="flaticon-381-price-tag text-primary"></i>
                    <span>Prix de cette consultation</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      step="100"
                      min="0"
                      className="form-control font-w700 text-primary fs-16 bg-white"
                      value={settings.consultationPrice}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSettings({ ...settings, consultationPrice: val });
                      }}
                      placeholder="Ex: 2500"
                      required
                    />
                    <span className="input-group-text font-w700 bg-white text-primary border-start-0" style={{ letterSpacing: "0.5px" }}>
                      DA
                    </span>
                  </div>
                </div>
              </div>

              {/* Grille Tarifaire Complète des Types de Consultation */}
              <div className="card mb-4 settings-table-card">
                <div className="card-header bg-white py-3 px-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h6 className="mb-0 font-w600 text-dark">
                      <i className="flaticon-381-list-1 me-2 text-primary"></i>
                      Grille Tarifaire des Actes & Consultations du Cabinet
                    </h6>
                    <small className="text-muted">Gérez les prix de chaque type de consultation ou ajoutez-en de nouveaux</small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-primary"
                    onClick={handleAddConsultationType}
                  >
                    <i className="flaticon-381-add-1 me-1"></i> + Ajouter un type de consultation
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-sm mb-0 settings-table">
                      <thead>
                        <tr>
                          <th className="ps-3">Type De Consultation / Acte</th>
                          <th>Prix (DA)</th>
                          <th className="text-end pe-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(settings.consultationTypes || defaultConsultationTypesList).map((item) => {
                          const isDefault = item.name === settings.defaultConsultationType;
                          return (
                            <tr
                              key={item.id || item.name}
                              className={isDefault ? "active-item" : ""}
                            >
                              <td className="ps-3 font-w600 text-dark">
                                {item.name}
                              </td>
                              <td style={{ width: "200px" }}>
                                <div className="input-group input-group-sm">
                                  <input
                                    type="number"
                                    step="100"
                                    className="form-control form-control-sm font-w600 text-primary py-0 bg-white"
                                    value={item.price}
                                    onChange={(e) => handleUpdateTypePrice(item.id, e.target.value)}
                                  />
                                  <span className="input-group-text py-0 bg-white text-dark">DA</span>
                                </div>
                              </td>
                              <td className="text-end pe-3">
                                <div className="d-flex align-items-center justify-content-end">
                                  {!isDefault ? (
                                    <button
                                      type="button"
                                      className="btn btn-xs btn-outline-primary me-2"
                                      onClick={() => handleConsultationTypeChange(item.name)}
                                      title="Définir ce type et son prix par défaut"
                                    >
                                      Choisir
                                    </button>
                                  ) : (
                                    <span className="badge badge-sm badge-primary light font-w600 me-2">
                                      <i className="fa fa-check me-1"></i> Actuel
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-danger shadow btn-xs sharp"
                                    onClick={() => handleDeleteConsultationType(item)}
                                    title="Supprimer ce type de consultation"
                                  >
                                    <i className="fa fa-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>


              <div className="d-flex justify-content-end mt-4">
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
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default SettingsPage;
