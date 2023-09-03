/* eslint-disable react-hooks/rules-of-hooks */
'use client'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const socket = io(`http://localhost:8080`)

interface ITreatment {
  id: string
  isOpen: Boolean
  client: IUser
  clientId: string
  attendant: string | null
  Message: IMessage[]
  Department: IDepartment
  departmentId: string
}

interface IUser {
  id: string
  name: string
  login: string
  passwordHash: string
  isAttendant: boolean
  Department: IDepartment[]
  Treatment: ITreatment[]
}

interface IMessage {
  id?: string
  text: string
  sendName: string
  sendTo: string
  receivedName?: string
  receivedTo?: string
  Treatment?: ITreatment
  treatmentId: string
}

interface IDepartment {
  id: string
  name: string
  User: IUser[]
  Company: ICompany
  companyId: string
  Treatment: ITreatment[]
}

interface ICompany {
  id: string
  name: string
  Department: IDepartment[]
}

export default function Home() {
  const [myUser, setMyUser] = useState<IUser | null>(null)
  const [myOpenTreatments, setMyOpenTreatments] = useState<ITreatment[]>([])
  const [myDepartments, setMyDepartments] = useState<IDepartment[]>([])
  const [myMessages, setMyMessages] = useState<IMessage[]>([])
  const [myTreatmentsByDepartment, setMyTreatmentsByDepartment] = useState<
    ITreatment[]
  >([])

  const [currentDepartment, setCurrentDepartment] =
    useState<IDepartment | null>(null)
  const [currentTreatment, setCurrentTreatment] = useState<ITreatment | null>(
    null
  )

  const [registerName, setRegisterName] = useState<string | null>(null)
  const [registerLogin, setRegisterLogin] = useState<string | null>(null)
  const [registerPassword, setRegisterPassword] = useState<string | null>(null)

  const [authLogin, setAuthLogin] = useState<string | null>(null)
  const [authPassword, setAuthPassword] = useState<string | null>(null)

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
    async function find_Treatment_By_Id() {
      if (currentTreatment) {
        const res: ITreatment = await fetch(
          `http://localhost:8080/chat/treatments/${currentTreatment.id}`
        ).then((el) => el.json())

        setMyMessages(res.Message)

        socket.on(res.id, (message: IMessage) => {
          setMyMessages((prevMessages) => [...prevMessages, message])
        })

        return () => {
          socket.off(currentTreatment.id)
        }
      }
    }

    find_Treatment_By_Id()
  }, [currentTreatment])

  /// USE EFFECT PARA ATUALIZAR AS FILAS DE CONVERSA
  useEffect(() => {
    async function find_My_Treatments_In_Department() {
      if (updateDepartmentQueue && currentDepartment && myUser) {
        const myTreatments: ITreatment[] = await fetch(
          `http://localhost:8080/chat/treatments/department/${currentDepartment.id}/not/${myUser.id}`
        ).then(async (el) => el.json())

        const myOpenTreatments: ITreatment[] = await fetch(
          `http://localhost:8080/chat/treatments/department/${currentDepartment.id}/attendant/${myUser.id}`
        ).then((el) => el.json())

        setMyOpenTreatments(myOpenTreatments)
        setMyTreatmentsByDepartment(myTreatments)
        setUpdateDepartmentQueue(false)
      }
    }

    find_My_Treatments_In_Department()
  }, [updateDepartmentQueue, currentDepartment, myUser])

  async function createUser(): Promise<void> {
    if (
      typeof registerLogin === 'string' &&
      typeof registerName === 'string' &&
      typeof registerPassword === 'string'
    ) {
      const data: IUser = await fetch(`http://localhost:8080/chat/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          login: registerLogin,
          password: registerPassword,
        }),
      }).then((res) => res.json())

      setMyUser(data)
      setRegisterLogin(null)
      setRegisterName(null)
      setRegisterPassword(null)
    }
  }

  async function login(): Promise<void> {
    if (typeof authLogin === 'string' && typeof authPassword === 'string') {
      const data = await fetch(`http://localhost:8080/chat/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: authLogin, password: authPassword }),
      }).then((res) => res.json())

      setMyUser(data)
      setMyDepartments(data.Department)
      setAuthLogin(null)
      setAuthPassword(null)
    }
  }

  async function sendMessage(): Promise<void> {
    if (myUser && currentTreatment) {
      const data = await fetch(`http://localhost:8080/chat/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sendName: myUser.name,
          sendTo: myUser.id,
          treatmentId: currentTreatment.id,
        }),
      }).then((res) => res.json())

      socket.emit('msgToServer', data)
    }
  }

  async function openTreatment(): Promise<void> {
    if (myUser && currentDepartment) {
      const data: ITreatment = await fetch(
        `http://localhost:8080/chat/toMeet`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: myUser.id,
            departmentId: currentDepartment.id,
          }),
        }
      ).then((res) => res.json())

      setCurrentTreatment(data)
      setMyOpenTreatments([...myOpenTreatments, data])
      socket.emit('msgToServer', { departmentId: currentDepartment.id })
    }
  }

  async function receivedTreatment(treatmentId: string): Promise<void> {
    if (myUser) {
      const data: ITreatment = await fetch(
        `http://localhost:8080/chat/toMeetReceived`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ treatmentId, attendantId: myUser.id }),
        }
      ).then((res) => res.json())

      setCurrentTreatment(data)
      setMyMessages(data.Message)
      setMyOpenTreatments([...myOpenTreatments, data])
      setUpdateDepartmentQueue(true)
      socket.emit('msgToServer', { departmentId: data.departmentId })
    }
  }

  async function closedTreatment(treatmentId: string): Promise<void> {
    const data: ITreatment = await fetch(`http://localhost:8080/chat/closed`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ treatmentId }),
    }).then((res) => res.json())

    const removeTreatment = myOpenTreatments.filter(
      (treatment) => treatment.id !== treatmentId
    )

    setUpdateDepartmentQueue(true)
    setMyOpenTreatments(removeTreatment)
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
              <input
                type="text"
                placeholder="password"
                value={registerPassword || ''}
                onChange={(el) => setRegisterPassword(el.target.value)}
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
                value={authLogin || ''}
                onChange={(el) => setAuthLogin(el.target.value)}
              />
              <input
                type="text"
                placeholder="password"
                value={authPassword || ''}
                onChange={(el) => setAuthPassword(el.target.value)}
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
            openTreatment()
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
              {myOpenTreatments?.map((treatment, i) => (
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
                    {treatment.client?.name}
                  </span>

                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault()
                      closedTreatment(treatment.id)
                    }}
                  >
                    Finalizar
                  </span>

                  <span
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentTreatment(treatment)
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
              {myTreatmentsByDepartment?.map((treatment, i) => {
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
                    <span>{treatment.client?.name}</span>
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentTreatment(treatment)
                        receivedTreatment(`${treatment.id}`)
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
            <h2 style={{ textAlign: 'center' }}>{currentTreatment?.id}</h2>
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
                  if (message.sendTo === myUser?.id) {
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
                  sendMessage()
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
