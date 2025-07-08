import crypto from 'crypto';

/**
 * Implementation of a Merkle Tree for efficient transaction verification
 * A Merkle tree allows validating the integrity of transaction data in a block
 * with logarithmic efficiency (O(log n) instead of O(n))
 */
class MerkleTree {
  /**
   * Create a new Merkle tree from an array of transactions or data items
   * @param {Array} leaves - Array of transactions or data items to include in the tree
   */
  constructor(leaves) {
    // If we have an odd number of leaves, duplicate the last one
    this.leaves = leaves.length % 2 !== 0 && leaves.length > 1 
      ? [...leaves, leaves[leaves.length - 1]] 
      : [...leaves];
    
    // Calculate the tree height based on the number of leaves
    this.height = Math.ceil(Math.log2(Math.max(1, this.leaves.length)));
    
    // Build the Merkle tree
    this.root = this.buildTree();
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {string} - Hex-encoded hash
   */
  static hash(data) {
    return crypto.createHash('sha256')
      .update(typeof data === 'string' ? data : JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Convert transactions to leaf hashes
   * @returns {Array} - Array of leaf node hashes
   */
  getLeafHashes() {
    return this.leaves.map(leaf => MerkleTree.hash(leaf));
  }

  /**
   * Build the Merkle tree and return the root
   * @returns {string} - Root hash of the Merkle tree
   */
  buildTree() {
    if (this.leaves.length === 0) return MerkleTree.hash('');
    if (this.leaves.length === 1) return MerkleTree.hash(this.leaves[0]);
    
    let level = this.getLeafHashes();
    this.levels = [level]; // Store all levels for proof generation
    
    // Continue combining pairs of nodes until we reach the root
    while (level.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < level.length; i += 2) {
        // If we have an odd number of elements, duplicate the last one
        const rightIndex = i + 1 < level.length ? i + 1 : i;
        const combinedHash = MerkleTree.hash(level[i] + level[rightIndex]);
        nextLevel.push(combinedHash);
      }
      
      level = nextLevel;
      this.levels.push(level);
    }
    
    return level[0]; // The root hash
  }

  /**
   * Get the Merkle root hash
   * @returns {string} - Root hash
   */
  getRoot() {
    return this.root;
  }

  /**
   * Generate a proof that a leaf node is part of the tree
   * @param {number} index - Index of the leaf in the original array
   * @returns {Object} - Proof containing path and leaf index
   */
  getProof(index) {
    if (index < 0 || index >= this.leaves.length) {
      throw new Error('Index out of range');
    }
    
    const proof = [];
    let idx = index;
    
    // For each level except the root
    for (let i = 0; i < this.levels.length - 1; i++) {
      const level = this.levels[i];
      const isRight = idx % 2 === 0;
      const siblingIndex = isRight ? idx + 1 : idx - 1;
      
      // If we're at the edge of an odd-length level
      if (siblingIndex < level.length) {
        proof.push({
          position: isRight ? 'right' : 'left',
          data: level[siblingIndex]
        });
      }
      
      // Move to the parent index in the next level
      idx = Math.floor(idx / 2);
    }
    
    return {
      leaf: MerkleTree.hash(this.leaves[index]),
      proof: proof,
      index: index
    };
  }

  /**
   * Verify a Merkle proof
   * @param {Object} proof - The proof to verify
   * @param {string} root - The Merkle root to verify against
   * @returns {boolean} - True if the proof is valid
   */
  static verifyProof(proof, root) {
    let hash = proof.leaf;
    
    for (const node of proof.proof) {
      if (node.position === 'left') {
        hash = MerkleTree.hash(node.data + hash);
      } else {
        hash = MerkleTree.hash(hash + node.data);
      }
    }
    
    return hash === root;
  }
}

export { MerkleTree };
