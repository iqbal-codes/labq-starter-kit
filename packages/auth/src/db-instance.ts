// Re-export the shared db instance from @admin-template/db. Centralizing the
// instance here avoids creating a second pg connection pool inside the auth
// package, and gives every auth-side module a single import path.
export { db } from "@admin-template/db";
