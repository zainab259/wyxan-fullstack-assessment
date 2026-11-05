import { SiteSchema } from '../sites/schemas/site.schema';
import { VisitSchema } from '../visits/schemas/visit.schema';

describe('MongoDB reference fields', () => {
  it('stores site authors as ObjectIds', () => {
    expect(SiteSchema.path('authorId').instance).toBe('ObjectId');
    expect(SiteSchema.path('authorId').options.ref).toBe('User');
  });

  it('stores visit readers as ObjectIds', () => {
    expect(VisitSchema.path('userId').instance).toBe('ObjectId');
    expect(VisitSchema.path('userId').options.ref).toBe('User');
  });
});
