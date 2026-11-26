import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';
import { TotpService } from './totp.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService, TotpService, SessionGuard],
  // Les futurs modules d'administration importent AuthModule pour utiliser SessionGuard.
  exports: [SessionService, SessionGuard],
})
export class AuthModule {}
