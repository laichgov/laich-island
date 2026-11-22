export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1320] text-white font-sans selection:bg-green-500/30">
      
      {/* ПЕРВЫЙ ЭКРАН С ГИФКОЙ */}
      <section className="relative h-screen w-full overflow-hidden flex flex-col">
        
        {/* 1. Фоновая гифка */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/flag.gif')" }}
        />
        
        {/* 2. Затемнение (чтобы текст читался, как на скрине) */}
        <div className="absolute inset-0 z-0 bg-black/60" />

        {/* 3. Навигация (Navbar) */}
        <nav className="relative z-10 flex items-center justify-between p-6 md:p-10">
          <div className="text-xl font-bold flex items-center gap-2 tracking-wide">
            <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
            YOUR COMPANY
          </div>
          <div className="hidden md:flex gap-8 text-sm text-gray-300 font-medium">
            <a href="#" className="hover:text-white transition">Home</a>
            <a href="#" className="hover:text-white transition">Services</a>
            <a href="#" className="hover:text-white transition">Pricing</a>
            <a href="#" className="hover:text-white transition">About us</a>
            <a href="#" className="hover:text-white transition">Contact</a>
            <span className="cursor-pointer hover:text-white">🔍</span>
          </div>
        </nav>

        {/* 4. Контент (Текст и кнопки) */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-8 md:px-24">
          <h1 className="text-4xl md:text-6xl font-bold mb-2">Abstract Background</h1>
          <h2 className="text-lg md:text-xl text-gray-300 mb-8 border-b border-white/30 w-max pb-2">
            geometric vector background
          </h2>
          
          <p className="max-w-md text-xs md:text-sm text-gray-400 mb-8 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras a malesuada odio. Donec sed sem at neque faucibus efficitur vitae at urna. Donec venenatis nisl mauris, eu ultrices lorem sagittis ac. Nullam in egestas lacus, at ornare finibus. Fusce mollis, mauris quis euismod lacinia, sem tortor sodales ipsum.
          </p>

          <div className="flex gap-4">
            <button className="border border-white/40 text-sm px-6 py-2 rounded-full hover:bg-white hover:text-black transition">
              Lorem Ipsum
            </button>
            <button className="border border-white/40 text-sm px-6 py-2 rounded-full hover:bg-white hover:text-black transition">
              Dolor sit amet
            </button>
          </div>
        </div>

      </section>

      {/* ОСТАЛЬНОЙ КОНТЕНТ САЙТА (идет ниже) */}
      <section className="relative z-10 p-12 min-h-screen bg-[#111827]">
        <h2 className="text-3xl font-bold mb-4">Boat Launch Info</h2>
        <p className="text-gray-400">Остальной контент страницы...</p>
      </section>

    </main>
  )
}
