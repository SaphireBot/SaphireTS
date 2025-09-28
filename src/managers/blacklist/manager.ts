import { blacklistType } from "../../@types/database";
import { GlobalStaffManager } from "..";
import Database from "../../database";
import { t } from "../../translator";
import { e } from "../../util/json";
import { Message } from "discord.js";

/**
 * GlobalStaffManager - Gerenciador Global da Staff e suas permissões
 * blacklistType: {
 *     date?: Se houver date, este usuário permanecerá na blacklist até o tempo determinado
 *     executorId: O membro da staff que adicionou este usuário na blacklist
 *     reason: A razão/motivo do staffer ter adicionado este usuário na blacklist
 *  }
 */

export default class BlacklistManager {

  /**
   * Caso o usuário/servidor ESTEJA na Blacklist, será definido blacklistType
   * Caso o usuário/servidor NÃO ESTEJA na Blacklist, será definido null
   */
  blacklisted = new Map<string, blacklistType | null>();

  /**
   * Quando um usário/servidor tentar usar um comando/sistema da Saphire, ele será avisado que está na Blacklist
   * Após 15 minutos, o aviso será deletado para outro aviso.
   */
  warns = new Map<string, NodeJS.Timeout>();

  constructor() { }

  // Função para verificar se o usuário/servidor está na Blacklist
  async getBlacklist(userOrGuildId: string, from: "user" | "guild"): Promise<blacklistType | null> {

    // Verifica se o usuário/servidor está no cache
    const data = this.blacklisted.get(userOrGuildId);
    // Se o valor for null, ele não está na blacklist
    if (data === null) return null;

    // Se o valor for undefined, o cache não foi definido
    if (data === undefined)
      // Pegamos a função getBlacklist
      // Além de obter os dados direto do banco de dados, esta função define o valor no cache
      return await this.fetchBlacklist(userOrGuildId, from);

    // 2 condições para retornar o valor da blacklist
    if (
      (
        data.date // Verifica se o blacklist é temporário
        && this.isTimeBlacklisted(data.date) // Verifica se o tempo definido já passou
      ) || (
        data.reason?.length // Verifica se existe uma razão
        && data?.executorId // Verifica se existe um executor
      )
    ) return data; // Caso uma das condições seja TRUE, retornamos os dados da blacklist

    // Se por algum motivo, chegar até aqui
    // Definimos os dados novamente
    return await this.fetchBlacklist(userOrGuildId, from);
  }

  // Função que adiciona o usuário/servidor na blacklist
  async setBlacklist(
    userOrGuildId: string,
    from: "user" | "guild",
    data: blacklistType,
  ): Promise<blacklistType | null> {

    // Verifica se o executor possui a permissão de moderador ou superior
    if (!GlobalStaffManager.isMod(data.executorId)) return null;

    // Verifica os dados repassados para não haver nenhum tipo de erro
    const verifiedData = await this.verifyUserBlacklistData(userOrGuildId, from, data);
    // Caso não passe do verificador, retorna null
    if (!verifiedData) return null;

    // Adiciona os dados no banco de dados
    if (from === "guild")
      await Database.Guilds.updateOne(
        { id: userOrGuildId },
        { $set: { "auditory.blacklist": data } },
        { upsert: true },
      );

    // Adiciona os dados no banco de dados
    if (from === "user")
      await Database.Users.updateOne(
        { id: userOrGuildId },
        { $set: { "auditory.blacklist": data } },
        { upsert: true },
      );

    // Retorna os dados da blacklist deste usuário/servidor
    return data;
  }

  // Função para remover o usuário/servidor da blacklist
  async removeBlacklist(userOrGuildId: string, from: "user" | "guild"): Promise<null> {

    // Remove o usuário/servidor do cache
    this.blacklisted.set(userOrGuildId, null);

    // Se houver um aviso ativo, desativamos o timer
    clearTimeout(this.warns.get(userOrGuildId));
    // Deletamos o warn desativado
    this.warns.delete(userOrGuildId);

    // Remove os dados da blacklist da auditoria deste servidor
    if (from === "guild")
      await Database.Guilds.updateOne(
        { id: userOrGuildId },
        { $unset: { "auditory.blacklist": true } },
        { upsert: true },
      );

    // Adiciona os dados no banco de dados
    if (from === "user")
      await Database.Users.updateOne(
        { id: userOrGuildId },
        { $unset: { "auditory.blacklist": true } },
        { upsert: true },
      );


    // retorna null, pois este usuário/servidor não está mais na blacklist
    return null;
  }

  // Função para obter os dados da blacklist do banco de dados do usuário/servidor
  async fetchBlacklist(userOrGuildId: string, from: "user" | "guild"): Promise<blacklistType | null> {
    // Pegamos os dados do banco de dados deste usuário/servidor
    const data = from === "user"
      ? await Database.getUser(userOrGuildId)
      : await Database.getGuild(userOrGuildId);

    // Retorna a verificação dos dados
    return await this.verifyUserBlacklistData(userOrGuildId, from, data?.auditory?.blacklist);
  }

  // Função para avisar um usuário/servidor que ele está na blacklist
  async warnUser(message: Message<boolean>, from: "user" | "guild", reason: string) {

    // Definimos o ID do usuário/servidor
    const id = from === "user" ? message.author.id : message.guildId;
    if (!id) return;

    // Se já foi avisado, retorna
    if (this.warns.has(id)) return;

    // Envia a mensagem 
    const msg = await message.reply({
      content: t(`blacklist.in.${from}`, {
        e,
        locale: message.userLocale,
        reason,
      }),
    }).catch(() => { });

    // Se for de um servidor que está na Blacklist, avisa e sai do servidor
    if (from === "guild")
      return await message.guild?.leave().catch(() => { });

    // Deleta a mensagem enviada em 5 segundos
    setTimeout(() => msg?.delete().catch(() => { }), 5000);

    // Define o timer para deletar o aviso em 15 minutos
    this.warns.set(
      id,
      setTimeout(() => {
        this.warns.delete(id);
      }, 1000 * 60 * 15),
    );

    return;
  }

  // Função simples para verificar o tempo definido
  private isTimeBlacklisted(date: Date): boolean {
    // Se o tempo de AGORA foi MENOR que o TEMPO DEFINIDO
    // quer dizer que o tempo definido da blacklist já foi ultrapassado
    // Retorna TRUE, caso o tempo determinado for maior que o tempo de AGORA
    return Date.now() < date.getTime();
  }

  // Função para verificar os dados da blacklist
  private async verifyUserBlacklistData(
    userOrGuildId: string,
    from: "user" | "guild",
    data: blacklistType | undefined,
  ): Promise<blacklistType | null> {
    // Se por algum motivo, nada for repassado como parâmetro, retorna null
    if (!userOrGuildId || !data) return null;

    // Verifica se o blacklist é temporário
    if (data.date && !this.isTimeBlacklisted(data.date))
      // Se o tempo já foi ultrapassado, remove o usuário/servidor da blacklist e retorna null
      return await this.removeBlacklist(userOrGuildId, from);

    // Verifica a existência da RAZÃO e EXECUTOR
    if (
      !data?.reason?.length
      || !data?.executorId
    )
      // Se por algum motivo, não existe algum dos dois, removemos da blacklit, pois os dados estão incompletos
      return await this.removeBlacklist(userOrGuildId, from);

    // Verifica novamente a razão e o executor
    if (data.reason?.length && data.executorId) {
      // Adiciona os dados no cache do usuário/servidor
      this.blacklisted.set(userOrGuildId, data);
      // Retorna os dados válidos
      return data;
    }

    // Se por algum motivo chegar até aqui, remove o usuário/servidor do banco
    // Se chegar aqui, tem algo bem errado
    return await this.removeBlacklist(userOrGuildId, from);
  }

} // Fim :D
