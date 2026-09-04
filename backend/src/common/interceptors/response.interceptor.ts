import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  meta: Record<string, unknown> | null;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        // Allow handlers to return a pre-shaped { data, message, meta } object
        if (payload && typeof payload === 'object' && 'data' in payload) {
          return {
            success: true,
            message: payload.message ?? 'Success',
            data: payload.data ?? null,
            meta: payload.meta ?? null,
          };
        }

        // Plain value — wrap as data
        return {
          success: true,
          message: 'Success',
          data: payload ?? null,
          meta: null,
        };
      }),
    );
  }
}
