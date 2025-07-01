import { Global, Module } from '@nestjs/common';

import { HateoasInterceptor } from './interceptors/hateoas.interceptor';
import { HateoasService } from './services/hateoas.service';

@Global()
@Module({
  providers: [HateoasService, HateoasInterceptor],
  exports: [HateoasService, HateoasInterceptor],
})
export class HateoasModule {}
