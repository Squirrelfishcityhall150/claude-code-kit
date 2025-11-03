# HTTP Testing Fundamentals

## Understanding HTTP Testing

HTTP testing validates that your API endpoints behave correctly when receiving requests and returning responses. This includes testing request handling, response formats, status codes, headers, and error conditions.

## Core HTTP Concepts for Testing

### 1. HTTP Methods (Verbs)

**GET** - Retrieve resources
- Should be idempotent (multiple identical requests produce same result)
- No request body
- Safe (doesn't modify server state)

**POST** - Create new resources
- Has request body
- Not idempotent (multiple requests create multiple resources)
- Returns 201 Created with resource location

**PUT** - Replace entire resource
- Has request body
- Idempotent (multiple identical requests produce same result)
- Returns 200 OK or 204 No Content

**PATCH** - Partial update of resource
- Has request body with only fields to update
- May or may not be idempotent (depends on implementation)
- Returns 200 OK with updated resource

**DELETE** - Remove resource
- Usually no request body
- Idempotent (deleting same resource multiple times has same effect)
- Returns 204 No Content or 200 OK

**OPTIONS** - Discover allowed methods
- Used for CORS preflight requests
- Returns allowed HTTP methods in Allow header

**HEAD** - Same as GET but without response body
- Used to check if resource exists or get metadata
- Returns same headers as GET would

### 2. HTTP Status Codes

**2xx Success**
- `200 OK` - Request succeeded (GET, PUT, PATCH)
- `201 Created` - Resource created (POST)
- `202 Accepted` - Request accepted for processing (async operations)
- `204 No Content` - Success but no response body (DELETE, PUT)

**3xx Redirection**
- `301 Moved Permanently` - Resource permanently moved
- `302 Found` - Temporary redirect
- `304 Not Modified` - Cached version is still valid

**4xx Client Errors**
- `400 Bad Request` - Invalid request syntax or validation failed
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `405 Method Not Allowed` - HTTP method not supported for this endpoint
- `409 Conflict` - Request conflicts with current state (e.g., duplicate email)
- `422 Unprocessable Entity` - Syntactically correct but semantically invalid
- `429 Too Many Requests` - Rate limit exceeded

**5xx Server Errors**
- `500 Internal Server Error` - Generic server error
- `502 Bad Gateway` - Invalid response from upstream server
- `503 Service Unavailable` - Server temporarily unavailable
- `504 Gateway Timeout` - Upstream server timeout

### 3. HTTP Headers

**Request Headers to Test**
```typescript
{
  'Content-Type': 'application/json',           // Request body format
  'Accept': 'application/json',                  // Expected response format
  'Authorization': 'Bearer <token>',             // Authentication
  'Cookie': 'session=abc123',                    // Session cookies
  'User-Agent': 'MyApp/1.0',                     // Client identifier
  'X-Request-ID': 'uuid',                        // Request tracking
  'If-None-Match': 'etag-value',                 // Conditional requests
  'If-Modified-Since': 'date'                    // Caching
}
```

**Response Headers to Validate**
```typescript
{
  'Content-Type': 'application/json',            // Response format
  'Set-Cookie': 'session=xyz; HttpOnly; Secure', // Set cookies
  'Cache-Control': 'no-cache',                   // Caching policy
  'ETag': '"resource-version"',                  // Resource version
  'Location': '/api/users/123',                  // Created resource URL (201)
  'X-RateLimit-Remaining': '99',                 // Rate limit info
  'Access-Control-Allow-Origin': '*',            // CORS
  'Content-Length': '1234'                       // Response size
}
```

## Testing Patterns

### Test Structure (AAA Pattern)

```typescript
it('should create user with valid data', async () => {
  // Arrange - Set up test data and preconditions
  const newUser = {
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user'
  };

  // Act - Execute the operation being tested
  const response = await request(app)
    .post('/api/users')
    .send(newUser);

  // Assert - Verify the results
  expect(response.status).toBe(201);
  expect(response.body).toMatchObject(newUser);
  expect(response.body.id).toBeDefined();
});
```

### Happy Path vs Edge Cases

**Happy Path** - Normal, expected flow
```typescript
it('should return user by id', async () => {
  const user = await createTestUser();

  const response = await request(app).get(`/api/users/${user.id}`);

  expect(response.status).toBe(200);
  expect(response.body.id).toBe(user.id);
});
```

**Edge Cases** - Unusual or error conditions
```typescript
describe('Edge Cases', () => {
  it('should return 404 for non-existent user', async () => {
    const response = await request(app).get('/api/users/999999');
    expect(response.status).toBe(404);
  });

  it('should return 400 for invalid id format', async () => {
    const response = await request(app).get('/api/users/invalid-id');
    expect(response.status).toBe(400);
  });

  it('should handle special characters in query params', async () => {
    const response = await request(app).get('/api/users?name=O%27Brien');
    expect(response.status).toBe(200);
  });

  it('should reject extremely large request body', async () => {
    const hugeData = { data: 'x'.repeat(10 * 1024 * 1024) }; // 10MB
    const response = await request(app).post('/api/data').send(hugeData);
    expect(response.status).toBe(413); // Payload Too Large
  });
});
```

### Idempotency Testing

```typescript
describe('Idempotency', () => {
  it('GET should be idempotent', async () => {
    const response1 = await request(app).get('/api/users/123');
    const response2 = await request(app).get('/api/users/123');
    const response3 = await request(app).get('/api/users/123');

    expect(response1.body).toEqual(response2.body);
    expect(response2.body).toEqual(response3.body);
  });

  it('PUT should be idempotent', async () => {
    const updates = { name: 'Jane Doe' };

    const response1 = await request(app).put('/api/users/123').send(updates);
    const response2 = await request(app).put('/api/users/123').send(updates);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
    expect(response1.body).toEqual(response2.body);
  });

  it('DELETE should be idempotent', async () => {
    const response1 = await request(app).delete('/api/users/123');
    const response2 = await request(app).delete('/api/users/123');

    expect(response1.status).toBe(204);
    expect(response2.status).toBe(404); // Already deleted
  });

  it('POST should NOT be idempotent', async () => {
    const userData = { name: 'John', email: 'john@example.com' };

    const response1 = await request(app).post('/api/users').send(userData);
    const response2 = await request(app).post('/api/users').send(userData);

    expect(response1.status).toBe(201);
    expect(response2.status).toBe(409); // Conflict - email already exists
  });
});
```

## Request/Response Body Testing

### JSON Request Bodies

```typescript
describe('JSON Request Bodies', () => {
  it('should accept valid JSON', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send({ name: 'John Doe', email: 'john@example.com' });

    expect(response.status).toBe(201);
  });

  it('should reject malformed JSON', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');

    expect(response.status).toBe(400);
  });

  it('should reject missing required fields', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John Doe' }); // Missing email

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: 'email', message: expect.any(String) })
    );
  });

  it('should reject invalid field types', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 123, email: 'john@example.com' }); // name should be string

    expect(response.status).toBe(400);
  });
});
```

### Response Body Validation

```typescript
describe('Response Body Validation', () => {
  it('should return expected schema', async () => {
    const response = await request(app).get('/api/users/123');

    expect(response.body).toEqual({
      id: expect.any(String),
      name: expect.any(String),
      email: expect.stringMatching(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/),
      role: expect.stringMatching(/^(user|admin|moderator)$/),
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/), // ISO 8601
      updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    });
  });

  it('should not leak sensitive fields', async () => {
    const response = await request(app).get('/api/users/123');

    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('resetToken');
  });

  it('should return paginated list format', async () => {
    const response = await request(app).get('/api/users');

    expect(response.body).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({ id: expect.any(String) })
      ]),
      pagination: {
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        pages: expect.any(Number)
      }
    });
  });
});
```

## Content Negotiation

### Testing Different Content Types

```typescript
describe('Content Negotiation', () => {
  it('should return JSON by default', async () => {
    const response = await request(app).get('/api/users/123');

    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Object);
  });

  it('should support Accept header', async () => {
    const response = await request(app)
      .get('/api/users/123')
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
  });

  it('should return 406 for unsupported content type', async () => {
    const response = await request(app)
      .get('/api/users/123')
      .set('Accept', 'application/xml');

    expect(response.status).toBe(406); // Not Acceptable
  });
});
```

## Query Parameters and URL Encoding

```typescript
describe('Query Parameters', () => {
  it('should handle simple query params', async () => {
    const response = await request(app).get('/api/users?role=admin');

    expect(response.status).toBe(200);
    expect(response.body.data.every(u => u.role === 'admin')).toBe(true);
  });

  it('should handle multiple query params', async () => {
    const response = await request(app)
      .get('/api/users?role=admin&active=true&page=1');

    expect(response.status).toBe(200);
  });

  it('should handle URL-encoded characters', async () => {
    const response = await request(app)
      .get('/api/users?name=O%27Brien'); // O'Brien encoded

    expect(response.status).toBe(200);
  });

  it('should handle array query params', async () => {
    const response = await request(app)
      .get('/api/users?roles[]=admin&roles[]=moderator');

    expect(response.status).toBe(200);
  });

  it('should validate query param types', async () => {
    const response = await request(app).get('/api/users?page=invalid');

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(
      expect.objectContaining({ field: 'page', message: expect.any(String) })
    );
  });
});
```

## Performance and Timeout Testing

```typescript
describe('Performance', () => {
  it('should respond within acceptable time', async () => {
    const start = Date.now();

    const response = await request(app).get('/api/users');

    const duration = Date.now() - start;
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(1000); // 1 second
  });

  it('should handle slow queries with timeout', async () => {
    const response = await request(app)
      .get('/api/expensive-query')
      .timeout(5000); // 5 second timeout

    expect(response.status).toBe(200);
  });
});
```

## Best Practices Summary

✅ **Do:**
- Test both happy path and edge cases
- Validate response schemas
- Test idempotency for appropriate methods
- Verify proper status codes
- Test error handling
- Use realistic test data
- Clean up after each test
- Test query parameters and URL encoding

❌ **Don't:**
- Share state between tests
- Hard-code test data across tests
- Skip error case testing
- Ignore status codes
- Test implementation details
- Make real external API calls
- Leave test data in production databases
