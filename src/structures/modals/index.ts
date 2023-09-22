import { t } from "../../translator";
import { ModalMessageOptionsComponent } from "../../@types/commands";
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
};