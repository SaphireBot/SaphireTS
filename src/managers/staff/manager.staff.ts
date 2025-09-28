import Database from "../../database";
import { ClientSchemaType } from "../../database/schemas/client";
import client from "../../saphire";

export default class GlobalStaffManager {

  developersIds = new Set<string>();
  administratorsIds = new Set<string>();
  moderatorsIds = new Set<string>();

  constructor() { }

  async load() {

    const data = await Database.Client.findOne({ id: client.user!.id });
    if (!data) return;

    this.setCache(data);
    await client.getOwnerID();
    return;
  }

  async set(
    role: "Developers" | "Administradores" | "Moderadores",
    usersId: string[],
  ) {
    if (!Array.isArray(usersId) || !role) return;

    const data = await Database.Client.findOneAndUpdate(
      { id: client.user!.id },
      { $addToSet: { [role]: { $in: usersId } } },
      { new: true, upsert: true },
    )
      .catch(() => null);

    if (!data) return;
    this.setCache(data);
    return this[role];
  }

  async remove(
    role: "Developers" | "Administradores" | "Moderadores",
    usersId: string[],
  ) {
    if (!Array.isArray(usersId) || !role) return;

    const data = await Database.Client.findOneAndUpdate(
      { id: client.user!.id },
      { $pull: { [role]: { $in: usersId } } },
      { new: true, upsert: true },
    )
      .catch(() => null);

    if (!data) return;
    this.setCache(data);
    return this[role];
  }

  isOwner(userId: string) {
    return userId === client.ownerId;
  }

  isDev(userId: string) {
    return this.isOwner(userId)
      || this.developersIds.has(userId);
  }

  isAdmin(userId: string) {
    return this.isDev(userId)
      || this.administratorsIds.has(userId);
  }

  isMod(userId: string) {
    return this.isAdmin(userId)
      || this.moderatorsIds.has(userId);
  }

  isStaff(userId: string) {
    return [
      this.Developers,
      this.Administradores,
      this.Moderadores,
    ]
      .flat()
      .includes(userId);
  }

  get Developers(): string[] {
    return Array.from(this.developersIds);
  }

  get Administradores(): string[] {
    return Array.from(this.administratorsIds);
  }

  get Moderadores(): string[] {
    return Array.from(this.moderatorsIds);
  }

  private setCache(data: ClientSchemaType) {
    this.developersIds.clear();
    this.administratorsIds.clear();
    this.moderatorsIds.clear();

    for (const id of (data?.Developers || []))
      this.developersIds.add(id);

    for (const id of (data?.Administradores || []))
      this.administratorsIds.add(id);

    for (const id of (data?.Moderadores || []))
      this.moderatorsIds.add(id);
  }

  async setRebootMessage(reason?: string) {
    await Database.Client.updateOne(
      { id: client.user!.id },
      {
        $set: {
          rebooting: {
            started: true,
            reason: reason || "No reason given",
            webhooks: [],
          },
        },
      },
    );

  }
}