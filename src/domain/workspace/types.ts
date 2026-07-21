export const workspaceRoleValues = ["ADMIN", "MEMBER"] as const;
export type WorkspaceRole = (typeof workspaceRoleValues)[number];
