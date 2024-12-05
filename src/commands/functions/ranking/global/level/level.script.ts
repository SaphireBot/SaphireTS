import { ChatInputCommandInteraction, Message, StringSelectMenuInteraction, AttachmentBuilder } from "discord.js";
import Database from "../../../../../database";
import { t } from "../../../../../translator";
import Experience from "../../../../../managers/experience/experience";

export default async function levelScript(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | Message,
  msg?: Message,

) {

  const { userLocale: locale } = interaction;
  const user = "author" in interaction ? interaction.author : interaction.user;

  const data = await Database.Users.aggregate([
    {
      $set: { Level: { $ifNull: ["$Experience.Level", 0] } },
    },
    {
      $setWindowFields: {
        partitionBy: null,
        sortBy: { Level: -1 },
        output: { position: { $documentNumber: {} } },
      },
    },
    {
      $project: { _id: null, id: true, Level: true, position: true },
    },
  ]);

  const position = (await Experience.rank(user.id)).position;

  const attachment = new AttachmentBuilder(
    Buffer.from(
      `${t("ranking.script.level", { locale, date: new Date().toLocaleDateString(locale) + " " + new Date().toLocaleTimeString(locale), user, msgUrl: msg?.url || "Origin Not Found", position })}
${JSON.stringify(data, null, 2).replace(/(?:\[[\r\n]+)?  {[\r\n]+\s+"id": "(\d+)",(?:[\r\n]+\s+"Level": (-?\d+),)?[\r\n]+\s+"position": (\d+),[\r\n]+\s+"_id": null[\r\n]+\s+},?(?:[\r\n]+\])?/g, "$3. $1: $2")}`,
    ),
    {
      name: "ranking_level.txt",
      description: "Saphire Database Information Public Access",
    },
  );

  if (
    interaction instanceof ChatInputCommandInteraction
    || interaction instanceof StringSelectMenuInteraction
  )
    // @ts-expect-error ignore
    return await interaction.editReply({ content: null, files: [attachment], fetchReply: true });

  if (interaction instanceof Message) {
    if (msg) return await msg.edit({ content: null, files: [attachment] });
    return await interaction.reply({ content: undefined, files: [attachment] });
  }

}
