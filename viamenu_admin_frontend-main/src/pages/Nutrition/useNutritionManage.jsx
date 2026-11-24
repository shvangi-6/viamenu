import { useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import RecordModal from "../../components/common/RecordModal";
import { confirmDelete } from "../../utils/confirmDelete";

const FIELDS = [
  { key: "name", label: "Name", required: true },
  { key: "description", label: "Description", type: "textarea" },
];

/**
 * Add / edit / delete for one allergen, ingredient or additive list
 * (kind = "allergens" | "ingredients" | "additives"). New entries go into
 * the list of the owner whose email is given.
 */
export function useNutritionManage(kind, label, refetch) {
  const [open, setOpen] = useState(null); // "new" | row
  const done = () => { setOpen(null); refetch(); };

  const addButton = <button className="ps-btn" onClick={() => setOpen("new")}><FaPlus /> Add {label}</button>;
  const actionColumn = {
    key: "actions",
    label: "Actions",
    render: (_v, row) => (
      <div className="act-row">
        <button className="act-btn act-btn--ghost" title="Edit" onClick={() => setOpen(row)}><FaEdit /></button>
        <button className="act-btn act-btn--danger" title="Delete" onClick={() => confirmDelete(`/admin/nutrition/${kind}/${row.id}`, `Delete "${row.name}"? This is refused while a dish, extra or ingredient still uses it.`, refetch)}><FaTrash /></button>
      </div>
    ),
  };
  const modal = open && (open === "new" ? (
    <RecordModal
      title={`Add ${label}`}
      method="post"
      url={`/admin/nutrition/${kind}`}
      saveLabel="Add"
      fields={[{ key: "ownerEmail", label: "Owner's email", type: "email", required: true, hint: `The ${label} is added to this owner's list.` }, ...FIELDS]}
      onClose={() => setOpen(null)}
      onSaved={done}
    />
  ) : (
    <RecordModal
      title={`Edit ${label} — ${open.name}`}
      url={`/admin/nutrition/${kind}/${open.id}`}
      initial={{ ...open, description: open.description ?? "" }}
      fields={FIELDS}
      onClose={() => setOpen(null)}
      onSaved={done}
    />
  ));
  return { addButton, actionColumn, modal };
}
