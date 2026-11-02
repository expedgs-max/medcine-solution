import React, { useContext } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { navtoggle } from "../store/actions/AuthActions";

/// Css
import "./index.css";
import "./chart.css";
import "./step.css";

/// Layout
import Nav from "./layouts/nav";
import ScrollToTop from "./layouts/ScrollToTop";
import Footer from "./layouts/Footer";

/// Pages
import Registration from "./pages/Registration";
import Login from "./pages/Login";
import PatientPortal from "./pages/PatientPortal";

import LockScreen from "./pages/LockScreen";
import Error400 from "./pages/Error400";
import Error403 from "./pages/Error403";
import Error404 from "./pages/Error404";
import Error500 from "./pages/Error500";
import Error503 from "./pages/Error503";
/// Widget
import Widget from "./pages/Widget";

/// Dashboard & Cabinet Médical (Dr N. BELBACHIR OULD HENNIA)
import DashboardCabinet from "./components/Cabinet/DashboardCabinet";
import AppointmentsPage from "./components/Cabinet/AppointmentsPage";
import PatientsPage from "./components/Cabinet/PatientsPage";
import PatientDetailsCabinet from "./components/Cabinet/PatientDetailsCabinet";
import WaitingRoomPage from "./components/Cabinet/WaitingRoomPage";
import ConsultationsPage from "./components/Cabinet/ConsultationsPage";
import MedicalRecordsPage from "./components/Cabinet/MedicalRecordsPage";
import PrescriptionsPage from "./components/Cabinet/PrescriptionsPage";
import MedicalDocumentsPage from "./components/Cabinet/MedicalDocumentsPage";
import InvoicesPage from "./components/Cabinet/InvoicesPage";
import PaymentsPage from "./components/Cabinet/PaymentsPage";
import ReportsPage from "./components/Cabinet/ReportsPage";
import StaffPage from "./components/Cabinet/StaffPage";
import ClinicProfilePage from "./components/Cabinet/ClinicProfilePage";
import CashflowPage from "./components/Cabinet/CashflowPage";
import SettingsPage from "./components/Cabinet/SettingsPage";
import SmtpConfigPage from "./components/Cabinet/SmtpConfigPage";
import SupportPage from "./components/Cabinet/SupportPage";
import ProfileCabinetPage from "./components/Cabinet/ProfileCabinetPage";
import AffichageSalleAttente from "./components/Cabinet/AffichageSalleAttente";

import DashboardDark from "./components/Dashboard/DashboardDark";
import Doctors from "./components/Dashboard/Doctors";
import DoctorsDetails from "./components/Dashboard/Doctors-Details";
import DoctorsReview from "./components/Dashboard/Doctors-Review";
import FlatIcon from "./components/Dashboard/FlatIcon.js";

//CMS
import Content from './components/Cms/Content';
import Menu from './components/Cms/Menu';
import EmailTemplate from './components/Cms/EmailTemplate';
import Blog from './components/Cms/Blog';
//CMS Linking Pages
import ContentAdd from './components/Cms/ContentAdd';
import AddMail from './components/Cms/AddMail';
import AddBlog from './components/Cms/AddBlog';
import BlogCategory from './components/Cms/BlogCategory';

/// Bo
import UiAlert from "./components/bootstrap/Alert";
import UiAccordion from "./components/bootstrap/Accordion";
import UiBadge from "./components/bootstrap/Badge";
import UiButton from "./components/bootstrap/Button";
import UiModal from "./components/bootstrap/Modal";
import UiButtonGroup from "./components/bootstrap/ButtonGroup";
import UiListGroup from "./components/bootstrap/ListGroup";
import UiCards from "./components/bootstrap/Cards";
import UiCarousel from "./components/bootstrap/Carousel";
import UiDropDown from "./components/bootstrap/DropDown";
import UiPopOver from "./components/bootstrap/PopOver";
import UiProgressBar from "./components/bootstrap/ProgressBar";
import UiTab from "./components/bootstrap/Tab";
import UiPagination from "./components/bootstrap/Pagination";
import UiGrid from "./components/bootstrap/Grid";
import UiTypography from "./components/bootstrap/Typography";

/// App
import AppProfile from "./components/AppsMenu/AppProfile/AppProfile";
import EditProfile from "./components/AppsMenu/AppProfile/EditProfile";
import PostDetails from "./components/AppsMenu/AppProfile/PostDetails";
import Compose from "./components/AppsMenu/Email/Compose/Compose";
import Inbox from "./components/AppsMenu/Email/Inbox/Inbox";
import Read from "./components/AppsMenu/Email/Read/Read";
import Calendar from "./components/AppsMenu/Calendar/Calendar";

/// Product List
import ProductGrid from "./components/AppsMenu/Shop/ProductGrid/ProductGrid";
import ProductList from "./components/AppsMenu/Shop/ProductList/ProductList";
import ProductDetail from "./components/AppsMenu/Shop/ProductGrid/ProductDetail";
import Checkout from "./components/AppsMenu/Shop/Checkout/Checkout";
import Invoice from "./components/AppsMenu/Shop/Invoice/Invoice";
import ProductOrder from "./components/AppsMenu/Shop/ProductOrder";
import Customers from "./components/AppsMenu/Shop/Customers/Customers";

/// Charts
import SparklineChart from "./components/charts/Sparkline";
import ChartJs from "./components/charts/Chartjs";
import RechartJs from "./components/charts/rechart2";
import ApexChart from "./components/charts/apexcharts-old";

/// Table
import SortingTable from "./components/table/SortingTable/SortingTable";
import FilteringTable from "./components/table/FilteringTable/FilteringTable";
import DataTable from "./components/table/DataTable";
import BootstrapTable from "./components/table/BootstrapTable";

// /// Form
import Element from "./components/Forms/Element/Element";
import Wizard from "./components/Forms/Wizard/Wizard";
import CkEditor from "./components/Forms/CkEditor/CkEditor";
import Pickers from "./components/Forms/Pickers/Pickers";
import FormValidation from "./components/Forms/FormValidation/FormValidation";

// /// Pulgin
import Select2 from "./components/PluginsMenu/Select2/Select2";
import MainSweetAlert from "./components/PluginsMenu/SweetAlert/SweetAlert";
import Toastr from "./components/PluginsMenu/Toastr/Toastr";
import Lightgallery from "./components/PluginsMenu/Lightgallery/Lightgallery";

import { ThemeContext } from "../context/ThemeContext";

const LegacyAdminRedirect = ({ url }) => {
  const location = useLocation();
  return <Navigate to={`/admin/${url}${location.search || ""}${location.hash || ""}`} replace />;
};

const Markup = () => {  
  const allroutes = [
    /// Cabinet Médical Individuel (Dr N. BELBACHIR OULD HENNIA)
    { url: "dashboard", component: <DashboardCabinet /> },
    { url: "appointments", component: <AppointmentsPage /> },
    { url: "patients", component: <PatientsPage /> },
    { url: "patient-details", component: <PatientDetailsCabinet /> },
    { url: "waiting-room", component: <WaitingRoomPage /> },
    { url: "consultations", component: <ConsultationsPage /> },
    { url: "medical-records", component: <MedicalRecordsPage /> },
    { url: "prescriptions", component: <PrescriptionsPage /> },
    { url: "medical-documents", component: <MedicalDocumentsPage /> },
    { url: "examinations", component: <Navigate to="/admin/consultations" replace /> },
    { url: "invoices", component: <InvoicesPage /> },
    { url: "cashflow", component: <CashflowPage /> },
    { url: "journal-caisse", component: <CashflowPage /> },
    { url: "payments", component: <PaymentsPage /> },
    { url: "reports", component: <ReportsPage /> },
    { url: "notifications", component: <Navigate to="/admin/dashboard" replace /> },
    { url: "staff", component: <StaffPage /> },
    { url: "staff-new", component: <StaffPage initialView="account-form" /> },
    { url: "staff-role-new", component: <StaffPage initialView="role-form" /> },
    { url: "clinic", component: <ClinicProfilePage /> },
    { url: "settings", component: <SettingsPage /> },
    { url: "smtp", component: <SmtpConfigPage /> },
    { url: "support", component: <SupportPage /> },
    { url: "profile", component: <ProfileCabinetPage /> },

    /// Template legacy / utility routes
    { url: "index-2", component: <DashboardDark/> },
    { url: "doctors", component: <Doctors /> },    
    { url: "doctors-details", component: <DoctorsDetails /> },
    { url: "doctors-review", component: <DoctorsReview /> },
    { url: "flat-icons", component: <FlatIcon /> },
    
    //Cms
    { url: 'content', component: <Content/> },
    { url: 'menu', component: <Menu/> },
    { url: 'email-template', component: <EmailTemplate/> },
    { url: 'blog', component: <Blog/> },
    { url: 'add-content', component: <ContentAdd/> },
    { url: 'add-email', component: <AddMail/> },
    { url: 'add-blog', component: <AddBlog/> },
    { url: 'blog-category', component: <BlogCategory/> },
    /// Apps
    { url: "app-profile", component: <AppProfile/> },
    { url: "edit-profile", component: <EditProfile/> },
    { url: "post-details", component: <PostDetails/> },
    { url: "email-compose", component: <Compose /> },
    { url: "email-inbox", component: <Inbox /> },
    { url: "email-read", component: <Read /> },
    { url: "app-calender", component: <Calendar/> },
    /// Shop
    { url: "ecom-product-grid", component: <ProductGrid/> },
    { url: "ecom-product-list", component: <ProductList/> },
    { url: "ecom-product-detail", component: <ProductDetail /> },
    { url: "ecom-product-order", component: <ProductOrder/> },
    { url: "ecom-checkout", component: <Checkout /> },
    { url: "ecom-invoice", component: <Invoice /> },    
    { url: "ecom-customers", component: <Customers /> },
    /// Bootstrap
    { url: "ui-alert", component: <UiAlert /> },
    { url: "ui-badge", component: <UiBadge/> },
    { url: "ui-button", component: <UiButton/> },
    { url: "ui-modal", component: <UiModal/> },
    { url: "ui-button-group", component: <UiButtonGroup/> },
    { url: "ui-accordion", component: <UiAccordion/> },
    { url: "ui-list-group", component: <UiListGroup/> },    
    { url: "ui-card", component: <UiCards /> },
    { url: "ui-carousel", component: <UiCarousel/> },
    { url: "ui-dropdown", component: <UiDropDown/> },
    { url: "ui-popover", component: <UiPopOver/> },
    { url: "ui-progressbar", component: <UiProgressBar/> },
    { url: "ui-tab", component: <UiTab/> },
    { url: "ui-pagination", component: <UiPagination/> },
    { url: "ui-typography", component: <UiTypography/> },
    { url: "ui-grid", component: <UiGrid/> },
    
    /// Chart
    { url: "chart-sparkline", component: <SparklineChart /> },
    { url: "chart-chartjs", component: <ChartJs /> },    
    { url: "chart-apexchart", component: <ApexChart /> },
    { url: "chart-rechart", component: <RechartJs /> },

    /// table
    { url: 'table-filtering', component: <FilteringTable /> },
    { url: 'table-sorting', component: <SortingTable /> },
    { url: "table-datatable-basic", component: <DataTable/> },
    { url: "table-bootstrap-basic", component: <BootstrapTable/> },

    /// Form
    { url: "form-element", component: <Element /> },
    { url: "form-wizard", component: <Wizard/> },    
    { url: "form-ckeditor", component: <CkEditor /> },
    { url: "form-pickers", component: <Pickers/> },
    { url: "form-validation", component: <FormValidation /> },

    /// Plugin

    { url: "uc-select2", component: <Select2 /> },    
    { url: "uc-sweetalert", component: <MainSweetAlert/> },
    { url: "uc-toastr", component: <Toastr /> },    
	  { url: "uc-lightgallery", component: <Lightgallery/> },

    /// pages
    { url: "widget-basic", component: <Widget /> },    
  ];

  return (    
    <>     
        <Routes >
          {/* Portail Public & Patient avec URLs dédiées pour chaque page */}
          <Route path='/' element={<PatientPortal />} />
          <Route path='/accueil' element={<PatientPortal />} />
          <Route path='/patient-portal' element={<PatientPortal />} />
          <Route path='/agenda' element={<PatientPortal />} />
          <Route path='/rendez-vous' element={<PatientPortal />} />
          <Route path='/profil' element={<PatientPortal />} />
          <Route path='/espace-patient' element={<PatientPortal />} />
          <Route path='/mon-dossier' element={<PatientPortal />} />
          <Route path='/a-propos' element={<PatientPortal />} />
          <Route path='/about' element={<PatientPortal />} />
          <Route path='/confirmation' element={<PatientPortal />} />

          <Route path='page-login' element= {<Login />} />
          <Route path='login' element= {<Login />} />
          <Route path='admin/login' element= {<Login />} />
          <Route path='page-register' element= {<Registration />} />
          <Route path='page-lock-screen' element= {<LockScreen />} />
          <Route path='page-error-400' element={<Error400/>} />
          <Route path='page-error-403' element={<Error403/>} />
          <Route path='page-error-404' element={<Error404/>} />
          <Route path='page-error-500' element={<Error500/>} />
          <Route path='page-error-503' element={<Error503/>} />
          <Route path='affichage-salle-attente' element={<AffichageSalleAttente />} />
          <Route path='admin/affichage-salle-attente' element={<AffichageSalleAttente />} />

          {/* Redirection /admin direct vers /admin/dashboard */}
          <Route path='admin' element={<Navigate to="/admin/dashboard" replace />} />

          {/* Section Administration avec URLs préfixées /admin/... (ex: /admin/patients) */}
          <Route  element={<MainLayout />} > 
              {allroutes.map((data, i) => (
                <Route
                  key={`admin-${i}`}
                  exact
                  path={`admin/${data.url}`}
                  element={data.component}
                />
              ))}
              {/* Redirection automatique de compatibilité des anciennes URLs (ex: /patients -> /admin/patients) */}
              {allroutes.map((data, i) => (
                <Route
                  key={`legacy-${i}`}
                  exact
                  path={`${data.url}`}
                  element={<LegacyAdminRedirect url={data.url} />}
                />
              ))}
          </Route>          
        </Routes>        
        <ScrollToTop />
    </>
  );
};


function MainLayout(){
  const {sidebariconHover} = useContext(ThemeContext);
  const sideMenu = useSelector(state => state.sideMenu);
  const dispatch = useDispatch();

  const location = useLocation();

  // Protection du panel administration : redirection si non connecté
  const authUserStr = localStorage.getItem("cabinet_auth_user");
  if (!authUserStr) {
    return <Navigate to="/login" replace />;
  }

  // Contrôle d'accès basé sur les habilitations du rôle : redirection si module non autorisé
  try {
    const authUser = JSON.parse(authUserStr);
    const isFullAdmin = authUser.type === "doctor" || authUser.roleId === "role-superadmin" || authUser.pages?.["*"];
    if (!isFullAdmin) {
      let userPages = authUser.pages;
      if (!userPages) {
        try {
          const savedRoles = JSON.parse(localStorage.getItem("cabinet_staff_roles") || "[]");
          const foundRole = savedRoles.find(r => r.id === authUser.roleId || r.name === authUser.role || r.name === authUser.roleName);
          if (foundRole && foundRole.pages) userPages = foundRole.pages;
        } catch (e) {}
      }
      if (userPages) {
        const cleanPath = location.pathname.toLowerCase().replace(/^\/+|\/+$/g, "");
        const currentModule = cleanPath.replace(/^admin\/?/, "").split("/")[0];
        if (currentModule && userPages[currentModule] === false) {
          const firstAllowed = Object.keys(userPages).find(k => userPages[k] === true) || "dashboard";
          return <Navigate to={`/admin/${firstAllowed}`} replace />;
        }
      }
    }
  } catch (e) {}

  return (
    <>      
        <div id="main-wrapper" className={`show ${sidebariconHover ? "icon-hover-toggle": ""} ${ sideMenu ? "menu-toggle" : ""}`}>  
          <Nav />
          {sideMenu && (
            <div
              className="deznav-backdrop"
              onClick={() => dispatch(navtoggle())}
              aria-hidden="true"
            />
          )}
          <div className="content-body" style={{ minHeight: window.screen.height - 60 }}>
              <div className="container-fluid">
                <Outlet />                
              </div>
          </div>
          <Footer />
        </div>      
    </>
  )
};

export default Markup;
