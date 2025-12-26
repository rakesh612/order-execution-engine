# Order Execution Engine

A production-ready Solana DEX order execution engine with real-time WebSocket updates, intelligent DEX routing between Raydium and Meteora, and concurrent order processing using BullMQ.

## 🎯 Order Type: Market Order

### Why Market Order?
Market orders provide immediate execution at current market price, making them ideal for demonstrating real-time DEX routing and WebSocket updates. They showcase the core challenge of price comparison and best execution routing without the complexity of monitoring price conditions over time.

### Extension to Other Order Types
- **Limit Orders**: Add a price monitoring service that checks if current market price meets the limit price threshold before triggering execution through the same engine.
- **Sniper Orders**: Implement token launch detection via Solana program listeners, then trigger execution through the existing market order flow when launch is detected.

## 🏗️ Architecture

```
User Request → HTTP POST → Create Order → Queue (BullMQ)
                ↓
            WebSocket Connection
                ↓
Worker → DEX Router (Raydium/Meteora) → Best Price Selection
                ↓
        Execute Swap → Confirm → Database
                ↓
        WebSocket Updates (pending → routing → building → submitted → confirmed)
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- Docker & Docker Compose
- npm or yarn

### Installation

1. **Clone and setup:**
```bash
git clone <your-repo-url>
cd order-execution-engine
npm install
cp .env.example .env
```

2. **Start services:**
```bash
docker-compose up -d
npm run db:migrate
```

3. **Run the application:**
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

Server runs at: **http://localhost:3000**

## 📡 API Usage

### Create Order
```bash
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "So11111111111111111111111111111111111111112",
    "tokenOut": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "amountIn": 1.5,
    "slippage": 0.01
  }'
```

Response:
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Order created successfully",
  "websocketUrl": "/api/orders/status/550e8400-e29b-41d4-a716-446655440000"
}
```

### WebSocket Connection (JavaScript)
```javascript
const orderId = 'your-order-id';
const ws = new WebSocket(`ws://localhost:3000/api/orders/status/${orderId}`);

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Status:', update.status);
  console.log('Message:', update.message);
  
  if (update.status === 'confirmed') {
    console.log('TX Hash:', update.txHash);
    console.log('Executed Price:', update.executedPrice);
  }
};
```

### Get Order Details
```bash
curl http://localhost:3000/api/orders/{orderId}
```

### List Recent Orders
```bash
curl http://localhost:3000/api/orders
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:int

# With coverage
npm run test:coverage
```

## 📊 Order Status Flow

1. **pending** - Order received and queued
2. **routing** - Comparing prices from Raydium and Meteora
3. **building** - Creating transaction for selected DEX
4. **submitted** - Transaction sent to network
5. **confirmed** - Transaction successful (includes txHash and executedPrice)
6. **failed** - Execution failed (includes error message)

## 🔧 Configuration

Environment variables (`.env`):

```env
PORT=3000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://orderuser:orderpass@localhost:5432/orders
QUEUE_CONCURRENCY=10
MAX_ORDERS_PER_MINUTE=100
MAX_RETRIES=3
RETRY_DELAY_MS=1000
```

## 📦 Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Server**: Fastify with WebSocket support  
- **Queue**: BullMQ + Redis
- **Database**: PostgreSQL (order history) + Redis (active orders)
- **Validation**: Zod
- **Testing**: Jest
- **Logging**: Pino

## 🎥 Demo Video

See the complete walkthrough: [YouTube Link](https://www.youtube.com/watch?v=Osb61c14Y-8)

Demonstrates:
- Order flow through the system
- Submitting 3-5 orders simultaneously
- WebSocket status updates in real-time
- DEX routing decisions in logs
- Queue processing multiple concurrent orders
