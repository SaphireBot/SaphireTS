import { AutocompleteInteraction } from "discord.js";
import Database from "../../../database";
import { t } from "../../../translator";

export default async function balance(interaction: AutocompleteInteraction, value?: string) {

    const number = value?.toNumber();
    const balance = await getData();
    const locale = interaction.userLocale;
    const data = [
        {
            name: t("balance.autocomplete", {
                locale,
                balance: balance.currency()
            }),
            value: balance
        }
    ];

    if (number)
        data.push({
            name: `${number?.currency()} ${t("keyword_Sapphires", locale)}`,
            value: number || 0
        });

    return await interaction.respond(data);

    async function getData(): Promise<number> {
        return (await Database.getUser(interaction.user.id))?.Balance || 0;
    }

}