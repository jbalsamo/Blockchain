import crypto from 'crypto';

const algorithm = "aes-256-cbc";
const keysize = 32; // 256 bits key for AES-256

/**
 * Generates a random initialization vector
 * @returns {Buffer} A 16-byte Buffer containing random data for IV
 */
const generateIV = () => {
  return crypto.randomBytes(16);
};

/**
 * Derives a key from a password and salt using scrypt
 * @param {string} password - Password to derive key from
 * @param {string} salt - Salt to use in key derivation
 * @returns {Promise<Buffer>} The derived key
 */
const deriveKey = async (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keysize, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
};

/**
 * Encrypts data using AES-256-CBC with a derived key
 * @param {string} data - Data to encrypt
 * @param {string} password - Password to derive key from
 * @param {string} salt - Salt to use in key derivation (should be stored with the encrypted data)
 * @returns {Promise<Object>} Object containing encrypted data, iv, and salt
 */
const encryptData = async (data, password, salt = crypto.randomBytes(16).toString('hex')) => {
  try {
    const key = await deriveKey(password, salt);
    const iv = generateIV();
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      salt
    };
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw error;
  }
};

/**
 * Decrypts data using AES-256-CBC with a derived key
 * @param {Object} encryptedData - Object containing encrypted data, iv, and salt
 * @param {string} encryptedData.encrypted - Encrypted data in hex format
 * @param {string} encryptedData.iv - Initialization vector in hex format
 * @param {string} encryptedData.salt - Salt used for key derivation
 * @param {string} password - Password to derive key from
 * @returns {Promise<string>} Decrypted data
 */
const decryptData = async (encryptedData, password) => {
  try {
    const { encrypted, iv, salt } = encryptedData;
    
    const key = await deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(
      algorithm, 
      key, 
      Buffer.from(iv, 'hex')
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw error;
  }
};

export { encryptData, decryptData, deriveKey, generateIV };

