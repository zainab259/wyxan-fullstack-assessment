import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateSiteDto } from './dto/create-site.dto';
import { SitesService } from './sites.service';

@Controller('sites')
export class SitesController {
  constructor(private readonly sites: SitesService) {}
  @Get() list() { return this.sites.list(); }
  @Get(':address') find(@Param('address') address: string) { return this.sites.find(address); }
  @Post() create(@Body() dto: CreateSiteDto) { return this.sites.create(dto); }
}
