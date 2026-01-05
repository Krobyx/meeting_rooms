export type Role = 'ADMIN' | 'USER';

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const str = atob(base64 + pad);
  try {
    return decodeURIComponent(
      str
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch {
    return str;
  }
}

export function getToken() {
  return localStorage.getItem('token') || '';
}

export function getRoleFromToken(): Role | null {
  const token = getToken();
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload?.role ?? null;
  } catch {
    return null;
  }
}

export function isAdmin() {
  return getRoleFromToken() === 'ADMIN';
}

export function isLoggedIn() {
  return !!getToken();
}
