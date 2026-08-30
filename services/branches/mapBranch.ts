import { parseLocalizedField } from "@/lib/admin/branchLocalizedText";
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

export function mapBranchFromApi(
  record: BranchApiRecord,
  lang: string,
): AdminBranchRecord {
  const name = parseLocalizedField(record.name, lang);
  const city = parseLocalizedField(record.city, lang);
  const address = parseLocalizedField(record.address, lang);

  return {
    id: String(record.id),
    slug: slugifyBranchName(name.display) || `branch-${record.id}`,
    name: name.display,
    city: city.display,
    address: address.display,
    nameLocalized: name.localized,
    cityLocalized: city.localized,
    addressLocalized: address.localized,
    phone: normalizeBranchText(record.phone),
    email: normalizeBranchText(record.email),
    latitude: record.latitude ?? 0,
    longitude: record.longitude ?? 0,
    createdAt: record.created_at.slice(0, 10),
    departmentsCount: parseCount(record.departments_count),
    usersCount: parseCount(record.users_count),
  };
}

export function mapBranchesFromApi(
  records: readonly BranchApiRecord[],
  lang: string,
): AdminBranchRecord[] {
  return records.map((record) => mapBranchFromApi(record, lang));
}
