# Async Game Loop Architecture - Sketchy.io
## Architecture Document for Distributed Game State Management

---

## 1. Executive Summary

This document outlines the architecture for an **asynchronous, non-blocking game loop** for Sketchy.io (a Skribbl.io clone) that can scale horizontally across multiple server instances using **Redis as the central state store**.

### Key Architectural Goals
- ✅ Non-blocking game loop execution (doesn't halt other operations)
- ✅ Event-driven round progression with timer management
- ✅ Horizontal scalability across multiple server instances
- ✅ Centralized state management using Redis
- ✅ Race condition prevention for distributed operations
- ✅ Graceful handling of disconnections and timeouts

---

## 2. Current State Analysis

### What You Have ✅
- Socket.IO server with Bun engine
- Basic room creation and joining
- In-memory game state (`GameRooms` Map)
- Simple chat message validation
- Basic game status tracking

### What's Missing ❌
- Asynchronous game loop orchestration
- Timer-based round progression
- Redis-based state management
- Distributed locking mechanisms
- Score calculation and leaderboard updates
- Round transition logic
- Word selection and hint systems

---

## 3. Core Architecture Design

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (React)                      │
│              Socket.IO Client Connections                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Socket.IO Server Instances                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Server 1        Server 2         Server N         │   │
│  │  ┌─────────┐    ┌─────────┐     ┌─────────┐       │   │
│  │  │ Socket  │    │ Socket  │     │ Socket  │       │   │
│  │  │Handlers │    │Handlers │     │Handlers │       │   │
│  │  └────┬────┘    └────┬────┘     └────┬────┘       │   │
│  │       │              │               │             │   │
│  │  ┌────▼──────────────▼───────────────▼──────┐     │   │
│  │  │    Game Loop Orchestrator (per room)      │     │   │
│  │  │  - Timer Management                       │     │   │
│  │  │  - Round Progression                      │     │   │
│  │  │  - Event Coordination                     │     │   │
│  │  └────┬──────────────────────────────────────┘     │   │
│  └───────┼──────────────────────────────────────────────┘   │
└──────────┼──────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────┐
│                    Redis Layer                               │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐       │
│  │  Game State  │  │  Pub/Sub    │  │  Distributed │       │
│  │   Storage    │  │  Channels   │  │   Locks      │       │
│  │              │  │             │  │              │       │
│  │ - Room Data  │  │ - Events    │  │ - Redlock    │       │
│  │ - Players    │  │ - Timers    │  │ - Room Locks │       │
│  │ - Rounds     │  │ - Updates   │  │              │       │
│  └──────────────┘  └─────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Async Game Loop Design

### 4.1 The Problem with Synchronous Loops

❌ **Bad Approach:**
```typescript
// This BLOCKS the entire server
function gameLoop(roomId: string) {
  while (gameActive) {
    await sleep(80000); // BLOCKS for 80 seconds!
    endRound(roomId);
  }
}
```

### 4.2 Event-Driven Async Loop Pattern ✅

**Core Principle:** Use **timers as triggers** for state transitions, not blocking waits.

```typescript
// Event-driven, non-blocking approach
class GameLoopOrchestrator {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  startRound(roomId: string, duration: number) {
    // Schedule the end-of-round event
    const timer = setTimeout(async () => {
      await this.endRound(roomId);
    }, duration * 1000);

    this.timers.set(roomId, timer);

    // Server continues processing other requests
  }

  async endRound(roomId: string) {
    // Acquire distributed lock
    // Calculate scores
    // Update state in Redis
    // Emit events to clients
    // Start next round or end game
  }

  cancelTimer(roomId: string) {
    const timer = this.timers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomId);
    }
  }
}
```

---

## 5. Redis State Management Strategy

### 5.1 Data Structure Design

#### Redis Key Schema
```
game:room:{roomId}               → Hash (room metadata)
game:room:{roomId}:players       → Hash (player data)
game:room:{roomId}:round         → Hash (current round data)
game:room:{roomId}:guesses       → Sorted Set (correct guesses with timestamps)
game:room:{roomId}:lock          → String (distributed lock)
game:room:{roomId}:timer         → String (timer metadata)
```

#### Example Data Structures

**Room Metadata:**
```typescript
{
  "roomId": "ABC123",
  "type": "PRIVATE",
  "status": "IN_PROGRESS",
  "currentRound": 2,
  "maxRounds": 3,
  "drawTime": 80,
  "hints": 2,
  "drawerId": "socket-id-123",
  "word": "elephant",
  "roundStartTime": 1703001234567,
  "createdAt": 1703000000000
}
```

**Player Data:**
```typescript
{
  "socket-id-123": {
    "name": "Alice",
    "score": 150,
    "hasGuessed": false,
    "joinedAt": 1703000000000
  },
  "socket-id-456": {
    "name": "Bob",
    "score": 200,
    "hasGuessed": true,
    "joinedAt": 1703000001000
  }
}
```

**Round Data:**
```typescript
{
  "roundNumber": 2,
  "word": "elephant",
  "wordLength": 8,
  "drawerId": "socket-id-123",
  "startTime": 1703001234567,
  "endTime": 1703001314567,
  "playersGuessed": ["socket-id-456"],
  "hintsRevealed": 0
}
```

### 5.2 Redis Operations Wrapper

```typescript
// server/src/lib/redis.ts
import { Redis } from 'ioredis';
import type { GameRoom, Player, Setting } from './types';

export class RedisGameState {
  private redis: Redis;
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.publisher = new Redis(process.env.REDIS_URL);
    this.subscriber = new Redis(process.env.REDIS_URL);
  }

  // Room Operations
  async createRoom(roomId: string, room: GameRoom): Promise<void> {
    const key = `game:room:${roomId}`;
    await this.redis.hmset(key, {
      type: room.type,
      status: room.status,
      currentRound: room.round,
      drawerId: room.drawerId,
      word: room.word,
      ...room.settings,
      createdAt: Date.now(),
    });
    await this.redis.expire(key, 86400); // 24 hour TTL
  }

  async getRoom(roomId: string): Promise<GameRoom | null> {
    const key = `game:room:${roomId}`;
    const data = await this.redis.hgetall(key);
    if (!Object.keys(data).length) return null;

    // Reconstruct room object
    const players = await this.getPlayers(roomId);
    return this.deserializeRoom(data, players);
  }

  async updateRoomStatus(roomId: string, status: GameStatus): Promise<void> {
    await this.redis.hset(`game:room:${roomId}`, 'status', status);
  }

  // Player Operations
  async addPlayer(roomId: string, playerId: string, player: Player): Promise<void> {
    const key = `game:room:${roomId}:players`;
    await this.redis.hset(key, playerId, JSON.stringify({
      ...player,
      hasGuessed: false,
      joinedAt: Date.now(),
    }));
  }

  async getPlayers(roomId: string): Promise<Map<string, Player>> {
    const key = `game:room:${roomId}:players`;
    const data = await this.redis.hgetall(key);

    const players = new Map<string, Player>();
    for (const [id, json] of Object.entries(data)) {
      players.set(id, JSON.parse(json));
    }
    return players;
  }

  async updatePlayerScore(roomId: string, playerId: string, score: number): Promise<void> {
    const key = `game:room:${roomId}:players`;
    const playerData = await this.redis.hget(key, playerId);
    if (playerData) {
      const player = JSON.parse(playerData);
      player.score = score;
      await this.redis.hset(key, playerId, JSON.stringify(player));
    }
  }

  async markPlayerGuessed(roomId: string, playerId: string): Promise<void> {
    const key = `game:room:${roomId}:players`;
    const playerData = await this.redis.hget(key, playerId);
    if (playerData) {
      const player = JSON.parse(playerData);
      player.hasGuessed = true;
      await this.redis.hset(key, playerId, JSON.stringify(player));
    }
  }

  // Round Operations
  async startRound(roomId: string, roundData: any): Promise<void> {
    const key = `game:room:${roomId}:round`;
    await this.redis.hmset(key, {
      ...roundData,
      startTime: Date.now(),
    });
  }

  async getRoundData(roomId: string): Promise<any> {
    const key = `game:room:${roomId}:round`;
    return await this.redis.hgetall(key);
  }

  // Guess Tracking (Sorted Set for order)
  async recordGuess(roomId: string, playerId: string): Promise<number> {
    const key = `game:room:${roomId}:guesses`;
    const timestamp = Date.now();
    await this.redis.zadd(key, timestamp, playerId);
    return await this.redis.zcard(key); // Return position
  }

  async getGuessOrder(roomId: string): Promise<string[]> {
    const key = `game:room:${roomId}:guesses`;
    return await this.redis.zrange(key, 0, -1);
  }

  // Pub/Sub for cross-server communication
  async publishRoundEnd(roomId: string): Promise<void> {
    await this.publisher.publish(`room:${roomId}:round-end`, JSON.stringify({
      timestamp: Date.now(),
    }));
  }

  subscribeToRoom(roomId: string, callback: (data: any) => void): void {
    this.subscriber.subscribe(`room:${roomId}:round-end`);
    this.subscriber.on('message', (channel, message) => {
      if (channel === `room:${roomId}:round-end`) {
        callback(JSON.parse(message));
      }
    });
  }

  // Distributed Lock (using Redlock pattern)
  async acquireLock(roomId: string, ttl: number = 5000): Promise<string | null> {
    const lockKey = `game:room:${roomId}:lock`;
    const lockValue = `${Date.now()}-${Math.random()}`;

    const result = await this.redis.set(lockKey, lockValue, 'PX', ttl, 'NX');
    return result === 'OK' ? lockValue : null;
  }

  async releaseLock(roomId: string, lockValue: string): Promise<void> {
    const lockKey = `game:room:${roomId}:lock`;

    // Lua script for atomic check-and-delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await this.redis.eval(script, 1, lockKey, lockValue);
  }

  // Cleanup
  async deleteRoom(roomId: string): Promise<void> {
    const keys = [
      `game:room:${roomId}`,
      `game:room:${roomId}:players`,
      `game:room:${roomId}:round`,
      `game:room:${roomId}:guesses`,
      `game:room:${roomId}:lock`,
      `game:room:${roomId}:timer`,
    ];
    await this.redis.del(...keys);
  }

  private deserializeRoom(data: any, players: Map<string, Player>): GameRoom {
    return {
      type: parseInt(data.type),
      members: players,
      status: parseInt(data.status),
      settings: {
        totalPlayers: parseInt(data.totalPlayers),
        maxRounds: parseInt(data.maxRounds),
        drawTime: parseInt(data.drawTime),
        hints: parseInt(data.hints),
      },
      word: data.word || '',
      round: parseInt(data.currentRound) || 0,
      drawerId: data.drawerId || '',
    };
  }
}
```

---

## 6. Game Loop Orchestration

### 6.1 Game Loop State Machine

```
┌──────────┐
│ WAITING  │ (Players joining)
└────┬─────┘
     │ startGame()
     ▼
┌──────────────┐
│ ROUND_START  │ (Select drawer, choose word)
└────┬─────────┘
     │ wordChosen()
     ▼
┌──────────────┐
│ IN_PROGRESS  │ (Drawing + Guessing)
└────┬─────────┘
     │ timeout() OR allGuessed()
     ▼
┌──────────────┐
│  ROUND_END   │ (Calculate scores, show leaderboard)
└────┬─────────┘
     │ nextRound() OR finishGame()
     ▼
┌──────────────┐     ┌──────────┐
│ ROUND_START  │ OR  │ FINISHED │
└──────────────┘     └──────────┘
```

### 6.2 GameLoopOrchestrator Implementation

```typescript
// server/src/lib/game-loop.ts
import { RedisGameState } from './redis';
import type { TypedIo } from './types';
import { GameStatus } from './types';

export class GameLoopOrchestrator {
  private redis: RedisGameState;
  private io: TypedIo;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private wordList: string[] = ['elephant', 'guitar', 'mountain', 'pizza', 'rainbow'];

  constructor(redis: RedisGameState, io: TypedIo) {
    this.redis = redis;
    this.io = io;
    this.setupRedisSubscriptions();
  }

  private setupRedisSubscriptions() {
    // Listen for round-end events from other server instances
    this.redis.subscribeToRoom('*', async (data) => {
      // Handle cross-server round-end notifications
    });
  }

  /**
   * Start the game for a room
   */
  async startGame(roomId: string): Promise<void> {
    const lock = await this.redis.acquireLock(roomId);
    if (!lock) {
      console.log(`Could not acquire lock for room ${roomId}`);
      return;
    }

    try {
      await this.redis.updateRoomStatus(roomId, GameStatus.IN_PROGRESS);
      await this.startRound(roomId, 1);
    } finally {
      await this.redis.releaseLock(roomId, lock);
    }
  }

  /**
   * Start a new round
   */
  async startRound(roomId: string, roundNumber: number): Promise<void> {
    const room = await this.redis.getRoom(roomId);
    if (!room) return;

    // Select drawer (rotate through players)
    const players = Array.from(room.members.values());
    const drawerIndex = (roundNumber - 1) % players.length;
    const drawer = players[drawerIndex];

    // Generate word choices
    const wordChoices = this.getRandomWords(3);

    // Update round data in Redis
    await this.redis.startRound(roomId, {
      roundNumber,
      drawerId: drawer.id,
      startTime: Date.now(),
      playersGuessed: [],
      hintsRevealed: 0,
    });

    // Update room metadata
    await this.redis.updateRoomField(roomId, 'currentRound', roundNumber);
    await this.redis.updateRoomField(roomId, 'drawerId', drawer.id);

    // Emit events to clients
    this.io.in(roomId).emit('gameRound', roundNumber);
    this.io.to(drawer.id).emit('youChoosing', wordChoices);
    this.io.in(roomId).except(drawer.id).emit('otherChoosing', drawer.name);

    console.log(`Round ${roundNumber} started for room ${roomId}`);
  }

  /**
   * Handle word selection by drawer
   */
  async onWordChosen(roomId: string, drawerId: string, word: string): Promise<void> {
    const lock = await this.redis.acquireLock(roomId);
    if (!lock) return;

    try {
      const room = await this.redis.getRoom(roomId);
      if (!room || room.drawerId !== drawerId) return;

      // Store selected word
      await this.redis.updateRoomField(roomId, 'word', word);

      // Emit round start with word length hint
      const wordLength = word.length;
      this.io.in(roomId).emit('startRound', wordLength);

      // Schedule round end timer
      this.scheduleRoundEnd(roomId, room.settings.drawTime);

    } finally {
      await this.redis.releaseLock(roomId, lock);
    }
  }

  /**
   * Schedule the round end (non-blocking!)
   */
  private scheduleRoundEnd(roomId: string, duration: number): void {
    // Clear any existing timer
    this.cancelTimer(roomId);

    // Schedule new timer
    const timer = setTimeout(async () => {
      await this.endRound(roomId, 'timeout');
    }, duration * 1000);

    this.timers.set(roomId, timer);
    console.log(`Scheduled round end for room ${roomId} in ${duration}s`);
  }

  /**
   * Handle a correct guess
   */
  async onCorrectGuess(roomId: string, playerId: string): Promise<boolean> {
    const room = await this.redis.getRoom(roomId);
    if (!room) return false;

    // Mark player as guessed
    await this.redis.markPlayerGuessed(roomId, playerId);

    // Record guess order (for scoring)
    const position = await this.redis.recordGuess(roomId, playerId);

    // Calculate score based on position and time
    const score = this.calculateScore(position, room.settings.drawTime);
    const currentScore = room.members.get(playerId)?.score || 0;
    await this.redis.updatePlayerScore(roomId, playerId, currentScore + score);

    // Check if all players have guessed
    const players = await this.redis.getPlayers(roomId);
    const nonDrawers = Array.from(players.values()).filter(p => p.id !== room.drawerId);
    const allGuessed = nonDrawers.every(p => (p as any).hasGuessed);

    if (allGuessed) {
      // End round early
      await this.endRound(roomId, 'all-guessed');
    }

    return true;
  }

  /**
   * End the current round
   */
  async endRound(roomId: string, reason: 'timeout' | 'all-guessed'): Promise<void> {
    // Acquire distributed lock to prevent duplicate execution
    const lock = await this.redis.acquireLock(roomId, 10000);
    if (!lock) {
      console.log(`Could not acquire lock to end round for ${roomId}`);
      return;
    }

    try {
      // Clear timer
      this.cancelTimer(roomId);

      // Get room state
      const room = await this.redis.getRoom(roomId);
      if (!room) return;

      // Award drawer points if someone guessed
      const guessOrder = await this.redis.getGuessOrder(roomId);
      if (guessOrder.length > 0) {
        const drawerScore = room.members.get(room.drawerId)?.score || 0;
        const drawerBonus = guessOrder.length * 10;
        await this.redis.updatePlayerScore(roomId, room.drawerId, drawerScore + drawerBonus);
      }

      // Emit round over
      this.io.in(roomId).emit('roundOver', room.word);

      // Get updated players for leaderboard
      const players = await this.redis.getPlayers(roomId);
      const playerArray = Array.from(players.values())
        .sort((a, b) => b.score - a.score);

      this.io.in(roomId).emit('roomMembers', playerArray);

      // Publish round-end event (for other server instances)
      await this.redis.publishRoundEnd(roomId);

      // Clear guesses for next round
      await this.redis.redis.del(`game:room:${roomId}:guesses`);

      // Reset player guess flags
      for (const [playerId, player] of players.entries()) {
        const key = `game:room:${roomId}:players`;
        const playerData = { ...player, hasGuessed: false };
        await this.redis.redis.hset(key, playerId, JSON.stringify(playerData));
      }

      // Determine next action
      if (room.round >= room.settings.maxRounds) {
        await this.endGame(roomId);
      } else {
        // Start next round after delay
        setTimeout(() => {
          this.startRound(roomId, room.round + 1);
        }, 5000); // 5 second delay between rounds
      }

    } finally {
      await this.redis.releaseLock(roomId, lock);
    }
  }

  /**
   * End the game
   */
  async endGame(roomId: string): Promise<void> {
    await this.redis.updateRoomStatus(roomId, GameStatus.FINISHED);

    const players = await this.redis.getPlayers(roomId);
    const winner = Array.from(players.values())
      .sort((a, b) => b.score - a.score)[0];

    this.io.in(roomId).emit('gameOver', { winner });

    console.log(`Game ended for room ${roomId}`);
  }

  /**
   * Cancel timer for a room
   */
  cancelTimer(roomId: string): void {
    const timer = this.timers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomId);
    }
  }

  /**
   * Calculate score based on guess position
   */
  private calculateScore(position: number, maxTime: number): number {
    const baseScore = 100;
    const positionBonus = Math.max(0, 50 - (position - 1) * 10);
    return baseScore + positionBonus;
  }

  /**
   * Get random words for drawer selection
   */
  private getRandomWords(count: number): string[] {
    const shuffled = [...this.wordList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Cleanup on room deletion
   */
  async cleanupRoom(roomId: string): Promise<void> {
    this.cancelTimer(roomId);
    await this.redis.deleteRoom(roomId);
  }
}
```

---

## 7. Integration Points

### 7.1 Updated Socket Configuration

```typescript
// server/src/config/socket.ts
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { RedisGameState } from "../lib/redis";
import { GameLoopOrchestrator } from "../lib/game-loop";
import type { TypedIo } from "../lib/types";

const io = new Server() as TypedIo;

// Redis adapter for Socket.IO (handles pub/sub for socket events)
const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

// Game state management
const redisGameState = new RedisGameState();

// Game loop orchestrator
const gameLoop = new GameLoopOrchestrator(redisGameState, io);

export { io, redisGameState, gameLoop };
```

### 7.2 Updated Game Listeners

```typescript
// server/src/listeners/game.ts
import { gameLoop, io, redisGameState } from "../config/socket";
import { GameStatus, type TypedScoket } from "../lib/types";
import { emitErr } from "./utils";

export const gameListeners = (ws: TypedScoket) => {
  // Chat message / guess handling
  ws.on("chatMsg", async (msg) => {
    const { name, roomId } = ws.data;
    const room = await redisGameState.getRoom(roomId);

    if (!room) {
      emitErr(ws, "You are not in a valid room.");
      return;
    }

    let isValid = false;

    // Check if correct guess
    if (room.status === GameStatus.IN_PROGRESS && ws.id !== room.drawerId) {
      if (msg.toLowerCase() === room.word.toLowerCase()) {
        isValid = true;

        // Check if player already guessed
        const players = await redisGameState.getPlayers(roomId);
        const player = players.get(ws.id);

        if (player && !(player as any).hasGuessed) {
          await gameLoop.onCorrectGuess(roomId, ws.id);
        }
      }
    }

    io.in(roomId).emit("chatMsg", { name, msg, isValid });
  });

  // Start game
  ws.on("startGame", async (data) => {
    const { roomId } = ws.data;
    const room = await redisGameState.getRoom(roomId);

    if (!room) {
      emitErr(ws, "You are not in a valid room.");
      return;
    }

    // Update settings
    await redisGameState.redis.hmset(`game:room:${roomId}`, {
      totalPlayers: data.totalPlayers,
      maxRounds: data.maxRounds,
      drawTime: data.drawTime,
      hints: data.hints,
    });

    // Start game loop
    await gameLoop.startGame(roomId);
  });

  // Word chosen by drawer
  ws.on("choiceMade", async (choice) => {
    const { roomId } = ws.data;
    await gameLoop.onWordChosen(roomId, ws.id, choice);
  });
};
```

### 7.3 Updated Room Listeners

```typescript
// server/src/listeners/room.ts
import { redisGameState } from "../config/socket";
import { GameType, type TypedScoket } from "../lib/types";
import { emitErr } from "./utils";

export const joinRoom = async (ws: TypedScoket, name: string, roomId: string) => {
  const room = await redisGameState.getRoom(roomId);

  if (!room) {
    emitErr(ws, "Room not found");
    return;
  }

  // Add player to Redis
  await redisGameState.addPlayer(roomId, ws.id, {
    name,
    score: 0,
    id: ws.id,
  });

  ws.data = { name, roomId };

  const players = await redisGameState.getPlayers(roomId);
  const playerArray = Array.from(players.values());

  ws.emit("roomJoined", roomId, playerArray);
  ws.join(roomId);

  broadcastTotalMembers(roomId);
};

export const createRoom = async (ws: TypedScoket, name: string) => {
  const roomId = generateId(6);

  // Create room in Redis
  await redisGameState.createRoom(roomId, {
    type: GameType.PRIVATE,
    members: new Map(),
    status: GameStatus.WAITING,
    settings: {
      totalPlayers: 8,
      maxRounds: 3,
      drawTime: 80,
      hints: 2,
    },
    word: "",
    round: 0,
    drawerId: "",
  });

  // Add creator as player
  await redisGameState.addPlayer(roomId, ws.id, {
    name,
    score: 0,
    id: ws.id,
  });

  ws.data = { name, roomId };
  ws.emit("roomCreated", roomId, [{ name, score: 0, id: ws.id }]);
  ws.join(roomId);
};
```

---

## 8. Scalability Considerations

### 8.1 Horizontal Scaling

With this architecture, you can run multiple server instances:

```bash
# Server 1
PORT=3000 REDIS_URL=redis://localhost:6379 bun run src/index.ts

# Server 2
PORT=3001 REDIS_URL=redis://localhost:6379 bun run src/index.ts

# Server 3
PORT=3002 REDIS_URL=redis://localhost:6379 bun run src/index.ts
```

**How it works:**
- Socket.IO Redis adapter handles routing messages between servers
- Redis stores game state centrally
- Distributed locks prevent race conditions
- Pub/Sub notifies all servers of game events

### 8.2 Load Balancing

```nginx
upstream socketio_backend {
    ip_hash; # Sticky sessions
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}

server {
    location /socket.io/ {
        proxy_pass http://socketio_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 8.3 Redis Performance Optimization

1. **Use Redis Pipeline for batch operations:**
```typescript
async batchUpdateScores(roomId: string, scores: Map<string, number>) {
  const pipeline = this.redis.pipeline();

  for (const [playerId, score] of scores.entries()) {
    const key = `game:room:${roomId}:players`;
    // Add commands to pipeline
    pipeline.hget(key, playerId);
  }

  await pipeline.exec();
}
```

2. **Use Redis Lua scripts for atomic operations:**
```typescript
// Atomic score update with max limit
const script = `
  local current = tonumber(redis.call("HGET", KEYS[1], ARGV[1]))
  local add = tonumber(ARGV[2])
  local max = tonumber(ARGV[3])
  local new = math.min(current + add, max)
  redis.call("HSET", KEYS[1], ARGV[1], new)
  return new
`;
```

3. **Use Redis Streams for game event history:**
```typescript
// Track game events for replay/debugging
await redis.xadd(`game:room:${roomId}:events`, '*',
  'type', 'guess',
  'playerId', playerId,
  'timestamp', Date.now()
);
```

---

## 9. Error Handling & Edge Cases

### 9.1 Disconnection Handling

```typescript
// In socket disconnect handler
socket.on("disconnect", async () => {
  const { roomId } = socket.data;
  const room = await redisGameState.getRoom(roomId);

  if (!room) return;

  // If drawer disconnects, end round immediately
  if (room.drawerId === socket.id && room.status === GameStatus.IN_PROGRESS) {
    await gameLoop.endRound(roomId, 'drawer-disconnect');
  }

  // Remove player
  await redisGameState.redis.hdel(`game:room:${roomId}:players`, socket.id);

  // If room empty, cleanup
  const players = await redisGameState.getPlayers(roomId);
  if (players.size === 0) {
    await gameLoop.cleanupRoom(roomId);
  }
});
```

### 9.2 Server Crash Recovery

If a server crashes with active timers:

1. **Timer metadata in Redis:**
```typescript
// Store timer end time in Redis
await redis.hset(`game:room:${roomId}:timer`, {
  endTime: Date.now() + duration * 1000,
  type: 'round-end'
});
```

2. **Recovery on server startup:**
```typescript
// On server init, check for orphaned timers
async recoverTimers() {
  const rooms = await this.redis.getAllActiveRooms();

  for (const roomId of rooms) {
    const timerData = await this.redis.redis.hgetall(`game:room:${roomId}:timer`);

    if (timerData.endTime) {
      const remaining = parseInt(timerData.endTime) - Date.now();

      if (remaining > 0) {
        // Reschedule timer
        setTimeout(() => this.endRound(roomId, 'timeout'), remaining);
      } else {
        // Timer should have fired, end round now
        await this.endRound(roomId, 'timeout');
      }
    }
  }
}
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Install Redis and ioredis dependencies
- [ ] Implement `RedisGameState` class
- [ ] Migrate room creation/joining to Redis
- [ ] Add Redis adapter to Socket.IO
- [ ] Test multi-instance deployment

### Phase 2: Game Loop (Week 2)
- [ ] Implement `GameLoopOrchestrator` class
- [ ] Add timer-based round progression
- [ ] Implement word selection flow
- [ ] Add guess validation with scoring
- [ ] Test full game flow on single instance

### Phase 3: Distributed Features (Week 3)
- [ ] Implement distributed locking
- [ ] Add Redis Pub/Sub for cross-server events
- [ ] Implement timer recovery on crash
- [ ] Test with multiple server instances
- [ ] Load test with 100+ concurrent rooms

### Phase 4: Polish & Optimization (Week 4)
- [ ] Add hint system (reveal letters over time)
- [ ] Implement word difficulty levels
- [ ] Add game replay/history
- [ ] Performance optimization
- [ ] Monitoring and logging

---

## 11. Testing Strategy

### Unit Tests
```typescript
describe('GameLoopOrchestrator', () => {
  it('should schedule round end without blocking', async () => {
    const orchestrator = new GameLoopOrchestrator(mockRedis, mockIo);

    const start = Date.now();
    await orchestrator.startRound('room1', 1);
    const end = Date.now();

    // Should return immediately
    expect(end - start).toBeLessThan(100);
  });

  it('should handle all players guessing correctly', async () => {
    // Test early round end
  });

  it('should prevent duplicate round-end execution', async () => {
    // Test distributed lock
  });
});
```

### Integration Tests
```typescript
describe('Multi-server game flow', () => {
  it('should sync state across two servers', async () => {
    const server1 = createServer(3000);
    const server2 = createServer(3001);

    // Player A connects to server1
    // Player B connects to server2
    // Verify both see same game state
  });
});
```

### Load Tests
```bash
# Artillery config
config:
  target: "ws://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Join room and play"
    engine: socketio
    flow:
      - emit:
          channel: "createRoom"
          data: { name: "Player{{ $randomNumber }}" }
      - think: 2
      - emit:
          channel: "startGame"
      - think: 30
```

---

## 12. Monitoring & Observability

### Key Metrics to Track

1. **Game Metrics:**
   - Active rooms count
   - Players per room distribution
   - Average game duration
   - Rounds completed per minute

2. **Performance Metrics:**
   - Redis operation latency
   - Lock acquisition success rate
   - Timer drift (scheduled vs actual execution)
   - Socket message throughput

3. **Health Metrics:**
   - Server instance count
   - Memory usage per instance
   - Redis connection pool status
   - Failed round transitions

### Example Monitoring Setup

```typescript
// server/src/lib/metrics.ts
import { RedisGameState } from './redis';

export class MetricsCollector {
  async collectMetrics(redis: RedisGameState) {
    const keys = await redis.redis.keys('game:room:*');
    const activeRooms = keys.filter(k => !k.includes(':')).length;

    console.log(`Active Rooms: ${activeRooms}`);

    // Export to Prometheus, DataDog, etc.
  }
}
```

---

## 13. Summary

### Key Architectural Decisions ✅

1. **Event-Driven Game Loop** - Use setTimeout/setInterval as triggers, not blocking waits
2. **Redis as Source of Truth** - All game state stored centrally for horizontal scaling
3. **Distributed Locks** - Prevent race conditions across multiple servers
4. **Pub/Sub for Coordination** - Notify all servers of critical game events
5. **Timer Recovery** - Store timer metadata in Redis for crash recovery
6. **Atomic Operations** - Use Lua scripts and Redis transactions for consistency

### Benefits of This Architecture

✅ **Non-blocking** - Game timers don't halt other operations
✅ **Scalable** - Add more servers without code changes
✅ **Fault-tolerant** - Recover from crashes gracefully
✅ **Low latency** - Redis operations are sub-millisecond
✅ **Consistent** - Distributed locks prevent race conditions
✅ **Observable** - Easy to monitor and debug

---

## 14. Next Steps

1. **Review this document** with your team
2. **Set up Redis** locally and in production
3. **Start with Phase 1** - Migrate to Redis-based state
4. **Iterate incrementally** - Test each phase thoroughly
5. **Monitor and optimize** - Use metrics to guide improvements

---

**Questions? Need clarification on any section?** I'm here to help architect your solution! 🏗️
