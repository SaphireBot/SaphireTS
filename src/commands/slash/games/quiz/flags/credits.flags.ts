import { ChatInputCommandInteraction, Colors, Message } from "discord.js";
import client from "../../../../../saphire";
import { StaffsIDs } from "../../../../../util/constants";
import { t } from "../../../../../translator";
import { allFlags } from "../../../../../structures/quiz/flags/flags";

export default async function credits(
  interaction: ChatInputCommandInteraction | Message
) {

  if (interaction instanceof ChatInputCommandInteraction)
    await interaction.deferReply();

  const { userLocale: locale } = interaction;
  const rody = await client.users.fetch(StaffsIDs.Rody).then(u => `${u.username} - \`${u.id}\``).catch(() => `Rody - \`${StaffsIDs.Rody}\``);
  const lereo = await client.users.fetch(StaffsIDs.Lereo).then(u => `${u.username} - \`${u.id}\``).catch(() => `Lereo - \`${StaffsIDs.Lereo}\``);
  const moana = await client.users.fetch(StaffsIDs.Moana).then(u => `${u.username} - \`${u.id}\``).catch(() => `Moana - \`${StaffsIDs.Moana}\``);
  const andre = await client.users.fetch(StaffsIDs.Andre).then(u => `${u.username} - \`${u.id}\``).catch(() => `Andre - \`${StaffsIDs.Andre}\``);
  const pandinho = await client.users.fetch(StaffsIDs.Pandinho).then(u => `${u.username} - \`${u.id}\``).catch(() => `Pandinho - \`${StaffsIDs.Pandinho}\``);
  const gorniaky = await client.users.fetch(StaffsIDs.Gorniaky).then(u => `${u.username} - \`${u.id}\``).catch(() => `Gorniaky - \`${StaffsIDs.Gorniaky}\``);
  const mari = await client.users.fetch(StaffsIDs.Mari).then(u => `${u.username} - \`${u.id}\``).catch(() => `Mari - \`${StaffsIDs.Mari}\``);

  const data = {
    embeds: [{
      color: Colors.Blue,
      title: t("quiz.flags.credits.title", locale),
      description: t("quiz.flags.credits.description", locale),
      fields: [
        {
          name: t("quiz.flags.credits.fields.0", locale),
          value: mari
        },
        {
          name: t("quiz.flags.credits.fields.1", locale),
          value: rody
        },
        {
          name: t("quiz.flags.credits.fields.2", locale),
          value: `${andre}\n${pandinho}\n${gorniaky}`
        },
        {
          name: t("quiz.flags.credits.fields.3", locale),
          value: `${lereo}\n${moana}`
        }
      ],
      footer: {
        text: `${t("quiz.flags.credits.footer", {
          flags: allFlags.length
        })} | cdn.saphire.one`
      }
    }]
  };

  return interaction instanceof ChatInputCommandInteraction
    ? await interaction.editReply(data)
    : await interaction.reply(data);
}