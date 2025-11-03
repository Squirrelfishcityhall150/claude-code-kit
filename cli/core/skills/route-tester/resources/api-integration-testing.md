# API Integration Testing

## Integration Testing Strategy

Integration tests verify that multiple components work together correctly. For APIs, this means testing the full request-response cycle including routing, middleware, business logic, and database operations.

## Test Environment Setup

### Database Setup

```typescript
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

beforeAll(async () => {
  // Use test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL
      }
    }
  });

  // Run migrations
  await prisma.$executeRawUnsafe('CREATE DATABASE IF NOT EXISTS test_db');
  // execSync('npm prisma migrate deploy');
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Seed test data
  await seedTestData(prisma);
});

afterEach(async () => {
  // Clean up test data
  await prisma.user.deleteMany();
  await prisma.post.deleteMany();
  // ... clear other tables
});
```

### Application Initialization

```typescript
import { createApp } from '../src/app';

let app;
let server;

beforeAll(async () => {
  // Initialize application
  app = await createApp({
    database: testDatabaseConfig,
    redis: testRedisConfig,
    // ... other test config
  });

  // Start server on random port
  server = app.listen(0);
});

afterAll(async () => {
  // Cleanup
  await server.close();
  await app.cleanup();
});
```

## Full Flow Integration Tests

### CRUD Operation Flow

```typescript
describe('User CRUD Integration', () => {
  let authCookie: string;
  let createdUserId: string;

  beforeEach(async () => {
    // Setup: Login as admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });

    authCookie = loginResponse.headers['set-cookie'][0];
  });

  it('should complete full CRUD cycle', async () => {
    // CREATE
    const createResponse = await request(app)
      .post('/api/users')
      .set('Cookie', authCookie)
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user'
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toHaveProperty('id');

    createdUserId = createResponse.body.id;

    // READ - Get single user
    const readResponse = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set('Cookie', authCookie);

    expect(readResponse.status).toBe(200);
    expect(readResponse.body.email).toBe('john@example.com');

    // READ - List users
    const listResponse = await request(app)
      .get('/api/users')
      .set('Cookie', authCookie);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toContainEqual(
      expect.objectContaining({ id: createdUserId })
    );

    // UPDATE
    const updateResponse = await request(app)
      .patch(`/api/users/${createdUserId}`)
      .set('Cookie', authCookie)
      .send({ name: 'Jane Doe' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.name).toBe('Jane Doe');

    // Verify update persisted
    const verifyResponse = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set('Cookie', authCookie);

    expect(verifyResponse.body.name).toBe('Jane Doe');

    // DELETE
    const deleteResponse = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set('Cookie', authCookie);

    expect(deleteResponse.status).toBe(204);

    // Verify deletion
    const afterDeleteResponse = await request(app)
      .get(`/api/users/${createdUserId}`)
      .set('Cookie', authCookie);

    expect(afterDeleteResponse.status).toBe(404);
  });
});
```

### Multi-Step Business Process

```typescript
describe('E-commerce Order Flow', () => {
  let customerCookie: string;
  let productId: string;
  let cartId: string;
  let orderId: string;

  beforeEach(async () => {
    // Setup: Create customer and product
    const customer = await createTestUser({ role: 'customer' });
    customerCookie = await loginAs(customer.email, 'password123');

    const product = await createTestProduct({
      name: 'Test Product',
      price: 29.99,
      stock: 10
    });
    productId = product.id;
  });

  it('should complete full order flow', async () => {
    // Step 1: Add item to cart
    const addToCartResponse = await request(app)
      .post('/api/cart/items')
      .set('Cookie', customerCookie)
      .send({ productId, quantity: 2 });

    expect(addToCartResponse.status).toBe(201);
    cartId = addToCartResponse.body.cartId;

    // Step 2: View cart
    const viewCartResponse = await request(app)
      .get('/api/cart')
      .set('Cookie', customerCookie);

    expect(viewCartResponse.status).toBe(200);
    expect(viewCartResponse.body.items).toHaveLength(1);
    expect(viewCartResponse.body.total).toBe(59.98); // 2 * 29.99

    // Step 3: Checkout
    const checkoutResponse = await request(app)
      .post('/api/checkout')
      .set('Cookie', customerCookie)
      .send({
        shippingAddress: {
          street: '123 Main St',
          city: 'Anytown',
          country: 'US',
          postalCode: '12345'
        },
        paymentMethod: 'credit_card'
      });

    expect(checkoutResponse.status).toBe(201);
    orderId = checkoutResponse.body.orderId;

    // Step 4: Verify order created
    const orderResponse = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Cookie', customerCookie);

    expect(orderResponse.status).toBe(200);
    expect(orderResponse.body.status).toBe('pending');
    expect(orderResponse.body.items).toHaveLength(1);

    // Step 5: Verify stock reduced
    const productResponse = await request(app)
      .get(`/api/products/${productId}`);

    expect(productResponse.body.stock).toBe(8); // 10 - 2

    // Step 6: Verify cart cleared
    const cartAfterCheckout = await request(app)
      .get('/api/cart')
      .set('Cookie', customerCookie);

    expect(cartAfterCheckout.body.items).toHaveLength(0);
  });

  it('should prevent checkout with insufficient stock', async () => {
    // Add more than available stock
    await request(app)
      .post('/api/cart/items')
      .set('Cookie', customerCookie)
      .send({ productId, quantity: 20 }); // Stock is only 10

    const checkoutResponse = await request(app)
      .post('/api/checkout')
      .set('Cookie', customerCookie)
      .send({
        shippingAddress: { /* ... */ },
        paymentMethod: 'credit_card'
      });

    expect(checkoutResponse.status).toBe(400);
    expect(checkoutResponse.body.error).toMatch(/insufficient stock/i);
  });
});
```

## Database Integration

### Transaction Testing

```typescript
describe('Transaction Handling', () => {
  it('should rollback on error', async () => {
    const initialUserCount = await prisma.user.count();

    // Attempt operation that should fail
    const response = await request(app)
      .post('/api/users/batch')
      .send({
        users: [
          { name: 'User 1', email: 'user1@example.com' },
          { name: 'User 2', email: 'invalid-email' }, // Will fail validation
          { name: 'User 3', email: 'user3@example.com' }
        ]
      });

    expect(response.status).toBe(400);

    // Verify rollback - no users should be created
    const finalUserCount = await prisma.user.count();
    expect(finalUserCount).toBe(initialUserCount);
  });

  it('should commit successful transaction', async () => {
    const initialUserCount = await prisma.user.count();

    const response = await request(app)
      .post('/api/users/batch')
      .send({
        users: [
          { name: 'User 1', email: 'user1@example.com' },
          { name: 'User 2', email: 'user2@example.com' },
          { name: 'User 3', email: 'user3@example.com' }
        ]
      });

    expect(response.status).toBe(201);

    // Verify all users created
    const finalUserCount = await prisma.user.count();
    expect(finalUserCount).toBe(initialUserCount + 3);
  });
});
```

### Concurrent Access

```typescript
describe('Concurrent Operations', () => {
  it('should handle concurrent updates without race conditions', async () => {
    const user = await createTestUser({ balance: 100 });

    // Simulate 10 concurrent withdrawals of $10 each
    const withdrawals = Array(10).fill(null).map(() =>
      request(app)
        .post('/api/wallet/withdraw')
        .set('Cookie', await loginAs(user.email, 'password123'))
        .send({ amount: 10 })
    );

    const responses = await Promise.all(withdrawals);

    // Verify final balance (should handle optimistic locking)
    const finalUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    expect(finalUser.balance).toBe(0);

    // Verify correct number of successes and failures
    const successes = responses.filter(r => r.status === 200);
    const failures = responses.filter(r => r.status === 409); // Conflict

    expect(successes.length).toBe(10);
    expect(failures.length).toBe(0);
  });
});
```

## External Service Integration

### Mocking External APIs

```typescript
import nock from 'nock';

describe('Payment Processing Integration', () => {
  beforeEach(() => {
    // Mock external payment API
    nock('https://api.payment-provider.com')
      .post('/v1/charges')
      .reply(200, {
        id: 'ch_test_123',
        status: 'succeeded',
        amount: 2999
      });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should process payment and create order', async () => {
    const response = await request(app)
      .post('/api/checkout')
      .set('Cookie', customerCookie)
      .send({
        amount: 29.99,
        paymentMethod: 'credit_card',
        cardToken: 'tok_test_visa'
      });

    expect(response.status).toBe(201);
    expect(response.body.payment.status).toBe('succeeded');

    // Verify order created in database
    const order = await prisma.order.findUnique({
      where: { id: response.body.orderId }
    });

    expect(order.paymentStatus).toBe('paid');
  });

  it('should handle payment failure gracefully', async () => {
    // Mock payment failure
    nock.cleanAll();
    nock('https://api.payment-provider.com')
      .post('/v1/charges')
      .reply(402, {
        error: 'insufficient_funds'
      });

    const response = await request(app)
      .post('/api/checkout')
      .set('Cookie', customerCookie)
      .send({
        amount: 29.99,
        paymentMethod: 'credit_card',
        cardToken: 'tok_test_visa'
      });

    expect(response.status).toBe(402);

    // Verify no order created
    const orders = await prisma.order.findMany({
      where: { userId: customerId }
    });

    expect(orders).toHaveLength(0);
  });
});
```

## Middleware Integration

### Authentication Middleware

```typescript
describe('Authentication Middleware', () => {
  it('should protect routes requiring authentication', async () => {
    const protectedRoutes = [
      '/api/profile',
      '/api/orders',
      '/api/cart',
      '/api/settings'
    ];

    for (const route of protectedRoutes) {
      const response = await request(app).get(route);
      expect(response.status).toBe(401);
    }
  });

  it('should allow authenticated access', async () => {
    const authCookie = await loginAs('user@example.com', 'password123');

    const protectedRoutes = [
      '/api/profile',
      '/api/orders',
      '/api/cart',
      '/api/settings'
    ];

    for (const route of protectedRoutes) {
      const response = await request(app)
        .get(route)
        .set('Cookie', authCookie);

      expect(response.status).not.toBe(401);
    }
  });
});
```

### Rate Limiting

```typescript
describe('Rate Limiting Middleware', () => {
  it('should rate limit requests', async () => {
    const endpoint = '/api/search';

    // Make requests up to limit
    const requests = Array(100).fill(null).map(() =>
      request(app).get(endpoint)
    );

    const responses = await Promise.all(requests);

    // Some should be rate limited
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should reset rate limit after window', async () => {
    const endpoint = '/api/search';

    // Hit rate limit
    await Promise.all(
      Array(100).fill(null).map(() => request(app).get(endpoint))
    );

    // Wait for rate limit window to reset
    await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute

    // Should work again
    const response = await request(app).get(endpoint);
    expect(response.status).not.toBe(429);
  });
});
```

## Error Handling Integration

```typescript
describe('Global Error Handler', () => {
  it('should handle validation errors', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ invalid: 'data' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('errors');
  });

  it('should handle database errors', async () => {
    // Trigger unique constraint violation
    await createTestUser({ email: 'duplicate@example.com' });

    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'Test User',
        email: 'duplicate@example.com'
      });

    expect(response.status).toBe(409); // Conflict
    expect(response.body.error).toMatch(/already exists/i);
  });

  it('should handle internal errors safely in production', async () => {
    process.env.NODE_ENV = 'production';

    // Trigger internal error
    const response = await request(app).get('/api/error-prone-route');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal Server Error');
    expect(response.body).not.toHaveProperty('stack');
    expect(response.body.message).not.toContain('database');
  });
});
```

## Performance Testing

```typescript
describe('API Performance', () => {
  it('should respond within acceptable time', async () => {
    const start = Date.now();

    const response = await request(app).get('/api/users?page=1&limit=50');

    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(500); // 500ms
  });

  it('should handle N+1 queries efficiently', async () => {
    // Create test data
    await createTestUsers(100);
    await createTestPosts(500); // 5 posts per user

    const start = Date.now();

    const response = await request(app).get('/api/users?include=posts');

    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(100);
    expect(duration).toBeLessThan(1000); // Should use eager loading
  });
});
```

## Test Helpers

```typescript
// Database seeding
async function seedTestData(prisma: PrismaClient) {
  await prisma.user.createMany({
    data: [
      { email: 'admin@example.com', password: hashPassword('admin123'), role: 'admin' },
      { email: 'user@example.com', password: hashPassword('user123'), role: 'user' },
      { email: 'moderator@example.com', password: hashPassword('mod123'), role: 'moderator' }
    ]
  });

  await prisma.product.createMany({
    data: [
      { name: 'Product 1', price: 19.99, stock: 100 },
      { name: 'Product 2', price: 29.99, stock: 50 },
      { name: 'Product 3', price: 39.99, stock: 25 }
    ]
  });
}

// Test data creation
async function createTestUser(data: Partial<User>) {
  return await prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: hashPassword('password123'),
      role: 'user',
      ...data
    }
  });
}

async function createTestProduct(data: Partial<Product>) {
  return await prisma.product.create({
    data: {
      name: 'Test Product',
      price: 29.99,
      stock: 10,
      ...data
    }
  });
}

// Authentication helper
async function loginAs(email: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response.headers['set-cookie'][0];
}
```

## Best Practices

✅ **Do:**
- Use isolated test database
- Seed fresh test data for each test
- Clean up test data after each test
- Mock external services
- Test full request-response cycle
- Test database transactions
- Test concurrent operations
- Test middleware integration
- Verify side effects (database changes, emails sent, etc.)
- Test performance and timeouts

❌ **Don't:**
- Use production database for tests
- Share state between tests
- Make real external API calls
- Skip cleanup (causes flaky tests)
- Ignore race conditions
- Hard-code test data across tests
- Test only happy paths
- Forget to test error handling
