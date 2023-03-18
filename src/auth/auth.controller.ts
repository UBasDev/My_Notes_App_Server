import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateRoleRequestDTO } from './DTOs/create-role-request.dto';
import { CreateRoleResponseDTO } from './DTOs/create-role-response.dto';

import { RegisterRequestDTO } from './DTOs/register-request.dto';
import { Response } from 'express';
import { LoginRequestDTO } from './DTOs/login-request.dto';
import { CheckIfEmailExistsDTO } from './DTOs/check-if-email-exists-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private _authService: AuthService) {}
  @Post('registerNewUser')
  async registerNewUser(
    @Body() requestBody: RegisterRequestDTO,
    @Res({ passthrough: true }) responseContext: Response,
    //@Req() requestContext: Request,
  ): Promise<string> {
    const registerUserResponse = await this._authService.registerNewUser(
      requestBody,
      responseContext,
    );
    return `Welcome ${registerUserResponse.username}!`;
  }
  @Post('createNewRole')
  async createNewRole(
    @Body() request: CreateRoleRequestDTO,
  ): Promise<CreateRoleResponseDTO> {
    const response = await this._authService.createNewRole(request);
    return response;
  }
  @Post('login')
  async login(
    @Body() requestBody: LoginRequestDTO,
    @Res({ passthrough: true }) responseContext: Response,
  ): Promise<string> {
    const loginUserResponse: string = await this._authService.loginUser(
      requestBody,
      responseContext,
    );
    return loginUserResponse;
  }
  @Post('isUsernameOrEmailExists')
  async checkIfEmailExists(
    @Body() bodyRequest: CheckIfEmailExistsDTO,
  ): Promise<boolean> {
    const checkEmailResponse = await this._authService.checkIfEmailExists(
      bodyRequest,
    );
    return checkEmailResponse;
  }
}
