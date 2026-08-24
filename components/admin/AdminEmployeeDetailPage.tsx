"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type ReactElement,
  type ReactNode,
} from "react";
import { useDispatch } from "react-redux";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Hash,
  Mail,
  MapPinned,
  Fingerprint,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import {
  employeesApi,
  useDeleteEmployeeMutation,
  useGetEmployeeQuery,
} from "@/app/store/api/employees/employeesApi";
import type { AppDispatch } from "@/app/store/store";
import { AttendanceHistorySection } from "@/components/employee/AttendanceHistorySection";
import { LeaveStatsSection } from "@/components/employee/LeaveStatsSection";
import { EditEmployeeAssignmentModal } from "@/components/admin/EditEmployeeAssignmentModal";
import { DeleteConfirmModal } from "@/components/shared/DeleteConfirmModal";
import { ProfileAvatar } from "@/components/shared/AvatarUpload";
import { MainButton } from "@/components/shared/MainButton";
import {
  getAdminSessionSnapshot,
  subscribeAdminSession,
} from "@/lib/admin/adminSessionStore";
import { canManageEmployees, isSuperAdmin } from "@/lib/admin/permissions";
import { formatDateTime12, resolveTimeLocale } from "@/lib/formatTime";
import type { EmployeeRecord } from "@/types/EmployeesApiTypes";

export function AdminEmployeeDetailPage({
  employeeId,
  initialData,
}: {
  employeeId: string;
  initialData?: EmployeeRecord;
}): ReactElement {
  const t = useTranslations("admin.employeeDetailPage");
  const tEmployees = useTranslations("admin.employees");
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const didSeedCache = useRef(false);

  useSyncExternalStore(
    subscribeAdminSession,
    getAdminSessionSnapshot,
    getAdminSessionSnapshot,
  );

  if (initialData && employeeId && !didSeedCache.current) {
    didSeedCache.current = true;
    dispatch(
      employeesApi.util.upsertQueryData("getEmployee", employeeId, initialData),
    );
  }

  const {
    data: employeeData,
    isLoading,
    isError,
  } = useGetEmployeeQuery(employeeId, { skip: !employeeId });

  const admin = getAdminSessionSnapshot();
  const employee = employeeData ?? initialData;
  const canEdit = canManageEmployees(admin.role);
  const canDelete = isSuperAdmin(admin.role);
  const [deleteEmployeeMutation, { isLoading: deletingEmployee }] =
    useDeleteEmployeeMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const editEmployeeTriggerRef = useRef<HTMLButtonElement>(null);
  const deleteEmployeeTriggerRef = useRef<HTMLButtonElement>(null);

  const confirmDelete = async (): Promise<void> => {
    if (!employee) {
      return;
    }

    try {
      await deleteEmployeeMutation({ employeeId: employee.id }).unwrap();
      setDeleteOpen(false);
      router.push("/admin-dashboard/employees");
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "error" in error &&
        typeof error.error === "string" &&
        error.error.trim()
          ? error.error
          : tEmployees("deleteError");
      toast.error(message);
    }
  };

  if (!employeeId || ((isError || !employee) && !isLoading)) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {t("notFoundTitle")}
        </h1>
        <p className="text-sm text-text-secondary">{t("notFoundDescription")}</p>
        <MainButton variant="primary" size="sm" link="/admin-dashboard/employees">
          {t("backToEmployees")}
        </MainButton>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <p className="text-sm text-text-secondary">{tEmployees("loading")}</p>
      </div>
    );
  }

  const positionLabel = employee.jobPosition?.name ?? tEmployees("notAssigned");

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <MainButton
          variant="ghost-brand"
          size="sm"
          startIcon={<ArrowLeft className="size-4 rtl:rotate-180" />}
          link="/admin-dashboard/employees"
        >
          {t("backToEmployees")}
        </MainButton>
        <div className="flex items-center gap-4">
          <ProfileAvatar
            src={employee.image}
            alt={employee.fullName}
            width={80}
            height={80}
            className="size-20 shrink-0 rounded-2xl object-cover ring-2 ring-primary-100"
          />
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
              {employee.fullName}
            </h1>
            <p className="text-sm text-text-secondary">
              {t("subtitle", { position: positionLabel })}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title={t("sections.work")} icon={Briefcase}>
          <DetailField
            label={t("fields.department")}
            value={employee.department?.name ?? tEmployees("notAssigned")}
            icon={Users}
          />
          <DetailField
            label={t("fields.branch")}
            value={formatBranchLabel(employee.branch, tEmployees("notAssigned"))}
            icon={MapPinned}
          />
          <DetailField
            label={t("fields.position")}
            value={positionLabel}
            icon={UserRound}
          />
          <DetailField
            label={t("fields.departmentManager")}
            value={
              employee.department?.manager?.fullName ??
              tEmployees("notAssigned")
            }
            icon={UserRound}
          />
        </InfoCard>

        <InfoCard title={t("sections.contact")} icon={Mail}>
          <DetailField
            label={t("fields.email")}
            value={employee.email}
            icon={Mail}
          />
          <DetailField
            label={t("fields.phone")}
            value={employee.phone || tEmployees("notAssigned")}
            icon={Phone}
          />
        </InfoCard>

        <InfoCard title={t("sections.employment")} icon={CalendarDays}>
          <DetailField
            label={t("fields.employeeId")}
            value={employee.id}
            icon={Hash}
          />
          <DetailField
            label={t("fields.fingerprintNumber")}
            value={employee.fingerprintNumber || tEmployees("notAssigned")}
            icon={Fingerprint}
          />
          <DetailField
            label={t("fields.joinDate")}
            value={formatJoinDate(employee.createdAt, locale)}
            icon={CalendarDays}
          />
        </InfoCard>
      </div>

      <LeaveStatsSection employeeId={employee.id} />

      <AttendanceHistorySection employeeId={employee.id} />

      {canEdit || canDelete ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {canEdit ? (
            <MainButton
              ref={editEmployeeTriggerRef}
              variant="primary"
              block
              startIcon={<Pencil className="size-4" />}
              onClick={() => setEditOpen(true)}
            >
              {tEmployees("edit")}
            </MainButton>
          ) : null}

          {canDelete ? (
            <MainButton
              ref={deleteEmployeeTriggerRef}
              variant="delete"
              block
              startIcon={<Trash2 className="size-4" />}
              onClick={() => setDeleteOpen(true)}
            >
              {t("deleteEmployee")}
            </MainButton>
          ) : null}
        </div>
      ) : null}

      <DeleteConfirmModal
        open={deleteOpen}
        title={tEmployees("deleteTitle")}
        description={tEmployees("deleteDescription")}
        confirmLabel={tEmployees("deleteConfirm")}
        cancelLabel={tEmployees("cancel")}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          void confirmDelete();
          return false;
        }}
        loading={deletingEmployee}
        triggerRef={deleteEmployeeTriggerRef}
      />

      {canEdit ? (
        <EditEmployeeAssignmentModal
          employee={employee}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          triggerRef={editEmployeeTriggerRef}
        />
      ) : null}
    </div>
  );
}

function formatJoinDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDateTime12(date, resolveTimeLocale(locale));
}

function formatBranchLabel(
  branch: EmployeeRecord["branch"],
  fallback: string,
): string {
  if (!branch) {
    return fallback;
  }

  if (branch.city.trim()) {
    return `${branch.name} · ${branch.city}`;
  }

  return branch.name.trim() ? branch.name : fallback;
}

interface InfoCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}

function InfoCard({ title, icon: Icon, children }: InfoCardProps): ReactElement {
  return (
    <section className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      <header className="flex items-center gap-2.5 border-b border-border bg-surface-muted/50 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700">
          <Icon className="size-4" aria-hidden />
        </span>
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
      </header>
      <dl className="flex flex-1 flex-col gap-3 p-4">{children}</dl>
    </section>
  );
}

function DetailField({
  label,
  value,
  icon: Icon,
  action,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  action?: ReactNode;
}): ReactElement {
  return (
    <div className="rounded-xl border border-border/80 bg-surface-muted/30 px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1.5 flex items-center justify-between gap-2">
        <span className="min-w-0 break-words text-sm font-medium text-ink">
          {value}
        </span>
        {action}
      </dd>
    </div>
  );
}
