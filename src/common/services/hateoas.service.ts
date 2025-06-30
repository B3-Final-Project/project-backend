import {
  HateoasCollection,
  HateoasLink,
  HateoasResponse,
  LinkBuilder,
} from '../interfaces/hateoas.interface';

import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class HateoasService {
  private readonly linkBuilders: Map<string, LinkBuilder[]> = new Map();

  /**
   * Register link builders for a specific resource type
   */
  registerLinkBuilders(resourceType: string, builders: LinkBuilder[]): void {
    this.linkBuilders.set(resourceType, builders);
  }

  /**
   * Get base URL from request
   */
  private getBaseUrl(req: Request): string {
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}`;
  }

  /**
   * Build links for a resource
   */
  private buildLinks(
    resource: any,
    resourceType: string,
    req: Request,
  ): Record<string, HateoasLink> {
    const builders = this.linkBuilders.get(resourceType) || [];
    const baseUrl = this.getBaseUrl(req);
    const links: Record<string, HateoasLink> = {};

    builders.forEach((builder) => {
      // Check condition if present
      if (builder.condition && !builder.condition(resource, req)) {
        return;
      }

      let href: string;
      if (typeof builder.href === 'function') {
        href = builder.href(resource, req);
      } else {
        href = builder.href;
      }

      // Ensure href starts with baseUrl if it's a relative path
      if (!href.startsWith('http')) {
        href = href.startsWith('/')
          ? `${baseUrl}${href}`
          : `${baseUrl}/${href}`;
      }

      links[builder.rel] = {
        rel: builder.rel,
        href,
        method: builder.method || 'GET',
        type: builder.type,
        title: builder.title,
      };
    });

    return links;
  }

  /**
   * Wrap a single resource with HATEOAS links
   */
  wrapResource<T>(
    resource: T,
    resourceType: string,
    req: Request,
  ): HateoasResponse<T> {
    const links = this.buildLinks(resource, resourceType, req);

    return {
      data: resource,
      _links: links,
    };
  }

  /**
   * Wrap a collection of resources with HATEOAS links
   */
  wrapCollection<T>(
    resources: T[],
    resourceType: string,
    req: Request,
    meta?: {
      total?: number;
      offset?: number;
      limit?: number;
    },
  ): HateoasCollection<T> {
    const baseUrl = this.getBaseUrl(req);
    const currentUrl = `${baseUrl}${req.originalUrl}`;

    // Build collection links
    const collectionLinks: Record<string, HateoasLink> = {
      self: {
        rel: 'self',
        href: currentUrl,
        method: 'GET',
      },
    };

    // Add pagination links if meta information is provided
    if (meta?.limit && meta.offset !== undefined) {
      const { offset, limit, total } = meta;

      // Parse current URL to extract query parameters
      const url = new URL(currentUrl);
      const searchParams = url.searchParams;

      // First page
      searchParams.set('offset', '0');
      searchParams.set('limit', limit.toString());
      collectionLinks.first = {
        rel: 'first',
        href: url.toString(),
        method: 'GET',
      };

      // Previous page
      if (offset > 0) {
        const prevOffset = Math.max(0, offset - limit);
        searchParams.set('offset', prevOffset.toString());
        collectionLinks.prev = {
          rel: 'prev',
          href: url.toString(),
          method: 'GET',
        };
      }

      // Next page
      if (total && offset + limit < total) {
        const nextOffset = offset + limit;
        searchParams.set('offset', nextOffset.toString());
        collectionLinks.next = {
          rel: 'next',
          href: url.toString(),
          method: 'GET',
        };
      }

      // Last page
      if (total && total > limit) {
        const lastOffset = Math.floor((total - 1) / limit) * limit;
        searchParams.set('offset', lastOffset.toString());
        collectionLinks.last = {
          rel: 'last',
          href: url.toString(),
          method: 'GET',
        };
      }
    }

    return {
      data: resources,
      _links: collectionLinks,
      _meta: {
        count: resources.length,
        ...meta,
      },
    };
  }

  /**
   * Add individual resource links to collection items
   */
  wrapCollectionWithItemLinks<T>(
    resources: T[],
    resourceType: string,
    req: Request,
    meta?: {
      total?: number;
      offset?: number;
      limit?: number;
    },
  ): HateoasCollection<HateoasResponse<T>> {
    const wrappedResources = resources.map((resource) =>
      this.wrapResource(resource, resourceType, req),
    );

    const collectionResponse = this.wrapCollection(
      wrappedResources,
      `${resourceType}Collection`,
      req,
      meta,
    );

    return {
      ...collectionResponse,
      data: wrappedResources,
    };
  }
}
