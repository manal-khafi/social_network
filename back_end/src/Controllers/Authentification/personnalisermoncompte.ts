import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; 
    const { avatar_url, gender, account_name, date_of_birth, bio } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        avatar_url: avatar_url ?? user.avatar_url,
        gender: gender ?? user.gender,
        account_name: account_name ?? user.account_name,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : user.date_of_birth,
        bio: bio ?? user.bio,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
