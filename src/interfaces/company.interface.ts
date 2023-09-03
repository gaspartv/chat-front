import { IDepartment } from './department.interface'

export interface ICompany {
  id: string
  name: string
  Departments: IDepartment[]
}
