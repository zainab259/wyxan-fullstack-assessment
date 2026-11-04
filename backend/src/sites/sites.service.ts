import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { normalizeAddress, readableText } from '../config/address';
import { User } from '../users/schemas/user.schema';
import { CreateSiteDto } from './dto/create-site.dto';
import { Site } from './schemas/site.schema';

@Injectable()
export class SitesService {
  constructor(@InjectModel(Site.name) private readonly sites: Model<Site>, @InjectModel(User.name) private readonly users: Model<User>) {}
  async list() { return this.sites.find().sort({ address: 1 }).populate('authorId', 'name').lean(); }
  async find(address: string) {
    const site = await this.sites.findOne({ address: normalizeAddress(address) }).populate('authorId', 'name').lean();
    if (!site) throw new NotFoundException('No site exists at that address.');
    return site;
  }
  async create(dto: CreateSiteDto) {
    const address = normalizeAddress(dto.address);
    if (!await this.users.exists({ _id: dto.authorId })) throw new NotFoundException('Select a valid author.');
    try { return await this.sites.create({ ...dto, address, searchableText: readableText(dto.html) }); }
    catch (error) { if (error instanceof Error && 'code' in error && error.code === 11000) throw new ConflictException('That address is already published.'); throw error; }
  }
  async search(q: string) {
    const query = q.trim();
    if (!query) return [];
    if (query.length > 120) return [];
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const candidates = await this.sites.find({ $or: [{ title: regex }, { searchableText: regex }] }).limit(100).populate('authorId', 'name').lean();
    return candidates.map((site) => {
      const text = readableText(site.html); const match = text.search(regex);
      const snippet = match < 0 ? text.slice(0, 150) : `${match > 45 ? '…' : ''}${text.slice(Math.max(0, match - 45), match + query.length + 90)}${match + query.length + 90 < text.length ? '…' : ''}`;
      return { address: site.address, title: site.title, snippet, author: site.authorId };
    }).sort((a, b) => Number(regex.test(b.title)) - Number(regex.test(a.title)) || a.address.localeCompare(b.address));
  }
}
