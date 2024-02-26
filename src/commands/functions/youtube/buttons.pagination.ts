import { ButtonStyle } from "discord.js";
import { e } from "../../../util/json";

export default function buttonPagination(index: number, itensLength: number) {
  return {
    type: 1,
    components: [
      {
        type: 2,
        label: "⏪",
        custom_id: "zero",
        style: ButtonStyle.Primary,
        disabled: index === 0
      },
      {
        type: 2,
        label: "⬅️",
        custom_id: "preview",
        style: ButtonStyle.Primary
      },
      {
        type: 2,
        label: "➡️",
        custom_id: "next",
        style: ButtonStyle.Primary
      },
      {
        type: 2,
        label: "⏩",
        custom_id: "last",
        style: ButtonStyle.Primary,
        disabled: index === (itensLength - 1)
      },
      {
        type: 2,
        emoji: e.Trash,
        custom_id: "cancel",
        style: ButtonStyle.Danger
      }
    ]
  };
}