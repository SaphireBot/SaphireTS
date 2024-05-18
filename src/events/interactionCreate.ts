import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction as DiscordChatInputCommandInteraction, Events, PermissionFlagsBits, StringSelectMenuInteraction } from "discord.js";
import client from "../saphire";
import socket from "../services/api/ws";
// import { BlacklistSchema } from "../database/models/blacklist";
import { e } from "../util/json";
import errorControl from "../commands/errors/error.control";
import { t } from "../translator";
import {
    ModalInteractionCommand,
    ButtonInteractionCommand,
    ChatInputInteractionCommand,
    SelectMenuInteraction,
    ContextMenuInteraction
} from "../structures/interaction";
import Autocomplete from "../structures/interaction/Autocomplete";
import Database from "../database";
import { Config } from "../util/constants";
import webhookRestartNotification, { webhooksFeedbackUrls } from "./functions/webhookRestartNotification";

client.on(Events.InteractionCreate, async (interaction): Promise<any> => {
    client.interactions++;
    socket.send({ type: "addInteraction" });
    Database.setCache(interaction.user.id, interaction.user.toJSON(), "user");

    if (
        !client.user
        || !interaction
        || (interaction.guild && !interaction.guild?.available)
    ) return;

    const locale = await interaction.user.locale();

    if (client.rebooting?.started) {

        if (interaction.isButton())
            if (interaction.customId === "reboot")
                return await webhookRestartNotification(interaction as ButtonInteraction<"cached">);

        if (interaction.isAutocomplete())
            return await interaction.respond([{
                name: t("Saphire.rebooting.message", {
                    e, locale,
                    reason: client.rebooting.reason || "No reason given"
                }),
                value: "ignore"
            }]);

        return await interaction.reply({
            content: t(
                webhooksFeedbackUrls.has(interaction.channelId!)
                    ? "Saphire.rebooting.message_no_emoji"
                    : "Saphire.rebooting.message",
                {
                    e, locale,
                    reason: client.rebooting.reason || "No reason given"
                }),
            ephemeral: true,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            emoji: e.Notification,
                            custom_id: "reboot",
                            style: ButtonStyle.Primary
                        }
                    ]
                }
            ].asMessageComponents()
        })
            .catch(() => null);
    }

    interaction.userLocale = locale || (Config.locales.includes(interaction.guildLocale || "")
        ? (interaction.guild?.preferredLocale as any) || "en-US"
        : "en-US");

    if (!client.loaded) {
        if (interaction.isAutocomplete())
            return await interaction.respond([]);

        return await interaction.reply({
            content: t("System_till_loading", { e, locale }),
            ephemeral: true
        });
    }

    // const blacklistData: BlacklistSchema | undefined = await socket.emitWithAck("isBlacklisted", interaction.user.id)
    //     .catch(() => undefined);

    // if (blacklistData) {
    //     const removeIn = blacklistData?.removeIn;
    //     const content = `${e.Animated.SaphireReading} | ${t("System_inBlacklist", locale)}${removeIn ? ` - ${time(new Date(removeIn), "D") + " | " + time(new Date(removeIn), "T") + " " + time(new Date(removeIn), "R")}` : " " + t("keyword_permanently", locale)}.`;
    //     if (interaction.isAutocomplete()) return await interaction.respond([]);
    //     await interaction.reply({ content, ephemeral: true });
    //     return;
    // }

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
                content: `${e.DenyX} | ${t("System_no_permissions_to_interact_in_this_channel", locale)}\n${e.Info} | ${t("System_i_need_x_permissions", locale).replace("{X}", `${greenCard.length}`)}: ${greenCard.map(perm => `\`${t(`Discord.Permissions.${perm}`, locale)}\``).filter(Boolean).join(", ")}`,
                ephemeral: true
            }).catch(() => { });
            return;
        }
    }

    try {
        if (interaction.isChatInputCommand()) return await new ChatInputInteractionCommand(interaction).getCommandAndExecute();
        if (interaction.isButton()) return await new ButtonInteractionCommand(interaction).getFunctionAndExecute();
        if (interaction.isAnySelectMenu()) return await new SelectMenuInteraction(interaction as StringSelectMenuInteraction<"cached">).filterAndChooseFunction();
        if (interaction.isAutocomplete()) return await new Autocomplete(interaction).getCommandAndExecute();
        if (interaction.isModalSubmit()) return await new ModalInteractionCommand(interaction).getFunctionAndExecute();
        if (interaction.isContextMenuCommand()) return await new ContextMenuInteraction(interaction).getCommandAndExecute();
    } catch (err: any) {
        if (!err) return;
        errorControl(interaction as DiscordChatInputCommandInteraction, err);
        // unhandledRejection(err);
        return;
    }

    // await interaction.reply({ content: t("System_interaction_model_not_found", locale), ephemeral: true });
    return;
});