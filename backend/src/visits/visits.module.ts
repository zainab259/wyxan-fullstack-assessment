import { BadRequestException, Body, Controller, Get, Module, NotFoundException, Post, Query } from '@nestjs/common';
import { InjectModel, MongooseModule } from '@nestjs/mongoose';
import { IsMongoId } from 'class-validator';
import { Model } from 'mongoose';
import { normalizeAddress } from '../config/address';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Site, SiteSchema } from '../sites/schemas/site.schema';
import { CreateVisitDto } from './dto/create-visit.dto';
import { Visit, VisitSchema } from './schemas/visit.schema';
class VisitsQueryDto { @IsMongoId() userId!: string; }
@Controller('visits')
class VisitsController {
  constructor(@InjectModel(Visit.name) private readonly visits: Model<Visit>, @InjectModel(User.name) private readonly users: Model<User>, @InjectModel(Site.name) private readonly sites: Model<Site>) {}
  @Get() async list(@Query() query: VisitsQueryDto) {
    if (!query.userId) throw new BadRequestException('userId is required.');
    return this.visits.find({ userId: query.userId }).sort({ visitedAt: -1, _id: -1 }).limit(500).lean();
  }
  @Post() async create(@Body() dto: CreateVisitDto) {
    if (!await this.users.exists({ _id: dto.userId })) throw new BadRequestException('Select a valid user.');
    const address = normalizeAddress(dto.address);
    const site = await this.sites.findOne({ address }, { title: 1 }).lean();
    if (!site) throw new NotFoundException('A visit can only be recorded for a published site.');
    return this.visits.create({ ...dto, address, title: site.title });
  }
}
@Module({ imports: [MongooseModule.forFeature([{ name: Visit.name, schema: VisitSchema }, { name: User.name, schema: UserSchema }, { name: Site.name, schema: SiteSchema }])], controllers: [VisitsController] })
export class VisitsModule {}
