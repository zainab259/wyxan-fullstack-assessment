import { ConflictException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Site } from './schemas/site.schema';
import { User } from '../users/schemas/user.schema';
import { SitesService } from './sites.service';

describe('SitesService publishing and search', () => {
  it('returns no matches for an empty query without reading the collection', async () => {
    const find = jest.fn();
    const service = new SitesService({ find } as unknown as Model<Site>, {} as Model<User>);
    await expect(service.search('   ')).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });

  it('stores normalized addresses and prose text for newly published HTML', async () => {
    const create = jest.fn().mockImplementation(async (value: unknown) => value);
    const users = { exists: jest.fn().mockResolvedValue({}) };
    const service = new SitesService({ create } as unknown as Model<Site>, users as unknown as Model<User>);
    await service.create({ address: 'Nature.ZZ', title: 'Coast', html: '<h1>Blue water</h1><script>hidden()</script>', authorId: '650000000000000000000001' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ address: 'nature.zz', searchableText: 'Blue water' }));
  });

  it('reports an address collision as a conflict', async () => {
    const duplicate = Object.assign(new Error('duplicate'), { code: 11000 });
    const sites = { create: jest.fn().mockRejectedValue(duplicate) };
    const users = { exists: jest.fn().mockResolvedValue({}) };
    const service = new SitesService(sites as unknown as Model<Site>, users as unknown as Model<User>);
    await expect(service.create({ address: 'coast.zz', title: 'Coast', html: '<p>Text</p>', authorId: '650000000000000000000001' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('escapes special search characters and searches extracted text', async () => {
    const row = { address: 'science.zz', title: 'Small experiments', html: '<h1>Example</h1><p>C++ helps count tools.</p>', searchableText: 'Example C++ helps count tools.', authorId: { name: 'Mina' } };
    const query = { limit: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([row]) };
    const sites = { find: jest.fn().mockReturnValue(query) };
    const service = new SitesService(sites as unknown as Model<Site>, {} as Model<User>);
    const result = await service.search('C++');
    expect(sites.find).toHaveBeenCalledWith({ $or: [{ title: expect.any(RegExp) }, { searchableText: expect.any(RegExp) }] });
    expect(result[0]?.snippet).toContain('C++');
    expect(result[0]?.address).toBe('science.zz');
  });

  it('finds a page through its title', async () => {
    const row = { address: 'observatory.zz', title: 'A Window on the Night Sky', html: '<p>Planets and stars.</p>', searchableText: 'Planets and stars.', authorId: { name: 'Mina' } };
    const query = { limit: jest.fn().mockReturnThis(), populate: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue([row]) };
    const sites = { find: jest.fn().mockReturnValue(query) };
    const service = new SitesService(sites as unknown as Model<Site>, {} as Model<User>);
    const result = await service.search('Night Sky');
    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('A Window on the Night Sky');
  });
});
