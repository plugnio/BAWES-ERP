# Next.js SDK Integration Guide

This guide explains how to properly integrate and use the BAWES ERP SDK in a Next.js application, following App Router and best practices.

## Project Structure

```
src/
├── lib/
│   └── sdk/
│       ├── api-client.ts   # API client configuration
│       └── config.ts       # SDK configuration
├── components/
│   ├── auth/
│   │   ├── AuthGuard.tsx
│   │   ├── LoginForm.tsx
│   │   └── LogoutButton.tsx
│   ├── permissions/
│   │   ├── PermissionGuard.tsx
│   │   └── RoleBasedAccess.tsx
│   ├── person/
│   │   ├── PersonForm.tsx
│   │   ├── PersonList.tsx
│   │   └── PersonDetails.tsx
│   └── ui/
│       ├── Loading.tsx
│       └── ErrorBoundary.tsx
├── services/
│   ├── index.ts           # Service registry
│   ├── base.service.ts    # Base service class
│   ├── auth.service.ts    # Authentication service
│   ├── permissions.service.ts
│   └── person.service.ts
├── hooks/
│   ├── useServices.ts     # Service hooks
│   ├── useAuth.ts         # Authentication hooks
│   ├── usePermissions.ts  # Permission hooks
│   └── usePerson.ts       # Person entity hooks
├── types/
│   ├── api.ts            # API response types
│   ├── auth.ts           # Auth types
│   └── person.ts         # Person entity types
└── app/
    ├── (auth)/           # Protected routes
    │   ├── layout.tsx    # Auth layout with guard
    │   ├── dashboard/
    │   │   └── page.tsx
    │   └── person/
    │       ├── page.tsx
    │       ├── [id]/
    │       │   └── page.tsx
    │       └── create/
    │           └── page.tsx
    └── (public)/         # Public routes
        ├── layout.tsx    # Public layout
        ├── page.tsx      # Landing page
        └── login/
            └── page.tsx
```

## SDK Client Setup

```typescript
// lib/sdk/config.ts
import { Configuration } from '@bawes/erp-api-sdk';

export const SDK_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  refreshThreshold: 60 * 1000, // Refresh 1 minute before expiry
};

// lib/sdk/api-client.ts
import {
  Configuration,
  AuthenticationApi,
  PermissionsApi,
  PersonApi,
  // Import other APIs as needed
} from '@bawes/erp-api-sdk';

class ApiClient {
  private static instance: ApiClient;
  private configuration: Configuration;
  private accessToken: string | null = null;

  // API instances
  readonly auth: AuthenticationApi;
  readonly permissions: PermissionsApi;
  readonly person: PersonApi;
  // Add other APIs as needed

  private constructor() {
    // Configuration with in-memory access token
    this.configuration = new Configuration({
      basePath: SDK_CONFIG.baseUrl,
      accessToken: () => this.accessToken || '',
      // No need to handle refresh token here as it's managed by HTTP-only cookie
    });

    // Initialize API instances
    this.auth = new AuthenticationApi(this.configuration);
    this.permissions = new PermissionsApi(this.configuration);
    this.person = new PersonApi(this.configuration);
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  reset() {
    this.accessToken = null;
    // Refresh token is handled by the backend via HTTP-only cookie
  }
}

export const getApiClient = () => ApiClient.getInstance();
export const resetApiClient = () => {
  const client = ApiClient.getInstance();
  client.reset();
};
```

## Service Layer

### Base Service

```typescript
// services/base.service.ts
import { getApiClient } from '@/lib/sdk/api-client';
import type { ApiClient } from '@/lib/sdk/api-client';

export class BaseService {
  protected client: ApiClient;

  constructor() {
    this.client = getApiClient();
  }

  protected handleError(error: any) {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Handle unauthorized - trigger refresh or redirect to login
    }
    
    throw error;
  }
}
```

### Authentication Service

```typescript
// services/auth.service.ts
import { BaseService } from './base.service';
import { SDK_CONFIG } from '@/lib/sdk/config';
import type { LoginDto, RegisterDto, VerifyEmailDto } from '@bawes/erp-api-sdk';

export class AuthService extends BaseService {
  private refreshTokenTimeout?: NodeJS.Timeout;

  async login(loginDto: LoginDto) {
    try {
      const response = await this.client.auth.authControllerLogin(loginDto);
      this.client.setAccessToken(response.data.access_token);
      this.setupRefreshToken(response.data.expires_in);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const response = await this.client.auth.authControllerRegister(registerDto);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async logout() {
    try {
      const response = await this.client.auth.authControllerLogout();
      this.client.setAccessToken(null);
      this.clearRefreshTokenTimeout();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async refresh() {
    try {
      const response = await this.client.auth.authControllerRefresh();
      this.client.setAccessToken(response.data.access_token);
      this.setupRefreshToken(response.data.expires_in);
      return response.data;
    } catch (error) {
      this.handleError(error);
      this.handleRefreshFailure();
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    try {
      return await this.client.auth.authControllerVerifyEmail(verifyEmailDto);
    } catch (error) {
      this.handleError(error);
    }
  }

  private setupRefreshToken(expiresIn: number) {
    this.clearRefreshTokenTimeout();
    const timeout = (expiresIn * 1000) - SDK_CONFIG.refreshThreshold;
    
    this.refreshTokenTimeout = setTimeout(() => {
      this.refresh().catch((error) => {
        console.error('Token refresh failed:', error);
        this.handleRefreshFailure();
      });
    }, timeout);
  }

  private handleRefreshFailure() {
    this.client.setAccessToken(null);
    this.clearRefreshTokenTimeout();
    // Redirect to login or show session expired message
  }

  private clearRefreshTokenTimeout() {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }
}
```

### Permissions Service

```typescript
// services/permissions.service.ts
import { BaseService } from './base.service';
import Decimal from 'decimal.js';

export class PermissionsService extends BaseService {
  private permissionMap: Record<string, Decimal> = {};

  async getDashboard() {
    try {
      const response = await this.client.permissions.permissionManagementControllerGetDashboard();
      this.updatePermissionMap(response.data);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getRoles() {
    try {
      const response = await this.client.permissions.permissionManagementControllerGetRoles();
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private updatePermissionMap(dashboard: any) {
    dashboard.categories.forEach((category: any) => {
      category.permissions.forEach((permission: any) => {
        this.permissionMap[permission.code] = new Decimal(permission.bitfield);
      });
    });
  }

  hasPermission(permissionCode: string, permissionBits: string): boolean {
    try {
      const userBits = new Decimal(permissionBits || '0');
      const permissionBitfield = this.permissionMap[permissionCode];

      if (!permissionBitfield) {
        console.warn(`Unknown permission: ${permissionCode}`);
        return false;
      }

      const divided = userBits.dividedToIntegerBy(permissionBitfield);
      const modulo = divided.modulo(2);
      return modulo.equals(1);
    } catch (err) {
      console.error('Permission check failed:', err);
      return false;
    }
  }
}
```

## Token Refresh Strategy

The SDK uses a token-based authentication system with automatic refresh:

1. **Access Token**
   - 15-minute lifetime
   - Stored in memory
   - Automatically included in API requests
   - Refreshed 1 minute before expiry

2. **Refresh Token**
   - 7-day lifetime
   - HTTP-only cookie
   - Managed by the backend
   - Used to obtain new access tokens

### Implementation Notes

1. **API Client**
   - Singleton pattern ensures one instance
   - Centralized token management
   - Automatic token injection into requests
   - Type-safe API methods

2. **Token Management**
   - NEVER store tokens in localStorage or sessionStorage
   - Access tokens should only be stored in memory
   - Refresh tokens must be in HTTP-only cookies
   - Clear access token on:
     - Logout
     - Window/tab close
     - Session timeout
   - Let the backend handle refresh token:
     - Setting
     - Clearing
     - Rotation
   - Implement proper token refresh strategy:
     - Refresh before expiry
     - Handle concurrent requests
     - Queue requests during refresh

3. **Error Handling**
   ```typescript
   // Example of error interceptor
   protected handleError(error: any) {
     if (error.response?.status === 401) {
       // Check if refresh is in progress
       if (!this.isRefreshing) {
         this.refresh().catch(() => {
           // Redirect to login on refresh failure
           window.location.href = '/login';
         });
       }
       // Queue failed request for retry
       return new Promise((resolve) => {
         this.failedRequests.push(() => {
           resolve(this.client.request(error.config));
         });
       });
     }
     throw error;
   }
   ```

## Usage Examples

### Authentication

```typescript
// hooks/useAuth.ts
import { useServices } from './useServices';
import type { LoginDto, RegisterDto, VerifyEmailDto } from '@bawes/erp-api-sdk';

export function useAuth() {
  const services = useServices();

  const login = async (loginDto: LoginDto) => {
    const response = await services.auth.login(loginDto);
    // Token refresh is handled automatically
    return response;
  };

  const register = async (registerDto: RegisterDto) => {
    return await services.auth.register(registerDto);
  };

  const logout = async () => {
    await services.auth.logout();
    // Tokens and timeouts are cleared automatically
  };

  const verifyEmail = async (verifyEmailDto: VerifyEmailDto) => {
    return await services.auth.verifyEmail(verifyEmailDto);
  };

  return { login, register, logout, verifyEmail };
}
```

### Permissions

```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const services = useServices();
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    services.permissions.getDashboard()
      .then(setPermissions)
      .catch(console.error);
  }, []);

  const hasPermission = useCallback((code: string) => {
    return services.permissions.hasPermission(
      code,
      services.auth.getUser()?.permissionBits
    );
  }, [permissions]);

  return { permissions, hasPermission };
}
```

## Best Practices

1. **SDK Usage**
   - Use the generated types
   - Handle API responses properly
   - Implement proper error handling
   - Use the service layer for business logic

2. **Token Management**
   - NEVER store tokens in localStorage or sessionStorage
   - Access tokens should only be stored in memory
   - Refresh tokens must be in HTTP-only cookies
   - Clear access token on:
     - Logout
     - Window/tab close
     - Session timeout
   - Let the backend handle refresh token:
     - Setting
     - Clearing
     - Rotation
   - Implement proper token refresh strategy:
     - Refresh before expiry
     - Handle concurrent requests
     - Queue requests during refresh

3. **Error Handling**
   - Handle 401 errors globally
   - Queue failed requests during refresh
   - Implement proper retry logic
   - Log errors appropriately

4. **Performance**
   - Use the singleton pattern
   - Implement request caching
   - Handle concurrent requests
   - Monitor API usage

## Troubleshooting

1. **Authentication Issues**
   - Check token expiration
   - Verify refresh token cookie
   - Check CORS settings
   - Monitor network requests

2. **API Errors**
   - Check request payload
   - Verify endpoint URLs
   - Check response types
   - Monitor error patterns

3. **Performance Issues**
   - Check request frequency
   - Monitor token refreshes
   - Optimize API calls
   - Implement caching

## Data Fetching Patterns

### Hooks vs. Direct Services

The guide demonstrates using hooks for data fetching, but when should you use hooks vs. direct services?

1. **Use Hooks When:**
   - Component needs loading/error states
   - Data needs to be cached or shared
   - UI needs to react to data changes
   - Multiple components need the same data logic

```typescript
// Good use of hooks
function PersonList() {
  const { people, loading, error } = usePerson();
  
  if (loading) return <Loading />;
  if (error) return <Error error={error} />;
  
  return <div>{people.map(p => <PersonCard key={p.id} person={p} />)}</div>;
}
```

2. **Use Direct Services When:**
   - Making one-off API calls
   - Performing background tasks
   - No UI state management needed
   - Inside other services or utilities

```typescript
// Good use of direct services
async function exportPersonData() {
  const services = getServices();
  const data = await services.person.getAll();
  return generateCSV(data);
}
```

### Hook Design Patterns

1. **Basic Hook Template**
```typescript
export function useEntity() {
  const services = useServices();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const result = await services.entity.getAll();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}
```

2. **Advanced Hook with Caching**
```typescript
export function useEntity(id?: string) {
  const services = useServices();
  const cache = useRef(new Map());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (id && cache.current.has(id)) {
      setData(cache.current.get(id));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = id 
        ? await services.entity.getOne(id)
        : await services.entity.getAll();
      
      if (id) {
        cache.current.set(id, result);
      }
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, refresh: fetch };
}
```

3. **Hook with Optimistic Updates**
```typescript
export function useEntity() {
  const services = useServices();
  const [data, setData] = useState([]);

  const create = async (newItem) => {
    // Optimistic update
    const tempId = 'temp_' + Date.now();
    setData([...data, { ...newItem, id: tempId }]);

    try {
      const created = await services.entity.create(newItem);
      // Replace temporary item with real one
      setData(data.map(item => 
        item.id === tempId ? created : item
      ));
      return created;
    } catch (error) {
      // Rollback on error
      setData(data.filter(item => item.id !== tempId));
      throw error;
    }
  };

  return { data, create };
}
```

### When to Create Entity-Specific Hooks

1. **Create Entity Hooks When:**
   - Entity has complex state management
   - Entity is used in multiple components
   - Entity needs caching or optimistic updates
   - Entity has specific business logic

2. **Use Direct Services When:**
   - Simple CRUD operations
   - One-off API calls
   - No state management needed
   - Background tasks

### Example: Mixed Approach

```typescript
// hooks/usePerson.ts - For complex UI interactions
export function usePerson() {
  const services = useServices();
  const [people, setPeople] = useState([]);
  const [selected, setSelected] = useState(null);
  
  // Complex state management
  // Caching
  // UI-specific operations
  
  return {
    people,
    selected,
    select: setSelected,
    // ... other UI-related functions
  };
}

// Usage example
function PersonAdmin() {
  // Use hook for UI state
  const { people, selected } = usePerson();
  
  return (
    <div>
      <PersonList people={people} selected={selected} />
    </div>
  );
}
```

This mixed approach gives you the best of both worlds:
- Hooks for UI-related state and operations
- Services for direct API calls when needed
- Clear separation of concerns
- Better code organization

## Navigation Patterns

### Protected Routes

All routes under `app/(auth)` are protected by the `AuthGuard` and require authentication. The layout structure ensures consistent protection:

```typescript
// Example navigation flow
function Navigation() {
  const { hasPermission } = usePermissions();

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      
      {hasPermission('person.read') && (
        <Link href="/person">People</Link>
      )}
      
      {hasPermission('roles.manage') && (
        <Link href="/roles">Roles</Link>
      )}
    </nav>
  );
}
```

### Route Protection

1. **Authentication Level**
   - All routes under `(auth)` group are protected
   - Unauthenticated users are redirected to login
   - Successful login redirects to original destination

2. **Permission Level**
   - Individual routes check specific permissions
   - Uses `PermissionGuard` for granular access control
   - Fallback UI for unauthorized access

3. **Dynamic Navigation**
   - Menu items shown based on permissions
   - Active route highlighting
   - Breadcrumb navigation support

## Error Handling

### Global Error Boundary

```typescript
// components/ui/ErrorBoundary.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error?.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## State Management

### Service State

- Services maintain singleton instances
- API client manages token state
- Permission cache in PermissionService

### React State

- Component-level state with hooks
- Form state with React Hook Form
- Cache state with React Query (optional)

## Performance Optimization

1. **API Caching**
   - Cache permission checks
   - Cache user data
   - Implement stale-while-revalidate

2. **Component Optimization**
   - Memoize expensive calculations
   - Use React.memo for pure components
   - Implement virtual scrolling for large lists

3. **Code Splitting**
   - Lazy load routes
   - Dynamic imports for heavy components
   - Prefetch critical routes

## Testing

1. **Unit Tests**
   - Test hooks in isolation
   - Mock API responses
   - Test permission calculations

2. **Integration Tests**
   - Test protected routes
   - Test permission guards
   - Test form submissions

3. **E2E Tests**
   - Test complete user flows
   - Test authentication
   - Test CRUD operations

## Components and Guards Implementation

### Auth Guard

```typescript
// components/auth/AuthGuard.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loading } from '@/components/ui/Loading';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store the attempted URL for redirect after login
      sessionStorage.setItem('redirectUrl', pathname);
      router.push('/login');
    }
  }, [loading, isAuthenticated, router, pathname]);

  if (loading) {
    return <Loading />;
  }

  return isAuthenticated ? <>{children}</> : null;
}
```

### Permission Guard

```typescript
// components/permissions/PermissionGuard.tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Loading } from '@/components/ui/Loading';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <Loading />;
  }

  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
```

### Role-Based Access Component

```typescript
// components/permissions/RoleBasedAccess.tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';

interface RoleBasedAccessProps {
  permissions: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleBasedAccess({
  permissions,
  requireAll = true,
  children,
  fallback = null,
}: RoleBasedAccessProps) {
  const { hasPermission, loading } = usePermissions();

  if (loading) return null;

  const hasAccess = requireAll
    ? permissions.every(hasPermission)
    : permissions.some(hasPermission);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
```

### Person Components

```typescript
// components/person/PersonList.tsx
'use client';

import { usePerson } from '@/hooks/usePerson';
import { PermissionGuard } from '@/components/permissions/PermissionGuard';
import { Loading } from '@/components/ui/Loading';

export function PersonList() {
  const { people, loading, error } = usePerson();

  if (loading) return <Loading />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <PermissionGuard permission="person.create">
        <Link href="/person/create">Create Person</Link>
      </PermissionGuard>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id}>
              <td>{person.nameEn}</td>
              <td>{person.emails[0]?.email}</td>
              <td>
                <PermissionGuard permission="person.update">
                  <Link href={`/person/${person.id}`}>Edit</Link>
                </PermissionGuard>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Person Form

```typescript
// components/person/PersonForm.tsx
'use client';

import { useState } from 'react';
import { usePerson } from '@/hooks/usePerson';
import type { Person, CreatePersonDto, UpdatePersonDto } from '@/types/person';

interface PersonFormProps {
  person?: Person;
  onSuccess?: () => void;
}

export function PersonForm({ person, onSuccess }: PersonFormProps) {
  const { createPerson, updatePerson } = usePerson();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        nameEn: formData.get('nameEn') as string,
        nameAr: formData.get('nameAr') as string,
        email: formData.get('email') as string,
      };

      if (person) {
        await updatePerson(person.id, data as UpdatePersonDto);
      } else {
        await createPerson(data as CreatePersonDto);
      }

      onSuccess?.();
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error.message}</div>}
      
      <div>
        <label htmlFor="nameEn">Name (English)</label>
        <input
          id="nameEn"
          name="nameEn"
          defaultValue={person?.nameEn}
          required
        />
      </div>

      <div>
        <label htmlFor="nameAr">Name (Arabic)</label>
        <input
          id="nameAr"
          name="nameAr"
          defaultValue={person?.nameAr}
          required
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={person?.emails[0]?.email}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : person ? 'Update' : 'Create'}
      </button>
    </form>
  );
}
```

## Layouts

### Auth Layout

```typescript
// app/(auth)/layout.tsx
'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <main className="min-h-screen">
          <nav>
            <Navigation />
          </nav>
          {children}
        </main>
      </AuthGuard>
    </ErrorBoundary>
  );
}
```

### Public Layout

```typescript
// app/(public)/layout.tsx
'use client';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <main className="min-h-screen">
        {children}
      </main>
    </ErrorBoundary>
  );
}
```

## Pages

### Login Page

```typescript
// app/(public)/login/page.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { LoginDto } from '@bawes/erp-api-sdk';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const loginDto: LoginDto = {
        email: formData.get('email') as string,
        password: formData.get('password') as string
      };

      await login(loginDto);

      // Get redirect URL or default to dashboard
      const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboard';
      sessionStorage.removeItem('redirectUrl');
      router.push(redirectUrl);
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        {error && (
          <div className="error mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-500 text-white rounded"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
```

### Person List Page

```typescript
// app/(auth)/person/page.tsx
'use client';

import { PersonList } from '@/components/person/PersonList';
import { PermissionGuard } from '@/components/permissions/PermissionGuard';

export default function PersonListPage() {
  return (
    <PermissionGuard 
      permission="person.read"
      fallback={<div>No access to person management</div>}
    >
      <div className="container mx-auto p-4">
        <h1>People Management</h1>
        <PersonList />
      </div>
    </PermissionGuard>
  );
}
```

### Person Detail Page

```typescript
// app/(auth)/person/[id]/page.tsx
'use client';

import { usePerson } from '@/hooks/usePerson';
import { PersonForm } from '@/components/person/PersonForm';
import { PermissionGuard } from '@/components/permissions/PermissionGuard';
import { useParams, useRouter } from 'next/navigation';
import { Loading } from '@/components/ui/Loading';

export default function PersonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { person, loading } = usePerson(params.id);

  if (loading) return <Loading />;

  return (
    <PermissionGuard 
      permission="person.update"
      fallback={<div>No access to edit person</div>}
    >
      <div className="container mx-auto p-4">
        <h1>Edit Person</h1>
        <PersonForm 
          person={person} 
          onSuccess={() => router.push('/person')}
        />
      </div>
    </PermissionGuard>
  );
}
```

### Basic Usage

```typescript
import {
  Configuration,
  AuthenticationApi,
  PermissionsApi
} from '@bawes/erp-api-sdk';

// Initialize the configuration with in-memory token management
let accessToken: string | null = null;

const configuration = new Configuration({
  basePath: 'YOUR_API_URL', // e.g., 'http://localhost:3000'
  accessToken: () => accessToken || ''
});

// Initialize API instances
const authApi = new AuthenticationApi(configuration);
const permissionsApi = new PermissionsApi(configuration);

// Use the APIs
async function example() {
  try {
    // Login - refresh token is automatically set as HTTP-only cookie by the backend
    const authResponse = await authApi.authControllerLogin({
      email: 'user@example.com',
      password: 'password'
    });
    
    // Store access token in memory only
    accessToken = authResponse.data.access_token;
    
    // Now you can make authenticated requests
    const result = await permissionsApi.permissionManagementControllerGetDashboard();
    console.log(result);
  } catch (error) {
    console.error('API Error:', error);
  }
}

// Token refresh example - uses HTTP-only refresh token cookie
async function refreshExample() {
  try {
    const refreshResponse = await authApi.authControllerRefresh();
    
    // Update the in-memory access token
    accessToken = refreshResponse.data.access_token;
  } catch (error) {
    console.error('Refresh Error:', error);
  }
}

// Cleanup on logout or window close
function cleanup() {
  accessToken = null;
  // Refresh token is cleared by the backend via HTTP-only cookie
}
```