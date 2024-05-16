import { Mongoose } from "mongoose";
import { env } from "process";

// Users, Guilds, ..., Database
const SaphireMongoose = new Mongoose();
export let SaphireMongooseCluster = SaphireMongoose.set("strictQuery", true)
  .createConnection(
    env.MACHINE === "discloud"
      ? env.SAPHIRE_DATABASE_LINK_CONNECTION
      : env.CANARY_DATABASE_LINK_CONNECTION
  );
SaphireMongooseCluster.on("error", error => console.log("[Mongoose] Cluster Saphire | FAIL\n--> " + error));
SaphireMongooseCluster.on("disconnected", () => {
  console.log("[Mongoose] Cluster Saphire Disconnected");
  SaphireMongooseCluster = SaphireMongoose.set("strictQuery", true)
    .createConnection(
      env.MACHINE === "discloud"
        ? env.SAPHIRE_DATABASE_LINK_CONNECTION
        : env.CANARY_DATABASE_LINK_CONNECTION
    );
});

// Bets, Games, Safiras, ..., Database
const BetMongoose = new Mongoose();
export let BetMongooseCluster = BetMongoose.set("strictQuery", true).createConnection(process.env.DATABASE_BET_LINK_CONNECTION);
BetMongooseCluster.on("error", error => console.log("[Mongoose] Bet Database | FAIL\n--> " + error));
BetMongooseCluster.on("connected", () => console.log("[Mongoose] Cluster Bet Connected"));
BetMongooseCluster.on("disconnected", () => {
  console.log("[Mongoose] Cluster Bet Disconnected");
  BetMongooseCluster = BetMongoose.set("strictQuery", true).createConnection(process.env.DATABASE_BET_LINK_CONNECTION);
});

// Change Logs Database
const RecordMongoose = new Mongoose();
export let RecordMongooseCluster = RecordMongoose.set("strictQuery", true).createConnection(process.env.DATABASE_RECORD_LINK_CONNECTION);
RecordMongooseCluster.on("error", error => console.log("[Mongoose] Bet Database | FAIL\n--> " + error));
RecordMongooseCluster.on("connected", () => console.log("[Mongoose] Cluster Record Connected"));
RecordMongooseCluster.on("disconnected", () => {
  console.log("[Mongoose] Cluster Record Disconnected");
  RecordMongooseCluster = RecordMongoose.set("strictQuery", true).createConnection(process.env.DATABASE_RECORD_LINK_CONNECTION);
});