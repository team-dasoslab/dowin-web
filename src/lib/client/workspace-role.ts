export function isWorkspaceAdminRole(workspace: { role?: string | null } | null | undefined): boolean {
  return workspace?.role === "ADMIN";
}

export function isWorkspaceMemberRole(workspace: { role?: string | null } | null | undefined): boolean {
  return workspace?.role === "MEMBER";
}
