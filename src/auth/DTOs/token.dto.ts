import { IsNotEmpty, IsString } from 'class-validator';

export class TokenDTO {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
