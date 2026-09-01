import { emptyLocalizedText } from "@/lib/admin/branchLocalizedText";
import type { PositionRecord } from "@/types/PositionsApiTypes";

function demoPosition(id: string, slug: string, name: string): PositionRecord {
  const nameLocalized = emptyLocalizedText();
  nameLocalized.en = name;

  return {
    id,
    slug,
    name,
    nameLocalized,
  };
}

/** Seeded from demo employee job titles so register/edit stay aligned. */
export const MOCK_POSITIONS: PositionRecord[] = [
  demoPosition("pos-1", "hr-specialist", "HR Specialist"),
  demoPosition("pos-2", "operations-lead", "Operations Lead"),
  demoPosition("pos-3", "accountant", "Accountant"),
  demoPosition("pos-4", "software-engineer", "Software Engineer"),
  demoPosition("pos-5", "sales-executive", "Sales Executive"),
  demoPosition("pos-6", "recruiter", "Recruiter"),
  demoPosition("pos-7", "hr-coordinator", "HR Coordinator"),
  demoPosition("pos-8", "warehouse-supervisor", "Warehouse Supervisor"),
  demoPosition("pos-9", "financial-analyst", "Financial Analyst"),
  demoPosition("pos-10", "support-engineer", "Support Engineer"),
  demoPosition("pos-11", "sales-associate", "Sales Associate"),
  demoPosition("pos-12", "logistics-coordinator", "Logistics Coordinator"),
  demoPosition("pos-13", "payroll-assistant", "Payroll Assistant"),
  demoPosition("pos-14", "budget-analyst", "Budget Analyst"),
  demoPosition("pos-15", "qa-tester", "QA Tester"),
  demoPosition("pos-16", "business-developer", "Business Developer"),
  demoPosition("pos-17", "training-specialist", "Training Specialist"),
  demoPosition("pos-18", "account-manager", "Account Manager"),
];
