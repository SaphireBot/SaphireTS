import { ChatInputCommandInteraction, StringSelectMenuInteraction, Message } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import build from "./build";

export const categories = [
    { type: "balance", emoji: e.safira },
    { type: "daily", emoji: "📅" },
    { type: "flags", emoji: "🔰" },
    { type: "level", emoji: e.RedStar },
    { type: "likes", emoji: e.Like },
    { type: "logomarca", emoji: e.logomarca },
    { type: "quiz_anime", emoji: e.KuramaFogo },
    { type: "quiz_questions", emoji: e.QuestionMark }
];

const keys: Record<string, string> = {};

for (const str of [
    ["banco", "bank", "银行", "銀行", "banque", "atm"], // bank
    ["carteira", "wallet", "Brieftasche", "钱包", "財布", "portefeuille", "cartera"], // wallet
    ["saldo", "balance", "guthaben", "余额", "残高", "solde"], // balance
    ["economia", "economy", "wirtschaft", "经济", "経済", "économie", "economía"], // economy
    ["dinheiro", "money", "geld", "钱", "お金", "argent", "dinero"], // money
    ["safiras", "sapphires", "saphire", "蓝宝石", "サファイア", "saphirs", "sáfiros"], // sapphires
    ["bal", "s"] // Others aliases
].flat())
    keys[str] = "balance";

for (const str of [
    ["curtidas", "likes", "gefällt mir", "喜欢", "いいね", "j'aime", "me gusta"], // likes
    ["curtir", "like"], // like
    ["l"] // Others aliases
].flat())
    keys[str] = "likes";

for (const str of [
    ["diário", "daily", "täglich", "每日", "毎日", "quotidien", "diario"], // daily
    ["d"]
].flat())
    keys[str] = "daily";

for (const str of [
    ["experiência", "experience", "erfahrung", "经验", "経験", "expérience", "experiencia"], // experience
    ["nível", "level", "niveau", "水平", "レベル", "niveau", "nivel"], // level
    ["n"]
].flat())
    keys[str] = "level";

for (const str of ["动漫", "アニメ", "anime", "quiz_anime"])
    keys[str] = "quiz_anime";

for (const str of ["标志", "ロゴ", "logo", "logomarca"])
    keys[str] = "logomarca";

for (const str of [
    ["pergunta", "question", "frage", "问题", "質問", "pregunta"],
    ["questões", "questions", "fragen", "问题", "質問", "preguntas"]
].flat())
    keys[str] = "quiz_questions";

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
        category = keys[interactionOrMessage.options.getString("category")?.toLowerCase() || ""];
        script = scriptsKeys.includes(interactionOrMessage.options.getString("options") || "");
    } else if (interactionOrMessage instanceof Message) {
        category = keys[args?.[0]?.toLowerCase() || ""];
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
    const msg: any = interactionOrMessage instanceof StringSelectMenuInteraction
        ? await interactionOrMessage.update(payload)
        : interactionOrMessage instanceof ChatInputCommandInteraction
            ? await interactionOrMessage.reply(payload)
            : null;

    return await build(
        interactionOrMessage,
        msg,
        category,
        script
    );
}