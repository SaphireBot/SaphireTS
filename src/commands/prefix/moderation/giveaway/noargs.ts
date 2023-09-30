import { Colors, EmbedField, Message } from "discord.js";
import { slashCommands } from "../../..";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";

export default async function noargs(message: Message<true>) {

    const commandId = slashCommands.get("giveaway")?.data.id;
    const cmd = message.content.trim().split(/ +/g).shift()?.toLowerCase();
    const locale = message.userLocale;

    const giveaway = {
        create: `</giveaway create:${commandId}>`,
        reroll: `</giveaway reroll:${commandId}>`,
        list: `</giveaway list:${commandId}>`,
        options: `</giveaway options:${commandId}>`
    };

    const fields: EmbedField[] = [];

    for (let i = 0; i < 7; i++)
        fields.push({
            name: t(`giveaway.message.no_options_given.embed.fields.${i}.name`, { locale, e }),
            value: t(`giveaway.message.no_options_given.embed.fields.${i}.value`, { locale, giveaway, cmd }),
            inline: false
        });

    return await message.reply({
        embeds: [{
            color: Colors.Blue,
            title: t("giveaway.message.no_options_given.embed.title", locale),
            description: t("giveaway.message.no_options_given.embed.description", locale),
            fields
        }]
    });
}