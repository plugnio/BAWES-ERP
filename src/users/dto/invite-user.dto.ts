import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteUserDto {
  @ApiProperty({ description: 'Email address of the user to invite' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'English name of the user', required: false })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiProperty({ description: 'Arabic name of the user', required: false })
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiProperty({
    description: 'Initial role to assign to the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  role?: string;
}
