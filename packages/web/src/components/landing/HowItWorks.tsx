import { cn } from '@/lib/utils';

const STEPS = [
  {
    step: '01',
    title: 'Install & configure',
    description: 'One command. Set your Anthropic API key once and you\'re ready.',
    code: [
      { text: 'npm install -g brainsield', type: 'cmd' },
      { text: 'brain config --set-key sk-ant-...', type: 'cmd' },
    ],
    color: 'text-violet-400',
    border: 'border-violet-500/20',
    bg: 'bg-violet-500/5',
    dot: 'bg-violet-500',
  },
  {
    step: '02',
    title: 'Scan your project',
    description: '5 agents run in parallel. Results in under a second.',
    code: [
      { text: 'cd my-nextjs-app', type: 'cmd' },
      { text: 'brain scan', type: 'cmd' },
    ],
    color: 'text-blue-400',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/5',
    dot: 'bg-blue-500',
  },
  {
    step: '03',
    title: 'Fix with AI',
    description: 'Review the diff, apply Claude-generated fixes with one command.',
    code: [
      { text: 'brain fix --critical --ai', type: 'cmd' },
      { text: '# or target a specific ID', type: 'comment' },
      { text: 'brain fix SEC-A1B2C3', type: 'cmd' },
    ],
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    dot: 'bg-emerald-500',
  },
  {
    step: '04',
    title: 'Export & track',
    description: 'Export reports in JSON or Markdown. Track progress on the dashboard.',
    code: [
      { text: 'brain report --md', type: 'cmd' },
      { text: 'brain report --save', type: 'cmd' },
    ],
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
    dot: 'bg-amber-500',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 relative">
      {/* Subtle separator */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            From install to secure in 4 steps
          </h2>
          <p className="text-zinc-400 max-w-sm mx-auto">
            No config files. No YAML. Just your terminal.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-[1.75rem] top-8 bottom-8 w-px bg-linear-to-b from-violet-500/40 via-white/[0.05] to-transparent hidden md:block" />

          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-6 group">
                {/* Step number */}
                <div className="hidden md:flex flex-col items-center shrink-0">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center z-10 relative',
                    'border transition-all duration-300',
                    s.bg, s.border,
                    'group-hover:scale-105'
                  )}>
                    <span className={cn('font-mono font-bold text-sm', s.color)}>{s.step}</span>
                  </div>
                </div>

                {/* Content card */}
                <div className={cn(
                  'flex-1 rounded-2xl p-5 mb-2',
                  'bg-white/[0.02] border border-white/[0.07]',
                  'hover:bg-white/[0.035] hover:border-white/[0.1]',
                  'transition-all duration-200'
                )}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Mobile step */}
                    <span className={cn('md:hidden text-xs font-mono font-bold', s.color)}>{s.step}</span>

                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-1">{s.title}</h3>
                      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{s.description}</p>

                      {/* Code block */}
                      <div className="bg-[#0d0d0f] border border-white/[0.06] rounded-xl p-3.5 font-mono text-xs">
                        {s.code.map((line, j) => (
                          <div key={j} className={cn(
                            'flex gap-2',
                            line.type === 'comment' ? 'text-zinc-600' : 'text-zinc-300'
                          )}>
                            {line.type !== 'comment' && (
                              <span className="text-zinc-600 select-none">$</span>
                            )}
                            <span>{line.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
