import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpRequestDto } from '../common/dto/http-request.dto';

@Injectable()
export class IsAdmin implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as HttpRequestDto;
    const user = request.user;

    if (!user || !user.groups.includes('admin')) {
      throw new UnauthorizedException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}
