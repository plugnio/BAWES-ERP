import { IsString, IsOptional, IsArray, IsHexColor } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Name of the role' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the role', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Hex color code for the role', required: false })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Initial permission codes to assign', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
} 