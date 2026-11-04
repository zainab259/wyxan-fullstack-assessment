import { Model } from 'mongoose';
import { Site } from '../sites/schemas/site.schema';
import { User } from '../users/schemas/user.schema';
import { Visit } from './schemas/visit.schema';
import { VisitsService } from './visits.service';

describe('VisitsService', () => {
  it('filters history per user, sorts newest first, and preserves repeat visits', async () => {
    const rows = [{ address: 'nature.zz', visitedAt: new Date('2025-01-01T12:04:00Z') }, { address: 'nature.zz', visitedAt: new Date('2025-01-01T12:00:00Z') }];
    const query = { sort: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), lean: jest.fn().mockResolvedValue(rows) };
    const visits = { find: jest.fn().mockReturnValue(query) };
    const service = new VisitsService(visits as unknown as Model<Visit>, {} as Model<User>, {} as Model<Site>);
    await expect(service.list('avery-id')).resolves.toBe(rows);
    expect(visits.find).toHaveBeenCalledWith({ userId: 'avery-id' });
    expect(query.sort).toHaveBeenCalledWith({ visitedAt: -1, _id: -1 });
    expect(rows).toHaveLength(2);
  });
  it('normalizes visits and uses the published title', async () => {
    const users = { exists: jest.fn().mockResolvedValue({}) };
    const sites = { findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ title: 'Coastal notes' }) }) };
    const visits = { create: jest.fn().mockImplementation(async (row: unknown) => row) };
    const service = new VisitsService(visits as unknown as Model<Visit>, users as unknown as Model<User>, sites as unknown as Model<Site>);
    await service.create({ userId: '650000000000000000000001', address: 'Nature.ZZ', method: 'typed' });
    expect(visits.create).toHaveBeenCalledWith(expect.objectContaining({ address: 'nature.zz', title: 'Coastal notes' }));
  });
  it('does not record visits for missing sites', async () => {
    const users = { exists: jest.fn().mockResolvedValue({}) };
    const sites = { findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }) };
    const visits = { create: jest.fn() };
    const service = new VisitsService(visits as unknown as Model<Visit>, users as unknown as Model<User>, sites as unknown as Model<Site>);
    await expect(service.create({ userId: '650000000000000000000001', address: 'nowhere.zz', method: 'link' })).rejects.toThrow('A visit can only be recorded');
    expect(visits.create).not.toHaveBeenCalled();
  });
});
