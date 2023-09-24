import Giveaway from "../../../../structures/giveaway/giveaway";
import { ButtonInteraction, ButtonStyle } from "discord.js";
import { e } from "../../../../util/json";
import Database from "../../../../database";
import { GuildSchema } from "../../../../database/models/guild";
import disableButton from "./disableButton";
import refreshButton from "./refreshButton";

export default async function join(interaction: ButtonInteraction<"cached">, giveaway: Giveaway) {

    await interaction.reply({
        content: `${e.Loading} | Um segundo... Estou te colocando no sorteio...`,
        ephemeral: true
    });

    if (giveaway.lauched) {
        disableButton(interaction.message);
        return interaction.editReply({ content: `${e.Animated.SaphireCry} | Poooxa, o sorteio já acabou.` }).catch(() => { });
    }

    const { user, member } = interaction;

    if (giveaway.Participants.has(user.id))
        return interaction.editReply({
            content: `${e.QuestionMark} | Você já está participando deste sorteio com outros ${(giveaway.Participants.size - 1).currency()} participantes, deseja sair?`,
            components: [
                {
                    type: 1,
                    components: [
                        {
                            type: 2,
                            label: "Sair",
                            emoji: e.Leave,
                            custom_id: JSON.stringify({ c: "giveaway", src: "leave", gwId: giveaway.MessageID }),
                            style: ButtonStyle.Danger
                        },
                        {
                            type: 2,
                            label: "Deixa pra lá",
                            emoji: "🫠",
                            custom_id: JSON.stringify({ c: "giveaway", src: "ignore" }),
                            style: ButtonStyle.Success
                        }
                    ]
                }
            ].asMessageComponents()
        });

    if (giveaway.MinAccountDays > 0) {
        const accountDays = Math.floor((Date.now() - user?.createdTimestamp) / (1000 * 60 * 60 * 24));

        if (giveaway.MinAccountDays > accountDays)
            return interaction.editReply({
                content: `${e.Animated.SaphireCry} | Você não pode entrar nesse sorteio. A sua conta possui **${accountDays.currency()}** dias e o sorteio exige **${giveaway.MinAccountDays.currency()} dias**.\n${e.Info} | Falta mais **${(giveaway.MinAccountDays - accountDays).currency()} dias** para você entrar neste sorteio.`
            });
    }

    if (giveaway.MinInServerDays > 0) {
        const inServerDays = Math.floor((Date.now() - (member?.joinedTimestamp || 0)) / (1000 * 60 * 60 * 24));

        if (giveaway.MinInServerDays > inServerDays)
            return interaction.editReply({
                content: `${e.Animated.SaphireCry} | Você não pode entrar nesse sorteio. Você entrou no servidor há **${inServerDays.currency()}** dias e o sorteio exige que você esteja no servidor há pelo menos **${giveaway.MinInServerDays.currency()} dias**.\n${e.Info} | Falta mais **${(giveaway.MinInServerDays - inServerDays).currency()} dias** para você entrar neste sorteio.`
            });
    }

    let hasRole = false;

    if (giveaway.AllowedRoles?.length && !giveaway.AllowedMembers.includes(user.id)) {

        if (giveaway.RequiredAllRoles) {
            if (!member.roles.cache.hasAll(...giveaway.AllowedRoles))
                return interaction.editReply({
                    content: `${e.Animated.SaphireQuestion} | Hmmm... Parece que você não tem todos os cargos obrigatórios.\n${e.Info} | Pra você entrar, falta esses cargos: ${giveaway.AllowedRoles.filter(roleId => !member.roles.cache.has(roleId)).map(roleId => `<@&${roleId}>`).join(", ")}`,
                });
        }
        else
            if (!member.roles.cache.hasAny(...giveaway.AllowedRoles))
                return interaction.editReply({
                    content: `${e.DenyX} | Ooops! Você não possui nenhum dos cargos selecionados.\n${e.Info} | Pra você entrar, você precisa de pelo menos um desses cargos: ${giveaway.AllowedRoles.map(roleId => `<@&${roleId}>`).join(", ")}`
                });
        hasRole = true;
    }

    if (giveaway.LockedRoles?.length && !giveaway.AllowedMembers.includes(user.id)) {
        if (member.roles.cache.hasAny(...giveaway.LockedRoles))
            return interaction.editReply({
                content: `${e.saphirePolicial} | Ora ora ora... Parece que você tem um dos cargos que estão bloqueados neste sorteio.\n${e.Info} | Esses são os cargos que você tem, mas estão bloqueados: ${giveaway.LockedRoles.filter(roleId => member.roles.cache.has(roleId)).map(roleId => `<@&${roleId}>`).join(", ") || "??"}`
            });
    }

    if (giveaway.AllowedMembers?.length && !giveaway.AllowedMembers?.includes(user.id) && !hasRole)
        return interaction.editReply({
            content: `${e.Animated.SaphireCry} | Você não está na lista de pessoas que podem entrar no sorteio.`
        });

    if (giveaway.LockedMembers?.includes(user.id))
        return interaction.editReply({
            content: `${e.Animated.SaphirePanic} | HOO MY GOOSH! Você está na lista de pessoas que não podem participar deste sorteio.`
        });

    giveaway.addParticipant(user.id);
    return await Database.Guilds.findOneAndUpdate(
        { id: interaction.guild.id, "Giveaways.MessageID": giveaway.MessageID },
        { $addToSet: { "Giveaways.$.Participants": user.id } },
        { new: true, upsert: true }
    )
        .then(doc => success(doc.toObject()))
        .catch(err => interaction.editReply({ content: `${e.Animated.SaphirePanic} | Não foi possível te adicionar no sorteio.\n${e.bug} | \`${err}\`` }));

    async function success(doc: GuildSchema) {
        const giveawayObject = doc.Giveaways?.find(gw => gw.MessageID === giveaway.MessageID);

        if (!giveawayObject) {
            giveaway.delete();
            return interaction.editReply({
                content: `${e.Animated.SaphireQuestion} | Que estranho... Não achei o sorteio no banco de dados... Você pode chamar um administrador por favor?`
            });
        }

        const participants = giveaway.addParticipants(giveawayObject.Participants);
        refreshButton(giveaway.MessageID);
        const phrase = [
            "Boooa! Te coloquei na lista de participantes.",
            "Aeee! Agora você está participando deste sorteio.",
            `Okay okaaay. Agora você está concorrendo contra outros ${participants.size} participantes.`,
            "Uhhuuuuu!! Você entrou no sorteio."
        ];

        if (giveaway.lauched) disableButton(interaction.message);
        return await interaction.editReply({
            content: `${e.Animated.SaphireDance} | ${phrase.random()}\n${e.Animated.SaphireSleeping} | Agora é só esperar o sorteio terminar, boa sorte.`
        });
    }

}