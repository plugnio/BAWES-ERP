import { IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleRolePermissionDto {
  @ApiProperty({ description: 'The permission code to toggle' })
  @IsString()
  permissionCode: string;

  @ApiProperty({ description: 'Whether to enable or disable the permission' })
  @IsBoolean()
  enabled: boolean;
} 