import { Schema, InferSchemaType, Types } from "mongoose";
import { User } from "../../@types/database";

export const UserSchema = new Schema<User>({
    id: { type: String, unique: true },
    email: { type: String, default: "" },
    Likes: Number,
    Prefixes: [String],
    locale: { type: String },
    Xp: Number,
    Level: Number,
    Transactions: Array,
    Balance: { type: Number, default: 0 },
    AfkSystem: String,
    DailyCount: Number,
    MixCount: Number,
    QuizCount: Number,
    CompetitiveMemoryCount: Number,
    ForcaCount: Number,
    Blackjack: Object,
    TopGGVotes: Number,
    Stop: {
        categories: [String],
    },
    Tokens: {
        access_token: String,
        refresh_token: String,
        expires_at: Number,
    },
    GamingCount: {
        FlagCount: Number,
        AnimeThemeCount: Number,
        QuizAnime: Number,
        Logomarca: Number,
        QuizQuestions: Number,
        Characters: Object,
    },
    Timeouts: {
        Daily: Number,
        Bitcoin: Number,
        Porquinho: Number,
        TopGGVote: Number,
    },
    Perfil: {
        Reputation: Array,
        Avatar: String,
        Titulo: String,
        Status: String,
        Sexo: String,
        Signo: String,
        Aniversario: String,
        Trabalho: String,
        BalanceOcult: Boolean,
        Marry: {
            Conjugate: String,
            StartAt: Number,
        },
        Bits: Number,
        Bitcoins: Number,
        Estrela: {
            Um: Boolean,
            Dois: Boolean,
            Tres: Boolean,
            Quatro: Boolean,
            Cinco: Boolean,
            Seis: Boolean,
        },
    },
    Vip: {
        DateNow: Number,
        TimeRemaing: Number,
        Permanent: Boolean,
    },
    Walls: {
        Bg: Array,
        Set: String,
    },
    Jokempo: {
        Wins: Number,
        Loses: Number,
        Draws: Number,
    },
});

export type UserSchemaType = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };