import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfirmMfaDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post('mfa/confirm')
  confirm(@Body() dto: ConfirmMfaDto) {
    return this.auth.confirmLoginMfa(dto.challengeId, dto.code);
  }
}
