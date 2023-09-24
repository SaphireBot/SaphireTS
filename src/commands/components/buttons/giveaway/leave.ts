import Giveaway from "../../../../structures/giveaway/giveaway";
import { ButtonInteraction } from "discord.js";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import refreshButton from "./refreshButton";

export default async function join(interaction: ButtonInteraction<"cached">, giveaway: Giveaway) {

    await interaction.update({ content: `${e.Loading} | Te removendo do sorteio...`, components: [] });

    if (giveaway.lauched)
        return interaction.editReply({
            content: `${e.Animated.SaphireCry} | O sorteio já acabooou. Não da mais pra sair.`,
            components: []
        });

    if (!giveaway.Participants.has(interaction.user.id))
        return interaction.editReply({
            content: `${e.Animated.SaphireQuestion} | Pera aí, parece que você não está participando desse sorteio.`,
            components: []
        });

    return Database.Guilds.findOneAndUpdate(
        { id: interaction.guild.id, "Giveaways.MessageID": giveaway.MessageID },
        { $pull: { "Giveaways.$.Participants": interaction.user.id } },
        { new: true }
    )
        .then(document => {
            giveaway.removeParticipant(interaction.user.id);
            const giveawayObject = document?.Giveaways?.find(gw => gw?.MessageID === giveaway.MessageID);

            if (!giveawayObject) {
                giveaway.delete();
                return interaction.editReply({
                    content: `${e.Animated.SaphireQuestion} | Que estranho... Não achei o sorteio no banco de dados... Você pode chamar um administrador por favor?`,
                    components: []
                });
            }

            refreshButton(giveaway.MessageID);
            return interaction.editReply({
                content: `${e.Animated.SaphireCry} | Pronto pronto, você não está mais participando deste sorteio.`,
                components: []
            });
        })
        .catch(err => interaction.editReply({
            content: `${e.Animated.SaphirePanic} | Não foi possível te retirar do sorteio.\n${e.bug} | \`${err}\``
        }));
}