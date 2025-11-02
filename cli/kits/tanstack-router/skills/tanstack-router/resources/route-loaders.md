# Route Loaders - Complex Data Loading Patterns

## Basic Loader Patterns

### Simple Data Fetching

```typescript
export const Route = createFileRoute('/posts')({
  loader: async () => {
    const posts = await fetchPosts();
    return { posts };
  },
  component: PostsList
});

function PostsList() {
  const { posts } = Route.useLoaderData();
  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### Loader with Parameters

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);
    return { post };
  },
  component: PostDetails
});
```

### Loader with Search Params

```typescript
export const Route = createFileRoute('/posts')({
  validateSearch: z.object({
    filter: z.enum(['all', 'published']).default('all'),
    page: z.number().default(1)
  }),
  loader: async ({ search }) => {
    const posts = await fetchPosts({
      filter: search.filter,
      page: search.page
    });
    return { posts };
  },
  component: PostsList
});
```

## Advanced Loader Patterns

### Parallel Data Loading

```typescript
export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    // Load multiple resources in parallel
    const [user, stats, recentPosts, notifications] = await Promise.all([
      fetchUser(context.userId),
      fetchStats(),
      fetchRecentPosts(),
      fetchNotifications()
    ]);

    return { user, stats, recentPosts, notifications };
  },
  component: Dashboard
});
```

### Dependent Data Loading

```typescript
export const Route = createFileRoute('/users/$userId/posts')({
  loader: async ({ params }) => {
    // First, fetch the user
    const user = await fetchUser(params.userId);

    // Then fetch posts for that user (depends on user existing)
    const posts = await fetchUserPosts(user.id);

    // Then fetch the user's settings (depends on user)
    const settings = await fetchUserSettings(user.id);

    return { user, posts, settings };
  },
  component: UserPosts
});
```

### Conditional Loading

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, context }) => {
    const post = await fetchPost(params.postId);

    // Only fetch comments if user is authenticated
    const comments = context.auth.isAuthenticated
      ? await fetchComments(params.postId)
      : [];

    // Only fetch edit history if user can edit
    const history = context.auth.canEdit(post)
      ? await fetchEditHistory(params.postId)
      : null;

    return { post, comments, history };
  },
  component: PostDetails
});
```

## Error Handling in Loaders

### Throwing Errors

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);

    if (!post) {
      throw new NotFoundError(`Post ${params.postId} not found`);
    }

    if (post.status === 'draft' && !context.auth.isAdmin) {
      throw new ForbiddenError('You cannot view draft posts');
    }

    return { post };
  },
  errorComponent: ({ error }) => {
    if (error instanceof NotFoundError) {
      return <NotFound message={error.message} />;
    }
    if (error instanceof ForbiddenError) {
      return <Forbidden message={error.message} />;
    }
    return <ErrorFallback error={error} />;
  },
  component: PostDetails
});
```

### Try-Catch in Loaders

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    try {
      const post = await fetchPost(params.postId);
      return { post, error: null };
    } catch (error) {
      console.error('Failed to load post:', error);
      return {
        post: null,
        error: error.message || 'Failed to load post'
      };
    }
  },
  component: PostDetails
});

function PostDetails() {
  const { post, error } = Route.useLoaderData();

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return <div>{post.title}</div>;
}
```

## Loader Context

### Accessing Router Context

```typescript
// Define context type in root
interface RouterContext {
  auth: AuthService;
  queryClient: QueryClient;
  supabase: SupabaseClient;
}

export const Route = createRootRoute<RouterContext>({
  component: () => <Outlet />,
});

// Use context in loader
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, context }) => {
    const { data: post } = await context.supabase
      .from('posts')
      .select('*')
      .eq('id', params.postId)
      .single();

    return { post };
  },
  component: PostDetails
});
```

### Providing Custom Context

```typescript
export const Route = createFileRoute('/posts')({
  beforeLoad: ({ context }) => {
    return {
      ...context,
      postService: new PostService(context.supabase)
    };
  },
  loader: async ({ context }) => {
    // context.postService is now available
    const posts = await context.postService.getAll();
    return { posts };
  },
  component: PostsList
});
```

## Integration with TanStack Query

### Using Query Client in Loaders

```typescript
import { queryClient } from './queryClient';

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, context }) => {
    // Use TanStack Query for caching
    const post = await context.queryClient.fetchQuery({
      queryKey: ['post', params.postId],
      queryFn: () => fetchPost(params.postId),
      staleTime: 5 * 60 * 1000  // 5 minutes
    });

    return { post };
  },
  component: PostDetails
});
```

### Prefetching Related Data

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, context }) => {
    const { queryClient } = context;

    // Fetch main data
    const post = await queryClient.fetchQuery({
      queryKey: ['post', params.postId],
      queryFn: () => fetchPost(params.postId)
    });

    // Prefetch related data (don't await)
    queryClient.prefetchQuery({
      queryKey: ['comments', params.postId],
      queryFn: () => fetchComments(params.postId)
    });

    queryClient.prefetchQuery({
      queryKey: ['author', post.authorId],
      queryFn: () => fetchAuthor(post.authorId)
    });

    return { post };
  },
  component: PostDetails
});
```

## Loader Optimization

### Caching Loader Results

```typescript
const postCache = new Map<string, Post>();

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    // Check cache first
    if (postCache.has(params.postId)) {
      return { post: postCache.get(params.postId)! };
    }

    const post = await fetchPost(params.postId);
    postCache.set(params.postId, post);

    return { post };
  },
  component: PostDetails
});
```

### Deduplicating Requests

```typescript
const pendingRequests = new Map<string, Promise<Post>>();

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    // If already fetching this post, return the same promise
    if (pendingRequests.has(params.postId)) {
      const post = await pendingRequests.get(params.postId)!;
      return { post };
    }

    // Create new request
    const promise = fetchPost(params.postId);
    pendingRequests.set(params.postId, promise);

    try {
      const post = await promise;
      return { post };
    } finally {
      pendingRequests.delete(params.postId);
    }
  },
  component: PostDetails
});
```

### Stale-While-Revalidate Pattern

```typescript
export const Route = createFileRoute('/posts')({
  loader: async ({ context }) => {
    return await context.queryClient.fetchQuery({
      queryKey: ['posts'],
      queryFn: fetchPosts,
      staleTime: 5 * 60 * 1000,  // Consider fresh for 5 mins
      gcTime: 10 * 60 * 1000,  // Keep in cache for 10 mins
    });
  },
  component: PostsList
});
```

## Loader Redirects

### Conditional Redirects

```typescript
export const Route = createFileRoute('/admin')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAdmin) {
      throw redirect({ to: '/' });
    }
  },
  loader: async () => {
    const adminData = await fetchAdminData();
    return { adminData };
  },
  component: AdminDashboard
});
```

### Redirect After Data Load

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId);

    // Redirect if post is deleted
    if (post.status === 'deleted') {
      throw redirect({ to: '/posts' });
    }

    // Redirect to canonical URL if slug doesn't match
    if (post.slug !== params.postId) {
      throw redirect({
        to: '/posts/$postId',
        params: { postId: post.slug }
      });
    }

    return { post };
  },
  component: PostDetails
});
```

## Loader Abort Signals

### Canceling Requests

```typescript
export const Route = createFileRoute('/posts')({
  loader: async ({ abortController }) => {
    // Pass abort signal to fetch
    const posts = await fetch('/api/posts', {
      signal: abortController.signal
    }).then(res => res.json());

    return { posts };
  },
  component: PostsList
});
```

### Cleanup on Navigation

```typescript
export const Route = createFileRoute('/long-running-task')({
  loader: async ({ abortController }) => {
    const task = startLongRunningTask();

    // Clean up if user navigates away
    abortController.signal.addEventListener('abort', () => {
      task.cancel();
    });

    const result = await task.wait();
    return { result };
  },
  component: TaskResults
});
```

## Best Practices

### 1. Keep Loaders Pure
Loaders should be pure functions without side effects (except data fetching).

```typescript
// ✅ Good
loader: async ({ params }) => {
  const data = await fetchData(params.id);
  return { data };
}

// ❌ Bad (has side effects)
loader: async ({ params }) => {
  const data = await fetchData(params.id);
  updateGlobalState(data);  // Side effect!
  return { data };
}
```

### 2. Handle Loading and Error States

```typescript
export const Route = createFileRoute('/posts')({
  loader: async () => {
    const posts = await fetchPosts();
    return { posts };
  },
  pendingComponent: () => <LoadingSpinner />,
  errorComponent: ({ error }) => <ErrorMessage error={error} />,
  component: PostsList
});
```

### 3. Use Context for Shared Services

Don't create new service instances in loaders; use context:

```typescript
// ✅ Good
loader: async ({ context }) => {
  return await context.postService.getAll();
}

// ❌ Bad
loader: async () => {
  const service = new PostService();  // Creating instance in loader
  return await service.getAll();
}
```

### 4. Optimize with Parallel Loading

```typescript
// ✅ Good (parallel)
const [user, posts] = await Promise.all([
  fetchUser(id),
  fetchPosts(id)
]);

// ❌ Bad (sequential)
const user = await fetchUser(id);
const posts = await fetchPosts(id);
```

### 5. Type Loader Return Values

```typescript
interface PostLoaderData {
  post: Post;
  comments: Comment[];
}

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }): Promise<PostLoaderData> => {
    const [post, comments] = await Promise.all([
      fetchPost(params.postId),
      fetchComments(params.postId)
    ]);
    return { post, comments };
  },
  component: PostDetails
});
```
