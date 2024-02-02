import { ButtonInteraction, ButtonStyle } from "discord.js";
import { e } from "../../../../util/json";
import { MemoryCustomIdData, indexButton } from "../util";
import { t } from "../../../../translator";

export default async (
    interaction: ButtonInteraction<"cached">,
    customIdData: MemoryCustomIdData
) => {

    const { user, message, userLocale: locale } = interaction;
    const { id, e: emoji, mId } = customIdData;
    const commandAuthor = message.interaction!.user;

    if (![commandAuthor.id, mId].includes(user.id)) return;

    const playNow = message.mentions.members.first()!;
    if (!playNow || playNow.user.id !== user.id) return;

    const components = message.components.map(components => components.toJSON());
    const allButtons = components.map(row => row.components).flat();
    const row = components[indexButton[id]];
    const button = row.components.find(button => JSON.parse((button as any).custom_id).src.id === id) as any;

    button.disabled = true;
    button.emoji = emoji;
    button.style = ButtonStyle.Primary;

    const primaryButton = allButtons.filter(buttonData => (buttonData as any).style === ButtonStyle.Primary);
    const availableButtons = allButtons.filter(b => (b as any).style !== ButtonStyle.Success) as any;

    if (primaryButton?.length >= 3) {
        for (const button of availableButtons) {
            button.style = ButtonStyle.Secondary;
            button.emoji = "❔";
            button.disabled = false;
        }
        return edit();
    }

    if (primaryButton.length === 2) {

        // emoji: "😎"
        // emoji: { name: "😎" }

        const emoji1 = (primaryButton as any)[0]?.emoji?.name || (primaryButton as any)[0]?.emoji;
        const emoji2 = (primaryButton as any)[1]?.emoji?.name || (primaryButton as any)[1]?.emoji;

        if (emoji1 === emoji2) {
            (primaryButton as any)[0].style = ButtonStyle.Success;
            (primaryButton as any)[1].style = ButtonStyle.Success;
        } else {
            for (const b of availableButtons) b.disabled = true;
            setTimeout(() => {
                for (const button of availableButtons) {
                    button.style = ButtonStyle.Secondary;
                    button.emoji = "❔";
                    button.disabled = false;
                }
                return edit();
            }, 1700);
        }
    }

    return edit(allButtons.every(b => (b as any).style === ButtonStyle.Success));

    async function edit(win?: boolean) {

        const data = {
            content: win
                ? t("memory.cooperative.congratulations", {
                    e,
                    locale,
                    commandAuthorId: commandAuthor.id,
                    mId
                })
                : t("memory.cooperative.good_game_and_good_luck", {
                    e,
                    locale,
                    player: playNow.id === commandAuthor.id ? mId : commandAuthor.id
                }),
            components
        };

        return interaction.replied
            ? await interaction.editReply(data).catch(invalid)
            : await interaction.update(data).catch(invalid);

    }

    async function invalid() {
        await interaction.deferUpdate().catch(() => { });

        return await message.edit({
            content: t("memory.cooperative.lose", { e, locale }),
            components: components
        }).catch(() => message.delete().catch(() => { }));
    }

};