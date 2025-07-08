import crypto from 'crypto';
import { MerkleTree } from './merkletree.js';

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
    this.nonce = 0;
    this.merkleRoot = this.calculateMerkleRoot();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.data) +
          this.nonce
      )
      .digest("hex");
  }

  calculateMerkleRoot() {
    // If no transactions or not in expected format, return null
    if (!this.data) return null;
    
    let transactions = [];
    
    // Extract transactions based on block data structure
    if (Array.isArray(this.data)) {
      // Direct array of transactions
      transactions = this.data;
    } else if (this.data.transactions && Array.isArray(this.data.transactions)) {
      // Object with transactions property
      transactions = this.data.transactions;
    } else {
      return null;
    }
    
    // If no transactions, return null
    if (transactions.length === 0) return null;
    
    // Create transaction hashes for Merkle tree
    const leaves = transactions.map(tx => {
      if (typeof tx === 'string') return tx;
      return crypto
        .createHash('sha256')
        .update(JSON.stringify(tx))
        .digest('hex');
    });
    
    // Create and return Merkle root
    const merkleTree = new MerkleTree(leaves);
    return merkleTree.getRoot();
  }

  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    // Update Merkle root after mining
    this.merkleRoot = this.calculateMerkleRoot();
    console.log(`Block mined: ${this.hash}`);
  }
  
  // Verify that a transaction is included in this block using Merkle proof
  verifyTransaction(transaction) {
    // If no Merkle root, we can't verify
    if (!this.merkleRoot) return false;
    
    // Extract transactions based on block data structure
    let transactions = [];
    if (Array.isArray(this.data)) {
      transactions = this.data;
    } else if (this.data.transactions && Array.isArray(this.data.transactions)) {
      transactions = this.data.transactions;
    } else {
      return false;
    }
    
    // Find the transaction in the block
    const txIndex = transactions.findIndex(tx => {
      if (typeof transaction === 'string') {
        return JSON.stringify(tx) === transaction;
      }
      // Compare transaction signatures or IDs if available
      if (tx.signature && transaction.signature) {
        return tx.signature === transaction.signature;
      }
      // Fallback to full comparison
      return JSON.stringify(tx) === JSON.stringify(transaction);
    });
    
    if (txIndex === -1) return false; // Transaction not found in this block
    
    // Create Merkle tree from transactions
    const leaves = transactions.map(tx => {
      if (typeof tx === 'string') return tx;
      return crypto
        .createHash('sha256')
        .update(JSON.stringify(tx))
        .digest('hex');
    });
    
    const merkleTree = new MerkleTree(leaves);
    const proof = merkleTree.getProof(txIndex);
    
    // Verify the proof against the block's Merkle root
    // Use the static method MerkleTree.verifyProof
    return MerkleTree.verifyProof(proof, this.merkleRoot);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.pendingTransactions = [];
    this.miningReward = 100;
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), { transactions: [], note: "Genesis block" }, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  minePendingTransactions(miningRewardAddress) {
    // Create a new block with all pending transactions and mine it
    const block = new Block(
      this.chain.length,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    
    block.mineBlock(this.difficulty);

    console.log('Block successfully mined!');
    this.chain.push(block);

    // Reset the pending transactions and add a reward transaction
    this.pendingTransactions = [
      {
        fromAddress: null,
        toAddress: miningRewardAddress,
        amount: this.miningReward
      }
    ];
  }

  addTransaction(transaction) {
    // Validate transaction fields
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (transaction.amount <= 0) {
      throw new Error('Transaction amount should be higher than 0');
    }

    // Check if the sender has sufficient balance (in a real implementation)
    // if (this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
    //   throw new Error('Not enough balance');
    // }

    this.pendingTransactions.push(transaction);
    return this.pendingTransactions.length - 1;
  }

  getBalanceOfAddress(address) {
    let balance = 0;

    for (const block of this.chain) {
      // Handle different formats of block data
      let transactions = [];
      
      if (Array.isArray(block.data)) {
        // Direct array of transactions
        transactions = block.data;
      } else if (block.data && block.data.transactions && Array.isArray(block.data.transactions)) {
        // Object with transactions property
        transactions = block.data.transactions;
      } else {
        // Skip blocks with no transaction data
        continue;
      }
      
      // Process each transaction in the block
      for (const trans of transactions) {
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  // Legacy method for backward compatibility
  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

export { Block, Blockchain };
