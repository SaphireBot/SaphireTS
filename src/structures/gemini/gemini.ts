import { ChatSession, GoogleGenerativeAI } from "@google/generative-ai";
import { APIEmbed, ButtonStyle, Colors, LocaleString, Message, User } from "discord.js";
import { t } from "../../translator";
import { e } from "../../util/json";
import { QuickDB } from "quick.db";
import { setTimeout as sleep } from "node:timers/promises";

export const History = new QuickDB({ filePath: "sqlite/gemini.sqlite" });
const Gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default new class GeminiManager {

  requests = new Set<string>();
  Model = Gemini.getGenerativeModel({ model: "gemini-pro" });
  timer = setInterval(() => this.requests.clear(), (1000 * 60) * 2);

  models = {} as Record<string, ChatSession | undefined>;

  constructor() { }

  async getChat(user: User) {
    const chat = this.models[user.id];

    if (!chat) {
      this.models[user.id] = this.Model.startChat({
        // history,
        generationConfig: {
          maxOutputTokens: 1000,
          // stopSequences: [],
          temperature: 1.0,
          topK: 1,
          topP: 0.5
        },
      });
    }

    return chat! || this.models[user.id]!;
  }

  async execute(message: Message<true>, prompt: string) {

    const { userLocale: locale, author } = message;

    if (this.requests.size >= 55)
      return await message.reply({
        content: t("gemini.rate_limit", { e, locale })
      });

    const msg = await message.reply({
      content: t("gemini.loading", { e, locale })
    });

    try {

      this.requests.add(msg.id);
      await message.parseMentions();

      const streamData = [
        prompt,
        // `Minhas informações: ${JSON.stringify(author.toJSON())}`,
        // `Informações do Servidor: ${JSON.stringify({ name: guild.name, members: guild.memberCount, owner: (await guild.fetchOwner())?.displayName, avatar: guild.iconURL() })}`,
        // `Usuários mencionados: ${JSON.stringify(message.mentions.users.toJSON())}`,
        // `Membros mencionados: ${JSON.stringify(message.mentions.members.toJSON())}`,
        // `Cargos mencionados: ${JSON.stringify(message.mentions.users.toJSON())}`
      ];

      const chat = await this.getChat(author);
      const data = await chat.sendMessageStream(streamData);

      let text = "";

      for await (const chunk of data.stream) {
        const chunkText = chunk.text();
        text += chunkText;
        await this.reply(text, msg);
        await sleep(2000);
      }

      if (!text.length)
        delete this.models[author.id];

      this.saveHistory(message.author.id, {
        user: [prompt], model: text
      });
      await this.reply(text || "Nenhuma resposta obtida do Gemini", msg);
      return;
    } catch (err) {
      delete this.models[author.id];
      return await this.error(msg, err, locale);
    }

  }

  async saveHistory(userId: string, parts: { user: string | string[], model: string }) {
    if (!parts.user?.length || !parts.model?.length || !userId) return;
    await History.push(userId, { "parts": parts.user, "role": "user" });
    await History.push(userId, { "parts": parts.model, "role": "model" });
  }

  async error(msg: Message<true>, err: unknown, locale: LocaleString) {
    return await msg.edit({
      content: t("gemini.error", { e, locale, err })
    });
  }

  async reply(text: string, msg: Message<true>) {

    if (text.length > 6000)
      text = text.slice(0, 6000);

    const data = {
      content: null as string | null,
      embeds: [] as APIEmbed[]
    };

    for (let i = 0; i <= text.length; i += 2000) {

      if (text.length >= 2000) {

        data.content = null;
        data.embeds.push({
          color: Colors.Blue,
          description: text.slice(i, i + 2000),
          footer: { text: "Gemini - Powered By Google" }
        });

      } else data.content = text;

    }

    return await msg.edit({
      content: data.content,
      embeds: data.embeds,
      allowedMentions: {
        parse: [],
        repliedUser: true,
        roles: [],
        users: []
      },
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              label: "Google Gemini",
              custom_id: "gemini",
              style: ButtonStyle.Secondary,
              disabled: true
            }
          ]
        }
      ]
    });
  }

};