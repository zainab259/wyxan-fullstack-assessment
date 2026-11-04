import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { normalizeAddress } from '../config/address';
import { Site } from '../sites/schemas/site.schema';
import { User } from '../users/schemas/user.schema';
import { CreateVisitDto } from './dto/create-visit.dto';
import { Visit } from './schemas/visit.schema';

@Injectable()
export class VisitsService {
  constructor(@InjectModel(Visit.name) private readonly visits: Model<Visit>, @InjectModel(User.name) private readonly users: Model<User>, @InjectModel(Site.name) private readonly sites: Model<Site>) {}

  list(userId: string) {
    return this.visits.find({ userId }).sort({ visitedAt: -1, _id: -1 }).limit(500).lean();
  }

  async create(dto: CreateVisitDto) {
    if (!await this.users.exists({ _id: dto.userId })) throw new BadRequestException('Select a valid user.');
    const address = normalizeAddress(dto.address);
    const site = await this.sites.findOne({ address }, { title: 1 }).lean();
    if (!site) throw new NotFoundException('A visit can only be recorded for a published site.');
    return this.visits.create({ ...dto, address, title: site.title });
  }
}
