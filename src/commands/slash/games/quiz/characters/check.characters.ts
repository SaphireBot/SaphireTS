import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Message, StringSelectMenuInteraction } from "discord.js";
import { t } from "../../../../../translator";
import { e } from "../../../../../util/json";
import { ChannelsInGame } from "../../../../../util/constants";
import { QuizCharacter, QuizCharactersManager } from "../../../../../structures/quiz";
import { mapSelectMenuOptions } from "djs-protofy";

export default async function checkBeforeIniciate(
  interaction: ChatInputCommandInteraction<"cached"> | Message<true> | StringSelectMenuInteraction<"cached">,
) {

  const { userLocale: locale, guild, channelId } = interaction;

  if (QuizCharactersManager.control.loading)
    return await reply({
      content: t("quiz.characters.quiz_in_loading", { e, locale }),
    });

  if (!QuizCharactersManager.characters.size)
    return await reply({
      content: t("quiz.characters.viewer.no_query", { e, locale }),
    });

  if (!guild)
    return await reply({
      content: t("quiz.characters.a_guild_is_required", { e, locale }),
      ephemeral: true,
    }).then(autoDelete);

  if (ChannelsInGame.has(channelId))
    return await reply({
      content: t("quiz.characters.channel_in_use", { e, locale }),
      ephemeral: true,
    }).then(autoDelete);

  ChannelsInGame.add(channelId);
  const msg = await reply({
    content: t("quiz.characters.which_mode_you_want", { e, locale }),
    fetchReply: interaction instanceof ChatInputCommandInteraction,
    components: [
      {
        type: 1,
        components: [{
          type: 3,
          custom_id: "quiz",
          placeholder: t("quiz.characters.components.selectMenu", locale),
          options: QuizCharactersManager.getSelectMenuCategoryOptions(locale),
          max_values: QuizCharactersManager.categories.length + QuizCharactersManager.genders.length,
          min_values: 1,
        }],
      },
      {
        type: 1,
        components: [
          {
            type: 2,
            label: t("keyword_confirm", locale),
            emoji: e.CheckV,
            custom_id: "confirm",
            style: ButtonStyle.Success,
          },
          {
            type: 2,
            label: t("keyword_cancel", locale),
            emoji: e.DenyX,
            custom_id: "cancel",
            style: ButtonStyle.Danger,
          },
        ],
      },
    ].asMessageComponents(),
  })
    .catch(err => {
      console.log("Error to reply Quiz Character", err);
      ChannelsInGame.delete(channelId);
      return;
    });

  if (!msg) return;

  const user = "user" in interaction ? interaction.user : interaction.author;
  const options = new Set<string>();
  const collector = msg.createMessageComponentCollector({
    filter: int => int.user.id === user.id,
    time: (1000 * 60) * 2,
  })
    .on("collect", async (int: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached">): Promise<any> => {

      const { customId, userLocale: locale, message } = int;
      const values = "values" in int ? int.values : [];

      if (customId === "cancel") {
        ChannelsInGame.delete(channelId);
        collector.stop();
        return await int.update({
          content: t("quiz.characters.cancelled", { e, locale }),
          components: [],
        }).catch(() => { });
      }

      if (customId === "confirm") {
        collector.stop();
        return new QuizCharacter(int, options);
      }

      options.clear();
      let content = `${t("quiz.characters.which_mode_you_want", { e, locale })}\n`;
      const categories = `${t("quiz.characters.categories_choosed", {
        locale,
        categories: values
          .filter(val => !val.includes("zero"))
          .map(val => {
            options.add(val);
            return `\`${t(`quiz.characters.names.${val}`, locale)}\``;
          }).join(", "),
      })}`;

      if (categories.length > 5)
        content += categories;

      const components = message.components;

      mapSelectMenuOptions(
        components,
        (option) => {
          option.default = options.has(option.value);
          return option;
        },
      );

      return await int.update({ content, components });
    })
    .on("end", async (_, reason): Promise<any> => {
      if (reason === "user") return;
      ChannelsInGame.delete(channelId);
      return await msg?.edit({
        content: t("quiz.characters.cancelled", { e, locale }),
        components: [],
      }).catch(() => { });
    });

  return;

  async function reply(data: any): Promise<Message<true> | void> {
    if (
      interaction instanceof ChatInputCommandInteraction
      || interaction instanceof Message
    )
      return await interaction.reply(data) as any;

    if (interaction instanceof StringSelectMenuInteraction)
      return await interaction.update(data) as any;

    return;
  }
}

async function autoDelete(message: Message<true> | any) {
  if (message instanceof Message) return;
  return setTimeout(async () => await message.delete()?.catch(() => { }), 1000 * 5);
}