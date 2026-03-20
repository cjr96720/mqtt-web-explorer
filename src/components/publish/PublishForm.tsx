import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { Send, Clock, CheckCircle2, AlertCircle, Repeat, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMqtt } from '@/hooks/useMqtt'
import { useTopicStore } from '@/stores/topicStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { PublishRecord } from '@/types/mqtt'
import { cn } from '@/lib/utils'

interface PublishFormProps {
  open: boolean
  onClose: () => void
}

export function PublishForm({ open, onClose }: PublishFormProps) {
  const { publish } = useMqtt()
  const { topicTree } = useTopicStore()
  const { status } = useConnectionStore()

  const [topic, setTopic] = useState('')
  const [payload, setPayload] = useState('')
  const [qos, setQos] = useState<'0' | '1' | '2'>('0')
  const [retain, setRetain] = useState(false)
  const [history, setHistory] = useState<PublishRecord[]>([])
  const [publishState, setPublishState] = useState<
    | { status: 'idle' }
    | { status: 'publishing' }
    | { status: 'success'; topic: string; ack: boolean; qos: number }
    | { status: 'error'; message: string }
  >({ status: 'idle' })

  // Continuous publish state
  const [continuousEnabled, setContinuousEnabled] = useState(false)
  const [intervalSec, setIntervalSec] = useState('1')
  const [durationSec, setDurationSec] = useState('10')
  const [continuousState, setContinuousState] = useState<
    | { running: false }
    | { running: true; sent: number; elapsed: number }
  >({ running: false })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const isConnected = status === 'connected'

  const allTopics = useMemo(() => {
    const result: string[] = []
    const collect = (tree: typeof topicTree) => {
      tree.forEach(node => {
        result.push(node.fullPath)
        collect(node.children)
      })
    }
    collect(topicTree)
    return result
  }, [topicTree])

  const stopContinuous = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (tickRef.current) clearInterval(tickRef.current)
    intervalRef.current = null
    timeoutRef.current = null
    tickRef.current = null
    setContinuousState({ running: false })
  }, [])

  // Clean up on unmount or dialog close
  useEffect(() => {
    if (!open) stopContinuous()
  }, [open, stopContinuous])

  // Stop continuous publish on disconnect
  useEffect(() => {
    if (!isConnected) stopContinuous()
  }, [isConnected, stopContinuous])

  useEffect(() => {
    return () => stopContinuous()
  }, [stopContinuous])

  const handlePublish = async () => {
    if (!topic.trim() || !isConnected) return

    const qosNum = Number(qos) as 0 | 1 | 2
    setPublishState({ status: 'publishing' })

    try {
      const result = await publish(topic.trim(), payload, qosNum, retain)

      const record: PublishRecord = {
        id: crypto.randomUUID(),
        topic: topic.trim(),
        payload,
        qos: qosNum,
        retain,
        timestamp: Date.now(),
      }
      setHistory(prev => [record, ...prev].slice(0, 50))
      setPublishState({ status: 'success', topic: topic.trim(), ack: result.ack, qos: result.qos })

      setTimeout(() => setPublishState((prev) => prev.status === 'success' ? { status: 'idle' } : prev), 2500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown publish error'
      setPublishState({ status: 'error', message })

      setTimeout(() => setPublishState((prev) => prev.status === 'error' ? { status: 'idle' } : prev), 4000)
    }
  }

  const startContinuous = useCallback(() => {
    if (!topic.trim() || !isConnected) return

    const interval = parseFloat(intervalSec)
    const duration = parseFloat(durationSec)
    if (!interval || interval <= 0 || !duration || duration <= 0) return

    const qosNum = Number(qos) as 0 | 1 | 2
    let sentCount = 0
    startTimeRef.current = Date.now()

    const doPublish = () => {
      sentCount++
      const currentSent = sentCount
      publish(topic.trim(), payload, qosNum, retain).catch(() => {})

      const record: PublishRecord = {
        id: crypto.randomUUID(),
        topic: topic.trim(),
        payload,
        qos: qosNum,
        retain,
        timestamp: Date.now(),
      }
      setHistory(prev => [record, ...prev].slice(0, 50))
      setContinuousState({ running: true, sent: currentSent, elapsed: (Date.now() - startTimeRef.current) / 1000 })
    }

    // Send first message immediately
    doPublish()
    setContinuousState({ running: true, sent: 1, elapsed: 0 })

    // Then repeat at interval
    intervalRef.current = setInterval(doPublish, interval * 1000)

    // Elapsed time ticker (update UI every 100ms)
    tickRef.current = setInterval(() => {
      setContinuousState(prev => {
        if (!prev.running) return prev
        return { ...prev, elapsed: (Date.now() - startTimeRef.current) / 1000 }
      })
    }, 100)

    // Auto-stop after duration
    timeoutRef.current = setTimeout(() => {
      stopContinuous()
    }, duration * 1000)
  }, [topic, payload, qos, retain, intervalSec, durationSec, isConnected, publish, stopContinuous])

  const handleLoadHistory = (record: PublishRecord) => {
    setTopic(record.topic)
    setPayload(record.payload)
    setQos(String(record.qos) as '0' | '1' | '2')
    setRetain(record.retain)
  }

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString()
  }

  const intervalValid = parseFloat(intervalSec) > 0
  const durationValid = parseFloat(durationSec) > 0
  const canStartContinuous = isConnected && !!topic.trim() && intervalValid && durationValid

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { stopContinuous(); onClose() } }}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-3 border-b border-border">
          <DialogTitle className="text-sm">Publish Message</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Publish form */}
          <div className="p-5 space-y-4 border-b border-border">
            {/* Topic input with datalist */}
            <div className="space-y-1.5">
              <Label htmlFor="pub-topic" className="text-xs">Topic</Label>
              <Input
                id="pub-topic"
                list="known-topics"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="sensors/temperature"
                className="font-mono text-sm h-8"
                disabled={continuousState.running}
              />
              <datalist id="known-topics">
                {allTopics.map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            {/* Payload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pub-payload" className="text-xs">Payload</Label>
                <div className="flex gap-1">
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted"
                    onClick={() => {
                      try {
                        setPayload(JSON.stringify(JSON.parse(payload), null, 2))
                      } catch { /* not JSON */ }
                    }}
                  >
                    Format JSON
                  </button>
                  <button
                    className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted"
                    onClick={() => setPayload('')}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <Textarea
                id="pub-payload"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder='{"key": "value"} or plain text'
                className="font-mono text-xs resize-none h-28"
                disabled={continuousState.running}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    if (!continuousEnabled) handlePublish()
                  }
                }}
              />
              <p className="text-[10px] text-muted-foreground">
                {new TextEncoder().encode(payload).byteLength} bytes
                {!continuousEnabled && ' • Ctrl+Enter to publish'}
              </p>
            </div>

            {/* QoS and Retain */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs">QoS</Label>
                <Select value={qos} onValueChange={(v) => setQos(v as '0' | '1' | '2')} disabled={continuousState.running}>
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">QoS 0</SelectItem>
                    <SelectItem value="1">QoS 1</SelectItem>
                    <SelectItem value="2">QoS 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="retain"
                  checked={retain}
                  onCheckedChange={(checked) => setRetain(!!checked)}
                  disabled={continuousState.running}
                />
                <Label htmlFor="retain" className="text-xs cursor-pointer">Retain</Label>
              </div>
            </div>

            {/* Continuous publish toggle */}
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="continuous" className="text-xs cursor-pointer">Continuous Publish</Label>
              </div>
              <Switch
                id="continuous"
                checked={continuousEnabled}
                onCheckedChange={(checked) => {
                  if (continuousState.running) stopContinuous()
                  setContinuousEnabled(checked)
                }}
              />
            </div>

            {/* Continuous publish settings */}
            {continuousEnabled && (
              <div className="space-y-3 rounded-md border border-border p-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="interval" className="text-xs">
                      Interval (seconds) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="interval"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={intervalSec}
                      onChange={(e) => setIntervalSec(e.target.value)}
                      className={cn("h-7 text-xs font-mono", !intervalValid && intervalSec !== '' && "border-red-500")}
                      disabled={continuousState.running}
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="duration" className="text-xs">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      step="1"
                      value={durationSec}
                      onChange={(e) => setDurationSec(e.target.value)}
                      className={cn("h-7 text-xs font-mono", !durationValid && durationSec !== '' && "border-red-500")}
                      disabled={continuousState.running}
                    />
                  </div>
                </div>

                {/* Progress display while running */}
                {continuousState.running && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Sent <span className="font-mono font-medium text-foreground">{continuousState.sent}</span> messages
                      </span>
                      <span className="font-mono text-muted-foreground">
                        {continuousState.elapsed.toFixed(1)}s / {durationSec}s
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-100"
                        style={{ width: `${Math.min(100, (continuousState.elapsed / parseFloat(durationSec)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Publish / Start / Stop button */}
            {continuousEnabled ? (
              continuousState.running ? (
                <Button
                  variant="destructive"
                  className="w-full h-9"
                  onClick={stopContinuous}
                >
                  <Square className="h-3.5 w-3.5 mr-2" />
                  Stop
                </Button>
              ) : (
                <Button
                  className="w-full h-9"
                  onClick={startContinuous}
                  disabled={!canStartContinuous}
                >
                  <Repeat className="h-4 w-4 mr-2" />
                  Start Continuous Publish
                </Button>
              )
            ) : (
              <Button
                className={cn(
                  'w-full h-9 transition-all',
                  publishState.status === 'success' && 'bg-green-600 hover:bg-green-700',
                  publishState.status === 'error' && 'bg-red-600 hover:bg-red-700',
                )}
                onClick={handlePublish}
                disabled={!topic.trim() || !isConnected || publishState.status === 'publishing'}
              >
                {publishState.status === 'publishing' ? (
                  <span className="text-xs animate-pulse">Publishing…</span>
                ) : publishState.status === 'success' ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {publishState.ack
                      ? `ACK received – QoS ${publishState.qos}`
                      : `Sent to ${publishState.topic}`}
                  </span>
                ) : publishState.status === 'error' ? (
                  <span className="flex items-center gap-1.5 text-xs">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Failed
                  </span>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Publish</>
                )}
              </Button>
            )}

            {/* Error detail */}
            {publishState.status === 'error' && !continuousEnabled && (
              <p className="text-xs text-red-400 text-center">
                {publishState.message}
              </p>
            )}

            {!isConnected && (
              <p className="text-xs text-muted-foreground text-center">
                Connect to a broker to publish messages
              </p>
            )}
          </div>

          {/* Publish history */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between px-5 py-2 border-b border-border">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">History</span>
              </div>
              {history.length > 0 && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setHistory([])}
                >
                  Clear
                </button>
              )}
            </div>

            <ScrollArea className="flex-1 max-h-[200px]">
              {history.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-xs text-muted-foreground">No publish history yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {history.map(record => (
                    <button
                      key={record.id}
                      className="w-full text-left px-5 py-2 hover:bg-accent transition-colors"
                      onClick={() => handleLoadHistory(record)}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-mono font-medium text-primary truncate max-w-[240px]">
                          {record.topic}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge variant="secondary" className="h-3.5 text-[9px] px-1">
                            Q{record.qos}
                          </Badge>
                          {record.retain && (
                            <Badge variant="outline" className="h-3.5 text-[9px] px-1">R</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[280px]">
                          {record.payload || <em className="not-italic opacity-60">(empty)</em>}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {formatTime(record.timestamp)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
