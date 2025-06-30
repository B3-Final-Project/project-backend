import { LinkBuilder } from '../interfaces/hateoas.interface';
import { SetMetadata } from '@nestjs/common';

export const HATEOAS_LINKS_KEY = 'hateoas_links';
export const HATEOAS_RESOURCE_TYPE_KEY = 'hateoas_resource_type';
export const HATEOAS_COLLECTION_ONLY_KEY = 'hateoas_collection_only';

/**
 * Decorator to define HATEOAS links for a controller method
 */
export const HateoasLinks = (resourceType: string, links: LinkBuilder[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(HATEOAS_RESOURCE_TYPE_KEY, resourceType)(
      target,
      propertyKey,
      descriptor,
    );
    SetMetadata(HATEOAS_LINKS_KEY, links)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator to define HATEOAS links for a collection without individual item links
 */
export const HateoasCollectionOnly = (
  resourceType: string,
  links: LinkBuilder[] = [],
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(HATEOAS_RESOURCE_TYPE_KEY, resourceType)(
      target,
      propertyKey,
      descriptor,
    );
    SetMetadata(HATEOAS_LINKS_KEY, links)(target, propertyKey, descriptor);
    SetMetadata(HATEOAS_COLLECTION_ONLY_KEY, true)(
      target,
      propertyKey,
      descriptor,
    );
  };
};

/**
 * Decorator to define the resource type for HATEOAS
 */
export const HateoasResource = (resourceType: string) => {
  return SetMetadata(HATEOAS_RESOURCE_TYPE_KEY, resourceType);
};
