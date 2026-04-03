import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "skillcache-development-secret";

const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function verifySessionToken(token?: string | null) {
  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token, secretKey);
    return true;
  } catch {
    return false;
  }
}
