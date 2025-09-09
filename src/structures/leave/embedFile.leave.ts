import { ButtonStyle, parseEmoji, PermissionFlagsBits, StringSelectMenuInteraction, time } from "discord.js";
import permissionsMissing from "../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../util/constants";
import { t } from "../../translator";
import { e } from "../../util/json";
import { EmbedBuilder, embedLength } from "@discordjs/builders";
import payloadLeave, { LeaveCacheEmbed } from "./payload.leave";
const cancelOptions = ["cancelar", "cancel", "stornieren", "取消", "キャンセル", "annuler"];

export default async function embedLeaveFile(interaction: StringSelectMenuInteraction<"cached">) {

  const { guild, member, userLocale: locale, message, user, channel } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });
  if (!message) return;

  if (!member?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.Administrator, true))
    return await permissionsMissing(interaction, [DiscordPermissons.Administrator], "Discord_client_need_some_permissions");

  await message.edit({ components: message.components });
  const msg = await interaction.reply({
    content: t("embed.json.time_to_send", { e, locale, user, time: time(new Date(Date.now() + (1000 * 60)), "R") }),
    withResponse: true,
  }).then(res => res.resource?.message);
  if (!msg) return;

  const fileCollector = channel?.createMessageCollector({
    filter: msg => msg.author.id === user.id,
    time: 1000 * 60,
  })
    .on("collect", async (message): Promise<any> => {

      if (cancelOptions.includes(message.content?.toLowerCase())) {
        fileCollector?.stop();
        await msg.delete().catch(() => { });
        await sleep(1500);
        return await message.delete().catch(() => { });
      }

      const attach = message.attachments?.first();
      if (!attach || !attach.url || !attach.contentType?.startsWith("application/json")) return;

      await msg.edit({
        content: t("embed.json.downloading", { e, locale }),
      });

      await sleep(2000);
      return await fetch(attach.url)
        .then(async res => {

          await message.delete().catch(() => { });
          if (!res.ok) {
            fileCollector?.stop();
            await msg.edit({
              content: t("embed.json.downloadError", { e, locale }),
            });
            await sleep(5000);
            await msg.delete();
            return {};
          }

          return await res.json();
        })
        .then(async (json): Promise<any> => {

          const rawEmbed = json as any;

          if (
            !rawEmbed?.author
            && !rawEmbed?.description
            && !rawEmbed?.title
            && !rawEmbed?.image?.url
            && !rawEmbed?.footer?.text
          ) {
            await msg.edit({ content: t("embed.json.downloadError", { e, locale }) });
            fileCollector?.stop();
            await sleep(3000);
            return await msg.delete().catch(() => { });
          }

          await msg.edit({
            content: t("embed.json.writing", { e, locale }),
          });

          await sleep(2000);
          try {
            const embed = new EmbedBuilder(rawEmbed);
            if (embed?.data.description) embed.setDescription(embed.data.description.limit("EmbedDescription"));
            if (embed?.data.image?.proxy_url) embed.setImage(embed.data.image.url);

            const length = embedLength(embed.data);
            if (length > 6000)
              return await msg.edit({
                content: t("leave.content.embed_content_over_limit", { e, locale, length: length.currency() }),
              });

            fileCollector?.stop();
            await msg.delete().catch(() => { });
            await sleep(1000);

            LeaveCacheEmbed.set(member.id, embed.data);
            const payload = payloadLeave(undefined, member);

            if (!payload.embeds.length) {
              await msg.edit({ content: t("embed.json.downloadError", { e, locale }) });
              fileCollector?.stop();
              await sleep(3000);
              return await msg.delete().catch(() => { });
            }

            return await interaction.message.edit({
              embeds: payload.embeds,
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      label: t("leave.components.buttons.back", locale),
                      custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "back" }),
                      style: ButtonStyle.Primary,
                      emoji: parseEmoji("⏮️")!,
                    },
                    {
                      type: 2,
                      label: t("keyword_save", locale),
                      custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "save" }),
                      style: ButtonStyle.Success,
                      emoji: parseEmoji("💾")!,
                    },
                    {
                      type: 2,
                      label: t("leave.components.buttons.edit", locale),
                      custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "edit" }),
                      style: ButtonStyle.Primary,
                      emoji: parseEmoji("📝")!,
                    },
                    {
                      type: 2,
                      label: t("leave.components.buttons.view", locale),
                      custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "view" }),
                      style: ButtonStyle.Primary,
                      emoji: parseEmoji("🔎")!,
                    },
                    {
                      type: 2,
                      label: t("leave.components.buttons.delete", locale),
                      custom_id: JSON.stringify({ c: "leave_embed", uid: member.id, src: "delete" }),
                      style: ButtonStyle.Danger,
                      emoji: parseEmoji(e.Trash)!,
                    },
                  ],
                },
              ],
            })
              .then(async () => await msg.delete().catch(() => { }))
              .catch(async err => await msg.edit({ content: t("embed.json.error", { e, locale, err }) }));

          } catch (err) {
            return await msg.edit({ content: t("embed.json.error", { e, locale, err }) });
          }

        })
        .catch(async err => await msg.edit({ content: t("embed.json.error", { e, locale, err }) }));

    });


}