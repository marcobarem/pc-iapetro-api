import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '@core/decorators/is-public.decorator'

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly secretKey: string,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    )

    if (isPublic) {
      return next.handle()
    }
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers['authorization']

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token')
    }

    const token = authHeader.split(' ')[1]

    try {
      if (token !== this.secretKey) {
        throw new ForbiddenException('Invalid Token')
      }
    } catch (error) {
      throw new ForbiddenException('Invalid token')
    }

    return next.handle()
  }
}
