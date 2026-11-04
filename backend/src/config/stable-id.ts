import { createHash } from 'node:crypto';
import { Types } from 'mongoose';

export function stableObjectId(seed: string): Types.ObjectId {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 24);
  return new Types.ObjectId(hex);
}
