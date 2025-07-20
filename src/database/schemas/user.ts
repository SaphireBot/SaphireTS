import { Schema, InferSchemaType, Types } from "mongoose";
import { User } from "../../@types/database";

export const UserSchema = new Schema<User>({
    id: { type: String, unique: true },
    email: String,
    Likes: Number,
    Prefixes: [String],
    locale: String,
    Experience: new Schema({
        Xp: Number,
        Level: Number,
    }),
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
    QrCode: [{ name: String, content: String }],
    Marriage: new Schema({
        Spouse_id: String,
        Spouse: {
            type: Types.ObjectId,
            ref: "Users",
        },
        Since: {
            type: Date,
            default: () => Date.now(),
        },
    }),
    Stop: new Schema({
        categories: [String],
    }),
    Tokens: new Schema({
        access_token: String,
        refresh_token: String,
        expires_at: Number,
    }),
    GamingCount: new Schema({
        FlagCount: Number,
        AnimeThemeCount: Number,
        QuizAnime: Number,
        Logomarca: Number,
        QuizQuestions: Number,
        Characters: Object,
        QuizMembers: Number,
    }),
    Timeouts: new Schema({
        Daily: Number,
        Bitcoin: Number,
        Porquinho: Number,
        TopGGVote: Number,
    }),
    Perfil: new Schema({
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
    }),
    Vip: new Schema({
        DateNow: Number,
        TimeRemaing: Number,
        Permanent: Boolean,
    }),
    Walls: new Schema({
        Bg: Array,
        Set: String,
    }),
    Jokempo: new Schema({
        Wins: Number,
        Loses: Number,
        Draws: Number,
    }),
},
    {
        timestamps: true,
    });

export type UserSchemaType = InferSchemaType<typeof UserSchema> & { _id: Types.ObjectId };