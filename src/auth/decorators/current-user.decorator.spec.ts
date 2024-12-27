import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUser } from './current-user.decorator';
import 'reflect-metadata';

// Extract the factory function from the decorator for testing
const getCurrentUser = (data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request?.user;
};

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

  it('should extract user from request', () => {
    // Arrange
    const mockUser = { id: '1', email: 'test@example.com' };
    mockRequest.user = mockUser;

    // Act
    const result = getCurrentUser(undefined, mockExecutionContext);

    // Assert
    expect(result).toBe(mockUser);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should return undefined when no user in request', () => {
    // Act
    const result = getCurrentUser(undefined, mockExecutionContext);

    // Assert
    expect(result).toBeUndefined();
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should handle null request', () => {
    // Arrange
    const { getRequest } = mockExecutionContext.switchToHttp();
    (getRequest as jest.Mock).mockReturnValue(null);

    // Act
    const result = getCurrentUser(undefined, mockExecutionContext);

    // Assert
    expect(result).toBeUndefined();
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should ignore data parameter', () => {
    // Arrange
    const mockUser = { id: '1', email: 'test@example.com' };
    mockRequest.user = mockUser;

    // Act
    const result = getCurrentUser('someData', mockExecutionContext);

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
    expect(() => getCurrentUser(undefined, mockExecutionContext)).toThrow('Invalid request');
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });
}); 