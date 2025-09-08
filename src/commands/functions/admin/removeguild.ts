import { ButtonInteraction, ButtonStyle, MessageFlags } from "discord.js";
import client from "../../../saphire";
import { e } from "../../../util/json";
import Database from "../../../database";

export default async function removeGuild(interaction: ButtonInteraction<"cached">, data: { id: string }) {

  const guildId = data?.id;

  if (!guildId)
    return await interaction.reply({
      content: "No ID defined",
      flags: [MessageFlags.Ephemeral],
    });

  const admins = await Database.Client.findOne({ id: client.user!.id });
  if (!admins?.Administradores?.includes(interaction.user.id))
    return await interaction.reply({
      content: `${e.DenyX} | Você não é um administrador.`,
      flags: [MessageFlags.Ephemeral],
    });

  const guild = await client.guilds.getInShardsById(guildId);

  if (!guild)
    return await interaction.reply({
      content: `${e.DenyX} | Servidor não encontrado.`,
      flags: [MessageFlags.Ephemeral],
    });

  const msg = await interaction.reply({
    content: `${e.QuestionMark} | Você confirma a saída do servidor **${guild.name}** \`${guild.id}\`?`,
    withResponse: true,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            label: "Confirmar Saída",
            custom_id: "confirm",
            style: ButtonStyle.Danger,
          },
          {
            type: 2,
            label: "Cancelar",
            custom_id: "cancel",
            style: ButtonStyle.Success,
          },
        ],
      },
    ].asMessageComponents(),
  }).then(res => res.resource?.message);
  
  if (!msg) return;

  const collector = msg.createMessageComponentCollector({
    filter: int => int.user.id === interaction.user.id,
    time: 1000 * 30,
  })
    .on("collect", async (int: ButtonInteraction<"cached">): Promise<any> => {

      const { customId } = int;
      if (customId === "cancel") return collector.stop("cancel");
      if (customId === "confirm") {
        collector.stop();

        await interaction.editReply({
          content: `${e.Loading} | Saindo do servidor...`,
          components: [],
        });

        return await fetch(
          `https://discord.com/api/v10/users/@me/guilds/${guildId}`,
          {
            method: "DELETE",
            headers: {
              authorization: `Bot ${client.token}`,
            },
          },
        )
          .then(async res => {
            if (res.status === 204)
              return await interaction.editReply({
                content: `${e.CheckV} | Saída do servidor **${guild.name}** \`${guild.id}\` efetuada com sucesso.`,
              });

            return await interaction.editReply({
              content: `${e.Warn} | Resposta indefinida, confirmação pendente.`,
            });
          })
          .catch(async err => {

            return await interaction.editReply({
              content: `${e.DenyX} | Houve um erro ao tentar sair do servidor.\n${e.bug} | \`${err}\``,
            });

          });

      }

      return;
    })
    .on("end", async (_, reason: string): Promise<any> => {
      if (["time", "cancel"].includes(reason))
        return await msg.delete().catch(() => { });
    });

  return;

}