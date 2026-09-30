import { IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetContactMessagesQueryDto {
  /**
   * Optional filter: 'true' returns read messages, 'false' returns unread.
   * The @Transform decorator runs first (before any implicit type coercion)
   * and converts the raw query string 'true'/'false' to a native boolean.
   */
  @IsOptional()
  @IsIn([true, false], { message: 'isRead must be a boolean value' })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isRead?: boolean;
}
