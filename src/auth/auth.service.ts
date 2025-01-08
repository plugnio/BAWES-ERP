import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  LogLevel,
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
import { RbacCacheService } from '../rbac/services/rbac-cache.service';

@Injectable()
export class AuthService {
  private readonly logger: Logger;
  private readonly debugMode: boolean;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rbacCache: RbacCacheService,
  ) {
    this.debugMode = configService.get('DEBUG')?.toLowerCase() === 'true';
    // Create logger with no output during tests
    this.logger = new Logger(AuthService.name);
    if (process.env.NODE_ENV === 'test') {
      Logger.overrideLogger([]);
    }
  }

  /**
   * Convert duration string (e.g., '7d', '15m') to milliseconds
   * @throws {Error} if the duration string is invalid
   */
  private getDurationInMs(duration: string): number {
    const result = ms(duration);
    if (result === undefined) {
      throw new Error(`Invalid duration format: ${duration}`);
    }
    return result;
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
  public extractRefreshTokenFromCookie(req: Request): { id: string, token: string } | null {
    if (this.debugMode) {
      this.logger.debug('Cookies received:', req.cookies);
    }
    try {
      const refreshToken = req.cookies?.refreshToken || req.cookies?.refresh_token;
      const [id, token] = (refreshToken || '').split('.');
      if (!id || !token) return null;
      return { id, token };
    } catch {
      return null;
    }
  }

  async validateLogin(email: string, password: string, req: Request) {
    // Find person by email
    const person = await this.prisma.person.findFirst({
      where: {
        emails: {
          some: {
            email: email.toLowerCase(),
            isVerified: true,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!person) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, person.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (person.accountStatus !== 'active') {
      throw new UnauthorizedException('Account is not active');
    }

    try {
      // Update last login
      await this.prisma.person.update({
        where: { id: person.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      // Log error but don't fail login
      this.logger.error('Failed to update last login time', error);
    }

    // Generate tokens
    const tokens = await this.generateTokens(person.id, req);

    return tokens;
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
    // Check cache first
    let permissionBits: Decimal | null = null;
    const cachedPermissions = await this.rbacCache.getCachedPersonPermissions(personId);
    
    if (cachedPermissions) {
      permissionBits = new Decimal(cachedPermissions);
      if (this.debugMode) {
        this.logger.debug('Using cached permissions:', permissionBits.toString());
      }
    }

    // Get person's permissions through roles if not cached
    const personWithRoles = await this.prisma.person.findUnique({
      where: { id: personId },
      include: {
        roles: {
          include: {
            role: {
              select: {
                name: true,
                permissions: !cachedPermissions ? {
                  include: {
                    permission: {
                      select: {
                        code: true,
                        bitfield: true,
                        isDeprecated: true,
                      },
                    },
                  },
                } : undefined,
              },
            },
          },
        },
        emails: {
          where: { isPrimary: true },
        },
      },
    });

    if (!personWithRoles) {
      throw new UnauthorizedException('Invalid person ID');
    }

    if (this.debugMode) {
      this.logger.debug('Person roles:', JSON.stringify(personWithRoles.roles, null, 2));
    }

    // Check if person has SUPER_ADMIN role
    const isSuperAdmin = personWithRoles.roles?.some(pr => pr.role.name === 'SUPER_ADMIN') ?? false;

    // Calculate combined permission bitfield if not cached
    if (!permissionBits) {
      if (isSuperAdmin) {
        // Super admin gets all permissions
        const allPermissions = await this.prisma.permission.findMany({
          where: { isDeprecated: false },
        });
        permissionBits = allPermissions
          .reduce((acc, p) => acc.add(new Decimal(p.bitfield)), new Decimal(0));
      } else {
        // Regular user gets combined permissions from roles
        permissionBits = personWithRoles.roles?.reduce((acc, pr) => {
          if (this.debugMode) {
            this.logger.debug(`Processing role ${pr.role.name}`);
          }

          const roleBits = pr.role.permissions?.reduce(
            (roleAcc, rp) => {
              if (!rp.permission.isDeprecated) {
                if (this.debugMode) {
                  this.logger.debug(`Adding permission ${rp.permission.code} with bitfield ${rp.permission.bitfield}`);
                }
                return roleAcc.add(new Decimal(rp.permission.bitfield));
              }
              return roleAcc;
            },
            new Decimal(0),
          ) ?? new Decimal(0);

          if (this.debugMode) {
            this.logger.debug(`Role ${pr.role.name} combined bits: ${roleBits.toString()}`);
          }

          return acc.add(roleBits);
        }, new Decimal(0)) ?? new Decimal(0);
      }

      // Cache the calculated permissions
      await this.rbacCache.setCachedPersonPermissions(personId, permissionBits.toString());

      if (this.debugMode) {
        this.logger.debug(`Cached new permission bits: ${permissionBits.toString()}`);
      }
    }

    if (this.debugMode) {
      this.logger.debug(`Final combined permission bits: ${permissionBits.toString()}`);
    }

    // Generate access token with permissions
    const accessTokenPayload: JwtPayload = {
      sub: personId,
      email: personWithRoles.emails[0]?.email,
      permissionBits: permissionBits.toString(),
      isSuperAdmin,
    };

    if (this.debugMode) {
      this.logger.debug('JWT payload:', accessTokenPayload);
    }

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
          this.logger.debug('No refresh token found in cookies');
        }
        throw new UnauthorizedException('No refresh token provided');
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        // Find and lock the token record
        const token = await prisma.refreshToken.findFirst({
          where: {
            id: refreshTokenData.id,
            isRevoked: false,
            expiresAt: { gt: new Date() },
          },
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

        // Check cache first
        let permissionBits: Decimal | null = null;
        const cachedPermissions = await this.rbacCache.getCachedPersonPermissions(token.personId);
        let user: any;

        if (cachedPermissions) {
          // If permissions are cached, we only need basic user info
          user = await prisma.person.findUnique({
            where: { id: token.personId },
            include: {
              roles: {
                include: {
                  role: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              emails: {
                where: { isPrimary: true },
              },
            },
          });
          permissionBits = new Decimal(cachedPermissions);
        } else {
          // If no cache, get full user info with permissions in one query
          user = await prisma.person.findUnique({
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
                              code: true,
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
        }

        if (!user || user.accountStatus !== 'active') {
          if (this.debugMode) {
            this.logger.debug('User not found or inactive');
          }
          throw new UnauthorizedException('User not found or inactive');
        }

        // Check if user has SUPER_ADMIN role
        const isSuperAdmin = user.roles.some(pr => pr.role.name === 'SUPER_ADMIN');

        // Calculate permissions if not cached
        if (!cachedPermissions) {
          permissionBits = user.roles.reduce((acc, pr) => {
            if (this.debugMode) {
              this.logger.debug(`Processing role ${pr.role.name}`);
            }

            const roleBits = pr.role.permissions.reduce(
              (roleAcc, rp) => {
                if (!rp.permission.isDeprecated) {
                  if (this.debugMode) {
                    this.logger.debug(`Adding permission ${rp.permission.code} with bitfield ${rp.permission.bitfield}`);
                  }
                  return roleAcc.add(new Decimal(rp.permission.bitfield));
                }
                return roleAcc;
              },
              new Decimal(0),
            );

            if (this.debugMode) {
              this.logger.debug(`Role ${pr.role.name} combined bits: ${roleBits.toString()}`);
            }

            return acc.add(roleBits);
          }, new Decimal(0));

          // Cache the calculated permissions
          await this.rbacCache.setCachedPersonPermissions(user.id, permissionBits.toString());
        }

        if (this.debugMode) {
          this.logger.debug(`Final combined permission bits: ${permissionBits.toString()}`);
        }

        // Generate new access token with updated permissions
        const accessTokenPayload: JwtPayload = {
          sub: user.id,
          email: user.emails[0]?.email,
          permissionBits: permissionBits.toString(),
          isSuperAdmin,
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
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  public clearAuthCookies(req: Request) {
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

  async revokeRefreshToken(tokenString: string, reason: string = 'Manual logout') {
    try {
      if (this.debugMode) {
        this.logger.debug('Attempting to revoke token:', tokenString);
      }

      // Split the token into id and actual token
      const [id, token] = (tokenString || '').split('.');
      
      if (!id || !token) {
        if (this.debugMode) {
          this.logger.debug('Invalid token format. ID or token missing:', { id, hasToken: !!token });
        }
        throw new UnauthorizedException('Invalid token format');
      }

      // Find the specific token by ID first
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { id },
      });

      if (!tokenRecord) {
        if (this.debugMode) {
          this.logger.debug('Token not found:', id);
        }
        throw new UnauthorizedException('Token not found');
      }

      if (tokenRecord.isRevoked) {
        if (this.debugMode) {
          this.logger.debug('Token already revoked:', id);
        }
        throw new UnauthorizedException('Token already revoked');
      }

      // Verify the token
      const isValidToken = await bcrypt.compare(token, tokenRecord.hashedToken);
      if (!isValidToken) {
        if (this.debugMode) {
          this.logger.debug('Token validation failed for ID:', id);
        }
        throw new UnauthorizedException('Invalid token');
      }

      // Revoke the token
      await this.prisma.refreshToken.update({
        where: { id },
        data: {
          isRevoked: true,
          revokedReason: reason,
          lastUsedAt: new Date(),
        },
      });

      if (this.debugMode) {
        this.logger.debug('Token revoked successfully:', id);
      }

      return { message: 'Token revoked successfully' };
    } catch (error) {
      if (this.debugMode) {
        this.logger.error('Token revocation failed:', error);
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // Always throw UnauthorizedException to avoid leaking implementation details
      throw new UnauthorizedException('Failed to revoke token');
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
