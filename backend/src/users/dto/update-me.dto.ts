import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: '0901234567', minLength: 10, maxLength: 11 })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10,11}$/, {
    message: 'phone phải gồm 10 hoặc 11 chữ số',
  })
  phone?: string;
}
