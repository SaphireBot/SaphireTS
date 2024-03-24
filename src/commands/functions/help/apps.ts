import { ApplicationCommandType, ButtonInteraction, Colors, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import handler from "../../../structures/commands/handler";
import selectMenu from "./selectMenu";
import { urls } from "../../../util/constants";
import { APIApplicationContextMenuCommand } from "../../../@types/commands";
import buttons from "./buttons";

export default async function apps(interaction: StringSelectMenuInteraction) {

  const { userLocale: locale, user } = interaction;
  const select = selectMenu(locale, user.id);

  await interaction.update({
    content: t("help.loading", { e, locale }),
    embeds: [],
    components: []
  });

  if (!handler.contextMenu.size)
    return await interaction.editReply({
      content: t("help.no_commands", { e, locale }),
      embeds: [],
      components: [select]
    });

  const commands = Array.from(
    handler.contextMenu.values()
  )
    .map(cmd => cmd.data);

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

  function EmbedGenerator(array: APIApplicationContextMenuCommand[]) {

    let amount = 10;
    let page = 1;
    const embeds = [];
    const length = array.length / 10 <= 1 ? 1 : parseInt(((array.length / 10) + 1).toFixed(0));

    for (let i = 0; i < array.length; i += 10) {

      const current = array.slice(i, amount);
      const pagination = length > 1 ? ` - ${page}/${length}` : "";
      const options = [] as any[];

      const description = current
        .sort((a, b) => a.type - b.type)
        .map(cmd => {
          const name = cmd.name_localizations?.[locale] || cmd.name;
          options.push({
            label: name,
            emoji: "🔎",
            description: t("help.see_info", { e, command: name, locale }),
            value: cmd.name,
          });

          return `${cmd.type === ApplicationCommandType.User ? "👤" : "💬"} ${name}`;
        })
        .join("\n");

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
        title: t("help.embeds.apps.title", { locale, pagination }),
        url: urls.saphireSiteUrl + "/commands",
        description: `${t("help.embeds.apps.description", locale)}\n \n${description}`,
        footer: {
          text: t("help.embeds.apps.footer", { commands: commands.length, locale }),
        }
      });

      page++;
      amount += 10;

    }

    return embeds;
  }

}