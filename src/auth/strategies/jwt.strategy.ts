import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly debugMode: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
    this.debugMode = configService.get<string>('DEBUG')?.toLowerCase() === 'true';
  }

  async validate(request: any, payload: JwtPayload) {
    if (this.debugMode) {
      this.logger.debug('JWT Validation Start ----------------------------------------');
      this.logger.debug('Request headers:', JSON.stringify(request.headers, null, 2));
      this.logger.debug('Authorization:', request.headers.authorization?.replace(/Bearer .+?(?=\.)/, 'Bearer [REDACTED]'));
      this.logger.debug('JWT payload:', JSON.stringify(payload, null, 2));
    }

    const person = await this.prisma.person.findUnique({
      where: { id: payload.sub },
      include: {
        emails: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (this.debugMode) {
      this.logger.debug('Found person:', JSON.stringify(person, null, 2));
    }

    if (!person || person.accountStatus !== 'active') {
      const reason = !person ? 'Person not found' : 'Account inactive';
      this.logger.warn(`Authentication failed: ${reason} for ID: ${payload.sub}`);
      throw new UnauthorizedException();
    }

    const user = {
      id: person.id,
      email: person.emails[0]?.email,
      nameEn: person.nameEn,
      nameAr: person.nameAr,
      permissionBits: payload.permissionBits,
      isSuperAdmin: payload.isSuperAdmin || false,
    };

    if (this.debugMode) {
      this.logger.debug('JWT Validation Success - Returning user:', JSON.stringify(user, null, 2));
      this.logger.debug('JWT Validation End ------------------------------------------');
    }

    return user;
  }
}
