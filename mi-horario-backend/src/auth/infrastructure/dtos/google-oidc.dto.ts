import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GoogleOidcLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'El idToken de Google OpenID Connect es obligatorio.' })
  @MaxLength(4096)
  idToken: string;

  @IsOptional()
  @IsString()
  @IsIn(['ADMIN', 'EMPLOYEE'])
  role?: 'ADMIN' | 'EMPLOYEE';
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  refreshToken?: string;
}

