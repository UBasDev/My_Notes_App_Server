import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Gender, RoleName } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleRequestDTO } from './DTOs/create-role-request.dto';
import { CreateRoleResponseDTO } from './DTOs/create-role-response.dto';
import { RegisterRequestDTO } from './DTOs/register-request.dto';
import { RegisterServiceResponseDTO } from './DTOs/register-service-response.dto';
import configs from 'configs';

@Injectable()
export class AuthService {
  private _accessTokenLifeTime: number = configs.accessTokenLifeTime;
  private _refreshTokenLifeTime: number = configs.refreshTokenLifeTime;
  private _userInfoTokenLifeTime: number = configs.userInfoTokenLifeTime;
  async createNewRole(
    request: CreateRoleRequestDTO,
  ): Promise<CreateRoleResponseDTO> {
    try {
      const createRoleResponse: CreateRoleResponseDTO =
        new CreateRoleResponseDTO();
      const createdRole = await this._prismaService.role.create({
        data: {
          name: request.roleName,
        },
      });
      if (!createdRole)
        throw new BadRequestException(
          'Something went wrong, role couldnt be created',
        );
      createRoleResponse.message = `${createdRole.name} isimli rol başarıyla oluşturuldu`;
      return createRoleResponse;
    } catch (error) {
      console.log(error);
      throw new ConflictException(error);
    }
  }
  constructor(
    private readonly _prismaService: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}
  async registerNewUser(
    registerRequest: RegisterRequestDTO,
  ): Promise<RegisterServiceResponseDTO> {
    try {
      const registerResponse: RegisterServiceResponseDTO =
        new RegisterServiceResponseDTO();
      const isEmailAlreadyExists = await this._prismaService.user.findUnique({
        where: {
          email: registerRequest.email,
        },
      });
      if (isEmailAlreadyExists) {
        throw new BadRequestException('This email already exists');
      }
      const isUsernameExists = await this._prismaService.user.findUnique({
        where: {
          username: registerRequest.username,
        },
      });
      if (isUsernameExists) {
        throw new BadRequestException('This username already exists');
      }

      const createdNewUser = await this._prismaService.user.create({
        data: {
          email: registerRequest.email,
          username: registerRequest.username,
          password: registerRequest.password,
          name: registerRequest.name || '',
          lastname: registerRequest.lastname || '',
          gender: registerRequest.gender || Gender.Other,
          roleId: 1,
        },
      });
      const assignedUserRole = await this._prismaService.role.findUnique({
        where: {
          id: createdNewUser.roleId,
        },
      });
      if (!createdNewUser) {
        throw new BadRequestException(
          'Something went wrong, user couldnt be created',
        );
      }
      const newGeneratedAccessToken = await this.generateAccessToken(
        createdNewUser.id,
        createdNewUser.email,
        createdNewUser.username,
      );
      const newGeneratedRefreshToken = await this.generateRefreshToken(
        createdNewUser.id,
        createdNewUser.email,
        createdNewUser.username,
      );
      const newGeneratedUserInfoToken = await this.generateUserInfoToken(
        createdNewUser.id,
        createdNewUser.email,
        createdNewUser.username,
        assignedUserRole?.name || '',
        createdNewUser.name || '',
        createdNewUser.lastname || '',
        createdNewUser.gender || '',
      );
      registerResponse.email = createdNewUser.email;
      registerResponse.name = createdNewUser.name || '';
      registerResponse.lastname = createdNewUser.lastname || '';
      registerResponse.userId = createdNewUser.id;
      registerResponse.username = createdNewUser.username;
      registerResponse.roleName = assignedUserRole?.name || '';
      registerResponse.access_token = newGeneratedAccessToken || '';
      registerResponse.refresh_token = newGeneratedRefreshToken || '';
      registerResponse.user_info_token = newGeneratedUserInfoToken || '';
      return registerResponse;
    } catch (error) {
      console.log(error);
      throw new ConflictException(error);
    }
  }
  private generateAccessToken = async (
    userId: number,
    email: string,
    username: string,
  ): Promise<string> => {
    const newAccessToken = await this._jwtService.signAsync(
      {
        userId,
        email,
        username,
      },
      {
        secret: process.env.ACCESS_TOKEN_SECRET_KEY,
        expiresIn: this._accessTokenLifeTime,
        algorithm: 'HS512',
        issuer: 'http://localhost:3000',
        audience: ['http://localhost:3001', 'https://localhost:3001'],
      },
    );
    return newAccessToken;
  };
  private generateRefreshToken = async (
    userId: number,
    email: string,
    username: string,
  ): Promise<string> => {
    const newRefreshToken = await this._jwtService.signAsync(
      {
        userId,
        email,
        username,
      },

      {
        secret: process.env.REFRESH_TOKEN_SECRET_KEY,
        expiresIn: this._refreshTokenLifeTime,
        algorithm: 'HS512',
        issuer: 'http://localhost:3000',
        audience: ['http://localhost:3001', 'https://localhost:3001'],
      },
    );
    return newRefreshToken;
  };
  private generateUserInfoToken = async (
    userId: number,
    email: string,
    username: string,
    roleName: string,
    name: string,
    lastname: string,
    gender: string,
  ): Promise<string> => {
    const newUserInfoToken = await this._jwtService.signAsync(
      {
        userId,
        email,
        username,
        roleName,
        name,
        lastname,
        gender,
      },
      {
        secret: process.env.USER_INFO_TOKEN_SECRET_KEY,
        expiresIn: this._userInfoTokenLifeTime,
        algorithm: 'HS512',
        issuer: 'http://localhost:3000',
        audience: ['http://localhost:3001', 'https://localhost:3001'],
      },
    );
    return newUserInfoToken;
  };
}
