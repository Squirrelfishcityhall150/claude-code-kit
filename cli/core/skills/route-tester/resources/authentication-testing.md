# Authentication Testing

## Authentication Patterns

### 1. JWT Cookie Authentication

The most common pattern for web applications - JWT stored in HTTP-only cookies.

#### Basic Setup
```typescript
describe('JWT Cookie Authentication', () => {
  let authCookie: string;
  let userCookie: string;
  let adminCookie: string;

  beforeEach(async () => {
    // Admin user
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123'
      });
    adminCookie = adminResponse.headers['set-cookie'][0];

    // Regular user
    const userResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'user123'
      });
    userCookie = userResponse.headers['set-cookie'][0];
  });

  it('should set HTTP-only cookie on login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();

    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure'); // Should be present in production
    expect(cookie).toContain('SameSite');
  });

  it('should access protected route with valid cookie', async () => {
    const response = await request(app)
      .get('/api/protected/profile')
      .set('Cookie', userCookie);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
  });

  it('should reject access without cookie', async () => {
    const response = await request(app)
      .get('/api/protected/profile');

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/unauthorized|authentication required/i);
  });
});
```

#### Cookie Security Attributes
```typescript
describe('Cookie Security', () => {
  it('should set Secure flag in production', async () => {
    process.env.NODE_ENV = 'production';

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('Secure');
  });

  it('should set SameSite attribute', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toMatch(/SameSite=(Strict|Lax)/);
  });

  it('should set appropriate expiration', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('Max-Age=');
    // Or: expect(cookie).toContain('Expires=');
  });
});
```

### 2. JWT Bearer Token Authentication

Common for mobile apps and API-to-API communication.

```typescript
describe('Bearer Token Authentication', () => {
  let token: string;
  let adminToken: string;

  beforeEach(async () => {
    // Get user token
    const userResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'password123' });
    token = userResponse.body.token;

    // Get admin token
    const adminResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    adminToken = adminResponse.body.token;
  });

  it('should return token on successful login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/); // JWT format
  });

  it('should authenticate with Bearer token', async () => {
    const response = await request(app)
      .get('/api/protected/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it('should reject missing Authorization header', async () => {
    const response = await request(app)
      .get('/api/protected/profile');

    expect(response.status).toBe(401);
  });

  it('should reject malformed Authorization header', async () => {
    const response = await request(app)
      .get('/api/protected/profile')
      .set('Authorization', 'InvalidFormat');

    expect(response.status).toBe(401);
  });

  it('should reject invalid token', async () => {
    const response = await request(app)
      .get('/api/protected/profile')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(response.status).toBe(401);
  });
});
```

### 3. API Key Authentication

Simple authentication for server-to-server communication.

```typescript
describe('API Key Authentication', () => {
  const validApiKey = 'sk_test_abc123xyz';

  it('should authenticate with valid API key', async () => {
    const response = await request(app)
      .get('/api/data')
      .set('X-API-Key', validApiKey);

    expect(response.status).toBe(200);
  });

  it('should reject missing API key', async () => {
    const response = await request(app).get('/api/data');

    expect(response.status).toBe(401);
  });

  it('should reject invalid API key', async () => {
    const response = await request(app)
      .get('/api/data')
      .set('X-API-Key', 'invalid-key');

    expect(response.status).toBe(401);
  });

  it('should rate limit by API key', async () => {
    const requests = Array(101).fill(null).map(() =>
      request(app).get('/api/data').set('X-API-Key', validApiKey)
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

## Authorization (Role-Based Access Control)

### Testing Permission Levels

```typescript
describe('Role-Based Authorization', () => {
  let userCookie: string;
  let adminCookie: string;
  let moderatorCookie: string;

  beforeEach(async () => {
    userCookie = await loginAs('user@example.com', 'password');
    adminCookie = await loginAs('admin@example.com', 'password');
    moderatorCookie = await loginAs('moderator@example.com', 'password');
  });

  describe('User Permissions', () => {
    it('should allow user to read own profile', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Cookie', userCookie);

      expect(response.status).toBe(200);
    });

    it('should allow user to update own profile', async () => {
      const response = await request(app)
        .patch('/api/profile')
        .set('Cookie', userCookie)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
    });

    it('should forbid user from reading other profiles', async () => {
      const response = await request(app)
        .get('/api/users/other-user-id')
        .set('Cookie', userCookie);

      expect(response.status).toBe(403);
    });

    it('should forbid user from accessing admin routes', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Cookie', userCookie);

      expect(response.status).toBe(403);
    });
  });

  describe('Moderator Permissions', () => {
    it('should allow moderator to read user profiles', async () => {
      const response = await request(app)
        .get('/api/users/any-user-id')
        .set('Cookie', moderatorCookie);

      expect(response.status).toBe(200);
    });

    it('should allow moderator to update user content', async () => {
      const response = await request(app)
        .patch('/api/posts/123')
        .set('Cookie', moderatorCookie)
        .send({ status: 'approved' });

      expect(response.status).toBe(200);
    });

    it('should forbid moderator from deleting users', async () => {
      const response = await request(app)
        .delete('/api/users/123')
        .set('Cookie', moderatorCookie);

      expect(response.status).toBe(403);
    });
  });

  describe('Admin Permissions', () => {
    it('should allow admin full access', async () => {
      const endpoints = [
        '/api/admin/users',
        '/api/admin/settings',
        '/api/users/123',
        '/api/admin/stats'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Cookie', adminCookie);

        expect(response.status).not.toBe(403);
      }
    });

    it('should allow admin to delete users', async () => {
      const response = await request(app)
        .delete('/api/users/123')
        .set('Cookie', adminCookie);

      expect(response.status).toBe(204);
    });
  });
});
```

## Token Expiration and Refresh

```typescript
describe('Token Expiration', () => {
  it('should reject expired token', async () => {
    // Create token with short expiration
    const shortLivedToken = createTestToken({ expiresIn: '1ms' });

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));

    const response = await request(app)
      .get('/api/protected/profile')
      .set('Authorization', `Bearer ${shortLivedToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/expired|invalid/i);
  });

  it('should refresh token with valid refresh token', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const refreshToken = loginResponse.body.refreshToken;

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toHaveProperty('token');
    expect(refreshResponse.body.token).not.toBe(loginResponse.body.token);
  });

  it('should reject invalid refresh token', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-refresh-token' });

    expect(response.status).toBe(401);
  });

  it('should invalidate refresh token after use (one-time use)', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const refreshToken = loginResponse.body.refreshToken;

    // First refresh - should work
    const firstRefresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(firstRefresh.status).toBe(200);

    // Second refresh with same token - should fail
    const secondRefresh = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(secondRefresh.status).toBe(401);
  });
});
```

## Login/Logout Flow Testing

```typescript
describe('Authentication Flow', () => {
  it('should complete full login-use-logout cycle', async () => {
    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(loginResponse.status).toBe(200);

    const authCookie = loginResponse.headers['set-cookie'][0];

    // Use authenticated endpoint
    const profileResponse = await request(app)
      .get('/api/profile')
      .set('Cookie', authCookie);
    expect(profileResponse.status).toBe(200);

    // Logout
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', authCookie);
    expect(logoutResponse.status).toBe(200);

    // Verify token is invalidated
    const afterLogoutResponse = await request(app)
      .get('/api/profile')
      .set('Cookie', authCookie);
    expect(afterLogoutResponse.status).toBe(401);
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/invalid credentials|unauthorized/i);
  });

  it('should handle non-existent user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(response.status).toBe(401);
    // Should NOT reveal that user doesn't exist (security)
    expect(response.body.error).toMatch(/invalid credentials/i);
  });
});
```

## Session Management

```typescript
describe('Session Management', () => {
  it('should create session on login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('should maintain session across requests', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const cookie = loginResponse.headers['set-cookie'][0];

    // Multiple requests with same session
    const request1 = await request(app).get('/api/profile').set('Cookie', cookie);
    const request2 = await request(app).get('/api/data').set('Cookie', cookie);
    const request3 = await request(app).get('/api/settings').set('Cookie', cookie);

    expect(request1.status).toBe(200);
    expect(request2.status).toBe(200);
    expect(request3.status).toBe(200);
  });

  it('should destroy session on logout', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    const cookie = loginResponse.headers['set-cookie'][0];

    await request(app).post('/api/auth/logout').set('Cookie', cookie);

    const response = await request(app).get('/api/profile').set('Cookie', cookie);

    expect(response.status).toBe(401);
  });
});
```

## Security Testing

```typescript
describe('Security', () => {
  it('should prevent timing attacks on login', async () => {
    // Login attempts should take similar time regardless of whether user exists
    const validUserStart = Date.now();
    await request(app).post('/api/auth/login')
      .send({ email: 'exists@example.com', password: 'wrong' });
    const validUserTime = Date.now() - validUserStart;

    const invalidUserStart = Date.now();
    await request(app).post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrong' });
    const invalidUserTime = Date.now() - invalidUserStart;

    // Times should be within 100ms of each other
    expect(Math.abs(validUserTime - invalidUserTime)).toBeLessThan(100);
  });

  it('should rate limit login attempts', async () => {
    const attempts = Array(10).fill(null).map(() =>
      request(app).post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
    );

    const responses = await Promise.all(attempts);
    const rateLimited = responses.some(r => r.status === 429);

    expect(rateLimited).toBe(true);
  });

  it('should not leak information about user existence', async () => {
    const existingUserResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'exists@example.com', password: 'wrong' });

    const nonExistentUserResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrong' });

    // Error messages should be identical
    expect(existingUserResponse.body.error).toBe(nonExistentUserResponse.body.error);
  });
});
```

## Helper Functions

```typescript
// Reusable auth helpers
async function loginAs(email: string, password: string): Promise<string> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response.headers['set-cookie'][0];
}

function createTestToken(options: { expiresIn?: string } = {}): string {
  // Create JWT for testing
  return jwt.sign(
    { userId: 'test-user-id', role: 'user' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: options.expiresIn || '1h' }
  );
}

async function createAuthenticatedUser(role: string = 'user') {
  const user = await createTestUser({ role });
  const cookie = await loginAs(user.email, 'password123');
  return { user, cookie };
}
```

## Best Practices

✅ **Do:**
- Test both authentication (who are you?) and authorization (what can you do?)
- Test token/session expiration
- Test logout properly clears sessions
- Test rate limiting on auth endpoints
- Verify security attributes on cookies (HttpOnly, Secure, SameSite)
- Test role-based access control thoroughly
- Use timing-safe comparisons to prevent timing attacks

❌ **Don't:**
- Hard-code credentials in tests (use environment variables or test fixtures)
- Leak information about user existence in error messages
- Skip testing edge cases (expired tokens, malformed headers, etc.)
- Share authentication state between tests
- Use production auth services in tests
- Store passwords in plain text (even in tests)
