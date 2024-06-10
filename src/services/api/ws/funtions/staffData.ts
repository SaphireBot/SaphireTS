import { Socket } from "socket.io-client";
import client from "../../../../saphire";

export default async function staffData(socket: Socket) {
    if (!socket?.connected) return;

    const tagsAndIds = {
        devs: ["451619591320371213", "395669252121821227", "920496244281970759", "435601052755296256", "648389538703736833"], // Rody, Gorniaky, Space, Lucaix, André
        admins: ["451619591320371213", "351903530161799178"], // Rody, Makol
        boards: ["395669252121821227", "648389538703736833"], // Gorniaky, André
        staff: ["854494598533742622", "611006830411251714", "781137239194468403", "830226550116057149", "327496267007787008", "144943581965189120", "435444989695229952", "674295513742442573"] // Akemy, Alli, Dspofu, Pepy, San, Serginho, Yafyr, Liege
    };

    const ids = Array.from(
        new Set(
            Object.values(tagsAndIds).flat()
        )
    );

    const staffers = await Promise.all(
        ids.map(id => client.users.fetch(id))
    )
        .then(users => users.filter(Boolean));

    for (const staff of staffers as any[]) {

        staff.avatarUrl = staff.avatarURL();

        staff.tags = [];
        if (tagsAndIds.devs.includes(staff.id)) staff.tags.push("developer");
        if (tagsAndIds.admins.includes(staff.id)) staff.tags.push("adminstrator");
        if (tagsAndIds.boards.includes(staff.id)) staff.tags.push("board of directors");
        if (tagsAndIds.staff.includes(staff.id)) staff.tags.push("staff");
        continue;
    }

    socket.send({ type: "siteStaffData", staffData: staffers });
    return staffers;
}