import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'gh_superadmin';
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12h

function getSecret(): string {
  const s = process.env.SUPERADMIN_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SUPERADMIN_SECRET manquante ou trop courte (16+ char). Définissez-la dans .env.local');
  }
  return s;
}

function getPassword(): string {
  const p = process.env.SUPERADMIN_PASSWORD;
  if (!p || p.length < 6) {
    throw new Error('SUPERADMIN_PASSWORD manquante. Définissez-la dans .env.local');
  }
  return p;
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

/**
 * Vérifie le mot de passe en temps constant.
 */
export function checkPassword(input: string): boolean {
  try {
    const expected = Buffer.from(getPassword());
    const got = Buffer.from(input);
    if (expected.length !== got.length) return false;
    return timingSafeEqual(expected, got);
  } catch {
    return false;
  }
}

/**
 * Construit le payload signé : `expiresAt.hmac`
 */
export function createSessionToken(): string {
  const expiresAt = Date.now() + COOKIE_MAX_AGE * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

/**
 * Vérifie un token : signature HMAC + expiration.
 */
export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (expected.length !== signature.length) return false;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return false;
  const exp = Number(payload);
  if (Number.isNaN(exp) || exp < Date.now()) return false;
  return true;
}

export async function setSuperadminCookie() {
  const c = await cookies();
  c.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE
  });
}

export async function clearSuperadminCookie() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function isSuperadmin(): Promise<boolean> {
  const c = await cookies();
  const tok = c.get(COOKIE_NAME)?.value;
  return verifyToken(tok);
}

export async function requireSuperadmin(): Promise<void> {
  const ok = await isSuperadmin();
  if (!ok) redirect('/superadmin/login');
}
