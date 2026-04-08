// src/api/auth.ts

import apiClient from "./apiClient";

export async function loginMaster(username: string, password: string) {
  return apiClient.post("/api/v1/auth/master/login", { username, password });
}

export async function loginAdmin(username: string, password: string) {
  return apiClient.post("/api/v1/auth/admin/login", { username, password });
}

export async function loginHospital(license_number: string, password: string) {
  return apiClient.post("/api/v1/auth/hospital/login", { license_number, password });
}

export async function loginDoctor(username: string, password: string) {
  return apiClient.post("/api/v1/auth/doctor/login", { username, password });
}

export async function logout() {
  return apiClient.post("/api/v1/auth/logout");
}

export async function getMe() {
  return apiClient.get("/api/v1/auth/me");
}