const STEPS = [
  {
    step: '01',
    title: 'Install & configure',
    description: 'One command. Set your API key once.',
    code: ['npm install -g brainsield', 'brain config --set-key sk-ant-...'],
  },
  {
    step: '02',
    title: 'Scan your project',
    description: '5 agents run in parallel. Results in under a second.',
    code: ['cd my-nextjs-app', 'brain scan'],
  },
  {
    step: '03',
    title: 'Fix with AI',
    description: 'Review the diff, apply fixes with one command.',
    code: ['brain fix --critical --ai', '# or fix a specific ID', 'brain fix SEC-A1B2C3'],
  },
  {
    step: '04',
    title: 'Export & track',
    description: 'Export reports, track progress on the dashboard.',
    code: ['brain report --md', 'brain report --save'],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-zinc-950/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-zinc-400 max-w-md mx-auto">
            From install to secure codebase in 4 steps.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[calc(2rem-1px)] top-0 bottom-0 w-px bg-gradient-to-b from-violet-600 via-violet-800 to-transparent hidden md:block" />

          <div className="space-y-12">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-8">
                {/* Step indicator */}
                <div className="hidden md:flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0 z-10 relative">
                    <span className="text-violet-300 font-mono font-bold text-sm">{s.step}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <span className="md:hidden text-violet-400 font-mono text-xs mb-2 block">{s.step}</span>
                  <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-zinc-400 mb-4">{s.description}</p>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-sm">
                    {s.code.map((line, j) => (
                      <div key={j} className={line.startsWith('#') ? 'text-zinc-600' : 'text-violet-300'}>
                        {!line.startsWith('#') && <span className="text-zinc-600 select-none mr-2">$</span>}
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
