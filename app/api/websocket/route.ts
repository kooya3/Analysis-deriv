import { WebSocketServer } from 'ws'
import { NextResponse } from 'next/server'
import type { WebSocket } from 'ws'

interface DerivTick {
  tick: number
  quote: number
  epoch: number
}

let wss: WebSocketServer | null = null
const clients = new Set<WebSocket>()

if (!wss) {
  wss = new WebSocketServer({ port: 8080 })

  wss.on('connection', (ws) => {
    clients.add(ws)
    
    ws.on('message', (message) => {
      console.log('Received message:', message)
    })
    
    ws.on('close', () => {
      clients.delete(ws)
    })
  })
}

export function broadcastToClients(data: DerivTick) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data))
    }
  })
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Deriv-like WebSocket server is running',
    clients: clients.size
  })
}