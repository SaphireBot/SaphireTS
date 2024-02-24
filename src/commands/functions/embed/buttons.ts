import { AttachmentBuilder, ButtonInteraction } from "discord.js";
import modals from "../../../structures/modals";
import payload from "./payload";
import file_up from "./file_up";
import { e } from "../../../util/json";
import { t } from "../../../translator";

export default async function buttons(
  interaction: ButtonInteraction<"cached">,
  data?: {
    c: "embed",
    uid: string,
    src: "body" | "links" | "timestamp" | "footer" | "add_fields" | "back" | "json_up_text" | "json_up_file" | "json_down",
    ch?: string
  }
) {

  const { userLocale: locale, message, user } = interaction;

  if (
    !data
    || !data?.uid
    || data.uid !== user.id
  )
    return await interaction.reply({
      content: t("embed.you_cannot_click_here", { e, locale }),
      ephemeral: true
    });

  const embed = message.embeds?.[0]?.toJSON() || {};

  if (data?.src === "json_up_text") {
    return await interaction.showModal(
      modals.embedGenerator.json(locale, JSON.stringify(embed))
    );
  }

  if (data?.src === "json_down") {

    if (!Object.keys(embed).length)
      return await interaction.reply({
        content: t("embed.no_embed_found", { e, locale }),
        ephemeral: true
      });

    const attach = new AttachmentBuilder(
      Buffer.from(
        JSON.stringify(embed, undefined, 2),
        "utf-8"
      ),
      { name: "embed.json" }
    );

    return await interaction.reply({
      files: [attach],
      ephemeral: true
    });
  }

  if (data?.src === "json_up_file")
    return await file_up(interaction);

  if (data?.src === "back")
    return await interaction.update(payload(locale, user.id, embed));

  if (data?.src === "body")
    return await interaction.showModal(
      modals.embedGenerator.title(
        {
          locale,
          author: embed.author?.name,
          title: embed.title,
          description: embed.description,
          color: embed.color
        }
      )
    );

  if (data?.src === "links")
    return await interaction.showModal(
      modals.embedGenerator.links(
        {
          locale,
          author: embed.author?.icon_url,
          image: embed.image?.url,
          thumbnail: embed.thumbnail?.url,
          url: embed.url
        }
      )
    );

  if (data?.src === "add_fields")
    return await interaction.showModal(
      modals.embedGenerator.fields(locale)
    );

  if (data?.src === "timestamp") {

    if (embed.timestamp)
      delete embed.timestamp;
    else embed.timestamp = new Date().toISOString();

    return await interaction.update(payload(locale, user.id, embed));
  }

  if (data?.src === "footer")
    return await interaction.showModal(
      modals.embedGenerator.footer(
        {
          locale,
          icon: embed.footer?.icon_url,
          text: embed.footer?.text
        }
      )
    );

  if (data?.src === "def_webhook" && data?.ch)
    return await interaction.showModal(
      modals.embedGenerator.webhook(locale, data.ch)
    );
  
}