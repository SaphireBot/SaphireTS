import { AutocompleteInteraction } from "discord.js";
import Database from "../../../database";
import { t } from "../../../translator";
import { allWordTranslations } from "../../../util/constants";

export default async function balance(interaction: AutocompleteInteraction, value?: string) {

    const number = value?.toNumber();
    const userBalance = await Database.getBalance(interaction.user.id);
    const locale = interaction.userLocale;
    let balance = userBalance;

    if (allWordTranslations.includes(value?.toLowerCase() || ""))
        balance = userBalance;

    const data = [
        {
            name: t("balance.autocomplete", {
                locale,
                balance: balance.currency(),
            }),
            value: balance,
        },
    ];

    if (number)
        data.push({
            name: `${number?.currency()} ${t("keyword_Sapphires", locale)}`,
            value: number || 0,
        });

    return await interaction.respond(data);

}