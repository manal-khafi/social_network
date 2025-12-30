import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { generateAccessToken } from "../utils/authJwt"; 

const prisma = new PrismaClient();

export const registerUser = async (userData: any) => {
  // 1. Check for duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new Error("Email is already in use!");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const newUser = await prisma.user.create({
    data: {
      username: userData.username,
      email: userData.email,
      password_hash: hashedPassword,
      isPrivate: userData.isPrivate || false, 
      adresse: userData.adresse,
    },
  });

  // 4. Generate Token using your authJwt.ts utility
  const token = generateAccessToken({ id: newUser.id });

  return { user: newUser, token };
};
