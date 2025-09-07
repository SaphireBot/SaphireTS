import { Schema, InferSchemaType } from "mongoose";
import { Lotto } from "../../@types/database";

export const LottoSchema = new Schema<Lotto>({
  id: Number,
  users: [String],
});

export type VoteSchemaType = InferSchemaType<typeof LottoSchema>;