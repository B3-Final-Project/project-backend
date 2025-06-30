import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import {
  HATEOAS_COLLECTION_ONLY_KEY,
  HATEOAS_LINKS_KEY,
  HATEOAS_RESOURCE_TYPE_KEY,
} from '../decorators/hateoas.decorator';

import { HateoasService } from '../services/hateoas.service';
import { LinkBuilder } from '../interfaces/hateoas.interface';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class HateoasInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly hateoasService: HateoasService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();

    // Get metadata from the handler
    const resourceType = this.reflector.get<string>(
      HATEOAS_RESOURCE_TYPE_KEY,
      handler,
    );
    const links = this.reflector.get<LinkBuilder[]>(HATEOAS_LINKS_KEY, handler);
    const collectionOnly = this.reflector.get<boolean>(
      HATEOAS_COLLECTION_ONLY_KEY,
      handler,
    );

    // If no HATEOAS metadata is found, return original response
    if (!resourceType) {
      return next.handle();
    }

    // Register links if provided
    if (links) {
      this.hateoasService.registerLinkBuilders(resourceType, links);
    }

    return next.handle().pipe(
      map((data) => {
        if (!data) {
          return data;
        }

        // Handle array responses (collections)
        if (Array.isArray(data)) {
          if (collectionOnly) {
            return this.hateoasService.wrapCollection(
              data,
              resourceType,
              request,
            );
          } else {
            return this.hateoasService.wrapCollectionWithItemLinks(
              data,
              resourceType,
              request,
            );
          }
        }

        // Handle paginated responses
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          Array.isArray(data.data)
        ) {
          const { data: items, ...meta } = data;
          if (collectionOnly) {
            return this.hateoasService.wrapCollection(
              items,
              resourceType,
              request,
              meta,
            );
          } else {
            return this.hateoasService.wrapCollectionWithItemLinks(
              items,
              resourceType,
              request,
              meta,
            );
          }
        }

        // Handle single resource responses
        return this.hateoasService.wrapResource(data, resourceType, request);
      }),
    );
  }
}
