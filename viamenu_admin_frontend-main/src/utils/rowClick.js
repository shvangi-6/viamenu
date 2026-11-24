/** Row onClick that ignores clicks on buttons/links/inputs inside the row and text selection. */
export const rowClick = (fn) => (e) => {
  if (e.target.closest("button, a, input, select, textarea, label")) return;
  if (window.getSelection()?.toString()) return;
  fn();
};
