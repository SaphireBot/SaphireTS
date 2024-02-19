import "./@prototypes";
import "djs-protofy/init";
import client from "./saphire";
import "./events";
process.env.TZ = "America/Sao_Paulo";
const errorsCode = [500, 10004, 10008, 10062, 50001, "GuildMembersTimeout", "ChannelNotCached"];

process
    .on("unhandledRejection", (reason: any) => {
        if (errorsCode.includes(reason?.code)) return;
        return console.log("unhandledRejection", reason);
    })
    .on("uncaughtException", (error: any, origin: any) => {
        if (errorsCode.includes(error?.code)) return;
        return console.log("uncaughtException", error, origin);
    });

client.start();