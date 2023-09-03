export const metadata = {
  title: 'Chat',
  description: 'Developer Diego Gaspar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt_br">
      <body>{children}</body>
    </html>
  )
}
