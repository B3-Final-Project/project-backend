export interface HateoasLink {
  rel: string;
  href: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  type?: string;
  title?: string;
}

export interface HateoasResponse<T = any> {
  data: T;
  _links: Record<string, HateoasLink>;
}

export interface HateoasCollection<T = any> {
  data: T[];
  _links: Record<string, HateoasLink>;
  _meta?: {
    total?: number;
    count: number;
    offset?: number;
    limit?: number;
  };
}

export interface HateoasConfig {
  baseUrl?: string;
  includeLinks?: string[];
  excludeLinks?: string[];
}

export interface LinkBuilder {
  rel: string;
  href: string | ((resource: any, req?: any) => string);
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  type?: string;
  title?: string;
  condition?: (resource: any, req?: any) => boolean;
}
