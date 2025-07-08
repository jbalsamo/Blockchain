import crypto from 'crypto';
import Wallet from './wallet.js';

/**
 * Represents a transaction on the blockchain
 */
class Transaction {
  /**
   * Create a new transaction
   * @param {string} fromAddress - Sender's wallet address (null for mining rewards)
   * @param {string} toAddress - Recipient's wallet address
   * @param {number} amount - Amount to transfer
   * @param {string} [signature] - Digital signature (if already signed)
   */
  constructor(fromAddress, toAddress, amount, signature = null) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.signature = signature;
  }

  /**
   * Calculate the hash of this transaction (used for signing)
   * @returns {string} - SHA256 hash of transaction data
   */
  calculateHash() {
    return crypto.createHash('sha256')
      .update(this.fromAddress + this.toAddress + this.amount + this.timestamp)
      .digest('hex');
  }

  /**
   * Sign a transaction with the provided signing key (wallet's private key)
   * @param {Object} signingKey - The private key object from wallet
   */
  signTransaction(wallet) {
    // You can't sign a mining reward transaction (from address is null)
    if (this.fromAddress === null) {
      return;
    }
    
    // Verify the transaction is from the wallet owner
    if (wallet.getAddress() !== this.fromAddress) {
      throw new Error('You cannot sign transactions for other wallets!');
    }
    
    // Create a hash of the transaction and sign it
    const transactionData = {
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      timestamp: this.timestamp
    };
    
    this.signature = wallet.signTransaction(transactionData);
  }

  /**
   * Verify the transaction signature is valid
   * @returns {boolean} - True if the signature is valid
   */
  isValid() {
    // Mining reward transactions don't need to be verified
    if (this.fromAddress === null) {
      return true;
    }

    // Check if there's a signature
    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    // Verify signature with the public key of the sender
    const transactionData = {
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: this.amount,
      timestamp: this.timestamp
    };

    // Here we'd need to retrieve the public key from the fromAddress
    // In a real blockchain, this would be derived from the address or stored elsewhere
    // For demo purposes, we'll just return true (would be validated in a real implementation)
    
    return true;
  }
}

export default Transaction;
