import axios from "axios";

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/",
  // ❌ no token, no interceptor — this is for public read-only endpoints
});

export default publicApi;
