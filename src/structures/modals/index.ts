import { t } from "../../translator";
import { ModalMessageOptionsComponent, RoleGiveaway } from "../../@types/commands";
import { APIActionRowComponent, APIModalActionRowComponent, LocaleString } from "discord.js";

export default new class Modals {
    constructor() { }

    setPrefix(prefixes: string[], locale: LocaleString | undefined): ModalMessageOptionsComponent {

        const keywordPrefix = t("keyword_prefix", locale);
        const placeholder = t("setprefix.model.placeholder", locale);

        const components: APIActionRowComponent<APIModalActionRowComponent>[] = [];

        for (let i = 0; i < 5; i++)
            components.push({
                type: 1,
                components: [
                    {
                        type: 4,
                        custom_id: `prefix${i + 1}`,
                        label: `${keywordPrefix} ${i + 1}`,
                        style: 1,
                        placeholder,
                        required: i === 0,
                        value: prefixes[i]?.slice(0, 3),
                        min_length: i === 0 ? 1 : 0,
                        max_length: 3
                    }
                ]
            });

        return {
            title: t("setprefix.model.title", locale),
            custom_id: JSON.stringify({ c: "prefix" }),
            components
        };
    }

    giveawayDefineMultJoins(roles: RoleGiveaway[]): ModalMessageOptionsComponent {


        const components: APIActionRowComponent<APIModalActionRowComponent>[] = [];

        for (const r of roles.slice(0, 5))
            components.push({
                type: 1,
                components: [
                    {
                        type: 4,
                        custom_id: r.role?.id,
                        label: r.role.name,
                        style: 1,
                        placeholder: "1, 2, 3, 4, 5... Max: 100",
                        required: true,
                        min_length: 1,
                        max_length: 3,
                        value: `${r.joins || 1}`
                    }
                ]
            });

        return {
            title: "GIVEAWAY | Multiplas Entradas",
            custom_id: "ModalMultipleJoins",
            components
        };
    }
};