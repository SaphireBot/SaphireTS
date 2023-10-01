import "./@prototypes";
import client from "./saphire";
import "./events";

process
    .on("unhandledRejection", (reason: any) => {
    if ([500, 10004, 10008, 10062, 50001, "GuildMembersTimeout"].includes(reason?.code)) return;
    return console.log("unhandledRejection", reason);
    })
    .on("uncaughtException", (error: any, origin: any) => {
    if ([500, 10004, 10008, 10062, 50001, "GuildMembersTimeout"].includes(error?.code)) return;
    return console.log("uncaughtException", error, origin);
});

client.start();