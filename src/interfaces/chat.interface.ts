import { IDepartment } from './department.interface'
import { IMessage } from './message.interface'
import { IUser } from './user.interface'

export interface IChat {
  id: string
  isOpen: Boolean
  Client: IUser
  clientId: string
  attendantId: string | null
  Messages: IMessage[]
  Department: IDepartment
  departmentId: string
}
