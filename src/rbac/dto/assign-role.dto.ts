import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({ description: 'List of role IDs to assign to the user' })
  @IsArray()
  roleIds: string[];
} 