import { ButtonInteraction, ButtonStyle } from "discord.js";
import { e } from "../../../../util/json.js";
import { indexButton } from "../util.js";
import { t } from "../../../../translator/index.js";

export default async function click(
    interaction: ButtonInteraction<"cached">,
    customIdData: {
        id: string,
        e: string,
        mId: string,
        up: number,
        mp: number
    }
) {

    const { user, message, guild, userLocale: locale } = interaction;
    const { id, e: emoji, mId } = customIdData;

    const commandAuthor = message.interaction!.user;
    if (![commandAuthor.id, mId].includes(user.id)) return;

    const playNow = message.mentions.members.first()!;
    if (!playNow || playNow.user.id !== user.id) return;

    const member = guild.members.cache.get(mId)!;
    if (!member)
        return await interaction.update({
            content: `${e.Deny} | Jogo inválido. Oponente não encontrado.`,
            components: []
        });

    const components = message.components.map(components => components.toJSON());
    const allButtons = components.map(row => row.components).flat();
    const row = (components as any)[(indexButton as any)[id]];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const button = row.components.find(button => JSON.parse((button as any).custom_id).src?.id === id);

    button.disabled = true;
    button.emoji = emoji;
    button.style = ButtonStyle.Primary;

    const primaryButton = allButtons.filter(buttonData => (buttonData as any).style === ButtonStyle.Primary);
    const availableButtons = allButtons.filter(b => (b as any).style !== ButtonStyle.Success) as any;
    const isFirstPlay = primaryButton.length === 1;

    if (primaryButton?.length >= 3) return resetDefault();

    if (primaryButton.length === 2) {

        const emoji1 = (primaryButton as any)[0]?.emoji?.name || (primaryButton as any)[0]?.emoji;
        const emoji2 = (primaryButton as any)[1]?.emoji?.name || (primaryButton as any)[1]?.emoji;

        if (emoji1 === emoji2) {
            (primaryButton as any)[0].style = ButtonStyle.Success;
            (primaryButton as any)[1].style = ButtonStyle.Success;
            return await addPoint();
        }

        for (const b of availableButtons) b.disabled = true;
        edit({ componentsUpdate: true });
        return resetDefault(true);
    }

    return edit({});

    function resetDefault(arg?: any) {

        for (const button of availableButtons) {
            button.style = ButtonStyle.Secondary;
            button.emoji = "❔";
            button.disabled = false;
        }

        return arg ? setTimeout(() => edit({ replied: true }), 1700) : edit({});
    }

    async function edit({ isAccept, replied, componentsUpdate }: any) {

        const win = allButtons.every(b => (b as any).style === ButtonStyle.Success);

        if (componentsUpdate)
            return await interaction.update({ components }).catch(() => { });

        const data = {
            content: win
                ? getFinishResponse()
                : t("memory.versus.good_game_and_good_luck", {
                    e,
                    locale,
                    playerId: getMention(isAccept),
                    user: commandAuthor,
                    member: member.user,
                    userPoint: customIdData.up,
                    memberPoint: customIdData.mp
                }),
            components
        };
        
        return replied
            ? await interaction.editReply(data).catch(invalid)
            : await interaction.update(data).catch(invalid);
    }

    function getMention(isAccept?: boolean) {
        return isFirstPlay || isAccept
            ? playNow.id
            : playNow.id === commandAuthor.id ? mId : commandAuthor.id;
    }

    async function invalid(err: any) {
        await interaction.deferUpdate().catch(() => { });

        return await message.edit({
            content: t("memory.versus.error", { e, locale, err }),
            components: []
        }).catch(() => message.delete().catch(() => { }));
    }

    function addPoint() {

        for (const button of allButtons) {
            const customId = JSON.parse((button as any).custom_id);
            customId.src[commandAuthor.id === user.id ? "up" : "mp"]++;
            (button as any).custom_id = JSON.stringify(customId);
        }

        customIdData[commandAuthor.id === user.id ? "up" : "mp"]++;
        return edit({ isAccept: true });
    }

    function getFinishResponse() {

        if (customIdData.up === customIdData.mp)
            return t("memory.versus.draw", { e, locale, commandAuthor, member, customIdData });

        return t("memory.versus.win", {
            e,
            locale,
            winner: customIdData.up > customIdData.mp ? commandAuthor : member,
            loser: customIdData.up > customIdData.mp ? member : commandAuthor,
            customIdData
        });
    }

}