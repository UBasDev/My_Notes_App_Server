import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { TokenDTO } from './token.dto';

export class RegisterServiceResponseDTO {
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  username: string;
  @IsNumber()
  @IsNotEmpty()
  userId: number;
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  lastname: string;
  @IsNotEmpty()
  @IsString()
  access_token: string;
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
  @IsNotEmpty()
  @IsString()
  user_info_token: string;
  @IsString()
  @IsNotEmpty()
  roleName: string;
}
