// Minimal access control utility to fix build error
export const PERMISSIONS = {};
export function hasPermission(role: string, permission: string) {
  // Always allow for now
  return true;
}
export function getRoleDisplayName(role: string) {
  return role;
}
export function getRoleBadgeColor(role: string) {
  return 'gray';
}
