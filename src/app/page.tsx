'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogicSimulator } from '@/components/logic/LogicSimulator';
import { BinaryCalculator } from '@/components/logic/BinaryCalculator';
import { BooleanLaws } from '@/components/logic/BooleanLaws';
import { CircuitDevtools } from '@/components/logic/CircuitDevtools';
import { KarnaughMap } from '@/components/kmap/KarnaughMap';
import { NotesPanel } from '@/components/notes/NotesPanel';
import { QuestionGenerator } from '@/components/questions/QuestionGenerator';
import { QuestionSolver } from '@/components/questions/QuestionSolver';
import { PasswordGate } from '@/components/auth/PasswordGate';
import { useAuthStore } from '@/store/authStore';
import { GlitchText } from '@/components/ui/glitch-text';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <PasswordGate />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-10 relative"><img src="/logo.svg" alt="Logic Simulator Logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} /></div>
            <div><h1 className="text-xl font-bold leading-none"><GlitchText text="LOGIC SIMULATOR" className="text-base sm:text-xl" /></h1><p className="text-[11px] text-muted-foreground leading-none mt-1">Build circuits · K-maps · Solver · Calc · Laws · Notes · Practice</p></div>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground"><span className="hidden lg:inline">⚡ Real-time simulation · Auto truth tables · WebGL secured</span><ThemeSwitcher /></div>
        </div>
      </header>
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-4">
        <Tabs defaultValue="simulator" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4 sm:grid-cols-7 mb-4 h-auto">
            <TabsTrigger value="simulator" className="text-xs sm:text-sm">Simulator</TabsTrigger>
            <TabsTrigger value="solver" className="text-xs sm:text-sm">Solver</TabsTrigger>
            <TabsTrigger value="kmap" className="text-xs sm:text-sm">K-Map</TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs sm:text-sm">Calculator</TabsTrigger>
            <TabsTrigger value="laws" className="text-xs sm:text-sm">Laws</TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
            <TabsTrigger value="practice" className="text-xs sm:text-sm">Practice</TabsTrigger>
          </TabsList>
          <TabsContent value="simulator" className="mt-0"><LogicSimulator /></TabsContent>
          <TabsContent value="solver" className="mt-0"><QuestionSolver /></TabsContent>
          <TabsContent value="kmap" className="mt-0"><KarnaughMap /></TabsContent>
          <TabsContent value="calculator" className="mt-0"><BinaryCalculator /></TabsContent>
          <TabsContent value="laws" className="mt-0"><BooleanLaws /></TabsContent>
          <TabsContent value="notes" className="mt-0"><NotesPanel /></TabsContent>
          <TabsContent value="practice" className="mt-0"><QuestionGenerator /></TabsContent>
        </Tabs>
      </main>

      {/* Made by Aaliyan — rainbow glowing */}
      <div className="text-center py-3">
        <span className="rainbow-glow text-lg sm:text-xl">Made by Aaliyan</span>
      </div>

      <footer className="mt-auto border-t border-border bg-card">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3 rounded-lg bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10 border border-indigo-500/20">
            <div className="relative flex-shrink-0"><div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg" style={{ background:'linear-gradient(135deg, #00f2fe 0%, #4facfe 25%, #00ff87 50%, #fed373 75%, #ff0844 100%)', boxShadow:'0 0 16px rgba(99,102,241,0.5)' }}>A</div><span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-card" title="Online" /></div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-sm font-semibold flex items-center justify-center sm:justify-start gap-2 flex-wrap"><span>Hi, I'm Aaliyan</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">Age 17</span><span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-mono">Creator</span></div>
              <div className="text-xs text-muted-foreground mt-1">17-year-old developer passionate about digital logic, circuit design, and building tools that make learning fun. This Logic Simulator is my project to help students master boolean algebra, K-maps, and gate-level design.</div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Built by</div><GlitchText text="AALIYAN" className="text-sm" /></div>
          </div>
          <div className="text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2"><div>© 2026 Logic Simulator · Built with Next.js · TypeScript · Tailwind CSS · WebGL</div><CircuitDevtools /></div>
        </div>
      </footer>
    </div>
  );
}
