# Advanced Async Patterns and Error Handling

## Async/Await Best Practices

### Error Handling Patterns

```typescript
// Pattern 1: Try-Catch in async functions
async function fetchUserData(userId: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user data');
  }
}

// Pattern 2: Async wrapper for error handling
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  res.json({ success: true, data: user });
}));
```

### Custom Error Classes

```typescript
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}
```

### Promise.all for Parallel Operations

```typescript
// Execute multiple async operations in parallel
async function getUserDashboard(userId: string) {
  const [user, posts, comments, followers] = await Promise.all([
    userService.getById(userId),
    postService.getByUserId(userId),
    commentService.getByUserId(userId),
    followerService.getFollowers(userId)
  ]);

  return { user, posts, comments, followers };
}
```

### Promise.allSettled for Handling Partial Failures

```typescript
async function fetchMultipleResources(ids: string[]) {
  const results = await Promise.allSettled(
    ids.map(id => fetchResource(id))
  );

  const successful = results
    .filter((result): result is PromiseFulfilledResult<Resource> =>
      result.status === 'fulfilled'
    )
    .map(result => result.value);

  const failed = results
    .filter((result): result is PromiseRejectedResult =>
      result.status === 'rejected'
    )
    .map(result => result.reason);

  return { successful, failed };
}
```

### Retry Logic

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw new Error(`Failed after ${maxRetries} attempts: ${lastError!.message}`);
}

// Usage
const data = await fetchWithRetry(() => fetch('/api/data'));
```

### Timeout Handling

```typescript
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Operation timed out')), ms)
  );

  return Promise.race([promise, timeout]);
}

// Usage
const data = await withTimeout(fetchData(), 5000); // 5 second timeout
```

### Error Boundary Middleware

```typescript
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
}
```

## Async Patterns

### Sequential vs Parallel Execution

```typescript
// ❌ Sequential (slow)
const user = await getUser(id);
const posts = await getPosts(id);
const comments = await getComments(id);

// ✅ Parallel (fast)
const [user, posts, comments] = await Promise.all([
  getUser(id),
  getPosts(id),
  getComments(id)
]);
```

### Dependent Async Operations

```typescript
async function processOrder(orderId: string) {
  // Step 1: Get order
  const order = await orderService.getById(orderId);

  // Step 2: Process payment (depends on order)
  const payment = await paymentService.process(order.totalAmount);

  // Step 3: Update inventory (depends on order)
  await inventoryService.reduce(order.items);

  // Step 4: Send confirmation (depends on payment)
  await emailService.sendConfirmation(order.email, payment.receiptId);

  return { order, payment };
}
```

## Best Practices

1. **Always handle errors** - Never let promises reject silently
2. **Use async/await** - More readable than promise chains
3. **Parallelize when possible** - Use Promise.all for independent operations
4. **Add timeouts** - Prevent hanging requests
5. **Use custom error classes** - Make error handling type-safe
6. **Log errors properly** - Include context and stack traces
7. **Test error paths** - Don't just test happy paths
