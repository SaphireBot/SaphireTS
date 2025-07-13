import { ActionRow, APIEmbed, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, Collection, Colors, InteractionEditReplyOptions, MessageActionRowComponent, parseEmoji, StringSelectMenuInteraction } from "discord.js";
import { mapButtons } from "djs-protofy";
import { e } from "../../../util/json";
import { CollectorReasonEnd, JikanDataRecomendationEntry, JikanGetAnimeFullByIdResponse, JikanRecomendationResponse } from "../../../@types/commands";
import { t } from "../../../translator";
import translate from "google-translate-api-x";
import { languages } from "../../prefix/util/translate/constants.translate";

type langsKeyof = keyof typeof languages;
let jikanResponse: JikanRecomendationResponse["data"] | undefined = undefined;
const animesRecomendations = new Collection<number, JikanDataRecomendationEntry>();
const animesData = new Collection<string | number, JikanGetAnimeFullByIdResponse["data"]>();

export default async function recomendationAnime(
  interaction: ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached">,
  customData?: { c: "recomendation_anime", uid: string },
) {

  let comps: ActionRow<MessageActionRowComponent>[] = [];
  if (interaction instanceof ButtonInteraction) {
    if (interaction.message.partial) await interaction.message.fetch().catch(() => { });
    comps = interaction.message.components as any;
    const components = mapButtons(comps, button => {
      if (button.style !== ButtonStyle.Primary) return button;
      button.disabled = true;
      if (button.custom_id.includes(customData?.c || "???")) {
        button.emoji = parseEmoji(e.Loading)!;
      } else {
        button.style = ButtonStyle.Secondary;
      }
      return button;
    });
    await interaction.update({ components });
  } else await interaction.deferReply();

  if (!jikanResponse || !animesRecomendations.size) {
    const res = await fetch(
      "https://api.jikan.moe/v4/recommendations/anime",
      { headers: { "Content-Type": "application/json" } },
    )
      .then(res => res.json())
      .catch(err => {
        console.log(err);
        return err;
      }) as JikanRecomendationResponse | null;

    if (res) {
      jikanResponse = res?.data;

      for (const recomendation of jikanResponse)
        for (const data of recomendation.entry)
          animesRecomendations.set(data.mal_id, data);

      setTimeout(() => {
        jikanResponse = undefined;
      }, (1000 * 60) * 20);
    }
  }

  if (!jikanResponse || !animesRecomendations.size)
    return await interaction.editReply({
      content: `${e.bug} | Jikan API Requesting Error.`,
      components: comps,
    });

  const lauchEmbeds: InteractionEditReplyOptions[] = [];

  const arr = Array.from(animesRecomendations.values());
  for (let i = 0; i < animesRecomendations.size; i += 25) {
    const data = arr.slice(i, 25 + i);
    lauchEmbeds.push({
      content: null,
      embeds: [{
        color: Colors.Blue,
        title: `📺 ${t("anime.recomendations", interaction.userLocale)}`,
        description: data
          .map(data => `\`[${data.mal_id}]\` **[${data.title}](${data.url})**`)
          .join("\n")
          .limit("EmbedDescription"),
        image: { url: "https://upload.wikimedia.org/wikipedia/commons/5/58/MyAnimeList_-_Full_Text_Logo.jpg" },
        footer: {
          text: `${animesRecomendations.size} ${t("anime.indication.embed_title", interaction.userLocale)}`,
        },
      }],
      components: [
        {
          type: 1,
          components: [{
            type: 3,
            custom_id: "searchingAnime",
            placeholder: t("anime.search.select_menu_placeholder", interaction.userLocale),
            options: data.map(data => ({
              label: `${data.title.limit("SelectMenuOptionLabel")}`,
              emoji: "📺",
              description: `M.A.L ID: ${data.mal_id}`,
              value: `${data.mal_id}`,
            })),
          }] as any[],
        },
      ] as any[],
    });
  }

  const success = await interaction.editReply(lauchEmbeds[0])
    .catch(() => null);

  if (!success) return;

  await sleep(2000);

  const components = success.components.map(comp => comp.toJSON()) as any[];
  const buttons = {
    type: 1,
    components: [
      {
        type: 2,
        emoji: "⏮️",
        custom_id: "zero",
        style: ButtonStyle.Primary,
      },
      {
        type: 2,
        emoji: "⏪",
        custom_id: "back",
        style: ButtonStyle.Primary,
      },
      {
        type: 2,
        label: `1/${lauchEmbeds.length}`,
        custom_id: "layout",
        style: ButtonStyle.Secondary,
        disabled: true,
      },
      {
        type: 2,
        emoji: "⏩",
        custom_id: "next",
        style: ButtonStyle.Primary,
      },
      {
        type: 2,
        emoji: "⏭️",
        custom_id: "last",
        style: ButtonStyle.Primary,
      },
    ],
  };

  const message = await interaction.editReply({ components: [components, buttons].flat() }).catch(() => null);
  if (!message) return;

  let index = 0;
  return message.createMessageComponentCollector({
    filter: int => int.user.id === (customData?.uid || interaction.user.id),
    idle: (1000 * 60) * 3,
  })
    .on("collect", async int => {

      if (int instanceof ButtonInteraction) return await buttonClick(int);
      if (int instanceof StringSelectMenuInteraction) return await selectMenuClick(int);
    })
    .on("end", async (_, reason: CollectorReasonEnd) => {
      if (["time", "limit", "idle", "user"].includes(reason))
        return await message.edit({ components: [] }).catch(() => { });
    });

  async function buttonClick(int: ButtonInteraction) {

    if (int.user.id !== (customData?.uid || interaction.user.id)) return;

    const customId = int.customId as "zero" | "back" | "next" | "last";

    if (customId === "zero") index = 0;

    if (customId === "back") {
      if (index <= 0) index = lauchEmbeds.length - 1;
      else index--;
    }

    if (customId === "next") {
      if (index >= lauchEmbeds.length - 1) index = 0;
      else index++;
    }

    if (customId === "last") index = lauchEmbeds.length - 1;

    buttons.components[2].label = `${index + 1}/${lauchEmbeds.length}`;
    return await int.update({
      embeds: lauchEmbeds[index].embeds,
      components: ([lauchEmbeds[index].components, buttons] as any[]).flat(),
    });
  }

  async function selectMenuClick(int: StringSelectMenuInteraction) {

    const { values, userLocale: locale, message } = int;
    const value = values[0];

    message.edit({ components: message.components }).catch(() => { });
    await int.reply({
      content: t("anime.loading_and_translate", { e, locale }),
      ephemeral: true,
    });

    let data = animesData.get(value);

    if (!data) {
      const res = (
        await fetch(
          `https://api.jikan.moe/v4/anime/${value}/full`,
          { headers: { "Content-Type": "application/json" } },
        )
          .then(res => res.json())
          .catch(err => console.log(err)) as JikanGetAnimeFullByIdResponse | null
      )?.data;

      if (res) {
        animesData.set(value, res);
        data = res;
      }
    }

    if (!data)
      return await int.editReply({ content: t("anime.not_found", { e, locale }) });

    const synopsis = await translate(data.synopsis, {
      to: languages[locale as langsKeyof] || locale,
    })
      .then(res => res.text)
      .catch(err => {
        console.log(err);
        return data.synopsis;
      });

    const fields: APIEmbed["fields"] = [];

    if (data.streaming?.length)
      fields.push({
        name: t("anime.where_to_watch", locale),
        value: data.streaming.map(stream => `[${stream.name}](${stream.url})`).join(", ").limit("EmbedFieldValue"),
      });

    const embed: APIEmbed = {
      color: Colors.Blue,
      author: {
        name: "My Anime List",
        icon_url: "https://upload.wikimedia.org/wikipedia/commons/7/7a/MyAnimeList_Logo.png",
        url: "https://myanimelist.net/",
      },
      url: data?.url,
      title: data.title_english.limit("EmbedTitle"),
      description: synopsis.limit("EmbedDescription"),
      fields,
      image: {
        url: data.images.jpg.image_url!,
      },
    };

    await int.editReply({ content: null, embeds: [embed] });
    if (data.trailer.url) await int.followUp({ content: data.trailer.url, ephemeral: true });
    return;
  }
}