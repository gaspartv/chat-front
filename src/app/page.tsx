/* eslint-disable react-hooks/rules-of-hooks */
'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io(`http://localhost:8080`)

interface IChat {
  name: string
  message: string
  isClient: boolean
}

interface IConversation {
  id: string
  isOpen: boolean
  departmentId: string
  Message: []
  Users: []
}

export default function Home() {
  const [countAttTreatments, setCountAttTreatments] = useState(0)

  const [department, setDepartment] = useState('Global')

  const [openConversations, setOpenConversations] = useState<IConversation[]>(
    []
  )
  const [conversationsOnHold, setConversationsOnHold] = useState<
    IConversation[]
  >([])

  const [chat, setChat] = useState<
    {
      name: string
      message: string
      isClient: boolean
    }[]
  >([])
  const [message, setMessage] = useState<string>('')

  const [loginState, setLoginState] = useState('')
  const [passwordState, setPasswordState] = useState('')

  const [userName, setUserName] = useState('')
  const [userLogin, setUserLogin] = useState('')
  const [userPassword, setUserPassword] = useState('')

  const [user, setUser] = useState<{
    id: string
    name: string
    login: string
    Department: [
      {
        id: string
        name: string
        companyId: string
      }
    ]
    Treatment: []
  }>()

  async function handleLogin() {
    try {
      const dataToSend = {
        login: loginState,
        password: passwordState,
      }

      const data = await fetch('http://localhost:8080/chat/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      }).then((el) => el.json())

      setUser(data)
    } catch (error) {
      alert(error)
    }
  }

  async function createUser() {
    try {
      const dataToSend = {
        name: userName,
        login: userLogin,
        password: userPassword,
      }

      const data = await fetch('http://localhost:8080/chat/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      }).then((el) => el.json())

      setUser(data)
    } catch (error) {
      alert(error)
    }
  }

  useEffect(() => {
    async function findAllTreatments() {
      try {
        const res1 = await fetch('http://localhost:8080/chat/treatments').then(
          (el) => el.json()
        )
        const res2 = await fetch(
          'http://localhost:8080/chat/treatments/my'
        ).then((el) => el.json())

        setConversationsOnHold(res1)
        setOpenConversations(res2)
      } catch (error) {
        console.error(error)
      }
    }
    setTimeout(() => {
      findAllTreatments()
      setCountAttTreatments(countAttTreatments + 1)
    }, 5000)
  }, [countAttTreatments])

  useEffect(() => {
    socket.off(department)

    socket.on(department, (message) => {
      setChat((prevMessages) => [...prevMessages, message])
    })

    return () => {
      socket.off(department)
    }
  }, [department])

  async function requestService() {
    const dataToSend = {
      clientId: user?.id,
    }

    try {
      const res = await fetch('http://localhost:8080/chat/toMeet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      }).then((el) => el.json())

      setDepartment(res.id)
    } catch (error) {
      alert(error)
    }
  }

  async function requestReceivedService(treatmentId: string) {
    const dataToSend = {
      treatmentId,
      attendantId: user?.id,
    }

    try {
      const res = await fetch('http://localhost:8080/chat/toMeetReceived', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      }).then((el) => el.json())

      setDepartment(res.id)
    } catch (error) {
      alert(error)
    }
  }

  async function closedTreatment(treatmentId: string) {
    const dataToSend = {
      treatmentId,
    }

    try {
      const res = await fetch('http://localhost:8080/chat/closed', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      }).then((el) => el.json())

      setDepartment('Global')
    } catch (error) {
      alert(error)
    }
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
          <strong>User:</strong> {user?.name}
          <br />
          <strong>UserId:</strong> {user?.id}
          <br />
          <strong>CompanyId:</strong> {user?.Department[0]?.companyId}
          <br />
          <strong>DepartmentId:</strong> {user?.Department[0]?.id}
          <br />
          <strong>Department:</strong> {user?.Department[0]?.name}
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
                onChange={(el) => setUserName(el.target.value)}
              />
              <input
                type="text"
                placeholder="login"
                onChange={(el) => setUserLogin(el.target.value)}
              />
              <input
                type="text"
                placeholder="password"
                onChange={(el) => setUserPassword(el.target.value)}
              />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  createUser()
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
                onChange={(el) => setLoginState(el.target.value)}
              />
              <input
                type="text"
                placeholder="password"
                onChange={(el) => setPasswordState(el.target.value)}
              />
              <button
                onClick={(el) => {
                  el.preventDefault()
                  handleLogin()
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
            requestService()
          }}
        >
          Solicitar atendimento
        </button>
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
              {openConversations.map((el, i) => (
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
                  <span>{el.id}</span>
                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault()
                      closedTreatment(el.id)
                    }}
                  >
                    Finalizar
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
              {conversationsOnHold?.map((el, i) => {
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
                    <span>{el.id}</span>
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault()
                        setDepartment(`${el.id}`)
                        requestReceivedService(`${el.id}`)
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
            <h2 style={{ textAlign: 'center' }}>{department}</h2>
            <span
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '90%',
                gap: '4px',
              }}
            >
              {chat.map((el, i) => {
                if (el.name !== user?.name) {
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
                      <span style={{ fontWeight: 'bold' }}>{el.name}</span>
                      <span>{el.message}</span>
                    </p>
                  )
                }
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
                    <span style={{ fontWeight: 'bold' }}>{el.name}</span>
                    <span>{el.message}</span>
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
                onChange={(el) => setMessage(el.target.value)}
              />
              <button
                onClick={(el) => {
                  el.preventDefault()
                  socket.emit('msgToServer', {
                    name: user?.name || 'Anônimo',
                    message: message,
                    department: department,
                  })
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
