import axios from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "gg_token";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

// Injeta o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se 401, limpa o token e redireciona para login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export const setToken = (token: string) =>
  Cookies.set(TOKEN_KEY, token, { expires: 7 });
export const getToken = () => Cookies.get(TOKEN_KEY);
export const clearToken = () => Cookies.remove(TOKEN_KEY);
