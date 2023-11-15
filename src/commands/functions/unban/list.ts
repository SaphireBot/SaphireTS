import { ChatInputCommandInteraction, Message, AttachmentBuilder } from "discord.js";
import { bans as cache } from "../../../structures/interaction/autocomplete/unban";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default async function list(
    interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>
) {

    const { userLocale: locale, guild } = interactionOrMessage;
    const user = interactionOrMessage instanceof ChatInputCommandInteraction ? interactionOrMessage.user : interactionOrMessage.author;

    const msg = await interactionOrMessage.reply({
        content: t("unban.list.loading", { e, locale }),
        fetchReply: true
    });

    let bans = cache.get(guild.id) || [];

    if (!bans.length) {
        const data = await guild.bans.fetch().catch(() => null);
        if (data) {
            bans = data.toJSON()?.map(ban => ({ reason: ban.reason!, user: ban.user }));
            cache.set(guild.id, bans);
            setTimeout(() => cache.delete(guild.id), 1000 * 60);
        }
    }

    const text =
        `-------------------- ${t("unban.list.script_title", locale)} --------------------
${t("unban.list.banned_users", { locale, bans })}
${t("unban.list.server", { locale, guild })}
${t("unban.list.date", { locale, date: new Date().toLocaleString(locale) })}
${t("unban.list.requester", { locale, user })}

${bans.map(ban => `${ban.user.username} (${ban.user.id})` + `${ban.reason ? `\n${ban.reason}` : ""}`).join("\n \n")}
`;

    const file = Buffer.from(text);
    const attachment = new AttachmentBuilder(file, { name: `${guild.name}.bans.txt`, description: "List with all banned used from this guild" });

    return await msg.edit({ content: null, files: [attachment] });
}