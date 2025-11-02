# Comprehensive Testing Guide for Node.js/TypeScript

## Unit Testing Services

### Basic Service Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './user.service';
import type { UserRepository } from './user.repository';

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as jest.Mocked<UserRepository>;

    userService = new UserService(mockRepository);
  });

  describe('getById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User'
      };
      mockRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getById('123');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('123');
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(userService.getById('123')).rejects.toThrow('User not found');
    });
  });

  describe('create', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password123'
      };

      const createdUser = {
        id: '456',
        ...userData,
        password: 'hashed_password'
      };

      mockRepository.create.mockResolvedValue(createdUser);

      const result = await userService.create(userData);

      expect(result).toEqual(createdUser);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: userData.email,
          name: userData.name
        })
      );
    });

    it('should throw ValidationError for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test',
        password: 'password123'
      };

      await expect(userService.create(userData)).rejects.toThrow('Invalid email');
    });
  });
});
```

## Integration Testing

### API Endpoint Testing

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { prisma } from '../database';

describe('User API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear database between tests
    await prisma.user.deleteMany();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'securePassword123'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.email).toBe(userData.email);
      expect(response.body.data).not.toHaveProperty('password'); // Password should not be returned
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        name: 'User 1',
        password: 'password123'
      };

      // Create first user
      await request(app).post('/api/users').send(userData);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com' }) // Missing name and password
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Create user first
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123'
        });

      const userId = createResponse.body.data.id;

      // Get user
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user', async () => {
      // Create user
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          name: 'Original Name',
          password: 'password123'
        });

      const userId = createResponse.body.data.id;

      // Update user
      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.email).toBe('test@example.com'); // Unchanged
    });
  });
});
```

## Mocking External Dependencies

### Mocking Prisma

```typescript
import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Create mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as PrismaClient;

// Use in tests
mockPrisma.user.findUnique.mockResolvedValue({
  id: '1',
  email: 'test@example.com',
  name: 'Test User'
});
```

### Mocking HTTP Requests

```typescript
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// In test
mockedAxios.get.mockResolvedValue({
  data: { message: 'Success' },
  status: 200
});
```

## Testing Async Error Handling

```typescript
describe('Error Handling', () => {
  it('should handle service errors gracefully', async () => {
    mockRepository.findById.mockRejectedValue(new Error('Database error'));

    const response = await request(app)
      .get('/api/users/123')
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Internal server error');
  });

  it('should handle validation errors', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'invalid', name: '', password: '123' })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors).toHaveLength(3);
  });
});
```

## Test Utilities

### Test Data Factory

```typescript
// test/factories/user.factory.ts
import { faker } from '@faker-js/faker';

export const createUserData = (overrides?: Partial<User>) => ({
  email: faker.internet.email(),
  name: faker.person.fullName(),
  password: faker.internet.password(),
  ...overrides
});

// Usage in tests
const userData = createUserData({ email: 'specific@example.com' });
```

### Test Database Setup

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
});

export async function setupTestDatabase() {
  await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS test CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA test');
  // Run migrations
}

export async function teardownTestDatabase() {
  await prisma.$disconnect();
}
```

## Testing Best Practices

### 1. Test Isolation
```typescript
beforeEach(async () => {
  // Clear all data
  await prisma.user.deleteMany();
  await prisma.post.deleteMany();
});
```

### 2. Test Naming
```typescript
// ✅ Good: Descriptive test names
it('should return 404 when user does not exist', async () => {});

// ❌ Bad: Vague test names
it('handles errors', async () => {});
```

### 3. AAA Pattern
```typescript
it('should create user', async () => {
  // Arrange
  const userData = { email: 'test@example.com', name: 'Test' };

  // Act
  const result = await userService.create(userData);

  // Assert
  expect(result.email).toBe(userData.email);
});
```

### 4. Mock Only What You Need
```typescript
// ✅ Good: Mock only external dependencies
const mockRepository = { findById: vi.fn() };

// ❌ Bad: Mocking everything including business logic
const mockService = { create: vi.fn(), update: vi.fn(), delete: vi.fn() };
```

## Coverage Goals

- **Unit Tests**: Aim for 80%+ coverage of business logic
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user flows

Run coverage:
```bash
npm run test:coverage
```
