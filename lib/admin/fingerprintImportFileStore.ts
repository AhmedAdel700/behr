"use client";

const fileByUploadId = new Map<string, File>();

export function storeFingerprintImportFile(uploadId: string, file: File): void {
  fileByUploadId.set(uploadId, file);
}

export function getFingerprintImportFile(uploadId: string): File | undefined {
  return fileByUploadId.get(uploadId);
}

export function triggerBrowserFileDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
