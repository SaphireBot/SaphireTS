import { ButtonInteraction, ButtonStyle, parseEmoji, PermissionFlagsBits } from "discord.js";
import { e } from "../../../util/json";
import permissionsMissing from "../../../commands/functions/permissionsMissing";
import { DiscordPermissons } from "../../../util/constants";
import { mapButtons } from "djs-protofy";
import { t } from "../../../translator";

export default async function unbanLogButton(
  interaction: ButtonInteraction<"cached">,
  customData: { c: "unban", userId: string },
) {

  const { member, guild, user, message, userLocale: locale } = interaction;

  if (message.partial) await message.fetch()?.catch(() => { });

  if (!member?.permissions.has(PermissionFlagsBits.BanMembers, true))
    return await permissionsMissing(interaction, [DiscordPermissons.BanMembers], "Discord_you_need_some_permissions");

  if (!guild.members?.me?.permissions.has(PermissionFlagsBits.BanMembers, true))
    return await permissionsMissing(interaction, [DiscordPermissons.BanMembers], "Discord_client_need_some_permissions");

  let components = mapButtons(message.components, button => {
    if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;
    button.disabled = true;
    button.emoji = parseEmoji(e.Loading)!;
    return button;
  });
  await interaction.update({ components });

  const success = await guild.bans.remove(customData.userId, `Unban by ${user.username} ${user.id}`)
    .then(() => true)
    .catch(() => false);

  components = mapButtons(message.components, button => {
    if (button.style === ButtonStyle.Link || button.style === ButtonStyle.Premium) return button;
    button.emoji = parseEmoji(success ? e.CheckV : e.bug)!;
    button.style = success ? ButtonStyle.Success : ButtonStyle.Danger;
    button.label = success ? t("logs.ban.unban_success", locale) : t("logs.ban.unban_fail", locale);
    return button;
  });

  return await interaction.editReply({ components });
}