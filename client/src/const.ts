export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the path to the login page.
 * With local email/password auth, this is simply "/login".
 */
export const getLoginUrl = (): string => "/login";
