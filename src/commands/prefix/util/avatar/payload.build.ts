import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, Colors, ContainerBuilder, GuildMember, MediaGalleryBuilder, MediaGalleryItemBuilder, parseEmoji, StringSelectMenuBuilder, TextDisplayBuilder, User, UserSelectMenuBuilder } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import { urls } from "../../../../util/constants";

export default async function payloadAvatarBuild(
  users: Collection<string, User>,
  members: Collection<string, GuildMember>,
  guildId: string | undefined,
  locale: string,
  userId: string,
) {

  const containers = new Collection<string, ContainerBuilder>();

  for await (let user of users.values()) {

    const container = new ContainerBuilder({ accent_color: Colors.Blue });
    let member = members.get(user.id);

    if (!user.banner || user.partial) user = await user.fetch();
    if (member?.partial) member = await member.fetch();

    const userDefaultAvatarURL = user.defaultAvatarURL;
    const userAvatarURL = user.avatarURL(); // `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar?.includes("a_") ? "gif" : "png"}?size=2048`;
    const memberAvatarURL = member?.avatarURL(); // `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${member.avatar}.${member.avatar?.includes("a_") ? "gif" : "png"}?size=2048`;
    const memberBannerURL = member?.bannerURL(); // `https://cdn.discordapp.com/guilds/${guildId}/users/${user.id}/avatars/${member.avatar}.${member.avatar?.includes("a_") ? "gif" : "png"}?size=2048`;
    const userBannerURL = user.bannerURL(); // `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${user.banner?.includes("a_") ? "gif" : "png"}?size=2048`;

    container.addTextDisplayComponents(
      new TextDisplayBuilder({
        content: `## ${t("avatar.user_images", { locale, user: user.toString() })}`,
      }),
    );

    const gallery = new MediaGalleryBuilder({});

    if (memberBannerURL)
      gallery.addItems(
        new MediaGalleryItemBuilder({
          description: `${user.username}'s Member Banner`,
          media: { url: memberBannerURL },
        }),
      );

    if (userBannerURL)
      gallery.addItems(
        new MediaGalleryItemBuilder({
          description: `${user.username}'s Banner`,
          media: { url: userBannerURL },
        }),
      );

    if (typeof userAvatarURL === "string")
      gallery.addItems(
        new MediaGalleryItemBuilder({
          description: `${user.username}'s Avatar`,
          media: { url: `${userAvatarURL}`, placeholder: `${user.username}'s Avatar` },
        }),
      );

    if (typeof memberAvatarURL === "string") {
      const desc = `${(member as GuildMember)?.displayName ? `${(member as GuildMember)?.displayName}'s Guild Avatar` : null}`;
      gallery.addItems(
        new MediaGalleryItemBuilder({
          description: desc,
          media: { url: `${memberAvatarURL}`, placeholder: desc },
        }),
      );
    }

    if (userDefaultAvatarURL)
      gallery.addItems(
        new MediaGalleryItemBuilder({
          description: `${user.username}'s Default Avatar`,
          media: { url: userDefaultAvatarURL },
        }),
      );

    container.addMediaGalleryComponents(gallery);

    container.addActionRowComponents(
      new ActionRowBuilder<UserSelectMenuBuilder>({
        components: [
          new UserSelectMenuBuilder({
            custom_id: JSON.stringify({ c: "avatar", uid: userId, src: "search" }),
            // max_values: 1,
            // min_values: 1,
            placeholder: t("avatar.search_user", locale),
          })
            .setDefaultUsers(user.id),
        ],
      }),
    );

    containers.set(user.id, container);
  }

  const containerNoImage = new ContainerBuilder({ accent_color: Colors.Blue });

  const noImage = new MediaGalleryBuilder({});
  noImage.addItems(
    new MediaGalleryItemBuilder({
      description: "No Imagem",
      media: { url: `${urls.not_found_image}`, placeholder: "No Image" },
    }),
  );

  const stringSelectMenu = new ActionRowBuilder<StringSelectMenuBuilder>({
    components: [
      new StringSelectMenuBuilder({
        custom_id: JSON.stringify({ c: "avatar", uid: userId, src: "found" }),
        // max_values: 1,
        // min_values: 1,
        placeholder: t("avatar.users_found", locale),
        options: users
          .values()
          .toArray()
          .map(user => ({
            label: user.displayName,
            value: user.id,
            emoji: "👤",
          }))
          .slice(0, 25),
      }),
    ],
  });

  containerNoImage.addActionRowComponents(
    new ActionRowBuilder<UserSelectMenuBuilder>({
      components: [
        new UserSelectMenuBuilder({
          custom_id: JSON.stringify({ c: "avatar", uid: userId, src: "search" }),
          // max_values: 1,
          // min_values: 1,
          placeholder: t("avatar.search_user", locale),
        }),
      ],
    }),
  );

  if (users.size > 1) {
    const buttons = new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          custom_id: "zero",
          emoji: parseEmoji("⏮️")!,
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          custom_id: "left",
          emoji: parseEmoji("◀️")!,
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          custom_id: "right",
          emoji: parseEmoji("▶️")!,
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          custom_id: "last",
          emoji: parseEmoji("⏭️")!,
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          custom_id: "delete",
          emoji: parseEmoji(e.Trash)!,
          style: ButtonStyle.Danger,
        }),
      ],
    });

    containerNoImage.addActionRowComponents(stringSelectMenu);
    containerNoImage.addActionRowComponents(buttons);

    for (const container of containers.values()) {
      container.addActionRowComponents(stringSelectMenu);
      container.addActionRowComponents(buttons);
    }
  }

  containers.set("no", containerNoImage);
  return containers;
}