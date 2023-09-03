import { IChat } from './chat.interface'
import { ICompany } from './company.interface'
import { IUser } from './user.interface'

export interface IDepartment {
  id: string
  name: string
  Users: IUser[]
  Company: ICompany
  companyId: string
  Chats: IChat[]
}
