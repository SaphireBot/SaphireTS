import { Collection, GuildMember, User } from "discord.js";

export const users = new Collection<string, User>();
export const members = new Collection<string, GuildMember>();

export function filter(target: GuildMember | User | undefined | null, query?: any) {
    if (!target || !query) return false;

    if (
        target?.id === query
        || `<@${target?.id}>` === query
    ) return true;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const t = (query as string)
        ?.toLowerCase()
        ?.compare(
            [
                // member
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.displayName?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.user?.globalName?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.user?.username?.toLowerCase(),

                // user
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.global_name?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.globalName?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.username?.toLowerCase(),

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                target?.tag?.toLowerCase()
            ]
                .filter(Boolean) as string[]
        );

    return t ? true : false;
}