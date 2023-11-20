import { InteractionResponse, GuildMember, Message } from "discord.js";
import { e } from "../../../../util/json";
import { t } from "../../../../translator";
import { GuildSchema } from "../../../../database/models/guild";

export default async (message: Message<true> | InteractionResponse<true>, member: GuildMember, tempcallData: GuildSchema["TempCall"], locale: any) => {

    if (!member)
        return await message.edit({
            content: t("tempcall.member_not_found", { e, locale })
        });

    if (!tempcallData) tempcallData = {};
    if (!tempcallData?.members) tempcallData.members = {};
    if (!tempcallData?.membersMuted) tempcallData.membersMuted = {};
    const data = { member: member, OnTime: tempcallData?.members[member.user.id] || 0, offTime: tempcallData?.membersMuted[member.user.id] || 0 };

    return await message.edit({
        content: `👤 ${member?.user?.username || "??"} \`${member?.id}\`\n🎙️ \`${Date.stringDate(data.OnTime, true, locale)}\`\n🔇 \`${Date.stringDate(data.offTime, true, locale)}\``
    });
};