import { describe, expect, test } from "bun:test";
import { Block, Blockchain } from "../src/blockchain.js";
import Wallet from "../src/wallet.js";

describe("Blockchain", () => {
  test("should create a new blockchain with a genesis block", () => {
    const blockchain = new Blockchain();
    expect(blockchain.chain).toHaveLength(1);
    expect(blockchain.chain[0]).toBeInstanceOf(Block);
    expect(blockchain.chain[0].previousHash).toEqual("0");
  });

  test("should add a new block using legacy method", () => {
    const blockchain = new Blockchain();
    const newBlock = new Block(1, Date.now(), { message: "test-data" }, "0");
    blockchain.addBlock(newBlock);
    expect(blockchain.chain).toHaveLength(2);
    expect(blockchain.chain[1].data).toEqual({ message: "test-data" });
  });
  
  test("should validate a valid chain", () => {
    const blockchain = new Blockchain();
    const newBlock = new Block(1, Date.now(), { message: "test-data" }, "0");
    blockchain.addBlock(newBlock);
    expect(blockchain.isChainValid()).toBe(true);
  });
  
  test("should handle pending transactions and mining", () => {
    const blockchain = new Blockchain();
    const wallet1 = new Wallet();
    const wallet2 = new Wallet();
    
    // Create a transaction
    const tx = wallet1.createTransaction(wallet2.getAddress(), 50);
    blockchain.addTransaction(tx);
    expect(blockchain.pendingTransactions).toHaveLength(1);
    
    // Mine block with pending transactions
    blockchain.minePendingTransactions(wallet1.getAddress());
    
    // Check that transaction is in blockchain and new reward is pending
    expect(blockchain.chain).toHaveLength(2);
    expect(blockchain.pendingTransactions).toHaveLength(1);
    expect(blockchain.pendingTransactions[0].toAddress).toEqual(wallet1.getAddress());
    expect(blockchain.pendingTransactions[0].amount).toEqual(blockchain.miningReward);
  });
  
  test("should reject transactions with invalid fields", () => {
    const blockchain = new Blockchain();
    const invalidTx = { fromAddress: null, toAddress: null, amount: 0 };
    
    expect(() => {
      blockchain.addTransaction(invalidTx);
    }).toThrow();
  });
});
