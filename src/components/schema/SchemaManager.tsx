import { useState, useMemo } from 'react'
import { Plus, Trash2, FileCode2, ChevronDown, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useProtobufStore, type ProtoSchema, type TopicMapping } from '@/stores/protobufStore'
import { parseSchema } from '@/lib/protobufDecoder'
import { cn } from '@/lib/utils'

interface SchemaManagerProps {
  open: boolean
  onClose: () => void
}

// ─── Schema editor panel ────────────────────────────────────────────────────

interface SchemaRowProps {
  schema: ProtoSchema
  onUpdate: (updates: Partial<Omit<ProtoSchema, 'id'>>) => void
  onDelete: () => void
}

function SchemaRow({ schema, onUpdate, onDelete }: SchemaRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [content, setContent] = useState(schema.protoContent)

  const validation = useMemo((): { ok: true; messageTypes: string[] } | { ok: false; error: string } | null => {
    if (!content.trim()) return null
    try {
      const { messageTypes } = parseSchema(content)
      return { ok: true, messageTypes }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }, [content])

  const handleContentBlur = () => {
    onUpdate({ protoContent: content })
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
        <FileCode2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <Input
          value={schema.name}
          onChange={(e) => { e.stopPropagation(); onUpdate({ name: e.target.value }) }}
          onClick={(e) => e.stopPropagation()}
          placeholder="Schema name"
          className="h-6 text-xs font-mono border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 flex-1"
        />
        {validation && (
          validation.ok ? (
            <Badge variant="secondary" className="h-4 text-[9px] px-1 flex-shrink-0">
              {validation.messageTypes.length} types
            </Badge>
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
          )
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="p-3 space-y-2 border-t border-border">
          <Label className="text-xs text-muted-foreground">Proto content</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentBlur}
            placeholder={'syntax = "proto3";\n\nmessage MyMessage {\n  string field = 1;\n}'}
            className="font-mono text-xs resize-none h-40"
            spellCheck={false}
          />
          {validation && !validation.ok && (
            <p className="text-xs text-red-400 flex items-start gap-1">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              {validation.error}
            </p>
          )}
          {validation && validation.ok && (
            <div className="flex items-start gap-1 text-xs text-green-400">
              <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>Valid schema — message types: {validation.messageTypes.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Mapping row ─────────────────────────────────────────────────────────────

interface MappingRowProps {
  mapping: TopicMapping
  schemas: ProtoSchema[]
  onUpdate: (updates: Partial<Omit<TopicMapping, 'id'>>) => void
  onDelete: () => void
}

function MappingRow({ mapping, schemas, onUpdate, onDelete }: MappingRowProps) {
  const selectedSchema = schemas.find((s) => s.id === mapping.schemaId)

  const messageTypes = useMemo(() => {
    if (!selectedSchema?.protoContent) return []
    try {
      return parseSchema(selectedSchema.protoContent).messageTypes
    } catch {
      return []
    }
  }, [selectedSchema?.protoContent])

  return (
    <div className="flex items-center gap-2 py-1.5">
      <Input
        value={mapping.topicPattern}
        onChange={(e) => onUpdate({ topicPattern: e.target.value })}
        placeholder="sensors/+/data or devices/#"
        className="h-7 text-xs font-mono flex-1 min-w-0"
      />

      <Select
        value={mapping.schemaId}
        onValueChange={(v) => onUpdate({ schemaId: v, messageType: '' })}
      >
        <SelectTrigger className="h-7 text-xs w-36 flex-shrink-0">
          <SelectValue placeholder="Schema" />
        </SelectTrigger>
        <SelectContent>
          {schemas.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-xs">
              {s.name || '(unnamed)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={mapping.messageType}
        onValueChange={(v) => onUpdate({ messageType: v })}
        disabled={messageTypes.length === 0}
      >
        <SelectTrigger className="h-7 text-xs w-40 flex-shrink-0">
          <SelectValue placeholder="Message type" />
        </SelectTrigger>
        <SelectContent>
          {messageTypes.map((t) => (
            <SelectItem key={t} value={t} className="text-xs font-mono">
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="number"
        min={0}
        value={mapping.byteOffset ?? 0}
        onChange={(e) => onUpdate({ byteOffset: Math.max(0, Number(e.target.value) || 0) })}
        title="Bytes to skip at the start before decoding (frame header)"
        className="h-7 text-xs font-mono w-14 flex-shrink-0"
      />

      <Input
        type="number"
        min={0}
        value={mapping.trailerBytes ?? 0}
        onChange={(e) => onUpdate({ trailerBytes: Math.max(0, Number(e.target.value) || 0) })}
        title="Bytes to strip at the end before decoding (e.g. CRC footer)"
        className="h-7 text-xs font-mono w-14 flex-shrink-0"
      />

      <button
        onClick={onDelete}
        className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

export function SchemaManager({ open, onClose }: SchemaManagerProps) {
  const {
    schemas,
    mappings,
    addSchema,
    removeSchema,
    updateSchema,
    addMapping,
    removeMapping,
    updateMapping,
  } = useProtobufStore()

  const handleAddSchema = () => {
    addSchema({
      id: crypto.randomUUID(),
      name: '',
      protoContent: '',
    })
  }

  const handleAddMapping = () => {
    addMapping({
      id: crypto.randomUUID(),
      topicPattern: '',
      schemaId: schemas[0]?.id ?? '',
      messageType: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[760px] max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 py-3 border-b border-border">
          <DialogTitle className="text-sm flex items-center gap-2">
            <FileCode2 className="h-4 w-4" />
            Protobuf Schema Manager
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-5 space-y-6">

            {/* Schemas section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schemas</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Upload .proto file contents to define message schemas</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={handleAddSchema}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Schema
                </Button>
              </div>

              {schemas.length === 0 ? (
                <div className={cn(
                  'border border-dashed border-border rounded-md px-4 py-6 text-center text-xs text-muted-foreground'
                )}>
                  No schemas yet. Click "Add Schema" to paste a .proto file.
                </div>
              ) : (
                <div className="space-y-2">
                  {schemas.map((schema) => (
                    <SchemaRow
                      key={schema.id}
                      schema={schema}
                      onUpdate={(updates) => updateSchema(schema.id, updates)}
                      onDelete={() => removeSchema(schema.id)}
                    />
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* Topic mappings section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic Mappings</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Map topic patterns to message types. Supports MQTT wildcards (<code className="font-mono">+</code> and <code className="font-mono">#</code>). First match wins.
                    Use <span className="font-medium text-foreground">Offset</span>/<span className="font-medium text-foreground">Trailer</span> to strip leading frame-header / trailing footer (e.g. CRC) bytes before decoding.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={handleAddMapping}
                  disabled={schemas.length === 0}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Rule
                </Button>
              </div>

              {mappings.length === 0 ? (
                <div className="border border-dashed border-border rounded-md px-4 py-6 text-center text-xs text-muted-foreground">
                  {schemas.length === 0
                    ? 'Add a schema first, then create topic mapping rules.'
                    : 'No mapping rules yet. Click "Add Rule" to map a topic pattern to a message type.'}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 px-0.5 mb-1">
                    <span className="text-[10px] text-muted-foreground flex-1">Topic pattern</span>
                    <span className="text-[10px] text-muted-foreground w-36">Schema</span>
                    <span className="text-[10px] text-muted-foreground w-40">Message type</span>
                    <span className="text-[10px] text-muted-foreground w-14" title="Bytes to skip at the start before decoding">Offset</span>
                    <span className="text-[10px] text-muted-foreground w-14" title="Bytes to strip at the end before decoding">Trailer</span>
                    <span className="w-3.5" />
                  </div>
                  {mappings.map((mapping) => (
                    <MappingRow
                      key={mapping.id}
                      mapping={mapping}
                      schemas={schemas}
                      onUpdate={(updates) => updateMapping(mapping.id, updates)}
                      onDelete={() => removeMapping(mapping.id)}
                    />
                  ))}
                </div>
              )}
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
