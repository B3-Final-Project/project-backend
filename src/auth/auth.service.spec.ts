import { AuthService } from './auth.service';
import { CognitoIdentityServiceProvider } from 'aws-sdk';
import { Response, Request } from 'express';
import { BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let cognito: CognitoIdentityServiceProvider;

  beforeEach(async () => {
    cognito = new CognitoIdentityServiceProvider();
    service = new AuthService();
    service['cognito'] = cognito;
    service['clientId'] = 'testClientId';
  });

  it('should register a new user', async () => {
    const body = {
      username: 'testuser',
      password: 'password', // NOSONAR
      email: 'test@example.com',
    };
    const signUpResponse = { UserSub: '12345' };
    jest.spyOn(cognito, 'signUp').mockReturnValue({
      promise: jest.fn().mockResolvedValue(signUpResponse),
    } as any);

    const result = await service.register(body);
    expect(result).toBe(signUpResponse);
  });

  it('should throw error if registration fails', async () => {
    const body = {
      username: 'testuser',
      password: 'password', // NOSONAR
      email: 'test@example.com',
    };
    jest.spyOn(cognito, 'signUp').mockReturnValue({
      promise: jest
        .fn()
        .mockRejectedValue(new BadRequestException('Registration failed')),
    } as any);

    await expect(service.register(body)).rejects.toThrow(BadRequestException);
  });

  it('should login a user and set refresh token cookie', async () => {
    const loginResponse = {
      AuthenticationResult: {
        AccessToken: 'access',
        IdToken: 'id',
        RefreshToken: 'refresh',
      },
    };
    jest.spyOn(cognito, 'initiateAuth').mockReturnValue({
      promise: jest.fn().mockResolvedValue(loginResponse),
    } as any);

    // Create a mock response object with a spy on setHeader
    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    // Call the login method with login credentials and the mock response
    const result = await service.login(
      { username: 'testuser', password: 'password' }, //NOSONAR
      res,
    );

    // Verify that the method returns the authentication result
    expect(result).toBe(loginResponse.AuthenticationResult);

    // Check that a cookie was set with the refresh token
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('refreshToken=refresh'),
    );
  });

  it('should throw error if login fails', async () => {
    jest.spyOn(cognito, 'initiateAuth').mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('Login failed')),
    } as any);

    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    await expect(
      service.login({ username: 'testuser', password: 'password' }, res), //NOSONAR
    ).rejects.toThrow(BadRequestException);
  });

  it('should confirm account', async () => {
    const confirmResponse = { UserConfirmed: true };
    jest.spyOn(cognito, 'confirmSignUp').mockReturnValue({
      promise: jest.fn().mockResolvedValue(confirmResponse),
    } as any);

    const result = await service.confirmAccount('testuser', '123456');
    expect(result).toBe(confirmResponse);
  });

  it('should throw error if account confirmation fails', async () => {
    jest.spyOn(cognito, 'confirmSignUp').mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('Confirmation failed')),
    } as any);

    await expect(service.confirmAccount('testuser', '123456')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should refresh token', async () => {
    const refreshResponse = {
      AuthenticationResult: { AccessToken: 'newAccess', IdToken: 'newId' },
    };
    jest.spyOn(cognito, 'initiateAuth').mockReturnValue({
      promise: jest.fn().mockResolvedValue(refreshResponse),
    } as any);

    // Create a fake request object with cookies containing the refresh token
    const req = {
      cookies: {
        refreshToken: 'refreshToken',
      },
    } as unknown as Request;

    const result = await service.refreshToken(req);
    expect(result).toBe(refreshResponse.AuthenticationResult);
  });

  it('should throw error if token refresh fails', async () => {
    jest.spyOn(cognito, 'initiateAuth').mockReturnValue({
      promise: jest.fn().mockRejectedValue(new Error('Token refresh failed')),
    } as any);

    const req = {
      cookies: {
        refreshToken: 'refreshToken',
      },
    } as unknown as Request;

    await expect(service.refreshToken(req)).rejects.toThrow(
      'Token refresh failed',
    );
  });
});
