import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  ContainerBuilder,
  Message,
  MessageFlags,
  parseEmoji,
  SeparatorBuilder,
  TextDisplayBuilder,
  ModalSubmitInteraction,
  time,
} from "discord.js";
import Database from "../../../database";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { LottoManager } from "../../../managers";

export default async function lottoPainel(
  interactionOrMessage: Message<true> | ChatInputCommandInteraction<"cached"> | ButtonInteraction<"cached"> | ModalSubmitInteraction<"cached">,
) {

  const { userLocale: locale, channel } = interactionOrMessage;
  const user = interactionOrMessage instanceof Message ? interactionOrMessage.author : interactionOrMessage.user;

  const loadingPayload: any = {
    flags: [MessageFlags.IsComponentsV2],
    components: [
      new TextDisplayBuilder({
        content: `${e.Loading} | ${e.Animated.SaphireReading}`,
      }),
    ],
  };

  let msg: Message<boolean> | undefined;

  if (interactionOrMessage instanceof Message)
    msg = await interactionOrMessage.reply(loadingPayload as any);

  if (interactionOrMessage instanceof ChatInputCommandInteraction) {
    loadingPayload.withResponse = true;
    msg = await interactionOrMessage.reply(loadingPayload as any)
      .then(res => res.resource?.message || undefined)
      .catch(() => undefined)
      || undefined;
  }

  if (interactionOrMessage instanceof ButtonInteraction) {
    loadingPayload.withResponse = true;
    msg = await interactionOrMessage.update(loadingPayload as any)
      .then(res => res.resource?.message || undefined)
      .catch(() => undefined)
      || undefined;
  }

  if (interactionOrMessage instanceof ModalSubmitInteraction)
    msg = await interactionOrMessage.message?.edit(loadingPayload as any);

  const container = new ContainerBuilder({
    accent_color: Colors.Blue,
  });

  container.addTextDisplayComponents(
    new TextDisplayBuilder({
      content: `# ${t("lotto.painel", { e, locale })}`,
    }),
  );

  container.addSeparatorComponents(new SeparatorBuilder({}));

  let content = "";
  content += `${t("lotto.people", { e, locale, people: LottoManager.users.size })}\n`;
  content += `${t("lotto.prize", { e, locale, prize: LottoManager.totalPrize.currency() })}\n`;
  content += `${t("lotto.base_bet", { e, locale, value: LottoManager.baseValue.currency() })}\n`;
  content += `${t("lotto.date", { e, locale, date: time(LottoManager.nextDraw, "F") })}`;

  container.addTextDisplayComponents(
    new TextDisplayBuilder({ content }),
  );

  container.addSeparatorComponents(new SeparatorBuilder({}));

  const lottoClientData = (await Database.getClientData())?.Lotto;

  container.addTextDisplayComponents(
    new TextDisplayBuilder({
      content: t("lotto.last_draw", {
        e,
        locale,
        number: lottoClientData?.lastNumber || 0,
        people: lottoClientData?.lastWinners?.length || 0,
        prize: Number(((lottoClientData?.lastPrize || 0) / (lottoClientData?.lastWinners?.length || 0)) || 0).toFixed(0),
      }),
    }),
  );

  const reminderEnable = LottoManager.usersWithReminderEnable.has(user.id);

  container.addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          label: t("lotto.play", locale),
          customId: JSON.stringify({ c: "lotto", src: "play", uid: user.id }),
          emoji: parseEmoji(e.safira)!,
          style: ButtonStyle.Success,
          disabled: LottoManager.userInBet(user.id),
        }),
        new ButtonBuilder({
          label: t("lotto.check", locale),
          customId: JSON.stringify({ c: "lotto", src: "check", uid: user.id }),
          emoji: parseEmoji("🔎")!,
          style: ButtonStyle.Primary,
          disabled: !LottoManager.userInBet(user.id),
        }),
        new ButtonBuilder({
          label: reminderEnable ? t("lotto.reminder_enable", locale) : t("lotto.reminder", locale),
          customId: JSON.stringify({ c: "lotto", src: "reminder", uid: user.id }),
          emoji: parseEmoji(reminderEnable ? e.CheckV : e.Notification)!,
          style: ButtonStyle.Secondary,
          disabled: LottoManager.userInBet(user.id)
            ? LottoManager.usersWithReminderEnable.has(user.id)
            : true,
        }),
      ],
    }),
  );

  container.addTextDisplayComponents(
    new TextDisplayBuilder({ content: t("lotto.footer", locale) }),
  );

  const painelPayload: any = {
    flags: [MessageFlags.IsComponentsV2],
    components: [container],
  };

  if (msg) return await msg.edit(painelPayload).catch(() => { });
  return await channel?.send(painelPayload).catch(() => { });

}