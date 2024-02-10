import { Colors, Message } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import Database from "../../../database";
const counter = () => Math.floor(Math.random() * 100);

const aliases = [
    "zähler",
    "messgerät",
    "messen",
    "maßnahme",
    "counter",
    "meter",
    "measure",
    "measurement",
    "contador",
    "medidor",
    "medir",
    "medida",
    "compteur",
    "mesurer",
    "カウンター",
    "メーター",
    "測定する",
    "測定",
    "計数器",
    "計量器",
    "测量"
];

const cases: { translateKey: string, options: string[] }[] = [
    {
        translateKey: "pervert",
        options: [
            "schmutzig",
            "geil",
            "pervers",
            "naughty",
            "horny",
            "perverted",
            "pervert",
            "safado",
            "tarado",
            "travieso",
            "caliente",
            "pervertido",
            "coquin",
            "excité",
            "perverti",
            "いたずら者",
            "エッチ",
            "変態",
            "淘气",
            "色情",
            "变态"
        ]
    },
    {
        translateKey: "bull",
        options: [
            "boi",
            "touro",
            "gado",
            "rind",
            "vieh",
            "stier",
            "ox",
            "cattle",
            "bull",
            "buey",
            "ganado",
            "toro",
            "bœuf",
            "bétail",
            "taureau",
            "牛",
            "家畜",
            "牡牛",
            "公牛"
        ]
    },
    {
        translateKey: "horn",
        options: [
            "hahnrei",
            "betrogen",
            "cuckold",
            "betrayed",
            "corno",
            "cornudo",
            "traicionado",
            "cocu",
            "trahi",
            "コーン",
            "裏切られた",
            "老公",
            "被背叛的",
            "gehörnt",
            "horn",
            "horned",
            "cuerno",
            "corne",
            "cornu",
            "ホーン",
            "角張った",
            "角",
            "有角的"
        ]

    },
    {
        translateKey: "gay",
        options: [
            "schwul",
            "homosexuell",
            "gay",
            "homosexual",
            "homosexuel",
            "ゲイ",
            "同性愛者",
            "同性恋",
            "同性恋者"
        ]
    },
    {
        translateKey: "idiot",
        options: [
            "dumm",
            "idiot",
            "träge",
            "silly",
            "slow",
            "sonso",
            "idiota",
            "lerdo",
            "tonto",
            "lento",
            "niais",
            "lent",
            "愚かな",
            "バカ",
            "鈍い",
            "傻",
            "白痴",
            "迟钝"
        ]
    },
    {
        translateKey: "faithful",
        options: [
            "treu",
            "faithful",
            "fiel",
            "fidèle",
            "忠実な",
            "忠实的"
        ]
    },
    {
        translateKey: "inteligence",
        options: [
            "intelligenz",
            "inteligencia",
            "intelligence",
            "inteligência",
            "知能",
            "智力",
            "intelligent",
            "inteligente",
            "賢い",
            "聪明",
            "weisheit",
            "wisdom",
            "sabiduría",
            "sagesse",
            "知恵",
            "智慧",
            "iq",
            "qi",
            "ci",
            "智商"
        ]

    }
];

export default {
    name: "counter",
    description: "Quantos % alguém é?",
    aliases: [aliases, cases.map(value => value.options).flat()].flat(),
    category: "fun",
    api_data: {
        category: "Diversão",
        synonyms: aliases,
        tags: [],
        perms: {
            user: [],
            bot: []
        }
    },
    execute: async function (message: Message<true>, args: string[] | undefined, cmd: string) {

        const { userLocale: locale, guildId, author } = message;
        const key = [aliases, "counter"].flat().includes(cmd) ? args?.[0]?.toLowerCase() : cmd;
        const member = await message.getMember();
        const translateKey = cases.find(({ options }) => options.some(option => option === key))?.translateKey;

        if (!translateKey || !member) {
            const fields = cases
                .map(({ translateKey, options }) => ({ name: t(`counter.embed.keys.${translateKey}`, locale), value: options.map(op => `\`${op}\``).join(", ") }))
                .slice(0, 25);

            fields.push({
                name: t("counter.embed.activate", { e, locale }),
                value: aliases.map(al => `\`${al}\``).join(", ")
            });

            fields.push({
                name: t("counter.embed.how_to_use_name", { e, locale }),
                value: t("counter.embed.how_to_use_value", { e, locale, prefix: (await Database.getPrefix(guildId)).random(), cmd })
            });

            return await message.reply({
                embeds: [{
                    color: Colors.Blue,
                    title: t("counter.embed.title", { e, locale }),
                    description: !member ? t("counter.need_a_member", { e, locale }) : t("counter.not_found", { e, locale }),
                    fields
                }]
            });
        }

        return await message.reply({
            content: t(`counter.key.${translateKey}`, { e, locale, member: `<@${member?.id || author.id}>`, counter: counter() }),
            allowedMentions: {
                parse: [],
                users: []
            }
        });
    }
};