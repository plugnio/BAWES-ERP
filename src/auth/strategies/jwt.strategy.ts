import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string }) {
    const person = await this.prisma.person.findUnique({
      where: { id: payload.sub },
      include: {
        emails: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!person || person.accountStatus !== 'active') {
      throw new UnauthorizedException();
    }

    // Return user object to be attached to request
    return {
      id: person.id,
      email: person.emails[0]?.email,
      nameEn: person.nameEn,
      nameAr: person.nameAr,
    };
  }
} 