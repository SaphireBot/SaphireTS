import { ButtonStyle } from "discord.js";
import { urls } from "../../../util/constants";

export default {
  type: 1,
  components: [
    {
      type: 2,
      label: "⏪",
      custom_id: "zero",
      style: ButtonStyle.Primary
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
      style: ButtonStyle.Primary
    },
    {
      type: 2,
      label: "Site",
      url: urls.saphireSiteUrl + "/commands",
      style: ButtonStyle.Link
    }
  ]
};