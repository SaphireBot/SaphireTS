import { Client } from "discord.js"
import { saphireClientOptions } from "../util/client"

export default class Saphire extends Client {
    constructor() {
        super(saphireClientOptions)
    }

    
}