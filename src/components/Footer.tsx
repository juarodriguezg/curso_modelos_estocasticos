export default function Footer() {
  return (
    <footer className="relative z-50 w-full bg-[color:var(--color-header)] text-[color:var(--color-text-light)] py-6 mt-auto">
      <div className="max-w-4xl mx-auto text-center text-sm">
        © {new Date().getFullYear()} Curso de Modelos Estocásticos · Universidad Nacional de Colombia
      </div>
    </footer>
  )
}
