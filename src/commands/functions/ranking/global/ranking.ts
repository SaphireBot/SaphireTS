import { ChatInputCommandInteraction, StringSelectMenuInteraction, Message } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import build from "./build";
import quizSelect from "./rank.quiz.select";

export const categories = [
    { type: "balance", emoji: e.safira },
    { type: "daily", emoji: "📅" },
    { type: "level", emoji: e.RedStar },
    { type: "likes", emoji: e.Like },
    { type: "logomarca", emoji: e.logomarca },
    // { type: "quiz_anime", emoji: e.KuramaFogo },
    { type: "flags", emoji: "🔰" },
    { type: "quiz_questions", emoji: e.QuestionMark },
    { type: "quiz_caracters", emoji: "👤" }
];

const keys: Record<string, Set<string>> = {

    balance: new Set([
        ["banco", "bank", "银行", "銀行", "banque", "atm"], // bank
        ["carteira", "wallet", "Brieftasche", "钱包", "財布", "portefeuille", "cartera"], // wallet
        ["saldo", "balance", "guthaben", "余额", "残高", "solde"], // balance
        ["economia", "economy", "wirtschaft", "经济", "経済", "économie", "economía"], // economy
        ["dinheiro", "money", "geld", "钱", "お金", "argent", "dinero"], // money
        ["safiras", "sapphires", "saphire", "蓝宝石", "サファイア", "saphirs", "sáfiros"], // sapphires
        ["bal", "s"] // Others aliases
    ].flat()),

    likes: new Set([
        ["curtidas", "likes", "gefällt mir", "喜欢", "いいね", "j'aime", "me gusta"], // likes
        ["curtir", "like"], // like
        ["l"] // Others aliases
    ].flat()),

    daily: new Set([
        ["diário", "daily", "täglich", "每日", "毎日", "quotidien", "diario"], // daily
        ["d"]
    ].flat()),

    level: new Set([
        ["experiência", "experience", "erfahrung", "经验", "経験", "expérience", "experiencia"], // experience
        ["nível", "level", "niveau", "水平", "レベル", "niveau", "nivel"], // level
        ["n"]
    ].flat()),

    quiz_anime: new Set(["动漫", "アニメ", "anime", "quiz_anime"]),
    logomarca: new Set(["标志", "ロゴ", "logo", "logomarca"]),

    quiz_questions: new Set([
        ["pergunta", "question", "frage", "问题", "質問", "pregunta"],
        ["questões", "questions", "fragen", "问题", "質問", "preguntas"]
    ].flat())

};

const objectEntries = Object.entries(keys);

// TODO: Continue with others keys
export default async function globalRanking(
    interactionOrMessage: ChatInputCommandInteraction | StringSelectMenuInteraction | Message,
    args?: string[]
) {

    const { userLocale: locale } = interactionOrMessage;
    const userId = "author" in interactionOrMessage ? interactionOrMessage.author.id : interactionOrMessage.user.id;

    if (interactionOrMessage instanceof StringSelectMenuInteraction)
        if ((JSON.parse(interactionOrMessage.customId))?.uid !== userId)
            return await interactionOrMessage.reply({
                content: t("ranking.you_cannot_click_here", { e, locale }),
                ephemeral: true
            });

    let category = "";
    let script: boolean = false;
    const scriptsKeys = ["arquivo", "file", "datei", "文件", "ファイル", "fichier", "archivo", "script"];

    if (interactionOrMessage instanceof ChatInputCommandInteraction) {
        const categoryPreSelect = interactionOrMessage.options.getString("category")?.toLowerCase() || "";
        for (const [key, value] of objectEntries)
            if (value.has(categoryPreSelect)) {
                category = key;
                break;
            }
        script = scriptsKeys.includes(interactionOrMessage.options.getString("options") || "");
    } else if (interactionOrMessage instanceof Message) {
        const categoryPreSelect = args?.[0]?.toLowerCase() || "";
        for (const [key, value] of objectEntries)
            if (value.has(categoryPreSelect)) {
                category = key;
                break;
            }
        script = scriptsKeys.includes(args?.[1]?.toLowerCase() || "");
    } else category = interactionOrMessage.values[0];

    if (!category && !(interactionOrMessage instanceof StringSelectMenuInteraction))
        return await interactionOrMessage.reply({
            content: t("ranking.which_ranking", { e, locale }),
            components: [{
                type: 1,
                components: [{
                    type: 3,
                    custom_id: JSON.stringify({ c: "ranking", uid: userId }),
                    placeholder: t("ranking.select_menu.placeholder", locale),
                    options: categories.map(({ type, emoji }) => ({
                        label: t(`ranking.select_menu.options.${type}`, locale),
                        value: type,
                        emoji
                    }))
                }]
            }].asMessageComponents()
        });

    const payload = { content: t("ranking.loading", { e, locale }), embeds: [], components: [], fetchReply: true };

    if (interactionOrMessage instanceof StringSelectMenuInteraction)
        await interactionOrMessage.update(payload);
    else if (interactionOrMessage instanceof ChatInputCommandInteraction)
        await interactionOrMessage.reply(payload);

    if (category.includes("quiz"))
        return await quizSelect(interactionOrMessage, script);

    return await build(
        interactionOrMessage,
        category,
        script
    );
}