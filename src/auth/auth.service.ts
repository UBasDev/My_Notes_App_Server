import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Gender, RoleName, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleRequestDTO } from './DTOs/create-role-request.dto';
import { CreateRoleResponseDTO } from './DTOs/create-role-response.dto';
import { RegisterRequestDTO } from './DTOs/register-request.dto';
import { RegisterServiceResponseDTO } from './DTOs/register-service-response.dto';
import configs from 'configs';
import { Response } from 'express';
import { LoginRequestDTO } from './DTOs/login-request.dto';
import { CheckIfEmailExistsDTO } from './DTOs/check-if-email-exists-request.dto';

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
    responseContext: Response,
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
      this.setResponseCookies(
        newGeneratedRefreshToken,
        newGeneratedAccessToken,
        newGeneratedUserInfoToken,
        responseContext,
      );
      return registerResponse;
    } catch (error) {
      console.log(error);
      throw new ConflictException(error);
    }
  }
  async loginUser(
    requestBody: LoginRequestDTO,
    responseContext: Response,
  ): Promise<string> {
    const currentUserFoundFromEmail = await this._prismaService.user.findUnique(
      {
        where: {
          email: requestBody.usernameOrEmail,
        },
        include: {
          Role: true,
        },
      },
    );
    if (!currentUserFoundFromEmail) {
      const currentUserFoundFromUsername =
        await this._prismaService.user.findUnique({
          where: {
            username: requestBody.usernameOrEmail,
          },
          include: {
            Role: true,
          },
        });
      if (!currentUserFoundFromUsername) {
        throw new BadRequestException(
          'There is no user found with given email or username',
        );
      } else {
        const isPasswordMatch =
          currentUserFoundFromUsername.password == requestBody.password;
        if (!isPasswordMatch) {
          throw new BadRequestException(
            'Please check your password and try again',
          );
        } else {
          const newGeneratedAccessToken = await this.generateAccessToken(
            currentUserFoundFromUsername.id,
            currentUserFoundFromUsername.email,
            currentUserFoundFromUsername.username,
          );
          const newGeneratedRefreshToken = await this.generateRefreshToken(
            currentUserFoundFromUsername.id,
            currentUserFoundFromUsername.email,
            currentUserFoundFromUsername.username,
          );
          const newGeneratedUserInfoToken = await this.generateUserInfoToken(
            currentUserFoundFromUsername.id,
            currentUserFoundFromUsername.email,
            currentUserFoundFromUsername.username,
            currentUserFoundFromUsername?.Role?.name || '',
            currentUserFoundFromUsername.name || '',
            currentUserFoundFromUsername.lastname || '',
            currentUserFoundFromUsername.gender || '',
          );
          this.setResponseCookies(
            newGeneratedRefreshToken,
            newGeneratedAccessToken,
            newGeneratedUserInfoToken,
            responseContext,
          );
          return `Hoşgeldin ${currentUserFoundFromUsername.email}!`;
        }
      }
    } else {
      const isPasswordMatch =
        currentUserFoundFromEmail.password == requestBody.password;
      if (!isPasswordMatch) {
        throw new BadRequestException(
          'Please check your password and try again',
        );
      } else {
        const newGeneratedAccessToken = await this.generateAccessToken(
          currentUserFoundFromEmail.id,
          currentUserFoundFromEmail.email,
          currentUserFoundFromEmail.username,
        );
        const newGeneratedRefreshToken = await this.generateRefreshToken(
          currentUserFoundFromEmail.id,
          currentUserFoundFromEmail.email,
          currentUserFoundFromEmail.username,
        );
        const newGeneratedUserInfoToken = await this.generateUserInfoToken(
          currentUserFoundFromEmail.id,
          currentUserFoundFromEmail.email,
          currentUserFoundFromEmail.username,
          currentUserFoundFromEmail?.Role?.name || '',
          currentUserFoundFromEmail.name || '',
          currentUserFoundFromEmail.lastname || '',
          currentUserFoundFromEmail.gender || '',
        );
        this.setResponseCookies(
          newGeneratedRefreshToken,
          newGeneratedAccessToken,
          newGeneratedUserInfoToken,
          responseContext,
        );
        return `Hoşgeldin ${currentUserFoundFromEmail.email}!`;
      }
    }
  }
  async checkIfEmailExists(
    bodyRequest: CheckIfEmailExistsDTO,
  ): Promise<boolean> {
    const currentUserFoundFromEmail = await this._prismaService.user.findUnique(
      {
        where: {
          email: bodyRequest.usernameOrEmail,
        },
      },
    );
    if (!currentUserFoundFromEmail) {
      const currentUserFoundFromUsername =
        await this._prismaService.user.findUnique({
          where: {
            username: bodyRequest.usernameOrEmail,
          },
        });
      if (!currentUserFoundFromEmail) {
        throw new BadRequestException(
          'There is no user found with given email or username',
        );
      } else {
        return true;
      }
    } else {
      return true;
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
  private setResponseCookies = (
    newGeneratedRefreshToken: string,
    newGeneratedAccessToken: string,
    newGeneratedUserInfoToken: string,
    responseContext: Response,
  ): void => {
    responseContext.cookie('refresh_token', newGeneratedRefreshToken, {
      httpOnly: true,
      signed: true, //Eğer `true` alırsa, bu cookieleri `main.ts` içerisinde `app.use(cookieParser(`cookie_secret`1))` şeklinde kendi belirlediğimiz `secret`larla hashlayerek gönderebiliriz
      domain: 'localhost', //Hangi hostun cookieyi alıp kullanabileceğini belirtir
      secure: false, //Eğer `true` alırsa, cookienin sadece HTTPS kaynakları tarafından tutulabilmesini sağlar
      maxAge: configs.refreshTokenCookieLifeTime, //10 min
      sameSite: 'strict', //Hiçbir 3. party requestlere bu cookie gönderilmeyecek
      //expires: new Date(Date.now() + 2 * 60 * 1000), //2 minutes
    });
    responseContext.cookie('access_token', newGeneratedAccessToken, {
      httpOnly: true,
      signed: true,
      secure: false,
      domain: 'localhost',
      maxAge: configs.accessTokenCookieLifeTime, //5 min
      sameSite: 'strict',
      //expires: new Date(Date.now() + 1 * 60 * 1000), //1 minutes
    });
    responseContext.cookie('my_notes', newGeneratedUserInfoToken, {
      httpOnly: false,
      signed: false,
      secure: false,
      domain: 'localhost',
      maxAge: configs.userInfoTokenCookieLifeTime,
      sameSite: 'strict',
    });
  };
}
