import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';

@Module({
  imports: [JwtModule.registerAsync({
    global: true,
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      secret: config.getOrThrow<string>('AUTH_JWT_SECRET'),
      signOptions: { expiresIn: '15m' },
    }),
  })],
  controllers: [AuthController],
})
export class AuthModule {}
