"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = void 0;
const crypto_1 = require("crypto");
const algorithm = 'aes-256-gcm';
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const getKey = (secretKey) => {
    return (0, crypto_1.scryptSync)(secretKey, 'salt', 32);
};
const encrypt = (text) => {
    const secretKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;
    if (!secretKey) {
        throw new Error('TWO_FACTOR_ENCRYPTION_KEY is not set');
    }
    const key = getKey(secretKey);
    const iv = (0, crypto_1.randomBytes)(ivLength);
    const cipher = (0, crypto_1.createCipheriv)(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('hex');
};
exports.encrypt = encrypt;
const decrypt = (encryptedText) => {
    const secretKey = process.env.TWO_FACTOR_ENCRYPTION_KEY;
    if (!secretKey) {
        throw new Error('TWO_FACTOR_ENCRYPTION_KEY is not set');
    }
    const key = getKey(secretKey);
    const data = Buffer.from(encryptedText, 'hex');
    const iv = data.slice(0, ivLength);
    const tag = data.slice(ivLength, ivLength + tagLength);
    const encrypted = data.slice(ivLength + tagLength);
    const decipher = (0, crypto_1.createDecipheriv)(algorithm, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
};
exports.decrypt = decrypt;
