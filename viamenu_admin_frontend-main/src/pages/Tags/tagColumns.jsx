import { FaTags } from "react-icons/fa";
import { getFileUrl } from "../../utils/getFileUrl";

// Tag name + icon cell, shared by Global Tags and Owner Tags.
export const tagNameColumn = {
  key: "name",
  label: "Tag",
  sort: "name",
  render: (_v, t) => (
    <div className="nc">
      <div
        className="av av--md av--square"
        style={t.icon ? { backgroundImage: `url(${getFileUrl(t.icon)})`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundColor: "#f1f5f9" } : { background: "#2c8769" }}
      >
        {!t.icon && <FaTags />}
      </div>
      <span className="nc-name">{t.name}</span>
    </div>
  ),
};
