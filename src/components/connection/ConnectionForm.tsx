import { useState } from 'react'
import { Wifi, WifiOff, Send, Sun, Moon, Settings, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useConnectionStore } from '@/stores/connectionStore'
import { useMqtt } from '@/hooks/useMqtt'
import { cn } from '@/lib/utils'

interface ConnectionFormProps {
  onPublishClick: () => void
  onToggleTheme: () => void
}

export function ConnectionForm({ onPublishClick, onToggleTheme }: ConnectionFormProps) {
  const { config, status, setConfig } = useConnectionStore()
  const { connect, disconnect } = useMqtt()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState(config)
  const [showPassword, setShowPassword] = useState(false)

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  const handleConnectToggle = () => {
    if (isConnected || isConnecting) {
      disconnect()
    } else {
      connect()
    }
  }

  const handleSaveSettings = () => {
    setConfig(localConfig)
    setSettingsOpen(false)
  }

  const statusColor = {
    connected: 'text-green-400',
    connecting: 'text-yellow-400',
    disconnected: 'text-muted-foreground',
    error: 'text-red-400',
  }[status]

  const statusDotColor = {
    connected: 'bg-green-400',
    connecting: 'bg-yellow-400 animate-pulse',
    disconnected: 'bg-gray-500',
    error: 'bg-red-400',
  }[status]

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <Wifi className="h-5 w-5 text-primary" />
        <span className="font-bold text-sm text-foreground">MQTT Explorer</span>
      </div>

      {/* Broker URL input */}
      <div className="flex-1 max-w-sm">
        <Input
          value={config.url}
          onChange={(e) => setConfig({ url: e.target.value })}
          placeholder="ws://broker:9001"
          className="h-8 text-xs font-mono"
          disabled={isConnected || isConnecting}
        />
      </div>

      {/* Status indicator */}
      <div className={cn('flex items-center gap-1.5 text-xs', statusColor)}>
        <div className={cn('h-2 w-2 rounded-full', statusDotColor)} />
        <span className="capitalize hidden sm:inline">{status}</span>
      </div>

      {/* Connect/Disconnect */}
      <Button
        size="sm"
        variant={isConnected ? 'destructive' : 'default'}
        onClick={handleConnectToggle}
        disabled={isConnecting}
        className="h-8 text-xs"
      >
        {isConnected ? (
          <><WifiOff className="h-3.5 w-3.5" /><span className="hidden sm:inline">Disconnect</span></>
        ) : isConnecting ? (
          <><span className="animate-pulse">Connecting...</span></>
        ) : (
          <><Wifi className="h-3.5 w-3.5" /><span className="hidden sm:inline">Connect</span></>
        )}
      </Button>

      {/* Publish button */}
      <Button
        size="sm"
        variant="outline"
        onClick={onPublishClick}
        disabled={!isConnected}
        className="h-8 text-xs"
      >
        <Send className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Publish</span>
      </Button>

      {/* Settings */}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 ml-auto"
        onClick={() => {
          setLocalConfig(config)
          setSettingsOpen(true)
        }}
      >
        <Settings className="h-4 w-4" />
      </Button>

      {/* Theme toggle */}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={onToggleTheme}
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="h-4 w-4 hidden dark:block" />
      </Button>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connection Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="url">Broker URL (WebSocket)</Label>
              <Input
                id="url"
                value={localConfig.url}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="ws://localhost:9001"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Use ws:// or wss:// for WebSocket connections</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={localConfig.clientId}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder="Leave empty for auto-generated ID"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username (optional)</Label>
              <Input
                id="username"
                value={localConfig.username || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password (optional)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={localConfig.password || ''}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Password"
                  className="pr-9"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(prev => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="keepAlive">Keep Alive (seconds)</Label>
              <Input
                id="keepAlive"
                type="number"
                value={localConfig.keepAlive}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, keepAlive: Number(e.target.value) }))}
                min={0}
                max={65535}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="cleanSession">Clean Session</Label>
              <Switch
                id="cleanSession"
                checked={localConfig.cleanSession}
                onCheckedChange={(checked) => setLocalConfig(prev => ({ ...prev, cleanSession: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings}>Save & Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
