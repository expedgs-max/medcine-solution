import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import PageTitle from "../../layouts/PageTitle";
import ApiService from "../../../services/ApiService";

// Liste complète et officielle des pages et modules existants dans le site médical
export const SITE_PAGES = [
  {
    id: "dashboard",
    name: "Tableau de bord",
    path: "/dashboard",
    category: "Principal",
    icon: "flaticon-381-networking",
    description: "Indicateurs clés, rendez-vous du jour, recettes et résumé général",
  },
  {
    id: "appointments",
    name: "Agenda & Rendez-vous",
    path: "/appointments",
    category: "Principal",
    icon: "flaticon-381-calendar-1",
    description: "Calendrier médical, créneaux de consultation et prise de RDV",
  },
  {
    id: "patients",
    name: "Gestion des Patients",
    path: "/patients",
    category: "Principal",
    icon: "flaticon-381-user-7",
    description: "Liste complète des patients, coordonnées et nouvelles inscriptions",
  },
  {
    id: "patient-details",
    name: "Dossier Patient",
    path: "/patient-details",
    category: "Principal",
    icon: "flaticon-381-id-card",
    description: "Dossier médical individuel, constantes, antécédents et antériorités",
  },
  {
    id: "waiting-room",
    name: "Salle d'attente",
    path: "/waiting-room",
    category: "Principal",
    icon: "flaticon-381-clock-1",
    description: "Gestion des arrivées, ordre de passage et appel des patients",
  },
  {
    id: "affichage-salle-attente",
    name: "Écran Salle d'attente",
    path: "/affichage-salle-attente",
    category: "Principal",
    icon: "flaticon-381-television",
    description: "Affichage public dynamique sur écran de télévision pour les patients",
  },
  {
    id: "consultations",
    name: "Consultations Médicales",
    path: "/consultations",
    category: "Médical",
    icon: "flaticon-381-notepad",
    description: "Examen clinique gynéco-obstétrique, motif, diagnostic et actes",
  },
  {
    id: "medical-records",
    name: "Dossiers Médicaux",
    path: "/medical-records",
    category: "Médical",
    icon: "flaticon-381-folder",
    description: "Archives des dossiers médicaux, historiques et diagnostics",
  },
  {
    id: "prescriptions",
    name: "Ordonnances",
    path: "/prescriptions",
    category: "Médical",
    icon: "flaticon-381-file-1",
    description: "Rédaction, impression et signature des ordonnances médicamenteuses",
  },
  {
    id: "medical-documents",
    name: "Documents Médicaux",
    path: "/medical-documents",
    category: "Médical",
    icon: "flaticon-381-layer-1",
    description: "Certificats médicaux, courriers confrères et comptes-rendus",
  },
  {
    id: "invoices",
    name: "Factures",
    path: "/invoices",
    category: "Financier",
    icon: "flaticon-381-calculator",
    description: "Émission de factures, encaissements et feuilles de soins",
  },
  {
    id: "reports",
    name: "Rapports & Statistiques",
    path: "/reports",
    category: "Financier",
    icon: "flaticon-381-controls-3",
    description: "Chiffre d'affaires, statistiques d'actes et bilans d'activité",
  },
  {
    id: "staff",
    name: "Utilisateurs",
    path: "/staff",
    category: "Configuration",
    icon: "flaticon-381-user-9",
    description: "Gestion des comptes administrateurs et matrice des rôles d'accès",
  },
  {
    id: "clinic",
    name: "Mon Cabinet",
    path: "/clinic",
    category: "Configuration",
    icon: "flaticon-381-home-2",
    description: "Informations légales, coordonnées et en-têtes officielles du praticien",
  },
  {
    id: "settings",
    name: "Paramètres",
    path: "/settings",
    category: "Configuration",
    icon: "flaticon-381-settings-2",
    description: "Tarification des actes, horaires et personnalisation du système",
  },
  {
    id: "cashflow",
    name: "Journal de Caisse",
    path: "/cashflow",
    category: "Financier",
    icon: "fa fa-cash-register",
    description: "Recettes, dépenses, solde de caisse et clôtures journalières",
  },
  {
    id: "payments",
    name: "Paiements & Encaissements",
    path: "/payments",
    category: "Financier",
    icon: "flaticon-381-calculator-1",
    description: "Suivi des règlements patients, encaissements et modes de paiement",
  },
  {
    id: "smtp",
    name: "Configuration SMTP",
    path: "/smtp",
    category: "Configuration",
    icon: "flaticon-381-send",
    description: "Serveur d'envoi d'emails, alertes automatiques et notifications",
  },
  {
    id: "profile",
    name: "Profil Praticien",
    path: "/profile",
    category: "Configuration",
    icon: "flaticon-381-user-1",
    description: "Profil personnel, spécialité médicale et coordonnées du praticien",
  },
  {
    id: "support",
    name: "Aide & Support",
    path: "/support",
    category: "Configuration",
    icon: "flaticon-381-help",
    description: "Assistance technique, documentation et raccourcis d'aide",
  },
];

// Rôles initiaux par défaut
export const DEFAULT_ROLES = [
  {
    id: "role-superadmin",
    name: "Médecin Titulaire (Super Admin)",
    description: "Accès total et illimité à l'ensemble des modules médicaux, administratifs et de sécurité",
    badgeColor: "#1e60d5",
    isSystem: true,
    pages: SITE_PAGES.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}),
  },
  {
    id: "role-secretary",
    name: "Secrétaire Médicale",
    description: "Accueil physique, gestion de l'agenda, file d'attente, encaissements et facturation (Secret médical protégé)",
    badgeColor: "#0ea5e9",
    isSystem: false,
    pages: {
      dashboard: true,
      appointments: true,
      patients: true,
      "patient-details": true,
      "waiting-room": true,
      "affichage-salle-attente": true,
      consultations: false,
      "medical-records": false,
      prescriptions: false,
      "medical-documents": false,
      invoices: true,
      cashflow: true,
      payments: true,
      reports: false,
      staff: false,
      clinic: false,
      settings: false,
      smtp: false,
      profile: false,
      support: true,
    },
  },
  {
    id: "role-accountant",
    name: "Comptable / Gestionnaire",
    description: "Gestion de la caisse, encaissements, facturation et analyse des rapports financiers",
    badgeColor: "#f59e0b",
    isSystem: false,
    pages: {
      dashboard: true,
      appointments: false,
      patients: false,
      "patient-details": false,
      "waiting-room": false,
      "affichage-salle-attente": false,
      consultations: false,
      "medical-records": false,
      prescriptions: false,
      "medical-documents": false,
      invoices: true,
      cashflow: true,
      payments: true,
      reports: true,
      staff: false,
      clinic: false,
      settings: false,
      smtp: false,
      profile: false,
      support: true,
    },
  },
];

// Comptes utilisateurs initiaux
export const DEFAULT_ACCOUNTS = [
  {
    id: "acc-1",
    name: "Dr N. BELBACHIR OULD HENNIA",
    username: "admin",
    password: "admin123",
    email: "dr.belbachir@cabinet-medical.dz",
    phone: "01 42 68 50 10",
    roleId: "role-superadmin",
    roleName: "Médecin Titulaire (Super Admin)",
    status: "Actif",
    type: "doctor",
    createdAt: "2024-01-15",
  },
  {
    id: "acc-2",
    name: "Sophie Vasseur",
    username: "secretaire",
    password: "123",
    email: "accueil@cabinet-saint-honore.fr",
    phone: "01 42 68 50 11",
    roleId: "role-secretary",
    roleName: "Secrétaire Médicale",
    status: "Actif",
    type: "secretary",
    createdAt: "2024-02-01",
  },
];

const StaffPage = ({ initialView = "list" }) => {
  // États principaux
  const [activeTab, setActiveTab] = useState("accounts"); // 'accounts' | 'roles'
  const [viewMode, setViewMode] = useState(initialView); // 'list' | 'account-form' | 'role-form'
  const searchQuery = "";
  const statusFilter = "Tous";

  // Données persistées dans localStorage
  const [roles, setRoles] = useState(() => {
    try {
      const saved = localStorage.getItem("cabinet_staff_roles");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ROLES;
  });

  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem("cabinet_staff_accounts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const customAdminPass = localStorage.getItem("cabinet_admin_password") || "admin123";
          return parsed.map((a) => ({
            ...a,
            password:
              a.password && a.password !== "••••••••"
                ? a.password
                : (a.username === "admin"
                    ? customAdminPass
                    : (a.username === "secretaire" ? "123" : "123456")),
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ACCOUNTS;
  });

  // Chargement initial des rôles et utilisateurs depuis la base de données MySQL
  useEffect(() => {
    const fetchDbData = async () => {
      // 1. Charger les rôles depuis MySQL
      try {
        const rolesData = await ApiService.getRoles();
        if (Array.isArray(rolesData) && rolesData.length > 0) {
          setRoles(rolesData);
          localStorage.setItem("cabinet_staff_roles", JSON.stringify(rolesData));
        }
      } catch (err) {
        console.warn("Erreur chargement rôles MySQL :", err);
      }

      // 2. Charger les comptes utilisateurs depuis MySQL
      try {
        const staffData = await ApiService.getStaff();
        if (Array.isArray(staffData) && staffData.length > 0) {
          const customAdminPass = localStorage.getItem("cabinet_admin_password") || "admin123";
          const mapped = staffData.map((s) => {
            const isDoctor = s.type === "doctor";
            const username = s.username || (isDoctor ? "admin" : (s.email ? s.email.split("@")[0] : `user${s.id}`));
            const existing = (accounts || DEFAULT_ACCOUNTS).find(
              (a) => a.id === s.id || a.username === username
            );
            const actualPassword =
              existing?.password && existing.password !== "••••••••"
                ? existing.password
                : (isDoctor ? customAdminPass : (username === "secretaire" ? "123" : "123456"));

            return {
              id: s.id,
              name: s.name,
              username: username,
              password: actualPassword,
              email: s.email || "",
              phone: s.phone || "",
              roleId: s.roleId || (isDoctor ? "role-superadmin" : "role-secretary"),
              roleName: s.roleName || s.role || (isDoctor ? "Médecin Titulaire (Super Admin)" : "Secrétaire Médicale"),
              badgeColor: s.badgeColor || (isDoctor ? "#1e60d5" : "#0ea5e9"),
              status: s.status || "Actif",
              type: s.type || (isDoctor ? "doctor" : "secretary"),
              createdAt: s.createdAt ? s.createdAt.split(" ")[0] : "2024-01-15",
            };
          });
          setAccounts(mapped);
          localStorage.setItem("cabinet_staff_accounts", JSON.stringify(mapped));
        }
      } catch (err) {
        console.warn("Erreur chargement personnel MySQL :", err);
      }
    };
    fetchDbData();
  }, []);

  // Sauvegardes synchronisées dans localStorage
  useEffect(() => {
    localStorage.setItem("cabinet_staff_roles", JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem("cabinet_staff_accounts", JSON.stringify(accounts));
  }, [accounts]);

  // Formulaire Compte Utilisateur (Pleine page)
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    roleId: "role-superadmin",
    status: "Actif",
  });

  // Formulaire Rôle & Permissions (Pleine page)
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [pageCategoryFilter, setPageCategoryFilter] = useState("Tous");
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    badgeColor: "#1e60d5",
    pages: SITE_PAGES.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}),
  });

  // =========================================================================
  // GESTION DES COMPTES (Créer, Modifier, Supprimer, Statut)
  // =========================================================================
  const handleOpenNewAccount = () => {
    setEditingAccountId(null);
    setAccountForm({
      name: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      roleId: roles[0]?.id || "role-superadmin",
      status: "Actif",
    });
    setShowPassword(false);
    setViewMode("account-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditAccount = (acc) => {
    setEditingAccountId(acc.id);
    const customAdminPass = localStorage.getItem("cabinet_admin_password") || "admin123";
    const resolvedPassword =
      acc.password && acc.password !== "••••••••"
        ? acc.password
        : (acc.username === "admin"
            ? customAdminPass
            : (acc.username === "secretaire" ? "123" : "123456"));

    setAccountForm({
      name: acc.name || "",
      username: acc.username || "",
      email: acc.email || "",
      phone: acc.phone || "",
      password: resolvedPassword,
      roleId: acc.roleId || roles[0]?.id,
      status: acc.status || "Actif",
    });
    setShowPassword(false);
    setViewMode("account-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();

    const cleanName = accountForm.name.trim();
    const cleanUsername = accountForm.username.trim().toLowerCase();
    const cleanPass = accountForm.password.trim();

    if (!cleanName || !cleanUsername) {
      Swal.fire({
        icon: "warning",
        title: "Champs obligatoires",
        text: "Veuillez renseigner le nom complet et le nom d'utilisateur.",
      });
      return;
    }

    // Vérification unicité identifiant
    const isTaken = accounts.some(
      (a) => a.username.toLowerCase() === cleanUsername && a.id !== editingAccountId
    );
    if (isTaken) {
      Swal.fire({
        icon: "error",
        title: "Identifiant indisponible",
        text: "Ce nom d'utilisateur est déjà utilisé par un autre compte.",
      });
      return;
    }

    if (!editingAccountId && !cleanPass) {
      Swal.fire({
        icon: "warning",
        title: "Mot de passe requis",
        text: "Veuillez définir un mot de passe pour le nouveau compte.",
      });
      return;
    }

    const assignedRole = roles.find((r) => r.id === accountForm.roleId) || roles[0];

    try {
      if (editingAccountId) {
        // Modification
        if (cleanPass && cleanPass !== "••••••••" && cleanUsername === "admin") {
          localStorage.setItem("cabinet_admin_password", cleanPass);
        }

        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === editingAccountId) {
              return {
                ...acc,
                name: cleanName,
                username: cleanUsername,
                email: accountForm.email.trim(),
                phone: accountForm.phone.trim(),
                password: cleanPass && cleanPass !== "••••••••" ? cleanPass : acc.password,
                roleId: assignedRole.id,
                roleName: assignedRole.name,
                status: accountForm.status,
              };
            }
            return acc;
          })
        );

        // Enregistrement direct et persistant dans la base de données MySQL
        await ApiService.saveStaffUser({
          id: editingAccountId,
          name: cleanName,
          username: cleanUsername,
          email: accountForm.email.trim() || `${cleanUsername}@cabinet.dz`,
          phone: accountForm.phone.trim(),
          roleId: assignedRole.id,
          role_id: assignedRole.id,
          role: assignedRole.name,
          roleName: assignedRole.name,
          badgeColor: assignedRole.badgeColor,
          type: cleanUsername === "admin" ? "doctor" : "secretary",
          status: accountForm.status,
          accessLevel: assignedRole.name,
          password: cleanPass && cleanPass !== "••••••••" ? cleanPass : undefined,
        });

        Swal.fire({
          icon: "success",
          title: "Enregistré avec succès !",
          text: `Les informations du compte de ${cleanName} sont bien sauvegardées dans MySQL.`,
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        // Création
        const newAcc = {
          id: "acc-" + Date.now(),
          name: cleanName,
          username: cleanUsername,
          password: cleanPass,
          email: accountForm.email.trim(),
          phone: accountForm.phone.trim(),
          roleId: assignedRole.id,
          roleName: assignedRole.name,
          status: accountForm.status,
          type: cleanUsername === "admin" ? "doctor" : "secretary",
          createdAt: new Date().toISOString().split("T")[0],
        };
        setAccounts((prev) => [newAcc, ...prev]);

        // Enregistrement direct dans MySQL
        const saveRes = await ApiService.saveStaffUser({
          name: cleanName,
          username: cleanUsername,
          email: accountForm.email.trim() || `${cleanUsername}@cabinet.dz`,
          phone: accountForm.phone.trim(),
          roleId: assignedRole.id,
          role_id: assignedRole.id,
          role: assignedRole.name,
          roleName: assignedRole.name,
          badgeColor: assignedRole.badgeColor,
          type: cleanUsername === "admin" ? "doctor" : "secretary",
          status: accountForm.status,
          accessLevel: assignedRole.name,
          password: cleanPass,
        });
        if (saveRes?.data?.id) {
          newAcc.id = saveRes.data.id;
        }

        Swal.fire({
          icon: "success",
          title: "Compte créé avec succès !",
          text: `Le compte utilisateur pour ${cleanName} a été ajouté dans MySQL.`,
          timer: 1800,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Erreur enregistrement MySQL :", err);
      Swal.fire({
        icon: "warning",
        title: "Enregistrement local appliqué",
        text: "Modifications enregistrées localement. Détail : " + (err.message || ""),
      });
    }

    setViewMode("list");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteAccount = (acc) => {
    // Empêcher la suppression du compte admin principal
    if (acc.username === "admin" || acc.type === "doctor" || acc.id === 1) {
      Swal.fire({
        icon: "info",
        title: "Compte protégé",
        text: "Le compte principal du Médecin Titulaire ne peut pas être supprimé pour garantir l'accès au cabinet.",
      });
      return;
    }

    Swal.fire({
      title: `Supprimer le compte ?`,
      html: `Êtes-vous sûr de vouloir supprimer définitivement le compte de <b>${acc.name}</b> (<i>@${acc.username}</i>) ?<br/><small class="text-danger">Cette action révoquera immédiatement tous ses accès au cabinet.</small>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6e7881",
      confirmButtonText: "Oui, supprimer le compte",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
        try {
          await ApiService.deleteStaffUser(acc.id);
        } catch (e) {
          console.warn("Erreur suppression MySQL :", e);
        }
        Swal.fire({
          icon: "success",
          title: "Compte supprimé avec succès",
          text: `Le compte de ${acc.name} a été supprimé.`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleToggleStatus = (acc) => {
    if (acc.username === "admin") {
      Swal.fire({
        icon: "info",
        title: "Opération non autorisée",
        text: "Le compte Administrateur Principal doit rester actif.",
      });
      return;
    }
    const newStatus = acc.status === "Actif" ? "Inactif" : "Actif";
    setAccounts((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, status: newStatus } : a))
    );
    Swal.fire({
      icon: newStatus === "Actif" ? "success" : "warning",
      title: `Compte ${newStatus === "Actif" ? "activé" : "désactivé"}`,
      text: `${acc.name} est désormais ${newStatus.toLowerCase()}.`,
      timer: 1200,
      showConfirmButton: false,
    });
  };

  // =========================================================================
  // GESTION DES RÔLES & PERMISSIONS PAR PAGE
  // =========================================================================
  const handleOpenNewRole = () => {
    setEditingRoleId(null);
    setRoleForm({
      name: "",
      description: "",
      badgeColor: "#1e60d5",
      pages: SITE_PAGES.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}),
    });
    setPageCategoryFilter("Tous");
    setViewMode("role-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditRole = (role) => {
    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name || "",
      description: role.description || "",
      badgeColor: role.badgeColor || "primary",
      pages: {
        ...SITE_PAGES.reduce((acc, p) => ({ ...acc, [p.id]: false }), {}),
        ...(role.pages || {}),
      },
    });
    setPageCategoryFilter("Tous");
    setViewMode("role-form");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    const cleanName = roleForm.name.trim();

    if (!cleanName) {
      Swal.fire({
        icon: "warning",
        title: "Nom du rôle requis",
        text: "Veuillez attribuer un nom clair au rôle (ex: Secrétaire, Médecin Associé...).",
      });
      return;
    }

    const rolePayload = {
      id: editingRoleId || undefined,
      name: cleanName,
      description: roleForm.description.trim(),
      badgeColor: roleForm.badgeColor || "#1e60d5",
      badge_color: roleForm.badgeColor || "#1e60d5",
      pages: roleForm.pages,
    };

    try {
      const res = await ApiService.saveRole(rolePayload);
      const savedRole = res?.data || {
        id: editingRoleId || ("role-" + Date.now()),
        name: cleanName,
        description: roleForm.description.trim(),
        badgeColor: roleForm.badgeColor || "#1e60d5",
        isSystem: false,
        pages: roleForm.pages,
      };

      if (editingRoleId) {
        setRoles((prev) =>
          prev.map((r) => (r.id === editingRoleId ? { ...r, ...savedRole } : r))
        );
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.roleId === editingRoleId
              ? { ...acc, roleName: cleanName, badgeColor: savedRole.badgeColor }
              : acc
          )
        );
      } else {
        setRoles((prev) => [...prev, savedRole]);
      }

      Swal.fire({
        icon: "success",
        title: editingRoleId ? "Rôle mis à jour dans MySQL" : "Nouveau rôle créé dans MySQL",
        text: `Le rôle « ${cleanName} » a été enregistré dans la base de données.`,
        timer: 1600,
        showConfirmButton: false,
      });

      setViewMode("list");
      setActiveTab("roles");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erreur enregistrement rôle MySQL :", err);
      Swal.fire({
        icon: "error",
        title: "Erreur d'enregistrement",
        text: "Impossible d'enregistrer le rôle dans MySQL : " + (err.response?.data?.message || err.message),
      });
    }
  };

  const handleDeleteRole = (role) => {
    if (role.isSystem || role.id === "role-superadmin") {
      Swal.fire({
        icon: "info",
        title: "Rôle système protégé",
        text: "Le rôle Super Administrateur est indispensable au fonctionnement du cabinet.",
      });
      return;
    }

    // Vérifier si des utilisateurs ont ce rôle
    const assignedUsers = accounts.filter((a) => a.roleId === role.id);
    if (assignedUsers.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Rôle en cours d'utilisation",
        html: `Ce rôle est actuellement attribué à <b>${assignedUsers.length}</b> utilisateur(s) (${assignedUsers.map((u) => u.name).join(", ")}).<br/><small class="text-muted">Veuillez d'abord modifier leurs comptes vers un autre rôle avant de le supprimer.</small>`,
      });
      return;
    }

    Swal.fire({
      title: `Supprimer le rôle ?`,
      html: `Êtes-vous sûr de vouloir supprimer définitivement le rôle <b>« ${role.name} »</b> de la base de données MySQL ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6e7881",
      confirmButtonText: "Oui, supprimer le rôle",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await ApiService.deleteRole(role.id);
          setRoles((prev) => prev.filter((r) => r.id !== role.id));
          Swal.fire({
            icon: "success",
            title: "Rôle supprimé de MySQL",
            text: `Le rôle « ${role.name} » a été retiré de la base de données.`,
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (err) {
          console.error("Erreur suppression rôle MySQL :", err);
          Swal.fire({
            icon: "error",
            title: "Erreur suppression",
            text: err.response?.data?.message || "Impossible de supprimer ce rôle de la base de données.",
          });
        }
      }
    });
  };

  const handleTogglePagePermission = (pageId) => {
    setRoleForm((prev) => ({
      ...prev,
      pages: {
        ...prev.pages,
        [pageId]: !prev.pages[pageId],
      },
    }));
  };

  const handleSelectAllPages = (selectAll) => {
    setRoleForm((prev) => ({
      ...prev,
      pages: SITE_PAGES.reduce((acc, p) => ({ ...acc, [p.id]: selectAll }), {}),
    }));
  };

  // =========================================================================
  // CALCULS & FILTRES
  // =========================================================================
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.email && acc.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (acc.roleName && acc.roleName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "Tous" || acc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countAllowedPages = (rolePages = {}) => {
    return Object.values(rolePages).filter(Boolean).length;
  };

  // =========================================================================
  // VUE 1 : NOUVEAU / MODIFIER COMPTE (PLEINE PAGE - PAS DE POPUP)
  // =========================================================================
  if (viewMode === "account-form") {
    const selectedRole = roles.find((r) => r.id === accountForm.roleId) || roles[0];
    const allowedPages = SITE_PAGES.filter(
      (p) => selectedRole && selectedRole.pages && selectedRole.pages[p.id]
    );

    return (
      <div className="fade-in-up">
        <PageTitle
          motherMenu="Cabinet & Configuration"
          activeMenu={editingAccountId ? "Modifier le Compte Administrateur" : "Nouveau Compte Administrateur"}
        />

        {/* Barre de retour */}
        <div className="mb-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm btn-rounded d-inline-flex align-items-center gap-2"
            onClick={() => {
              setViewMode("list");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <i className="fa fa-arrow-left"></i>
            <span>Retour à la liste du personnel</span>
          </button>
        </div>

        {/* Styles pour uniformiser exactement la taille et la hauteur de tous les champs */}
        <style>{`
          .staff-form-card .form-control,
          .staff-form-card .form-select,
          .staff-form-card .input-group-text,
          .staff-form-card .input-group .btn {
            height: 48px !important;
            min-height: 48px !important;
            max-height: 48px !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            box-sizing: border-box !important;
          }
          .staff-form-card .form-control,
          .staff-form-card .form-select {
            border-radius: 8px !important;
            border: 1px solid #dcdce4 !important;
            padding: 10px 14px !important;
            background-color: #ffffff !important;
          }
          .staff-form-card .form-control:focus,
          .staff-form-card .form-select:focus {
            border-color: #1e60d5 !important;
            box-shadow: 0 0 0 3px rgba(30, 96, 213, 0.12) !important;
          }
          .staff-form-card .input-group {
            height: 48px !important;
            display: flex !important;
            align-items: stretch !important;
          }
          .staff-form-card .input-group .form-control {
            border-radius: 0 !important;
          }
          .staff-form-card .input-group > :first-child {
            border-top-left-radius: 8px !important;
            border-bottom-left-radius: 8px !important;
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          .staff-form-card .input-group > :last-child {
            border-top-right-radius: 8px !important;
            border-bottom-right-radius: 8px !important;
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
          }
          .staff-form-card .input-group-text {
            background-color: #f8fafc !important;
            border: 1px solid #dcdce4 !important;
            border-right: 0 !important;
            color: #64748b !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 16px !important;
          }
          .staff-form-card .input-group .btn {
            border: 1px solid #dcdce4 !important;
            border-left: 0 !important;
            background-color: #ffffff !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .staff-form-card .input-group .btn:hover {
            background-color: #f8fafc !important;
          }
          .staff-form-card .form-label {
            min-height: 24px;
            margin-bottom: 8px;
            font-weight: 600;
            font-size: 13.5px;
          }
        `}</style>

        {/* Formulaire Pleine Page */}
        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-10 col-12">
            <div className="card border-0 shadow-sm staff-form-card">
              <div className="card-header border-bottom py-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="avatar-preview bg-primary-light text-primary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 46, height: 46, minWidth: 46 }}
                  >
                    <i className="flaticon-381-user-7 fs-22"></i>
                  </div>
                  <div>
                    <h5 className="card-title mb-1 font-w600 text-dark">
                      {editingAccountId
                        ? "Modifier le Compte Utilisateur"
                        : "Créer un Nouveau Compte Administrateur"}
                    </h5>
                    <p className="card-text text-muted fs-12 mb-0">
                      Renseignez les coordonnées de l'utilisateur et attribuez son rôle et ses permissions d'accès au cabinet.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveAccount}>
                <div className="card-body p-4">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-w600 text-dark d-flex align-items-center">
                        <span>Nom complet du titulaire</span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex : Dr N. BELBACHIR OULD HENNIA"
                        value={accountForm.name}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label font-w600 text-dark d-flex align-items-center">
                        <span>Nom d'utilisateur (Identifiant de connexion)</span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text">@</span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ex : dr.belbachir ou secretaire"
                          value={accountForm.username}
                          onChange={(e) =>
                            setAccountForm({
                              ...accountForm,
                              username: e.target.value.toLowerCase().replace(/\s+/g, ""),
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label font-w600 text-dark d-flex align-items-center justify-content-between">
                        <span>
                          Mot de passe {editingAccountId ? null : <span className="text-danger">*</span>}
                        </span>
                        {editingAccountId && (
                          <span className="text-muted fs-11 font-w400">
                            (Laisser vide pour ne pas modifier)
                          </span>
                        )}
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          placeholder={
                            editingAccountId
                              ? "Nouveau mot de passe (optionnel)"
                              : "Mot de passe sécurisé"
                          }
                          value={accountForm.password}
                          onChange={(e) =>
                            setAccountForm({
                              ...accountForm,
                              password: e.target.value,
                            })
                          }
                          required={!editingAccountId}
                          autoComplete="new-password"
                        />
                        <button
                          className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPassword(!showPassword);
                          }}
                          title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          style={{ minWidth: "48px" }}
                        >
                          <i
                            className={`fa ${showPassword ? "fa-eye-slash text-primary" : "fa-eye text-muted"}`}
                            style={{ fontSize: "16px" }}
                          ></i>
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label font-w600 text-dark d-flex align-items-center">
                        <span>Rôle & Droits d'Accès</span>
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={accountForm.roleId}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, roleId: e.target.value })
                        }
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({countAllowedPages(r.pages)}/{SITE_PAGES.length} pages)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label font-w600 text-dark d-flex align-items-center">
                        Adresse Email
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="contact@cabinet-medical.dz"
                        value={accountForm.email}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, email: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label font-w600 text-dark d-flex align-items-center">
                        Téléphone professionnel
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex : 01 42 68 50 10 ou 05 50 ..."
                        value={accountForm.phone}
                        onChange={(e) =>
                          setAccountForm({ ...accountForm, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label font-w600 text-dark">
                        Statut du Compte
                      </label>
                      <div className="d-flex gap-4">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="accountStatus"
                            id="statusActive"
                            value="Actif"
                            checked={accountForm.status === "Actif"}
                            onChange={() =>
                              setAccountForm({ ...accountForm, status: "Actif" })
                            }
                          />
                          <label
                            className="form-check-label text-success font-w600"
                            htmlFor="statusActive"
                            style={{ cursor: "pointer" }}
                          >
                            <i className="fa fa-check-circle me-1"></i> Actif (Connexion autorisée)
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="accountStatus"
                            id="statusInactive"
                            value="Inactif"
                            checked={accountForm.status === "Inactif"}
                            onChange={() =>
                              setAccountForm({ ...accountForm, status: "Inactif" })
                            }
                          />
                          <label
                            className="form-check-label text-danger font-w600"
                            htmlFor="statusInactive"
                            style={{ cursor: "pointer" }}
                          >
                            <i className="fa fa-times-circle me-1"></i> Inactif (Accès suspendu)
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aperçu des permissions du rôle sélectionné */}
                  {selectedRole && (
                    <div className="p-3 bg-white rounded mt-3 border" style={{ borderColor: "#e2e8f0" }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="font-w600 text-dark fs-12">
                          <i className="flaticon-381-shield-1 text-primary me-1"></i>
                          Aperçu des accès accordés pour le rôle « {selectedRole.name} » :
                        </span>
                        <span className="badge bg-primary fs-11">
                          {allowedPages.length} / {SITE_PAGES.length} pages
                        </span>
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {allowedPages.map((p) => (
                          <span
                            key={p.id}
                            className="badge bg-white text-dark border fs-11 font-w500"
                          >
                            <i className={`${p.icon} text-primary me-1`}></i>
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer border-top d-flex justify-content-end gap-2 bg-white py-3 px-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setViewMode("list");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                    <i className="fa fa-save"></i>
                    <span>
                      {editingAccountId ? "Enregistrer les modifications" : "Créer le compte"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VUE 2 : NOUVEAU / MODIFIER RÔLE (PLEINE PAGE - PAS DE POPUP)
  // =========================================================================
  if (viewMode === "role-form") {
    return (
      <div className="fade-in-up">
        <PageTitle
          motherMenu="Cabinet & Configuration"
          activeMenu={editingRoleId ? "Modifier le Rôle & Accès" : "Nouveau Rôle de Sécurité"}
        />

        {/* Barre de retour */}
        <div className="mb-4">
          <button
            type="button"
            className="btn btn-outline-primary btn-sm btn-rounded d-inline-flex align-items-center gap-2"
            onClick={() => {
              setViewMode("list");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <i className="fa fa-arrow-left"></i>
            <span>Retour à la liste du personnel</span>
          </button>
        </div>

        {/* Formulaire Pleine Page */}
        <div className="row justify-content-center">
          <div className="col-xl-10 col-12">
            <div className="card border-0 shadow-sm staff-form-card">
              <div className="card-header border-bottom py-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="avatar-preview bg-primary-light text-primary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 46, height: 46, minWidth: 46 }}
                  >
                    <i className="flaticon-381-shield-1 fs-22"></i>
                  </div>
                  <div>
                    <h5 className="card-title mb-1 font-w600 text-dark">
                      {editingRoleId
                        ? "Modifier le Rôle & la Matrice des Permissions"
                        : "Créer un Nouveau Rôle de Sécurité"}
                    </h5>
                    <p className="card-text text-muted fs-12 mb-0">
                      Définissez les autorisations d'accès aux différentes rubriques et fonctionnalités du cabinet.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveRole}>
                <div className="card-body p-4">
                  <div className="row">
                    <div className="col-md-7 mb-3">
                      <label className="form-label font-w600 text-dark">
                        Nom du rôle <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex : Secrétaire Médicale, Médecin Remplaçant, Infirmier..."
                        value={roleForm.name}
                        onChange={(e) =>
                          setRoleForm({ ...roleForm, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="col-md-5 mb-3">
                      <label className="form-label font-w600 text-dark d-flex align-items-center justify-content-between mb-2">
                        <span>Couleur du badge</span>
                        <span
                          className="d-inline-flex align-items-center px-2 py-0.5 rounded-pill fs-11 font-w600"
                          style={{
                            backgroundColor: (roleForm.badgeColor || "#1e60d5") + "18",
                            color: roleForm.badgeColor || "#1e60d5",
                            border: `1px solid ${(roleForm.badgeColor || "#1e60d5")}44`,
                          }}
                        >
                          <span
                            className="me-1"
                            style={{
                              display: "inline-block",
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              backgroundColor: roleForm.badgeColor || "#1e60d5",
                            }}
                          />
                          {roleForm.badgeColor || "#1e60d5"}
                        </span>
                      </label>
                      <div className="d-flex align-items-center gap-2 flex-wrap p-2 border rounded bg-light">
                        {[
                          { hex: "#1e60d5", label: "Bleu Primaire" },
                          { hex: "#0ea5e9", label: "Cyan Secrétariat" },
                          { hex: "#10b981", label: "Vert Émeraude" },
                          { hex: "#f59e0b", label: "Orange Comptable" },
                          { hex: "#8b5cf6", label: "Violet Royal" },
                          { hex: "#ef4444", label: "Rouge Corail" },
                          { hex: "#ec4899", label: "Rose Fushia" },
                          { hex: "#64748b", label: "Gris Ardoise" },
                          { hex: "#0f172a", label: "Bleu Sombre" },
                        ].map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            className="btn p-0 rounded-circle"
                            style={{
                              width: "26px",
                              height: "26px",
                              backgroundColor: c.hex,
                              border: roleForm.badgeColor === c.hex ? "3px solid #1e293b" : "2px solid #ffffff",
                              boxShadow: roleForm.badgeColor === c.hex ? "0 0 0 2px #0ea5e9" : "0 1px 3px rgba(0,0,0,0.2)",
                              cursor: "pointer",
                              transition: "transform 0.15s ease",
                              transform: roleForm.badgeColor === c.hex ? "scale(1.15)" : "scale(1)",
                            }}
                            onClick={() => setRoleForm({ ...roleForm, badgeColor: c.hex })}
                            title={c.label}
                          />
                        ))}
                        <div className="d-flex align-items-center ms-auto gap-1">
                          <input
                            type="color"
                            className="form-control form-control-color p-0 border-0"
                            style={{ width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer" }}
                            value={roleForm.badgeColor && roleForm.badgeColor.startsWith("#") ? roleForm.badgeColor : "#1e60d5"}
                            onChange={(e) => setRoleForm({ ...roleForm, badgeColor: e.target.value })}
                            title="Palette de couleur personnalisée"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-md-12 mb-3">
                      <label className="form-label font-w600 text-dark">
                        Description du rôle & missions
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex : Accueil des patientes, prise de RDV et encaissement sans accès aux diagnostics"
                        value={roleForm.description}
                        onChange={(e) =>
                          setRoleForm({ ...roleForm, description: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  {/* Matrice des droits par page */}
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <div>
                      <h6 className="font-w600 text-dark mb-0">
                        Habilitation d'Accès aux Pages du Site ({countAllowedPages(roleForm.pages)} / {SITE_PAGES.length} pages sélectionnées)
                      </h6>
                      <small className="text-muted">
                        Cochez les pages auxquelles les utilisateurs rattachés à ce rôle pourront accéder
                      </small>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-success btn-xs"
                        onClick={() => handleSelectAllPages(true)}
                      >
                        <i className="fa fa-check-double me-1"></i> Tout autoriser
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-xs"
                        onClick={() => handleSelectAllPages(false)}
                      >
                        <i className="fa fa-ban me-1"></i> Tout révoquer
                      </button>
                    </div>
                  </div>

                  {/* Filtre par catégorie de pages */}
                  <div className="d-flex gap-1 mb-3">
                    {["Tous", "Principal", "Médical", "Financier", "Configuration"].map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          className={`btn btn-xs ${pageCategoryFilter === cat
                              ? "btn-primary"
                              : "btn-outline-primary bg-white"
                            }`}
                          onClick={() => setPageCategoryFilter(cat)}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>

                  {/* Grille de sélection des 16 pages */}
                  <div className="row g-3">
                    {SITE_PAGES.filter(
                      (p) =>
                        pageCategoryFilter === "Tous" ||
                        p.category === pageCategoryFilter
                    ).map((page) => {
                      const isChecked = !!roleForm.pages[page.id];

                      return (
                        <div key={page.id} className="col-md-6">
                          <div
                            className={`p-3 rounded border h-100 d-flex align-items-start gap-3 ${isChecked
                                ? "border-primary bg-primary-light"
                                : "bg-white"
                              }`}
                            onClick={() => handleTogglePagePermission(page.id)}
                            style={{
                              cursor: "pointer",
                              transition: "all 0.15s",
                              backgroundColor: isChecked ? "#eff6ff" : "#ffffff",
                              borderColor: isChecked ? "#3b82f6" : "#e2e8f0",
                            }}
                          >
                            <input
                              type="checkbox"
                              className="form-check-input mt-1"
                              checked={isChecked}
                              onChange={() => { }}
                            />
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center justify-content-between">
                                <span className="font-w600 text-dark fs-13">
                                  <i
                                    className={`${page.icon} me-1 ${isChecked ? "text-primary" : "text-muted"
                                      }`}
                                  ></i>
                                  {page.name}
                                </span>

                              </div>
                              <p className="text-muted fs-11 mb-0 mt-1 line-clamp-1">
                                {page.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card-footer border-top d-flex justify-content-end gap-2 bg-white py-3 px-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setViewMode("list");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary d-flex align-items-center gap-2">
                    <i className="fa fa-save"></i>
                    <span>
                      {editingRoleId ? "Enregistrer les modifications" : "Créer le rôle"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageTitle
        motherMenu="Cabinet & Configuration"
        activeMenu="Utilisateurs"
      />

      {/* Boutons d'Action Supérieurs */}
      <div className="d-flex mb-3 align-items-center justify-content-end gap-2 flex-wrap w-100">
        <button
          className="btn btn-outline-primary btn-sm btn-rounded d-inline-flex align-items-center justify-content-center gap-2"
          onClick={handleOpenNewRole}
        >
          <i className="flaticon-381-shield-1"></i>
          <span>Nouveau Rôle</span>
        </button>
        <button
          className="btn btn-primary btn-sm btn-rounded d-inline-flex align-items-center justify-content-center gap-2"
          onClick={handleOpenNewAccount}
        >
          <i className="flaticon-381-user-7"></i>
          <span>Nouveau Compte</span>
        </button>
      </div>

      {/* Onglets de Navigation : Comptes vs Rôles */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header border-0 pb-0 pt-3 px-3">
          <ul className="nav nav-pills card-header-pills gap-2 flex-nowrap overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
            <li className="nav-item flex-shrink-0">
              <button
                className={`nav-link px-3 py-2 font-w600 ${activeTab === "accounts" ? "active" : "text-muted"
                  }`}
                onClick={() => setActiveTab("accounts")}
              >
                <i className="flaticon-381-user-7 me-2"></i>
                Comptes Utilisateurs ({accounts.length})
              </button>
            </li>
            <li className="nav-item flex-shrink-0">
              <button
                className={`nav-link px-3 py-2 font-w600 ${activeTab === "roles" ? "active" : "text-muted"
                  }`}
                onClick={() => setActiveTab("roles")}
              >
                <i className="flaticon-381-shield-1 me-2"></i>
                Rôles & Permissions ({roles.length})
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ONGLET 1 : COMPTES UTILISATEURS                                      */}
      {/* ==================================================================== */}
      {activeTab === "accounts" && (
        <div className="card border-0 shadow-sm">
          {/* Style pour supprimer complètement la barre grise d'en-tête */}
          <style>{`
            .staff-table {
              --bs-table-bg: #ffffff !important;
              --bs-table-accent-bg: transparent !important;
              --bs-table-striped-bg: transparent !important;
              background-color: #ffffff !important;
            }
            .staff-table thead,
            .staff-table thead tr,
            .staff-table thead th {
              background-color: #ffffff !important;
              background: #ffffff !important;
              color: #1e293b !important;
              border-bottom: 2px solid #edf2f7 !important;
              font-weight: 600 !important;
              font-size: 13px !important;
              padding-top: 14px !important;
              padding-bottom: 14px !important;
            }
            .staff-table tbody tr {
              background-color: #ffffff !important;
            }
            .staff-table tbody td {
              background-color: #ffffff !important;
              border-bottom: 1px solid #f1f5f9 !important;
              vertical-align: middle !important;
            }
            .staff-table tbody tr:hover td {
              background-color: #f8fbff !important;
            }
          `}</style>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 staff-table">
                <thead>
                  <tr>
                    <th className="ps-3 ps-md-4">Utilisateur</th>
                    <th className="d-none d-md-table-cell">Identifiant</th>
                    <th>Rôle</th>
                    <th className="d-none d-md-table-cell">Accès Modules</th>
                    <th>Statut</th>
                    <th className="text-end pe-3 pe-md-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="fs-13">
                  {filteredAccounts.map((acc) => {
                    const roleObj = roles.find((r) => r.id === acc.roleId);
                    const allowedCount = countAllowedPages(roleObj?.pages);
                    const initials = acc.name
                      ? acc.name
                        .split(" ")
                        .filter((w) => w.length > 0 && !w.startsWith("Dr"))
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "NB"
                      : "U";

                    return (
                      <tr key={acc.id}>
                        <td className="ps-3 ps-md-4">
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle d-flex align-items-center justify-content-center me-2 me-md-3 font-w700 fs-12 text-primary"
                              style={{
                                width: "38px",
                                height: "38px",
                                minWidth: "38px",
                                backgroundColor: "#e8f0fe",
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <h6 className="mb-0 font-w600 text-dark fs-13">
                                {acc.name}
                              </h6>
                              <span className="d-inline-block d-md-none text-muted fs-11 mt-1">
                                @{acc.username}
                              </span>

                            </div>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <span className="text-dark fs-13 font-w500">
                            @{acc.username}
                          </span>
                        </td>
                        <td>
                          {(() => {
                            const badgeClr = roleObj?.badgeColor || acc.badgeColor || "#1e60d5";
                            const roleTitle = roleObj?.name || acc.roleName || "Sans rôle";
                            const isHex = badgeClr && badgeClr.startsWith("#");
                            const safeClr = isHex ? badgeClr : "#1e60d5";
                            return (
                              <span
                                className="d-inline-flex align-items-center px-2.5 py-1 rounded-pill fs-12 font-w600"
                                style={{
                                  backgroundColor: `${safeClr}18`,
                                  color: safeClr,
                                  border: `1px solid ${safeClr}40`,
                                }}
                              >
                                <span
                                  className="me-1"
                                  style={{
                                    display: "inline-block",
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "50%",
                                    backgroundColor: safeClr,
                                  }}
                                />
                                {roleTitle}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="d-none d-md-table-cell">
                          <span className="font-w600 text-dark">
                            {allowedCount} / {SITE_PAGES.length}
                          </span>{" "}
                          <span className="text-muted fs-11">pages</span>
                        </td>

                        <td>
                          <span
                            className={`fs-13 font-w600 ${acc.status === "Actif" ? "text-success" : "text-danger"}`}
                            onClick={() => handleToggleStatus(acc)}
                            title="Cliquer pour changer le statut"
                            style={{ cursor: "pointer" }}
                          >
                            {acc.status}
                          </span>
                        </td>
                        <td className="text-end pe-3 pe-md-4">
                          <div className="d-inline-flex align-items-center">
                            <button
                              type="button"
                              className="btn btn-info shadow btn-xs sharp me-1 text-white"
                              onClick={() => handleEditAccount(acc)}
                              title="Modifier ce compte"
                            >
                              <i className="fa fa-pencil"></i>
                            </button>
                            {acc.username !== "admin" && (
                              <button
                                type="button"
                                className="btn btn-danger shadow btn-xs sharp"
                                onClick={() => handleDeleteAccount(acc)}
                                title="Supprimer ce compte"
                              >
                                <i className="fa fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        <i className="flaticon-381-search-2 fs-24 d-block mb-1"></i>
                        Aucun compte trouvé correspondant à votre recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ONGLET 2 : RÔLES & PERMISSIONS PAR PAGE                              */}
      {/* ==================================================================== */}
      {activeTab === "roles" && (
        <div className="row">
          {roles.map((role) => {
            const allowedPages = SITE_PAGES.filter(
              (p) => role.pages && role.pages[p.id]
            );
            return (
              <div key={role.id} className="col-xl-6 col-lg-12 mb-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-header border-bottom py-3 px-4 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        style={{
                          display: "inline-block",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: role.badgeColor && role.badgeColor.startsWith("#") ? role.badgeColor : "#1e60d5",
                          boxShadow: `0 0 0 3px ${(role.badgeColor && role.badgeColor.startsWith("#") ? role.badgeColor : "#1e60d5")}33`,
                        }}
                      />
                      <h5 className="card-title font-w600 mb-0 text-dark">
                        {role.name}
                      </h5>
                    </div>
                    <span
                      className="badge fs-11 font-w600"
                      style={{
                        backgroundColor: (role.badgeColor && role.badgeColor.startsWith("#") ? role.badgeColor : "#1e60d5") + "18",
                        color: role.badgeColor && role.badgeColor.startsWith("#") ? role.badgeColor : "#1e60d5",
                        border: `1px solid ${(role.badgeColor && role.badgeColor.startsWith("#") ? role.badgeColor : "#1e60d5")}44`,
                        padding: "5px 12px",
                        borderRadius: "20px",
                      }}
                    >
                      {role.isSystem ? "Rôle Système" : "Personnalisé"}
                    </span>
                  </div>

                  <div className="card-body px-4 py-3">
                    <div className="mb-3">
                      <span className="text-muted fs-12 font-w600 text-uppercase">
                        Habilitations Modules ({allowedPages.length} / {SITE_PAGES.length} autorisés) :
                      </span>
                    </div>

                    {/* Matrice des pages sous forme de badges clairs */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      {SITE_PAGES.map((page) => {
                        const isAllowed = role.pages && role.pages[page.id];
                        return (
                          <div
                            key={page.id}
                            className={`d-flex align-items-center px-2 py-1 rounded fs-11 font-w500 ${isAllowed
                                ? "bg-success-light text-success border border-success-subtle"
                                : "bg-white text-muted border"
                              }`}
                            style={{ transition: "all 0.2s" }}
                          >
                            <i
                              className={`${page.icon} me-1 ${isAllowed ? "text-success" : "text-muted"
                                }`}
                            ></i>
                            <span>{page.name}</span>
                            {isAllowed ? (
                              <i className="fa fa-check ms-1 fs-9"></i>
                            ) : (
                              <i className="fa fa-lock ms-1 fs-9"></i>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card-footer border-top bg-transparent px-4 py-3 d-flex justify-content-end gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                      onClick={() => handleEditRole(role)}
                    >
                      <i className="flaticon-381-edit"></i>
                      <span>Modifier Rôle & Accès</span>
                    </button>
                    {!role.isSystem && (
                      <button
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                        onClick={() => handleDeleteRole(role)}
                      >
                        <i className="flaticon-381-trash-1"></i>
                        <span>Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default StaffPage;
