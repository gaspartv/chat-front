import { IChat } from "./chat.interface"

export interface IMessage {
  id?: string
  text: string
  sendName: string
  sendId: string
  receivedName?: string
  receivedId?: string
  Chat?: IChat
  chatId: string
}
