export const getWorkspacePath = (
  workspaceId: string | undefined,
  path: string,
) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return workspaceId ? `/${workspaceId}${normalizedPath}` : normalizedPath;
};
