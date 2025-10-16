import { ButtonStyle, ComponentType, parseEmoji } from "discord.js";
import { t } from "../../../../translator";
import { LocaleString } from "../../../../util/constants";
import { e } from "../../../../util/json";
import { GiveawayCollectorData } from "../../../../@types/commands";

export default function giveawayComponents(
  locale: LocaleString,
  giveawayEmoji: GiveawayCollectorData["reaction"],
  data: {
    switchRoles: "giveaway.components.switchRoles" | "giveaway.just_one_role_without_emoji"
    switchRolesDescription: "giveaway.all_roles_description" | "giveaway.just_one_role_description"
    multipleJoins: boolean
    hasGuildRequired: string | undefined
    allowedRoles: boolean
  },
) {

  const selectMenuOptions = [
    {
      label: "Cargos",
      description: "Cargos obrigatórios/proibidos, aos vencedores e multiplas entradas",
      emoji: parseEmoji(e.ModShield),
      value: "roles",
    },
  ];

  if (data.allowedRoles)
    selectMenuOptions.push({
      label: t(data?.switchRoles, locale),
      description: t(data?.switchRolesDescription, locale),
      emoji: parseEmoji("🔰"),
      value: "switchRoles",
    });

  selectMenuOptions.push([
    {
      label: "Usuários",
      description: "Usuários permitidos e proibidos",
      emoji: parseEmoji("👥"),
      value: "users",
    },
    {
      label: data.hasGuildRequired ? "Remover servidor obrigatório" : "Adicionar um servidor obrigatório",
      description: data.hasGuildRequired || "Para entrar neste sorteio, deve estar neste servidor",
      emoji: parseEmoji("🏠"),
      value: "guild",
    },
    {
      label: "Editar emoji de entrada",
      description: "Temporariamente desativado",
      emoji: parseEmoji(giveawayEmoji || "🎉"),
      value: "emoji",
    }] as any,
  );

  const components = [
    {
      type: 1,
      components: [
        {
          type: ComponentType.StringSelect,
          custom_id: "select",
          placeholder: "Configurações adicionais",
          options: selectMenuOptions.flat(),
        },
      ],
    },
    {
      type: 1,
      components: [
        {
          type: 2,
          label: t("giveaway.components.lauch", locale),
          emoji: "📨",
          custom_id: "lauch",
          style: ButtonStyle.Success,
        },
        {
          type: 2,
          label: t("giveaway.components.cancel", locale),
          emoji: "✖️",
          custom_id: "cancel",
          style: ButtonStyle.Danger,
        },
      ],
    },
  ];

  if (data.multipleJoins)
    components[1].components.push({
      type: 2,
      label: t("giveaway.components.DefineJoins", locale),
      emoji: "📝",
      custom_id: "DefineJoins",
      style: ButtonStyle.Primary,
    } as any);

  return components.asMessageComponents();

}
