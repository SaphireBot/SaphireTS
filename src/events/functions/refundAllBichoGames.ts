import Database from "../../database";

export default async function refundAllBichoGames() {
  const data: Record<string, { users: string[], value: number }> = await Database.Games.get("Bicho") || {};
  const options = Object.values(data);

  if (!options.length) return;

  for await (const { users, value } of options)
    if (users?.length)
      for await (const userId of users)
        await Database.editBalance(
          userId,
          {
            createdAt: new Date(),
            keywordTranslate: "bicho.transactions.refund",
            method: "add",
            mode: "bicho",
            type: "system",
            value,
          },
        );

  await Database.Games.set("Bicho", {});
  return;
}