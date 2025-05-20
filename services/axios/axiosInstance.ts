// src/lib/axios/api.ts
import axios from "axios";

const API_VER = "/api/v1";
export const BASE_URL = "http://192.168.1.14:8000" + API_VER;

// Create and export an Axios instance with default settings
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
