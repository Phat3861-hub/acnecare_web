import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:8080/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "WEB",
  },
});
