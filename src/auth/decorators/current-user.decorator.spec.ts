import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUser } from './current-user.decorator';
import 'reflect-metadata';

// Mock createParamDecorator to capture and execute the factory function
jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    createParamDecorator: (factory: (data: any, ctx: ExecutionContext) => any) => {
      return function(...args: any[]) {
        const [data, ctx] = args;
        return factory(data, ctx);
      };
    },
  };
});

describe('CurrentUser', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(async () => {
    mockRequest = {};
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest)
      })
    } as unknown as ExecutionContext;
  });

  function executeDecorator(data: unknown = undefined) {
    return CurrentUser(data, mockExecutionContext);
  }

  it('should extract user from request', () => {
    // Arrange
    const mockUser = { id: '1', email: 'test@example.com' };
    mockRequest.user = mockUser;

    // Act
    const result = executeDecorator();

    // Assert
    expect(result).toBe(mockUser);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should return undefined when no user in request', () => {
    // Act
    const result = executeDecorator();

    // Assert
    expect(result).toBeUndefined();
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should handle null request', () => {
    // Arrange
    const { getRequest } = mockExecutionContext.switchToHttp();
    (getRequest as jest.Mock).mockReturnValue(null);

    // Act
    const result = executeDecorator();

    // Assert
    expect(result).toBeUndefined();
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should ignore data parameter', () => {
    // Arrange
    const mockUser = { id: '1', email: 'test@example.com' };
    mockRequest.user = mockUser;

    // Act
    const result = executeDecorator('someData');

    // Assert
    expect(result).toBe(mockUser);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should handle error when request is invalid', () => {
    // Arrange
    const { getRequest } = mockExecutionContext.switchToHttp();
    (getRequest as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid request');
    });

    // Act & Assert
    expect(() => executeDecorator()).toThrow('Invalid request');
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });
}); 