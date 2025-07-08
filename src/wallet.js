import crypto from 'crypto';

/**
 * Implementation of a simple cryptocurrency wallet 
 * with public/private key pair generation for signing transactions
 */
class Wallet {
  /**
   * Create a new wallet
   * @param {string} [privateKeyString] - Optional existing private key
   */
  constructor(privateKeyString = null) {
    if (privateKeyString) {
      this.privateKey = crypto.createPrivateKey({
        key: privateKeyString,
        format: 'pem',
        type: 'pkcs8'
      });
    } else {
      // Generate a new key pair if no private key is provided
      this.generateKeyPair();
    }
    // Derive the public key from private key
    this.publicKey = crypto.createPublicKey(this.privateKey);
  }

  /**
   * Generate a new private/public key pair
   */
  generateKeyPair() {
    this.privateKey = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    }).privateKey;
  }

  /**
   * Get wallet address (public key in a shortened form)
   * @returns {string} Wallet address
   */
  getAddress() {
    // Create an address from the public key by hashing it
    // and taking the first 40 characters (similar to Ethereum)
    const publicKeyBuffer = Buffer.from(this.getPublicKey(), 'hex');
    return crypto.createHash('sha256')
      .update(publicKeyBuffer)
      .digest('hex')
      .substring(0, 40);
  }

  /**
   * Get the public key
   * @returns {string} Public key in PEM format
   */
  getPublicKey() {
    // Check if the public key is already a string in PEM format
    if (typeof this.publicKey === 'string') {
      return this.publicKey;
    }
    
    // If it's an object, try to export it
    try {
      return this.publicKey.export({
        type: 'spki',
        format: 'pem'
      });
    } catch (error) {
      // If export fails, return the string representation
      return this.publicKey.toString('pem');
    }
  }

  /**
   * Get the private key
   * @returns {string} Private key in PEM format
   */
  getPrivateKey() {
    // The private key is already in PEM format
    return this.privateKey;
  }

  /**
   * Sign a transaction with the wallet's private key
   * @param {Object} transaction - Transaction to sign
   * @returns {string} Digital signature of the transaction
   */
  signTransaction(transaction) {
    // Create a hash of the transaction
    const transactionHash = crypto.createHash('sha256')
      .update(JSON.stringify(transaction))
      .digest();
    
    // Sign the hash with the private key
    const signature = crypto.sign('sha256', transactionHash, {
      key: this.privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING
    });
    
    return signature.toString('hex');
  }

  /**
   * Verify a transaction signature
   * @param {Object} transaction - Original transaction data
   * @param {string} signature - Digital signature to verify
   * @param {string} publicKey - Public key in hex format
   * @returns {boolean} True if signature is valid
   */
  static verifyTransaction(transaction, signature, publicKey) {
    try {
      // Recreate the transaction hash
      const transactionHash = crypto.createHash('sha256')
        .update(JSON.stringify(transaction))
        .digest();
      
      // Convert hex signature back to Buffer
      const signatureBuffer = Buffer.from(signature, 'hex');
      
      // Convert hex public key to a PublicKey object
      const publicKeyDer = Buffer.from(publicKey, 'hex');
      const publicKeyObject = crypto.createPublicKey({
        key: publicKeyDer,
        format: 'der',
        type: 'spki'
      });
      
      // Verify the signature
      return crypto.verify(
        'sha256',
        transactionHash,
        {
          key: publicKeyObject,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING
        },
        signatureBuffer
      );
    } catch (error) {
      console.error('Verification error:', error.message);
      return false;
    }
  }

  /**
   * Create a transaction object
   * @param {string} toAddress - Recipient address
   * @param {number} amount - Amount to send
   * @returns {Object} Signed transaction object
   */
  createTransaction(toAddress, amount) {
    const transaction = {
      fromAddress: this.getAddress(),
      toAddress,
      amount,
      timestamp: Date.now()
    };
    
    transaction.signature = this.signTransaction({
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: transaction.amount,
      timestamp: transaction.timestamp
    });
    
    return transaction;
  }
}

export default Wallet;
