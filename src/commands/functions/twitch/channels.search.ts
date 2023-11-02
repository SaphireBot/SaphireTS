import { ButtonStyle, PermissionsBitField, codeBlock, time, Message, LocaleString, GuildMember } from "discord.js";
import { e } from "../../../util/json.js";
import { TwitchLanguages } from "../../../util/constants.js";
import { env } from "process";
import { GetChannelFollowers, UserData } from "../../../@types/twitch.js";
import { t } from "../../../translator/index.js";

export default async (
    message: Message<true>,
    resource: {
        broadcaster_language: string
        broadcaster_login: string
        display_name: string
        game_id: string
        game_name: string
        id: string
        is_live: boolean
        tag_ids: string[]
        tags: string[]
        thumbnail_url: string
        title: string
        started_at: Date
    }[],
    locale: LocaleString,
    member: GuildMember
) => {

    if (!resource?.length)
        return await message.edit({ content: t("twitch.nothing_found", { e, locale }) }).catch(() => { });

    const streamers = await fetch(
        "https://twitch.discloud.app/fetch",
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                authorization: env.TWITCH_CLIENT_SECRET,
                url: `https://api.twitch.tv/helix/users?${resource.map(d => `login=${d.broadcaster_login}`).join("&")}`
            }
        }
    )
        .then(res => res.json())
        .catch(err => err) as UserData[] | Error | { message: string };

    if ("message" in streamers) return await message.edit({ content: t("twitch.timeout", { e, locale }) });
    if (streamers instanceof Error) return await message.edit({ content: t("twitch.error", { e, locale, err: streamers }) });

    const onlines = resource.filter(d => d.is_live);
    const offlines = resource.filter(d => !d.is_live);
    const data = [...onlines, ...offlines];

    const selectMenu = {
        type: 1,
        components: [{
            type: 3,
            custom_id: "streamer",
            placeholder: t("twitch.search.channels.components.selectMenu.placeholder", locale),
            options: [] as { label: string, emoji: string, description: string, value: string }[]
        }]
    };

    const hasPerm = member.permissions.has(PermissionsBitField.Flags.Administrator);
    const result = data.map((d, i) => {

        const streamer = streamers.find(str => str.id === d.id);
        if (!streamer) return;

        selectMenu.components[0].options.push({
            label: d.display_name,
            emoji: e.twitch,
            description: `${streamer?.description || ""}`.slice(0, 100),
            value: `${i}`
        });

        const partner = { affiliate: "\n" + t("twitch.affiliate", locale), partner: "\n" + t("twitch.partner", locale) }[streamer.broadcaster_type!] || "";
        const url = `https://www.twitch.tv/${d.broadcaster_login}`;
        const ms = new Date(streamer?.created_at)?.valueOf();
        const createdAt = `${time(new Date(ms), "d")} ${time(new Date(ms), "T")}`;

        return {
            content: null,
            streamerId: streamer.id,
            embeds: [{
                color: 0x9c44fb, // Twitch's Logo Purple
                title: t("twitch.search.channels.embeds.title", { e, locale }) + ` - ${i + 1}/${data.length}`,
                description: t("twitch.search.channels.embeds.description", {
                    locale,
                    d,
                    createdAt,
                    codeBlock: streamer.description ? codeBlock("txt", streamer.description) : ""
                }),
                fields: [{
                    name: t("twitch.search.channels.embeds.field_name", { e, locale }),
                    value: t("twitch.search.channels.embeds.field_value", {
                        e,
                        locale,
                        d,
                        partner,
                        language: TwitchLanguages[d.broadcaster_language as keyof typeof TwitchLanguages] || d.broadcaster_language || "??",
                        tags: d.tags?.join(", ") || "none",
                        live: d.is_live ? `\n🟢 [${t("twitch.live", locale)}](${url})` : `\n🔴 ${t("twitch.not_in_live", locale)}`
                    })
                }],
                thumbnail: {
                    url: d.thumbnail_url || null
                }
            }],
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            emoji: e.saphireLeft,
                            custom_id: "left",
                            style: ButtonStyle.Primary
                        },
                        {
                            type: 2,
                            label: t("twitch.search.channels.components.buttons.label_twitch_channel", locale),
                            emoji: e.SaphirePipoca,
                            url,
                            style: ButtonStyle.Link
                        },
                        {
                            type: 2,
                            label: t("twitch.search.channels.components.buttons.enable_notification", locale),
                            emoji: e.Notification,
                            custom_id: JSON.stringify({ c: "twitch", src: "active", streamer: d?.broadcaster_login }),
                            style: ButtonStyle.Success,
                            disabled: !hasPerm
                        },
                        {
                            type: 2,
                            emoji: e.saphireRight,
                            custom_id: "right",
                            style: ButtonStyle.Primary
                        },
                    ]
                }
            ]
        };
    });

    for (let i = 0; i < result.length; i++)
        result[i]?.components.unshift(selectMenu as any);

    if (result[0])
        result[0].embeds[0].fields[0].value = result[0]?.embeds[0].fields[0].value.replace(/FOLLOWERS/g, `${await getFollowers(result[0].streamerId)}`);

    await message.edit(result[0] as any);

    let index = 0;
    return message.createMessageComponentCollector({
        filter: int => int.user.id === member.id,
        idle: 1000 * 60 * 3
    })
        .on("collect", async (int): Promise<any> => {
            await int.deferUpdate();
            const { customId } = int;

            if (customId.includes("twitch")) return;

            if (customId === "streamer" && "values" in int) index = Number(int.values[0]);
            if (customId === "right") index = result[index + 1] ? index + 1 : 0;
            if (customId === "left") index = result[index - 1] ? index - 1 : result.length - 1;

            if (result[index] && result[index]?.embeds[0].fields[0].value.includes("FOLLOWERS")) {
                (result[index] as any).embeds[0].fields[0].value = result[index]?.embeds[0].fields[0].value.replace(/FOLLOWERS/g, `${await getFollowers(result[index]?.streamerId)}`);
            }

            return await message.edit(result[index] as any);
        })
        .on("end", async (): Promise<any> => await message.edit({ components: [] }).catch(() => { }));

    async function getFollowers(broadcaster_id: string | undefined): Promise<number> {
        if (!broadcaster_id) return 0;
        return await fetch(
            "https://twitch.discloud.app/fetch",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    authorization: env.TWITCH_CLIENT_SECRET,
                    url: `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcaster_id}`
                }
            }
        )
            .then(res => res.json())
            .then((data: GetChannelFollowers) => data.total || 0)
            .catch(() => 0) as number;
    }

};
