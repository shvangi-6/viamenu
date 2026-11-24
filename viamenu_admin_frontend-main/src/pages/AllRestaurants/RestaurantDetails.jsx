import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaMapMarkerAlt,
  FaStar,
  FaPhone,
  FaEnvelope,
  FaChevronLeft,
  FaHeart,
  FaShare,
  FaUtensils,
  FaFire,
  FaRegClock,
  FaInfoCircle,
  FaTag,
  FaStore,
  FaCheckCircle,
  FaTimesCircle,
  FaLeaf,
  FaLayerGroup,
  FaFolderOpen,
  FaBookOpen,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaQrcode,
  FaMapPin,
  FaEye
} from "react-icons/fa";
import { MdDeliveryDining, MdTakeoutDining, MdRestaurantMenu } from "react-icons/md";
import { GiKnifeFork, GiSpoon } from "react-icons/gi";
import "./RestaurantDetails.css";

import axiosInstance from "../../utils/axiosInstance";
import RestaurantAdminActions from "./RestaurantAdminActions";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Category Tree Item Component
const CategoryTreeItem = ({ category, selectedCategoryId, onSelectCategory, onToggleExpand, expandedCategories, level = 0 }) => {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const isSelected = selectedCategoryId === category.id;

  return (
    <div className="category-tree-item">
      <button
        className={`category-item ${isSelected ? "active" : ""}`}
        onClick={() => onSelectCategory(category.id, category)}
        style={{ paddingLeft: `${level * 24 + 16}px` }}
      >
        <div className="category-item-content">
          <div className="category-icon-wrapper">
            {hasChildren && (
              <span
                className="expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(category.id);
                }}
              >
                {isExpanded ? <FaChevronDown /> : <FaChevronUp />}
              </span>
            )}
            {level === 0 ? <FaFolderOpen /> : <FaLayerGroup />}
          </div>
          <span className="category-name">{category.name || "Unnamed"}</span>
          {hasChildren && (
            <span className="category-badge">{category.children.length}</span>
          )}
        </div>
      </button>
      {hasChildren && isExpanded && (
        <div className="category-children">
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              onToggleExpand={onToggleExpand}
              expandedCategories={expandedCategories}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("menu");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [coverImgError, setCoverImgError] = useState(false);
  const [failedDishImages, setFailedDishImages] = useState(new Set());

  // State for API data
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [menus, setMenus] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [dishesLoading, setDishesLoading] = useState(false);

  // Pagination state for categories
  const [categoryPagination, setCategoryPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });

  // Fetch restaurant details
  useEffect(() => {
    if (id) {
      setCoverImgError(false);
      fetchRestaurantDetails();
      fetchMenus();
    }
  }, [id]);

  // Fetch categories when menu is selected
  useEffect(() => {
    if (selectedMenuId && id) {
      fetchCategories();
    }
  }, [selectedMenuId, categoryPagination.page]);

  // Fetch dishes when category is selected
  useEffect(() => {
    if (selectedCategoryId && selectedMenuId && id) {
      fetchDishes();
    }
  }, [selectedCategoryId]);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/restaurant/details", {
        params: { restaurantId: id },
      });

      if (res.data.statusCode === 200) {
        setRestaurant(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch restaurant details");
    } finally {
      setLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await axiosInstance.get("/admin/restaurant/menus", {
        params: { restaurantId: id },
      });

      if (res.data.statusCode === 200 && res.data.data?.menus?.length > 0) {
        setMenus(res.data.data.menus);
        // Select first menu by default
        setSelectedMenuId(res.data.data.menus[0].id);
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      toast.error(error.response?.data?.message || "Failed to fetch menus");
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const res = await axiosInstance.get("/admin/restaurant/menu-categories", {
        params: {
          restaurantId: id,
          menuId: selectedMenuId,
          page: categoryPagination.page,
          limit: categoryPagination.limit,
        },
      });

      if (res.data.statusCode === 200 && res.data.data) {
        const categoriesData = res.data.data.categories || [];
        setCategories(categoriesData);

        if (res.data.pagination) {
          setCategoryPagination((prev) => ({
            ...prev,
            total: res.data.pagination.total || 0,
            totalPages: res.data.pagination.totalPages || 1,
          }));
        }

        // Auto-expand root categories
        const rootCategories = categoriesData.filter((cat) => !cat.parentCategoryId);
        const newExpanded = new Set(expandedCategories);
        rootCategories.forEach((cat) => newExpanded.add(cat.id));
        setExpandedCategories(newExpanded);

        // Select first root category by default
        if (rootCategories.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(rootCategories[0].id);
          setSelectedCategory(rootCategories[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(error.response?.data?.message || "Failed to fetch categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchDishes = async () => {
    try {
      setDishesLoading(true);
      const res = await axiosInstance.get("/admin/restaurant/category-dishes", {
        params: {
          restaurantId: id,
          menuId: selectedMenuId,
          categoryId: selectedCategoryId,
        },
      });

      if (res.data.statusCode === 200) {
        setDishes(res.data.data?.dishes || []);
      }
    } catch (error) {
      console.error("Error fetching dishes:", error);
      toast.error(error.response?.data?.message || "Failed to fetch dishes");
    } finally {
      setDishesLoading(false);
    }
  };

  // Helper function to get field values
  const getFieldValue = (field) => {
    if (!field) return "N/A";
    if (typeof field === "string") return field;
    if (Array.isArray(field)) {
      return field.map((item) => item?.name).filter(Boolean).join(", ") || "N/A";
    }
    if (typeof field === "object" && field.name) return field.name;
    return "N/A";
  };

  // Get service type display
  const getServiceTypes = () => {
    if (!restaurant?.serviceType) return [];
    return restaurant.serviceType.map((st) => st?.name).filter(Boolean);
  };

  const hasServiceType = (keyword) =>
    getServiceTypes().some((name) => name.toLowerCase().includes(keyword));

  // Get business type display
  const getBusinessTypes = () => {
    if (!restaurant?.businessType) return [];
    return restaurant.businessType.map((bt) => bt?.name).filter(Boolean);
  };

  // Get cuisine types
  const getCuisines = () => {
    if (!restaurant?.cuisine) return [];
    return restaurant.cuisine.map((c) => c?.name).filter(Boolean);
  };

  // Get diet types
  const getDietTypes = () => {
    if (!restaurant?.dietType) return [];
    return restaurant.dietType.map((dt) => dt?.name).filter(Boolean);
  };

  // Get dish types
  const getDishTypes = () => {
    if (!restaurant?.dishType) return [];
    return restaurant.dishType.map((dt) => dt?.name).filter(Boolean);
  };

  // Format address
  const getFullAddress = () => {
    if (!restaurant?.address) return "Address not available";
    const { street, No, city, postCode, country } = restaurant.address;
    return [No, street, city, postCode, country].filter(Boolean).join(", ");
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(
    (category) => category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter dishes based on search
  const filteredDishes = dishes.filter((dish) =>
    dish?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Build category tree structure with path for depth
  const buildCategoryTree = (categoriesList) => {
    const map = new Map();
    const roots = [];

    categoriesList.forEach((category) => {
      if (category && category.id) {
        map.set(category.id, { ...category, children: [], depth: category.level || 0 });
      }
    });

    categoriesList.forEach((category) => {
      if (category && category.id) {
        const node = map.get(category.id);
        if (category.parentCategoryId && map.has(category.parentCategoryId)) {
          const parent = map.get(category.parentCategoryId);
          parent.children.push(node);
          node.depth = (parent.depth || 0) + 1;
        } else {
          roots.push(node);
        }
      }
    });

    // Sort roots by orderIndex
    roots.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    return roots;
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSelectCategory = (categoryId, category) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategory(category);
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    if (!status) return "secondary";
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "secondary";
      case "DRAFT":
        return "warning";
      case "SUSPENDED":
        return "danger";
      default:
        return "secondary";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    if (!status) return <FaTimesCircle />;
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return <FaCheckCircle />;
      case "INACTIVE":
        return <FaTimesCircle />;
      case "DRAFT":
        return <FaRegClock />;
      default:
        return <FaInfoCircle />;
    }
  };

  // Get menu status
  const getMenuStatusBadge = (status) => {
    if (!status) return "draft";
    switch (status?.toUpperCase()) {
      case "PUBLISHED":
        return "published";
      case "DRAFT":
        return "draft";
      default:
        return "draft";
    }
  };

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const isNewRestaurant =
    restaurant?.createdAt &&
    Date.now() - new Date(restaurant.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000;

  if (loading) {
    return (
      <div className="restaurant-details-page">
        <div className="loading-container">
          <FaSpinner className="spinner-icon" />
          <h3>Loading Restaurant Details...</h3>
          <p>Please wait while we fetch the information</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="restaurant-details-page">
        <div className="error-container">
          <div className="error-icon">🍽️</div>
          <h2>Restaurant Not Found</h2>
          <p>The restaurant you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate(-1)} className="back-btn primary">
            <FaChevronLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurant-details-page">

      {/* Header with navigation */}
      <div className="details-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FaChevronLeft /> Back
          </button>
          <div className="header-actions">
            <button
              className={`favorite-btn ${isFavorite ? "active" : ""}`}
              onClick={() => setIsFavorite(!isFavorite)}
            >
              <FaHeart />
            </button>
            <button
              className="share-btn"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
              }}
            >
              <FaShare />
            </button>
            <RestaurantAdminActions restaurant={restaurant} onSaved={fetchRestaurantDetails} />
          </div>
        </div>

        {/* Restaurant Cover Image */}
        <div className="cover-image">
          {restaurant.restaurantImages?.length > 0 && !coverImgError ? (
            <img
              src={restaurant.restaurantImages[0]}
              alt={restaurant.name}
              onError={() => setCoverImgError(true)}
            />
          ) : (
            <div className="cover-placeholder">
              <GiKnifeFork />
              <span>{restaurant.name || "Restaurant"}</span>
            </div>
          )}
          {isNewRestaurant && (
            <div className="cover-overlay">
              <div className="cover-badge">
                <FaStar />
                <span>New</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Info Section */}
      <div className="restaurant-info-section">
        <div className="restaurant-main-info">
          <div className="restaurant-name-wrapper">
            <h1 className="restaurant-name">{restaurant.name || "Unnamed Restaurant"}</h1>
            {restaurant.isVerified && (
              <span className="verified-badge" title="Verified Restaurant">
                <FaCheckCircle /> Verified
              </span>
            )}
          </div>
          <div className="rating-wrapper">
            <div className={`rd-status-badge ${getStatusBadgeColor(restaurant.status)}`}>
              {getStatusIcon(restaurant.status)}
              <span>{restaurant.status || "DRAFT"}</span>
            </div>
          </div>
        </div>

        <div className="restaurant-meta-info">
          <div className="meta-item">
            <FaUtensils className="meta-icon" />
            <span>{getCuisines().join(", ") || "Various Cuisines"}</span>
          </div>
          <div className="meta-item">
            <FaTag className="meta-icon" />
            <span>{getBusinessTypes().join(", ") || "Restaurant"}</span>
          </div>
          <div className="meta-item">
            <FaStore className="meta-icon" />
            <span>{getDishTypes().join(", ") || "All Dishes"}</span>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6"><div className="restaurant-address-card">
            <div className="address-header">
              <FaMapMarkerAlt className="address-icon" />
              <h3>Location</h3>
            </div>
            <p className="address-text">{getFullAddress()}</p>
            <div className="coordinates-info">
              <FaMapPin />
              <span>
                {restaurant.latitude?.toFixed(6)}, {restaurant.longitude?.toFixed(6)}
              </span>
            </div>
            {(restaurant.latitude && restaurant.longitude) || restaurant.address ? (
              <a
                className="direction-btn"
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  restaurant.latitude && restaurant.longitude
                    ? `${restaurant.latitude},${restaurant.longitude}`
                    : getFullAddress()
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaMapMarkerAlt /> Get Directions
              </a>
            ) : null}
          </div></div>
          <div className="col-md-6">{/* Contact Info */}
            <div className="contact-info-card">
              <h3>Contact Information</h3>
              <div className="contact-items">
                {restaurant.phone && (
                  <div className="contact-item">
                    <FaPhone className="contact-icon" />
                    <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>
                  </div>
                )}
                {restaurant.email && (
                  <div className="contact-item">
                    <FaEnvelope className="contact-icon" />
                    <a href={`mailto:${restaurant.email}`}>{restaurant.email}</a>
                  </div>
                )}
              </div>
            </div></div>
        </div>





        {/* Quick Stats */}
        <div className="quick-stats-grid">
          <div className="stat-card-rest">
            <div className="stat-icon">
              <MdDeliveryDining />
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {hasServiceType("delivery") ? "Available" : "Not Available"}
              </div>
              <div className="stat-label">Delivery</div>
            </div>
          </div>
          <div className="stat-card-rest">
            <div className="stat-icon">
              <MdTakeoutDining />
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {hasServiceType("table") ? "Available" : "Not Available"}
              </div>
              <div className="stat-label">Dine-in</div>
            </div>
          </div>
          <div className="stat-card-rest">
            <div className="stat-icon">
              <FaLeaf />
            </div>
            <div className="stat-info">
              <div className="stat-value">{getDietTypes().join(", ") || "Mixed"}</div>
              <div className="stat-label">Dietary Options</div>
            </div>
          </div>
        </div>

        {/* Restaurant Description */}
        {restaurant.description && (
          <div className="restaurant-description-card">
            <h3>About {restaurant.name}</h3>
            <p>{restaurant.description}</p>
          </div>
        )}

        {/* Restaurant Features */}
        <div className="features-list">
          {restaurant.isVerified && (
            <span className="feature-tag verified">
              <FaCheckCircle /> Verified Business
            </span>
          )}
          {hasServiceType("delivery") && (
            <span className="feature-tag">
              <MdDeliveryDining /> Delivery Available
            </span>
          )}
          {hasServiceType("table") && (
            <span className="feature-tag">
              <MdTakeoutDining /> Dine-in Available
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "menu" ? "active" : ""}`}
            onClick={() => setActiveTab("menu")}
          >
            <MdRestaurantMenu /> Menu
          </button>
          <button
            className={`tab ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            <FaInfoCircle /> Information
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="content-area">
        {activeTab === "menu" && (
          <div className="menu-section">
            {/* Menu Selector */}
            {menus.length > 1 && (
              <div className="menu-selector">
                <label>Select Menu:</label>
                <select
                  value={selectedMenuId || ""}
                  onChange={(e) => {
                    setSelectedMenuId(e.target.value);
                    setSelectedCategoryId(null);
                    setSelectedCategory(null);
                  }}
                  className="menu-select"
                >
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Menu Info */}
            {menus.find((m) => m.id === selectedMenuId) && (
              <div className="menu-info-card">
                <h3>
                  {menus.find((m) => m.id === selectedMenuId)?.name}
                  <span
                    className={`menu-status ${getMenuStatusBadge(
                      menus.find((m) => m.id === selectedMenuId)?.published
                    )}`}
                  >
                    {menus.find((m) => m.id === selectedMenuId)?.published || "DRAFT"}
                  </span>
                </h3>
                <p>{menus.find((m) => m.id === selectedMenuId)?.description}</p>
                {menus.find((m) => m.id === selectedMenuId)?.additionalText && (
                  <div className="menu-note">
                    <FaInfoCircle /> {menus.find((m) => m.id === selectedMenuId)?.additionalText}
                  </div>
                )}
              </div>
            )}

            {/* Search Bar */}
            <div className="search-container">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search dishes or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Categories Tree and Dishes */}
            <div className="menu-layout">
              {/* Categories Sidebar */}
              <div className="categories-sidebar">
                <div className="categories-header">
                  <FaBookOpen />
                  <h3>Categories</h3>
                  {categories.length > 0 && <span className="count">{categories.length}</span>}
                </div>
                <div className="categories-tree">
                  {categoriesLoading ? (
                    <div className="loading-categories">
                      <FaSpinner className="spinner" />
                      <span>Loading categories...</span>
                    </div>
                  ) : filteredCategories.length > 0 ? (
                    categoryTree.map((category) => (
                      <CategoryTreeItem
                        key={category.id}
                        category={category}
                        selectedCategoryId={selectedCategoryId}
                        onSelectCategory={handleSelectCategory}
                        onToggleExpand={toggleCategoryExpand}
                        expandedCategories={expandedCategories}
                      />
                    ))
                  ) : (
                    <div className="no-categories">
                      <FaFolderOpen />
                      <p>No categories found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dishes Section */}
              <div className="dishes-container">
                {selectedCategory ? (
                  <>
                    <div className="category-header">
                      <div className="category-title">
                        <FaUtensils />
                        <h2>{selectedCategory.name || "Dishes"}</h2>
                      </div>
                      {selectedCategory.description && (
                        <p className="category-desc">{selectedCategory.description}</p>
                      )}
                      {selectedCategory.viewMode && (
                        <div className="view-mode-badge">
                          <FaEye /> {selectedCategory.viewMode} View
                        </div>
                      )}
                    </div>

                    <div className="menu-grid">
                      {dishesLoading ? (
                        <div className="loading-dishes">
                          <FaSpinner className="spinner" />
                          <span>Loading dishes...</span>
                        </div>
                      ) : filteredDishes.length > 0 ? (
                        filteredDishes.map((dish) => {
                          const dishImage = dish.images?.[0];
                          const dishImageFailed = failedDishImages.has(dish.id);
                          return (
                            <div
                              key={dish.id}
                              className="menu-card"
                              onClick={() => navigate(`/dishes/${dish.id}/details`)}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="menu-card-image">
                                {dishImage && !dishImageFailed ? (
                                  <img
                                    src={dishImage}
                                    alt={dish.name}
                                    onError={() =>
                                      setFailedDishImages((prev) => new Set(prev).add(dish.id))
                                    }
                                  />
                                ) : (
                                  <div className="image-placeholder">
                                    <GiSpoon />
                                  </div>
                                )}
                                {dish.highlight && (
                                  <span className="bestseller-badge">
                                    <FaFire /> Highlight
                                  </span>
                                )}
                                {!dish.canBeOrdered && (
                                  <span className="spicy-badge">Unavailable</span>
                                )}
                              </div>
                              <div className="menu-card-content">
                                <div className="menu-card-header">
                                  <div className="dish-name-wrapper">
                                    <h3 className="dish-name">{dish.name || "Unnamed Dish"}</h3>
                                    {dish.tags?.length > 0 && (
                                      <div className="diet-badges">
                                        {dish.tags.slice(0, 2).map((tag) => (
                                          <span key={tag.id} className="veg-badge" title={tag.name}>
                                            {tag.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {dish.description && (
                                  <p className="dish-description">{dish.description}</p>
                                )}

                                <div className="menu-card-footer">
                                  <div className="dish-price">€{Number(dish.singlePrice || 0).toFixed(2)}</div>
                                  <button
                                    className="add-to-cart-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/dishes/${dish.id}/details`);
                                    }}
                                  >
                                    <FaEye /> View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="empty-dishes">
                          <div className="empty-icon">
                            <GiKnifeFork />
                          </div>
                          <h4>No Dishes Available</h4>
                          <p>There are no dishes in this category yet.</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="no-category-selected">
                    <FaFolderOpen />
                    <h3>Select a Category</h3>
                    <p>Choose a category from the sidebar to view dishes</p>
                  </div>
                )}
              </div>
            </div>

            {/* Show message if no categories exist */}
            {categories.length === 0 && !categoriesLoading && (
              <div className="no-menu-container">
                <div className="empty-icon">
                  <MdRestaurantMenu />
                </div>
                <h3>No Menu Available</h3>
                <p>This restaurant hasn't added any menu items yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "info" && (
          <div className="info-section">
            <div className="info-grid">
              <div className="info-card">
                <div className="card-header">
                  <FaStore />
                  <h3>Business Information</h3>
                </div>
                <div className="info-row">
                  <strong>Restaurant ID:</strong>
                  <span>{restaurant.restaurantId || "N/A"}</span>
                </div>
                <div className="info-row">
                  <strong>Owner Email:</strong>
                  <span>{restaurant.owner?.email || "N/A"}</span>
                </div>
                <div className="info-row">
                  <strong>Service Types:</strong>
                  <span>{getServiceTypes().join(", ") || "N/A"}</span>
                </div>
                <div className="info-row">
                  <strong>Business Types:</strong>
                  <span>{getBusinessTypes().join(", ") || "N/A"}</span>
                </div>
                <div className="info-row">
                  <strong>Diet Types:</strong>
                  <span>{getDietTypes().join(", ") || "N/A"}</span>
                </div>
                <div className="info-row">
                  <strong>Cuisines:</strong>
                  <span>{getCuisines().join(", ") || "N/A"}</span>
                </div>
                <div className="info-row">
                  <strong>Dish Types:</strong>
                  <span>{getDishTypes().join(", ") || "N/A"}</span>
                </div>
                <div className="info-row">
                  <strong>Status:</strong>
                  <span className={`badge ${getStatusBadgeColor(restaurant.status)}`}>
                    {restaurant.status || "N/A"}
                  </span>
                </div>
                <div className="info-row">
                  <strong>Verified:</strong>
                  <span className={restaurant.isVerified ? "verified-text" : ""}>
                    {restaurant.isVerified ? "✓ Yes" : "✗ No"}
                  </span>
                </div>
                {restaurant.createdAt && (
                  <div className="info-row">
                    <strong>Joined:</strong>
                    <span>{formatDate(restaurant.createdAt)}</span>
                  </div>
                )}
              </div>

              <div className="info-card">
                <div className="card-header">
                  <FaMapMarkerAlt />
                  <h3>Location Details</h3>
                </div>
                <div className="info-row">
                  <strong>Address:</strong>
                  <span>{getFullAddress()}</span>
                </div>
                {restaurant.latitude && restaurant.longitude && (
                  <div className="coordinates-full">
                    <strong>Coordinates:</strong>
                    <div className="coords">
                      <span>Lat: {restaurant.latitude.toFixed(6)}</span>
                      <span>Lng: {restaurant.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                )}
                <div className="map-mock">
                  <div className="map-placeholder">
                    <FaMapMarkerAlt className="map-marker" />
                    <p>Interactive Map View</p>
                    <small>Click for directions</small>
                  </div>
                </div>
              </div>

              <div className="info-card">
                <div className="card-header">
                  <FaPhone />
                  <h3>Contact Information</h3>
                </div>
                {restaurant.phone && (
                  <div className="info-row">
                    <strong>Phone:</strong>
                    <a href={`tel:${restaurant.phone}`} className="contact-link">
                      {restaurant.phone}
                    </a>
                  </div>
                )}
                {restaurant.email && (
                  <div className="info-row">
                    <strong>Email:</strong>
                    <a href={`mailto:${restaurant.email}`} className="contact-link">
                      {restaurant.email}
                    </a>
                  </div>
                )}
              </div>

              {restaurant.generatedQRCode && (
                <div className="info-card">
                  <div className="card-header">
                    <FaQrcode />
                    <h3>Digital Menu</h3>
                  </div>
                  <div className="qr-code-container">
                    <img src={restaurant.generatedQRCode} alt="Restaurant QR Code" />
                    <p>Scan to view menu on your phone</p>
                    <button
                      className="download-qr-btn"
                      onClick={() => window.open(restaurant.generatedQRCode, "_blank")}
                    >
                      <FaQrcode /> View QR Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetails;