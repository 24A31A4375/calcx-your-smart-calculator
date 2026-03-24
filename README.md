# Smart CalcX – Interactive CLI Calculator

A visually attractive, web-based CLI calculator with colorful UI, continuous operation flow, and strict numeric input validation.

## Features

- **Login Screen** — Stylish welcome banner with username prompt
- **Basic Operations** — Addition, subtraction, multiplication, division, modulus with emoji-rich UI
- **Scientific Operations** — Square root, power, factorial, logarithm, exponential, trig & inverse trig
- **Expression Mode** — Evaluate free-form math expressions (`5+3*2`, `sqrt(144)`, `sin(30)`)
- **Session History** — View all calculations performed during the session
- **Save to File** — Export history to `result.txt`
- **Continue Prompt** — After each operation, choose to continue or exit
- **Strict Input Validation** — Only numeric inputs accepted; friendly error messages for invalid input
- **Colorful Terminal UI** — Cyan headings, green results, red errors, yellow prompts, emojis throughout

## Input Validation

All numeric inputs are validated before processing:
- Non-numeric values are rejected with `"❌ Invalid input! Please enter numbers only."`
- Domain errors (e.g., √ of negative, division by zero) show descriptive messages
- Expression mode catches syntax errors gracefully

## How to Run

1. Open the project in your browser
2. Enter a username at the login prompt
3. Select an operation (1-5) or exit (0)
4. Follow prompts, enter values, view results
5. Choose to continue or exit after each calculation

## Example Usage

```
👤 username > alice
Hello, alice! Ready to calculate 🚀

cmd > 1          (Basic Operations)
basic > 1        (Addition)
🔢 val_1: 15
🔢 val_2: 27
👉 Result: 42

Do you want to continue? (yes/no): yes
```

## Tech

- React + TypeScript + Vite
- Tailwind CSS (terminal theme)
- mathjs (expression evaluation)
- Core math engine (`src/lib/calcx-engine.ts`)
