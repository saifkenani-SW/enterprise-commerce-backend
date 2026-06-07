import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../user/entities/user.entity';
import { JwtStrategy } from './auth.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }), // ✅ أضف register
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // ✅ JwtAuthGuard مش هنا - موجود في AppModule كـ APP_GUARD
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
