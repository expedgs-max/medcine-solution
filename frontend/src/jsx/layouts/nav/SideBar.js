import React, { useContext, useEffect, useReducer, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Collapse } from 'react-bootstrap';
import { Link, useLocation } from "react-router-dom";
import { MenuList } from './Menu';
import { ThemeContext } from "../../../context/ThemeContext";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { navtoggle } from "../../../store/actions/AuthActions";
import ApiService from "../../../services/ApiService";

const reducer = (previousState, updatedState) => ({
  ...previousState,
  ...updatedState,
});

const initialState = {
  active: "",
  activeSubmenu: "",
};

const SideBar = () => {
  const dispatch = useDispatch();
  const sideMenu = useSelector((state) => state.sideMenu);
  const {
    iconHover,
    sidebarposition,
    headerposition,
    sidebarLayout,
    ChangeIconSidebar,
  } = useContext(ThemeContext);
  const date = new Date();
  const location = useLocation();
  const [state, setState] = useReducer(reducer, initialState);

  // Compteur dynamique de dépôts non lus (rouge)
  const [unreadDocsCount, setUnreadDocsCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await ApiService.getUnreadDocumentsCount();
      setUnreadDocsCount(count);
    } catch (e) {}
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const handleUpdate = () => refreshUnreadCount();
    window.addEventListener("portal_docs_updated", handleUpdate);
    const interval = setInterval(refreshUnreadCount, 15000);
    return () => {
      window.removeEventListener("portal_docs_updated", handleUpdate);
      clearInterval(interval);
    };
  }, [refreshUnreadCount]);

  const handleMobileNavClick = () => {
    if (window.innerWidth <= 768 && sideMenu) {
      dispatch(navtoggle());
    }
  };

  const handleMenuActive = (status) => {		
    setState({ active: status });			
    if (state.active === status) {				
      setState({ active: "" });
    }   
  };

  const handleSubmenuActive = (status) => {		
    setState({ activeSubmenu: status });
    if (state.activeSubmenu === status) {
      setState({ activeSubmenu: "" });			
    }    
  };

  // For scroll
  const [hideOnScroll, setHideOnScroll] = useState(true);
  useScrollPosition(
    ({ prevPos, currPos }) => {
      const isShow = currPos.y > prevPos.y;
      if (isShow !== hideOnScroll) setHideOnScroll(isShow);
    },
    [hideOnScroll]
  );

  // Détection réactive instantanée de la route active via useLocation()
  const cleanPathname = location.pathname.toLowerCase().replace(/^\/+|\/+$/g, "");
  const currentPath = cleanPathname === "" ? "admin/dashboard" : cleanPathname;

  const isRouteActive = useCallback((itemTo) => {
    if (!itemTo) return false;
    const cleanTo = itemTo.toLowerCase().replace(/^\/+|\/+$/g, "");
    const currentNoAdmin = currentPath.replace(/^admin\/?/, "");
    const toNoAdmin = cleanTo.replace(/^admin\/?/, "");
    if (currentPath === cleanTo || currentNoAdmin === toNoAdmin) return true;
    if (toNoAdmin === "patients" && currentNoAdmin === "patient-details") return true;
    if (toNoAdmin === "medical-records" && currentNoAdmin === "medical-documents") return true;
    return false;
  }, [currentPath]);

  useEffect(() => {
    MenuList.forEach((data) => {
      if (data.content && data.content.length > 0) {
        data.content.forEach((item) => {        
          if (isRouteActive(item.to)) {         
            setState({ active: data.title });          
          }
          item.content?.forEach((ele) => {
            if (isRouteActive(ele.to)) {
              setState({ activeSubmenu: item.title, active: data.title });
            }
          });
        });
      }
    });
  }, [isRouteActive]);

  return (
    <div
      onMouseEnter={() => ChangeIconSidebar(true)}
      onMouseLeave={() => ChangeIconSidebar(false)}
      className={`deznav ${iconHover} ${
        sidebarposition.value === "fixed" &&
        sidebarLayout.value === "horizontal" &&
        headerposition.value === "static"
          ? hideOnScroll > 120
            ? "fixed"
            : ""
          : ""
      }`}
      style={{
        position: "fixed",
        top: "5rem",
        bottom: 0,
        height: "calc(100vh - 5rem)",
      }}
    >
      <div
        className="deznav-scroll"
        style={{
          height: "100%",
          maxHeight: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <ul className="metismenu" id="menu" style={{ paddingBottom: "60px" }}>
          {MenuList.map((data, index) => {
            let menuClass = data.classsChange;
            if (menuClass === "menu-title") {
              return (
                <li
                  className={menuClass}
                  key={index}
                  style={sideMenu ? { display: "none" } : undefined}
                >
                  {data.title}
                </li>
              );
            } else {
              const isItemActive = isRouteActive(data.to);
              const isGroupActive = state.active === data.title;
              const hasSubmenu = data.content && data.content.length > 0;
              const targetUrl = data.to ? (data.to.startsWith("/") ? data.to : `/${data.to}`) : "#";

              return (
                <li
                  className={`has-menu ${isItemActive || isGroupActive ? 'mm-active' : ''}`}
                  key={index}
                >
                  {hasSubmenu ? (
                    <>
                      <Link
                        to={"#"}
                        className="has-arrow ai-icon"
                        onClick={() => {
                          handleMenuActive(data.title);
                        }}
                      >
                        {data.iconStyle}{" "}
                        <span className="nav-text">
                          {data.title}
                          {(data.title === "Dossiers médicaux" || data.title === "Patients") && unreadDocsCount > 0 ? (
                            <span
                              className="badge badge-danger ms-2"
                              style={{
                                backgroundColor: "#ef4444",
                                color: "#ffffff",
                                fontSize: "10.5px",
                                fontWeight: "800",
                                padding: "2px 7px",
                                borderRadius: "10px",
                                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
                              }}
                              title={`${unreadDocsCount} nouveau(x) document(s) / texte(s) déposé(s)`}
                            >
                              {unreadDocsCount}
                            </span>
                          ) : (
                            data.update && (
                              <span className="badge badge-xs style-1 badge-danger ms-2">
                                {data.update}
                              </span>
                            )
                          )}
                        </span>
                      </Link>

                      <Collapse in={isGroupActive}>
                        <ul className={`${menuClass === "mm-collapse" ? "mm-show" : ""}`}>
                          {data.content.map((subItem, subIndex) => {
                            const isSubActive = isRouteActive(subItem.to);
                            const isSubgroupActive = state.activeSubmenu === subItem.title;
                            const hasDeepSubmenu = subItem.content && subItem.content.length > 0;
                            const subTargetUrl = subItem.to ? (subItem.to.startsWith("/") ? subItem.to : `/${subItem.to}`) : "#";

                            return (
                              <li
                                key={subIndex}
                                className={isSubActive || isSubgroupActive ? "mm-active" : ""}
                              >
                                {hasDeepSubmenu ? (
                                  <>
                                    <Link
                                      to={subTargetUrl}
                                      className={subItem.hasMenu ? 'has-arrow' : ''}
                                      onClick={() => {
                                        handleSubmenuActive(subItem.title);
                                      }}
                                    >
                                      {subItem.title}
                                    </Link>
                                    <Collapse in={isSubgroupActive}>
                                      <ul className={`${menuClass === "mm-collapse" ? "mm-show" : ""}`}>
                                        {subItem.content.map((deepItem, deepIndex) => {
                                          const isDeepActive = isRouteActive(deepItem.to);
                                          const deepTargetUrl = deepItem.to ? (deepItem.to.startsWith("/") ? deepItem.to : `/${deepItem.to}`) : "#";
                                          return (
                                            <li key={deepIndex}>
                                              <Link
                                                className={isDeepActive ? "mm-active" : ""}
                                                to={deepTargetUrl}
                                                onClick={handleMobileNavClick}
                                              >
                                                {deepItem.title}
                                              </Link>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </Collapse>
                                  </>
                                ) : (
                                  <Link
                                    to={subTargetUrl}
                                    target={subItem.target || undefined}
                                    rel={subItem.target === "_blank" ? "noopener noreferrer" : undefined}
                                    className={isSubActive ? 'mm-active' : ''}
                                    onClick={subItem.target === "_blank" ? undefined : handleMobileNavClick}
                                  >
                                    {subItem.title}
                                  </Link>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </Collapse>
                    </>
                  ) : (
                    <Link
                      to={targetUrl}
                      target={data.target || undefined}
                      rel={data.target === "_blank" ? "noopener noreferrer" : undefined}
                      className={isItemActive ? 'mm-active' : ''}
                      onClick={data.target === "_blank" ? undefined : handleMobileNavClick}
                    >
                      {data.iconStyle}{" "}
                      <span className="nav-text">
                        {data.title}
                        {(data.title === "Dossiers médicaux" || data.title === "Patients") && unreadDocsCount > 0 ? (
                          <span
                            className="badge badge-danger ms-2"
                            style={{
                              backgroundColor: "#ef4444",
                              color: "#ffffff",
                              fontSize: "10.5px",
                              fontWeight: "800",
                              padding: "2px 7px",
                              borderRadius: "10px",
                              boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
                            }}
                            title={`${unreadDocsCount} nouveau(x) document(s) / texte(s) déposé(s)`}
                          >
                            {unreadDocsCount}
                          </span>
                        ) : (
                          data.update && (
                            <span className="badge badge-xs style-1 badge-danger ms-2">
                              {data.update}
                            </span>
                          )
                        )}
                      </span>
                    </Link>
                  )}
                </li>
              );
            }
          })}
        </ul>
        <div className="copyright">
          <p>
            <strong>Cabinet Dr Belbachir</strong> © {date.getFullYear()}
          </p>
          <p className="fs-12 text-muted">
            Gynécologie Obstétrique
          </p>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
