import { Request, Response } from 'express';
import prisma from '../../config/prismaClient';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { encrypt, decrypt } from '../../util/encryption';
import { verifyTwoFactorLoginToken } from '../../util/jwt';
import { issueLoginSession, sessionUserInclude } from '../../services/sessionService';

export const setupTwoFactorAuth = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const secret = speakeasy.generateSecret({ length: 20, name: `ANMOUGAR:${user.email}` });
    const encryptedSecret = encrypt(secret.base32);

    await prisma.user.update({
      where: { id: userId },
      data: { two_factor_temp_secret: encryptedSecret },
    });

    qrcode.toDataURL(secret.otpauth_url!, (err, data_url) => {
      if (err) {
        return res.status(500).json({ message: 'Error generating QR code' });
      }
      res.json({
        qrCodeDataUrl: data_url,
        manualKey: secret.base32,
      });
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const enableTwoFactorAuth = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { code } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Invalid code format. Must be 6 digits.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.two_factor_temp_secret) {
      return res.status(409).json({ message: '2FA setup has not been initiated.' });
    }

    const decryptedSecret = decrypt(user.two_factor_temp_secret);

    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(403).json({ message: 'Invalid TOTP code.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        two_factor_secret: user.two_factor_temp_secret,
        two_factor_enabled: true,
        two_factor_confirmed_at: new Date(),
        two_factor_temp_secret: null,
      },
    });

    res.json({ success: true, twoFactorEnabled: true });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const disableTwoFactorAuth = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { code } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Invalid code format. Must be 6 digits.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.two_factor_secret || !user.two_factor_enabled) {
      return res.status(400).json({ message: '2FA is not enabled.' });
    }

    const decryptedSecret = decrypt(user.two_factor_secret);

    const verified = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(403).json({ message: 'Invalid TOTP code.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_confirmed_at: null,
        two_factor_temp_secret: null,
      },
    });

    res.json({ success: true, twoFactorEnabled: false });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Second step of sign-in for accounts with 2FA enabled. Takes the challenge
 * token returned by /authentication/login (proof the password was correct)
 * plus the current TOTP code, and only then issues the real session.
 */
export const verifyTwoFactorLogin = async (req: Request, res: Response) => {
  const { twoFactorToken, code } = req.body ?? {};

  if (typeof twoFactorToken !== 'string' || !twoFactorToken) {
    return res.status(400).json({ success: false, message: 'twoFactorToken is required' });
  }
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'Invalid code format. Must be 6 digits.' });
  }

  let challenge: { id: string; token_version?: number; reactivate?: boolean };
  try {
    challenge = verifyTwoFactorLoginToken(twoFactorToken);
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Two-factor session expired. Please sign in again.',
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: challenge.id },
      include: sessionUserInclude,
    });

    if (
      !user ||
      (!user.is_active && !challenge.reactivate) ||
      user.token_version !== challenge.token_version ||
      !user.two_factor_enabled ||
      !user.two_factor_secret
    ) {
      return res.status(401).json({
        success: false,
        message: 'Two-factor session expired. Please sign in again.',
      });
    }

    const verified = speakeasy.totp.verify({
      secret: decrypt(user.two_factor_secret),
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(403).json({ success: false, message: 'Invalid TOTP code.' });
    }

    // Deactivated account the user chose to reactivate at sign-in.
    if (!user.is_active) {
      await prisma.user.update({ where: { id: user.id }, data: { is_active: true } });
    }

    const session = await issueLoginSession(res, user);

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      ...session,
    });
  } catch (error) {
    console.error('2FA login verification error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getTwoFactorAuthStatus = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ twoFactorEnabled: user.two_factor_enabled });
  } catch (error) {
    console.error('2FA status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
