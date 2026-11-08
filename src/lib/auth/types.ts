/**
 * Shared session types.
 *
 * Kept separate from the server-only session helpers so Client Components can
 * import the type without pulling server code into the browser bundle.
 */
export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: "doctor" | "staff";
};
