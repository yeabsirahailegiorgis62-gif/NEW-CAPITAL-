import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'capital_fleet_super_secure_jwt_secret_change_in_production_2026',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        department: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not authorized or account is inactive');
    }

    // Exclude passwordHash from user object
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
