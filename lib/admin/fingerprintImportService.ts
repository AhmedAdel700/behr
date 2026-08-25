"use client";

import { getAdminSessionSnapshot } from "@/lib/admin/adminSessionStore";
import { buildStubFingerprintRecords } from "@/lib/admin/demo-fingerprint-imports";
import {
  getFingerprintImportMonthSnapshot,
  upsertFingerprintImportMonth,
} from "@/lib/admin/fingerprintImportStore";
import type {
  FingerprintAttendanceRecord,
  FingerprintImportFetchResponse,
  FingerprintImportMonthData,
  FingerprintImportUpload,
  FingerprintImportUploadRequest,
  FingerprintImportUploadResponse,
} from "@/types/FingerprintImportApiTypes";

const STUB_DELAY_MS = 600;
const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getBackendBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;
  if (!base || base.trim() === "") return null;
  return base.replace(/\/$/, "");
}

function isAcceptedSpreadsheet(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function parseErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return fallback;
}

function mergeMonthData(
  existing: FingerprintImportMonthData,
  upload: FingerprintImportUpload,
  newRecords: FingerprintAttendanceRecord[],
): FingerprintImportMonthData {
  const uploads = [upload, ...existing.uploads.filter((item) => item.id !== upload.id)];
  const recordMap = new Map(existing.records.map((record) => [record.id, record]));

  for (const record of newRecords) {
    recordMap.set(record.id, record);
  }

  return {
    branchId: existing.branchId,
    year: existing.year,
    month: existing.month,
    uploads,
    records: Array.from(recordMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  };
}

async function fetchMonthFromBackend(
  branchId: string,
  year: number,
  month: number,
): Promise<FingerprintImportFetchResponse> {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) {
    return { ok: false, message: "Backend URL is not configured." };
  }

  const url = new URL(`${baseUrl}/admin/fingerprint-import`);
  url.searchParams.set("branch_id", branchId);
  url.searchParams.set("year", String(year));
  url.searchParams.set("month", String(month));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return fetchMonthStub(branchId, year, month);
    }

    let message = "Failed to load fingerprint import data.";
    try {
      const payload: unknown = await response.json();
      message = parseErrorMessage(payload, message);
    } catch {
      // keep default message
    }
    return { ok: false, message };
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("year" in payload) ||
    !("month" in payload) ||
    !("uploads" in payload) ||
    !("records" in payload)
  ) {
    return { ok: false, message: "Unexpected response from server." };
  }

  const data = payload as FingerprintImportMonthData;
  upsertFingerprintImportMonth({ ...data, branchId: data.branchId || branchId });
  return { ok: true, data: { ...data, branchId: data.branchId || branchId } };
}

async function uploadToBackend(
  request: FingerprintImportUploadRequest
): Promise<FingerprintImportUploadResponse> {
  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) {
    return { ok: false, message: "Backend URL is not configured." };
  }

  const formData = new FormData();
  formData.append("file", request.file);
  formData.append("branch_id", request.branchId);
  formData.append("year", String(request.year));
  formData.append("month", String(request.month));

  const response = await fetch(`${baseUrl}/admin/fingerprint-import`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 404) {
      return uploadStub(request);
    }

    let message = "Failed to upload fingerprint sheet.";
    try {
      const payload: unknown = await response.json();
      message = parseErrorMessage(payload, message);
    } catch {
      // keep default message
    }
    return { ok: false, message };
  }

  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("year" in payload) ||
    !("month" in payload) ||
    !("uploads" in payload) ||
    !("records" in payload)
  ) {
    return { ok: false, message: "Unexpected response from server." };
  }

  const data = payload as FingerprintImportMonthData;
  const normalizedData = {
    ...data,
    branchId: data.branchId || request.branchId,
  };
  upsertFingerprintImportMonth(normalizedData);
  return { ok: true, data: normalizedData };
}

async function fetchMonthStub(
  branchId: string,
  year: number,
  month: number,
): Promise<FingerprintImportFetchResponse> {
  await delay(STUB_DELAY_MS);
  const data = getFingerprintImportMonthSnapshot(branchId, year, month);
  return { ok: true, data };
}

async function uploadStub(
  request: FingerprintImportUploadRequest
): Promise<FingerprintImportUploadResponse> {
  if (!isAcceptedSpreadsheet(request.file)) {
    return {
      ok: false,
      message: "Please upload an Excel (.xlsx, .xls) or CSV file.",
    };
  }

  await delay(STUB_DELAY_MS);

  const existing = getFingerprintImportMonthSnapshot(
    request.branchId,
    request.year,
    request.month,
  );
  const admin = getAdminSessionSnapshot();
  const newRecords = buildStubFingerprintRecords(
    request.year,
    request.month,
    request.file.name
  );

  const upload: FingerprintImportUpload = {
    id: `upload-${request.year}-${request.month}-${Date.now()}`,
    fileName: request.file.name,
    year: request.year,
    month: request.month,
    uploadedAt: new Date().toISOString(),
    uploadedBy: admin.name,
    recordCount: newRecords.length,
  };

  const merged = mergeMonthData(existing, upload, newRecords);
  upsertFingerprintImportMonth(merged);
  return { ok: true, data: merged };
}

export async function fetchFingerprintImportMonth(
  branchId: string,
  year: number,
  month: number,
): Promise<FingerprintImportFetchResponse> {
  const normalizedBranchId = branchId.trim();
  if (!normalizedBranchId) {
    return { ok: false, message: "Branch is required." };
  }

  const baseUrl = getBackendBaseUrl();
  if (baseUrl) {
    return fetchMonthFromBackend(normalizedBranchId, year, month);
  }
  return fetchMonthStub(normalizedBranchId, year, month);
}

export async function submitFingerprintImport(
  request: FingerprintImportUploadRequest
): Promise<FingerprintImportUploadResponse> {
  const normalizedBranchId = request.branchId.trim();
  if (!normalizedBranchId) {
    return { ok: false, message: "Branch is required." };
  }

  if (!isAcceptedSpreadsheet(request.file)) {
    return {
      ok: false,
      message: "Please upload an Excel (.xlsx, .xls) or CSV file.",
    };
  }

  const baseUrl = getBackendBaseUrl();
  if (baseUrl) {
    return uploadToBackend(request);
  }
  return uploadStub(request);
}

export function buildYearOptions(currentYear: number, span = 6): number[] {
  return Array.from({ length: span }, (_, index) => currentYear - index);
}

export function buildMonthOptions(): number[] {
  return Array.from({ length: 12 }, (_, index) => index + 1);
}
