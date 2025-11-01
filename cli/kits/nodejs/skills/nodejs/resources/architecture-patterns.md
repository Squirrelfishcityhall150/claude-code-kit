# Architecture Patterns for Node.js/TypeScript

## Layered Architecture Overview

```
┌─────────────────────────────────────────┐
│           Routes (HTTP Layer)            │
│   - Define endpoints                     │
│   - Route parameters                     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Controllers (API Layer)          │
│   - Request/Response handling            │
│   - Input validation                     │
│   - Response formatting                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│        Services (Business Logic)         │
│   - Business rules                       │
│   - Orchestration                        │
│   - Transaction management               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Repositories (Data Access)          │
│   - Database queries                     │
│   - ORM interactions                     │
│   - Data mapping                         │
└──────────────────────────────────────────┘
```

## Route Layer

### Defining Routes

```typescript
// src/api/routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const userController = new UserController();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.patch('/:id', userController.update);
router.delete('/:id', userController.delete);

export default router;
```

### Route Registration

```typescript
// src/app.ts
import express from 'express';
import userRoutes from './api/routes/user.routes';
import postRoutes from './api/routes/post.routes';

const app = express();

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

export default app;
```

## Controller Layer

### Controller Pattern

```typescript
// src/api/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../types/user.types';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getAll();
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await this.userService.getById(id);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(404).json({ success: false, error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const userData: CreateUserDto = req.body;
      const user = await this.userService.create(userData);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  };
}
```

## Service Layer

### Service Pattern

```typescript
// src/api/services/user.service.ts
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto, User } from '../types/user.types';
import { NotFoundError, ValidationError } from '../errors';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }
    return user;
  }

  async create(data: CreateUserDto): Promise<User> {
    // Business logic: Validate email
    if (!this.isValidEmail(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Business logic: Check for duplicate
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError('Email already exists');
    }

    // Business logic: Hash password
    const hashedPassword = await this.hashPassword(data.password);

    return await this.userRepository.create({
      ...data,
      password: hashedPassword
    });
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async hashPassword(password: string): Promise<string> {
    // Implementation
    return password; // placeholder
  }
}
```

## Repository Layer

### Repository Pattern

```typescript
// src/api/repositories/user.repository.ts
import { prisma } from '../../database';
import { User, CreateUserDto, UpdateUserDto } from '../types/user.types';

export class UserRepository {
  async findAll(): Promise<User[]> {
    return await prisma.user.findMany();
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async create(data: CreateUserDto): Promise<User> {
    return await prisma.user.create({
      data
    });
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id }
    });
  }
}
```

## Dependency Injection

### Constructor Injection

```typescript
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getById(id: string): Promise<User> {
    return await this.userRepository.findById(id);
  }
}

// Usage
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
```

### Service Container

```typescript
// src/container.ts
export class ServiceContainer {
  private services = new Map<string, any>();

  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  resolve<T>(name: string): T {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found`);
    }
    return factory();
  }
}

// Setup
const container = new ServiceContainer();

container.register('UserRepository', () => new UserRepository());
container.register('UserService', () =>
  new UserService(container.resolve('UserRepository'))
);

// Usage
const userService = container.resolve<UserService>('UserService');
```

## Transaction Management

### Using Transactions

```typescript
export class OrderService {
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    return await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: orderData
      });

      // Reduce inventory
      await tx.inventory.update({
        where: { productId: orderData.productId },
        data: { quantity: { decrement: orderData.quantity } }
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: order.totalAmount
        }
      });

      return order;
    });
  }
}
```

## Middleware Pattern

### Custom Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Usage
router.get('/profile', authMiddleware, userController.getProfile);
```

## Best Practices

### 1. Single Responsibility

Each layer has one job:
- **Routes**: Define endpoints
- **Controllers**: Handle HTTP
- **Services**: Business logic
- **Repositories**: Data access

### 2. Dependency Direction

Dependencies flow downward:
```
Routes → Controllers → Services → Repositories
```

### 3. Keep Controllers Thin

```typescript
// ✅ Good: Thin controller
async getUser(req: Request, res: Response) {
  const user = await this.userService.getById(req.params.id);
  res.json({ data: user });
}

// ❌ Bad: Fat controller with business logic
async getUser(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) throw new Error('Not found');
  if (user.status === 'banned') throw new Error('User banned');
  // ... more logic
  res.json({ data: user });
}
```

### 4. Keep Services Focused

```typescript
// ✅ Good: Focused service
class UserService {
  async create(data: CreateUserDto): Promise<User> {
    // User-specific business logic only
  }
}

// ❌ Bad: Service doing too much
class UserService {
  async create(data: CreateUserDto): Promise<User> {
    // Creates user
    // Sends email
    // Updates analytics
    // Notifies admins
    // ...
  }
}
```

### 5. Type Everything

Use TypeScript types for all DTOs, entities, and service responses.

```typescript
export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
```
