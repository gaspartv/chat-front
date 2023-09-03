import { IChat } from './chat.interface'
import { IDepartment } from './department.interface'

export interface IUser {
  id: string
  name: string
  login: string
  isAttendant: boolean
  Departments: IDepartment[]
  Treatment: IChat[]
}
