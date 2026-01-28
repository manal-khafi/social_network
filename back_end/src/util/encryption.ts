import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const algorithm = 'aes-256-gcm';
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;

const getKey = (secretKey: string): Buffer => {
  return scryptSync(secretKey, 'salt', 32);
};

export const encrypt = (text: string): string => {
  const secretKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!secretKey) {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY is not set');
  }
  const key = getKey(secretKey);
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('hex');
};

export const decrypt = (encryptedText: string): string => {
  const secretKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!secretKey) {
    throw new Error('TWO_FACTOR_ENCRYPTION_KEY is not set');
  }
  const key = getKey(secretKey);
  const data = Buffer.from(encryptedText, 'hex');
  const iv = data.slice(0, ivLength);
  const tag = data.slice(ivLength, ivLength + tagLength);
  const encrypted = data.slice(ivLength + tagLength);
  const decipher = createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};
