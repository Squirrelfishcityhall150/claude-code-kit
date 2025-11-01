# Express.js Backend Plugin

Claude Code plugin for Express.js backend development with TypeScript.

## Features

### Skills

**backend-dev-guidelines** - Comprehensive Node.js/Express/TypeScript development patterns

Includes patterns for:
- Layered architecture (Routes → Controllers → Services → Repositories)
- BaseController pattern for consistent error handling
- Service layer with dependency injection
- Repository pattern for database access
- Zod validation schemas
- Sentry error tracking integration
- UnifiedConfig pattern for configuration
- Middleware patterns (auth, audit, error handling)
- Async/await patterns and error handling
- Testing strategies

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

```bash
claude-code-cli init --backend express
```

Or add to existing installation:

```bash
claude-code-cli plugin install express
```

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

## Related Plugins

- **sentry** - Error tracking integration
- **prisma** - Database ORM patterns

## Documentation

See `skills/backend-dev-guidelines/SKILL.md` for complete documentation.
