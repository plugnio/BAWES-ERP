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
import { Prisma } from '@prisma/client';

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
  private extractRefreshTokenFromCookie(req: Request): { id: string, token: string } | null {
    if (this.debugMode) {
      this.logger.debug('Cookies received:', req.cookies);
    }
    try {
      const [id, token] = (req.cookies?.refreshToken || '').split('.');
      if (!id || !token) return null;
      return { id, token };
    } catch {
      return null;
    }
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

    // Create refresh token record and get its ID
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

      req.res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: this.getDurationInMs(
          this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
        ),
      });

      req.res.cookie('refreshToken', `${tokenId}.${refreshToken}`, {
        ...cookieOptions,
        maxAge: this.getDurationInMs(
          this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRY'),
        ),
      });
    }

    return {
      accessToken: accessToken,
      tokenType: 'Bearer',
      expiresIn: this.getDurationInMs(
        this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
      ) / 1000, // Convert ms to seconds
    };
  }

  async refreshToken(req: Request) {
    try {
      const refreshTokenData = this.extractRefreshTokenFromCookie(req);
      if (!refreshTokenData) {
        if (this.debugMode) {
          this.logger.debug('No refresh token in cookies');
        }
        this.clearAuthCookies(req);
        throw new UnauthorizedException('No refresh token provided');
      }

      if (this.debugMode) {
        this.logger.debug('Refresh token received:', { id: refreshTokenData.id });
      }

      // Use a transaction with pessimistic locking to handle concurrent requests
      const result = await this.prisma.$transaction(async (prisma) => {
        // Find and lock the token record
        const token = await prisma.refreshToken.findFirst({
          where: {
            id: refreshTokenData.id,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
          // This ensures no other transaction can read this record until we're done
          // Requires @prisma/client 4.16.0 or later
          // skip if your Prisma version doesn't support it
          // orderBy: { id: 'asc' },
          // skip: 0,
          // take: 1,
        });

        if (!token) {
          if (this.debugMode) {
            this.logger.debug('No matching token found');
          }
          throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // Verify the token value
        const isValidToken = await bcrypt.compare(refreshTokenData.token, token.hashedToken);
        if (!isValidToken) {
          if (this.debugMode) {
            this.logger.debug('Token validation failed');
          }
          throw new UnauthorizedException('Invalid refresh token');
        }

        // Immediately invalidate the token
        await prisma.refreshToken.update({
          where: { id: token.id },
          data: { 
            isRevoked: true,
            revokedReason: 'Token rotated on refresh',
            lastUsedAt: new Date()
          },
        });

        // Get user with roles
        const user = await prisma.person.findUnique({
          where: { id: token.personId },
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
          if (this.debugMode) {
            this.logger.debug('User no longer exists');
          }
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

        // Generate new refresh token
        const newRefreshToken = this.generateRefreshToken();
        const expiresAt = this.getRefreshTokenExpiryDate();

        // Create new refresh token record
        const { id: tokenId } = await prisma.refreshToken.create({
          select: { id: true },
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

        return { accessToken, tokenId, newRefreshToken, expiresIn: this.getDurationInMs(
          this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
        ) / 1000 };
      }, {
        maxWait: 5000, // Maximum time to wait for a lock
        timeout: 10000, // Maximum time for the transaction
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable // Highest isolation level
      });

      // Set the new tokens in cookies
      if (req.res) {
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax' as const,
          path: '/',
        };

        req.res.cookie('accessToken', result.accessToken, {
          ...cookieOptions,
          maxAge: this.getDurationInMs(
            this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY'),
          ),
        });

        req.res.cookie('refreshToken', `${result.tokenId}.${result.newRefreshToken}`, {
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
        accessToken: result.accessToken,
        tokenType: 'Bearer',
        expiresIn: result.expiresIn,
      };
    } catch (error) {
      if (this.debugMode) {
        this.logger.error('Refresh token error:', error);
      }
      this.clearAuthCookies(req);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private clearAuthCookies(req: Request) {
    if (req.res) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      };
      
      req.res.clearCookie('accessToken', cookieOptions);
      req.res.clearCookie('refreshToken', cookieOptions);
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
