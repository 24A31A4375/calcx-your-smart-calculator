# Smart CalcX – Interactive CLI Calculator

A professional, web-based CLI calculator with colorful UI, structured navigation, trigonometry categorization, fraction support, and strict input validation.
https://lovable.dev/projects/1519b3cd-1e9a-4c8b-b10b-6c8afb55cbad
## Features

- **Login Screen** — Stylish welcome banner with username prompt
- **Flexible Input** — Accepts integers (`5`), decimals (`5.5`), and fractions (`1/2`, `3/4`)
- **Basic Operations** — Addition, subtraction, multiplication, division, modulus
- **Scientific Operations** — Square root, power, factorial, logarithm, exponential
- **Trigonometric Functions** — sin, cos, tan, sec, cosec, cot (input in degrees)
- **Inverse Trig Functions** — asin, acos, atan, asec, acosec, acot (output in degrees)
- **Expression Mode** — Evaluate free-form math expressions (`5+3*2`, `sqrt(144)`, `1/2 + 3/4`)
- **Session History** — View all calculations performed during the session
- **Save to File** — Export history to `<username>_history.txt`
- **Flow Control** — After each operation: Continue → Operations, Back → Previous Menu, Exit
- **Colorful Terminal UI** — Cyan headings, green results, red errors, yellow prompts, emojis

## Input Validation

All numeric inputs accept three formats:
- **Integers**: `5`, `42`, `-3`
- **Decimals/Floats**: `5.5`, `0.75`, `-2.1`
- **Fractions**: `1/2` → 0.5, `3/4` → 0.75, `-1/3` → -0.3333

Invalid inputs (text, empty, division by zero in fractions) are rejected with:
`"❌ Invalid input! Enter numbers, decimals, or fractions only."`

## How to Run

1. Open the project in your browser
2. Enter a username at the login prompt
3. Select an operation (1-5) or exit (0)
4. Follow prompts, enter values, view results
5. Choose to Continue, Back, or Exit after each calculation

## Example Usage

```
👤 username > alice
Hello, alice! Ready to calculate 🚀

cmd > 1          (Basic Operations)
basic > 1        (Addition)
🔢 val_1: 1/2
🔢 val_2: 3/4
👉 Result: 1.25

➜ 1              (Continue → Operations)

cmd > 2          (Scientific)
sci > 2          (Trig)
trig > 1         (sin)
🔢 angle (deg): 30
👉 Result: 0.5

➜ 2              (Back → Trig Menu)
```

## Tech

- React + TypeScript + Vite
- Tailwind CSS (terminal theme)
- mathjs (expression evaluation)
- Core math engine (`src/lib/calcx-engine.ts`)
