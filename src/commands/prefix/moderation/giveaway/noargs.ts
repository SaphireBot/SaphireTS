import { Colors, EmbedField, Message } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import handler from "../../../../structures/commands/handler";

export default async function noargs(message: Message<true>) {

    const command = handler.getApplicationCommand("giveaway");
    const cmd = message.content.trim().split(/ +/g).shift()?.toLowerCase();
    const locale = message.userLocale;

    const giveaway = {
        create: command?.getMention("create"),
        reroll: command?.getMention("reroll"),
        list: command?.getMention("list"),
        options: command?.getMention("options")
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