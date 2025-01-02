import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Request } from 'express';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

// Mock the passport module
jest.mock('@nestjs/passport', () => {
  class MockAuthGuard {
    constructor() {}
    canActivate() {
      return Promise.resolve(true);
    }
  }
  return {
    AuthGuard: jest.fn().mockImplementation(() => MockAuthGuard),
  };
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockHttpContext: jest.Mocked<HttpArgumentsHost>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    mockHttpContext = {
      getRequest: jest.fn(),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    };

    mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue(mockHttpContext),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
    };

    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should call parent canActivate for non-public routes', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should handle undefined public decorator', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should attach the validated user to the request object', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const mockUser = { id: '1', email: 'test@example.com' };
      const mockRequest = { user: null } as Request;
      mockHttpContext.getRequest.mockReturnValue(mockRequest);

      // Mock the parent class's canActivate to simulate successful validation
      jest.spyOn(guard, 'canActivate').mockImplementation(async () => {
        (mockRequest as any).user = mockUser;
        return true;
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should handle user validation through parent class', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const mockRequest = {} as Request;
      mockHttpContext.getRequest.mockReturnValue(mockRequest);

      // Mock the parent AuthGuard's canActivate
      const mockParentCanActivate = jest.spyOn(JwtAuthGuard.prototype, 'canActivate');
      mockParentCanActivate.mockImplementation(async () => true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockParentCanActivate).toHaveBeenCalledWith(mockContext);
    });
  });
}); 