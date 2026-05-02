/**
 * Merkle Tree Tests
 */
import { sha256, buildMerkleTree, verifyMerkleProof } from '../src/merkle.js';

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log('  PASS:', msg); }
  else { failed++; console.log('  FAIL:', msg); }
}

console.log('=== Merkle Tree Tests ===');

// SHA-256
console.log('\nSHA-256:');
const h1 = sha256('hello');
assert(h1.length === 64, 'sha256 returns 64-char hex');
assert(sha256('hello') === sha256('hello'), 'sha256 is deterministic');

// Single leaf
console.log('\nSingle leaf:');
const single = buildMerkleTree(['abc']);
assert(single.root === 'abc', 'single leaf root = leaf');
assert(single.proofs['abc'].length === 0, 'single leaf has empty proof');

// Two leaves
console.log('\nTwo leaves:');
const two = buildMerkleTree(['aaa', 'bbb']);
assert(two.root === sha256('aaa' + 'bbb'), 'two leaves: root = sha256(left+right)');
assert(two.proofs['aaa'].length === 1, 'two leaves: 1-step proof');

// Verify proof
console.log('\nVerify proof:');
const proof = two.proofs['aaa'];
assert(verifyMerkleProof('aaa', proof, two.root), 'valid proof verifies');
assert(!verifyMerkleProof('xxx', proof, two.root), 'invalid leaf fails');
assert(!verifyMerkleProof('aaa', proof, 'badroot'), 'bad root fails');

// Three leaves (odd padding)
console.log('\nThree leaves (odd):');
const three = buildMerkleTree(['a', 'b', 'c']);
assert(three.root !== null, 'three leaves produces root');
assert(verifyMerkleProof('a', three.proofs['a'], three.root), 'leaf a verifies');
assert(verifyMerkleProof('b', three.proofs['b'], three.root), 'leaf b verifies');
assert(verifyMerkleProof('c', three.proofs['c'], three.root), 'leaf c verifies');

console.log('\n' + '='.repeat(30));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
