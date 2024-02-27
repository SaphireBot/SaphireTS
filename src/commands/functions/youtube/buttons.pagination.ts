import { ButtonStyle } from "discord.js";

export default function buttonPagination(index: number, itensLength: number, playlistsLength: number) {
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
        style: ButtonStyle.Primary,
        disabled: !itensLength
      },
      {
        type: 2,
        label: "➡️",
        custom_id: "next",
        style: ButtonStyle.Primary,
        disabled: !itensLength
      },
      {
        type: 2,
        label: "⏩",
        custom_id: "last",
        style: ButtonStyle.Primary,
        disabled: index >= (itensLength - 1)
      },
      {
        type: 2,
        label: "Playlist",
        custom_id: "playlist",
        style: ButtonStyle.Primary,
        disabled: !playlistsLength
      }
    ]
  };
}