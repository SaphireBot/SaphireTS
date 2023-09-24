import {
    APIEmbed,
    ButtonInteraction,
    ButtonStyle,
    CategoryChannel,
    ChannelSelectMenuInteraction,
    ChatInputCommandInteraction,
    Colors,
    ForumChannel,
    MentionableSelectMenuInteraction,
    Message, NewsChannel,
    PrivateThreadChannel,
    PublicThreadChannel,
    RoleSelectMenuInteraction,
    StageChannel,
    StringSelectMenuInteraction,
    TextChannel,
    UserSelectMenuInteraction,
    VoiceChannel
} from "discord.js";
import { e } from "../../../../util/json";
import registerGiveaway from "./registerGiveaway";
import { GiveawayCollectorData } from "../../../../@types/commands";
import Modals from "../../../../structures/modals";
import { GiveawayType } from "../../../../@types/models";

export default async function enableButtonCollector(
    interaction: ChatInputCommandInteraction<"cached">,
    configurationMessage: Message<true>,
    giveawayMessage: Message<true>,
    embed: APIEmbed,
    collectorData: GiveawayCollectorData,
    channel: CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null | undefined,
    GiveawayResetedData?: GiveawayType,
    color?: number | undefined
) {
    editContent();

    const components = [
        {
            type: 1,
            components: [
                {
                    type: 6,
                    custom_id: "roles",
                    placeholder: "Cargos Obrigatórios (Opcional)",
                    min_values: 0,
                    max_values: 25
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 6,
                    custom_id: "locked_roles",
                    placeholder: "Cargos Bloqueados (Opcional)",
                    min_values: 0,
                    max_values: 25
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 5,
                    custom_id: "members",
                    placeholder: "Usuários Permitidos (Opcional)",
                    min_values: 0,
                    max_values: 25
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 5,
                    custom_id: "locked_members",
                    placeholder: "Usuários Bloqueados (Opcional)",
                    min_values: 0,
                    max_values: 25
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: "Lançar",
                    emoji: "📨",
                    custom_id: "lauch",
                    style: ButtonStyle.Success
                },
                {
                    type: 2,
                    label: "Cancelar",
                    emoji: "✖️",
                    custom_id: "cancel",
                    style: ButtonStyle.Danger
                },
                {
                    type: 2,
                    label: "Todos os cargos são obrigatórios",
                    emoji: "🔄",
                    custom_id: "switchRoles",
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: "Adicionar cargos aos vencedores",
                    emoji: "👑",
                    custom_id: "addRoles",
                    style: ButtonStyle.Primary
                },
                {
                    type: 2,
                    label: "Cargos com multiplas entradas",
                    emoji: "✨",
                    custom_id: "multiJoins",
                    style: ButtonStyle.Primary
                }
            ]
        }
    ].asMessageComponents();

    const { user } = interaction;

    configurationMessage.edit({ content: null, embeds: [embed], components })
        .catch(async err => await interaction.channel?.send({ content: `${e.Animated.SaphireCry} | Erro ao editar a mensagem principal de configuração do sorteio.\n${e.bug} | \`${err}\`` }));

    const buttonCollector = configurationMessage.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        idle: 1000 * 60 * 5
    })
        .on("collect", async (int): Promise<any> => collect(int))
        .on("end", (_, reason): any => end(reason));

    function editContent(botRole?: boolean, memberBot?: boolean | "UserAlreadySelected", extra?: boolean | "RoleAlreadySelected" | "UserAlreadySelected", addRolesInvalid?: boolean) {
        embed.description = "Escolher cargos e usuários? Lançar ou cancelar o sorteio?";
        if (embed.fields) {

            embed.fields[0].value = `${e.CheckV} O emoji foi salvo.`;

            embed.fields[1] = {
                name: collectorData.RequiredAllRoles ? "🔰 Cargos Obrigatórios" : "🔰 Possuir um dos cargos abaixo",
                value: collectorData.AllowedRoles.length > 0 || botRole || extra
                    ? `${collectorData.AllowedRoles.map(roleId => `<@&${roleId}>`).join(", ") || "Nenhum cargo selecionado\n"}` + `${botRole ? `\n${e.Deny} Um cargo de Bot foi selecionado` : ""}` + `${extra === "RoleAlreadySelected" ? `\n${e.Deny} Não é possível colocar o mesmo cargo nos dois campos` : ""}`
                    : "Nenhum cargo selecionado"
            };

            embed.fields[2] = {
                name: "🚫 Cargos Bloqueados",
                value: collectorData.LockedRoles.length > 0 || botRole || extra
                    ? `${collectorData.LockedRoles.map(roleId => `<@&${roleId}>`).join(", ") || "Quem tiver um desses cargos, está de fora."}` + `${botRole ? `\n${e.Deny} Um cargo de Bot foi selecionado` : ""}` + `${extra === "RoleAlreadySelected" ? `\n${e.Deny} Não é possível colocar o mesmo cargo nos dois campos` : ""}`
                    : "Quem tiver um desses cargos, está de fora."
            };

            embed.fields[3] = {
                name: "👥 Usuários Permitidos",
                value: collectorData.AllowedMembers.length > 0 || memberBot || extra
                    ? `${collectorData.AllowedMembers.map(userId => `<@${userId}>`).join(", ") || "Somente os usuários selecionados aqui poderão participar do sorteio"}` + `${memberBot ? `\n${e.Deny} Um Bot foi selecionado` : ""}` + `${memberBot === "UserAlreadySelected" ? `\n${e.Deny} Não é possível colocar o mesmo usuário nos dois campos` : ""}`
                    : "Somente os usuários selecionados aqui poderão participar do sorteio"
            };

            embed.fields[4] = {
                name: "🚫 Usuários Bloqueados",
                value: collectorData.LockedMembers.length > 0 || memberBot || extra
                    ? `${collectorData.LockedMembers.map(userId => `<@${userId}>`).join(", ") || "Os usuários selecionados aqui, **NÃO** poderão participar do sorteio"}` + `${memberBot ? `\n${e.Deny} Um Bot foi selecionado` : ""}` + `${memberBot === "UserAlreadySelected" ? `\n${e.Deny} Não é possível colocar o mesmo usuário nos dois campos` : ""}`
                    : "Os usuários selecionados aqui, **NÃO** poderão participar do sorteio"
            };

            embed.fields[5] = {
                name: "👑 Cargos Para os Vencedores",
                value: addRolesInvalid
                    ? "Eu não tenho permissão para gerênciar um dos cargos selecionados."
                    : collectorData.AddRoles.length > 0
                        ? `${collectorData.AddRoles.map(roleId => `<@&${roleId}>`).join(", ") || "Nenhum cargo foi configurado"}`
                        : "Os cargos selecionados neste campo, será entregue aos vencedores do sorteio automaticamente."
            };

            embed.fields[6] = {
                name: "✨ Cargos de Multiplas Entradas (Max: 5)",
                value: collectorData.MultJoinsRoles.size > 0
                    ? `${Array.from(collectorData.MultJoinsRoles.values()).map(role => `**${role.joins || 1}x** <@&${role.role.id}>`).join("\n") || "Nenhum cargo foi configurado"}`
                    : "Cargos que tem direito a multiplas entradas"
            };

        }

        return `${e.Loading} | A reação já foi coletada. Quer configurar mais algo?\n🔰 | \n | `;
    }

    async function collect(int: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached"> | UserSelectMenuInteraction<"cached"> | RoleSelectMenuInteraction<"cached"> | MentionableSelectMenuInteraction<"cached"> | ChannelSelectMenuInteraction<"cached">) {

        const { customId } = int;

        if (customId === "lauch") {
            buttonCollector.stop();
            await int.update({ content: `${e.Loading} Criando...`, embeds: [], components: [] });
            return registerGiveaway(
                interaction,
                configurationMessage,
                giveawayMessage,
                collectorData,
                channel,
                color,
                GiveawayResetedData
            );
        }

        if (customId === "cancel") {
            buttonCollector.stop();
            giveawayMessage.delete();
            return int.update({ content: `${e.CheckV} Ok ok, tudo cancelado.`, embeds: [], components: [] });
        }

        if (customId === "switchRoles") {
            collectorData.RequiredAllRoles = !collectorData.RequiredAllRoles;
            const message = int.message;

            if (embed.fields) {
                embed.fields[1].name = collectorData.RequiredAllRoles
                    ? "🔰 Todos os cargos são obrigatórios"
                    : "🔰 Apenas um cargo é obrigatório";
            }

            const components = message.components.map(comp => comp.toJSON()) as any;

            components[4].components[2].label = collectorData.RequiredAllRoles
                ? "Todos os cargos são obrigatórios"
                : "Apenas um cargo é obrigatório";

            return int.update({ components, embeds: [embed] });
        }

        if (customId === "roles") {
            if (!int.isAnySelectMenu()) return;
            for (const roleId of int.values) {
                if (interaction.guild?.roles.cache.get(roleId)?.managed) {
                    editContent(true);
                    return int.update({ content: null, embeds: [embed] });
                }

                if (collectorData.LockedRoles.includes(roleId)) {
                    editContent(false, false, "RoleAlreadySelected");
                    return int.update({ content: null, embeds: [embed] });
                }
            }

            collectorData.AllowedRoles = int.values;
            editContent();
            return int.update({ content: null, embeds: [embed] });
        }

        if (customId === "addRolesSelect") {
            if (!int.isAnySelectMenu()) return;
            for (const roleId of int.values) {
                if (interaction.guild?.roles.cache.get(roleId)?.managed) {
                    editContent(false, false, false, true);
                    return int.update({ content: null, embeds: [embed] });
                }

                collectorData.AddRoles = int.values;
                editContent();
                return int.update({ content: null, embeds: [embed] });
            }
        }

        if (customId === "addMultiJoinsRolesSelect") {
            if (!int.isAnySelectMenu()) return;
            const roles = collectorData.MultJoinsRoles;
            collectorData.MultJoinsRoles.clear();

            for (const roleId of int.values) {
                const role = interaction.guild?.roles.cache.get(roleId);
                if (role && !role.managed) {
                    const setted = roles.get(roleId) || { role, joins: 0 };
                    setted.joins = setted.joins || 1;
                    collectorData.MultJoinsRoles.set(roleId, setted);
                }
            }

            editContent();
            return int.update({ content: null, embeds: [embed] });
        }

        if (customId === "locked_roles") {
            if (!int.isAnySelectMenu()) return;

            for (const roleId of int.values) {
                if (interaction.guild?.roles.cache.get(roleId)?.managed) {
                    editContent(true);
                    return int.update({ content: null, embeds: [embed] });
                }

                if (collectorData.AllowedRoles.includes(roleId)) {
                    editContent(false, false, "RoleAlreadySelected");
                    return int.update({ content: null, embeds: [embed] });
                }
            }

            collectorData.LockedRoles = int.values;
            editContent();
            return int.update({ content: null, embeds: [embed] });
        }

        if (customId === "members") {
            if (!int.isAnySelectMenu()) return;

            for (const memberId of int.values) {
                if (interaction.guild?.members.cache.get(memberId)?.user?.bot) {
                    editContent(false, true);
                    return int.update({ content: null, embeds: [embed] });
                }

                if (collectorData.LockedMembers.includes(memberId)) {
                    editContent(false, "UserAlreadySelected");
                    return int.update({ content: null, embeds: [embed] });
                }
            }

            collectorData.AllowedMembers = int.values;
            editContent();
            return int.update({ content: null, embeds: [embed] });
        }

        if (customId === "locked_members") {
            if (!int.isAnySelectMenu()) return;

            for (const memberId of int.values) {
                if (!int.isAnySelectMenu()) return;

                if (interaction.guild?.members.cache.get(memberId)?.user?.bot) {
                    editContent(false, true);
                    return int.update({ content: null, embeds: [embed] });
                }

                if (collectorData.AllowedMembers.includes(memberId)) {
                    editContent(false, false, "UserAlreadySelected");
                    return int.update({ content: null, embeds: [embed] });
                }
            }

            collectorData.LockedMembers = int.values;
            editContent();
            return int.update({ content: null, embeds: [embed] });
        }

        if (customId === "addRoles")
            return int.update({
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 6,
                                custom_id: "addRolesSelect",
                                placeholder: "Cargos Para Os Vencedores",
                                min_values: 0,
                                max_values: 25
                            }
                        ]
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "Lançar",
                                emoji: "📨",
                                custom_id: "lauch",
                                style: ButtonStyle.Success
                            },
                            {
                                type: 2,
                                label: "Cancelar",
                                emoji: "✖️",
                                custom_id: "cancel",
                                style: ButtonStyle.Danger
                            },
                            {
                                type: 2,
                                label: "Voltar",
                                emoji: "👥",
                                custom_id: "BackToAddRoles",
                                style: ButtonStyle.Primary
                            }
                        ]
                    }
                ].asMessageComponents()
            });

        if (customId === "multiJoins")
            return int.update({
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 6,
                                custom_id: "addMultiJoinsRolesSelect",
                                placeholder: "Cargos com multiplas entradas",
                                min_values: 0,
                                max_values: 5
                            }
                        ]
                    },
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                label: "Lançar",
                                emoji: "📨",
                                custom_id: "lauch",
                                style: ButtonStyle.Success
                            },
                            {
                                type: 2,
                                label: "Cancelar",
                                emoji: "✖️",
                                custom_id: "cancel",
                                style: ButtonStyle.Danger
                            },
                            {
                                type: 2,
                                label: "Voltar",
                                emoji: "👥",
                                custom_id: "BackToAddRoles",
                                style: ButtonStyle.Primary
                            },
                            {
                                type: 2,
                                label: "Definir entradas",
                                emoji: "📝",
                                custom_id: "DefineJoins",
                                style: ButtonStyle.Primary
                            }
                        ]
                    }
                ].asMessageComponents()
            });

        if (customId === "BackToAddRoles")
            return int.update({ components });

        if (customId === "DefineJoins") {
            const roles = Array.from(collectorData.MultJoinsRoles.values());

            if (!collectorData.MultJoinsRoles.size)
                return int.editReply({
                    content: `${e.Animated.SaphireReading} | Hey, não tem nenhum cargo definido, sabia?`
                });

            return int.showModal(Modals.giveawayDefineMultJoins(roles))
                .then(() => int.awaitModalSubmit({
                    filter: i => i.user.id === user.id,
                    time: 1000 * 60 * 5,
                })
                    .then(async modalSubmit => {

                        const { fields } = modalSubmit;

                        for (const [roleId, r] of collectorData.MultJoinsRoles.entries()) {
                            const value = Number(fields.getTextInputValue(roleId));
                            if (isNaN(value) || value < 1 || value > 100) continue;

                            r.joins = value;
                            collectorData.MultJoinsRoles.set(roleId, r);
                        }

                        editContent();
                        await modalSubmit.deferUpdate();
                        return modalSubmit.editReply({ content: null, embeds: [embed] });

                    })
                    .catch(() => { }));
        }
        return;
    }

    function end(reason: string) {
        if (["user"].includes(reason)) return;

        giveawayMessage.delete();
        if (reason === "messageDelete") {
            return interaction.channel?.send({
                content: `${e.Animated.SaphireCry} | A mensagem foi apagada no meio da configuração, que maldade cara...`,
                components: []
            });
        }

        if (["time", "limit", "idle"].includes(reason)) {
            embed.color = Colors.Red;
            if (embed.fields)
                embed.fields.push({
                    name: "⏱️ E se passou eternidades",
                    value: `Após 5 longas eternidades eu cai em um sono profundo ${e.Animated.SaphireSleeping}.\nCancelei tudo para eu dormir em paz.`
                });
            embed.footer = { text: "Tempo Expirado" };
            return configurationMessage.edit({ content: null, embeds: [embed], components: [] });
        }
    }

    return;
}