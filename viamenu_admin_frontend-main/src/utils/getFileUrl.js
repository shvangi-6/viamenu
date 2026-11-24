const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Backend origin (strips the trailing "/api/v1" from the API base URL)
const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/v\d+\/?$/, "");

// Resolves a stored file path (e.g. "/uploads/icons/xxx.png") returned by the
// backend into an absolute URL the browser can load. Absolute URLs (S3, http(s))
// are returned unchanged.
export const getFileUrl = (path) => {
  if (!path) return "";
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }
  return `${SERVER_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
};
