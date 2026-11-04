import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
export const NAVIGATION_METHODS = ['typed', 'link', 'back', 'forward', 'history', 'search', 'publish'] as const;
@Schema({ versionKey: false })
export class Visit {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) userId!: Types.ObjectId;
  @Prop({ required: true, lowercase: true, trim: true, index: true }) address!: string;
  @Prop({ type: String, required: true, enum: NAVIGATION_METHODS }) method!: typeof NAVIGATION_METHODS[number];
  @Prop({ type: Date, default: Date.now, required: true, index: true }) visitedAt!: Date;
  @Prop({ maxlength: 160 }) title?: string;
}
export type VisitDocument = HydratedDocument<Visit>;
export const VisitSchema = SchemaFactory.createForClass(Visit);
VisitSchema.index({ userId: 1, visitedAt: -1 });
