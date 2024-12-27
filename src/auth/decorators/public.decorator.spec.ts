import { Public, IS_PUBLIC_KEY } from './public.decorator';
import { SetMetadata } from '@nestjs/common';
import 'reflect-metadata';

describe('Public Decorator', () => {
  it('should set isPublic metadata to true', () => {
    // Arrange
    class TestClass {
      @Public()
      testMethod() {}
    }

    // Act
    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.testMethod);

    // Assert
    expect(metadata).toBe(true);
  });

  it('should not affect other methods', () => {
    // Arrange
    class TestClass {
      @Public()
      publicMethod() {}

      privateMethod() {}
    }

    // Act
    const publicMetadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.publicMethod);
    const privateMetadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.privateMethod);

    // Assert
    expect(publicMetadata).toBe(true);
    expect(privateMetadata).toBeUndefined();
  });

  it('should work with multiple decorators', () => {
    // Arrange
    const TEST_KEY = 'test';
    const TestDecorator = () => SetMetadata(TEST_KEY, true);

    class TestClass {
      @Public()
      @TestDecorator()
      testMethod() {}
    }

    // Act
    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass.prototype.testMethod);

    // Assert
    expect(isPublic).toBe(true);
  });

  it('should preserve method functionality', () => {
    // Arrange
    const expectedResult = 'test';
    class TestClass {
      @Public()
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
}); 