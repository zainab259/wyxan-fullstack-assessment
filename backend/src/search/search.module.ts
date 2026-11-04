import { Controller, Get, Module, Query } from '@nestjs/common';
import { SitesModule } from '../sites/sites.module';
import { SitesService } from '../sites/sites.service';

@Controller('search')
class SearchController {
  constructor(private readonly sites: SitesService) {}
  @Get() search(@Query('q') query = '') { return this.sites.search(query); }
}
@Module({ imports: [SitesModule], controllers: [SearchController] })
export class SearchModule {}
