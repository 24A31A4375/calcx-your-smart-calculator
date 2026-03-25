/**
 * Smart CalcX Terminal — Interactive CLI Calculator with categorized trig,
 * sub-menus, strict input validation, and 3-option flow control.
 */

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import {
  add, subtract, multiply, divide, modulus,
  squareRoot, power, factorial, logarithm, exponential,
  sine, cosine, tangent, inverseSine, inverseCosine, inverseTangent,
  secant, cosecant, cotangent, inverseSecant, inverseCosecant, inverseCotangent,
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

type FlowReturn = "menu" | "basic" | "sci" | "sci_basic" | "trig" | "inv_trig" | "expr";

type InputState =
  | { mode: "login" }
  | { mode: "menu" }
  | { mode: "basic_select" }
  | { mode: "basic_input"; op: string; step: "val1" }
  | { mode: "basic_input"; op: string; step: "val2"; val1: number }
  | { mode: "sci_select" }
  | { mode: "sci_basic_select" }
  | { mode: "sci_basic_input"; op: string; step: "val1" }
  | { mode: "sci_basic_input"; op: "pow"; step: "val2"; base: number }
  | { mode: "trig_select" }
  | { mode: "trig_input"; op: string }
  | { mode: "inv_trig_select" }
  | { mode: "inv_trig_input"; op: string }
  | { mode: "expression" }
  | { mode: "flow_control"; returnTo: FlowReturn };

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

  // --- Menus ---
  const menuLines = (): TerminalLine[] => [
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

  const showMenu = useCallback(() => {
    append(...menuLines());
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
      line("  1. 🔬 Basic Scientific", "normal", 1),
      line("  2. 📊 Trigonometric Functions", "normal", 1),
      line("  3. 🔄 Inverse Trigonometric Functions", "normal", 1),
      line("  0. ↩️  Back", "dim", 1),
      line(""),
    );
    setPromptLabel("sci >");
    setInputState({ mode: "sci_select" });
  }, [append]);

  const showSciBasicMenu = useCallback(() => {
    append(
      line(""),
      line("──── 🔬 Basic Scientific ────", "cyan"),
      line(""),
      line("  1.  √  Square Root", "dim", 1),
      line("  2. xʸ  Power", "dim", 1),
      line("  3.  !  Factorial", "dim", 1),
      line("  4. log Logarithm (base 10)", "dim", 1),
      line("  5. eˣ  Exponential", "dim", 1),
      line("  0. ↩️  Back", "dim", 1),
      line(""),
    );
    setPromptLabel("sci-basic >");
    setInputState({ mode: "sci_basic_select" });
  }, [append]);

  const showTrigMenu = useCallback(() => {
    append(
      line(""),
      line("──── 📊 Trigonometric Functions ────", "cyan"),
      line(""),
      line("  1. sin   Sine", "dim", 1),
      line("  2. cos   Cosine", "dim", 1),
      line("  3. tan   Tangent", "dim", 1),
      line("  4. sec   Secant", "dim", 1),
      line("  5. cosec Cosecant", "dim", 1),
      line("  6. cot   Cotangent", "dim", 1),
      line("  0. ↩️   Back", "dim", 1),
      line(""),
    );
    setPromptLabel("trig >");
    setInputState({ mode: "trig_select" });
  }, [append]);

  const showInvTrigMenu = useCallback(() => {
    append(
      line(""),
      line("──── 🔄 Inverse Trigonometric Functions ────", "cyan"),
      line(""),
      line("  1. asin   Inverse Sine", "dim", 1),
      line("  2. acos   Inverse Cosine", "dim", 1),
      line("  3. atan   Inverse Tangent", "dim", 1),
      line("  4. asec   Inverse Secant", "dim", 1),
      line("  5. acosec Inverse Cosecant", "dim", 1),
      line("  6. acot   Inverse Cotangent", "dim", 1),
      line("  0. ↩️   Back", "dim", 1),
      line(""),
    );
    setPromptLabel("inv-trig >");
    setInputState({ mode: "inv_trig_select" });
  }, [append]);

  const record = useCallback((expression: string, result: string) => {
    setHistory((prev) => [...prev, createHistoryEntry(expression, result)]);
  }, []);

  /** Parse int, float, or fraction (e.g. 1/2, 3/4) into a number */
  const parseNum = (s: string): number | null => {
    const t = s.trim();
    if (!t) return null;
    // Handle fractions like 1/2 or 3/4
    if (t.includes("/")) {
      const parts = t.split("/");
      if (parts.length !== 2) return null;
      const num = Number(parts[0].trim());
      const den = Number(parts[1].trim());
      if (isNaN(num) || isNaN(den) || den === 0) return null;
      return num / den;
    }
    const n = Number(t);
    return isNaN(n) ? null : n;
  };

  const showResult = useCallback((expr: string, res: string) => {
    append(line(`👉 Result: ${res}`, "success", 2));
    record(expr, res);
  }, [append, record]);

  const showError = useCallback((msg: string) => {
    append(line(`❌ ${msg}`, "error", 2));
  }, [append]);

  const showFlowControl = useCallback((returnTo: FlowReturn) => {
    append(
      line(""),
      line("────────────────────────────", "dim"),
      line("  1. 🔄 Continue (Operations)", "normal", 1),
      line("  2. ↩️  Back (Previous Menu)", "normal", 1),
      line("  0. ❌ Exit", "normal", 1),
      line("────────────────────────────", "dim"),
    );
    setPromptLabel("➜");
    setInputState({ mode: "flow_control", returnTo });
  }, [append]);

  const resetToLogin = useCallback(() => {
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
  }, []);

  const exitMessage = useCallback(() => {
    append(
      line(""),
      line(`Thanks for using Smart CalcX 👋`, "cyan"),
      line(`Goodbye, ${username}!`, "prompt"),
    );
    resetToLogin();
  }, [append, username, resetToLogin]);

  const navigateToMenu = useCallback((target: FlowReturn) => {
    switch (target) {
      case "menu": showMenu(); break;
      case "basic": showBasicMenu(); break;
      case "sci": showSciMenu(); break;
      case "sci_basic": showSciBasicMenu(); break;
      case "trig": showTrigMenu(); break;
      case "inv_trig": showInvTrigMenu(); break;
      case "expr":
        append(line(""), line("──── ⚡ Expression Mode ────", "cyan"), line("Type 'back' to return", "dim"), line(""));
        setPromptLabel("expr >");
        setInputState({ mode: "expression" });
        break;
    }
  }, [showMenu, showBasicMenu, showSciMenu, showSciBasicMenu, showTrigMenu, showInvTrigMenu, append]);

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
          line("Accepts: integers (5), decimals (5.5), fractions (1/2)", "dim"),
        );
        append(...menuLines());
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
              const filename = username ? `${username}_history.txt` : "result.txt";
              a.href = url; a.download = filename; a.click();
              URL.revokeObjectURL(url);
              append(line("✅ Saved to '${username}_history.txt'", "success", 2));
            }
            showMenu();
            break;
          case "0": exitMessage(); break;
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
          if (n === null) { showError("Invalid input! Enter numbers, decimals, or fractions only."); return; }
          setPromptLabel("🔢 val_2:");
          setInputState({ mode: "basic_input", op: inputState.op, step: "val2", val1: n });
        } else {
          const n = parseNum(trimmed);
          if (n === null) { showError("Invalid input! Enter numbers, decimals, or fractions only."); return; }
          try {
            const ops: Record<string, (a: number, b: number) => string> = {
              "+": add, "-": subtract, "*": multiply, "/": divide, "%": modulus,
            };
            const syms: Record<string, string> = { "+": "➕", "-": "➖", "*": "✖️", "/": "➗", "%": "%" };
            const res = ops[inputState.op](inputState.val1, n);
            showResult(`${inputState.val1} ${syms[inputState.op]} ${n}`, res);
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showFlowControl("basic");
        }
        break;
      }

      case "sci_select": {
        switch (trimmed) {
          case "1": showSciBasicMenu(); break;
          case "2": showTrigMenu(); break;
          case "3": showInvTrigMenu(); break;
          case "0": showMenu(); break;
          default: showError("Unknown option. Please enter 0-3.");
        }
        break;
      }

      case "sci_basic_select": {
        if (trimmed === "0") { showSciMenu(); return; }
        const opMap: Record<string, string> = { "1": "sqrt", "2": "pow", "3": "fact", "4": "log", "5": "exp" };
        const op = opMap[trimmed];
        if (!op) { showError("Unknown operation. Please enter 0-5."); return; }
        if (op === "pow") {
          setPromptLabel("🔢 base:");
        } else {
          const labels: Record<string, string> = { sqrt: "🔢 value:", fact: "🔢 value (int):", log: "🔢 value:", exp: "🔢 value:" };
          setPromptLabel(labels[op]);
        }
        setInputState({ mode: "sci_basic_input", op, step: "val1" });
        break;
      }

      case "sci_basic_input": {
        if (inputState.step === "val1") {
          const n = parseNum(trimmed);
          if (n === null) { showError("Invalid input! Enter numbers, decimals, or fractions only."); return; }
          if (inputState.op === "pow") {
            setPromptLabel("🔢 exponent:");
            setInputState({ mode: "sci_basic_input", op: "pow", step: "val2", base: n });
            return;
          }
          try {
            const fns: Record<string, (v: number) => string> = {
              sqrt: squareRoot, fact: factorial, log: logarithm, exp: exponential,
            };
            const labels: Record<string, (v: number) => string> = {
              sqrt: (v) => `√${v}`, fact: (v) => `${v}!`, log: (v) => `log₁₀(${v})`, exp: (v) => `e^${v}`,
            };
            showResult(labels[inputState.op](n), fns[inputState.op](n));
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showFlowControl("sci_basic");
        } else if (inputState.step === "val2" && inputState.op === "pow") {
          const n = parseNum(trimmed);
          if (n === null) { showError("Invalid input! Enter numbers, decimals, or fractions only."); return; }
          try {
            showResult(`${inputState.base}^${n}`, power(inputState.base, n));
          } catch (e: unknown) {
            showError(e instanceof Error ? e.message : String(e));
          }
          showFlowControl("sci_basic");
        }
        break;
      }

      case "trig_select": {
        if (trimmed === "0") { showSciMenu(); return; }
        const opMap: Record<string, string> = { "1": "sin", "2": "cos", "3": "tan", "4": "sec", "5": "cosec", "6": "cot" };
        const op = opMap[trimmed];
        if (!op) { showError("Unknown operation. Please enter 0-6."); return; }
        setPromptLabel("🔢 angle (deg):");
        setInputState({ mode: "trig_input", op });
        break;
      }

      case "trig_input": {
        const n = parseNum(trimmed);
        if (n === null) { showError("Invalid input! Enter numbers, decimals, or fractions only."); return; }
        try {
          const fns: Record<string, (v: number) => string> = {
            sin: sine, cos: cosine, tan: tangent, sec: secant, cosec: cosecant, cot: cotangent,
          };
          showResult(`${inputState.op}(${n}°)`, fns[inputState.op](n));
        } catch (e: unknown) {
          showError(e instanceof Error ? e.message : String(e));
        }
        showFlowControl("trig");
        break;
      }

      case "inv_trig_select": {
        if (trimmed === "0") { showSciMenu(); return; }
        const opMap: Record<string, string> = { "1": "asin", "2": "acos", "3": "atan", "4": "asec", "5": "acosec", "6": "acot" };
        const op = opMap[trimmed];
        if (!op) { showError("Unknown operation. Please enter 0-6."); return; }
        const domainHints: Record<string, string> = {
          asin: "[-1,1]", acos: "[-1,1]", atan: "any", asec: "|v|>=1", acosec: "|v|>=1", acot: "any",
        };
        setPromptLabel(`🔢 value (${domainHints[op]}):`);
        setInputState({ mode: "inv_trig_input", op });
        break;
      }

      case "inv_trig_input": {
        const n = parseNum(trimmed);
        if (n === null) { showError("Invalid input! Enter numbers, decimals, or fractions only."); return; }
        try {
          const fns: Record<string, (v: number) => string> = {
            asin: inverseSine, acos: inverseCosine, atan: inverseTangent,
            asec: inverseSecant, acosec: inverseCosecant, acot: inverseCotangent,
          };
          showResult(`${inputState.op}(${n})°`, fns[inputState.op](n));
        } catch (e: unknown) {
          showError(e instanceof Error ? e.message : String(e));
        }
        showFlowControl("inv_trig");
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
        showFlowControl("expr");
        break;
      }

      case "flow_control": {
        switch (trimmed) {
          case "1": showMenu(); break;
          case "2": navigateToMenu(inputState.returnTo); break;
          case "0": exitMessage(); break;
          default: showError("Please enter 1 (Continue), 2 (Back), or 0 (Exit).");
        }
        break;
      }
    }
  }, [inputState, history, append, showMenu, showBasicMenu, showSciMenu, showSciBasicMenu, showTrigMenu, showInvTrigMenu, record, promptLabel, username, showResult, showError, showFlowControl, exitMessage, navigateToMenu]);

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
