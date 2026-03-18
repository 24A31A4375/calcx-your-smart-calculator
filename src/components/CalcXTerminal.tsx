/**
 * CalcXTerminal — A web-based terminal emulator for the CalcX calculator.
 * Renders a realistic CLI interface with prompt, input, and output lines.
 */

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import {
  add, subtract, multiply, divide,
  squareRoot, power, factorial, logarithm, exponential,
  sine, cosine, tangent,
  evaluateExpression,
  createHistoryEntry, historyToFileContent,
  type HistoryEntry,
} from "@/lib/calcx-engine";

// --- Line types for terminal output ---
type LineType = "normal" | "bold" | "dim" | "prompt" | "success" | "error" | "result" | "input-echo";

interface TerminalLine {
  id: number;
  text: string;
  type: LineType;
  indent?: number;
}

type InputState =
  | { mode: "menu" }
  | { mode: "basic_op"; step: "val1" }
  | { mode: "basic_op"; step: "operator"; val1: number }
  | { mode: "basic_op"; step: "val2"; val1: number; op: string }
  | { mode: "sci_select" }
  | { mode: "sci_input"; op: string; step: "val1" }
  | { mode: "sci_input"; op: "pow"; step: "val2"; base: number }
  | { mode: "expression" };

let lineIdCounter = 0;

function line(text: string, type: LineType = "normal", indent = 0): TerminalLine {
  return { id: lineIdCounter++, text, type, indent };
}

export default function CalcXTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputState, setInputState] = useState<InputState>({ mode: "menu" });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [promptLabel, setPromptLabel] = useState("cmd >");
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input on click
  const focusInput = () => inputRef.current?.focus();

  // Append lines helper
  const append = useCallback((...newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  // Show the main menu
  const showMenu = useCallback(() => {
    append(
      line(""),
      line("calcx_v1.0", "prompt"),
      line("[1:basic  2:sci  3:expr  4:hist  5:save  0:clear]", "dim"),
    );
    setPromptLabel("cmd >");
    setInputState({ mode: "menu" });
  }, [append]);

  // Initialize
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const startLines: TerminalLine[] = [
      line("┌─────────────────────────────────────────┐", "dim"),
      line("│  calcx v1.0.0 ready.                    │", "prompt"),
      line("│  precision-engineered cli calculator     │", "dim"),
      line("└─────────────────────────────────────────┘", "dim"),
      line(""),
      line("calcx_v1.0", "prompt"),
      line("[1:basic  2:sci  3:expr  4:hist  5:save  0:clear]", "dim"),
    ];
    setLines(startLines);
  }, []);

  // Record to history
  const record = useCallback((expression: string, result: string) => {
    setHistory((prev) => [...prev, createHistoryEntry(expression, result)]);
  }, []);

  // Process input based on current state
  const processInput = useCallback((value: string) => {
    const trimmed = value.trim();
    // Echo the input
    append(line(`${promptLabel} ${trimmed}`, "input-echo"));

    const parseNum = (s: string): number | null => {
      const n = Number(s);
      return isNaN(n) ? null : n;
    };

    const showResult = (expr: string, res: string) => {
      append(line(`✓ ${res}`, "success", 4));
      record(expr, res);
    };

    const showError = (msg: string) => {
      append(line(`✗ ${msg}`, "error", 4));
    };

    switch (inputState.mode) {
      case "menu": {
        if (trimmed === "1") {
          append(line(""), line("--- basic_ops ---", "bold"));
          setPromptLabel("val_1:");
          setInputState({ mode: "basic_op", step: "val1" });
        } else if (trimmed === "2") {
          append(
            line(""), line("--- scientific_ops ---", "bold"),
            line("1:sqrt | 2:pow | 3:fact | 4:log | 5:exp | 6:sin | 7:cos | 8:tan", "dim"),
          );
          setPromptLabel("select_op:");
          setInputState({ mode: "sci_select" });
        } else if (trimmed === "3") {
          append(
            line(""), line("--- expression_mode ---", "bold"),
            line("supports: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), log(), exp(), pi, e", "dim"),
            line("type 'back' to return to menu", "dim"),
          );
          setPromptLabel("in >");
          setInputState({ mode: "expression" });
        } else if (trimmed === "4") {
          append(line(""), line("--- session_history ---", "bold"));
          if (history.length === 0) {
            append(line("no records found.", "dim"));
          } else {
            history.slice(-10).forEach((e) => {
              append(line(`${e.timestamp} | ${e.expression} = ${e.result}`, "dim", 1));
            });
          }
          showMenu();
        } else if (trimmed === "5") {
          if (history.length === 0) {
            append(line("no records to save.", "dim"));
          } else {
            const content = historyToFileContent(history);
            const blob = new Blob([content], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "result.txt";
            a.click();
            URL.revokeObjectURL(url);
            append(line("✓ saved to result.txt", "success", 4));
          }
          showMenu();
        } else if (trimmed === "0") {
          setLines([]);
          initialized.current = false;
          const startLines: TerminalLine[] = [
            line("┌─────────────────────────────────────────┐", "dim"),
            line("│  calcx v1.0.0 ready.                    │", "prompt"),
            line("│  precision-engineered cli calculator     │", "dim"),
            line("└─────────────────────────────────────────┘", "dim"),
            line(""),
            line("calcx_v1.0", "prompt"),
            line("[1:basic  2:sci  3:expr  4:hist  5:save  0:clear]", "dim"),
          ];
          setLines(startLines);
          setInputState({ mode: "menu" });
          setPromptLabel("cmd >");
        } else {
          showError("unknown_command");
          showMenu();
        }
        break;
      }

      case "basic_op": {
        if (inputState.step === "val1") {
          const n = parseNum(trimmed);
          if (n === null) { showError("invalid_input: enter a numeric value."); return; }
          setPromptLabel("operator (+,-,*,/):");
          setInputState({ mode: "basic_op", step: "operator", val1: n });
        } else if (inputState.step === "operator") {
          if (!["+", "-", "*", "/"].includes(trimmed)) { showError("unknown_operator"); return; }
          setPromptLabel("val_2:");
          setInputState({ mode: "basic_op", step: "val2", val1: inputState.val1, op: trimmed });
        } else if (inputState.step === "val2") {
          const n = parseNum(trimmed);
          if (n === null) { showError("invalid_input: enter a numeric value."); return; }
          try {
            const ops: Record<string, (a: number, b: number) => string> = { "+": add, "-": subtract, "*": multiply, "/": divide };
            const res = ops[inputState.op](inputState.val1, n);
            showResult(`${inputState.val1} ${inputState.op} ${n}`, res);
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showMenu();
        }
        break;
      }

      case "sci_select": {
        const opMap: Record<string, string> = { "1": "sqrt", "2": "pow", "3": "fact", "4": "log", "5": "exp", "6": "sin", "7": "cos", "8": "tan" };
        const op = opMap[trimmed];
        if (!op) { showError("unknown_operation"); showMenu(); return; }
        if (op === "pow") {
          setPromptLabel("base:");
          setInputState({ mode: "sci_input", op: "pow", step: "val1" });
        } else {
          const labels: Record<string, string> = { sqrt: "val:", fact: "val (int):", log: "val:", exp: "val:", sin: "angle (deg):", cos: "angle (deg):", tan: "angle (deg):" };
          setPromptLabel(labels[op] || "val:");
          setInputState({ mode: "sci_input", op, step: "val1" });
        }
        break;
      }

      case "sci_input": {
        if (inputState.step === "val1") {
          const n = parseNum(trimmed);
          if (n === null) { showError("invalid_input: enter a numeric value."); return; }
          if (inputState.op === "pow") {
            setPromptLabel("exp:");
            setInputState({ mode: "sci_input", op: "pow", step: "val2", base: n });
            return;
          }
          try {
            const fns: Record<string, (v: number) => string> = {
              sqrt: squareRoot, fact: factorial, log: logarithm,
              exp: exponential, sin: sine, cos: cosine, tan: tangent,
            };
            const labels: Record<string, (v: number) => string> = {
              sqrt: (v) => `sqrt(${v})`, fact: (v) => `${v}!`, log: (v) => `log10(${v})`,
              exp: (v) => `exp(${v})`, sin: (v) => `sin(${v}°)`, cos: (v) => `cos(${v}°)`, tan: (v) => `tan(${v}°)`,
            };
            const res = fns[inputState.op](n);
            showResult(labels[inputState.op](n), res);
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showMenu();
        } else if (inputState.step === "val2" && inputState.op === "pow") {
          const n = parseNum(trimmed);
          if (n === null) { showError("invalid_input: enter a numeric value."); return; }
          try {
            const res = power(inputState.base, n);
            showResult(`${inputState.base}^${n}`, res);
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showMenu();
        }
        break;
      }

      case "expression": {
        if (trimmed.toLowerCase() === "back") { showMenu(); return; }
        try {
          const res = evaluateExpression(trimmed);
          showResult(trimmed, res);
        } catch (e: unknown) {
          showError(e instanceof Error ? e.message : String(e));
        }
        break;
      }
    }
  }, [inputState, history, append, showMenu, record, promptLabel]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      processInput(inputValue);
      setInputValue("");
    }
  };

  const lineClass = (type: LineType): string => {
    switch (type) {
      case "bold": return "terminal-line font-bold";
      case "dim": return "terminal-line terminal-dim-text";
      case "prompt": return "terminal-line terminal-prompt-text";
      case "success": return "terminal-line terminal-success-text";
      case "error": return "terminal-line terminal-error-text";
      case "result": return "terminal-line terminal-result-text";
      case "input-echo": return "terminal-line terminal-dim-text";
      default: return "terminal-line";
    }
  };

  return (
    <div className="terminal-window max-w-2xl w-full mx-auto" onClick={focusInput}>
      {/* Title bar */}
      <div className="terminal-header">
        <div className="terminal-dot bg-terminal-error" />
        <div className="terminal-dot" style={{ backgroundColor: "hsl(45, 93%, 47%)" }} />
        <div className="terminal-dot bg-terminal-success" />
        <span className="ml-3 text-xs terminal-dim-text font-mono">calcx — ~/calculator</span>
      </div>

      {/* Terminal body */}
      <div className="terminal-body" ref={bodyRef}>
        {lines.map((l) => (
          <div
            key={l.id}
            className={lineClass(l.type)}
            style={{ paddingLeft: l.indent ? `${l.indent}em` : undefined }}
          >
            {l.text || "\u00A0"}
          </div>
        ))}

        {/* Input line */}
        <div className="terminal-line flex items-center gap-2 mt-1">
          <span className="terminal-prompt-text font-bold whitespace-nowrap">{promptLabel}</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
