# Navigation Patterns for TanStack Router

## Link Component

### Basic Link Usage

```typescript
import { Link } from '@tanstack/react-router';

// Simple link
<Link to="/about">About Us</Link>

// Link with params
<Link
  to="/posts/$postId"
  params={{ postId: '123' }}
>
  View Post
</Link>

// Link with search params
<Link
  to="/posts"
  search={{ filter: 'published', sort: 'date', page: 1 }}
>
  Published Posts
</Link>

// Link with hash
<Link to="/docs" hash="installation">
  Installation Docs
</Link>
```

### Active Link Styling

```typescript
// Using activeProps
<Link
  to="/dashboard"
  activeProps={{
    className: 'active-link',
    style: { fontWeight: 'bold', color: 'blue' }
  }}
>
  Dashboard
</Link>

// Using activeOptions
<Link
  to="/posts"
  activeOptions={{
    exact: true,  // Only active on exact match
    includeSearch: false  // Ignore search params
  }}
  activeProps={{
    className: 'active'
  }}
>
  Posts
</Link>

// Custom active check
<Link
  to="/posts"
  activeProps={(isActive) => ({
    className: isActive ? 'bg-blue-500' : 'bg-gray-200'
  })}
>
  Posts
</Link>
```

### Inactive Link Styling

```typescript
<Link
  to="/archive"
  inactiveProps={{
    className: 'text-gray-400',
    style: { opacity: 0.6 }
  }}
>
  Archive
</Link>
```

### Preloading on Hover

```typescript
<Link
  to="/posts/$postId"
  params={{ postId: '123' }}
  preload="intent"  // Preload on hover/focus
>
  View Post
</Link>

// Options: false | 'intent' | 'viewport' | 'render'
// - false: No preloading
// - intent: Preload on hover/focus
// - viewport: Preload when in viewport
// - render: Preload immediately on render
```

### Disabled Links

```typescript
<Link
  to="/premium"
  disabled={!isPremiumUser}
  activeProps={{
    className: isPremiumUser ? 'active' : 'disabled'
  }}
>
  Premium Features
</Link>
```

## Programmatic Navigation

### useNavigate Hook

```typescript
import { useNavigate } from '@tanstack/react-router';

function MyComponent() {
  const navigate = useNavigate();

  const handleSubmit = () => {
    // Simple navigation
    navigate({ to: '/success' });
  };

  const handleEdit = (postId: string) => {
    // Navigate with params
    navigate({
      to: '/posts/$postId/edit',
      params: { postId }
    });
  };

  const handleFilter = () => {
    // Navigate with search params
    navigate({
      to: '/posts',
      search: { filter: 'published', page: 1 }
    });
  };

  const handleBack = () => {
    // Navigate back
    navigate({ to: '..' });
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Navigation with State

```typescript
function CreatePost() {
  const navigate = useNavigate();

  const handleCreate = async () => {
    const post = await createPost(formData);

    navigate({
      to: '/posts/$postId',
      params: { postId: post.id },
      state: {
        successMessage: 'Post created successfully!'
      }
    });
  };
}

// In destination component
function PostDetails() {
  const location = useLocation();
  const message = location.state?.successMessage;

  return (
    <div>
      {message && <Alert>{message}</Alert>}
      {/* ... */}
    </div>
  );
}
```

### Replace vs Push

```typescript
// Push to history (default)
navigate({ to: '/posts' });

// Replace current history entry
navigate({ to: '/posts', replace: true });

// Useful for redirects after form submission
const handleLogin = async () => {
  await login(credentials);
  navigate({ to: '/dashboard', replace: true });
};
```

### Relative Navigation

```typescript
// From /posts/123
navigate({ to: '..' });           // Goes to /posts
navigate({ to: '../..' });        // Goes to /
navigate({ to: './edit' });       // Goes to /posts/123/edit
navigate({ to: 'comments' });     // Goes to /posts/123/comments
```

## Router Hook

### useRouter

```typescript
import { useRouter } from '@tanstack/react-router';

function Component() {
  const router = useRouter();

  // Navigate
  router.navigate({ to: '/posts' });

  // Get current route
  const currentRoute = router.state.location.pathname;

  // Invalidate route
  router.invalidate();

  // Preload route
  router.preloadRoute({
    to: '/posts/$postId',
    params: { postId: '123' }
  });

  // Match route
  const match = router.matchRoute({ to: '/posts/$postId' });

  return <div>{currentRoute}</div>;
}
```

### Route Matching

```typescript
import { useMatches, useMatchRoute } from '@tanstack/react-router';

function Breadcrumbs() {
  const matches = useMatches();

  return (
    <div>
      {matches.map((match) => (
        <span key={match.id}>
          {match.context.breadcrumb} /
        </span>
      ))}
    </div>
  );
}

function NavItem({ to }: { to: string }) {
  const matchRoute = useMatchRoute();
  const isActive = matchRoute({ to, fuzzy: true });

  return (
    <Link
      to={to}
      className={isActive ? 'active' : ''}
    >
      Item
    </Link>
  );
}
```

## Search Param Management

### Updating Search Params

```typescript
import { useNavigate, useSearch } from '@tanstack/react-router';

function FilteredList() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/posts' });

  const updateFilter = (filter: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        filter,
        page: 1  // Reset page when filter changes
      })
    });
  };

  const updatePage = (page: number) => {
    navigate({
      search: (prev) => ({ ...prev, page })
    });
  };

  return (
    <div>
      <select
        value={search.filter}
        onChange={(e) => updateFilter(e.target.value)}
      >
        <option value="all">All</option>
        <option value="published">Published</option>
      </select>

      <button onClick={() => updatePage(search.page + 1)}>
        Next Page
      </button>
    </div>
  );
}
```

### Search Param Validation

```typescript
import { z } from 'zod';

const searchSchema = z.object({
  filter: z.enum(['all', 'published', 'draft']).default('all'),
  page: z.number().int().positive().default(1),
  sort: z.enum(['date', 'title']).default('date')
});

export const Route = createFileRoute('/posts')({
  validateSearch: searchSchema,
  component: PostsList
});

function PostsList() {
  const search = useSearch({ from: '/posts' });
  // search is type-safe and validated
  // search.filter is 'all' | 'published' | 'draft'
  // search.page is number
  // search.sort is 'date' | 'title'
}
```

## Navigation Guards

### Confirmation Before Navigation

```typescript
function UnsavedForm() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleNavigateAway = (to: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Leave anyway?');
      if (!confirmed) return;
    }
    navigate({ to });
  };

  return <Form onChange={() => setHasUnsavedChanges(true)} />;
}
```

### Authenticated Navigation

```typescript
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href  // Return here after login
        }
      });
    }
  }
});

// Login component
function Login() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });

  const handleLogin = async () => {
    await loginUser();
    const redirectTo = search.redirect || '/dashboard';
    navigate({ to: redirectTo });
  };
}
```

## Advanced Navigation Patterns

### Multi-Step Forms

```typescript
function MultiStepForm() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/signup' });
  const step = search.step || 1;

  const nextStep = () => {
    navigate({
      search: (prev) => ({ ...prev, step: step + 1 })
    });
  };

  const previousStep = () => {
    navigate({
      search: (prev) => ({ ...prev, step: step - 1 })
    });
  };

  return (
    <div>
      {step === 1 && <Step1 onNext={nextStep} />}
      {step === 2 && <Step2 onNext={nextStep} onBack={previousStep} />}
      {step === 3 && <Step3 onBack={previousStep} />}
    </div>
  );
}
```

### Modal Navigation

```typescript
function Posts() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/posts' });

  const openModal = (postId: string) => {
    navigate({
      search: (prev) => ({ ...prev, modal: postId })
    });
  };

  const closeModal = () => {
    navigate({
      search: (prev) => {
        const { modal, ...rest } = prev;
        return rest;
      }
    });
  };

  return (
    <div>
      <PostList onPostClick={openModal} />
      {search.modal && (
        <Modal onClose={closeModal}>
          <PostDetails postId={search.modal} />
        </Modal>
      )}
    </div>
  );
}
```

### Optimistic Navigation

```typescript
function PostActions({ postId }: { postId: string }) {
  const navigate = useNavigate();
  const router = useRouter();

  const handleDelete = async () => {
    // Navigate immediately (optimistic)
    navigate({ to: '/posts' });

    try {
      await deletePost(postId);
    } catch (error) {
      // Revert navigation on error
      navigate({ to: '/posts/$postId', params: { postId } });
      router.invalidate();
    }
  };

  return <button onClick={handleDelete}>Delete</button>;
}
```

## Best Practices

### 1. Use Type-Safe Links
Always use the `Link` component with proper typing for params and search.

### 2. Preload Intentionally
Use `preload="intent"` for frequently accessed routes.

### 3. Validate Search Params
Use Zod schemas to validate and type search parameters.

### 4. Handle Navigation Errors
Always handle potential navigation errors (auth redirects, not found, etc.).

### 5. Use Relative Navigation
Prefer relative navigation (`to: '..'`) over absolute paths when appropriate.

### 6. Centralize Route Definitions
Define route paths in a central location for easier refactoring.

```typescript
// routes.ts
export const ROUTES = {
  posts: {
    list: '/posts',
    detail: (id: string) => `/posts/${id}`,
    edit: (id: string) => `/posts/${id}/edit`
  }
} as const;

// Usage
<Link to={ROUTES.posts.detail('123')}>View Post</Link>
```
