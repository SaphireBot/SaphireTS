import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  ContainerBuilder,
  Message,
  MessageFlags,
  parseEmoji,
  TextDisplayBuilder,
} from "discord.js";
import { TopGGManager } from "../../../managers";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { Config } from "../../../util/constants";

export default async function voteAwaiting(
  interactionOrMessage: Message<true> | ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">,
  botMsg: Message<boolean> | undefined,
  doc?: unknown,
  reminderVote?: boolean,
) {

  const { channelId, guildId, userLocale: locale } = interactionOrMessage;
  const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

  const document = doc
    ||
    (botMsg?.id && botMsg?.url)
    ? await TopGGManager.createOrUpdate({
      userId: user.id,
      data: {
        $set: {
          userId: user.id,
          channelId,
          guildId,
          messageId: botMsg!.id,
          messageUrl: botMsg!.url,
          deleteAt: Date.now() + (1000 * 60 * 60),
          enableReminder: reminderVote || false,
        },
      },
    }).catch(() => null)
    : null;

  if (!document)
    return await botMsg?.edit({
      flags: [MessageFlags.IsComponentsV2],
      components: [
        new TextDisplayBuilder({
          content: t("vote.error_to_create", { e, locale }),
        }),
      ],
    });

  const container = new ContainerBuilder({
    accent_color: Colors.Blue,
  })
    .addTextDisplayComponents(
      new TextDisplayBuilder({
        content: `# ${e.topgg} Top.GG Bot List\n` + `${t("vote.waiting_vote", { e, locale })}`,
      }),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder({
            label: t("vote.vote", locale),
            emoji: parseEmoji("🔗")!,
            url: Config.TopGGLink,
            style: ButtonStyle.Link,
          }),
          new ButtonBuilder({
            label: t("keyword_cancel", locale),
            customId: JSON.stringify({ c: "vote", src: "cancel", uid: user.id }),
            emoji: parseEmoji(e.Trash)!,
            style: ButtonStyle.Danger,
          }),
        ],
      }),
    );

  return await botMsg?.edit({
    flags: [MessageFlags.IsComponentsV2],
    components: [container],
  });

}