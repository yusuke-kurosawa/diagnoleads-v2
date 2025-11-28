export { auth, type Session, type User } from './config';
export { authClient } from './client';
export { getUserFromRequest, getUserMembership, verifyOrganizationAccess } from './middleware';
export {
  defineAbilitiesFor,
  canPerformAction,
  isGroupRole,
  canAccessChildOrganizations,
  canModifyHierarchy,
  getAccessScope,
  type AppAbility,
  type Action,
  type Subject,
  type HierarchyContext,
} from './permissions';
