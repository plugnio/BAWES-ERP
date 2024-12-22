import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePersonDto {
  @ApiPropertyOptional({ description: 'English name of the person' })
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Arabic name of the person' })
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiProperty({ description: 'Password hash for authentication' })
  @IsNotEmpty()
  @IsString()
  passwordHash: string;

  @ApiProperty({ description: 'Account status', default: 'active' })
  @IsOptional()
  @IsString()
  accountStatus?: string = 'active';
}
