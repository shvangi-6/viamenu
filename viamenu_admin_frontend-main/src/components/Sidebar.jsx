import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  FaHome, FaUserShield, FaUserTie, FaUserCog, FaBan, FaTrash,
  FaStore, FaClock, FaGlobe, FaEdit, FaExclamationTriangle,
  FaBookOpen, FaBook, FaFolderOpen, FaUtensils, FaLayerGroup, FaPlusSquare,
  FaTags, FaSeedling, FaExclamationCircle, FaFlask,
  FaHamburger, FaConciergeBell, FaBuilding, FaLeaf, FaDrumstickBite,
  FaCreditCard, FaChartBar, FaShieldAlt, FaBell, FaCog,
  FaChevronDown, FaTimes, FaUsers, FaReceipt, FaLifeRing, FaFileAlt, FaHistory, FaBullhorn, FaMoneyBillWave,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { useUIStore } from "../store/useUIStore";
import { useAdminStore } from "../store/useAdminStore";
import { handleLogout as performLogout } from "../utils/axiosInstance";
import logo from "./images/logo.png";

const SECTIONS = {
  users:        ["/users/"],
  restaurants:  ["/restaurant/"],
  content:      ["/content/"],
  tags:         ["/tags/", "/restaurant/tags"],
  nutrition:    ["/nutrition/"],
  catalog:      ["/restaurant/types", "/restaurant/service-type", "/restaurant/business-type", "/restaurant/food-type/"],
  subscription: ["/subscription"],
  analytics:    ["/analytics/"],
  communications: ["/communications/"],
  settings:     ["/settings/"],
};

function SidebarSection({ sectionKey, icon: Icon, label, children }) {
  const location = useLocation();
  const { openSections, toggleSection, openSection } = useUIStore();
  const isOpen = !!openSections[sectionKey];

  // Auto-open if current path matches this section
  useEffect(() => {
    const paths = SECTIONS[sectionKey] || [];
    if (paths.some((p) => location.pathname.startsWith(p))) {
      openSection(sectionKey);
    }
  }, [location.pathname]);

  return (
    <>
      <div
        className={`menu-item dropdown${isOpen ? " open" : ""}`}
        onClick={() => toggleSection(sectionKey)}
      >
        <Icon className="menu-icon" />
        <span>{label}</span>
        <FaChevronDown className="dropdown-icon" />
      </div>
      {isOpen && <div className="submenu">{children}</div>}
    </>
  );
}

function SubItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink to={to} className="submenu-item" onClick={onClick}>
      {Icon && <Icon className="submenu-icon" />}
      {label}
    </NavLink>
  );
}

export default function Sidebar({ collapsed, onClose }) {
  const { clearAuth } = useAdminStore();

  const handleNavClick = () => {
    if (window.innerWidth <= 768 && onClose) onClose();
  };

  const handleLogout = () => {
    clearAuth();
    onClose?.();
    performLogout();
  };

  return (
    <aside className="crm-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src={logo} alt="logo" className="img-fluid" />
        </div>
        <button className="sidebar-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>

      <nav>
        {/* Dashboard */}
        <NavLink to="/dashboard" className="menu-item" onClick={handleNavClick}>
          <MdDashboard className="menu-icon" />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {/* User Management */}
        <SidebarSection sectionKey="users" icon={FaUserShield} label="User Management">
          <SubItem to="/users/list"     icon={FaUsers}    label="All Users"     onClick={handleNavClick} />
          <SubItem to="/users/owners"   icon={FaUserTie}  label="Owners"        onClick={handleNavClick} />
          <SubItem to="/users/managers" icon={FaUserCog}  label="Managers"      onClick={handleNavClick} />
          <SubItem to="/users/guests"   icon={FaUsers}    label="Guests"        onClick={handleNavClick} />
          <SubItem to="/users/blocked"  icon={FaBan}      label="Blocked Users" onClick={handleNavClick} />
          <SubItem to="/users/trash"    icon={FaTrash}    label="Trash"         onClick={handleNavClick} />
        </SidebarSection>

        {/* Restaurants */}
        <SidebarSection sectionKey="restaurants" icon={FaStore} label="Restaurants">
          <SubItem to="/restaurant/restaurants-list"       icon={FaStore}               label="All Restaurants"    onClick={handleNavClick} />
          <SubItem to="/restaurant/pending-verification"   icon={FaClock}               label="Pending Verification" onClick={handleNavClick} />
          <SubItem to="/restaurant/published"              icon={FaGlobe}               label="Published"          onClick={handleNavClick} />
          <SubItem to="/restaurant/draft"                  icon={FaEdit}                label="Draft"              onClick={handleNavClick} />
          <SubItem to="/restaurant/no-menu"                icon={FaExclamationTriangle} label="No Menu Setup"      onClick={handleNavClick} />
          <SubItem to="/restaurant/pages"                  icon={FaFileAlt}             label="Restaurant Pages"   onClick={handleNavClick} />
        </SidebarSection>

        {/* Menus & Content */}
        <SidebarSection sectionKey="content" icon={FaBookOpen} label="Menus & Content">
          <SubItem to="/content/menus"        icon={FaBook}        label="All Menus"      onClick={handleNavClick} />
          <SubItem to="/content/categories"   icon={FaFolderOpen}  label="All Categories" onClick={handleNavClick} />
          <SubItem to="/content/dishes"       icon={FaUtensils}    label="All Dishes"     onClick={handleNavClick} />
          <SubItem to="/content/variant-sets" icon={FaLayerGroup}  label="Variant Sets"   onClick={handleNavClick} />
          <SubItem to="/content/extra-sets"   icon={FaPlusSquare}  label="Extra Sets"     onClick={handleNavClick} />
        </SidebarSection>

        {/* Tags & Labels */}
        <SidebarSection sectionKey="tags" icon={FaTags} label="Tags & Labels">
          <SubItem to="/tags/global"     icon={FaTags} label="Global Tags"      onClick={handleNavClick} />
          <SubItem to="/tags/restaurant" icon={FaTags} label="Owner Tags"       onClick={handleNavClick} />
        </SidebarSection>

        {/* Ingredients & Nutrition */}
        <SidebarSection sectionKey="nutrition" icon={FaSeedling} label="Ingredients & Nutrition">
          <SubItem to="/nutrition/ingredients" icon={FaSeedling}          label="Ingredients" onClick={handleNavClick} />
          <SubItem to="/nutrition/allergens"   icon={FaExclamationCircle} label="Allergens"   onClick={handleNavClick} />
          <SubItem to="/nutrition/additives"   icon={FaFlask}             label="Additives"   onClick={handleNavClick} />
        </SidebarSection>

        {/* Food Catalog */}
        <SidebarSection sectionKey="catalog" icon={FaHamburger} label="Food Catalog">
          <SubItem to="/restaurant/types"             icon={FaStore}          label="Restaurant Types"    onClick={handleNavClick} />
          <SubItem to="/restaurant/service-type"      icon={FaConciergeBell}  label="Service Types"       onClick={handleNavClick} />
          <SubItem to="/restaurant/business-type"     icon={FaBuilding}       label="Business Types"      onClick={handleNavClick} />
          <SubItem to="/restaurant/food-type/cuisine" icon={FaLeaf}           label="Cuisines"            onClick={handleNavClick} />
          <SubItem to="/restaurant/food-type/dish-type" icon={FaDrumstickBite} label="Dish Types"         onClick={handleNavClick} />
          <SubItem to="/restaurant/food-type/diet-type" icon={FaSeedling}      label="Diet Types"         onClick={handleNavClick} />
        </SidebarSection>

        {/* Subscription & Billing */}
        <SidebarSection sectionKey="subscription" icon={FaCreditCard} label="Subscription & Billing">
          <SubItem to="/subscription/plans"  icon={FaCreditCard} label="Plans"               onClick={handleNavClick} />
          <SubItem to="/subscription/active"   icon={FaUsers}         label="Active Subscriptions" onClick={handleNavClick} />
          <SubItem to="/subscription/history"  icon={FaBook}          label="History"              onClick={handleNavClick} />
          <SubItem to="/subscription/payments" icon={FaMoneyBillWave} label="Payments & Invoices"  onClick={handleNavClick} />
        </SidebarSection>

        {/* Orders (Phase 3) */}
        <NavLink to="/orders" className="menu-item" onClick={handleNavClick}>
          <FaReceipt className="menu-icon" />
          {!collapsed && <span>Orders</span>}
        </NavLink>

        {/* Analytics */}
        <SidebarSection sectionKey="analytics" icon={FaChartBar} label="Analytics">
          <SubItem to="/analytics/overview"     icon={FaChartBar} label="Overview"            onClick={handleNavClick} />
          <SubItem to="/analytics/restaurants"  icon={FaStore}    label="Restaurant Stats"    onClick={handleNavClick} />
          <SubItem to="/analytics/users"        icon={FaUsers}    label="User Growth"         onClick={handleNavClick} />
          <SubItem to="/analytics/content"      icon={FaBookOpen} label="Content Stats"       onClick={handleNavClick} />
        </SidebarSection>

        {/* Moderation */}
        {/* <SidebarSection sectionKey="moderation" icon={FaShieldAlt} label="Moderation">
          <SubItem to="/moderation/incomplete"   icon={FaExclamationTriangle} label="Incomplete Restaurants" onClick={handleNavClick} />
          <SubItem to="/moderation/stale-drafts" icon={FaClock}               label="Stale Drafts"           onClick={handleNavClick} />
          <SubItem to="/moderation/empty-menus"  icon={FaBook}                label="Empty Menus"            onClick={handleNavClick} />
        </SidebarSection> */}

        {/* Communications */}
        <SidebarSection sectionKey="communications" icon={FaBell} label="Communications">
          <SubItem to="/communications/announcements"  icon={FaBullhorn} label="Announcements"  onClick={handleNavClick} />
          <SubItem to="/communications/notifications"  icon={FaBell}     label="Notifications"  onClick={handleNavClick} />
        </SidebarSection>

        {/* Support tickets */}
        <NavLink to="/support" className="menu-item" onClick={handleNavClick}>
          <FaLifeRing className="menu-icon" />
          {!collapsed && <span>Support Tickets</span>}
        </NavLink>

        {/* Settings */}
        <SidebarSection sectionKey="settings" icon={FaCog} label="Settings">
          <SubItem to="/settings/general"   icon={FaCog}     label="General"   onClick={handleNavClick} />
          <SubItem to="/settings/audit-log" icon={FaHistory} label="Audit Log" onClick={handleNavClick} />
          {/* <SubItem to="/settings/admins"  icon={FaUserShield} label="Admin Accounts" onClick={handleNavClick} /> */}
        </SidebarSection>
      </nav>

      <div className="sidebar-bottom">
        {!collapsed && (
          <button className="impressum-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}
