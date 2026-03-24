/**
 * Smart CalcX Terminal — Interactive CLI Calculator with colorful UI,
 * strict input validation, and continue prompts.
 */

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import {
  add, subtract, multiply, divide, modulus,
  squareRoot, power, factorial, logarithm, exponential,
  sine, cosine, tangent, inverseSine, inverseCosine, inverseTangent,
  evaluateExpression,
  createHistoryEntry, historyToFileContent,
  type HistoryEntry,
} from "@/lib/calcx-engine";

type LineType = "normal" | "bold" | "dim" | "prompt" | "success" | "error" | "result" | "input-echo" | "cyan" | "yellow";

interface TerminalLine {
  id: number;
  text: string;
  type: LineType;
  indent?: number;
}

type InputState =
  | { mode: "login" }
  | { mode: "menu" }
  | { mode: "basic_select" }
  | { mode: "basic_input"; op: string; step: "val1" }
  | { mode: "basic_input"; op: string; step: "val2"; val1: number }
  | { mode: "sci_select" }
  | { mode: "sci_input"; op: string; step: "val1" }
  | { mode: "sci_input"; op: "pow"; step: "val2"; base: number }
  | { mode: "expression" }
  | { mode: "continue"; returnTo: "basic" | "sci" | "expr" | "menu" };

let lineIdCounter = 0;

function line(text: string, type: LineType = "normal", indent = 0): TerminalLine {
  return { id: lineIdCounter++, text, type, indent };
}

export default function CalcXTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [inputState, setInputState] = useState<InputState>({ mode: "login" });
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [promptLabel, setPromptLabel] = useState("👤 username >");
  const [username, setUsername] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  const focusInput = () => inputRef.current?.focus();

  const append = useCallback((...newLines: TerminalLine[]) => {
    setLines((prev) => [...prev, ...newLines]);
  }, []);

  // --- Welcome screen ---
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setLines([
      line(""),
      line("════════════════════════════════════════════", "cyan"),
      line("        Welcome to Smart CalcX 🧮", "cyan"),
      line("    Interactive CLI Calculator v2.0", "dim"),
      line("════════════════════════════════════════════", "cyan"),
      line(""),
      line("Please sign in to continue.", "normal"),
    ]);
  }, []);

  // --- Show main operations menu ---
  const showMenu = useCallback(() => {
    append(
      line(""),
      line("════════════════════════════════════════════", "cyan"),
      line("          🔢 Choose Operation", "cyan"),
      line("════════════════════════════════════════════", "cyan"),
      line(""),
      line("  1. 🧮 Basic Operations", "normal", 1),
      line("  2. 📐 Scientific Operations", "normal", 1),
      line("  3. ⚡ Expression Mode", "normal", 1),
      line("  4. 📜 View History", "normal", 1),
      line("  5. 💾 Save History", "normal", 1),
      line("  0. ❌ Exit", "normal", 1),
      line(""),
      line("════════════════════════════════════════════", "cyan"),
    );
    setPromptLabel("cmd >");
    setInputState({ mode: "menu" });
  }, [append]);

  const showBasicMenu = useCallback(() => {
    append(
      line(""),
      line("──── 🧮 Basic Operations ────", "cyan"),
      line(""),
      line("  1. ➕ Addition", "normal", 1),
      line("  2. ➖ Subtraction", "normal", 1),
      line("  3. ✖️  Multiplication", "normal", 1),
      line("  4. ➗ Division", "normal", 1),
      line("  5. 🟡 Modulus", "normal", 1),
      line("  0. ↩️  Back", "dim", 1),
      line(""),
    );
    setPromptLabel("basic >");
    setInputState({ mode: "basic_select" });
  }, [append]);

  const showSciMenu = useCallback(() => {
    append(
      line(""),
      line("──── 📐 Scientific Operations ────", "cyan"),
      line(""),
      line("  1.  √  Square Root        7. cos Cosine", "dim", 1),
      line("  2. xʸ  Power              8. tan Tangent", "dim", 1),
      line("  3.  !  Factorial           9. asin Inv Sine", "dim", 1),
      line("  4. log Logarithm         10. acos Inv Cosine", "dim", 1),
      line("  5. eˣ  Exponential       11. atan Inv Tangent", "dim", 1),
      line("  6. sin Sine               0. ↩️  Back", "dim", 1),
      line(""),
    );
    setPromptLabel("sci >");
    setInputState({ mode: "sci_select" });
  }, [append]);

  const record = useCallback((expression: string, result: string) => {
    setHistory((prev) => [...prev, createHistoryEntry(expression, result)]);
  }, []);

  const parseNum = (s: string): number | null => {
    const n = Number(s);
    return isNaN(n) ? null : n;
  };

  const showResult = useCallback((expr: string, res: string) => {
    append(line(`👉 Result: ${res}`, "success", 2));
    record(expr, res);
  }, [append, record]);

  const showError = useCallback((msg: string) => {
    append(line(`❌ ${msg}`, "error", 2));
  }, [append]);

  const showContinuePrompt = useCallback((returnTo: "basic" | "sci" | "expr" | "menu") => {
    append(line(""), line("Do you want to continue? (yes/no):", "yellow"));
    setPromptLabel("➜");
    setInputState({ mode: "continue", returnTo });
  }, [append]);

  // --- Process input ---
  const processInput = useCallback((value: string) => {
    const trimmed = value.trim();
    append(line(`${promptLabel} ${trimmed}`, "input-echo"));

    switch (inputState.mode) {
      case "login": {
        if (!trimmed) { showError("Please enter a username."); return; }
        setUsername(trimmed);
        append(
          line(""),
          line(`Hello, ${trimmed}! Ready to calculate 🚀`, "success"),
        );
        const menuLines = [
          line(""),
          line("════════════════════════════════════════════", "cyan"),
          line("          🔢 Choose Operation", "cyan"),
          line("════════════════════════════════════════════", "cyan"),
          line(""),
          line("  1. 🧮 Basic Operations", "normal", 1),
          line("  2. 📐 Scientific Operations", "normal", 1),
          line("  3. ⚡ Expression Mode", "normal", 1),
          line("  4. 📜 View History", "normal", 1),
          line("  5. 💾 Save History", "normal", 1),
          line("  0. ❌ Exit", "normal", 1),
          line(""),
          line("════════════════════════════════════════════", "cyan"),
        ];
        append(...menuLines);
        setPromptLabel("cmd >");
        setInputState({ mode: "menu" });
        break;
      }

      case "menu": {
        switch (trimmed) {
          case "1": showBasicMenu(); break;
          case "2": showSciMenu(); break;
          case "3":
            append(
              line(""),
              line("──── ⚡ Expression Mode ────", "cyan"),
              line("Supports: +, -, *, /, ^, sqrt(), sin(), cos(), tan(), log(), exp(), pi, e", "dim"),
              line("Type 'back' to return", "dim"),
              line(""),
            );
            setPromptLabel("expr >");
            setInputState({ mode: "expression" });
            break;
          case "4":
            append(line(""), line("──── 📜 Session History ────", "cyan"));
            if (history.length === 0) {
              append(line("  No records found.", "dim"));
            } else {
              history.slice(-15).forEach((e) => {
                append(line(`  ${e.timestamp} │ ${e.expression} = ${e.result}`, "dim", 1));
              });
            }
            showMenu();
            break;
          case "5":
            if (history.length === 0) {
              append(line("  No records to save.", "dim"));
            } else {
              const content = historyToFileContent(history);
              const blob = new Blob([content], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "result.txt"; a.click();
              URL.revokeObjectURL(url);
              append(line("✅ Saved to result.txt", "success", 2));
            }
            showMenu();
            break;
          case "0":
            append(
              line(""),
              line(`Thanks for using Smart CalcX 👋`, "cyan"),
              line(`Goodbye, ${username}!`, "prompt"),
            );
            setTimeout(() => {
              lineIdCounter = 0;
              setUsername("");
              setHistory([]);
              setLines([
                line(""),
                line("════════════════════════════════════════════", "cyan"),
                line("        Welcome to Smart CalcX 🧮", "cyan"),
                line("    Interactive CLI Calculator v2.0", "dim"),
                line("════════════════════════════════════════════", "cyan"),
                line(""),
                line("Please sign in to continue.", "normal"),
              ]);
              setPromptLabel("👤 username >");
              setInputState({ mode: "login" });
            }, 1500);
            break;
          default:
            showError("Unknown command. Please enter 0-5.");
            showMenu();
        }
        break;
      }

      case "basic_select": {
        const opMap: Record<string, string> = { "1": "+", "2": "-", "3": "*", "4": "/", "5": "%" };
        if (trimmed === "0") { showMenu(); return; }
        const op = opMap[trimmed];
        if (!op) { showError("Unknown operation. Please enter 0-5."); return; }
        setPromptLabel("🔢 val_1:");
        setInputState({ mode: "basic_input", op, step: "val1" });
        break;
      }

      case "basic_input": {
        if (inputState.step === "val1") {
          const n = parseNum(trimmed);
          if (n === null) { showError("Invalid input! Please enter numbers only."); return; }
          setPromptLabel("🔢 val_2:");
          setInputState({ mode: "basic_input", op: inputState.op, step: "val2", val1: n });
        } else if (inputState.step === "val2") {
          const n = parseNum(trimmed);
          if (n === null) { showError("Invalid input! Please enter numbers only."); return; }
          try {
            const ops: Record<string, (a: number, b: number) => string> = {
              "+": add, "-": subtract, "*": multiply, "/": divide, "%": modulus,
            };
            const res = ops[inputState.op](inputState.val1, n);
            const opSymbols: Record<string, string> = { "+": "➕", "-": "➖", "*": "✖️", "/": "➗", "%": "%" };
            showResult(`${inputState.val1} ${opSymbols[inputState.op]} ${n}`, res);
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showContinuePrompt("basic");
        }
        break;
      }

      case "sci_select": {
        if (trimmed === "0") { showMenu(); return; }
        const opMap: Record<string, string> = {
          "1": "sqrt", "2": "pow", "3": "fact", "4": "log", "5": "exp",
          "6": "sin", "7": "cos", "8": "tan", "9": "asin", "10": "acos", "11": "atan",
        };
        const op = opMap[trimmed];
        if (!op) { showError("Unknown operation."); return; }
        if (op === "pow") {
          setPromptLabel("🔢 base:");
          setInputState({ mode: "sci_input", op: "pow", step: "val1" });
        } else {
          const labels: Record<string, string> = {
            sqrt: "🔢 value:", fact: "🔢 value (int):", log: "🔢 value:", exp: "🔢 value:",
            sin: "🔢 angle (deg):", cos: "🔢 angle (deg):", tan: "🔢 angle (deg):",
            asin: "🔢 value [-1,1]:", acos: "🔢 value [-1,1]:", atan: "🔢 value:",
          };
          setPromptLabel(labels[op] || "🔢 value:");
          setInputState({ mode: "sci_input", op, step: "val1" });
        }
        break;
      }

      case "sci_input": {
        if (inputState.step === "val1") {
          const n = parseNum(trimmed);
          if (n === null) { showError("Invalid input! Please enter numbers only."); return; }
          if (inputState.op === "pow") {
            setPromptLabel("🔢 exponent:");
            setInputState({ mode: "sci_input", op: "pow", step: "val2", base: n });
            return;
          }
          try {
            const fns: Record<string, (v: number) => string> = {
              sqrt: squareRoot, fact: factorial, log: logarithm,
              exp: exponential, sin: sine, cos: cosine, tan: tangent,
              asin: inverseSine, acos: inverseCosine, atan: inverseTangent,
            };
            const labels: Record<string, (v: number) => string> = {
              sqrt: (v) => `√${v}`, fact: (v) => `${v}!`, log: (v) => `log₁₀(${v})`,
              exp: (v) => `e^${v}`, sin: (v) => `sin(${v}°)`, cos: (v) => `cos(${v}°)`, tan: (v) => `tan(${v}°)`,
              asin: (v) => `asin(${v})°`, acos: (v) => `acos(${v})°`, atan: (v) => `atan(${v})°`,
            };
            const res = fns[inputState.op](n);
            showResult(labels[inputState.op](n), res);
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showContinuePrompt("sci");
        } else if (inputState.step === "val2" && inputState.op === "pow") {
          const n = parseNum(trimmed);
          if (n === null) { showError("Invalid input! Please enter numbers only."); return; }
          try {
            const res = power(inputState.base, n);
            showResult(`${inputState.base}^${n}`, res);
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showContinuePrompt("sci");
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
        showContinuePrompt("expr");
        break;
      }

      case "continue": {
        const answer = trimmed.toLowerCase();
        if (answer === "yes" || answer === "y") {
          switch (inputState.returnTo) {
            case "basic": showBasicMenu(); break;
            case "sci": showSciMenu(); break;
            case "expr":
              append(line(""), line("──── ⚡ Expression Mode ────", "cyan"), line("Type 'back' to return", "dim"), line(""));
              setPromptLabel("expr >");
              setInputState({ mode: "expression" });
              break;
            case "menu": showMenu(); break;
          }
        } else if (answer === "no" || answer === "n") {
          append(
            line(""),
            line(`Thanks for using Smart CalcX 👋`, "cyan"),
            line(`Goodbye, ${username}!`, "prompt"),
          );
          setTimeout(() => {
            lineIdCounter = 0;
            setUsername("");
            setHistory([]);
            setLines([
              line(""),
              line("════════════════════════════════════════════", "cyan"),
              line("        Welcome to Smart CalcX 🧮", "cyan"),
              line("    Interactive CLI Calculator v2.0", "dim"),
              line("════════════════════════════════════════════", "cyan"),
              line(""),
              line("Please sign in to continue.", "normal"),
            ]);
            setPromptLabel("👤 username >");
            setInputState({ mode: "login" });
          }, 1500);
        } else {
          showError("Please enter 'yes' or 'no'.");
        }
        break;
      }
    }
  }, [inputState, history, append, showMenu, showBasicMenu, showSciMenu, record, promptLabel, username, showResult, showError, showContinuePrompt]);

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
      case "cyan": return "terminal-line terminal-cyan-text";
      case "yellow": return "terminal-line terminal-yellow-text";
      default: return "terminal-line";
    }
  };

  return (
    <div className="terminal-window max-w-2xl w-full mx-auto" onClick={focusInput}>
      <div className="terminal-header">
        <div className="terminal-dot bg-terminal-error" />
        <div className="terminal-dot" style={{ backgroundColor: "hsl(45, 93%, 47%)" }} />
        <div className="terminal-dot bg-terminal-success" />
        <span className="ml-3 text-xs terminal-dim-text font-mono">
          smart-calcx — {username ? `~/${username}` : "~/login"}
        </span>
      </div>

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
