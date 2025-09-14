import { ButtonInteraction } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { randomBytes } from "crypto";
import { LottoManager, ReminderManager } from "../../../managers";
import lottoPainel from "./painel.container";

export default async function notifyLotto(interaction: ButtonInteraction<"cached">) {

  const { channelId, guildId, user } = interaction;

  if (!LottoManager.usersWithReminderEnable.has(user.id)) {

    // ???????????????????????????????? WTF ??????????????
    const data: any = {
      id: randomBytes(10).toString("base64url"),
      alerted: false,
      channelId,
      createdAt: new Date(),
      guildId,
      interval: 0,
      isAutomatic: true,
      message: "lotto.reminder_draw",
      lauchAt: LottoManager.nextDraw,
      sendToDM: false,
      userId: user.id,
    };

    await ReminderManager.new(data);
    await ReminderManager.save(data);
    await LottoManager.enableReminder(user.id);

  }

  return await lottoPainel(interaction);
}