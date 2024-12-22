import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
const ms = require('ms');
import { JwtPayload } from './interfaces/jwt-payload.interface';
import Decimal from 'decimal.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly debugMode: boolean;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.debugMode = process.env.DEBUG?.toLowerCase() === 'true';
  }

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
    const duration = this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRY');
    const durationMs = this.getDurationInMs(duration);
    return new Date(Date.now() + durationMs);
  }

  /**
   * Generate a cryptographically secure refresh token
   */
  private generateRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  /**
   * Extract refresh token from cookie
   */
  private extractRefreshTokenFromCookie(req: Request): string | null {
    if (this.debugMode) {
      this.logger.debug('Cookies received:', req.cookies);
    }
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
      expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });

    // Generate refresh token
    const refreshToken = this.generateRefreshToken();
    const expiresAt = this.getRefreshTokenExpiryDate();

    // Create refresh token record
    const { id: tokenId } = await this.prisma.refreshToken.create({
      select: { id: true },
      data: {
        personId,
        hashedToken: await bcrypt.hash(refreshToken, 10),
        deviceDetails: req.headers['user-agent'] || 'Unknown Device',
        ipAddress: req.ip || req.socket.remoteAddress || 'Unknown IP',
        expiresAt,
        isRevoked: false,
        lastUsedAt: new Date(),
      },
    });

    // Set cookies in response
    if (req.res) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      };

      req.res.cookie('access_token', accessToken, {
        ...cookieOptions,
        maxAge: this.getDurationInMs(
          this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
        ),
      });

      req.res.cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: this.getDurationInMs(
          this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRY'),
        ),
      });
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.getDurationInMs(
        this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
      ) / 1000, // Convert ms to seconds
    };
  }

  async refreshToken(req: Request) {
    try {
      const refreshToken = this.extractRefreshTokenFromCookie(req);
      if (!refreshToken) {
        throw new UnauthorizedException('No refresh token provided');
      }

      if (this.debugMode) {
        this.logger.debug('Refresh token received:', { refreshToken });
      }

      // Find all non-revoked refresh tokens for comparison
      const activeTokens = await this.prisma.refreshToken.findMany({
        where: {
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      });

      // Find a matching token
      const matchingToken = await Promise.any(
        activeTokens.map(async (token) => {
          const isMatch = await bcrypt.compare(refreshToken, token.hashedToken);
          if (isMatch) return token;
          throw new Error('No match');
        }),
      ).catch(() => null);

      if (!matchingToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = await this.prisma.person.findUnique({
        where: { id: matchingToken.personId },
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
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      // Invalidate the used refresh token
      await this.prisma.refreshToken.update({
        where: { id: matchingToken.id },
        data: { 
          isRevoked: true,
          revokedReason: 'Token rotated on refresh',
          lastUsedAt: new Date()
        },
      });

      // Generate new refresh token
      const newRefreshToken = this.generateRefreshToken();
      const expiresAt = this.getRefreshTokenExpiryDate();

      // Create new refresh token record
      await this.prisma.refreshToken.create({
        data: {
          personId: user.id,
          hashedToken: await bcrypt.hash(newRefreshToken, 10),
          deviceDetails: req.headers['user-agent'] || 'Unknown Device',
          ipAddress: req.ip || req.socket.remoteAddress || 'Unknown IP',
          expiresAt,
          isRevoked: false,
          lastUsedAt: new Date(),
        },
      });

      // Set the new tokens in cookies
      if (req.res) {
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };

        req.res.cookie('access_token', accessToken, {
          ...cookieOptions,
          maxAge: this.getDurationInMs(
            this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
          ),
        });

        req.res.cookie('refresh_token', newRefreshToken, {
          ...cookieOptions,
          maxAge: this.getDurationInMs(
            this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRY'),
          ),
        });
      }

      if (this.debugMode) {
        this.logger.debug('Refresh token rotated successfully');
      }

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: this.getDurationInMs(
          this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
        ) / 1000, // Convert ms to seconds
      };
    } catch (error) {
      if (this.debugMode) {
        this.logger.error('Refresh token error:', error);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(token: string, reason: string = 'Manual logout') {
    try {
      // Find the token record by comparing hashed values
      const activeTokens = await this.prisma.refreshToken.findMany({
        where: { isRevoked: false },
      });

      const matchingToken = await Promise.any(
        activeTokens.map(async (record) => {
          const isMatch = await bcrypt.compare(token, record.hashedToken);
          if (isMatch) return record;
          throw new Error('No match');
        }),
      ).catch(() => null);

      if (!matchingToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.prisma.refreshToken.update({
        where: { id: matchingToken.id },
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
