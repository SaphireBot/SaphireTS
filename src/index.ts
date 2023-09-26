import "./@prototypes";
import client from "./saphire";
import "./events";

process.on("unhandledRejection", console.log);
process.on("uncaughtException", console.log);

client.start();