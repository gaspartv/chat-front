export interface ICreateUser {
  name: string
  login: string
  password: string
}

export async function handleCreateUser({ login, name, password }: ICreateUser) {
  return await fetch('http://localhost:8080/chat/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, login, password }),
  }).then((el) => el.json())
}
