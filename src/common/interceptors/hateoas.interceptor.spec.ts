import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppLinkBuilders } from '../utils/hateoas-links.util';
import { HateoasInterceptor } from './hateoas.interceptor';
import { HateoasService } from '../services/hateoas.service';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';

describe('HateoasInterceptor', () => {
  let interceptor: HateoasInterceptor;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HateoasInterceptor, HateoasService, Reflector],
    }).compile();

    interceptor = module.get<HateoasInterceptor>(HateoasInterceptor);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap single resource with HATEOAS links', (done) => {
    const mockRequest = {
      protocol: 'http',
      get: () => 'localhost:3000',
      originalUrl: '/users/123',
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () => of({ id: '123', name: 'John Doe' }),
    } as CallHandler;

    // Mock reflector to return resource type
    jest.spyOn(reflector, 'get').mockImplementation((key: string) => {
      if (key === 'hateoas_resource_type') return 'user';
      if (key === 'hateoas_links') return AppLinkBuilders.userLinks();
      return undefined;
    });

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('_links');
      expect(result.data).toEqual({ id: '123', name: 'John Doe' });
      expect(result._links).toHaveProperty('self');
      done();
    });
  });

  it('should wrap array response as collection', (done) => {
    const mockRequest = {
      protocol: 'http',
      get: () => 'localhost:3000',
      originalUrl: '/users',
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
    } as ExecutionContext;

    const mockCallHandler = {
      handle: () =>
        of([
          { id: '123', name: 'John Doe' },
          { id: '456', name: 'Jane Smith' },
        ]),
    } as CallHandler;

    // Mock reflector to return resource type
    jest.spyOn(reflector, 'get').mockImplementation((key: string) => {
      if (key === 'hateoas_resource_type') return 'user';
      if (key === 'hateoas_links') return AppLinkBuilders.userLinks();
      return undefined;
    });

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('_links');
      expect(result).toHaveProperty('_meta');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result._meta.count).toBe(2);
      done();
    });
  });

  it('should pass through response when no HATEOAS metadata is found', (done) => {
    const mockRequest = {
      protocol: 'http',
      get: () => 'localhost:3000',
      originalUrl: '/users/123',
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
    } as ExecutionContext;

    const originalData = { id: '123', name: 'John Doe' };
    const mockCallHandler = {
      handle: () => of(originalData),
    } as CallHandler;

    // Mock reflector to return no metadata
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toEqual(originalData);
      done();
    });
  });
});
