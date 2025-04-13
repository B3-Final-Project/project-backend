// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { InitiateAuthResponse } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import { Request, Response } from 'express';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

// We'll mock the aws-sdk CognitoIdentityServiceProvider using jest.
jest.mock('aws-sdk', () => {
  return {
    CognitoIdentityServiceProvider: jest.fn().mockImplementation(() => ({
      signUp: jest.fn(),
      initiateAuth: jest.fn(),
      confirmSignUp: jest.fn(),
    })),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let cognitoMock: jest.Mocked<CognitoIdentityServiceProvider>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // Access the cognito property from AuthService
    cognitoMock = (service as any).cognito;
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const registerResponse = { UserSub: '123' };
      // Mock signUp to return success
      cognitoMock.signUp.mockReturnValue({
        promise: () => Promise.resolve(registerResponse),
      } as any);

      const registerDto: RegisterDto = {
        email: 'test@example.com', //NOSONAR
        password: 'Password1!', //NOSONAR
        username: 'testuser',
      };

      const result = await service.register(registerDto);
      expect(result).toEqual(registerResponse);
      expect(cognitoMock.signUp).toHaveBeenCalled();
    });

    it('should throw BadRequestException on error', async () => {
      const error = { code: 'ErrorCode', message: 'Error message' };
      cognitoMock.signUp.mockReturnValue({
        promise: () => Promise.reject(error),
      } as any);

      const registerDto: RegisterDto = {
        email: 'test@example.com', //NOSONAR
        password: 'Password1!', //NOSONAR
        username: 'testuser',
      };

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should return Cognito ID token and set cookie', async () => {
      const loginResponse: InitiateAuthResponse = {
        AuthenticationResult: {
          IdToken: 'cognito-id-token',
          RefreshToken: 'cognito-refresh-token',
        },
      };
      cognitoMock.initiateAuth.mockReturnValue({
        promise: () => Promise.resolve(loginResponse),
      } as any);

      const loginDto: LoginDto = {
        email: 'test@example.com', //NOSONAR
        password: 'Password1!', //NOSONAR
      };
      const res: Partial<Response> = { setHeader: jest.fn() };

      const result = await service.login(loginDto, res as Response);
      expect(result).toEqual({ AccessToken: 'cognito-id-token' });
      expect(res.setHeader).toHaveBeenCalledWith(
        'Set-Cookie',
        expect.stringContaining('refreshToken=cognito-refresh-token'),
      );
    });

    it('should throw BadRequestException on login error', async () => {
      const error = { code: 'ErrorCode', message: 'Login error' };
      cognitoMock.initiateAuth.mockReturnValue({
        promise: () => Promise.reject(error),
      } as any);

      const loginDto: LoginDto = {
        email: 'test@example.com', //NOSONAR
        password: 'Password1!', //NOSONAR
      };
      const res: Partial<Response> = { setHeader: jest.fn() };

      await expect(service.login(loginDto, res as Response)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('confirmAccount', () => {
    it('should confirm account successfully', async () => {
      const confirmResponse = { success: true };
      // Set up confirmSignUp mock
      cognitoMock.confirmSignUp = jest.fn().mockReturnValue({
        promise: () => Promise.resolve(confirmResponse),
      }) as any;

      const result = await service.confirmAccount('test@example.com', '123456');
      expect(result).toEqual(confirmResponse);
      expect(cognitoMock.confirmSignUp).toHaveBeenCalled();
    });

    it('should throw BadRequestException on confirmation error', async () => {
      const error = { code: 'ErrorCode', message: 'Confirmation error' };
      cognitoMock.confirmSignUp = jest.fn().mockReturnValue({
        promise: () => Promise.reject(error),
      }) as any;

      await expect(
        service.confirmAccount('test@example.com', '123456'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshResponse: InitiateAuthResponse = {
        AuthenticationResult: {
          IdToken: 'new-id-token',
          AccessToken: 'new-access-token',
        },
      };
      cognitoMock.initiateAuth.mockReturnValue({
        promise: () => Promise.resolve(refreshResponse),
      } as any);

      const req: Partial<Request> = {
        cookies: { refreshToken: 'existing-refresh-token' },
      };

      const result = await service.refreshToken(req as Request);
      expect(result).toEqual(refreshResponse.AuthenticationResult);
      expect(cognitoMock.initiateAuth).toHaveBeenCalled();
    });

    it('should throw BadRequestException on refresh token error', async () => {
      const error = { code: 'ErrorCode', message: 'Refresh error' };
      cognitoMock.initiateAuth.mockReturnValue({
        promise: () => Promise.reject(error),
      } as any);

      const req: Partial<Request> = {
        cookies: { refreshToken: 'existing-refresh-token' },
      };

      await expect(service.refreshToken(req as Request)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
