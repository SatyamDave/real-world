export type Theme = "system" | "light" | "dark";
const KEY = "rw-theme";
export const THEME_EVENT = "themechange";

export function storedTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Sets `data-theme` on html (none follows the system) and tells canvas code to re-read tokens. */
export function applyTheme(theme: Theme, store = false) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = theme;
  if (store) {
    try {
      if (theme === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, theme);
    } catch {
      // storage blocked: the choice lasts for this page view only
    }
  }
  dispatchEvent(new Event(THEME_EVENT));
}
