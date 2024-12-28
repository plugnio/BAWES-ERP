import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RbacModule } from '../rbac/rbac.module';
import { PermissionGuard } from './guards/permission.guard';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRY',
            '15m',
          ),
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    RbacModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    PermissionGuard,
  ],
  exports: [
    AuthService, 
    JwtStrategy, 
    PassportModule,
    PermissionGuard,
  ],
})
export class AuthModule {}
