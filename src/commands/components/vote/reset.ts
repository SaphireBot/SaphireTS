import {
  ButtonInteraction,
  ButtonStyle,
  MessageFlags,
  parseEmoji,
  TextDisplayBuilder,
  time,
  Routes,
} from "discord.js";
import { mapButtons } from "djs-protofy";
import { e } from "../../../util/json";
import { t } from "../../../translator";
import { TopGGManager } from "../../../managers";
import Database from "../../../database";
import client from "../../../saphire";
import voteAwaiting from "../../functions/vote/vote.awaiting";

export default async function resetVote(
  interaction: ButtonInteraction<"cached">,
) {

  const { userLocale: locale, user, message, channel, channelId, guildId } = interaction;

  const buttons = mapButtons(message.components, button => {
    button.disabled = true;
    if (button.style === ButtonStyle.Link) return button;
    if ("emoji" in button) button.emoji = parseEmoji(e.Loading)!;
    return button;
  });

  const editedPayload = {
    flags: [MessageFlags.IsComponentsV2],
    components: buttons,
    withResponse: true,
  };

  let msg = await interaction.update(editedPayload as any)
    .then(res => res.resource?.message)
    .catch(() => undefined);

  if (!msg)
    msg = await channel?.send(editedPayload as any);

  await sleep(1000);
  const vote = await TopGGManager.fetcher(user.id);
  const userData = await Database.getUser(user.id);
  await sleep(1000);

  const timeDifferent = (userData.Timeouts?.TopGGVote || 0) > Date.now();
  if (timeDifferent)
    return await interaction.editReply({
      flags: [MessageFlags.IsComponentsV2],
      components: [
        new TextDisplayBuilder({
          content: t("vote.timeout", {
            e,
            locale,
            time: time(new Date(userData.Timeouts!.TopGGVote), "R"),
            votes: userData?.TopGGVotes || 0,
          }),
        }),
      ],
    }).catch(() => { });

  const document = await TopGGManager.createOrUpdate(
    {
      userId: user.id,
      data: {
        $set: {
          userId: user.id,
          channelId,
          guildId,
          messageId: message.id,
          messageUrl: message.url,
          deleteAt: Date.now() + (1000 * 60 * 60),
          enableReminder: vote?.enableReminder || false,
        },
      },
    },
  );

  if (
    (message.id !== vote?.messageId)
    && vote?.channelId
    && vote.messageId
  )
    await client.rest.delete(
      Routes.channelMessage(vote.channelId, vote.messageId),
    ).catch(() => { });

  await sleep(2000);

  return await voteAwaiting(interaction, msg, document);

}