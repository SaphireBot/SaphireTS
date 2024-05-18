import { Socket } from "socket.io-client";
import { urls } from "../../../../util/constants";

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

    return await fetch(`${urls.saphireApiUrl}/getusers/?${ids.map(id => `id=${id}`).join("&")}`)
        .then(res => res.json())
        .then(res => {

            for (const staff of (res as any[])) {

                staff.avatarUrl = staff.avatar
                    && `https://cdn.discordapp.com/avatars/${staff.id}/${staff?.avatar}.${staff.avatar.includes("a_") ? "gif" : "png"}`;

                staff.tags = [];
                if (tagsAndIds.devs.includes(staff.id)) staff.tags.push("developer");
                if (tagsAndIds.admins.includes(staff.id)) staff.tags.push("adminstrator");
                if (tagsAndIds.boards.includes(staff.id)) staff.tags.push("board of directors");
                if (tagsAndIds.staff.includes(staff.id)) staff.tags.push("staff");
                continue;
            }

            socket.send({ type: "siteStaffData", staffData: res });
            return res;
        })
        .catch(err => console.log("siteStaffData", err));

}