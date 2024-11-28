'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Eye, EyeOff, Settings, Wand2Icon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useOpenAI, OPENAI_MODELS } from '@/contexts/OpenAIContext'

export function SettingsDialog() {
  const { apiKey, model, setApiKey, setModel, validateConfiguration } = useOpenAI()
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [open, setOpen] = useState(false)
  const [openModel, setOpenModel] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)

    try {
      const isValid = await validateConfiguration()
      
      if (isValid) {
        setApiKey(tempApiKey)
        setOpen(false)
        toast({
          title: "Settings saved",
          description: "Your API key has been validated and saved for this session.",
        })
      } else {
        toast({
          title: "Invalid API key",
          description: "Please check your API key and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate API key. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          className={cn(
            'fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full',
            'group overflow-hidden shadow-md hover:shadow-lg',
            'transition-all duration-300 ease-in-out hover:w-[106px]'
          )}
        >
          <div className="flex h-full w-full items-center justify-start gap-2">
            <Settings className="ml-1.5 h-4 w-4" />
            <span className="whitespace-nowrap opacity-0 transition-all duration-300 group-hover:opacity-100">
              Settings
            </span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenAI API key and model preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                <Wand2Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold">OpenAI Configuration</h4>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Enter your OpenAI API key"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showKey ? "Hide" : "Show"} API key
                  </span>
                </Button>
              </div>

              <div className="relative space-y-1">
                <label className="text-sm font-medium">
                  Model
                </label>
                <Popover open={openModel} onOpenChange={setOpenModel}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openModel}
                      className="w-full justify-between"
                    >
                      {model.label}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search models..." />
                      <CommandEmpty>No model found.</CommandEmpty>
                      <CommandGroup>
                        {OPENAI_MODELS.map((m) => (
                          <CommandItem
                            key={m.value}
                            onSelect={() => {
                              setModel(m)
                              setOpenModel(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                model.value === m.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {m.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isValidating || !tempApiKey}
          >
            {isValidating ? "Validating..." : "Save Settings"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Your API key is only stored in memory and will be cleared when you close the browser.
        </p>
      </DialogContent>
    </Dialog>
  )
}