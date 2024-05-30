import { ButtonInteraction, Collection, Role, ButtonStyle, ChatInputCommandInteraction, Colors, Message, ComponentType } from "discord.js";
import { t } from "../../../translator";
import { e } from "../../../util/json";
import { AutoroleManager } from "../../../managers";

export default async function autorole(interactionOrMessage: ChatInputCommandInteraction<"cached"> | Message<true>) {

    const { guild, guildId } = interactionOrMessage;
    let locale = interactionOrMessage.userLocale;
    const user = "user" in interactionOrMessage ? interactionOrMessage.user : interactionOrMessage.author;

    const message = await interactionOrMessage.reply({
        content: t("autorole.loading", { e, locale }),
        fetchReply: true
    });

    const rolesAdded = new Set<string>();
    const rolesRemoved = new Set<string>();
    let rolesId = AutoroleManager.get(guildId)?.slice(0, 25);
    let roles = AutoroleManager.roles(guild, rolesId);
    const toSave = new Collection<string, Role>();
    const control = new Collection<string, Role>();

    for (const [roleId, role] of roles)
        toSave.set(roleId, role);

    const rolesMapped = (data: Collection<string, Role>) => data.map(r => `${rolesAdded.has(r.id) ? "⬆️" : rolesRemoved.has(r.id) ? e.DenyX : e.CheckV} ${r.toString()} \`${r.id}\``).join("\n") || t("autorole.no_roles", locale);

    const embed = (): any => {
        control.clear();
        for (const [roleId, role] of roles) control.set(roleId, role);
        for (const [roleId, role] of toSave) control.set(roleId, role);

        return {
            color: Colors.Blue,
            title: t("autorole.embeds.add.title", { e, locale, guild }),
            description: rolesMapped(control),
            fields: [
                {
                    name: t("autorole.embeds.add.fields.0.name", locale),
                    value: t("autorole.embeds.add.fields.0.value", { e, locale })
                },
                {
                    name: t("autorole.embeds.add.fields.1.name", { e, locale }),
                    value: t("autorole.embeds.add.fields.1.value", locale)
                }
            ]
        };
    };

    const components = [
        {
            type: 1,
            components: [
                {
                    type: ComponentType.RoleSelect,
                    custom_id: "rolesMenu",
                    min_values: 0,
                    max_values: 25,
                    disabled: false,
                    default_values: rolesId.map(id => ({ id, type: "role" })),
                    placeholder: t("autorole.components.selectMenuPlaceholder", locale)
                }
            ]
        },
        {
            type: 1,
            components: [
                {
                    type: 2,
                    label: t("keyword_save", locale),
                    custom_id: "save",
                    disabled: false,
                    style: ButtonStyle.Success
                },
                {
                    type: 2,
                    label: t("autorole.components.close", locale),
                    custom_id: "cancel",
                    disabled: false,
                    style: ButtonStyle.Danger
                }
            ]
        }
    ] as any;

    await message.edit({ content: null, embeds: [embed()], components })
        .catch(() => { });

    const collector = message.createMessageComponentCollector({
        filter: int => int.user.id === user.id,
        idle: 1000 * 60 * 5
    })
        .on("collect", async (int): Promise<any> => {

            locale = await int.user.locale() || guild.preferredLocale || "en-US";
            const customId = int.customId;
            const rolesId: string[] = int.isRoleSelectMenu() ? int.values : [];

            if (customId === "cancel") return collector.stop("cancel");
            if (customId === "save") return saved(int as any);

            analise(rolesId);
            return await int.update({ embeds: [embed()] });
        })
        .on("end", async (_, reason): Promise<any> => {
            if (["user", "time", "cancel"].includes(reason))
                return await message.edit({
                    content: t("autorole.cancelled", { e, locale }),
                    embeds: [], components: []
                });

            return;
        });

    async function saved(int: ButtonInteraction<"cached">) {

        const embedData = int.message.embeds[0];
        embedData.fields[0].value = t("autorole.saving", { e, locale });

        components[0].components[0].disabled = true;
        components[1].components[0].disabled = true;
        components[1].components[1].disabled = true;
        await int.update({ embeds: [embedData], components });
        await AutoroleManager.save(guild, Array.from(toSave.keys()));
        rolesId = AutoroleManager.get(guild.id);

        roles.clear();
        roles = AutoroleManager.roles(guild, rolesId);

        toSave.clear();

        for (const [roleId, role] of roles)
            toSave.set(roleId, role);

        rolesAdded.clear();
        rolesRemoved.clear();

        components[0].components[0].disabled = false;
        components[1].components[0].disabled = false;
        components[1].components[1].disabled = false;
        await int.editReply({ content: null, embeds: [embed()], components });
        return;
    }

    function analise(rolesId: string[]) {

        rolesRemoved.clear();

        const selectedRoles = AutoroleManager.roles(guild, rolesId);

        for (const roleId of toSave.keys()) remove(roleId);
        for (const roleId of roles.keys()) remove(roleId);

        for (const [roleId, role] of selectedRoles) {
            rolesRemoved.delete(roleId);
            toSave.set(roleId, role);
            if (!roles.has(roleId)) rolesAdded.add(roleId);
        }

        function remove(roleId: string) {
            if (!rolesId.includes(roleId)) {
                rolesRemoved.add(roleId);
                rolesAdded.delete(roleId);
                toSave.delete(roleId);
            }
        }

        return;
    }

    return;
}