import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Site {
  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true }) address!: string;
  @Prop({ required: true, trim: true, maxlength: 120 }) title!: string;
  @Prop({ required: true, maxlength: 40000 }) html!: string;
  @Prop({ required: true, maxlength: 40000, index: true }) searchableText!: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true }) authorId!: Types.ObjectId;
}
export type SiteDocument = HydratedDocument<Site>;
export const SiteSchema = SchemaFactory.createForClass(Site);
