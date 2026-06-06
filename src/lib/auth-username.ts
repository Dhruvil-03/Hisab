// Supabase needs an email-shaped id; users only type a username.
// Not a real Gmail inbox — no mail is sent if "Confirm email" is off in Supabase.
const USERNAME_DOMAIN =
  process.env.NEXT_PUBLIC_AUTH_EMAIL_DOMAIN ?? "gmail.com";

/** Login id: letters, numbers, underscore; 3–24 chars */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 24) return "Username must be at most 24 characters";
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Use only letters, numbers, and underscore (no spaces)";
  }
  return null;
}

/** Supabase Auth requires an email; users only see username in the app */
export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${USERNAME_DOMAIN}`;
}

export function friendlyAuthError(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Wrong username or password";
  }
  if (message.includes("User already registered")) {
    return "This username is already taken";
  }
  if (message.includes("Email not confirmed")) {
    return "Account not active. Turn off email confirmation in Supabase Auth settings.";
  }
  return message;
}
