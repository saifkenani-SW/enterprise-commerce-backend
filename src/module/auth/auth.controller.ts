import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { JwtService } from '@nestjs/jwt';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('token/generate')
  async generateToken(@Body() body: { userId: string; email: string }) {
    // ✅ يولد توكن بدون كلمة مرور - للاختبار فقط!
    const payload = { sub: body.userId, email: body.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  @Public()
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);

    // ✅ تخزين في HttpOnly Cookie
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
    });

    return {
      user: result.user,
    };
  }

  @Public()
  @Post('register')
  async register(
    @Body() body: { fullName: string; email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(
      body.fullName,
      body.email,
      body.password,
    );

    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      user: result.user,
    };
  }
}
