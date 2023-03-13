import { RoleName } from '@prisma/client';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleRequestDTO {
  @IsString()
  @IsNotEmpty()
  roleName: RoleName;
}
