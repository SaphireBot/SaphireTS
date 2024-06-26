import { Types } from "mongoose";

export interface Character {
  _id?: Types.ObjectId
  __v?: string,
  id: string
  name: string // Nome original do personagem na obra
  artwork: string // Nome original da obra do personagem
  nameLocalizations: Localizations,
  artworkLocalizations: Localizations,
  another_answers: string[] // Outras respostas possíveis
  credits?: string // Link da imagem de origem
  gender: "male" | "female" | "others" // Gênero do personagem
  category: "anime" | "movie" | "game" | "serie" | "animation" | "hq" | "k-drama" // Categoria da Obra
  pathname: string // Nome do arquivo na CDN
  authorId: string // Quem enviou a indicação
  channelId?: string // Canal de onde a indicação foi enviada
  autocompleteSearch?: string[], // Nomes para a busca no Autocomplete
  views?: number // Quantidade de visualizações
}

type Localizations = {
  de?: string | null | undefined
  "en-US"?: string | null | undefined
  "es-ES"?: string | null | undefined
  fr?: string | null | undefined
  ja?: string | null | undefined
  "pt-BR"?: string | null | undefined
  "zh-CN"?: string | null | undefined
};

export type LocalizationsKeys = "de" | "en-US" | "es-ES" | "fr" | "ja" | "pt-BR" | "zh-CN";