import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize = 20;

  @IsOptional() @IsString()
  search?: string;

  /** Optional list-direction / filter params accepted alongside pagination. */
  @IsOptional() @IsString()
  direction?: string;

  @IsOptional() @IsString()
  status?: string;

  @IsOptional() @IsString()
  orgId?: string;

  get skip() {
    return (this.page - 1) * this.pageSize;
  }
  get take() {
    return this.pageSize;
  }
}

export const paginated = <T>(items: T[], total: number, q: PaginationQuery) => ({
  items,
  total,
  page: q.page,
  pageSize: q.pageSize,
});
