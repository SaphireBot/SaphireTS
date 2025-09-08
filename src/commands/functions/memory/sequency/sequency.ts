import { ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { t } from "../../../../translator";
import { e } from "../../../../util/json";
import generator from "./generator";
import restartButtons from "./restart";
import disableAllButtons from "./disableAllButtons";
import { ChannelsInGame } from "../../../../util/constants";

export default async function sequency(
    interaction: ButtonInteraction<"cached"> | ChatInputCommandInteraction<"cached">,
    numbers: number,
) {

    const { channelId, user, userLocale: locale } = interaction;

    if (ChannelsInGame.has(channelId)) {
        const content = t("memory.this_channel_is_in_game", { e, locale });
        return interaction.isChatInputCommand()
            ? await interaction.reply({ content, flags: [MessageFlags.Ephemeral] })
            : await interaction.update({ content, components: [] });
    }

    if (interaction.isChatInputCommand())
        numbers = interaction.options.getInteger("numbers") || 0;
    if (!numbers) numbers = 7;

    ChannelsInGame.add(channelId);
    const emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    const buttons = generator();
    const choosenButtons: string[] = [];
    let click = 0;

    function allButtons() {
        return [
            buttons[0].components[0],
            buttons[0].components[1],
            buttons[0].components[2],
            buttons[0].components[3],
            buttons[0].components[4],
            buttons[1].components[0],
            buttons[1].components[1],
            buttons[1].components[2],
            buttons[1].components[3],
            buttons[1].components[4],
            buttons[2].components[0],
            buttons[2].components[1],
            buttons[2].components[2],
            buttons[2].components[3],
            buttons[2].components[4],
            buttons[3].components[0],
            buttons[3].components[1],
            buttons[3].components[2],
            buttons[3].components[3],
            buttons[3].components[4],
            buttons[4].components[0],
            buttons[4].components[1],
            buttons[4].components[2],
            buttons[4].components[3],
            buttons[4].components[4],
        ];
    }

    const allButtonsCommand = allButtons();
    const randomButtons = allButtonsCommand.random(numbers);
    let i = 0;

    for (const button of randomButtons) {
        allButtonsCommand.find(b => b.custom_id === button.custom_id);
        button.emoji = emojis[i];
        choosenButtons.push(button.custom_id);
        i++;
    }

    const msg = await interaction.reply({
        content: t("memory.sequency.keep_calm_and_click", { e, locale }),
        components: buttons,
        fetchReply: true,
    });

    setTimeout(async () => await restartButtons(msg, allButtons(), buttons), 3500);

    const collector = msg.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        idle: 1000 * 30,
    });

    collector.on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

        const { customId } = int;

        if (customId !== choosenButtons[click]) {
            collector.stop();
            return await disableAllButtons(false, int, allButtons(), choosenButtons, emojis, msg, locale, buttons, numbers);
        }

        const buttonsSelected = allButtons();
        const button = buttonsSelected.find(btn => btn.custom_id === customId);
        button.style = ButtonStyle.Success;
        button.emoji = emojis[click];
        click++;

        if (click >= choosenButtons.length) {
            collector.stop();
            return await disableAllButtons(true, int, allButtons(), choosenButtons, emojis, msg, locale, buttons, numbers);
        }

        return await int.update({ components: buttons });
    });

    collector.on("end", async (_, reason: string): Promise<any> => {
        ChannelsInGame.delete(channelId);
        if (reason === "idle") return disableAllButtons(null, undefined, allButtons, choosenButtons, emojis, msg, locale, buttons, numbers);
        return;
    });

    return;
}