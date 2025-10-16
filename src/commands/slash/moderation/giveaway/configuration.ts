import {
  APIEmbed,
  ButtonInteraction,
  CategoryChannel,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  Collection,
  Colors,
  ForumChannel,
  InteractionCollector,
  MentionableSelectMenuInteraction,
  Message,
  MessageCollector,
  MessageFlags,
  ModalSubmitInteraction,
  NewsChannel,
  PrivateThreadChannel,
  PublicThreadChannel,
  RoleSelectMenuInteraction,
  StageChannel,
  StringSelectMenuInteraction,
  TextChannel,
  User,
  UserSelectMenuInteraction,
  VoiceChannel,
} from "discord.js";
import { GiveawayCollectorData } from "../../../../@types/commands";
import { LocaleString } from "../../../../util/constants";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import giveawayComponents from "./components";
import register from "./register";
import { GiveawayType } from "../../../../@types/models";
import Modals from "../../../../structures/modals";
import { isDiscordId } from "../../../../util/validators";
import client from "../../../../saphire";

export default class ConfigurationGiveaway {

  declare interaction: ChatInputCommandInteraction<"cached">;
  declare configurationMessage: Message<true>;
  declare giveawayMessage: Message<true>;
  declare embed: APIEmbed;
  declare collectorData: GiveawayCollectorData;
  declare channel: CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null | undefined;
  declare GiveawayResetedData?: GiveawayType;
  declare color: number | undefined;
  declare user: User;
  declare locale: LocaleString;
  declare collector: InteractionCollector<
    ButtonInteraction<"cached">
    | StringSelectMenuInteraction<"cached">
    | UserSelectMenuInteraction<"cached">
    | RoleSelectMenuInteraction<"cached">
    | MentionableSelectMenuInteraction<"cached">
    | ChannelSelectMenuInteraction<"cached">
  >;

  constructor(
    interaction: ChatInputCommandInteraction<"cached">,
    configurationMessage: Message<true>,
    giveawayMessage: Message<true>,
    embed: APIEmbed,
    collectorData: GiveawayCollectorData,
    channel: CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null | undefined,
    GiveawayResetedData?: GiveawayType | undefined,
    color?: number | undefined,
  ) {
    this.interaction = interaction;
    this.configurationMessage = configurationMessage;
    this.giveawayMessage = giveawayMessage;
    this.embed = embed;
    this.collectorData = collectorData;
    this.channel = channel;
    this.GiveawayResetedData = GiveawayResetedData;
    this.color = color;
    this.user = interaction.user;
    this.locale = interaction.userLocale;
  }

  async init() {
    await this.editContent();
    this.initCollector();
  }

  get components() {
    return giveawayComponents(
      this.locale,
      this.collectorData.reaction,
      {
        switchRoles: this.collectorData.RequiredAllRoles ? "giveaway.components.switchRoles" : "giveaway.just_one_role_without_emoji",
        switchRolesDescription: this.collectorData.RequiredAllRoles ? "giveaway.all_roles_description" : "giveaway.just_one_role_description",
        multipleJoins: this.collectorData.MultJoinsRoles.size > 0,
        hasGuildRequired: this.collectorData.GuildRequired?.name,
        allowedRoles: this.collectorData.AllowedRoles?.length > 0,
      },
    );
  }

  async editContent(
    interactionToUpdate?: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached"> | ModalSubmitInteraction<"cached">,
    botRole?: boolean,
    memberBot?: boolean | "UserAlreadySelected",
    extra?: boolean | "RoleAlreadySelected" | "UserAlreadySelected",
    addRolesInvalid?: boolean,
  ) {

    this.embed.description = t("giveaway.choose_users_roles_send_or_cancel", this.locale);
    if (!this.embed.fields?.length) this.embed.fields = [];

    this.embed.fields[0].value = t("giveaway.emoji_saved", { e, locale: this.locale });

    this.embed.fields[1] = {
      name: this.collectorData.RequiredAllRoles ? t("giveaway.require_roles", this.locale) : t("giveaway.only_one_roles", this.locale),
      value: this.collectorData.AllowedRoles.length > 0 || botRole || extra
        ? `${this.collectorData.AllowedRoles.map(roleId => `<@&${roleId}>`).join(", ") || t("giveaway.no_role_selected_n", this.locale)}` + `${botRole ? t("giveaway.bot_role_selected", { e, locale: this.locale }) : ""}` + `${extra === "RoleAlreadySelected" ? t("giveaway.same_role_in_two_fields", { e, locale: this.locale }) : ""}`
        : t("giveaway.no_role_selected", this.locale),
    };

    this.embed.fields[2] = {
      name: t("giveaway.locked_roles", this.locale),
      value: this.collectorData.LockedRoles.length > 0 || botRole || extra
        ? `${this.collectorData.LockedRoles.map(roleId => `<@&${roleId}>`).join(", ") || t("giveaway.get_away_with_roles", this.locale)}` + `${botRole ? t("giveaway.bot_role_selected", { e, locale: this.locale }) : ""}` + `${extra === "RoleAlreadySelected" ? t("giveaway.same_role_in_two_fields", { e, locale: this.locale }) : ""}`
        : t("giveaway.get_away_with_roles", this.locale),
    };

    this.embed.fields[3] = {
      name: t("giveaway.allowed_members", this.locale),
      value: this.collectorData.AllowedMembers.length > 0 || memberBot || extra
        ? `${this.collectorData.AllowedMembers.map(userId => `<@${userId}>`).join(", ") || t("giveaway.only_these_members", this.locale)}` + `${memberBot ? t("giveaway.a_bot_was_selected", { e, locale: this.locale }) : ""}` + `${memberBot === "UserAlreadySelected" ? t("same_user_in_two_fields", this.locale) : ""}`
        : t("giveaway.only_these_members", this.locale),
    };

    this.embed.fields[4] = {
      name: t("giveaway.users_locked_name", this.locale),
      value: this.collectorData.LockedMembers.length > 0 || memberBot || extra
        ? `${this.collectorData.LockedMembers.map(userId => `<@${userId}>`).join(", ") || t("giveaway.users_locked", this.locale)}` + `${memberBot ? t("giveaway.a_bot_was_selected", { e, locale: this.locale }) : ""}` + `${memberBot === "UserAlreadySelected" ? t("same_user_in_two_fields", this.locale) : ""}`
        : t("giveaway.users_locked", this.locale),
    };

    this.embed.fields[5] = {
      name: t("giveaway.role_to_winners", this.locale),
      value: addRolesInvalid
        ? t("giveaway.no_permissions_to_manager_a_role", this.locale)
        : this.collectorData.AddRoles.length > 0
          ? `${this.collectorData.AddRoles.map(roleId => `<@&${roleId}>`).join(", ") || t("giveaway.no_role_setted", this.locale)}`
          : t("giveaway.roles_to_setted_to_winners", this.locale),
    };

    this.embed.fields[6] = {
      name: t("giveaway.multiple_entrance", this.locale),
      value: this.collectorData.MultJoinsRoles.size > 0
        ? `${Array.from(this.collectorData.MultJoinsRoles.values()).map(role => `**${role.joins || 1}x** <@&${role.role.id}>`).join("\n") || t("giveaway.no_role_setted", this.locale)}`
        : t("giveaway.roles_with_entrances", this.locale),
    };

    this.embed.fields[7] = {
      name: t("giveaway.guild_required", this.locale),
      value: this.collectorData.GuildRequired?.id
        ? `[${this.collectorData.GuildRequired.name}](${this.collectorData.GuildRequired.invite}) \`${this.collectorData.GuildRequired.id}\``
        : t("giveaway.guild_required_description", this.locale),
    };

    const payload = {
      content: null,
      embeds: [this.embed],
      components: this.components,
    };

    try {

      if (interactionToUpdate instanceof ModalSubmitInteraction) {
        if (interactionToUpdate.deferred)
          return await interactionToUpdate?.editReply(payload);
        else return await this.configurationMessage.edit(payload);
      }

      if (interactionToUpdate)
        return await interactionToUpdate.update(payload);
      else return await this.configurationMessage.edit(payload);
    } catch (err) {
      console.log(err);
      return await this.interaction.channel?.send({ content: t("giveaway.error_to_edit_principal_message", { e, locale: this.locale, err }) });
    }
  }

  initCollector() {
    this.collector = this.configurationMessage.createMessageComponentCollector({
      filter: int => int.user.id === this.user.id,
      idle: 1000 * 60 * 5,
    })
      .on("collect", async (int) => this.collectInteraction(int))
      .on("end", (_, reason) => this.cancel(reason));
  }

  async collectInteraction(int: ButtonInteraction<"cached"> | StringSelectMenuInteraction<"cached"> | UserSelectMenuInteraction<"cached"> | RoleSelectMenuInteraction<"cached"> | MentionableSelectMenuInteraction<"cached"> | ChannelSelectMenuInteraction<"cached">) {

    let customId: string = "";

    if (int instanceof ButtonInteraction)
      customId = int.customId;

    if (int instanceof StringSelectMenuInteraction)
      customId = int.values[0];

    if (!customId) return await this.cancel("No CustomID Available");

    if (customId === "lauch")
      return await this.lauch(int as ButtonInteraction<"cached">);

    if (customId === "cancel") {
      this.collector.stop();
      this.giveawayMessage.delete().catch(() => { });
      await sleep(1500);
      return await int.message.delete().catch(() => { });
    }

    if (customId === "switchRoles") {
      this.collectorData.RequiredAllRoles = !(this.collectorData.RequiredAllRoles || false);
      return await this.editContent(int as StringSelectMenuInteraction<"cached">);
    }

    if (customId === "roles")
      return await this.rolesModal(int as StringSelectMenuInteraction<"cached">);

    if (customId === "DefineJoins")
      return await this.defineJoinsModal(int as ButtonInteraction<"cached">);

    if (customId === "users")
      return await this.usersModal(int as StringSelectMenuInteraction<"cached">);

    if (customId === "guild")
      return await this.setRequiredGuild(int as StringSelectMenuInteraction<"cached">);
  }

  async usersModal(int: StringSelectMenuInteraction<"cached">) {
    await int.showModal(
      Modals.giveaway.users(
        this.locale,
        {
          AllowedMembers: this.collectorData.AllowedMembers.map(id => ({ id, type: "user" })),
          LockedMembers: this.collectorData.LockedMembers.map(id => ({ id, type: "user" })),
        },
      ) as any,
    );
    return await this.awaitUsersModalSubmit(int as StringSelectMenuInteraction<"cached">);
  }

  async awaitUsersModalSubmit(int: StringSelectMenuInteraction<"cached">) {
    const modalSubmit = await int.awaitModalSubmit({
      filter: i => i.user.id === this.user.id,
      time: 1000 * 60 * 5,
    });

    const { fields } = modalSubmit;

    if (!this.collectorData.AllowedMembers) this.collectorData.AllowedMembers = [];
    if (!this.collectorData.LockedMembers) this.collectorData.LockedMembers = [];

    const allowedUsers = fields.getSelectedUsers("allowedUsers");
    const lockedUsers = fields.getSelectedUsers("lockedUsers");

    if (
      allowedUsers?.some((user) => user?.bot)
      || lockedUsers?.some((user) => user?.bot)
    )
      return await this.editContent(modalSubmit, false, true);

    if (
      allowedUsers?.some((_, userId) => this.collectorData.LockedMembers.includes(userId))
      || lockedUsers?.some((_, userId) => this.collectorData.AllowedMembers.includes(userId))
    ) return await this.editContent(modalSubmit, false, "UserAlreadySelected");

    for (const userId of (allowedUsers?.keys() || []))
      if (!this.collectorData.AllowedMembers.includes(userId))
        this.collectorData.AllowedMembers.push(userId);

    for (const userId of (lockedUsers?.keys() || []))
      if (!this.collectorData.LockedMembers.includes(userId))
        this.collectorData.LockedMembers.push(userId);

    await modalSubmit.deferUpdate();
    await sleep(1000);
    return await this.editContent(modalSubmit);
  }

  async rolesModal(int: StringSelectMenuInteraction<"cached">) {
    await int.showModal(
      Modals.giveaway.roles(
        this.locale,
        {
          AllowedRoles: this.collectorData.AllowedRoles.map(id => ({ id, type: "role" })),
          LockedRoles: this.collectorData.LockedRoles.map(id => ({ id, type: "role" })),
          AddRoles: this.collectorData.AddRoles.map(id => ({ id, type: "role" })),
          MultJoinsRoles: this.collectorData.MultJoinsRoles.keys().toArray().map(id => ({ id, type: "role" })),
        },
      ) as any,
    );
    return await this.awaitRolesModalSubmit(int as StringSelectMenuInteraction<"cached">);
  }

  async awaitRolesModalSubmit(int: StringSelectMenuInteraction<"cached">) {
    const modalSubmit = await int.awaitModalSubmit({
      filter: i => i.user.id === this.user.id,
      time: 1000 * 60 * 5,
    });

    const { fields } = modalSubmit;

    const allowedRoles = fields.getSelectedRoles("allowedRoles");
    const lockedRoles = fields.getSelectedRoles("lockedRoles");
    const addRoles = fields.getSelectedRoles("addRoles");
    const multiplesRoles = fields.getSelectedRoles("multiplesRoles");

    this.collectorData.AllowedRoles = allowedRoles?.keys().toArray() || [];
    this.collectorData.LockedRoles = lockedRoles?.keys().toArray() || [];
    this.collectorData.AddRoles = addRoles?.keys().toArray() || [];

    if (multiplesRoles instanceof Collection) {

      if (!(this.collectorData.MultJoinsRoles instanceof Map))
        this.collectorData.MultJoinsRoles = new Map();

      for (const role of multiplesRoles.values())
        if (!this.collectorData.MultJoinsRoles.has(role.id))
          this.collectorData.MultJoinsRoles.set(role.id, { joins: 1, role });

      for (const roleId of this.collectorData.MultJoinsRoles.keys())
        if (!multiplesRoles.has(roleId))
          this.collectorData.MultJoinsRoles.delete(roleId);

    }

    await modalSubmit.deferUpdate();
    await sleep(1000);
    return await this.editContent(modalSubmit);
  }

  async defineJoinsModal(int: ButtonInteraction<"cached">) {
    const roles = Array.from(this.collectorData.MultJoinsRoles.values());

    if (!this.collectorData.MultJoinsRoles.size)
      return await int.reply({
        content: t("giveaway.no_roles_setted", { e, locale: this.locale }),
        flags: [MessageFlags.Ephemeral],
      });

    await int.showModal(Modals.giveawayDefineMultJoins(roles));
    return await this.awaitDefineJoinsModalSubmit(int);
  }

  async awaitDefineJoinsModalSubmit(int: ButtonInteraction<"cached">) {
    const modalSubmit = await int.awaitModalSubmit({
      filter: i => i.user.id === this.user.id,
      time: 1000 * 60 * 5,
    });

    const { fields } = modalSubmit;

    let warnOverLimit = false;
    for (const [roleId, r] of this.collectorData.MultJoinsRoles.entries()) {
      const value = Number(fields.getTextInputValue(roleId));
      if (isNaN(value) || value < 1 || value > 100) {
        warnOverLimit = true;
        continue;
      }

      r.joins = value;
      this.collectorData.MultJoinsRoles.set(roleId, r);
    }

    await modalSubmit.deferUpdate();
    await sleep(500);
    await this.editContent(modalSubmit);

    if (warnOverLimit)
      await this.interaction.followUp({ content: t("giveaway.modal_values_limits", { e, locale: this.locale }), flags: [MessageFlags.Ephemeral] });

    return;
    // return await modalSubmit.editReply({ content: null, embeds: [this.embed] });

  }

  async lauch(interaction: ButtonInteraction<"cached">) {
    this.collector.stop();
    await interaction.update({ content: t("giveaway.loading_new_giveaway", { e, locale: this.locale }), embeds: [], components: [] });
    return await register(
      this.interaction,
      this.configurationMessage,
      this.giveawayMessage,
      this.collectorData,
      this.channel,
      this.color,
      this.GiveawayResetedData,
    );
  }

  async setRequiredGuild(int?: StringSelectMenuInteraction<"cached">) {

    if (this.collectorData.GuildRequired?.id) {
      delete this.collectorData.GuildRequired;
      return await this.editContent(int);
    }

    let message = await int?.reply({
      content: t("giveaway.send_guild_id", { e, locale: this.locale }),
      withResponse: true,
    })
      .then(res => res.resource?.message)
      .catch(() => { });

    if (!int)
      message = await this.interaction.channel?.send({ content: t("giveaway.send_guild_id", { e, locale: this.locale }) })
        .catch(() => { });

    const messageCollector = message?.channel.createMessageCollector({
      filter: m => m.author.id === this.user.id,
      idle: (1000 * 60) * 2,
    });

    if (!messageCollector) return message?.delete()?.catch(() => { });

    messageCollector.on("collect", async msg => this.messageCollectorCollect(msg, messageCollector, message));

    messageCollector.on("end", async (_, reason: string) => {

      if (reason === "ignore") return;

      message?.delete()?.catch(() => { });
    });

    return;

  }

  async messageCollectorCollect(
    msg: Message<boolean>,
    messageCollector: MessageCollector,
    message: Message<true> | void | null | undefined,
  ) {

    const guildId = msg.content;
    if (!guildId?.length) return;

    if (guildId === "cancel")
      return messageCollector.stop();

    if (!isDiscordId(guildId))
      return await msg.react(e.DenyX).catch(() => { });

    const guild = await client.guilds.fetch(guildId).catch(() => { });
    if (!guild) return await msg.react(e.DenyX).catch(() => { });
    await msg.react(e.CheckV).catch(() => { });
    messageCollector.stop("ignore");

    await message?.edit({
      content: t("giveaway.invite_url", { e, locale: this.locale }),
    });
    await sleep(1500);
    await guild.fetch().catch(() => { });

    if (!this.collectorData.GuildRequired) this.collectorData.GuildRequired = {} as any;

    this.collectorData.GuildRequired!.id = guild.id;
    this.collectorData.GuildRequired!.name = guild.name;

    const channel = guild.channels?.cache.find(ch => ch.permissionsFor(ch.guild.members.me!, true));

    if (channel) {
      const invite = await guild.invites.create(channel.id).catch(() => { });

      if (invite) {
        this.collectorData.GuildRequired!.invite = invite.url;
        message?.delete().catch(() => { });
        await sleep(500);
        return this.editContent();
      }
    }

    if (!channel || !this.collectorData.GuildRequired?.invite) {
      await message?.edit({
        content: t("giveaway.cannot_create_an_invite", { e, locale: this.locale }),
      });
      await sleep(2000);

      const invites = await guild.invites.fetch().catch(() => { });

      if (invites) {
        const invite = invites.find(invite => !invite.temporary);
        if (invite) {
          this.collectorData.GuildRequired!.invite = invite.url;
          message?.delete().catch(() => { });
          await sleep(500);
          return this.editContent();
        }
      }

    }

    await message?.delete().catch(() => { });

    await msg.reply({
      content: t("giveaway.cannot_get_an_invite", { e, locale: this.locale }),
    }).catch(() => { });

    await sleep(1000);

    delete this.collectorData.GuildRequired;
    return await this.setRequiredGuild();

  }

  async cancel(reason: string) {
    if (["user"].includes(reason)) return;

    this.giveawayMessage.delete();
    if (reason === "messageDelete") {
      return await this.interaction.channel?.send({
        content: t("giveaway.message_deleted_into_configuration", { e, locale: this.locale }),
        components: [],
      });
    }

    if (["time", "limit", "idle"].includes(reason)) {
      this.embed.color = Colors.Red;
      if (this.embed.fields)
        this.embed.fields.push({
          name: t("giveaway.eternity", this.locale),
          value: t("giveaway.rest_in_peace", { e, locale: this.locale }),
        });
      this.embed.footer = { text: t("giveaway.expired", this.locale) };
      return await this.configurationMessage.edit({ content: null, embeds: [this.embed], components: [] });

    }
  }

}