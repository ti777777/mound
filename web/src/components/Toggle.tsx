export default function Toggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!active)}
      className={`relative w-12 h-6 rounded-full transition-colors ${active ? 'bg-[#0ea5e9]' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-0'}`}/>
    </button>
  )
}
