import { describe, expect, test } from "bun:test";
import Wallet from "../src/wallet.js";

describe("Wallet", () => {
  test("should create a new wallet with key pair", () => {
    const wallet = new Wallet();
    
    // Check that keys were generated
    expect(wallet.getPrivateKey()).toBeDefined();
    expect(wallet.getPublicKey()).toBeDefined();
    
    // Check that address is derived from public key and has correct format
    const address = wallet.getAddress();
    expect(address).toBeDefined();
    expect(address.length).toEqual(40); // 40 hex characters
  });
  
  test("should create a signed transaction", () => {
    const wallet = new Wallet();
    const toAddress = "recipient-address-123456789";
    const amount = 50;
    
    const transaction = wallet.createTransaction(toAddress, amount);
    
    // Check transaction properties
    expect(transaction.fromAddress).toEqual(wallet.getAddress());
    expect(transaction.toAddress).toEqual(toAddress);
    expect(transaction.amount).toEqual(amount);
    expect(transaction.signature).toBeDefined();
    expect(transaction.timestamp).toBeDefined();
  });
  
  test("should verify a valid transaction signature", () => {
    const wallet = new Wallet();
    const recipient = "recipient-address";
    const amount = 100;
    
    // Create transaction without signature
    const transactionData = {
      fromAddress: wallet.getAddress(),
      toAddress: recipient,
      amount: amount,
      timestamp: Date.now()
    };
    
    // Sign the transaction data
    const signature = wallet.signTransaction(transactionData);
    
    // Verify using the wallet's public key
    const isValid = Wallet.verifyTransaction(
      transactionData,
      signature,
      wallet.getPublicKey()
    );
    
    expect(isValid).toBe(true);
  });
  
  test("should reject invalid transaction signatures", () => {
    const wallet1 = new Wallet();
    const wallet2 = new Wallet();
    const recipient = "recipient-address";
    const amount = 100;
    
    // Create transaction data
    const transactionData = {
      fromAddress: wallet1.getAddress(),
      toAddress: recipient,
      amount: amount,
      timestamp: Date.now()
    };
    
    // Sign with wallet1
    const signature = wallet1.signTransaction(transactionData);
    
    // Verify using wallet2's public key (should fail)
    const isValid = Wallet.verifyTransaction(
      transactionData,
      signature,
      wallet2.getPublicKey()
    );
    
    expect(isValid).toBe(false);
  });
  
  test("should allow recreating a wallet from private key", () => {
    // Create a wallet
    const originalWallet = new Wallet();
    const originalAddress = originalWallet.getAddress();
    const privateKey = originalWallet.getPrivateKey();
    
    // Create a new wallet using the same private key
    const restoredWallet = new Wallet(privateKey);
    const restoredAddress = restoredWallet.getAddress();
    
    // Addresses should match
    expect(restoredAddress).toEqual(originalAddress);
  });
});
