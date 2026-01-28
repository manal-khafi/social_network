import { Request, Response } from 'express';
import prisma from '../../config/prismaClient';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { encrypt, decrypt } from '../../util/encryption';

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
