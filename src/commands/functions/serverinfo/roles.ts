import { ButtonStyle, StringSelectMenuInteraction, PermissionFlagsBits, PermissionsBitField, Colors, Role, Guild, ButtonInteraction, Collection } from "discord.js";
import { e } from "../../../util/json.js";
import client from "../../../saphire/index.js";
import { t } from "../../../translator/index.js";
import { serverinfoCache } from "./index.js";
import { urls } from "../../../util/constants.js";
export const paginationData: Record<string, any> = {};
export const tempPagesIndexes: Record<string, number> = {};

export default async function roles(
    interaction: StringSelectMenuInteraction<"cached"> | ButtonInteraction<"cached">,
    commandData?: { c: "sinfo", sub: "roles", id: string, uid: string, index: "first" | "last" | number },
    guild?: Guild
) {

    const { userLocale: locale, user } = interaction;

    if (!guild)
        guild = serverinfoCache.get(commandData?.id || "") || await client.getGuild(commandData?.id || "")!;

    if (!guild)
        return await interaction.update({
            content: t("serverinfo.not_found", { e, locale }),
            embeds: [], components: []
        }).catch(() => { });

    return commandData || paginationData[guild!.id] ? await tradePage() : await build();

    async function build() {
        const indexComponent = interaction.message.components.length > 1 ? 1 : 0;
        const components = [interaction.message.components[indexComponent].toJSON()];

        await interaction.update({
            components: [{
                type: 1,
                components: [{
                    type: 2,
                    label: t("serverinfo.roles.loading", locale),
                    emoji: e.Loading,
                    custom_id: "loading",
                    style: ButtonStyle.Secondary,
                    disabled: true
                }].asMessageComponents()
            }]
        }).catch(() => { });

        const roles = guild!.roles?.cache;

        if (!roles?.size)
            return interaction.message.edit({
                embeds: [{
                    color: Colors.Blue,
                    description: t("serverinfo.roles.not_found", { e, locale }),
                    image: { url: urls.not_found_image }
                }]
            }).catch(() => { });

        const rolesFormated = mapRole(roles);

        const paginationCustomData = { pages: [], total: rolesFormated.length };

        if (rolesFormated.length) {
            let counter = rolesFormated.length;
            let amount = 0;
            let toSlice = 15;

            while (counter > 0) {
                const dataToPush = rolesFormated.slice(amount, toSlice);
                if (!dataToPush.length) break;
                paginationCustomData.pages.push(dataToPush as never);
                amount += 15;
                toSlice += 15;
                counter -= 15;
                continue;
            }
        } else paginationCustomData.pages.push(rolesFormated as never);

        const embed = {
            color: Colors.Blue,
            title: t("serverinfo.roles.title", locale),
            description: `${(paginationCustomData.pages[0] as any).join("\n") || "Not Found"}`.limit("EmbedDescription"),
            fields: [
                {
                    name: t("serverinfo.roles.field.name", { e, locale }),
                    value: t("serverinfo.roles.field.value", { e, locale, roles: rolesFormated })
                }
            ],
            footer: {
                text: `🆔 ${guild!.id}`,
                iconURL: guild!.iconURL() || ""
            }
        };

        paginationData[guild!.id] = paginationCustomData;

        if (paginationCustomData.pages.length > 1)
            components.unshift({
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: "⏪",
                        custom_id: "firstPage",
                        style: ButtonStyle.Primary,
                        disabled: true,
                    },
                    {
                        type: 2,
                        emoji: "⬅️",
                        custom_id: "previous",
                        style: ButtonStyle.Primary,
                        disabled: true
                    },
                    {
                        type: 2,
                        label: `1/${paginationCustomData?.pages?.length}`,
                        custom_id: "counter",
                        style: ButtonStyle.Secondary,
                        disabled: true
                    },
                    {
                        type: 2,
                        emoji: "➡️",
                        custom_id: JSON.stringify({ c: "sinfo", sub: "roles", id: guild!.id, uid: interaction.user.id, index: 1 }),
                        style: ButtonStyle.Primary
                    },
                    {
                        type: 2,
                        emoji: "⏩",
                        custom_id: JSON.stringify({ c: "sinfo", sub: "roles", id: guild!.id, uid: interaction.user.id, index: "last" }),
                        style: ButtonStyle.Primary
                    }
                ].asMessageComponents()
            });

        return interaction.message.edit({ embeds: [embed], components }).catch(() => { });

    }

    async function tradePage() {

        const guildId = commandData?.id || guild!.id;
        const componentIndex = interaction.message.components.length > 1 ? 1 : 0;
        const components = [interaction.message.components[componentIndex].toJSON()];
        const rolesData = paginationData[guildId];

        const index: number = commandData?.index === "last"
            ? rolesData?.pages?.length - 1
            : commandData?.index === "first"
                ? 0
                : commandData?.index || tempPagesIndexes[user.id] || 0;

        if (tempPagesIndexes[user.id])
            setTimeout(() => delete tempPagesIndexes[user.id], 1000 * 60);

        tempPagesIndexes[user.id] = index;

        const data = rolesData?.pages[index];
        if (!rolesData || !data || !data.length) return build();

        const embed = {
            color: Colors.Blue,
            title: t("serverinfo.roles.title", locale),
            description: `${data.join("\n") || "Not Found"}`.limit("EmbedDescription"),
            fields: [
                {
                    name: `${e.Info} Observação`,
                    value: `1. Cargos com ${e.ModShield} possui a permissão Administrador\n2. Cargos com 🤖 são cargos de bots.\n3. Cargos com 👤 são os demais cargos.\n4. Calculei um total de **${rolesData.total} cargos**.\n5. A sequência dos cargos é a mesma do servidor.\n6. A quantidade de membros é fornecida pelo Discord e não segue o número real.\n7. Clique em **Visualizar os Cargos** novamente para atualizar.`
                }
            ],
            footer: {
                text: `🆔 ${guild!.id}`,
                iconURL: guild!.iconURL() || ""
            }
        };

        if (rolesData?.pages?.length > 1)
            components.unshift({
                type: 1,
                components: [
                    {
                        type: 2,
                        emoji: "⏪",
                        custom_id: JSON.stringify({ c: "sinfo", sub: "roles", id: guildId, uid: interaction.user.id, index: "first" }),
                        style: ButtonStyle.Primary,
                        disabled: index === 0,
                    },
                    {
                        type: 2,
                        emoji: "⬅️",
                        custom_id: JSON.stringify({ c: "sinfo", sub: "roles", id: guildId, uid: interaction.user.id, index: (Number(index) || 0) - 1 }),
                        style: ButtonStyle.Primary,
                        disabled: index === 0
                    },
                    {
                        type: 2,
                        label: `${(Number(index) || 0) + 1}/${rolesData?.pages?.length}`,
                        custom_id: "counter",
                        style: ButtonStyle.Secondary,
                        disabled: true
                    },
                    {
                        type: 2,
                        emoji: "➡️",
                        custom_id: JSON.stringify({ c: "sinfo", sub: "roles", id: guildId, uid: interaction.user.id, index: (Number(index) || 0) + 1 }),
                        style: ButtonStyle.Primary,
                        disabled: index === rolesData?.pages?.length - 1
                    },
                    {
                        type: 2,
                        emoji: "⏩",
                        custom_id: JSON.stringify({ c: "sinfo", sub: "roles", id: guildId, uid: interaction.user.id, index: "last" }),
                        style: ButtonStyle.Primary,
                        disabled: index === rolesData?.pages?.length - 1
                    }
                ].asMessageComponents()
            });

        return await interaction.update({ embeds: [embed], components }).catch(() => { });
    }

    function mapRole(roles: Collection<string, Role>) {
        return roles.map(role => ({
            role: guild!.id === interaction.guild!.id ? `<@&${role.id}>` : role.name,
            admin: new PermissionsBitField(role.permissions).has(PermissionFlagsBits.Administrator),
            id: `\`${role.id}\``,
            position: role.position,
            managed: role.managed
        }))
            .filter(role => role.role)
            .sort((a, b) => b.position - a.position)
            .map(role => `${role.managed ? "🤖" : role.admin ? e.ModShield : "👤"} ${role.role} - ${role.id}`);
    }
}