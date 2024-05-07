import { Schema, InferSchemaType, Types } from "mongoose";
import { User } from "../../@types/database";

export const UserSchema = new Schema<User>({
    id: { type: String, unique: true },
    email: { type: String, default: "" },
    Likes: Number,
    Prefixes: [String],
    locale: { type: String, default: "pt-BR" },
    Tokens: {
        access_token: String,
        refresh_token: String,
        expires_at: Number
    },
    Xp: Number,
    Level: Number,
    Transactions: Array,
    Balance: Number,
    AfkSystem: String,
    DailyCount: Number,
    MixCount: Number,
    QuizCount: Number,
    CompetitiveMemoryCount: Number,
    ForcaCount: Number,
    GamingCount: {
        FlagCount: Number,
        AnimeThemeCount: Number,
        QuizAnime: Number,
        Logomarca: Number,
        QuizQuestions: Number,
        Characters: Object
    },
    Timeouts: {
        Bug: Number,
        Daily: Number,
        ImagesCooldown: Number,
        Loteria: Number,
        Cantada: Number,
        Bitcoin: Number,
        Porquinho: Number,
        TopGGVote: Number,
        Rep: Number,
        Reputation: Number
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
            StartAt: Number
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
        }
    },
    Vip: {
        DateNow: Number,
        TimeRemaing: Number,
        Permanent: Boolean
    },
    Walls: {
        Bg: Array,
        Set: String
    },
    Jokempo: {
        Wins: Number,
        Loses: Number
    }
});

export type UserSchemaType = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };