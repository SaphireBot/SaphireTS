import { APIEmbed, Guild, GuildMember, User } from "discord.js";
import { GuildSchemaType } from "../../database/schemas/guild";
import { interpolate } from "../../util/interpolate";

export const WelcomeCacheEmbed = new Map<string, APIEmbed>();
export const WelcomeCacheContent = new Map<string, string>();

export default function payloadWelcome(data: GuildSchemaType | undefined, member: GuildMember): { content: string | undefined, embeds: [APIEmbed] | [] } {

  let content = WelcomeCacheContent.get(member.id) || data?.WelcomeNotification?.body?.content || undefined;
  const embed: APIEmbed = Object.assign({}, WelcomeCacheEmbed.get(member.id) || data?.WelcomeNotification?.body?.embed || {});
  const user = member.user;
  const guild = member.guild;

  if (!content && !embed)
    return { content: undefined, embeds: [] };

  if (content?.length)
    // content = replace(content, member.toString());
    content = replace(content, member, user, guild);

  if (embed) {

    const validKeys = ["title", "description", "footer.text", "author.name"];

    for (const key of validKeys)
      // @ts-expect-error ignore;
      if (typeof embed[key] === "string")
        // @ts-expect-error ignore;
        embed[key] = replace(embed[key], member, user, guild);

    if (embed.fields?.length)
      for (let i = 0; i < embed.fields.length; i++) {
        if (embed.fields[i]) {
          embed.fields[i].name = replace(embed.fields[i].name, member, user, guild);
          // embed.fields[i].name = replace(embed.fields[i].name, member.toString());
          // embed.fields[i].value = replace(embed.fields[i].value, member.toString());
          embed.fields[i].value = replace(embed.fields[i].value, member, user, guild);
        }
      }

    if (
      data?.WelcomeNotification?.thumbnailImage
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

function replace(text: string, member: GuildMember, user: User, guild: Guild) {
// function replace(text: string, memberToString: string) {
  // return text.replace("{member}", memberToString);
  return interpolate(text, { member, user, guild });
}