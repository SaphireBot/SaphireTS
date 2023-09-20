import { ChatInputCommandInteraction, Events, PermissionFlagsBits } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
// import { BlacklistSchema } from "../database/models/blacklist";
import { e } from "../util/json";
import { PermissionsTranslate } from "../util/constants";
import ChatInputInteractionCommand from "../structures/interaction/ChatInputCommand";
import errorControl from "../commands/errors/error.control";
import { t } from "../translator";
import ButtonInteractionCommand from "../structures/interaction/ButtonInteraction";

client.on(Events.InteractionCreate, async interaction => {
    client.interactions++;
    if (!client.user) return;

    if (!interaction || (interaction.guild && !interaction.guild?.available)) return;
    if (socket?.connected) socket?.send({ type: "addInteraction" });
    interaction.userLocale = await interaction.user.locale();
    const locale = interaction.userLocale || interaction.locale || interaction.guildLocale;

    // const blacklistData: BlacklistSchema | undefined = await socket.timeout(500).emitWithAck("isBlacklisted", interaction.user.id)
    //     .catch(() => undefined);

    // if (blacklistData) {
    //     const removeIn = blacklistData?.removeIn;
    //     const content = `${e.Animated.SaphireReading} | ${t("System_inBlacklist", locale)}${removeIn ? ` - ${time(new Date(removeIn), "D") + " | " + time(new Date(removeIn), "T") + " " + time(new Date(removeIn), "R")}` : " " + t("keyword_permanently", locale)}.`;
    //     if (interaction.isAutocomplete()) return interaction.respond([]);
    //     await interaction.reply({ content, ephemeral: true });
    //     return;
    // }

    if (client.restart) {
        if (interaction.isAutocomplete()) return interaction.respond([]);
        await interaction?.reply({
            content: `${e.Loading} | ${t("System_restarting_started", locale)}\n📝 | \`${client.restart || t("System_no_data_given", locale)}\``,
            ephemeral: true
        });
        return;
    }

    if (
        interaction.channel
        && !interaction.channel.isDMBased()
        && !interaction.isAutocomplete()
        && interaction.guild
    ) {
        const channelPermissions = interaction.channel.permissionsFor(client.user);
        const greenCard = Array.from(
            new Set([
                interaction.guild.members.me?.permissions.missing([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]),
                channelPermissions?.missing([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])
            ].flat().filter(Boolean))
        );

        if (greenCard.length) {
            await interaction?.reply({
                content: `${e.DenyX} | ${t("System_no_permissions_to_interact_in_this_channel", locale)}\n${e.Info} | ${t("System_i_need_x_permissions", locale).replace("{X}", `${greenCard.length}`)}: ${greenCard.map(perm => `\`${PermissionsTranslate[<keyof typeof PermissionsTranslate>perm] || perm}\``).filter(Boolean).join(", ")}`,
                ephemeral: true
            }).catch(() => { });
            return;
        }
    }

    try {
        if (interaction.isChatInputCommand()) {
            await new ChatInputInteractionCommand(interaction).getCommandAndExecute();
            return;
        }
        if (interaction.isButton()) {
            await new ButtonInteractionCommand(interaction).getFunctionAndExecute();
            return;
        }
        // if (interaction.isContextMenuCommand())
        // if (interaction.isAnySelectMenu()) return await new SelectMenuInteraction(interaction).filterAndChooseFunction()
        // if (interaction.isAutocomplete()) return await new Autocomplete(interaction).build()
        // if (interaction.isModalSubmit()) return await new ModalInteraction(interaction, client).submitModalFunctions()
    } catch (err: any) {
        if (!err) return;
        if (err?.code === 10062) return;
        errorControl(interaction as ChatInputCommandInteraction, err);
        // unhandledRejection(err);
        return;
    }

    interaction.isAutocomplete()
        ? await interaction.respond([])
        : await interaction.reply({ content: t("System_interaction_model_not_found", locale), ephemeral: true });
    return;
});