import { Body, Controller, Get, Module, Post, Query } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IsMongoId } from 'class-validator';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Site, SiteSchema } from '../sites/schemas/site.schema';
import { CreateVisitDto } from './dto/create-visit.dto';
import { Visit, VisitSchema } from './schemas/visit.schema';
import { VisitsService } from './visits.service';
class VisitsQueryDto { @IsMongoId() userId!: string; }
@Controller('visits')
class VisitsController {
  constructor(private readonly visits: VisitsService) {}
  @Get() list(@Query() query: VisitsQueryDto) { return this.visits.list(query.userId); }
  @Post() create(@Body() dto: CreateVisitDto) { return this.visits.create(dto); }
}
@Module({ imports: [MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }, { name: User.name, schema: UserSchema }, { name: Site.name, schema: SiteSchema }])], controllers: [VisitsController], providers: [VisitsService] })
export class VisitsModule {}
