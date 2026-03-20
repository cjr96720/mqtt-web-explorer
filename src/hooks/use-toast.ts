import * as React from "react"

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
  duration?: number
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

function addToRemoveQueue(toastId: string, duration: number) {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, duration)
  toastTimeouts.set(toastId, timeout)
}

const reducer = (state: ToasterToast[], action: Action): ToasterToast[] => {
  switch (action.type) {
    case "ADD_TOAST":
      return [action.toast, ...state].slice(0, TOAST_LIMIT)
    case "DISMISS_TOAST":
      if (action.toastId) {
        addToRemoveQueue(action.toastId, 300)
      }
      return state
    case "REMOVE_TOAST":
      if (action.toastId) {
        return state.filter((t) => t.id !== action.toastId)
      }
      return []
    default:
      return state
  }
}

const listeners: Array<(state: ToasterToast[]) => void> = []
let memoryState: ToasterToast[] = []

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

function toast(props: Omit<ToasterToast, "id">) {
  const id = genId()
  const duration = props.duration ?? TOAST_REMOVE_DELAY
  dispatch({ type: "ADD_TOAST", toast: { ...props, id } })
  addToRemoveQueue(id, duration)
  return id
}

function useToast() {
  const [state, setState] = React.useState<ToasterToast[]>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
export type { ToasterToast }
