# Agent Audit Trail - AI Agent动作日志链上存证

**在BSV区块链上记录AI Agent的每一个动作，不可篡改，可验证。**

记录每个AI Agent动作，哈希摘要，构建Merkle树，锚定到BSV区块链。开源免费——只需支付BSV交易费（约$0.01/次锚定）。

## 核心特性

- **动作采集** — 自动记录工具调用、Agent回复、会话事件
- **隐私优先** — 自动脱敏API key、token、密码等敏感信息
- **Merkle树** — 批量动作归并为单个Merkle根，高效验证
- **BSV锚定** — OP_RETURN写入BSV区块链，不可篡改
- **可验证收据** — 每批次生成含Merkle proof的收据，独立可验证

## 快速开始

```bash
npm install agent-audit-trail
```

```javascript
import { AuditLogger } from 'agent-audit-trail';

const logger = new AuditLogger({ sanitize: true });
logger.onAction({ type: 'tool_call', tool: 'web_search', params: { query: 'BSV价格' } });
const receipt = logger.flush();
console.log('Merkle Root:', receipt.merkleRoot);
```

## 为什么开源？

**链上存证的价值在于网络效应。用的人越多，BSV生态越强，审计基础设施越不可替代。**

软件免费，链上收费——这就是BSV的生意模式本质。每个用户的Agent每10分钟或100条动作就产生一笔BSV交易，全球千个Agent就是每天上万笔。

## 架构

```
Agent动作 → 脱敏 → SHA-256哈希 → Merkle树 → BSV OP_RETURN → 可验证收据
```

## 路线图

- **v0.1** — MVP：Merkle树、脱敏、BSV交易构建、OpenClaw插件
- **v0.2** — REST API、真实BSV签名、多Agent支持
- **v1.0** — 多租户SaaS、仪表盘、合规报告、企业功能

## 商业模式

| 层级 | 说明 | 价格 |
|------|------|------|
| 开源免费 | 自部署，自付BSV | $0（软件）+ BSV交易费 |
| 托管服务（未来） | 铭链科技SaaS API | 按锚定次数收费 |
| 企业版（未来） | 私有部署+定制审计+合规报告 | 订阅制 |

## 许可证

MIT — 随便用，随便改，随便fork。只要锚定到BSV就行。
