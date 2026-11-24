import { toast } from "react-toastify";
import axiosInstance from "./axiosInstance";
/** Confirm, DELETE, toast, then refresh the list. */
export async function confirmDelete(url, question, onDone) {
  if (!window.confirm(question)) return;
  try {
    const r = await axiosInstance.delete(url);
    toast.success(r.data?.message || "Deleted");
    onDone?.();
  } catch (e) {
    toast.error(e.response?.data?.message || "Delete failed");
  }
}
