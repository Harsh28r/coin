/**
 * Default admin secret for dashboard tools (newsletter blast, custom digest).
 * Override with REACT_APP_ADMIN_SECRET_DEFAULT in .env — must match backend ADMIN_SECRET.
 */
export const DEFAULT_ADMIN_SECRET =
  (typeof process !== 'undefined' && process.env.REACT_APP_ADMIN_SECRET_DEFAULT) ||
  '9a098c3d57c14746a1fe7ac261f5f7aa';
