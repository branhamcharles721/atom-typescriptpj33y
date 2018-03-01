import {addCommand} from "./registry"
import {commandForTypeScript, getFilePathPosition, FileLocationQuery} from "../utils"
import {selectListView} from "../views/simpleSelectionView"
import * as etch from "etch"
import {HighlightComponent} from "../views/highlightComponent"

const prevCursorPositions: FileLocationQuery[] = []

async function open(item: {file: string; start: {line: number; offset: number}}) {
  const editor = await atom.workspace.open(item.file, {
    initialLine: item.start.line - 1,
    initialColumn: item.start.offset - 1,
  })
  if (atom.workspace.isTextEditor(editor)) {
    editor.scrollToCursorPosition({center: true})
  }
}

addCommand("atom-text-editor", "typescript:go-to-declaration", deps => ({
  description: "Go to declaration of symbol under text cursor",
  async didDispatch(e) {
    if (!commandForTypeScript(e)) {
      return
    }
    const location = getFilePathPosition(e.currentTarget.getModel())
    if (!location) {
      e.abortKeyBinding()
      return
    }
    const client = await deps.getClient(location.file)
    const result = await client.executeDefinition(location)
    handleDefinitionResult(result, location)
  },
}))

addCommand("atom-workspace", "typescript:return-from-declaration", () => ({
  description: "If used `go-to-declaration`, return to previous text cursor position",
  async didDispatch() {
    const position = prevCursorPositions.pop()
    if (!position) {
      atom.notifications.addInfo("AtomTS: Previous position not found.")
      return
    }
    open({
      file: position.file,
      start: {line: position.line, offset: position.offset},
    })
  },
}))

export async function handleDefinitionResult(
  result: protocol.DefinitionResponse,
  location: FileLocationQuery,
): Promise<void> {
  if (!result.body) {
    return
  } else if (result.body.length > 1) {
    const res = await selectListView({
      items: result.body,
      itemTemplate: (item, ctx) => {
        return (
          <li>
            <HighlightComponent label={item.file} query={ctx.getFilterQuery()} />
            <div class="pull-right">line: {item.start.line}</div>
          </li>
        )
      },
      itemFilterKey: "file",
    })
    if (res) {
      prevCursorPositions.push(location)
      open(res)
    }
  } else if (result.body.length) {
    prevCursorPositions.push(location)
    open(result.body[0])
  }
}
