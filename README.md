# Agent Audit Trail

**Immutable AI Agent action logging on BSV blockchain.**

Record every AI agent action, hash it, build a Merkle tree, anchor to Bitcoin SV. Open source, free to use — pay only BSV transaction fees (~$0.01/anchor).

## Features

- **Action Capture** — Records tool calls, agent replies, session events automatically
- **Privacy First** — Auto-redacts API keys, tokens, passwords before hashing
- **Merkle Tree** — Batch actions into a single Merkle root for efficient verification
- **BSV Anchoring** — OP_RETURN on Bitcoin SV blockchain, immutable and auditable
- **Verifiable Receipts** — Each batch gets a receipt with Merkle proofs, independently verifiable

## Quick Start

```bash
npm install agent-audit-trail
```

```javascript
import { AuditLogger } from 'agent-audit-trail';

const logger = new AuditLogger({
  sanitize: true,
  bsvWallet: 'your-bsv-wallet-address'
});

// Record agent actions
logger.onAction({
  type: 'tool_call',
  tool: 'web_search',
  params: { query: 'BSV price' },
  sessionId: 'chat-001'
});

logger.onAction({
  type: 'tool_result',
  tool: 'web_search',
  result: { price: '$15.83' },
  sessionId: 'chat-001'
});

// Flush: build Merkle tree, generate receipt, create BSV anchor
const receipt = logger.flush();
console.log('Merkle Root:', receipt.merkleRoot);
console.log('Actions:', receipt.actionCount);
console.log('Status:', receipt.status);
```

## Architecture

```
┌─────────────┐    ┌──────────┐    ┌─────────────┐    ┌───────────┐    ┌──────────┐
│ Agent Actions │───▶│ Sanitize │───▶│ SHA-256 Hash │───▶│ Merkle Tree │───▶│ BSV Anchor │
│ (tool_call,   │    │ (redact  │    │ (param hash, │    │ (batch root │    │ (OP_RETURN │
│  agent_reply) │    │  secrets)│    │  result hash)│    │  + proofs)  │    │  on-chain) │
└─────────────┘    └──────────┘    └─────────────┘    └───────────┘    └──────────┘
                                                                            │
                                                                    ┌───────▼────────┐
                                                                    │ Verifiable      │
                                                                    │ Receipt         │
                                                                    │ (Merkle proofs) │
                                                                    └────────────────┘
```

## Verify a Receipt

```javascript
const result = logger.verify(receipt);
// { valid: true, details: [{ id: '...', valid: true }, ...] }
```

Anyone can verify: given an action's hash, its Merkle proof, and the root (from BSV blockchain), the action's inclusion is cryptographically proven.

## BSV Cost

Each anchor batch costs approximately **1/100 USD** in BSV transaction fees. With default settings (100 actions per batch), that's ~$0.0001 per action verified.

## OpenClaw Integration

For [OpenClaw](https://openclaw.ai) users, install as a plugin:

```bash
openclaw plugins install agent-audit-trail
```

Actions are captured automatically via OpenClaw hooks (`before_tool_call`, `after_tool_call`, `agent_end`, `session_start`, `session_end`).

## API Reference

### `AuditLogger`

| Method | Description |
|--------|-------------|
| `onAction(event)` | Record an agent action |
| `flush()` | Batch-anchor all buffered actions |
| `verify(receipt)` | Verify a receipt's Merkle proofs |
| `status()` | Get current buffer and config status |
| `destroy()` | Stop timer and final flush |

### Standalone Modules

| Module | Exports |
|--------|---------|
| `merkle.js` | `sha256()`, `buildMerkleTree()`, `verifyMerkleProof()` |
| `sanitizer.js` | `sanitize()`, `DEFAULT_SANITIZE_RULES` |
| `bsv-anchor.js` | `buildBSVOpReturnTx()` |
| `receipt.js` | `generateReceipt()` |

## Why Open Source?

The value of on-chain audit trails lies in network effects. The more agents use this, the stronger the BSV ecosystem becomes, and the more indispensable the audit infrastructure gets. Free software, paid blockchain — that's the BSV way.

## Roadmap

- **v0.1** — MVP: Merkle tree, sanitization, BSV OP_RETURN builder, OpenClaw plugin
- **v0.2** — REST API server, real BSV transaction signing, multi-agent support
- **v1.0** — Multi-tenant SaaS, dashboard, compliance reports, enterprise features

## License

MIT — use it, fork it, build on it. Just anchor to BSV.
