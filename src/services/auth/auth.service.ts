import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/AppError.js";
import type { AuthUser } from "../../types/express.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me";
const SALT_ROUNDS = 10;

function signToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: { email: input.email, isDeleted: false },
    select: { id: true },
  });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash,
      role: input.role ?? "USER",
    },
    select: { id: true, email: true, name: true, role: true },
  });

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return { user, token: signToken(authUser) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: { email: input.email, isDeleted: false },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
    },
  });
  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid credentials", 401);
  }

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token: signToken(authUser),
  };
}
