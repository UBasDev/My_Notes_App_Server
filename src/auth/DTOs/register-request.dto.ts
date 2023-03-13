import { Gender } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterRequestDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  username: string;
  @IsString()
  name: string;
  @IsString()
  lastname: string;
  @IsString()
  @IsNotEmpty()
  password: string;
  @IsString()
  gender: Gender;
}
