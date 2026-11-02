import React from "react";

export const MenuList = [
    // A. Principal
    {
        title: "PRINCIPAL",
        classsChange: "menu-title"
    },
    {
        title: "Tableau de bord",
        to: "admin/dashboard",
        iconStyle: <i className="flaticon-381-networking" />
    },
    {
        title: "Agenda & RDV",
        to: "admin/appointments",
        iconStyle: <i className="flaticon-381-calendar-1" />
    },
    {
        title: "Patients",
        to: "admin/patients",
        iconStyle: <i className="flaticon-381-user-7" />
    },
    {
        title: "Salle d'attente",
        to: "admin/waiting-room",
        iconStyle: <i className="flaticon-381-clock-1" />
    },

    // B. Gestion médicale
    {
        title: "GESTION MÉDICALE",
        classsChange: "menu-title"
    },
    {
        title: "Consultations",
        to: "admin/consultations",
        iconStyle: <i className="flaticon-381-notepad" />
    },
    {
        title: "Dossiers médicaux",
        to: "admin/medical-records",
        iconStyle: <i className="flaticon-381-folder" />
    },
    {
        title: "Ordonnances",
        to: "admin/prescriptions",
        iconStyle: <i className="flaticon-381-file-1" />
    },

    // C. Gestion administrative et financière
    {
        title: "GESTION ADMINISTRATIVE",
        classsChange: "menu-title"
    },
    {
        title: "Factures",
        to: "admin/invoices",
        iconStyle: <i className="flaticon-381-calculator" />
    },
    {
        title: "Journal de Caisse",
        to: "admin/cashflow",
        iconStyle: <i className="fa fa-cash-register" />
    },

    // D. Cabinet et configuration
    {
        title: "CABINET & CONFIGURATION",
        classsChange: "menu-title"
    },
    {
        title: "Utilisateurs & Rôles",
        to: "admin/staff",
        iconStyle: <i className="flaticon-381-user-9" />
    },
    {
        title: "Paramètres",
        to: "admin/settings",
        iconStyle: <i className="flaticon-381-settings-2" />
    }
];
