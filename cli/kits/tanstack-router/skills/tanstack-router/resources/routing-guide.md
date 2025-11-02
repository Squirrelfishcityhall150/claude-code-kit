# Advanced Routing Guide for TanStack Router

## File-Based Routing Patterns

### Route File Conventions

```
routes/
├── __root.tsx                    # Root layout
├── index.tsx                     # /
├── about.tsx                     # /about
├── posts/
│   ├── index.tsx                # /posts
│   ├── $postId.tsx              # /posts/:postId
│   └── $postId/
│       ├── edit.tsx             # /posts/:postId/edit
│       └── comments.tsx         # /posts/:postId/comments
├── users/
│   ├── $userId.tsx              # /users/:userId
│   └── $userId.settings.tsx     # /users/:userId/settings
└── _layout/                      # Layout route (no path)
    ├── dashboard.tsx            # /dashboard (uses _layout)
    └── settings.tsx             # /settings (uses _layout)
```

### Dynamic Route Parameters

```typescript
// routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    return { post };
  },
  component: PostDetails
});

function PostDetails() {
  const { post } = Route.useLoaderData();
  return <div>{post.title}</div>;
}
```

### Catch-All Routes

```typescript
// routes/docs/$.tsx - Matches /docs/*
export const Route = createFileRoute('/docs/$')({
  component: DocsPage
});

function DocsPage() {
  const { _splat } = Route.useParams();
  // _splat contains the entire remaining path
  // e.g., for /docs/guide/getting-started, _splat = "guide/getting-started"
  return <DocContent path={_splat} />;
}
```

### Optional Parameters

```typescript
// routes/search/$term?.tsx - $term is optional
export const Route = createFileRoute('/search/$term')({
  component: SearchPage
});

function SearchPage() {
  const { term } = Route.useParams();
  // term might be undefined
  return <SearchResults query={term || ''} />;
}
```

## Route Nesting and Layouts

### Pathless Layout Routes

```typescript
// routes/_layout.tsx - Layout with no path
export const Route = createFileRoute('/_layout')({
  component: AuthLayout
});

function AuthLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  return (
    <div>
      <Sidebar />
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}

// routes/_layout/dashboard.tsx - Uses _layout, path is /dashboard
export const Route = createFileRoute('/_layout/dashboard')({
  component: Dashboard
});
```

### Nested Layouts

```typescript
// routes/_app.tsx
export const Route = createFileRoute('/_app')({
  component: AppLayout
});

function AppLayout() {
  return (
    <div>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

// routes/_app/_authenticated.tsx - Nested under _app
export const Route = createFileRoute('/_app/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => <Outlet />
});

// routes/_app/_authenticated/profile.tsx - Path is /profile
export const Route = createFileRoute('/_app/_authenticated/profile')({
  component: ProfilePage
});
```

## Route Context

### Providing Context

```typescript
// routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';

interface RouterContext {
  auth: AuthService;
  queryClient: QueryClient;
}

export const Route = createRootRoute<RouterContext>({
  component: () => <Outlet />,
  context: () => ({
    auth: authService,
    queryClient
  })
});
```

### Consuming Context

```typescript
// routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context }) => {
    // Access auth from context
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  loader: async ({ context }) => {
    // Use queryClient from context
    const data = await context.queryClient.fetchQuery({
      queryKey: ['dashboard'],
      queryFn: fetchDashboardData
    });
    return { data };
  },
  component: DashboardPage
});
```

## Route Matching

### Route Rank

Routes are matched in this order:
1. Static routes (exact match)
2. Dynamic routes (with params)
3. Catch-all routes

```typescript
// Higher priority
/posts/new                    // Static
/posts/$postId                // Dynamic
/posts/*                      // Catch-all (lowest priority)
```

### Route Preloading

```typescript
import { useRouter } from '@tanstack/react-router';

function PostLink({ postId }: { postId: string }) {
  const router = useRouter();

  const handleMouseEnter = () => {
    // Preload route data on hover
    router.preloadRoute({
      to: '/posts/$postId',
      params: { postId }
    });
  };

  return (
    <Link
      to="/posts/$postId"
      params={{ postId }}
      onMouseEnter={handleMouseEnter}
    >
      View Post
    </Link>
  );
}
```

## Route Guards and Redirects

### Before Load Hook

```typescript
export const Route = createFileRoute('/admin/users')({
  beforeLoad: async ({ context, location }) => {
    const { auth } = context;

    // Check authentication
    if (!auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href
        }
      });
    }

    // Check permissions
    if (!auth.hasPermission('admin')) {
      throw redirect({ to: '/forbidden' });
    }
  },
  component: AdminUsersPage
});
```

### Conditional Redirects

```typescript
export const Route = createFileRoute('/posts/$postId/edit')({
  beforeLoad: async ({ params, context }) => {
    const post = await fetchPost(params.postId);
    const canEdit = await context.auth.canEdit(post);

    if (!canEdit) {
      throw redirect({
        to: '/posts/$postId',
        params: { postId: params.postId }
      });
    }

    return { post };
  },
  component: EditPost
});
```

## Error Handling

### Route Error Boundaries

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }
    return { post };
  },
  errorComponent: ({ error }) => {
    if (error instanceof NotFoundError) {
      return <NotFound message={error.message} />;
    }
    return <ErrorFallback error={error} />;
  },
  component: PostDetails
});
```

### Pending Component

```typescript
export const Route = createFileRoute('/posts')({
  loader: async () => {
    const posts = await fetchPosts();
    return { posts };
  },
  pendingComponent: () => <LoadingSpinner />,
  component: PostsList
});
```

## Advanced Patterns

### Route Meta Tags

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    return { post };
  },
  meta: ({ loaderData }) => [
    { title: loaderData.post.title },
    { name: 'description', content: loaderData.post.excerpt },
    { property: 'og:title', content: loaderData.post.title },
    { property: 'og:image', content: loaderData.post.image }
  ],
  component: PostDetails
});
```

### Route Validation

```typescript
import { z } from 'zod';

const PostSearchSchema = z.object({
  filter: z.enum(['all', 'published', 'draft']).default('all'),
  sort: z.enum(['date', 'title', 'views']).default('date'),
  page: z.number().int().positive().default(1)
});

export const Route = createFileRoute('/posts')({
  validateSearch: (search) => PostSearchSchema.parse(search),
  loader: async ({ search }) => {
    // search is now type-safe and validated
    const posts = await fetchPosts(search);
    return { posts };
  },
  component: PostsList
});
```

### Parallel Data Loading

```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    // Load all data in parallel
    const [stats, recentPosts, notifications, user] = await Promise.all([
      fetchStats(),
      fetchRecentPosts(),
      fetchNotifications(),
      fetchUser(context.auth.userId)
    ]);

    return { stats, recentPosts, notifications, user };
  },
  component: Dashboard
});
```

## Best Practices

### 1. Use File-Based Routing
Prefer file-based routing over manual route configuration for better organization and type safety.

### 2. Colocate Route Data Loading
Keep loaders close to the components that use them for better maintainability.

### 3. Handle Loading and Error States
Always provide `pendingComponent` and `errorComponent` for better UX.

### 4. Validate Search Params
Use Zod or similar for runtime validation of search parameters.

### 5. Preload Critical Routes
Preload routes on hover or mount for faster navigation.

### 6. Use Layouts Effectively
Leverage pathless layouts (_layout) to avoid prop drilling and centralize auth logic.
