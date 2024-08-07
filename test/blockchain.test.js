import { describe, expect, test } from "bun:test";
import { Block, Blockchain } from "../src/blockchain.js";

describe("Blockchain", () => {
  test("should create a new blockchain", () => {
    const blockchain = new Blockchain();
    expect(blockchain.chain).toEqual([expect.any(Block)]);
  });

  test("should create a data block", () => {
    const blockchain = new Blockchain();
    const newBlock = new Block(1, Date.now(), "test-data", 0);
    blockchain.addBlock(newBlock);
    expect(blockchain.chain[1]).toEqual(newBlock);
  });
});
