// DECORATOR: Marks a route as public so JwtAuthGuard and RolesGuard skip it.
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
