import { AutocompleteInteraction } from "discord.js";
import Database from "../../../database";
const cache = new Map<string, number>();

export default async function balanceAmount(interaction: AutocompleteInteraction, value?: string) {

    const number = value?.toNumber();
    const balance = await getData();
    const data = [
        {
            name: `Você possui ${balance.currency()} Safiras`,
            value: balance
        }
    ];

    if (number)
        data.push({
            name: `${number?.currency()} Safiras`,
            value: number || 0
        });

    return await interaction.respond(data);

    async function getData(): Promise<number> {

        if (cache.has(interaction.user.id))
            return cache.get(interaction.user.id) as number;

        const data = await Database.getUser(interaction.user.id);

        cache.set(interaction.user.id, data?.Balance || 0);
        setTimeout(() => cache.delete(interaction.user.id), 1000 * 15);

        return data?.Balance || 0;
    }

}