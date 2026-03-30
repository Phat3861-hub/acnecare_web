import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:9090/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "WEB",
  },
});
