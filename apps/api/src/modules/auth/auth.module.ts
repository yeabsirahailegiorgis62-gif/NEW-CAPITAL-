// MODULE: Authentication feature. Registers JWT signing, Passport JWT strategy, and AuthService.
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JWT_SECRET } from './auth.constants';

import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: JWT_SECRET,
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
