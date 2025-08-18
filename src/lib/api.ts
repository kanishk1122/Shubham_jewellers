import axios from "axios";

// Lightweight token getter (localStorage preferred, fallback to cookie)
const getToken = () => {
  /* client-only */
  if (typeof window === "undefined") return undefined;
  const fromLocal = localStorage.getItem("token");
  if (fromLocal) return fromLocal;
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
};

const api = axios.create({
  baseURL: "",
  timeout: 30_000,
});

// attach Authorization header automatically
api.interceptors.request.use((config) => {
  try {
    const t = getToken();
    if (t) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${t}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export default api;

// optional helper to set header manually after login/logout
export const setApiAuthToken = (token?: string | null) => {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
};
