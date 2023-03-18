import { IsNotEmpty, IsString } from 'class-validator';

export class CheckIfEmailExistsDTO {
  @IsNotEmpty()
  @IsString()
  usernameOrEmail: string;
}
