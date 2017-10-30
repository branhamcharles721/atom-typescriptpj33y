export interface Linter {
  clearMessages()
  setAllMessages(messages: LinterMessage[])
  dispose()
}

export interface LinterConfig {
  name: string
}

export interface LinterLocation {
  file: string
  position?: Atom.Range
}

export interface LinterMessage {
  severity: "error" | "warning" | "info"
  excerpt: string
  location: LinterLocation
}

export interface RegisterLinter {
  (config: LinterConfig): Linter
}
