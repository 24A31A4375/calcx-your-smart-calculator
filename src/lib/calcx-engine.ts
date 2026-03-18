/**
 * CalcX Engine — Core calculation logic for the CLI calculator.
 * Handles basic arithmetic, scientific operations, and expression evaluation.
 * All results are rounded to 4 decimal places unless they are integers.
 */

import * as math from "mathjs";

// --- Types ---
export interface HistoryEntry {
  timestamp: string;
  expression: string;
  result: string;
}

// --- Formatting Helpers ---

/** Format a number: remove trailing zeros, round to 4 decimals */
function formatResult(value: number): string {
  if (!isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
  if (isNaN(value)) return "NaN";
  const rounded = Math.round(value * 10000) / 10000;
  return String(rounded);
}

function now(): string {
  const d = new Date();
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// --- Basic Operations ---

export function add(a: number, b: number): string {
  return formatResult(a + b);
}

export function subtract(a: number, b: number): string {
  return formatResult(a - b);
}

export function multiply(a: number, b: number): string {
  return formatResult(a * b);
}

export function divide(a: number, b: number): string {
  if (b === 0) throw new Error("math_error: division by zero.");
  return formatResult(a / b);
}

export function modulus(a: number, b: number): string {
  if (b === 0) throw new Error("math_error: modulus by zero.");
  return formatResult(a % b);
}

// --- Scientific Operations ---

export function squareRoot(val: number): string {
  if (val < 0) throw new Error("domain_error: cannot sqrt negative value.");
  return formatResult(Math.sqrt(val));
}

export function power(base: number, exp: number): string {
  return formatResult(Math.pow(base, exp));
}

export function factorial(n: number): string {
  if (n < 0 || !Number.isInteger(n)) throw new Error("domain_error: factorial requires non-negative integer.");
  if (n > 170) throw new Error("overflow_error: value too large.");
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return formatResult(result);
}

export function logarithm(val: number): string {
  if (val <= 0) throw new Error("domain_error: cannot log non-positive value.");
  return formatResult(Math.log10(val));
}

export function exponential(val: number): string {
  return formatResult(Math.exp(val));
}

export function sine(degrees: number): string {
  return formatResult(Math.sin((degrees * Math.PI) / 180));
}

export function cosine(degrees: number): string {
  return formatResult(Math.cos((degrees * Math.PI) / 180));
}

export function tangent(degrees: number): string {
  const rad = (degrees * Math.PI) / 180;
  if (Math.abs(Math.cos(rad)) < 1e-10) throw new Error("domain_error: tan undefined at this angle.");
  return formatResult(Math.tan(rad));
}

export function inverseSine(val: number): string {
  if (val < -1 || val > 1) throw new Error("domain_error: asin requires value in [-1, 1].");
  return formatResult((Math.asin(val) * 180) / Math.PI);
}

export function inverseCosine(val: number): string {
  if (val < -1 || val > 1) throw new Error("domain_error: acos requires value in [-1, 1].");
  return formatResult((Math.acos(val) * 180) / Math.PI);
}

export function inverseTangent(val: number): string {
  return formatResult((Math.atan(val) * 180) / Math.PI);
}

// --- Expression Evaluation ---

export function evaluateExpression(expr: string): string {
  try {
    const result = math.evaluate(expr);
    if (typeof result === "number") return formatResult(result);
    return String(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`syntax_error: ${msg}`);
  }
}

// --- History Management ---

export function createHistoryEntry(expression: string, result: string): HistoryEntry {
  return { timestamp: now(), expression, result };
}

export function historyToFileContent(history: HistoryEntry[]): string {
  return history.map((e) => `${e.timestamp} | ${e.expression} = ${e.result}`).join("\n") + "\n";
}
