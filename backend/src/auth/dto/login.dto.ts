import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'customer@test.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo@2026' })
  @IsString()
  password!: string;
}
