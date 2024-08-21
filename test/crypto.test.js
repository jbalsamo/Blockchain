import { describe, expect, test } from "bun:test";
import { decryptData, encryptData } from "../src/aescrypto.js";

describe("aescrypto", () => {
  test("should encrypt and decrypt data", () => {
    const data = {
      patientId: "12345",
      diagnosis: "Common Cold",
      medication: "Aspirin",
    };
    const secretKey = "ThisIsAVerySecretKey";
    const encryptedData = encryptData(data, secretKey);
    const decryptedData = decryptData(encryptedData, secretKey);
    expect(decryptedData).toEqual(data);
  });
});
