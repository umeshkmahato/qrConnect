import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { PaginationQuery } from '../common/pagination';
import { AuthUser } from '../auth/auth.types';
import { ContactRequestsService } from './contact-requests.service';
import { CreateContactRequestDto, RespondContactRequestDto } from './dto';

@ApiTags('contact-requests')
@Controller('api/v1/contact-requests')
export class ContactRequestsController {
  constructor(private readonly service: ContactRequestsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateContactRequestDto) {
    return this.service.create(user, dto);
  }

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query() q: PaginationQuery,
    @Query('direction') direction?: 'sent' | 'received',
  ) {
    return this.service.list(user, q, direction ?? 'sent');
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.get(user, id);
  }

  @Post(':id/respond')
  respond(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: RespondContactRequestDto) {
    return this.service.respond(user, id, dto);
  }
}
