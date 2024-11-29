import { t } from "../../translator";
import { e } from "../../util/json";

export default function statusServer(states: boolean[], locale: string, response: "emoji" | "text" | "text with emoji") {
  if (states.every(v => v === true)) {
    if (response === "emoji") return e.green;
    if (response === "text") return t("keyword_enable", locale);
    return `${e.green} ${t("keyword_enable", locale)}`;
  }

  if (states.every(v => v === false)) {
    if (response === "emoji") return e.red;
    if (response === "text") return t("keyword_disable", locale);
    return `${e.red} ${t("keyword_disable", locale)}`;
  }

  if (response === "emoji") return e.orange;
  if (response === "text") return t("logs.active_partial", locale);
  return `${e.orange} ${t("logs.active_partial", locale)}`;
}