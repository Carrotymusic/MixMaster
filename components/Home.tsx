import React, { useEffect, useState, useRef } from 'react';
import ContactForm from './ContactForm';
import { Play, Pause, Volume2, Music } from 'lucide-react';

interface HomeProps {
    onNavigateToGame: () => void;
}

const AudioPlayer: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration || 1;
            setProgress((current / duration) * 100);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    // Generate random bars for visual waveform
    const bars = Array.from({ length: 60 }, () => Math.floor(Math.random() * 60) + 20);

    return (
        <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl p-8 relative overflow-hidden group hover:border-carroty/30 transition-all duration-500">
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-carroty blur-[120px] opacity-10 pointer-events-none"></div>

            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">

                {/* Play Button */}
                <button
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-carroty text-black flex items-center justify-center hover:scale-110 hover:shadow-[0_0_20px_rgba(255,72,0,0.5)] transition-all duration-300 flex-shrink-0"
                >
                    {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
                </button>

                {/* Track Info & Waveform */}
                <div className="flex-1 w-full">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <div className="text-carroty text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                <Music size={12} /> Przykładowa Realizacja
                            </div>
                            <h3 className="text-white font-syne text-2xl font-bold">LATEST PROJECT DEMO</h3>
                        </div>
                        <div className="text-gray-500 font-mono text-xs">
                            {audioRef.current ? formatTime(audioRef.current.currentTime) : "0:00"} / {audioRef.current && !isNaN(audioRef.current.duration) ? formatTime(audioRef.current.duration) : "--:--"}
                        </div>
                    </div>

                    {/* Waveform Visualization */}
                    <div className="h-16 flex items-center gap-1 cursor-pointer relative group/wave" onClick={togglePlay}>
                        {bars.map((height, i) => {
                            // Calculate if this bar is "active" based on progress
                            const barPercent = (i / bars.length) * 100;
                            const isActive = barPercent < progress;

                            return (
                                <div
                                    key={i}
                                    className={`flex-1 rounded-full transition-all duration-300 ${isActive ? 'bg-carroty shadow-[0_0_5px_rgba(255,72,0,0.5)]' : 'bg-white/10 group-hover/wave:bg-white/20'}`}
                                    style={{
                                        height: `${isPlaying ? height + (Math.random() * 10 - 5) : height}%`,
                                        opacity: isActive ? 1 : 0.5
                                    }}
                                ></div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Hidden Audio Element - pointing to root music1.mp3 */}
            <audio
                ref={audioRef}
                src="/music1.mp3"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />
        </div>
    );
};

const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
};

const Home: React.FC<HomeProps> = ({ onNavigateToGame }) => {
    const [prices, setPrices] = useState<{ [key: string]: number }>({
        '25': 25,
        '35': 35,
        '55': 55,
        '95': 95
    });
    const [plnRate, setPlnRate] = useState(4.0);

    useEffect(() => {
        // Fetch currency
        const fetchCurrency = async () => {
            try {
                const response = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await response.json();
                if (data && data.rates && data.rates.PLN) {
                    setPlnRate(data.rates.PLN);
                }
            } catch (e) {
                console.error("Currency fetch error", e);
            }
        };
        fetchCurrency();
    }, []);

    // 3D Carousel Items
    const reviews = [
        { text: "Niesamowita robota! Mój utwór brzmi teraz potężnie.", author: "jonny_beats", country: "USA", rotate: 0 },
        { text: "CarrotyMusic to prawdziwy profesjonalista. Wokal siedzi idealnie.", author: "mc_flow99", country: "UK", rotate: 72 },
        { text: "Szybka realizacja i świetna wizja.", author: "studio_vibe", country: "DE", rotate: 144 },
        { text: "Najlepszy inżynier na Fiverr w tej cenie.", author: "alex_prod", country: "PL", rotate: 216 },
        { text: "Komunikacja 10/10. Głośno i dynamicznie.", author: "dj_kris", country: "FR", rotate: 288 },
    ];

    return (
        <>
            {/* HERO */}
            <section className="min-h-screen flex flex-col justify-center w-[88%] max-w-[1600px] mx-auto pt-20 relative">

                {/* top-left hero image (md+ only) */}
                <img
                    src="/carroty.jpg"
                    alt="Carroty Music"
                    className="hidden md:block absolute top-6 left-6 w-40 h-40 object-cover rounded-xl border border-white/10 shadow-2xl pointer-events-auto"
                />

                {/* GAME TEASER */}
                <div
                    onClick={onNavigateToGame}
                    className="mb-8 cursor-pointer group animate-fade-in-up delay-100"
                >
                    <div className="inline-block border border-carroty/30 p-4 rounded-lg bg-carroty/5 hover:bg-carroty/10 transition-colors">
                        <h3 className="text-carroty font-syne font-extrabold text-xl md:text-2xl uppercase mb-1 flex items-center gap-2">
                            <span className="w-2 h-2 md:w-3 md:h-3 bg-carroty rounded-full animate-pulse"></span>
                            ZOSTAŃ INŻYNIEREM DŹWIĘKU
                        </h3>
                        <p className="text-gray-300 font-grotesk text-sm md:text-base group-hover:text-white transition-colors flex flex-col gap-1">
                            <span className="font-bold">Po co płacić profesjonaliście? Zrób to sam.</span>
                            <span className="text-carroty flex items-center gap-2">Uruchom Darmowy Symulator <span className="text-xl">→</span></span>
                        </p>
                    </div>
                </div>

                <div className="animate-fade-in-up w-full">
                    <h1 className="text-[clamp(2.5rem,8.5vw,10rem)] leading-[0.9] -tracking-[2px] font-syne font-extrabold text-stroke transition-all duration-500 hover:text-carroty hover:text-stroke-carroty break-words w-full">
                        MIX &<br />MASTERING
                    </h1>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-10 text-[#888] font-light text-base md:text-lg">
                    <p>TWOJE BRZMIENIE • STANDARD RADIOWY</p>
                    <p className="mt-4 md:mt-0">LOKALIZACJA: POLSKA • ZASIĘG: GLOBALNY</p>
                    <p className="mt-4 md:mt-0 hidden md:block">PRZEWIŃ W DÓŁ ↓</p>
                </div>
            </section>

            {/* MARQUEE */}
            <div className="w-full overflow-hidden whitespace-nowrap bg-carroty text-black py-5 -rotate-1 scale-105 my-20">
                <div className="inline-block animate-marquee font-syne font-extrabold text-4xl md:text-5xl uppercase">
                    HIP-HOP • TRAP • POP • ROCK • ANALOG WARMTH • VOCAL TUNING • DOLBY ATMOS READY • CARROTY MUSIC • MIXING • MASTERING • HIP-HOP • TRAP • POP • ROCK • ANALOG WARMTH • VOCAL TUNING • DOLBY ATMOS READY •
                </div>
            </div>

            {/* ABOUT */}
            <section id="about" className="w-[88%] max-w-[1600px] mx-auto py-20">
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-16">
                    <div>
                        <p className="text-2xl md:text-3xl leading-relaxed text-white mb-8">
                            Witaj w świecie profesjonalnego dźwięku. Jestem inżynierem <span className="text-carroty">Mix & Mastering</span> z wieloletnim doświadczeniem w gatunkach takich jak Trap, Rap, Drill, Hip-Hop, EDM oraz Pop.
                        </p>
                        <p className="text-base md:text-lg leading-loose text-[#aaa]">
                            Mój cel jest prosty: sprawić, by Twoja muzyka brzmiała zgodnie ze standardami radiowymi i streamingowymi.
                            Moje prace były wspierane przez tytanów branży, w tym <strong className="text-white">Spinnin' Records, R3HAB, Nicky Romero</strong> i wielu innych.
                            <br /><br />
                            Nie używam gotowych presetów. Każdy utwór traktuję indywidualnie, łącząc precyzję cyfrową z ciepłem analogu.
                        </p>
                    </div>
                    <div>
                        <h3 className="text-white text-xl font-bold font-syne uppercase mb-6">W KAŻDYM PAKIECIE:</h3>
                        <ul className="list-none space-y-4 text-[#ccc]">
                            {["Korekcja tonacji (Auto-Tune / Melodyne)", "Zaawansowana edycja wokalu (EQ, De-essing)", "Efekty przestrzenne (Reverb, Delay, Stereo)", "Analogowa Kompresja i Saturacja", "Mastering pod Spotify, Apple Music (-14 LUFS)"].map((item, i) => (
                                <li key={i} className="relative pl-6 before:content-['•'] before:text-carroty before:absolute before:left-0 text-lg">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* PORTFOLIO PLAYER SECTION */}
            <section id="portfolio" className="w-[88%] max-w-[1600px] mx-auto pb-20">
                <h2 className="text-4xl md:text-6xl font-syne font-extrabold mb-12 border-b border-white/10 pb-6">
                    PORTFOLIO
                </h2>
                <AudioPlayer />
            </section>

            {/* PRICING */}
            <section id="services" className="w-[88%] max-w-[1600px] mx-auto py-20">
                <h2 className="text-4xl md:text-6xl font-syne font-extrabold mb-12 border-b border-white/10 pb-6 flex justify-between items-end">
                    CENNIK <span className="text-base font-grotesk font-normal text-carroty tracking-widest hidden md:inline">ZAINWESTUJ W JAKOŚĆ</span>
                </h2>

                <div className="flex flex-col">
                    {[
                        { id: "01", title: "Tylko Mastering", price: 25, desc: "Maksymalizacja głośności i balans." },
                        { id: "02", title: "Mix & Mastering (1-5 ścieżek)", price: 35, desc: "Dla prostych bitów lub wokalu." },
                        { id: "03", title: "Mix & Mastering (6-15 ścieżek)", price: 55, desc: "Standardowy multitrack." },
                        { id: "04", title: "Mix & Mastering (Unlimited)", price: 95, desc: "Pełna produkcja bez limitów." },
                    ].map((service) => (
                        <a
                            key={service.id}
                            href="https://www.fiverr.com/carrotymusic/professional-mix-and-mastering-streaming-standard"
                            target="_blank"
                            rel="noreferrer"
                            className="group flex flex-col md:flex-row justify-between items-start md:items-center py-10 border-b border-white/10 hover:border-carroty hover:pl-5 transition-all duration-300"
                        >
                            <div className="flex items-baseline gap-8">
                                <span className="text-[#555] group-hover:text-carroty transition-colors font-mono">{service.id}</span>
                                <span className="text-2xl md:text-4xl font-bold font-syne group-hover:text-carroty transition-colors">{service.title}</span>
                            </div>
                            <div className="text-right mt-4 md:mt-0">
                                <span className="block text-2xl font-bold text-white mb-1">
                                    ${service.price} <span className="text-sm font-normal text-[#888]">(~{Math.round(service.price * plnRate)} PLN)</span>
                                </span>
                                <span className="text-sm text-[#888]">{service.desc}</span>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            {/* ORDER CTA */}
            <section className="w-[88%] max-w-[1600px] mx-auto">
                <div className="my-20 p-16 border border-white/10 text-center bg-gradient-to-b from-white/1 to-white/5 rounded-lg">
                    <h2 className="text-4xl md:text-5xl font-syne font-extrabold mb-6">GOTOWY NA BRZMIENIE <span className="text-carroty">PRO</span>?</h2>
                    <p className="text-[#aaa] max-w-xl mx-auto mb-10 text-lg">
                        Zamów bezpośrednio przez Fiverr, aby skorzystać z bezpiecznych płatności i gwarantowanych terminów.
                    </p>
                    <a
                        href="https://www.fiverr.com/carrotymusic/professional-mix-and-mastering-streaming-standard"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block py-5 px-16 bg-carroty text-black font-syne font-extrabold text-2xl uppercase hover:bg-white hover:scale-105 hover:shadow-[0_0_30px_rgba(255,72,0,0.4)] transition-all duration-300 clip-path-polygon"
                        style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                    >
                        Zamów na Fiverr
                    </a>
                </div>
            </section>

            {/* 3D REVIEWS */}
            <section id="reviews" className="w-[88%] max-w-[1600px] mx-auto py-20 overflow-hidden">
                <h2 className="text-4xl md:text-6xl font-syne font-extrabold mb-12 border-b border-white/10 pb-6">OPINIE KLIENTÓW</h2>

                <div className="relative h-[400px] flex justify-center items-center perspective-container scale-75 md:scale-100">
                    <div className="absolute w-full h-full carousel-3d animate-spin-slow">
                        {reviews.map((review, i) => (
                            <div
                                key={i}
                                className="carousel-item w-[350px] h-[250px] bg-neutral-900/95 border border-[#333] p-8 flex flex-col justify-between shadow-2xl"
                                style={{ transform: `rotateY(${review.rotate}deg) translateZ(400px)` }}
                            >
                                <p className="text-gray-300 italic leading-relaxed text-sm">"{review.text}"</p>
                                <div>
                                    <div className="text-gold text-lg tracking-widest drop-shadow-[0_0_5px_rgba(255,215,0,0.4)]">★★★★★</div>
                                    <div className="flex items-center gap-3 mt-4">
                                        <div className="w-10 h-10 bg-[#222] rounded-full flex items-center justify-center text-carroty font-bold">{review.author[0].toUpperCase()}</div>
                                        <div className="leading-tight">
                                            <div className="text-white font-bold text-sm">{review.author}</div>
                                            <div className="text-[#666] text-xs">{review.country}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact" className="py-24 text-center">
                <div className="w-[88%] max-w-[1600px] mx-auto">
                    <p className="text-sm text-[#666] uppercase tracking-[2px] mb-5">ROZPOCZNIJ PROJEKT</p>
                    <h2 className="text-4xl md:text-6xl font-syne font-extrabold mb-12">NAPISZ WIADOMOŚĆ</h2>

                    <ContactForm />

                    <div className="flex flex-wrap justify-center gap-8 mt-12">
                        <a href="https://www.instagram.com/carrotymusic/" target="_blank" rel="noreferrer" className="text-sm text-[#666] hover:text-white hover:border-b hover:border-carroty transition-all">INSTAGRAM DM</a>
                        <a href="https://www.fiverr.com/carrotymusic" target="_blank" rel="noreferrer" className="text-sm text-[#666] hover:text-white hover:border-b hover:border-carroty transition-all">PROFIL FIVERR</a>
                    </div>
                </div>

                <footer className="mt-16 text-xs text-[#444]">
                    &copy; 2024 CarrotyMusic. Sonic Engineering.
                </footer>
            </section>
        </>
    );
};

export default Home;
