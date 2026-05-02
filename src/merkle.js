/**
 * Merkle Tree module for Agent Audit Trail
 * Build and verify Merkle trees for batch action anchoring
 */

import { createHash } from 'crypto';

/**
 * SHA-256 hash function
 * @param {*} data - Data to hash (will be JSON.stringify'd)
 * @returns {string} Hex-encoded SHA-256 digest
 */
export function sha256(data) {
  return createHash('sha256').update(JSON.stringify(data), 'utf8').digest('hex');
}

/**
 * Build a Merkle tree from leaf hashes
 * @param {string[]} leaves - Array of hex-encoded leaf hashes
 * @returns {{ root: string|null, proofs: Object<string, Array<{side: string, hash: string}>> }}
 */
export function buildMerkleTree(leaves) {
  if (leaves.length === 0) return { root: null, proofs: {} };
  if (leaves.length === 1) {
    return { root: leaves[0], proofs: { [leaves[0]]: [] } };
  }

  const parentMap = new Map();
  let currentLevel = [...leaves];
  let levelIndex = 0;

  while (currentLevel.length > 1) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || currentLevel[i]; // pad odd with duplicate
      const parent = sha256(left + right);
      nextLevel.push(parent);
      parentMap.set(left, { parent, sibling: right, side: 'left', level: levelIndex });
      parentMap.set(right, { parent, sibling: left, side: 'right', level: levelIndex });
    }
    currentLevel = nextLevel;
    levelIndex++;
  }

  const root = currentLevel[0];

  // Build proof for each leaf
  const proofs = {};
  for (const leaf of leaves) {
    const proof = [];
    let node = leaf;
    while (parentMap.has(node)) {
      const info = parentMap.get(node);
      proof.push({ side: info.side, hash: info.sibling });
      node = info.parent;
    }
    proofs[leaf] = proof;
  }

  return { root, proofs };
}

/**
 * Verify a Merkle proof
 * @param {string} leafHash - The leaf hash to verify
 * @param {Array<{side: string, hash: string}>} proof - The Merkle proof path
 * @param {string} root - The expected Merkle root
 * @returns {boolean}
 */
export function verifyMerkleProof(leafHash, proof, root) {
  let currentHash = leafHash;
  for (const p of proof) {
    const combined = p.side === 'left'
      ? currentHash + p.hash
      : p.hash + currentHash;
    currentHash = sha256(combined);
  }
  return currentHash === root;
}
