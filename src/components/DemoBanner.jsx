import { Sparkles, Play, X, Compass, ArrowRight } from 'lucide-react'

export default function DemoBanner({ onStartDemo, onSkip }) {
    return (
        <div className="w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950 text-white shadow-md border-b border-white/10 dark:border-blue-900/40 relative overflow-hidden transition-all duration-300">
            {/* Background Decorative Accents */}
            <div className="absolute -right-8 -top-12 w-40 h-40 bg-white/10 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-10 w-32 h-32 bg-indigo-400/20 dark:bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="max-w-2xl mx-auto px-3.5 sm:px-4 py-3 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    
                    {/* Left content: Badge + Title + Subtitle */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner mt-0.5 sm:mt-0">
                            <Sparkles size={18} className="text-yellow-300 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest bg-yellow-400/20 text-yellow-200 border border-yellow-300/30 rounded-full backdrop-blur-xs">
                                    Interactive Guide
                                </span>
                                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
                                    New to HOsNote? Take a 1-Min Tour
                                </h2>
                            </div>
                            <p className="text-xs text-blue-100/90 dark:text-gray-300 mt-1 leading-snug">
                                Learn how patient tracking, handovers, clinical notes & instant search work.
                            </p>
                        </div>
                    </div>

                    {/* Right content: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-1 sm:pt-0">
                        <button
                            type="button"
                            onClick={onStartDemo}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-blue-900 font-bold text-xs shadow-md hover:bg-blue-50 active:scale-95 transition-all cursor-pointer border border-white/40"
                        >
                            <Play size={13} className="fill-blue-900" />
                            <span>Start Demo</span>
                        </button>

                        <button
                            type="button"
                            onClick={onSkip}
                            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white/90 hover:text-white transition-all cursor-pointer flex items-center gap-1 border border-white/15"
                            aria-label="Skip demo banner"
                            title="Skip (Can be accessed later in Settings)"
                        >
                            <span className="hidden sm:inline">Skip</span>
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
