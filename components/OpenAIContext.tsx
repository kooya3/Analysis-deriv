'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { toast } from "@/components/ui/use-toast"

interface Model {
  label: string
  value: string
}

export const OPENAI_MODELS = [
  { label: 'GPT-4 Turbo', value: 'gpt-4-1106-preview' },
  { label: 'GPT-4', value: 'gpt-4' },
  { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
] as const

interface OpenAIContextType {
  apiKey: string
  model: Model
  isConfigured: boolean
  setApiKey: (key: string) => void
  setModel: (model: Model) => void
  validateConfiguration: () => Promise<boolean>
  makeOpenAIRequest: <T>(endpoint: string, payload: any) => Promise<T>
}

const OpenAIContext = createContext<OpenAIContextType | undefined>(undefined)

export function OpenAIProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState<Model>(OPENAI_MODELS[0])

  const validateConfiguration = useCallback(async () => {
    if (!apiKey) return false

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Invalid API key')
      }

      return true
    } catch (error) {
      console.error('API validation error:', error)
      return false
    }
  }, [apiKey])

  const makeOpenAIRequest = useCallback(async <T,>(endpoint: string, payload: any): Promise<T> => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key in settings.",
        variant: "destructive",
      })
      throw new Error('API key not configured')
    }

    try {
      const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model.value,
          ...payload,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'OpenAI API request failed')
      }

      return response.json()
    } catch (error) {
      console.error('OpenAI API error:', error)
      toast({
        title: "API Request Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      throw error
    }
  }, [apiKey, model])

  return (
    <OpenAIContext.Provider 
      value={{
        apiKey,
        model,
        isConfigured: Boolean(apiKey),
        setApiKey,
        setModel,
        validateConfiguration,
        makeOpenAIRequest,
      }}
    >
      {children}
    </OpenAIContext.Provider>
  )
}

export function useOpenAI() {
  const context = useContext(OpenAIContext)
  if (!context) {
    throw new Error('useOpenAI must be used within an OpenAIProvider')
  }
  return context
}