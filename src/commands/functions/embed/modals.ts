import { ModalSubmitInteraction } from "discord.js";
import body from "./body";
import links from "./links";
import footer from "./footer";
import fields from "./fields";
import json from "./json";
import messageLink from "./messageLink";
import color from "./color";
import webhook from "./webhook";

export default async function modals(
  interaction: ModalSubmitInteraction<"cached">,
  data?: {
    c: "embed",
    src: "body" | "links" | "footer" | "fields" | "json"
  },
) {

  if (!data?.src) return;

  return await {
    body,
    links,
    footer,
    fields,
    json,
    messageLink,
    color,
    webhook,
  }[data.src](interaction);

}