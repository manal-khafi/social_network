import { Request, Response } from 'express';
import prisma from '../../config/prismaClient'

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const ViewerId = req.user?.id; //JWT middleware 
        const { username } = req.params;
        
        const userProfile = await prisma.user.findUnique({
            where: { username },
        });
    
        if (!userProfile || !userProfile.is_active) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (ViewerId === userProfile.id) {
            return res.json({
                username: userProfile.username,
                display_name: userProfile.display_name,
                bio: userProfile.bio,
                avatar_url: userProfile.avatar_url,
                email: userProfile.email,
                is_verified: userProfile.is_verified,
                created_at: userProfile.created_at,
            });
        }

        const checkIfFollower = async (viewerId: string, profileId: string) => {
            if (!viewerId) return false; //not logged in
            const follow = await prisma.follow.findFirst({
            where: {
                follower_id: viewerId,
                    followed_id: profileId,
                },
            });
            return !!follow; // true if follow exists, else false
        }
 
        //private profile check
        if (userProfile.is_private) {
            const isfollower = await checkIfFollower(ViewerId!, userProfile.id);
            if (!isfollower) {
                return res.status(403).json({ message: 'This profile is private' });
            }
        }

        //public res
        return res.json({
            username: userProfile.username,
            display_name: userProfile.display_name,
            bio: userProfile.bio,
            avatar_url: userProfile.avatar_url,
            is_verified: userProfile.is_verified,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCurrentUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                display_name: user.display_name,
                bio: user.bio,
                avatar_url: user.avatar_url,
            }
        });

    } catch (error) {
        console.error('Error fetching current user profile:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

