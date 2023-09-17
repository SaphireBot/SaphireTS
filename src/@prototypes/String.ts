import { APIMessageComponentEmoji, parseEmoji } from "discord.js";

String.prototype.emoji = function () {
    return parseEmoji(<string>this) as APIMessageComponentEmoji;
};

String.prototype.limit = function (option) {

    if (typeof option === "number")
        return this.slice(0, option);

    const limit = {
        MessageEmbedTitle: 256,
        MessageEmbedDescription: 4096,
        MessageEmbedFields: 25,
        MessageEmbedFieldName: 256,
        MessageEmbedFieldValue: 1024,
        MessageEmbedFooterText: 2048,
        MessageEmbedAuthorName: 256,
        MessageContent: 2000,
        AutocompleteName: 100,
        AutocompleteValue: 100,
        SelectMenuLabel: 100,
        SelectMenuPlaceholder: 150,
        SelectMenuDescription: 100,
        SelectMenuValue: 100,
        ButtonLabel: 80
    }[option] || this.length;

    if (this.length > limit)
        return `${this.slice(0, limit - 3)}...`;

    return this.slice(0, limit);
};