/**
 * Standalone usage example - no OpenClaw dependency
 */
import { AuditLogger } from '../src/index.js';

async function main() {
  // Create logger with custom options
  const logger = new AuditLogger({
    sanitize: true,
    bufferSize: 5,           // flush after 5 actions (demo)
    bsvWallet: '1HQTm7L2KXTmNTecedhFRnQqP98yU1GAD7',
    anchorEnabled: true,
    dataDir: './audit-data'
  });

  console.log('=== Agent Audit Trail - Standalone Demo ===\n');

  // Simulate agent actions
  logger.onAction({
    type: 'tool_call',
    tool: 'web_search',
    params: { query: 'BSV blockchain price', api_key: 'sk-secret-key-12345' },
    sessionId: 'demo-session'
  });

  logger.onAction({
    type: 'tool_result',
    tool: 'web_search',
    result: { price: '$15.83', change: '+2.1%' },
    sessionId: 'demo-session'
  });

  logger.onAction({
    type: 'tool_call',
    tool: 'file_read',
    params: { path: '/etc/config.json', password: 'admin123' },
    sessionId: 'demo-session'
  });

  logger.onAction({
    type: 'agent_reply',
    result: { content: 'Based on my search, BSV is trading at $15.83' },
    sessionId: 'demo-session'
  });

  logger.onAction({
    type: 'session_end',
    sessionId: 'demo-session'
  });

  // Manual flush (auto-flush would trigger at bufferSize)
  const receipt = logger.flush();

  if (receipt) {
    console.log('--- Receipt ---');
    console.log('Anchor ID:', receipt.anchorId);
    console.log('Merkle Root:', receipt.merkleRoot);
    console.log('Action Count:', receipt.actionCount);
    console.log('Status:', receipt.status);
    console.log('\nActions:');
    receipt.actions.forEach(a => {
      console.log(`  [${a.type}] ${a.tool || 'N/A'} - proof: ${a.proof.length} steps`);
    });

    // Verify the receipt
    const verification = logger.verify(receipt);
    console.log('\n--- Verification ---');
    console.log('All valid:', verification.valid);
    verification.details.forEach(d => {
      console.log(`  ${d.id.substring(0, 8)}... ${d.valid ? '✓' : '✗'}`);
    });
  }

  // Check status
  console.log('\n--- Status ---');
  console.log(logger.status());

  // Cleanup
  logger.destroy();
}

main().catch(console.error);
