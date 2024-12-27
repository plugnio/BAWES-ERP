import { RequirePermissions } from './permissions.decorator';
import 'reflect-metadata';

describe('RequirePermissions Decorator', () => {
  const PERMISSIONS_KEY = 'permissions';

  it('should set permissions metadata with single permission', () => {
    // Arrange
    const permission = 'users.read';
    
    class TestClass {
      @RequirePermissions(permission)
      testMethod() {}
    }

    // Act
    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestClass.prototype.testMethod);

    // Assert
    expect(metadata).toEqual([permission]);
  });

  it('should set permissions metadata with multiple permissions', () => {
    // Arrange
    const permissions = ['users.read', 'users.write', 'users.delete'];
    
    class TestClass {
      @RequirePermissions(...permissions)
      testMethod() {}
    }

    // Act
    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestClass.prototype.testMethod);

    // Assert
    expect(metadata).toEqual(permissions);
  });

  it('should handle empty permissions array', () => {
    // Arrange
    class TestClass {
      @RequirePermissions()
      testMethod() {}
    }

    // Act
    const metadata = Reflect.getMetadata(PERMISSIONS_KEY, TestClass.prototype.testMethod);

    // Assert
    expect(metadata).toEqual([]);
  });

  it('should not affect other methods', () => {
    // Arrange
    class TestClass {
      @RequirePermissions('users.read')
      protectedMethod() {}

      unprotectedMethod() {}
    }

    // Act
    const protectedMetadata = Reflect.getMetadata(PERMISSIONS_KEY, TestClass.prototype.protectedMethod);
    const unprotectedMetadata = Reflect.getMetadata(PERMISSIONS_KEY, TestClass.prototype.unprotectedMethod);

    // Assert
    expect(protectedMetadata).toEqual(['users.read']);
    expect(unprotectedMetadata).toBeUndefined();
  });

  it('should preserve method functionality', () => {
    // Arrange
    const expectedResult = 'test';
    class TestClass {
      @RequirePermissions('users.read')
      testMethod(): string {
        return expectedResult;
      }
    }

    // Act
    const instance = new TestClass();
    const result = instance.testMethod();

    // Assert
    expect(result).toBe(expectedResult);
  });

  it('should work with multiple decorators', () => {
    // Arrange
    const TEST_KEY = 'test';
    const TestDecorator = (): MethodDecorator => {
      return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata(TEST_KEY, true, target, propertyKey);
        return descriptor;
      };
    };

    class TestClass {
      @RequirePermissions('users.read')
      @TestDecorator()
      testMethod() {}
    }

    // Act
    const permissions = Reflect.getMetadata(PERMISSIONS_KEY, TestClass.prototype.testMethod);
    const testValue = Reflect.getMetadata(TEST_KEY, TestClass.prototype, 'testMethod');

    // Assert
    expect(permissions).toEqual(['users.read']);
    expect(testValue).toBe(true);
  });
}); 