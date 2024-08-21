import { describe, expect, test } from "bun:test";
import { decryptData, encryptData } from "../src/aescrypto.js";

describe("aescrypto", () => {
  test("should encrypt and decrypt data", async () => {
    const data = {
      patientId: "12345",
      diagnosis: "Common Cold",
      medication: "Aspirin",
    };
    const secretKey = "ThisIsAVerySecretKey";
    const encryptedData = await encryptData(data, secretKey);
    const decryptedData = await decryptData(encryptedData, secretKey);
    expect(decryptedData).toEqual(data);
  });
});
