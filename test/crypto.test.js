import { describe, expect, test } from "bun:test";
import { decryptData, encryptData, deriveKey, generateIV } from "../src/aescrypto.js";

describe("aescrypto", () => {
  test("should encrypt and decrypt data", async () => {
    const data = {
      patientId: "12345",
      diagnosis: "Common Cold",
      medication: "Aspirin",
    };
    const secretKey = "ThisIsAVerySecretKey";
    const encryptedData = await encryptData(JSON.stringify(data), secretKey);
    const decryptedData = await decryptData(encryptedData, secretKey);
    expect(JSON.parse(decryptedData)).toEqual(data);
  });
  
  test("should generate different IVs each time", () => {
    const iv1 = generateIV();
    const iv2 = generateIV();
    expect(iv1.toString('hex')).not.toEqual(iv2.toString('hex'));
    expect(iv1.length).toEqual(16); // AES block size is 16 bytes
  });
  
  test("should derive different keys from different passwords", async () => {
    const salt = "test-salt";
    const key1 = await deriveKey("password1", salt);
    const key2 = await deriveKey("password2", salt);
    expect(key1.toString('hex')).not.toEqual(key2.toString('hex'));
  });
  
  test("should derive the same key from the same password and salt", async () => {
    const salt = "consistent-salt";
    const password = "consistent-password";
    const key1 = await deriveKey(password, salt);
    const key2 = await deriveKey(password, salt);
    expect(key1.toString('hex')).toEqual(key2.toString('hex'));
  });
  
  test("should fail decryption with wrong password", async () => {
    const data = "sensitive data";
    const correctPassword = "correct-password";
    const wrongPassword = "wrong-password";
    
    const encrypted = await encryptData(data, correctPassword);
    
    await expect(async () => {
      await decryptData(encrypted, wrongPassword);
    }).rejects.toThrow();
  });
});
