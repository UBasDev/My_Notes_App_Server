import { Role } from '@prisma/client';
import { IsString } from 'class-validator';

export class CreateRoleResponseDTO {
  @IsString()
  message: string;
}
