# Express.js Kit

Claude Code kit for Express.js framework patterns and middleware.

## Features

### Skills

**express** - Express.js framework-specific patterns

Includes patterns for:
- Clean route definitions (routes delegate to controllers)
- BaseController pattern with Sentry integration
- Middleware patterns (auth, audit with AsyncLocalStorage, error boundaries)
- Middleware ordering and composition
- Request/Response handling with TypeScript
- HTTP status codes and error handling
- Express-specific APIs and utilities

### Agents

**auth-route-tester** - Test authenticated API routes with cookie-based auth

Specializes in:
- Testing JWT cookie-based authentication
- Verifying route functionality
- Creating test workflows
- Database record validation

**auth-route-debugger** - Debug authentication and route issues

Specializes in:
- 401/403 error debugging
- Cookie and JWT token issues
- Route registration problems
- Authentication flow debugging

## Installation

The Express kit is automatically detected if your project has Express in `package.json`:

```bash
npx claude-code-setup --yes
```

Or install explicitly:

```bash
npx claude-code-setup --kit express,nodejs,prisma
```

**Note:** Express kit requires the `nodejs` kit for core backend patterns.

## Auto-Activation

This skill activates when:

**Keywords:** backend, controller, service, route, API, endpoint, middleware, validation, Prisma, Express

**Intent Patterns:**
- "create a route"
- "add an endpoint"
- "implement a controller"
- "setup database access"

**File Patterns:**
- Editing .ts files in backend directories
- Files importing from 'express'
- Files exporting Controllers or Services

## Tech Stack

- **Express.js:** 4.x
- **TypeScript:** 5+
- **Prisma:** ORM for database access
- **Sentry:** Error tracking
- **Zod:** Schema validation
- **Node.js:** 18+

## Key Patterns

### Controller

```typescript
import { BaseController } from './BaseController';

export class PostController extends BaseController {
  constructor(private postService: PostService) {
    super();
  }

  async getPosts(req: Request, res: Response) {
    return this.handleRequest(req, res, async () => {
      const posts = await this.postService.getAllPosts();
      return { posts };
    });
  }
}
```

### Service

```typescript
export class PostService {
  constructor(private postRepository: PostRepository) {}

  async getAllPosts(): Promise<Post[]> {
    return this.postRepository.findAll();
  }
}
```

### Route

```typescript
import { Router } from 'express';

const router = Router();

router.get('/posts', postController.getPosts.bind(postController));
router.post('/posts', validate(postSchema), postController.createPost.bind(postController));

export default router;
```

## Related Kits

- **nodejs** - Core Node.js backend patterns (required)
- **prisma** - Prisma ORM database patterns
- **sentry** - Sentry error tracking (coming soon)

## Dependencies

This kit works best with:
- `nodejs` kit - Core backend architecture patterns
- `prisma` kit - If using Prisma for database access

## Documentation

See `skills/express/SKILL.md` for complete documentation.
