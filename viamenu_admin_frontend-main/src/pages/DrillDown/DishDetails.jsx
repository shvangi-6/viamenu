import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../utils/axiosInstance";
import PageShell from "../../components/common/PageShell";
import Breadcrumb from "../../components/common/Breadcrumb";
import "../../components/common/shared.css";

export default function DishDetails() {
  const { dishId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get(`/admin/content/dishes/${dishId}/details`)
      .then((res) => setData(res.data?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [dishId]);

  const dish = data?.dish;
  const ingredients = data?.ingredients || [];
  const allergens = data?.allergens || [];
  const additives = data?.additives || [];
  const tags = data?.tags || [];
  const variantSets = data?.variantSets || [];
  const extraSets = data?.extraSets || [];

  const crumbs = dish
    ? [
        { label: "Restaurants", to: "/restaurant/restaurants-list" },
        {
          label: `${dish.restaurantName} — Menus`,
          to: `/restaurants/${dish.restaurantId}/menus`,
        },
        {
          label: `${dish.menuName} — Categories`,
          to: `/restaurants/${dish.restaurantId}/menus/${dish.menuId}/categories`,
        },
        {
          label: `${dish.categoryName} — Dishes`,
          to: `/restaurants/${dish.restaurantId}/menus/${dish.menuId}/categories/${dish.categoryId}/dishes`,
        },
        { label: dish.name },
      ]
    : [{ label: "Dish Details" }];

  if (loading) {
    return (
      <PageShell title="Dish Details" subtitle="Loading…">
        <div className="dt-loading">
          <div className="dt-spinner" />
        </div>
      </PageShell>
    );
  }

  if (!dish) {
    return (
      <PageShell title="Dish Not Found" subtitle="">
        <div className="dt-empty">
          <div className="dt-empty-icon">🍽</div>
          <div>Dish not found or has been deleted.</div>
        </div>
      </PageShell>
    );
  }

  const hasImage = dish.coverImage && !imgError;

  return (
    <PageShell title={dish.name} subtitle="Full dish details">

      <div style={{ padding: "16px 20px 0" }}>
        <Breadcrumb crumbs={crumbs} />
      </div>

      {/* Dish hero card */}
      <div style={{ padding: "0 20px 20px" }}>
        <div className="hero-card">
          <div
            className="hero-avatar"
            style={
              hasImage
                ? { backgroundImage: `url(${dish.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                : {}
            }
          >
            {hasImage && (
              <img
                src={dish.coverImage}
                alt=""
                style={{ display: "none" }}
                onError={() => setImgError(true)}
              />
            )}
            {!hasImage && (dish.name?.[0] || "D").toUpperCase()}
          </div>
          <div className="hero-body">
            <h2 className="hero-name">{dish.name}</h2>
            {dish.description && (
              <p style={{ fontSize: 13, color: "var(--c-muted)", margin: "4px 0 8px" }}>
                {dish.description}
              </p>
            )}
            <div className="hero-meta">
              {!dish.usePricesByVariants && (
                <span className="hero-meta-item">
                  💰 Base price: <strong style={{ marginLeft: 4 }}>€{Number(dish.singlePrice || 0).toFixed(2)}</strong>
                </span>
              )}
              <span className="hero-meta-item">🍽 {dish.categoryName}</span>
              <span className="hero-meta-item">📖 {dish.menuName}</span>
              <span className="hero-meta-item">🏪 {dish.restaurantName}</span>
              {dish.number != null && <span className="hero-meta-item">#{dish.number}</span>}
            </div>
            <div className="hero-pills" style={{ marginTop: 8 }}>
              {dish.highlight && <span className="hero-pill hero-pill--orange">⭐ Highlighted</span>}
              {dish.usePricesByVariants && (
                <span className="hero-pill hero-pill--blue">Prices by variant</span>
              )}
              <span className={`hero-pill ${dish.visibleInMenu ? "hero-pill--green" : "hero-pill--gray"}`}>
                {dish.visibleInMenu ? "Visible in menu" : "Hidden from menu"}
              </span>
              <span className={`hero-pill ${dish.canBeOrdered ? "hero-pill--green" : "hero-pill--red"}`}>
                {dish.canBeOrdered ? "Orderable" : "Not orderable"}
              </span>
              <span className={`hero-pill ${dish.canBeDelivered ? "hero-pill--green" : "hero-pill--red"}`}>
                {dish.canBeDelivered ? "Deliverable" : "Not deliverable"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="dd-section">
          <h3 className="dd-section-title">🏷 Tags</h3>
          <div className="chip-list">
            {tags.map((t) => (
              <span key={t.id} className="chip chip--tag">{t.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <div className="dd-section">
          <h3 className="dd-section-title">🥗 Ingredients</h3>
          <div className="chip-list">
            {ingredients.map((i) => (
              <span key={i.id} className="chip chip--ingredient" title={i.description || ""}>{i.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Allergens */}
      {allergens.length > 0 && (
        <div className="dd-section">
          <h3 className="dd-section-title">⚠️ Allergens</h3>
          <div className="chip-list">
            {allergens.map((a) => (
              <span key={a.id} className="chip chip--allergen" title={a.description || ""}>{a.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Additives */}
      {additives.length > 0 && (
        <div className="dd-section">
          <h3 className="dd-section-title">🧪 Additives</h3>
          <div className="chip-list">
            {additives.map((a) => (
              <span key={a.id} className="chip chip--additive" title={a.description || ""}>
                {a.code ? `${a.code} — ${a.name}` : a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {dish.notes?.length > 0 && (
        <div className="dd-section">
          <h3 className="dd-section-title">📝 Notes</h3>
          <ul className="notes-list">
            {dish.notes.map((n, idx) => (
              <li key={idx}>{typeof n === "string" ? n : n?.text || JSON.stringify(n)}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Variant & extra sets */}
      <h3 className="dd-section-title" style={{ padding: "0 20px" }}>🔧 Variants &amp; Extras</h3>
      {variantSets.length === 0 && extraSets.length === 0 ? (
        <div className="dt-empty">
          <div className="dt-empty-icon">🔧</div>
          <div>No variant or extra sets assigned to this dish.</div>
        </div>
      ) : (
        <div className="vset-grid">
          {variantSets.map((vs) => (
            <div key={vs.id} className="vset-card">
              <div className="vset-header">
                <span className="vset-title">{vs.name}</span>
                <span className="vset-mode">{vs.displayMode || "single"}</span>
              </div>
              <div className="vset-rows">
                {vs.varients?.length > 0 ? (
                  vs.varients.map((v) => (
                    <div key={v.id} className="vset-row">
                      <span className="vset-row-name">{v.name}</span>
                      <span className="vset-row-price">€{Number(v.price || 0).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="vset-empty">No variants in this set</div>
                )}
              </div>
            </div>
          ))}

          {extraSets.map((es) => (
            <div key={es.id} className="eset-card">
              <div className="eset-header">
                <span className="vset-title">{es.name}</span>
                <span className="vset-mode">{es.displayMode || "multi"}</span>
              </div>
              <div className="vset-rows">
                {es.extras?.length > 0 ? (
                  es.extras.map((e) => (
                    <div key={e.id} className="vset-row">
                      <span className="vset-row-name">{e.name}</span>
                      <span className="vset-row-price">+€{Number(e.price || 0).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="vset-empty">No extras in this set</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
