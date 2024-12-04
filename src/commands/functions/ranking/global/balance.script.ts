import { ChatInputCommandInteraction, Message, StringSelectMenuInteraction, AttachmentBuilder } from "discord.js";
import Database from "../../../../database";
import { t } from "../../../../translator";
// import { position } from "./functions";

export default async function balanceScript(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | Message,
  msg?: Message,

) {

  const { userLocale: locale } = interaction;
  const user = "author" in interaction ? interaction.author : interaction.user;

  const data = await Database.Users.aggregate([
    {
      $set: { Balance: { $ifNull: ["$Balance", 0] } },
    },
    {
      $setWindowFields: {
        partitionBy: null,
        sortBy: { Balance: -1 },
        output: { position: { $documentNumber: {} } },
      },
    },
    {
      $project: { _id: null, id: true, Balance: true, position: true },
    },
  ]);

  const userData = await Database.getBalance(user.id);

  // ${data.map(d => `${position(length, d.position || "?")}. ${d.id}: ${(d.Balance || 0).currency()}`).join("\n")}`,
  // const length = `${data.at(-1)?.position || 0}`.length;
  const attachment = new AttachmentBuilder(
    Buffer.from(
      `${t("ranking.script.balance", { locale, date: new Date().toLocaleDateString(locale) + " " + new Date().toLocaleTimeString(locale), user, msgUrl: msg?.url || "Origin Not Found", position: userData.position || "??" })}
${JSON.stringify(data, null, 2).replace(/(?:\[[\r\n]+)?  {[\r\n]+\s+"id": "(\d+)",(?:[\r\n]+\s+"Balance": (-?\d+),)?[\r\n]+\s+"position": (\d+),[\r\n]+\s+"_id": null[\r\n]+\s+},?(?:[\r\n]+\])?/g, "$3. $1: $2")}`,
    ),
    {
      name: "ranking.txt",
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
