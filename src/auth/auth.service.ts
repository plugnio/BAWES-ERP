import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
const ms = require('ms');
import { JwtPayload } from './interfaces/jwt-payload.interface';
import Decimal from 'decimal.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Convert duration string (e.g., '7d', '15m') to milliseconds
   */
  private getDurationInMs(duration: string): number {
    return ms(duration);
  }

  /**
   * Get refresh token expiry date based on JWT_REFRESH_TOKEN_EXPIRY
   */
  private getRefreshTokenExpiryDate(): Date {
    const duration = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_EXPIRY',
      '7d',
    );
    const durationMs = this.getDurationInMs(duration);
    return new Date(Date.now() + durationMs);
  }

  /**
   * Extract refresh token from cookie
   */
  private extractRefreshTokenFromCookie(req: Request): string | null {
    const refreshToken = req.cookies?.refresh_token;
    return refreshToken || null;
  }

  async validateLogin(email: string, password: string, req: Request) {
    // Find the email record
    const emailRecord = await this.prisma.email.findUnique({
      where: { email },
      include: { person: true },
    });

    if (!emailRecord || !emailRecord.person || !emailRecord.isVerified) {
      throw new UnauthorizedException(
        'Invalid credentials or unverified email',
      );
    }

    const person = emailRecord.person;

    if (!person.passwordHash) {
      throw new UnauthorizedException('Password not set');
    }

    if (person.accountStatus !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, person.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.person.update({
      where: { id: person.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(person.id, req);
  }

  async register(data: {
    email: string;
    password: string;
    nameEn?: string;
    nameAr?: string;
  }) {
    // Check if email exists
    const existingEmail = await this.prisma.email.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create person and email in a transaction
    const result = await this.prisma.$transaction(async (prisma) => {
      const person = await prisma.person.create({
        data: {
          nameEn: data.nameEn,
          nameAr: data.nameAr,
          passwordHash,
          accountStatus: 'active',
        },
      });

      const verificationCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const email = await prisma.email.create({
        data: {
          email: data.email,
          isPrimary: true,
          verificationCode,
          verificationCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          person: {
            connect: { id: person.id },
          },
        },
      });

      return { person, email };
    });

    // TODO: Send verification email with verificationCode

    return {
      message: 'Registration successful. Please verify your email.',
      personId: result.person.id,
    };
  }

  private async generateTokens(personId: string, req: Request) {
    // Get person's permissions through roles
    const personWithRoles = await this.prisma.person.findUnique({
      where: { id: personId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: {
                      select: {
                        bitfield: true,
                        isDeprecated: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        emails: {
          where: { isPrimary: true },
        },
      },
    });

    // Calculate combined permission bitfield
    const permissionBits = personWithRoles.roles.reduce((acc, pr) => {
      const roleBits = pr.role.permissions.reduce(
        (roleAcc, rp) =>
          !rp.permission.isDeprecated
            ? roleAcc.add(new Decimal(rp.permission.bitfield))
            : roleAcc,
        new Decimal(0),
      );
      return acc.add(roleBits);
    }, new Decimal(0));

    // Generate access token with permissions
    const accessTokenPayload: JwtPayload = {
      sub: personId,
      email: personWithRoles.emails[0]?.email,
      permissionBits: permissionBits.toString(),
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });

    // Create refresh token record to get CUID
    const expiresAt = this.getRefreshTokenExpiryDate();
    const { id: tokenId } = await this.prisma.refreshToken.create({
      select: { id: true },
      data: {
        personId,
        hashedToken: 'pending', // Temporary value
        deviceDetails: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || req.socket.remoteAddress || 'Unknown IP',
        expiresAt,
        isRevoked: true, // Temporarily revoked until we update with real values
      },
    });

    // Generate refresh token with the CUID
    const refreshTokenPayload = {
      sub: personId,
      jti: tokenId,
    };

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRY', '7d'),
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });

    // Hash the refresh token
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    // Update the record with actual values using upsert to ensure atomicity
    await this.prisma.refreshToken.upsert({
      where: { id: tokenId },
      create: {
        id: tokenId,
        personId,
        hashedToken,
        deviceDetails: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || req.socket.remoteAddress || 'Unknown IP',
        expiresAt,
        isRevoked: false,
        lastUsedAt: new Date(),
      },
      update: {
        hashedToken,
        deviceDetails: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || req.socket.remoteAddress || 'Unknown IP',
        expiresAt,
        isRevoked: false,
        lastUsedAt: new Date(),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in:
        this.getDurationInMs(
          this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
        ) / 1000, // Convert ms to seconds
    };
  }

  async refreshToken(req: Request) {
    try {
      const refreshToken = this.extractRefreshTokenFromCookie(req);
      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.person.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: {
                        select: {
                          bitfield: true,
                          isDeprecated: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          emails: {
            where: { isPrimary: true },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      // Calculate combined permission bitfield
      const permissionBits = user.roles.reduce((acc, pr) => {
        const roleBits = pr.role.permissions.reduce(
          (roleAcc, rp) =>
            !rp.permission.isDeprecated
              ? roleAcc.add(new Decimal(rp.permission.bitfield))
              : roleAcc,
          new Decimal(0),
        );
        return acc.add(roleBits);
      }, new Decimal(0));

      // Generate new access token with updated permissions
      const accessTokenPayload: JwtPayload = {
        sub: user.id,
        email: user.emails[0]?.email,
        permissionBits: permissionBits.toString(),
      };

      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
      });

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in:
          this.getDurationInMs(
            this.configService.get('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
          ) / 1000, // Convert ms to seconds
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(
    refreshToken: string,
    reason: string = 'Manual logout',
  ) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      await this.prisma.refreshToken.update({
        where: { id: decoded.jti },
        data: {
          isRevoked: true,
          revokedReason: reason,
        },
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeAllUserTokens(
    personId: string,
    reason: string = 'Manual revocation of all tokens',
  ) {
    await this.prisma.refreshToken.updateMany({
      where: {
        personId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedReason: reason,
      },
    });
  }

  async revokeTokensByDevice(
    personId: string,
    deviceDetails: string,
    reason: string = 'Manual device revocation',
  ) {
    await this.prisma.refreshToken.updateMany({
      where: {
        personId,
        deviceDetails,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedReason: reason,
      },
    });
  }

  async cleanupExpiredTokens() {
    const now = new Date();
    await this.prisma.refreshToken.updateMany({
      where: {
        expiresAt: { lt: now },
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        revokedReason: 'Token expired during cleanup',
      },
    });

    // Optional: Delete very old tokens (e.g., expired more than 30 days ago)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: thirtyDaysAgo },
      },
    });
  }

  async verifyEmail(email: string, code: string) {
    try {
      const emailRecord = await this.prisma.email.findUnique({
        where: { email },
      });

      if (
        !emailRecord ||
        !emailRecord.verificationCode ||
        emailRecord.verificationCode !== code ||
        emailRecord.verificationCodeExpiresAt < new Date()
      ) {
        throw new BadRequestException('Invalid or expired verification code');
      }

      await this.prisma.email.update({
        where: { id: emailRecord.id },
        data: {
          isVerified: true,
          verificationCode: null,
          verificationCodeExpiresAt: null,
        },
      });

      return { message: 'Email verified successfully' };
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Failed to verify email');
    }
  }
}
