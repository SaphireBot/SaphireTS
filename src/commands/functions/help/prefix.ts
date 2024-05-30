import { ButtonInteraction, Colors, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import handler from "../../../structures/commands/handler";
import selectMenu from "./selectMenu";
import { urls } from "../../../util/constants";
import { PrefixCommandType } from "../../../@types/commands";
import Database from "../../../database";
import buttons from "./buttons";

export default async function prefix(interaction: StringSelectMenuInteraction) {

  const { userLocale: locale, user, guild } = interaction;
  const select = selectMenu(locale, user.id);

  await interaction.update({
    content: t("help.loading", { e, locale }),
    embeds: [],
    components: []
  });

  const prefixes = await Database.getPrefix({ guildId: guild?.id, userId: user.id });
  const prefix = prefixes.random()!;

  if (!handler.prefixes.size)
    return await interaction.editReply({
      content: t("help.no_commands", { e, locale }),
      embeds: [],
      components: [select]
    });

  const commands = Array.from(
    handler.prefixes.values()
  );

  const commandsSelect = [] as any[];
  const embeds = EmbedGenerator(commands);
  const components: any[] = [select];

  if (commandsSelect.length)
    components.push(commandsSelect[0]);

  if (embeds.length > 1)
    components.push(buttons);

  const msg = await interaction.editReply({
    content: null,
    embeds: [embeds[0]],
    components
  });

  if (embeds.length <= 1) return;

  let i = 0;
  const collector = msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    idle: (1000 * 60) * 2
  })
    .on("collect", async (int: ButtonInteraction | StringSelectMenuInteraction): Promise<any> => {

      if (int instanceof StringSelectMenuInteraction)
        return collector.stop();

      const { customId } = int;

      if (customId === "zero") i = 0;
      if (customId === "preview") i = i <= 0 ? embeds.length - 1 : i - 1;
      if (customId === "next") i = i >= embeds.length - 1 ? 0 : i + 1;
      if (customId === "last") i = embeds.length - 1;

      const components: any[] = [select];
      const selectCommands = commandsSelect[i];

      if (selectCommands) components.push(selectCommands);
      components.push(buttons);

      return await int.update({ embeds: [embeds[i]], components });
    })
    .on("end", async (_, reason: string): Promise<any> => {

      if (reason === "user") return;

      return await interaction.editReply({
        content: t("help.choose_an_value", { e, locale }),
        embeds: [],
        components: [select]
      });
    });

  return;

  function EmbedGenerator(array: PrefixCommandType[]) {

    let amount = 10;
    let page = 1;
    const embeds = [];
    const length = array.length / 10 <= 1 ? 1 : parseInt(((array.length / 10) + 1).toFixed(0));

    for (let i = 0; i < array.length; i += 10) {

      const current = array.slice(i, amount);
      const pagination = length > 1 ? ` - ${page}/${length}` : "";
      const options = [] as any[];

      const fields = current.map(cmd => {

        options.push({
          label: cmd.name,
          emoji: "🔎",
          description: t("help.see_info", { e, command: cmd.name, locale }),
          value: cmd.name,
        });

        return {
          name: `${prefix}${cmd.name}`,
          value: `📝 ${cmd.description}${cmd.aliases?.length ? `\n🏷️ ${cmd.aliases.map(al => `\`${al}\``).join(", ")}` : ""}`.limit("EmbedFieldValue")
        };
      });

      commandsSelect.push({
        type: 1,
        components: [{
          type: 3,
          custom_id: JSON.stringify({ c: "help", src: "info", uid: user.id }),
          placeholder: t("help.selectmenu.info_placeholder", locale),
          options
        }]
      });

      embeds.push({
        color: Colors.Blue,
        title: t("help.embeds.prefix.title", { e, locale, pagination, prefix }),
        url: urls.saphireSiteUrl + "/commands",
        description: t("help.embeds.prefix.description", { locale, prefixes: prefixes.map(prefix => `\`${prefix}\``).join(", ") }),
        fields,
        footer: {
          text: t("help.embeds.prefix.footer", { commands: commands.length, locale }),
        }
      });

      page++;
      amount += 10;

    }

    return embeds;
  }

}