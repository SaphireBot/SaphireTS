import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, Colors, ComponentType, ContainerBuilder, Message, MessageEditOptions, parseEmoji, SectionBuilder } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { Vote } from "../../../@types/database";
import { Config } from "../../../util/constants";

export default async function voteEnable(
  interactionOrMessage: Message<true> | ChatInputCommandInteraction<"cached">,
  vote: Vote | undefined,
  botMsg?: Message<true>,
) {

  const { userLocale: locale } = interactionOrMessage;
  const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

  const container = new ContainerBuilder({
    accent_color: Colors.Blue,
  })
    .addSectionComponents(
      new SectionBuilder({
        components: [
          {
            content: t("vote.your_message_vote", {
              locale,
              e,
              link: vote?.messageUrl || "https://google.com",
            }),
            type: ComponentType.TextDisplay,
          },
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: {
            url: "https://media.licdn.com/dms/image/v2/C560BAQHrHE9KO9J35A/company-logo_200_200/company-logo_200_200/0/1647039522192/topgg_logo?e=2147483647&v=beta&t=vWaNkcLGBjMtKzI7bRVLc6HZ3Bc_r1Y_ATpX2e9k_00",
          },
        },
      }),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder({
            emoji: parseEmoji("📨")!,
            label: t("vote.vote", locale),
            style: ButtonStyle.Link,
            url: Config.TopGGLink,
          }),
          new ButtonBuilder({
            custom_id: JSON.stringify({ c: "vote", src: "reset", uid: user.id }),
            emoji: parseEmoji(e.Loading)!,
            label: t("keyword_reset", locale),
            style: ButtonStyle.Primary,
          }),
        ],
      }),
    );

  const payload: MessageEditOptions = {
    flags: ["IsComponentsV2"],
    components: [container],
    content: null,
  };

  if (botMsg) return await botMsg.edit(payload);
  if (interactionOrMessage instanceof ChatInputCommandInteraction)
    return interactionOrMessage.editReply(payload);
}