import { APIEmbed, ChatInputCommandInteraction, Colors, Guild, Message, Routes } from "discord.js";
import { t } from "../../../../translator";
import { StaffsIDs } from "../../../../util/constants";
import client from "../../../../saphire";
import { QuizCharactersManager } from "../../../../structures/quiz";

export default async function credits(interaction: ChatInputCommandInteraction | Message) {

  if (interaction instanceof ChatInputCommandInteraction)
    await interaction.deferReply();

  const { userLocale: locale } = interaction;
  const paradiseId = "872962755538350110";
  const rody = await client.users.fetch(StaffsIDs.Rody).then(u => `${u.username} - \`${u.id}\``).catch(() => `Rody - \`${StaffsIDs.Rody}\``);
  const san = await client.users.fetch(StaffsIDs.San).then(u => `${u.username} - \`${u.id}\``).catch(() => `San - \`${StaffsIDs.Pandinho}\``);
  const gorniaky = await client.users.fetch(StaffsIDs.Gorniaky).then(u => `${u.username} - \`${u.id}\``).catch(() => `Gorniaky - \`${StaffsIDs.Gorniaky}\``);
  const paradise: Guild | null = client.guilds.getById(paradiseId) || await client.rest.get(Routes.guild(paradiseId)).catch(() => null) as Guild | null;
  const userMVP = QuizCharactersManager.usersThatSendCharacters.sort((a, b) => b - a).firstKey();
  let guildCredits: any;
  let userMVPCredits: any;

  if (paradise?.name)
    guildCredits = {
      name: t("quiz.characters.credits.fields.4", locale),
      value: `${paradise.name} \`${paradise.id}\``
    };

  if (userMVP) {
    const user = await client.users.fetch(userMVP).catch(() => null);
    if (user)
      userMVPCredits = {
        name: t("quiz.characters.credits.fields.5", locale),
        value: t("quiz.characters.credits.userMVP", { locale, user, characters: QuizCharactersManager.usersThatSendCharacters.get(userMVP)?.currency() }),
      };
  }

  const staff = await Promise.all(QuizCharactersManager.staff.map(id => client.users.fetch(id).catch(() => null)));
  let staffValue = "";

  for (const user of staff)
    if (user)
      staffValue += `${user.username} \`${user.id}\`\n`;

  if (!staffValue.length)
    staffValue += `${t("quiz.characters.credits.fields.6", locale)}`;

  const data = {
    embeds: [{
      color: Colors.Blue,
      title: t("quiz.characters.credits.title", locale),
      description: t("quiz.characters.credits.description", locale),
      fields: [
        {
          name: t("quiz.characters.credits.fields.0", locale),
          value: san
        },
        {
          name: t("quiz.characters.credits.fields.1", locale),
          value: rody
        },
        {
          name: t("quiz.characters.credits.fields.2", locale),
          value: gorniaky
        },
        {
          name: t("quiz.characters.credits.fields.3", locale),
          value: t("quiz.characters.credits.users", {
            locale,
            users: QuizCharactersManager.usersThatSendCharacters.size.currency(),
            characters: QuizCharactersManager.characters.size.currency()
          })
        },
        {
          name: t("quiz.characters.credits.fields.7", locale),
          value: staffValue
        },
        guildCredits,
        userMVPCredits
      ].filter(Boolean),
      footer: {
        text: "❤️ Powered by Cloudflare - https://cdn.saphire.one"
      }
    }] as APIEmbed[]
  };

  return interaction instanceof ChatInputCommandInteraction
    ? await interaction.editReply(data)
    : await interaction.reply(data);

}