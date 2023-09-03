export interface ILogin {
  login: string
  password: string
}

export async function handleLogin({ login, password }: ILogin) {
  return await fetch('http://localhost:8080/chat/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login, password }),
  }).then((el) => el.json())
}
