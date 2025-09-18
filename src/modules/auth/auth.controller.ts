import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import type { LoginDto, RegisterDto } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req) {
    await this.authService.logout(req.user._id);
    return { message: 'Logged out successfully' };
  }
}
