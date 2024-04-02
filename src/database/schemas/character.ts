import { Schema, InferSchemaType, Types } from "mongoose";
import { Character } from "../../@types/quiz";

const languagesPattern = {
  de: String,
  "en-US": String,
  "es-ES": String,
  fr: String,
  ja: String,
  "pt-BR": String,
  "zh-CN": String
};

export const CharacterSchema = new Schema<Character>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  artwork: { type: String, required: true },
  nameLocalizations: languagesPattern, // Nome original do personagem na obra
  artworkLocalizations: languagesPattern, // Obra do personagem
  another_answers: { type: [String], default: [] }, // Outras respostas possíveis
  credits: { type: String }, // Link da imagem de origem
  gender: { type: String, required: true }, // Gênero do personagem
  category: { type: String, required: true }, // Categoria da Obra
  pathname: { type: String, required: true }, // Nome do arquivo na CDN
  authorId: { type: String },
  channelId: { type: String }
});

export type CharacterSchemaType = InferSchemaType<typeof CharacterSchema> & { _id: Types.ObjectId };