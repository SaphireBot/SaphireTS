import Database from "../../database";

export default async function refundAllCrashGame(guildsId: string[]) {
    const data = await Database.Crashs.find({ guildId: { $in: guildsId } });
    if (!data.length) return;

    for await (const value of data) {
        for await (const userId of value.players) {
            await Database.editBalance(
                userId,
                {
                    createdAt: new Date(),
                    keywordTranslate: "crash.transactions.refund",
                    method: "add",
                    mode: "system",
                    type: "system",
                    value: value.value!,
                },
            );
            await Database.Crashs.deleteOne({ messageId: value.messageId });
        }
    }
}