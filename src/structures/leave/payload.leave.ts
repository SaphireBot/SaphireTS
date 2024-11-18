import { APIEmbed, GuildMember, PartialGuildMember } from "discord.js";
import { GuildSchemaType } from "../../database/schemas/guild";

export const LeaveCacheEmbed = new Map<string, APIEmbed>();
export const LeaveCacheContent = new Map<string, string>();

export default function payloadLeave(data: GuildSchemaType | undefined, member: GuildMember | PartialGuildMember): { content: string | undefined, embeds: [APIEmbed] | [] } {

  let content = LeaveCacheContent.get(member.id) || data?.LeaveNotification?.body?.content || undefined;
  const embed: APIEmbed = Object.assign({}, LeaveCacheEmbed.get(member.id) || data?.LeaveNotification?.body?.embed || {});

  if (!content && !embed)
    return { content: undefined, embeds: [] };

  if (content?.length)
    content = replace(content, member.toString());

  if (embed) {

    const validKeys = ["title", "description", "footer.text", "author.name"];

    for (const key of validKeys)
      // @ts-expect-error ignore;
      if (typeof embed[key] === "string")
        // @ts-expect-error ignore;
        embed[key] = replace(embed[key], member.toString());

    if (embed.fields?.length)
      for (let i = 0; i < embed.fields.length; i++) {
        if (embed.fields[i]) {
          embed.fields[i].name = replace(embed.fields[i].name, member.toString());
          embed.fields[i].value = replace(embed.fields[i].value, member.toString());
        }
      }

    if (
      data?.LeaveNotification?.thumbnailImage
      && !embed.thumbnail?.url
    ) {
      const avatar = member.user.displayAvatarURL();
      embed.thumbnail = { url: avatar };
    }
  }

  if (
    !embed.author
    && !embed.description
    && !embed.title
    && !embed.image?.url
    && !embed.footer?.text
  )
    return { content, embeds: [] };
  else return { content, embeds: [embed] };

}

function replace(text: string, memberToString: string) {
  return text.replace("{member}", memberToString);
}