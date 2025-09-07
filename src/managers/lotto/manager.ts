import Database from "../../database";
import client from "../../saphire";

export default class Lotto {

  baseValue = 5000;
  users = new Set<string>();
  rawData = new Map<number, string[]>();
  usersWithReminderEnable = new Set<string>();

  declare nextDraw: Date;

  constructor() { }

  get totalPrize() {
    return Number(this.users.size * this.baseValue);
  }

  get nextMiddleDay(): Date {
    const now = new Date();
    const nextNoon = new Date(now);

    nextNoon.setHours(12, 0, 0, 0);

    if (now.getHours() >= 12)
      nextNoon.setDate(now.getDate() + 1);

    return nextNoon;
  }

  get randomNumber() {
    return Math.floor(Math.random() * 100) + 1;
  }

  userInBet(userId: string) {
    return this.users.has(userId);
  }

  userNumber(userId: string) {

    if (!this.userInBet(userId)) return 0;

    for (const [number, users] of this.rawData)
      if (users.find(id => id === userId))
        return number;

    return 0;
  }

  async load() {

    const clientData = await Database.getClientData();

    if (!clientData?.Lotto?.nextDraw)
      this.nextDraw = await this.setNextDrawDate();
    else this.nextDraw = clientData?.Lotto?.nextDraw;

    if (clientData?.Lotto?.reminderUsers)
      for (const userId of clientData.Lotto.reminderUsers)
        this.usersWithReminderEnable.add(userId);

    const data = await this.fetch();

    for (const { id, users } of data) {
      this.rawData.set(id, new Set(users).toArray());
      for (const user of users) this.users.add(user);
    }

    return await this.start();
  }

  async setNextDrawDate() {

    const document = await Database.Client.findOneAndUpdate(
      { id: client.user!.id },
      {
        $set: {
          "Lotto.nextDraw": this.nextMiddleDay,
        },
      },
      { upsert: true, new: true },
    );

    return document.Lotto?.nextDraw || this.nextMiddleDay;
  }

  async addUser(number: number, userId: string): Promise<boolean> {

    const balance = await Database.getBalance(userId);
    if (balance < this.baseValue) return false;

    await Database.editBalance(
      userId,
      {
        createdAt: new Date(),
        keywordTranslate: "lotto.transactions.loss",
        method: "sub",
        mode: "lotto",
        type: "loss",
        value: this.baseValue,
      },
    );

    const lotto = await Database.Lotto.findOneAndUpdate(
      { id: number },
      { $addToSet: { users: userId } },
      { upsert: true, new: true },
    );

    this.users.add(userId);
    this.rawData.set(lotto.id, lotto.users);
    return true;
  }

  async fetch() {
    return await Database.Lotto.find();
  }

  async start() {

    if (!this.nextDraw)
      this.nextDraw = await this.setNextDrawDate();

    const difference = this.nextDraw.getTime() - new Date().getTime();

    if (difference <= 0)
      return await this.draw();

    return setTimeout(async () => await this.draw(), difference);

  }

  async draw(): Promise<any> {

    const winNumber = this.randomNumber;
    const winLotto = (
      await Database.Lotto.findOne({ id: winNumber }).then(res => res?.toObject())
    ) || {
      id: winNumber,
      users: [],
    };

    if (!winLotto.users.length)
      return await this.setAccumulation(winNumber);

    const winPrize = parseInt(
      Number(this.totalPrize / winLotto.users.length)
        .toFixed(0),
    );

    this.users.clear();
    this.rawData.clear();
    this.usersWithReminderEnable.clear();
    this.nextDraw = this.nextMiddleDay;

    for await (const userId of winLotto.users)
      await Database.editBalance(
        userId,
        {
          createdAt: new Date(),
          keywordTranslate: "lotto.transactions.gain",
          method: "add",
          mode: "lotto",
          type: "system",
          value: winPrize,
        });

    await Database.Lotto.collection.drop();

    await Database.Client.updateOne(
      { id: client.user!.id },
      {
        $set: {
          Lotto: {
            lastPrize: winPrize,
            lastWinners: winLotto.users,
            lastNumber: winNumber,
            nextDraw: this.nextMiddleDay,
            reminderUsers: [],
          },
        },
      },
      { upsert: true },
    );

    await this.load();
  }

  async setAccumulation(lastNumber: number): Promise<any> {

    await Database.Client.updateOne(
      { id: client.user!.id },
      {
        $set: {
          "Lotto.lastPrize": 0,
          "Lotto.lastWinners": [],
          "Lotto.lastNumber": lastNumber,
          "Lotto.nextDraw": this.nextMiddleDay,
          "Lotto.reminderUsers": [],
        },
      },
      { upsert: true },
    );

  }

  async enableReminder(userId: string) {

    if (this.usersWithReminderEnable.has(userId)) return;

    await Database.Client.updateOne(
      { id: client.user!.id },
      { $addToSet: { "Lotto.reminderUsers": userId } },
      { upsert: true },
    );

    return this.usersWithReminderEnable.add(userId);

  }

};