export default function check(data: Record<string, "👊" | "🤚" | "✌️">) {

    const clicks = Object.entries(data);
    if (clicks[0][1] === clicks[1][1]) return "draw";

    const variables = [
        ["👊", "✌️"],
        ["🤚", "👊"],
        ["✌️", "🤚"]
    ];

    for (const conditional of variables)
        if (
            conditional[0] === clicks[0][1]
            && conditional[1] === clicks[1][1]
        ) return clicks[0];

    return clicks[1];
}