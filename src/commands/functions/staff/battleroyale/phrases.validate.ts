import {
  APIEmbed,
  ButtonInteraction,
  ButtonStyle,
  Colors,
  ComponentType,
  InteractionCollector,
  Message,
  MessageFlags,
  ModalSubmitInteraction,
  parseEmoji,
  StringSelectMenuInteraction,
  User,
} from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { BattleroyalePhrasesManager, GlobalStaffManager } from "../../../../managers";
import client from "../../../../saphire";
import { BattleroyalePhraseSchemaType } from "../../../../database/schemas/battleroyale";
import handler from "../../../../structures/commands/handler";
import AllModals from "../../../../structures/modals/index";

export const validatePhrasesCollectorss = new Map<string, InteractionCollector<ButtonInteraction<"cached">>>();

export default async function validatePhrases(
  interaction: StringSelectMenuInteraction<"cached"> | ModalSubmitInteraction<"cached"> | ButtonInteraction<"cached">,
  customData: { c?: "staff", src?: "battleroyale", uid: string },
) {

  const { userLocale: locale, user, message, channel } = interaction;

  if (user.id !== customData.uid)
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t("tempcall.you_cannot_click_here", { e, locale }),
    });

  if (!GlobalStaffManager.isAdmin(user.id))
    return await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content: t("staff.perms.admin", { e, locale }),
      embeds: [], components: [],
    });
  //68d98a85a335561e8927a935
  if (
    interaction instanceof StringSelectMenuInteraction
    || interaction instanceof ButtonInteraction
  )
    await interaction!.update({
      content: `${e.Animated.SaphireReading} | Okay, okay...`,
      embeds: [], components: [],
    }).catch(() => { });

  const phrases = await BattleroyalePhrasesManager.fetchAllUnapprovedPhrases();
  let phrase: BattleroyalePhraseSchemaType | null = phrases[0]!;
  await sleep(1500);

  if (!phrases.length || !phrase)
    return await message?.edit({
      content: t("staff.battleroyale.no_phrases", { e, locale }),
      embeds: [], components: [],
    });

  const sender = await client.users.fetch(phrase.user);
  if (!sender) {
    await BattleroyalePhrasesManager.removePhrase(phrase._id);
    await message?.delete().catch(() => { });
    return;
  }

  const components = [
    {
      type: 1,
      components: [
        {
          type: 2,
          label: t("staff.battleroyale.review", locale),
          custom_id: "review",
          style: ButtonStyle.Success,
          emoji: parseEmoji("✍️"),
        },
        {
          type: 2,
          label: t("staff.battleroyale.count_kill", locale),
          custom_id: "set_kill",
          style: ButtonStyle.Primary,
          emoji: parseEmoji("💀"),
        },
        {
          type: 2,
          label: t("keyword_refuse", locale),
          custom_id: "refuse",
          style: ButtonStyle.Danger,
          emoji: parseEmoji(e.Trash),
        },
        {
          type: 2,
          label: t("staff.methods.suspend_user", locale),
          custom_id: "suspend",
          style: ButtonStyle.Primary,
          emoji: parseEmoji(e.ModShield),
          disabled: true,
        },
      ],
    },
  ].asMessageComponents();

  if (!(interaction instanceof ModalSubmitInteraction))
    await message!.edit({
      content: t("staff.battleroyale.loading_phrases", { e, locale, phrases: phrases.length }),
      embeds: [],
      components: [],
    });

  await sleep(2000);
  if (!phrases.length) return await message?.delete().catch(() => { });

  const msg = await editMsg(undefined);
  if (!msg) return await message?.delete().catch(() => { });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: int => int.user.id === user.id,
    idle: 1000 * 60 * 5,
  });

  validatePhrasesCollectorss.set(user.id, collector);

  collector.on("collect", async int => {
    const { customId } = int as ButtonInteraction;
    if (!phrase) return;

    if (customId === "refuse") {
      await BattleroyalePhrasesManager.removePhrase(phrase._id);
      collector.stop("ignore");
      validatePhrasesCollectorss.delete(user.id);
      return await validatePhrases(int, { uid: user.id });
    }

    if (customId === "set_kill") {
      phrase = await BattleroyalePhrasesManager.updateKill(phrase._id, phrase.kill || false);
      if (!phrase) return collector.stop();
      const sender = await client.users.fetch(phrase?.user);
      const embed = getEmbed(phrase, sender);

      return await int.update({ embeds: [embed] });
    }

    if (customId === "review")
      return await int.showModal(
        AllModals.reviewPhraseToBattlaroyale(locale, phrase._id, phrase.phrase),
      );

  })
    .on("end", async (_, reason) => {

      if (["fromModal", "ignore"].includes(reason)) return;

      validatePhrasesCollectorss.delete(user.id);
      await msg?.delete().catch(() => { });
      await sleep(1500);
      await handler.getPrefixCommand("admin")?.execute(interaction!.message as any, [])?.catch(() => { });
      return;
    });

  async function editMsg(
    msg: Message<true> | ButtonInteraction<"cached"> | undefined,
    collector?: InteractionCollector<any>,
  ):
    Promise<
      Message<true>
      | void | undefined | null
    > {

    if (collector && !phrases.length) {
      if (msg instanceof Message)
        await msg?.delete().catch(() => { });
      await sleep(1500);
      await handler.getPrefixCommand("admin")?.execute(interaction.message as any, [])?.catch(() => { });
      return;
    }

    const payload = {
      content: t("staff.battleroyale.phrases_to_approve", { e, locale, phrases: phrases.length }),
      embeds: [getEmbed(phrase, sender)],
      components,
    };

    if (msg instanceof ButtonInteraction)
      return await msg.update({
        ...payload,
        withResponse: true,
      })
        .then(res => res.resource?.message)
        .catch(() => { });

    return await (msg || message!).edit(payload)
      .catch(async () => await channel?.send(payload).catch(() => { }));
  }

  function getEmbed(data: BattleroyalePhraseSchemaType | null, user: User | undefined): APIEmbed {
    if (!data) return { description: "???" };
    const hasKill = data.kill
      ? "description_kill"
      : "description_no_kill";
    return {
      color: Colors.Blue,
      title: t("staff.battleroyale.embed.title", { e, locale }),
      description: t(`staff.battleroyale.embed.${hasKill}`, {
        locale,
        e,
        user: user || "NOT FOUND",
        phrase: data.phrase,
      }),
      footer: { text: data._id.toString() },
    };
  }

  return;
}