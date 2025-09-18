import { blacklistType } from "../../@types/database";
import { GlobalStaffManager } from "..";
import Database from "../../database";

/*
* GlobalStaffManager - Gerenciador Global da Staff e suas permissões
* blacklistType: {
*     date?: Se houver date, este usuário permanecerá na blacklist até o tempo determinado
*     executorId: O membro da staff que adicionou este usuário na blacklist
*     reason: A razão/motivo do staffer ter adicionado este usuário na blacklist
*  }
*/

export default class BlacklistManager {

  // Caso o usuário ESTEJA na Blacklist, será definido blacklistType
  // Caso o usuário NÃO ESTEJA na Blacklist, será definido null
  blacklisted = new Map<string, blacklistType | null>();

  constructor() { }

  // Função para verificar se o usuário está na Blacklist
  async isBlacklisted(userId: string): Promise<blacklistType | null> {

    // Verifica se o usuário está no cache
    const data = this.blacklisted.get(userId);
    // Se o valor for null, ele não está na blacklist
    if (data === null) return null;

    // Se o valor for undefined, o cache não foi definido
    if (data === undefined)
      // Pegamos a função getBlacklist
      // Além de obter os dados direto do banco de dados, esta função define o valor no cache
      return await this.getBlacklist(userId);

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
    return await this.getBlacklist(userId);
  }

  // Função que adiciona o usuário na blacklist
  async setBlacklist(userId: string, data: blacklistType): Promise<blacklistType | null> {

    // Verifica se o executor possui a permissão de moderador ou superior
    if (!GlobalStaffManager.isMod(data.executorId)) return null;

    // Verifica os dados repassados para não haver nenhum tipo de erro
    const verifiedData = await this.verifyBlacklistData(userId, data);
    // Caso não passe do verificador, retorna null
    if (!verifiedData) return null;

    // Adiciona os dados no banco de dados
    await Database.Users.updateOne(
      { id: userId },
      { $set: { "auditory.blacklist": data } },
      { upsert: true },
    );

    // Retorna os dados da blacklist deste usuário
    return data;
  }

  // Função para remover o usuário da blacklist
  async removeBlacklist(userId: string): Promise<null> {

    // Remove o usuário do cache
    this.blacklisted.set(userId, null);

    // Remove os dados da blacklist da auditoria deste usuário
    await Database.Users.updateOne(
      { id: userId },
      { $unset: { "auditory.blacklist": true } },
      { upsert: true },
    );

    // retorna null, pois este usuário não está mais na blacklist
    return null;
  }

  // Função para obter os dados da blacklist do banco de dados do usuário
  async getBlacklist(userId: string): Promise<blacklistType | null> {
    // Pegamos os dados do banco de dados deste usuário
    const data = await Database.getUser(userId);
    // Retorna a verificação dos dados
    return await this.verifyBlacklistData(userId, data?.auditory?.blacklist);
  }

  // Função simples para verificar o tempo definido
  private isTimeBlacklisted(date: Date): boolean {
    // Se o tempo de AGORA foi MENOR que o TEMPO DEFINIDO
    // quer dizer que o tempo definido da blacklist já foi ultrapassado
    // Retorna TRUE, caso o tempo determinado for maior que o tempo de AGORA
    return Date.now() < date.getTime();
  }

  // Função para verificar os dados da blacklist
  private async verifyBlacklistData(userId: string, data: blacklistType | undefined): Promise<blacklistType | null> {
    // Se por algum motivo, nada for repassado como parâmetro, retorna null
    if (!userId || !data) return null;

    // Verifica se o blacklist é temporário
    if (data.date && !this.isTimeBlacklisted(data.date))
      // Se o tempo já foi ultrapassado, remove o usuário da blacklist e retorna null
      return await this.removeBlacklist(userId);

    // Verifica a existência da RAZÃO e EXECUTOR
    if (
      !data?.reason?.length
      || !data?.executorId
    )
      // Se por algum motivo, não existe algum dos dois, removemos da blacklit, pois os dados estão incompletos
      return await this.removeBlacklist(userId);

    // Verifica novamente a razão e o executor
    if (data.reason?.length && data.executorId) {
      // Adiciona os dados no cache do usuário
      this.blacklisted.set(userId, data);
      // Retorna os dados válidos
      return data;
    }

    // Se por algum motivo chegar até aqui, remove o usuário do banco
    // Se chegar aqui, tem algo bem errado
    return await this.removeBlacklist(userId);
  }

} // Fim :D
