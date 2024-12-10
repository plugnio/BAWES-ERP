import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateLogin(email: string, password: string) {
    // Find the email record
    const emailRecord = await this.prisma.email.findUnique({
      where: { email },
      include: { person: true },
    });

    if (!emailRecord || !emailRecord.person || !emailRecord.isVerified) {
      throw new UnauthorizedException('Invalid credentials or unverified email');
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

    return this.generateTokens(person.id);
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

      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
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

  private async generateTokens(personId: string) {
    const accessTokenPayload = { sub: personId };
    const refreshTokenId = uuidv4();
    const refreshTokenPayload = { 
      sub: personId,
      jti: refreshTokenId 
    };

    // Generate tokens
    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'
    });
    
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'
    });

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        personId,
        expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        isRevoked: false
      }
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 900 // 15 minutes in seconds
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken);
      
      // Check if token exists and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { id: decoded.jti }
      });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new access token
      const accessTokenPayload = { sub: decoded.sub };
      const accessToken = this.jwtService.sign(accessTokenPayload, {
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'
      });

      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 900 // 15 minutes in seconds
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      await this.prisma.refreshToken.update({
        where: { id: decoded.jti },
        data: { isRevoked: true }
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyEmail(email: string, code: string) {
    const emailRecord = await this.prisma.email.findUnique({
      where: { email },
    });

    if (!emailRecord || 
        !emailRecord.verificationCode || 
        emailRecord.verificationCode !== code ||
        emailRecord.verificationCodeExpiresAt < new Date()) {
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
  }
} 