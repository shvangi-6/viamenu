import { Suspense, lazy } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Login loads eagerly — it's the entry point for every unauthenticated visit,
// so deferring it would only add a loading flicker with no benefit.
import Login from "./pages/Login/Login";

// Everything else is route-level code-split: each page's JS only downloads
// when that route is actually visited, instead of all ~55 pages bundling
// into one multi-hundred-KB chunk loaded up front.
const ForgotPassword = lazy(() => import("./pages/ForgotPassword/ForgotPassword"));
const ChangePassword = lazy(() => import("./pages/ChangePassword/ChangePassword"));
const MyProfile = lazy(() => import("./pages/MyProfile/MyProfile"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));

// User Management
const UserList = lazy(() => import("./pages/UserManagement/UserList/UserList"));
const TrashList = lazy(() => import("./pages/UserManagement/TrashList/TrashList"));
const Owners = lazy(() => import("./pages/UserManagement/Owners/Owners"));
const Managers = lazy(() => import("./pages/UserManagement/Managers/Managers"));
const ManagerDetails = lazy(() => import("./pages/UserManagement/Managers/ManagerDetails"));
const BlockedUsers = lazy(() => import("./pages/UserManagement/BlockedUsers/BlockedUsers"));

// Restaurants
const AllRestaurants = lazy(() => import("./pages/AllRestaurants/AllRestaurants"));
const RestaurantDetails = lazy(() => import("./pages/AllRestaurants/RestaurantDetails"));
const PendingVerification = lazy(() => import("./pages/AllRestaurants/PendingVerification"));
const PublishedRestaurants = lazy(() => import("./pages/AllRestaurants/PublishedRestaurants"));
const DraftRestaurants = lazy(() => import("./pages/AllRestaurants/DraftRestaurants"));
const NoMenuRestaurants = lazy(() => import("./pages/AllRestaurants/NoMenuRestaurants"));

// Food Catalog (existing)
const RestaurantType = lazy(() => import("./pages/RestaurantType/RestaurantType"));
const ServiceType = lazy(() => import("./pages/ServiceType/ServiceType"));
const BusinessType = lazy(() => import("./pages/BusinessType/BusinessType"));
const Cuisine = lazy(() => import("./pages/FoodType/Cuisine/Cuisine"));
const DishType = lazy(() => import("./pages/FoodType/DishType/DishType"));
const DietType = lazy(() => import("./pages/FoodType/DietType/DietType"));

// Tags
const Tags = lazy(() => import("./pages/Tags/Tags"));
const GlobalTags = lazy(() => import("./pages/Tags/GlobalTags"));
const RestaurantTags = lazy(() => import("./pages/Tags/RestaurantTags"));

// Menus & Content
const AllMenus = lazy(() => import("./pages/MenusContent/AllMenus"));
const AllCategories = lazy(() => import("./pages/MenusContent/AllCategories"));
const AllDishes = lazy(() => import("./pages/MenusContent/AllDishes"));
const VariantSets = lazy(() => import("./pages/MenusContent/VariantSets"));
const ExtraSets = lazy(() => import("./pages/MenusContent/ExtraSets"));

// Nutrition
const Ingredients = lazy(() => import("./pages/Nutrition/Ingredients"));
const Allergens = lazy(() => import("./pages/Nutrition/Allergens"));
const Additives = lazy(() => import("./pages/Nutrition/Additives"));

// Subscription
const SubscriptionPlans = lazy(() => import("./pages/SubscriptionPlans/SubscriptionPlans"));
const ActiveSubscriptions = lazy(() => import("./pages/Subscription/ActiveSubscriptions"));
const SubscriptionHistory = lazy(() => import("./pages/Subscription/SubscriptionHistory"));
const Payments = lazy(() => import("./pages/Subscription/Payments"));
const AllOrders = lazy(() => import("./pages/Orders/AllOrders"));
const SupportTickets = lazy(() => import("./pages/Support/SupportTickets"));
const PageApprovals = lazy(() => import("./pages/RestaurantPages/PageApprovals"));
const AuditLog = lazy(() => import("./pages/AuditLog/AuditLog"));

// Analytics
const AnalyticsOverview = lazy(() => import("./pages/Analytics/AnalyticsOverview"));
const RestaurantAnalytics = lazy(() => import("./pages/Analytics/RestaurantAnalytics"));
const UserGrowth = lazy(() => import("./pages/Analytics/UserGrowth"));
const ContentStats = lazy(() => import("./pages/Analytics/ContentStats"));

// Moderation
const IncompleteRestaurants = lazy(() => import("./pages/Moderation/IncompleteRestaurants"));
const StaleDrafts = lazy(() => import("./pages/Moderation/StaleDrafts"));
const EmptyMenus = lazy(() => import("./pages/Moderation/EmptyMenus"));

// Communications
const Notifications = lazy(() => import("./pages/Communications/Notifications"));
const Announcements = lazy(() => import("./pages/Communications/Announcements"));

// Settings
const GeneralSettings = lazy(() => import("./pages/Settings/GeneralSettings"));
const AdminAccounts = lazy(() => import("./pages/Settings/AdminAccounts"));

// Drill-down pages
const OwnerRestaurants = lazy(() => import("./pages/DrillDown/OwnerRestaurants"));
const RestaurantMenus = lazy(() => import("./pages/DrillDown/RestaurantMenus"));
const MenuCategories = lazy(() => import("./pages/DrillDown/MenuCategories"));
const CategoryDishes = lazy(() => import("./pages/DrillDown/CategoryDishes"));
const DishDetails = lazy(() => import("./pages/DrillDown/DishDetails"));

function RouteLoadingFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div className="dt-spinner" />
    </div>
  );
}

const NotFound = lazy(() => import("./pages/NotFound/NotFound"));

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Catches a throwing page instead of letting React unmount the entire
          tree and leave a blank white screen with no explanation. */}
      <ErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* PROTECTED */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/my-profile" element={<MyProfile />} />

              {/* User Management */}
              <Route path="/users/list"     element={<UserList />} />
              <Route path="/users/trash"    element={<TrashList />} />
              <Route path="/users/owners"   element={<Owners />} />
              <Route path="/users/managers" element={<Managers />} />
              <Route path="/users/managers/:id" element={<ManagerDetails />} />
              <Route path="/users/blocked"  element={<BlockedUsers />} />
              <Route path="/users/guests"   element={<UserList key="guests" role="guest" />} />

              {/* Restaurants */}
              <Route path="/restaurant/restaurants-list"       element={<AllRestaurants />} />
              <Route path="/restaurants/restaurant-details/:id" element={<RestaurantDetails />} />
              <Route path="/restaurant/pending-verification"   element={<PendingVerification />} />
              <Route path="/restaurant/published"              element={<PublishedRestaurants />} />
              <Route path="/restaurant/draft"                  element={<DraftRestaurants />} />
              <Route path="/restaurant/no-menu"                element={<NoMenuRestaurants />} />

              {/* Food Catalog */}
              <Route path="/restaurant/types"               element={<RestaurantType />} />
              <Route path="/restaurant/service-type"        element={<ServiceType />} />
              <Route path="/restaurant/business-type"       element={<BusinessType />} />
              <Route path="/restaurant/food-type/cuisine"   element={<Cuisine />} />
              <Route path="/restaurant/food-type/dish-type" element={<DishType />} />
              <Route path="/restaurant/food-type/diet-type" element={<DietType />} />

              {/* Tags */}
              <Route path="/restaurant/tags" element={<Tags />} />
              <Route path="/tags/global"     element={<GlobalTags />} />
              <Route path="/tags/restaurant" element={<RestaurantTags />} />

              {/* Menus & Content */}
              <Route path="/content/menus"        element={<AllMenus />} />
              <Route path="/content/categories"   element={<AllCategories />} />
              <Route path="/content/dishes"       element={<AllDishes />} />
              <Route path="/content/variant-sets" element={<VariantSets />} />
              <Route path="/content/extra-sets"   element={<ExtraSets />} />

              {/* Nutrition */}
              <Route path="/nutrition/ingredients" element={<Ingredients />} />
              <Route path="/nutrition/allergens"   element={<Allergens />} />
              <Route path="/nutrition/additives"   element={<Additives />} />

              {/* Subscription */}
              <Route path="/subscription-plans"   element={<SubscriptionPlans />} />
              <Route path="/subscription/plans"   element={<SubscriptionPlans />} />
              <Route path="/subscription/active"  element={<ActiveSubscriptions />} />
              <Route path="/subscription/history" element={<SubscriptionHistory />} />
              <Route path="/subscription/payments" element={<Payments />} />
              <Route path="/orders"                element={<AllOrders />} />
              <Route path="/support"               element={<SupportTickets />} />
              <Route path="/restaurant/pages"      element={<PageApprovals />} />
              <Route path="/settings/audit-log"    element={<AuditLog />} />

              {/* Analytics */}
              <Route path="/analytics/overview"    element={<AnalyticsOverview />} />
              <Route path="/analytics/restaurants" element={<RestaurantAnalytics />} />
              <Route path="/analytics/users"       element={<UserGrowth />} />
              <Route path="/analytics/content"     element={<ContentStats />} />

              {/* Moderation */}
              <Route path="/moderation/incomplete"   element={<IncompleteRestaurants />} />
              <Route path="/moderation/stale-drafts" element={<StaleDrafts />} />
              <Route path="/moderation/empty-menus"  element={<EmptyMenus />} />

              {/* Communications */}
              <Route path="/communications/notifications"  element={<Notifications />} />
              <Route path="/communications/announcements"  element={<Announcements />} />

              {/* Settings */}
              <Route path="/settings/general" element={<GeneralSettings />} />
              <Route path="/settings/admins"  element={<AdminAccounts />} />

              {/* Drill-down navigation */}
              <Route path="/owners/:ownerId/restaurants"                                                                         element={<OwnerRestaurants />} />
              <Route path="/owners/:ownerId/restaurants/:restaurantId/menus"                                                     element={<RestaurantMenus />} />
              <Route path="/owners/:ownerId/restaurants/:restaurantId/menus/:menuId/categories"                                  element={<MenuCategories />} />
              <Route path="/owners/:ownerId/restaurants/:restaurantId/menus/:menuId/categories/:categoryId/dishes"               element={<CategoryDishes />} />
              <Route path="/restaurants/:restaurantId/menus"                                                                     element={<RestaurantMenus />} />
              <Route path="/restaurants/:restaurantId/menus/:menuId/categories"                                                  element={<MenuCategories />} />
              <Route path="/restaurants/:restaurantId/menus/:menuId/categories/:categoryId/dishes"                               element={<CategoryDishes />} />
              <Route path="/dishes/:dishId/details"                                                                              element={<DishDetails />} />

              {/* Inside the layout so a mistyped in-app URL keeps the sidebar. */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>

          {/* Unmatched while logged out — without this React Router renders
              nothing at all, which is indistinguishable from a crash. */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
