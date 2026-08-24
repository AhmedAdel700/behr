"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useGetEmployeesQuery } from "@/app/store/api/employees/employeesApi";
import { MainButton } from "@/components/shared/MainButton";
import { SearchInput } from "@/components/shared/SearchInput";
import { toEmployeeManagerRecord } from "@services/employees/employeesService";
import type { EmployeeManagerRecord } from "@/types/EmployeesApiTypes";

interface EmployeeManagerPickerProps {
  branchId?: string;
  selectedEmployeeId: string;
  initialSelectedEmployee?: EmployeeManagerRecord | null;
  onSelect: (employeeId: string) => void;
  error?: string;
}

export function EmployeeManagerPicker({
  branchId,
  selectedEmployeeId,
  initialSelectedEmployee = null,
  onSelect,
  error,
}: EmployeeManagerPickerProps): ReactElement {
  const t = useTranslations("admin.createDepartment");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const shouldSearch = Boolean(branchId && debouncedSearch.trim());
  const { data: employeesResult, isFetching } = useGetEmployeesQuery(
    { search: debouncedSearch, page: 1 },
    { skip: !shouldSearch },
  );

  const filteredEmployees = useMemo(() => {
    return (employeesResult?.employees ?? []).map(toEmployeeManagerRecord);
  }, [employeesResult?.employees]);

  const [selectedEmployeeSnapshot, setSelectedEmployeeSnapshot] =
    useState<EmployeeManagerRecord | null>(() => {
      if (
        selectedEmployeeId &&
        initialSelectedEmployee?.id === selectedEmployeeId
      ) {
        return initialSelectedEmployee;
      }

      return null;
    });

  useEffect(() => {
    if (!selectedEmployeeId) {
      setSelectedEmployeeSnapshot(null);
      return;
    }

    setSelectedEmployeeSnapshot((current) => {
      if (current?.id === selectedEmployeeId) {
        return current;
      }

      if (initialSelectedEmployee?.id === selectedEmployeeId) {
        return initialSelectedEmployee;
      }

      return current;
    });
  }, [selectedEmployeeId, initialSelectedEmployee]);

  const selectedEmployee =
    filteredEmployees.find((employee) => employee.id === selectedEmployeeId) ??
    (selectedEmployeeSnapshot?.id === selectedEmployeeId
      ? selectedEmployeeSnapshot
      : undefined);
  const hasSelection = selectedEmployee !== undefined;

  const handleSelect = (employeeId: string): void => {
    const nextSelected =
      filteredEmployees.find((employee) => employee.id === employeeId) ?? null;
    setSelectedEmployeeSnapshot(nextSelected);
    onSelect(employeeId);
    setSearchQuery("");
    setDebouncedSearch("");
  };

  const handleRemove = (): void => {
    setSelectedEmployeeSnapshot(null);
    onSelect("");
    setSearchQuery("");
    setDebouncedSearch("");
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-ink">{t("managerSection")}</p>
        <p className="mt-1 text-xs text-text-muted">{t("managerHint")}</p>
      </div>

      {selectedEmployee ? (
        <div className="flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50/50 px-3 py-2.5">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium text-ink">{selectedEmployee.name}</p>
            <p className="text-xs text-text-secondary">{selectedEmployee.email}</p>
            {selectedEmployee.position ? (
              <p className="text-xs text-text-muted">{selectedEmployee.position}</p>
            ) : null}
          </div>
          <MainButton
            type="button"
            variant="ghost-brand"
            size="sm"
            iconOnly
            aria-label={t("removeManager")}
            startIcon={<X className="size-4" />}
            onClick={handleRemove}
          />
        </div>
      ) : null}

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={setDebouncedSearch}
        placeholder={t("placeholders.managerSearch")}
        aria-label={t("placeholders.managerSearch")}
        disabled={!branchId || hasSelection}
      />

      {!branchId ? (
        <p className="text-xs text-text-muted">{t("selectBranchFirst")}</p>
      ) : hasSelection ? null : !debouncedSearch.trim() ? (
        <p className="text-xs text-text-muted">{t("typeToSearch")}</p>
      ) : (
        <ul className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-border bg-surface-muted/20 p-2">
          {isFetching ? (
            <li className="px-2 py-6 text-center text-sm text-text-muted">
              {t("typeToSearch")}
            </li>
          ) : filteredEmployees.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-text-muted">
              {t("noEmployeesFound")}
            </li>
          ) : (
            filteredEmployees.map((employee) => (
              <li key={employee.id}>
                <MainButton
                  type="button"
                  variant="neutral"
                  block
                  onClick={() => handleSelect(employee.id)}
                  className="h-auto items-start justify-start rounded-lg px-3 py-2.5 text-start font-normal"
                >
                  <span className="flex w-full flex-col items-start gap-1 text-start">
                    <span className="text-sm font-medium text-ink">
                      {employee.name}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {employee.email}
                    </span>
                    {employee.position ? (
                      <span className="text-xs text-text-muted">
                        {employee.position}
                      </span>
                    ) : null}
                  </span>
                </MainButton>
              </li>
            ))
          )}
        </ul>
      )}

      {error ? <p className="text-xs text-danger-600">{error}</p> : null}
    </div>
  );
}
