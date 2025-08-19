import axios from "axios";

// Lightweight token getter (runtime/localStorage preferred, fallback to cookie)

const api = axios.create({
  baseURL: "",
  timeout: 30_000,
  // ensure browser will send cookies (HttpOnly cookie from server)
  withCredentials: true,
});



export default api;

