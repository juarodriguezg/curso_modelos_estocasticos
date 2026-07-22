import { BookOpen } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative z-50 w-full py-6 mt-auto border-t"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-medium)' }}>
          <BookOpen size={16} style={{ color: 'var(--color-accent)' }} />
          <span>Modelos Estocásticos</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          © {new Date().getFullYear()} Universidad Nacional de Colombia
        </p>
      </div>
    </footer>
  )
}
