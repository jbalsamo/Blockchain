import fs from 'fs/promises';
import path from 'path';
import { Blockchain } from './blockchain.js';

/**
 * Storage manager for blockchain persistence
 * Handles saving and loading blockchain data to/from disk
 */
class BlockchainStorage {
  /**
   * Create a new storage manager
   * @param {string} dataDir - Directory to store blockchain data
   */
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
    this.chainFile = path.join(dataDir, 'blockchain.json');
    this.pendingFile = path.join(dataDir, 'pending.json');
  }

  /**
   * Ensure the data directory exists
   * @returns {Promise<void>}
   */
  async initStorage() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      console.log(`Storage initialized at ${this.dataDir}`);
    } catch (error) {
      console.error(`Error initializing storage: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save blockchain data to disk
   * @param {Blockchain} blockchain - The blockchain to save
   * @returns {Promise<void>}
   */
  async saveBlockchain(blockchain) {
    try {
      await this.initStorage();

      // Save the blockchain chain
      const chainData = JSON.stringify(blockchain.chain, null, 2);
      await fs.writeFile(this.chainFile, chainData);

      // Save pending transactions
      const pendingData = JSON.stringify(blockchain.pendingTransactions, null, 2);
      await fs.writeFile(this.pendingFile, pendingData);

      console.log(`Blockchain saved to ${this.chainFile}`);
    } catch (error) {
      console.error(`Error saving blockchain: ${error.message}`);
      throw error;
    }
  }

  /**
   * Load blockchain data from disk
   * @returns {Promise<Blockchain>} The loaded blockchain
   */
  async loadBlockchain() {
    try {
      await this.initStorage();

      // Create a new blockchain
      const blockchain = new Blockchain();

      // Check if chain file exists
      try {
        const chainData = await fs.readFile(this.chainFile, 'utf8');
        blockchain.chain = JSON.parse(chainData);
        console.log(`Blockchain loaded from ${this.chainFile}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('No existing blockchain found, using genesis block');
        } else {
          console.error(`Error reading blockchain file: ${error.message}`);
          throw error;
        }
      }

      // Check if pending transactions file exists
      try {
        const pendingData = await fs.readFile(this.pendingFile, 'utf8');
        blockchain.pendingTransactions = JSON.parse(pendingData);
        console.log(`Pending transactions loaded from ${this.pendingFile}`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log('No pending transactions found');
        } else {
          console.error(`Error reading pending transactions: ${error.message}`);
        }
      }

      return blockchain;
    } catch (error) {
      console.error(`Error loading blockchain: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if the blockchain data exists on disk
   * @returns {Promise<boolean>} True if blockchain data exists
   */
  async blockchainExists() {
    try {
      await fs.access(this.chainFile);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Save wallet data to disk
   * @param {string} address - Wallet address
   * @param {Object} data - Wallet data including private key
   * @returns {Promise<void>}
   */
  async saveWallet(address, data) {
    try {
      await this.initStorage();
      
      const walletDir = path.join(this.dataDir, 'wallets');
      await fs.mkdir(walletDir, { recursive: true });
      
      const walletFile = path.join(walletDir, `${address}.json`);
      await fs.writeFile(walletFile, JSON.stringify(data, null, 2));
      
      console.log(`Wallet saved to ${walletFile}`);
    } catch (error) {
      console.error(`Error saving wallet: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load wallet data from disk
   * @param {string} address - Wallet address
   * @returns {Promise<Object>} The loaded wallet data
   */
  async loadWallet(address) {
    try {
      const walletFile = path.join(this.dataDir, 'wallets', `${address}.json`);
      const data = await fs.readFile(walletFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading wallet ${address}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * List all saved wallets
   * @returns {Promise<Array>} List of wallet addresses
   */
  async listWallets() {
    try {
      const walletDir = path.join(this.dataDir, 'wallets');
      
      try {
        await fs.access(walletDir);
      } catch (error) {
        if (error.code === 'ENOENT') {
          await fs.mkdir(walletDir, { recursive: true });
          return [];
        }
      }
      
      const files = await fs.readdir(walletDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error(`Error listing wallets: ${error.message}`);
      return [];
    }
  }
}

export default BlockchainStorage;
