import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { broadcastToClients } from '../websocket/route'

interface DerivTick {
  tick: number
  quote: number
  epoch: number
}

let tickBuffer: DerivTick[] = []
const MAX_TICKS = 1000 // Maximum number of ticks to store

export async function POST(request: Request) {
  const headersList = headers()
  
  try {
    const data: DerivTick = await request.json()
    
    // Add new tick to buffer
    tickBuffer.push(data)
    
    // Remove oldest tick if buffer exceeds MAX_TICKS
    if (tickBuffer.length > MAX_TICKS) {
      tickBuffer.shift()
    }
    
    // Broadcast the new tick to all connected WebSocket clients
    broadcastToClients(data)
    
    // Return a success response
    return NextResponse.json({ 
      success: true, 
      message: 'Tick received and processed successfully' 
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error processing tick data' 
      },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Deriv-like tick data endpoint is active',
    currentTicks: tickBuffer.length
  })
}