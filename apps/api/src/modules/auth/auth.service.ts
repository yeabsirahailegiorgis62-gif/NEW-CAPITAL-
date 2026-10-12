import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, pass: string) {
    const trimmed = identifier.trim();

    // Query user by email or employeeId
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmed, mode: 'insensitive' } },
          { employeeId: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact System Administrator.');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.identifier, loginDto.password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
