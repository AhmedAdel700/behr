import { slugifyBranchName } from "@/lib/admin/demo-org-data";
import type { AdminBranchRecord } from "@/types/AdminApiTypes";
import type { BranchApiRecord } from "@/types/BranchesApiTypes";

function parseCount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBranchText(value: string | null | undefined): string {
  return value ?? "";
}

export function mapBranchFromApi(record: BranchApiRecord): AdminBranchRecord {
  return {
    id: String(record.id),
    slug: slugifyBranchName(record.name) || `branch-${record.id}`,
    name: normalizeBranchText(record.name),
    city: normalizeBranchText(record.city),
    address: normalizeBranchText(record.address),
    phone: normalizeBranchText(record.phone),
    email: normalizeBranchText(record.email),
    latitude: record.latitude ?? 0,
    longitude: record.longitude ?? 0,
    createdAt: record.created_at.slice(0, 10),
    departmentsCount: parseCount(record.departments_count),
    usersCount: parseCount(record.users_count),
  };
}

export function mapBranchesFromApi(records: readonly BranchApiRecord[]): AdminBranchRecord[] {
  return records.map((record) => mapBranchFromApi(record));
}
