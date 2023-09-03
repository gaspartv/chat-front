/* eslint-disable react-hooks/rules-of-hooks */
'use client'
import { IChat } from '@/interfaces/chat.interface'
import { IDepartment } from '@/interfaces/department.interface'
import { IMessage } from '@/interfaces/message.interface'
import { IUser } from '@/interfaces/user.interface'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io(`http://localhost:8081`)

export default function Home() {
  const [myUser, setMyUser] = useState<IUser | null>(null)
  const [myOpenChats, setMyOpenChats] = useState<IChat[]>([])
  const [myDepartments, setMyDepartments] = useState<IDepartment[]>([])
  const [myMessages, setMyMessages] = useState<IMessage[]>([])
  const [myChatsByDepartment, setMyChatsByDepartment] = useState<IChat[]>([])

  const [currentDepartment, setCurrentDepartment] =
    useState<IDepartment | null>(null)
  const [currentChat, setCurrentChat] = useState<IChat | null>(null)

  const [registerName, setRegisterName] = useState<string | null>(null)
  const [registerLogin, setRegisterLogin] = useState<string | null>(null)

  const [authLogin, setAuthLogin] = useState<string | null>(null)

  const [text, setText] = useState<string>('')

  const [updateDepartmentQueue, setUpdateDepartmentQueue] =
    useState<boolean>(true)

  /// SOCKET IO PARA TRANSFERÊNCIA DE DADOS DO DEPARTAMENTO
  useEffect(() => {
    if (currentDepartment) {
      socket.off(currentDepartment.id)

      socket.on(currentDepartment.id, (message: any) => {
        if (message) setUpdateDepartmentQueue(true)
      })

      return () => {
        socket.off(currentDepartment.id)
      }
    }
  }, [currentDepartment])

  /// SOCKET IO PARA TRANSFERÊNCIA DE DADOS DO ATENDIMENTO
  useEffect(() => {
    async function find_chat() {
      if (currentChat) {
        const res: IChat = await fetch(
          `http://localhost:8080/api/chat/${currentChat.id}`
        ).then((el) => el.json())

        setMyMessages(res.Messages)

        socket.on(res.id, (message: IMessage) => {
          setMyMessages((prevMessages) => [...prevMessages, message])
        })

        return () => {
          socket.off(currentChat.id)
        }
      }
    }

    find_chat()
  }, [currentChat])

  /// USE EFFECT PARA ATUALIZAR AS FILAS DE CONVERSA
  useEffect(() => {
    async function find_my_chats_in_department() {
      if (updateDepartmentQueue && currentDepartment && myUser) {
        const myChats: IChat[] = await fetch(
          `http://localhost:8080/api/chat/department/${currentDepartment.id}/notAttendant/${myUser.id}`
        ).then(async (el) => el.json())

        const myOpenChats: IChat[] = await fetch(
          `http://localhost:8080/api/chat/department/${currentDepartment.id}/attendant/${myUser.id}`
        ).then((el) => el.json())

        setMyOpenChats(myOpenChats)
        setMyChatsByDepartment(myChats)
        setUpdateDepartmentQueue(false)
      }
    }

    find_my_chats_in_department()
  }, [updateDepartmentQueue, currentDepartment, myUser])

  async function create_user(): Promise<void> {
    if (typeof registerLogin === 'string' && typeof registerName === 'string') {
      const data: IUser = await fetch(`http://localhost:8080/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          login: registerLogin,
        }),
      }).then((res) => res.json())

      setMyUser(data)
      setRegisterLogin(null)
      setRegisterName(null)
    }
  }

  async function login(): Promise<void> {
    if (typeof authLogin === 'string') {
      const data: IUser = await fetch(`http://localhost:8080/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: authLogin }),
      }).then((res) => res.json())

      setMyUser(data)
      setMyDepartments(data.Departments)
      setAuthLogin(null)
    }
  }

  async function send_message(): Promise<void> {
    if (myUser && currentChat) {
      const data: IMessage = await fetch(
        `http://localhost:8080/api/message/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sendName: myUser.name,
            sendId: myUser.id,
            chatId: currentChat.id,
          }),
        }
      ).then((res) => res.json())

      socket.emit('msgToServer', data)
    }
  }

  async function open_chat(): Promise<void> {
    if (myUser && currentDepartment) {
      const data: IChat = await fetch(`http://localhost:8080/api/chat/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: myUser.id,
          departmentId: currentDepartment.id,
        }),
      }).then((res) => res.json())

      setCurrentChat(data)
      setMyOpenChats([...myOpenChats, data])
      socket.emit('msgToServer', { departmentId: currentDepartment.id })
    }
  }

  async function answer_chat(chatId: string): Promise<void> {
    if (myUser) {
      const data: IChat = await fetch(`http://localhost:8080/api/chat/answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, attendantId: myUser.id }),
      }).then((res) => res.json())

      setCurrentChat(data)
      setMyMessages(data.Messages)
      setMyOpenChats([...myOpenChats, data])
      setUpdateDepartmentQueue(true)
      socket.emit('msgToServer', { departmentId: data.departmentId })
    }
  }

  async function close_chat(chatId: string): Promise<void> {
    const data: IChat = await fetch(`http://localhost:8080/api/chat/close`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId }),
    }).then((res) => res.json())

    const removeChat = myOpenChats.filter((chat) => chat.id !== chatId)

    setUpdateDepartmentQueue(true)
    setMyOpenChats(removeChat)
    socket.emit('msgToServer', { departmentId: data.departmentId })
  }

  return (
    <body>
      <header
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
        }}
      >
        <div>
          <strong>User:</strong> {myUser?.name}
          <br />
          <strong>UserId:</strong> {myUser?.id}
          <br />
          <strong>DepartmentId:</strong> {currentDepartment?.id}
          <br />
          <strong>Department:</strong> {currentDepartment?.name}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: '15px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              maxWidth: '250px',
              backgroundColor: '#dbf3ff',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <h3 style={{ textAlign: 'center' }}>Created new user</h3>
            <form
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
              }}
            >
              <input
                type="text"
                placeholder="name"
                value={registerName || ''}
                onChange={(el) => setRegisterName(el.target.value)}
              />
              <input
                type="text"
                placeholder="login"
                value={registerLogin || ''}
                onChange={(el) => setRegisterLogin(el.target.value)}
              />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  create_user()
                }}
              >
                Create
              </button>
            </form>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              maxWidth: '250px',
              backgroundColor: '#dbf3ff',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <h3 style={{ textAlign: 'center' }}>Login</h3>
            <form
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
              }}
            >
              <input
                type="text"
                placeholder="login"
                value={authLogin || ''}
                onChange={(el) => setAuthLogin(el.target.value)}
              />
              <button
                onClick={(el) => {
                  el.preventDefault()
                  login()
                }}
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          gap: '25px',
          justifyContent: 'center',
          marginTop: '75px',
        }}
      >
        <button
          onClick={(el) => {
            el.preventDefault()
            open_chat()
          }}
        >
          Solicitar atendimento
        </button>

        {myDepartments?.map((el, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault()
              setUpdateDepartmentQueue(true)
              setCurrentDepartment(null)
              setCurrentDepartment(el)
            }}
          >
            {el.name}
          </button>
        ))}
      </div>

      <main
        style={{
          display: 'flex',
          gap: '25px',
          justifyContent: 'center',
          marginTop: '75px',
          marginBottom: '75px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '25px',
            justifyContent: 'center',
            backgroundColor: '#00c7ff',
            borderRadius: '6px',
            padding: '6px',
            width: '40%',
          }}
        >
          <div>
            <h2 style={{ textAlign: 'center' }}>Conversas abertas</h2>
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '90%',
                gap: '4px',
              }}
            >
              {myOpenChats?.map((chat, i) => (
                <p
                  key={i}
                  style={{
                    backgroundColor: '#bff1ff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    borderRadius: '6px',
                    gap: '9px',
                  }}
                >
                  <span style={{ width: '100%' }}>
                    {chat.Client?.name}
                  </span>

                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault()
                      close_chat(chat.id)
                    }}
                  >
                    Finalizar
                  </span>

                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentChat(chat)
                    }}
                  >
                    Ver
                  </span>
                </p>
              ))}
            </span>
          </div>
          <div>
            <h2 style={{ textAlign: 'center' }}>Conversas em espera</h2>
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '90%',
                gap: '4px',
              }}
            >
              {myChatsByDepartment?.map((treatment, i) => {
                return (
                  <p
                    key={i}
                    style={{
                      backgroundColor: '#bff1ff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '6px',
                    }}
                  >
                    <span>{treatment.Client?.name}</span>
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentChat(treatment)
                        answer_chat(`${treatment.id}`)
                      }}
                    >
                      Atender
                    </span>
                  </p>
                )
              })}
            </span>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '25px',
            justifyContent: 'center',
            backgroundColor: '#00c7ff',
            borderRadius: '6px',
            padding: '6px',
            width: '40%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignContent: 'space-between',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <h2 style={{ textAlign: 'center' }}>{currentChat?.id}</h2>
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '90%',
                gap: '4px',
              }}
            >
              {myMessages
                ?.filter((message: IMessage, index: any, self: any) => {
                  return self.indexOf(message) === index
                })
                .map((message, i) => {
                  if (message.sendId === myUser?.id) {
                    return (
                      <p
                        key={i}
                        style={{
                          textAlign: 'end',
                          backgroundColor: '#bff1ff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          padding: '12px',
                          borderRadius: '6px',
                          gap: '3px',
                        }}
                      >
                        <span style={{ fontWeight: 'bold' }}>
                          {myUser.name}
                        </span>
                        <span>{message.text}</span>
                      </p>
                    )
                  }
                  return (
                    <p
                      key={i}
                      style={{
                        textAlign: 'start',
                        backgroundColor: '#bff1ff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '12px',
                        borderRadius: '6px',
                        gap: '3px',
                      }}
                    >
                      <span style={{ fontWeight: 'bold' }}>
                        {message.sendName}
                      </span>
                      <span>{message.text}</span>
                    </p>
                  )
                })}
            </span>
          </div>
          <div>
            <form
              style={{
                display: 'flex',
                gap: '12px',
              }}
            >
              <input
                type="text"
                style={{
                  display: 'flex',
                  width: '100%',
                  padding: '6px',
                  borderRadius: '6px',
                }}
                onChange={(el) => setText(el.target.value)}
              />
              <button
                onClick={(el) => {
                  el.preventDefault()
                  send_message()
                }}
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </main>
    </body>
  )
}
