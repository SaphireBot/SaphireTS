import { ButtonInteraction, AttachmentBuilder, Message, PermissionFlagsBits, TextChannel, Collection } from "discord.js";
import { cache, cleaning } from "./clear";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import permissionsMissing from "../permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import { setTimeout as sleep } from "node:timers/promises";
import client from "../../../saphire";
type ScriptControl = {
    userIdentificator: string
    content: string
    date: string
    midias: number
};

export default async function execute(interaction: ButtonInteraction<"cached">) {

    const { userLocale: locale, user, message, guild } = interaction;

    const data = cache.get(message.id);

    if (!data || !data.channel?.id)
        return await interaction.update({
            content: t("clear.no_cache_data", { e, locale }),
            embeds: [],
            components: []
        });

    if (data.userId !== user.id)
        return await interaction.reply({
            content: t("clear.you_cannot_click_here", { e, locale }),
            ephemeral: true
        });

    if (cleaning.has(data.channel.id))
        return await interaction.reply({ content: t("clear.cleaning", { e, locale }), ephemeral: true });

    await interaction.update({ content: t("clear.starting", { e, locale }), components: [] });

    const channel: TextChannel | null = await data.channel?.fetch().catch(() => null);
    if (!channel) {
        cleaning.delete(data.channel.id);
        cache.delete(message.id);
        return await interaction.editReply({ content: t("clear.channel_not_found", { e, locale }) });
    }

    const hasMessage = await channel.messages.fetch({ limit: 1 }).then(messages => messages.size).catch(err => err);
    if (hasMessage === 0)
        return await interaction.editReply({ content: t("channel.no_messages_found", { e, locale }) });

    if (hasMessage instanceof Error)
        return await interaction.editReply({ content: `${t(errorMessage((hasMessage as any)?.code as number), { e, locale })}\n${e.bug} | \`${hasMessage}\`` });

    const { amount, attachments, bots, ignoreBots, ignoreMembers, ignoreWebhooks, members, script, webhooks } = data;
    const isFilter = () => bots || attachments || webhooks || ignoreBots || ignoreBots || ignoreWebhooks || members?.size > 0;

    if (!interaction.member?.permissions.has([PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages], true))
        return await permissionsMissing(interaction, [DiscordPermissons.ReadMessageHistory, DiscordPermissons.ManageMessages], "Discord_you_need_some_permissions");

    if (!guild.members.me?.permissions.has([PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages], true))
        return await permissionsMissing(interaction, [DiscordPermissons.ReadMessageHistory, DiscordPermissons.ManageMessages], "Discord_client_need_some_permissions");

    let counter = 0;
    const control = {
        size: 0, pinned: 0, older: 0, system: 0, ignored: 0, ignoreBots: 0, oldMessages: new Set<string>(),
        boost: 0, undeletable: 0, attachmentsMessages: 0, nonFilter: 0, toBreak: false,
        toFetchLimit: 0, looping: 0, MemberMessages: 0, botsMessages: 0, hasThread: 0, ignoreWebhooks: 0,
        webhookMessages: 0, response: "", messagesCounterControl: amount, toDelete: new Set<string>(), script: [] as ScriptControl[],
        ignoreMembers: 0
    };

    while (control.messagesCounterControl !== 0) {

        if (control.toDelete.size) control.toDelete.clear();

        if (!channel.viewable) {
            control.response += t("clear.no_channel_access", { e, locale, channel });
            break;
        }

        if (control.messagesCounterControl > 100)
            control.toFetchLimit = 100;
        else {
            control.toFetchLimit = control.messagesCounterControl;
            control.messagesCounterControl = 0;
        }

        if (control.toFetchLimit < 1 || control.toFetchLimit > 100) break;
        // eslint-disable-next-line no-await-in-loop
        const messages = await channel.messages.fetch({ limit: 100 })
            .catch(err => {
                control.response += errorMessage(err.code);
                control.response += "\n";
                return null;
            });

        if (!messages) break;
        if (!messages.size && control.looping > 0) break;
        if (!messages.size && control.looping === 0)
            // eslint-disable-next-line no-await-in-loop
            return await respond(t("clear.no_messages_found", locale));

        let disable = 0;
        if (messages.size <= amount && isFilter()) disable++;
        if (messages.size < 100) control.toBreak = true;

        messages.sweep(msg => control.oldMessages.has(msg.id));
        for (const [msgId, _] of messages)
            control.oldMessages.add(msgId);

        control.size += messages.size;
        control.pinned += messages.sweep(msg => msg.pinned);
        control.system += messages.sweep(msg => msg.system);
        control.boost += messages.sweep(msg => msg.roleSubscriptionData);
        control.hasThread += messages.sweep(msg => msg.hasThread);
        control.older += messages.sweep(msg => !Date.timeout(((1000 * 60 * 60) * 24) * 14, msg.createdAt.valueOf()));
        control.undeletable += messages.sweep(msg => !msg.deletable);

        if (messages.size <= 0) break;

        if (ignoreBots)
            control.ignoreBots += messages.sweep(msg => {

                for (const [memberId, member] of members)
                    if (member?.user?.bot) return msg?.author?.bot && msg?.author?.id !== memberId;
                return msg?.author?.bot;
            });

        if (ignoreMembers)
            control.ignoreMembers += messages.sweep(msg => {
                for (const [memberId, member] of members)
                    if (member) return !msg?.author?.bot && !msg?.webhookId && !msg?.system && msg?.author?.id !== memberId;
                return !msg?.author?.bot && !msg?.webhookId && !msg?.system;
            });

        if (ignoreWebhooks)
            control.ignoreWebhooks += messages.sweep(msg => msg?.webhookId);

        if (messages.size <= amount && isFilter()) disable++;
        if (amount < control.toFetchLimit && isFilter()) disable++;

        if (!members.size && !bots && !attachments && !webhooks)
            filterAndDefine(messages, "");

        if (members.size && bots) {
            control.ignored += messages.sweep(msg => members.has(msg.author.id) && !msg?.author?.bot);
            filterAndDefine(messages.filter(msg => members.has(msg.author.id)), "MemberMessages");
            filterAndDefine(messages.filter(msg => msg?.author?.bot), "botsMessages");
        }

        if (members.size && attachments) {
            control.ignored += messages.sweep(msg => !members.has(msg?.author?.id) && !msg?.attachments?.size && !msg?.attachments?.size);
            filterAndDefine(messages.filter(msg => members.has(msg.author.id)), "MemberMessages");
            filterAndDefine(messages.filter(msg => msg?.attachments?.size > 0), "attachmentsMessages");
        }

        if (members.size && webhooks) {
            control.ignored += messages.sweep(msg => !members.has(msg.author.id) && !msg?.webhookId);
            filterAndDefine(messages.filter(msg => members.has(msg.author.id)), "MemberMessages");
            filterAndDefine(messages.filter(msg => msg.webhookId), "webhookMessages");
        }

        if (members.size && !bots && !attachments && !webhooks) {
            control.ignored += messages.sweep(msg => !members.has(msg.author.id));
            filterAndDefine(messages.filter(msg => members.has(msg.author.id)), "MemberMessages");
        }

        if (!members.size && bots && !attachments && !webhooks) {
            control.ignored += messages.sweep(msg => !msg?.author?.bot);
            filterAndDefine(messages.filter(msg => msg.author.bot), "botsMessages");
        }

        if (!members.size && !bots && attachments && !webhooks) {
            control.ignored += messages.sweep(msg => msg?.attachments?.size === 0);
            filterAndDefine(messages.filter(msg => msg?.attachments?.size > 0), "attachmentsMessages");
        }

        if (!members.size && !bots && !attachments && webhooks) {
            control.ignored += messages.sweep(msg => !msg?.webhookId);
            filterAndDefine(messages.filter(msg => msg?.webhookId), "webhookMessages");
        }

        if ((!messages?.size && !control.toDelete.size) && control.looping === 0) break;
        if ((!messages?.size && !control.toDelete.size) && control.looping > 0) continue;
        if (control.toDelete.size + counter > amount) {
            const arr = Array.from(control.toDelete);
            arr.length = amount - counter;
            control.toDelete = new Set(arr);
        }

        control.toDelete = new Set(Array.from(control.toDelete).filter(Boolean));
        // eslint-disable-next-line no-await-in-loop
        const messagesDeleted = await channel.bulkDelete(Array.from(control.toDelete), true)
            .catch(err => {
                control.response += errorMessage(err.code);
                control.response += "\n";
                return null;
            });

        if (!messagesDeleted) break;

        if (script)
            messagesDeleted?.forEach(msg => {
                control.script.push({
                    userIdentificator: msg?.author?.username ? `${msg?.author?.username} (${msg?.author?.id})` : msg?.author?.id || "ID Not Found",
                    content: msg?.content || "",
                    date: Date.format(msg!.createdAt!.valueOf(), locale),
                    midias: msg?.attachments?.size || 0
                });
            });

        counter += messagesDeleted.size;
        control.messagesCounterControl -= messagesDeleted.size;
        control.looping++;
        control.toDelete.clear();

        if (
            counter >= amount
            || disable > 1
            || control.messagesCounterControl <= 0
            || control.toBreak
        ) break;

        // eslint-disable-next-line no-await-in-loop
        await sleep(2000);
        continue;

    }

    control.response = t("clear.you_ask_i_found", {
        e,
        locale,
        interaction,
        amount,
        control
    });

    if (counter > 0)
        control.response += t("clear.total_deleted", { e, locale, counter, control });

    for (const key of [
        "undeletable",
        "system",
        "older",
        "pinned",
        "hasThread",
        "ignoreBots",
        "ignoreMembers",
        "MemberMessages",
        "attachmentsMessages",
        "botsMessages",
        "webhookMessages",
        "ignoreWebhooks",
        "ignored"
    ])
        if ((control as any)[key] > 0) control.response += t(`clear.response.${key}`, { e, locale, control, members }) + "\n";

    const filters = [
        members.size && t("clear.response.filters.members", { locale, members }),
        bots && t("clear.response.filters.bots", { locale }),
        attachments && t("clear.response.filters.attachments", { locale }),
        webhooks && t("clear.response.filters.webhooks", { locale }),
        ignoreBots && t("clear.response.filters.ignoreBots", { locale }),
        ignoreMembers && t("clear.response.filters.ignoreMembers", { locale }),
        ignoreWebhooks && t("clear.response.filters.ignoreWebhooks", { locale })
    ].filter(Boolean).join("\n") || "";

    if (filters.length)
        control.response += t("clear.used_filters", { locale, filters });

    const files = await buildScript(control.script, filters) || [];

    return await respond(control.response, files);

    async function buildScript(scriptData: ScriptControl[], filters: string) {
        if (!script || !scriptData.length) return [];
        const text =
            `-------------------- ${client.user!.username.toUpperCase()} ${t("clear.script.title", locale)} --------------------
${t("clear.script.requested_by", locale)}: ${interaction.user.username} (${interaction.user.id})
${t("clear.script.channel", locale)}: ${channel!.name} - ${channel!.id}
${t("clear.script.createdAt", locale)}: ${Date.format(new Date().valueOf(), locale)}
${t("clear.script.deleted", { locale, scriptData })}
${filters ? `${filters.length} ${t("clear.script.filters", locale)}:\n${filters}` : t("clear.script.no_filters", locale)}

-------------------- ${t("clear.script.register_messages", locale)} --------------------
${scriptData.map(data => `-- ${data.userIdentificator} - ${data.date || "00/00/0000 - 00:00"}\n${data.content || `${data.midias || "0"} ${t("clear.script.midias", locale)}`}`).join("\n \n")}`;
        try {
            const file = Buffer.from(text);
            const attachment = new AttachmentBuilder(file, { name: "clear_logs_register.txt", description: "Script Data Clear Content Resource" });
            return [attachment];
        } catch (err) {
            return [];
        }

    }

    function filterAndDefine(collectionFiltered: Collection<string, Message>, collectionName: string) {
        if (collectionFiltered.size === 0) return;
        const collectionToArrayFormat = collectionFiltered.toJSON().map(msg => msg.id).filter(i => i);

        const toPush = collectionToArrayFormat.length > amount
            ? collectionToArrayFormat.slice(0, amount)
            : collectionToArrayFormat;

        for (const id of toPush)
            if (id && !control.toDelete.has(id)) {
                if (control.toDelete.size >= amount) break;
                if (collectionName) control[collectionName as keyof typeof control]++;
                control.toDelete.add(id);
            } else continue;

        return;
    }

    function errorMessage(errorCode: number): string {
        return {
            10008: "clear.errors.10008",
            50013: "clear.errors.50013",
            50034: "clear.errors.50034",
            50001: "clear.errors.50001",
            50035: "clear.errors.50035"
        }[errorCode] || "clear.errors.unknown";
    }

    async function respond(content: string, files?: any[]) {
        return await interaction.editReply({ content, files: files ? files : [] })
            .catch(async () => interaction.channel?.send({ content, files: files ? files : [] }).catch(() => { }));
    }
}