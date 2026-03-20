import { useState } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainPanel } from '@/components/layout/MainPanel'
import { StatusBar } from '@/components/layout/StatusBar'
import { ConnectionForm } from '@/components/connection/ConnectionForm'
import { PublishForm } from '@/components/publish/PublishForm'
import { Toaster } from '@/components/ui/toaster'
import { useMqttListeners } from '@/hooks/useMqtt'

// Wire up MQTT listeners to stores exactly once at app root.
function MqttInitializer() {
  useMqttListeners()
  return null
}

export default function App() {
  const [publishOpen, setPublishOpen] = useState(false)
  const [isDark, setIsDark] = useState(true)

  return (
    <div className={isDark ? 'dark' : 'light'} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <MqttInitializer />
      <div className="bg-background text-foreground flex flex-col h-full">
        <ConnectionForm
          onPublishClick={() => setPublishOpen(true)}
          onToggleTheme={() => setIsDark(!isDark)}
        />
        <div className="flex-1 overflow-hidden">
          <PanelGroup direction="horizontal" className="h-full">
            <Panel defaultSize={22} minSize={15} maxSize={35}>
              <Sidebar />
            </Panel>
            <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors cursor-col-resize" />
            <Panel>
              <MainPanel />
            </Panel>
          </PanelGroup>
        </div>
        <StatusBar />
        <PublishForm open={publishOpen} onClose={() => setPublishOpen(false)} />
        <Toaster />
      </div>
    </div>
  )
}
