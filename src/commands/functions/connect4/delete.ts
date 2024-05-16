import Database from "../../../database";
import { connect4Cache } from "../../components/buttons/connect4/play";

export default async function deleteConnect4Game(messageId: string | string[]) {

    if (typeof messageId === "string") {
        await Database.Connect4.deleteOne({ id: messageId });
        connect4Cache.delete(messageId);
        return;
    }

    if (Array.isArray(messageId)) {
        for await (const msgId of messageId) connect4Cache.delete(msgId);
        await Database.Connect4.deleteMany({ id: { $in: messageId } });
        return;
    }

    return;
}