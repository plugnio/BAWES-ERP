import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ description: 'The name of the role' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'The description of the role' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'List of permission IDs assigned to the role' })
  @IsArray()
  @IsOptional()
  permissionIds?: string[];

  @ApiProperty({ description: 'Whether this is a system role' })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  @IsOptional()
  sortOrder?: number;
} 