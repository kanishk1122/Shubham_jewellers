import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "@/models/User";

const JWT_SECRET: string = process.env.JWT_SECRET || "dev_jwt_secret";
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signToken = (user: { id: string; role: string }) =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

export const verifyToken = (token?: string) => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload;
  } catch {
    return null;
  }
};

// Optional helper: get user from Bearer header
export const getUserFromAuthHeader = async (authHeader?: string) => {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer (.+)$/i);
  if (!m) return null;
  const payload = verifyToken(m[1]);
  if (!payload?.id) return null;
  const user = await UserModel.findById(payload.id).lean();
  return user || null;
};
