import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token for generating new access token',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refresh_token: string;
}
