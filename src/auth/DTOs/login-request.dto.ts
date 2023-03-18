import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRequestDTO {
  @IsNotEmpty()
  @IsString()
  usernameOrEmail: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
