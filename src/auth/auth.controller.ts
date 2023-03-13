import { Body, Controller, Get, Post, Req, Res, Session } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateRoleRequestDTO } from './DTOs/create-role-request.dto';
import { CreateRoleResponseDTO } from './DTOs/create-role-response.dto';

import { RegisterRequestDTO } from './DTOs/register-request.dto';
import { RegisterResponseDTO } from './DTOs/register-response.dto';
import { Response, Request } from 'express';
import configs from 'configs';

@Controller('auth')
export class AuthController {
  constructor(private _authService: AuthService) {}
  @Post('registerNewUser')
  async registerNewUser(
    @Body() requestBody: RegisterRequestDTO,
    @Res({ passthrough: true }) responseContext: Response,
    @Req() requestContext: Request,
  ): Promise<string> {
    console.log(requestContext.signedCookies);
    const registerUserResponse = await this._authService.registerNewUser(
      requestBody,
    );
    responseContext.cookie(
      'refresh_token',
      registerUserResponse.refresh_token,
      {
        httpOnly: true,
        signed: true, //Eğer `true` alırsa, bu cookieleri `main.ts` içerisinde `app.use(cookieParser(`cookie_secret`1))` şeklinde kendi belirlediğimiz `secret`larla hashlayerek gönderebiliriz
        domain: 'localhost', //Hangi hostun cookieyi alıp kullanabileceğini belirtir
        secure: false, //Eğer `true` alırsa, cookienin sadece HTTPS kaynakları tarafından tutulabilmesini sağlar
        maxAge: configs.refreshTokenCookieLifeTime, //10 min
        sameSite: 'strict', //Hiçbir 3. party requestlere bu cookie gönderilmeyecek
        //expires: new Date(Date.now() + 2 * 60 * 1000), //2 minutes
      },
    );
    responseContext.cookie('access_token', registerUserResponse.access_token, {
      httpOnly: true,
      signed: true,
      secure: false,
      domain: 'localhost',
      maxAge: configs.accessTokenCookieLifeTime, //5 min
      sameSite: 'strict',
      //expires: new Date(Date.now() + 1 * 60 * 1000), //1 minutes
    });
    responseContext.cookie('my_notes', registerUserResponse.user_info_token, {
      httpOnly: false,
      signed: false,
      secure: false,
      domain: 'localhost',
      maxAge: configs.userInfoTokenCookieLifeTime,
      sameSite: 'strict',
    });
    const {
      access_token,
      refresh_token,
      user_info_token,
      ...restOfRegisterResponse
    } = registerUserResponse;

    return `Hoşgeldin ${registerUserResponse.username}!`;
  }
  @Post('createNewRole')
  async createNewRole(
    @Body() request: CreateRoleRequestDTO,
  ): Promise<CreateRoleResponseDTO> {
    const response = await this._authService.createNewRole(request);
    return response;
  }
}
