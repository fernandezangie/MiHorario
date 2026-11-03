import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class GoogleOidcLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'GOOGLE_ID_TOKEN_REQUIRED' })
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
