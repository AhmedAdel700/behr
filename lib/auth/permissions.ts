export function hasPermission(
  permissions: readonly string[],
  required: string,
): boolean {
  return permissions.includes(required);
}

export function hasAnyPermission(
  permissions: readonly string[],
  required: readonly string[],
): boolean {
  if (required.length === 0) {
    return true;
  }

  return required.some((permission) => hasPermission(permissions, permission));
}

export function hasAllPermissions(
  permissions: readonly string[],
  required: readonly string[],
): boolean {
  if (required.length === 0) {
    return true;
  }

  return required.every((permission) => hasPermission(permissions, permission));
}
