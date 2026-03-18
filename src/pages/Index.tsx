import CalcXTerminal from "@/components/CalcXTerminal";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <h1 className="sr-only">CalcX – Command Line Calculator</h1>
      <CalcXTerminal />
      <p className="mt-4 text-xs terminal-dim-text font-mono">
        calcx v1.0.0 — type a command to begin
      </p>
    </div>
  );
};

export default Index;
