import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TestController } from './test.controller';
import { RbacModule } from '../../src/rbac/rbac.module';

@Module({
  imports: [DiscoveryModule, RbacModule],
  controllers: [TestController],
})
export class TestModule {} 