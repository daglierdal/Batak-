import { useState, useEffect, useRef } from 'react';
import {
  Trash2, RotateCcw, Check, Edit3, Play, Crown,
  History, ArrowLeft, Undo2, Trophy, Clock,
  Calculator, Pencil, Info,
} from 'lucide-react';

export default function BatakSkorTablosu() {
  // ---------- STATE ----------
  const [yuklendi, setYuklendi] = useState(false);
  const [oyunBasladi, setOyunBasladi] = useState(false);
  const [mod, setMod] = useState('sozlu'); // 'sozlu' | 'klasik'
  const [isimGirisi, setIsimGirisi] = useState(['', '', '', '']);
  const [oyuncular, setOyuncular] = useState(['', '', '', '']);
  const [eller, setEller] = useState([]);
  const [ellerMeta, setEllerMeta] = useState([]); // [{sozler, aldilar}, ...] sözlü modda
  const [yeniEl, setYeniEl] = useState(['', '', '', '']);
  const [yeniSoz, setYeniSoz] = useState(['', '', '', '']);
  const [yeniAldi, setYeniAldi] = useState(['', '', '', '']);
  const [eksi, setEksi] = useState([false, false, false, false]);
  const [duzenlenen, setDuzenlenen] = useState(null);
  const [gecici, setGecici] = useState('');
  const [sifirlaOnay, setSifirlaOnay] = useState(false);
  const [yeniEklendi, setYeniEklendi] = useState(-1);
  const [gecmisGoster, setGecmisGoster] = useState(false);
  const [gecmisListe, setGecmisListe] = useState([]);
  const [gecmisDetay, setGecmisDetay] = useState(null);
  const [gecmisSilOnay, setGecmisSilOnay] = useState(null);
  const [sozDuzenle, setSozDuzenle] = useState(false); // sözü tekrar düzenle
  const [hedefEl, setHedefEl] = useState(11); // hedef el sayısı: 11..51, 2 adım
  const [kazananModal, setKazananModal] = useState(false);

  // Input ref'leri - otomatik focus için
  const sozRefs = useRef([]);
  const aldiRefs = useRef([]);
  const elRefs = useRef([]);
  const bekleTimer = useRef(null);

  // Otomatik geçiş yardımcısı
  // 2-9 veya iki haneli → hemen geç
  // 1 → bekle (10, 11, 12, 13 olabilir)
  // 0 → hemen geç
  const sonrayaGec = (refs, i, sonHandler, temiz) => {
    if (bekleTimer.current) clearTimeout(bekleTimer.current);
    if (temiz === '') return;

    const beklemeli = temiz === '1'; // 10-13 olma ihtimali
    const gecikme = beklemeli ? 600 : 150;

    bekleTimer.current = setTimeout(() => {
      if (i < 3) {
        refs.current[i + 1]?.focus();
        refs.current[i + 1]?.select();
      } else if (sonHandler) {
        sonHandler();
      }
    }, gecikme);
  };

  // ---------- SABİT VERİLER ----------
  const kartlar = [
    { sembol: '♠', harf: 'A', isim: 'MAÇA',  renk: '#e8d28a', rgb: '232,210,138' },
    { sembol: '♥', harf: 'K', isim: 'KUPA',  renk: '#d4574e', rgb: '212,87,78'   },
    { sembol: '♦', harf: 'V', isim: 'KARO',  renk: '#c9946b', rgb: '201,148,107' },
    { sembol: '♣', harf: 'P', isim: 'SİNEK', renk: '#7fa88a', rgb: '127,168,138' },
  ];

  const serifFont = { fontFamily: "'Playfair Display', Georgia, serif" };
  const italicFont = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
  const sansFont = { fontFamily: "'Manrope', system-ui, sans-serif" };

  // ---------- PUAN HESAPLAMA ----------
  // Klasik Batak puanlaması:
  // - Söz tuttu veya fazla aldı: 10*söz + (aldı - söz)
  // - Battı (aldı < söz): -10*söz
  const hesaplaPuan = (sozStr, aldiStr) => {
    const soz = Number(sozStr) || 0;
    const aldi = Number(aldiStr) || 0;
    if (soz === 0) {
      // 0 söz: hiç alırsa batar
      return aldi === 0 ? 0 : -aldi * 10;
    }
    if (aldi < soz) return -10 * soz;
    return 10 * soz + (aldi - soz);
  };

  // ---------- FONTLAR & CSS ----------
  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = `
      @keyframes batakFadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes batakPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
      @keyframes batakGlow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
      @keyframes batakSlideIn {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      .batak-fade-up { animation: batakFadeUp 0.5s ease-out both; }
      .batak-pulse { animation: batakPulse 0.4s ease-out; }
      .batak-slide-in { animation: batakSlideIn 0.4s ease-out both; }
      .batak-input:focus {
        box-shadow: 0 0 0 2px rgba(212,168,90,0.4), 0 0 20px rgba(212,168,90,0.15) !important;
      }
      .batak-no-scrollbar::-webkit-scrollbar { width: 4px; }
      .batak-no-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .batak-no-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(168,122,46,0.3);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(link)) document.head.removeChild(link);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  // ---------- KALICI SAKLAMA HELPER ----------
  // window.storage (Claude artifact) varsa onu, yoksa localStorage'ı kullan
  const storage = {
    async get(key) {
      try {
        if (typeof window !== 'undefined' && window.storage && window.storage.get) {
          const r = await window.storage.get(key);
          return r && r.value ? r.value : null;
        }
      } catch (_) {}
      try {
        return localStorage.getItem(key);
      } catch (_) { return null; }
    },
    async set(key, value) {
      try {
        if (typeof window !== 'undefined' && window.storage && window.storage.set) {
          await window.storage.set(key, value);
          return;
        }
      } catch (_) {}
      try { localStorage.setItem(key, value); } catch (_) {}
    },
    async delete(key) {
      try {
        if (typeof window !== 'undefined' && window.storage && window.storage.delete) {
          await window.storage.delete(key);
          return;
        }
      } catch (_) {}
      try { localStorage.removeItem(key); } catch (_) {}
    },
  };

  // ---------- KALICI SAKLAMA: YÜKLEME ----------
  useEffect(() => {
    (async () => {
      try {
        try {
          const val = await storage.get('batak:aktif');
          if (val) {
            const data = JSON.parse(val);
            if (data.oyuncular) setOyuncular(data.oyuncular);
            if (data.eller) setEller(data.eller);
            if (data.ellerMeta) setEllerMeta(data.ellerMeta);
            if (data.mod) setMod(data.mod);
            if (data.hedefEl) setHedefEl(data.hedefEl);
            if (data.oyunBasladi) setOyunBasladi(true);
          }
        } catch (_) { }

        try {
          const val = await storage.get('batak:gecmis');
          if (val) {
            const liste = JSON.parse(val);
            if (Array.isArray(liste)) setGecmisListe(liste);
          }
        } catch (_) { }
      } catch (e) {
        console.error('Storage yükleme hatası:', e);
      } finally {
        setYuklendi(true);
      }
    })();
  }, []);

  // ---------- KALICI SAKLAMA: OTOMATİK KAYDETME ----------
  useEffect(() => {
    if (!yuklendi) return;
    (async () => {
      try {
        if (oyunBasladi) {
          await storage.set(
            'batak:aktif',
            JSON.stringify({ oyuncular, eller, ellerMeta, mod, hedefEl, oyunBasladi: true })
          );
        } else {
          await storage.delete('batak:aktif');
        }
      } catch (e) { }
    })();
  }, [oyuncular, eller, ellerMeta, mod, hedefEl, oyunBasladi, yuklendi]);

  // Hedef el'e ulaşıldığında kazanan modalını aç
  useEffect(() => {
    if (!yuklendi || !oyunBasladi) return;
    if (eller.length > 0 && eller.length >= hedefEl) {
      setKazananModal(true);
    }
  }, [eller.length, hedefEl, yuklendi, oyunBasladi]);

  // Söz aşaması başlayınca ilk söz input'una otomatik focus
  useEffect(() => {
    if (!yuklendi || !oyunBasladi || mod !== 'sozlu') return;
    if (sozDuzenle && yeniSoz.every(v => v === '')) {
      setTimeout(() => {
        sozRefs.current[0]?.focus();
        sozRefs.current[0]?.select();
      }, 250);
    }
  }, [sozDuzenle, oyunBasladi, yuklendi, mod]);

  const saveGecmis = async (liste) => {
    try {
      await storage.set('batak:gecmis', JSON.stringify(liste));
    } catch (e) { }
  };

  // ---------- TÜRETİLEN DEĞERLER ----------
  const toplamlar = oyuncular.map((_, i) =>
    eller.reduce((sum, el) => sum + (Number(el[i]) || 0), 0)
  );
  const lider = toplamlar.some(t => t !== 0)
    ? toplamlar.indexOf(Math.max(...toplamlar))
    : -1;

  // Söz ortalaması / toplamı — söz girilmişse göster
  const sozToplami = yeniSoz.reduce((s, v) => s + (Number(v) || 0), 0);
  const sozDoluMu = yeniSoz.every(v => v !== '');

  // ---------- FONKSİYONLAR ----------
  const oyunuBaslat = () => {
    const isimler = isimGirisi.map((ad, i) => ad.trim() || `Oyuncu ${i + 1}`);
    setOyuncular(isimler);
    setEller([]);
    setEllerMeta([]);
    setOyunBasladi(true);
    setSozDuzenle(true); // ilk sözleri girecek
  };

  const sozleriKaydet = () => {
    // Geçiş: sözler tamam, aldı girişine geç
    setSozDuzenle(false);
  };

  const sozleriSifirla = () => {
    setYeniSoz(['', '', '', '']);
    setYeniAldi(['', '', '', '']);
    setSozDuzenle(true);
  };

  const elEkle = () => {
    if (mod === 'sozlu') {
      // Sözlü mod: sözler + alınan eller
      const aldiToplami = yeniAldi.reduce((s, v) => s + (Number(v) || 0), 0);
      if (aldiToplami !== 13) return;
      if (yeniSoz.some(v => v === '') || yeniAldi.some(v => v === '')) return;

      const puanlar = yeniSoz.map((s, i) => hesaplaPuan(s, yeniAldi[i]));
      const sozlerNum = yeniSoz.map(v => Number(v) || 0);
      const aldilarNum = yeniAldi.map(v => Number(v) || 0);

      setEller([...eller, puanlar]);
      setEllerMeta([...ellerMeta, { sozler: sozlerNum, aldilar: aldilarNum }]);
      setYeniSoz(['', '', '', '']);
      setYeniAldi(['', '', '', '']);
      setSozDuzenle(true);
      setYeniEklendi(eller.length);
      setTimeout(() => setYeniEklendi(-1), 500);
    } else {
      // Klasik mod
      const sayilar = yeniEl.map((v, i) => {
        const n = v === '' ? 0 : Number(v);
        if (isNaN(n)) return 0;
        return eksi[i] ? -Math.abs(n) : Math.abs(n);
      });
      const toplam = yeniEl.reduce((s, v, i) => {
        if (eksi[i]) return s;
        return s + (Number(v) || 0);
      }, 0);
      if (toplam !== 13) return;
      setEller([...eller, sayilar]);
      setEllerMeta([...ellerMeta, null]);
      setYeniEl(['', '', '', '']);
      setEksi([false, false, false, false]);
      setYeniEklendi(eller.length);
      setTimeout(() => setYeniEklendi(-1), 500);
    }
  };

  const elSil = (index) => {
    setEller(eller.filter((_, i) => i !== index));
    setEllerMeta(ellerMeta.filter((_, i) => i !== index));
  };

  const sonEliGeriAl = () => {
    if (eller.length === 0) return;
    setEller(eller.slice(0, -1));
    setEllerMeta(ellerMeta.slice(0, -1));
  };

  const arsivle = async () => {
    if (eller.length === 0) return;
    const kazananIdx = toplamlar.indexOf(Math.max(...toplamlar));
    const yeniOyun = {
      id: Date.now(),
      tarih: new Date().toISOString(),
      mod,
      hedefEl,
      oyuncular: [...oyuncular],
      eller: [...eller],
      ellerMeta: [...ellerMeta],
      toplamlar: [...toplamlar],
      kazanan: oyuncular[kazananIdx],
      kazananIdx,
      kazananPuan: toplamlar[kazananIdx],
    };
    const yeniListe = [yeniOyun, ...gecmisListe];
    setGecmisListe(yeniListe);
    await saveGecmis(yeniListe);
  };

  const sifirla = async () => {
    await arsivle();
    setEller([]);
    setEllerMeta([]);
    setYeniEl(['', '', '', '']);
    setYeniSoz(['', '', '', '']);
    setYeniAldi(['', '', '', '']);
    setEksi([false, false, false, false]);
    setIsimGirisi(['', '', '', '']);
    setOyuncular(['', '', '', '']);
    setSozDuzenle(false);
    setKazananModal(false);
    setOyunBasladi(false);
    setSifirlaOnay(false);
  };

  const gecmistenSil = async (id) => {
    const yeniListe = gecmisListe.filter(g => g.id !== id);
    setGecmisListe(yeniListe);
    await saveGecmis(yeniListe);
    setGecmisSilOnay(null);
  };

  const ismiKaydet = () => {
    if (duzenlenen !== null && gecici.trim()) {
      const yeni = [...oyuncular];
      yeni[duzenlenen] = gecici.trim();
      setOyuncular(yeni);
    }
    setDuzenlenen(null);
    setGecici('');
  };

  const numGuncelle = (setter, arr, i, v) => {
    const temiz = v.replace(/[^0-9]/g, '').slice(0, 2);
    const yeni = [...arr];
    yeni[i] = temiz;
    setter(yeni);
  };

  const eksiToggle = (i) => {
    const yeni = [...eksi];
    yeni[i] = !yeni[i];
    setEksi(yeni);
  };

  const tarihFormatla = (iso) => {
    try {
      const d = new Date(iso);
      const aylar = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
      return `${d.getDate()} ${aylar[d.getMonth()]} ${d.getFullYear()} · ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    } catch (_) { return ''; }
  };

  // ---------- YARDIMCI BİLEŞEN ----------
  const CornerOrnament = ({ color = '#a87a2e', size = 20, rotation = 0 }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ transform: `rotate(${rotation}deg)` }}>
      <path d="M2 2 L2 16 M2 2 L16 2 M2 2 L10 10 M18 2 L22 2 M2 18 L2 22"
        stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />
      <circle cx="14" cy="14" r="1.2" fill={color} opacity="0.8" />
    </svg>
  );

  // Yükleme ekranı
  if (!yuklendi) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'radial-gradient(ellipse at top, #2a1810 0%, #0d0604 50%, #000 100%)' }}>
        <div className="text-3xl tracking-[0.3em]" style={{ color: '#a87a2e' }}>♠ ♥ ♦ ♣</div>
      </div>
    );
  }

  // ========================================================
  // GEÇMİŞ DETAY MODAL
  // ========================================================
  const GecmisDetayModal = () => {
    if (!gecmisDetay) return null;
    const g = gecmisDetay;
    const sozluMu = g.mod === 'sozlu' && g.ellerMeta && g.ellerMeta.some(m => m);
    return (
      <div
        className="fixed inset-0 z-50 p-4 flex items-center justify-center batak-fade-up"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
        onClick={() => setGecmisDetay(null)}
      >
        <div
          className="w-full max-w-lg rounded-2xl p-5 max-h-[90vh] overflow-y-auto batak-no-scrollbar"
          style={{
            background: 'linear-gradient(135deg, #2a1810 0%, #0d0604 100%)',
            border: '1px solid rgba(168,122,46,0.4)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.9)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy size={16} style={{ color: '#d4a85a' }} />
              <span className="text-[11px] tracking-[0.3em]" style={{ color: '#a87a2e', ...italicFont }}>KAZANAN</span>
            </div>
            <h3 className="text-2xl mb-1" style={{ ...serifFont, color: kartlar[g.kazananIdx].renk, fontStyle: 'italic' }}>
              {kartlar[g.kazananIdx].sembol} {g.kazanan}
            </h3>
            <div className="text-4xl mb-2" style={{ ...serifFont, fontWeight: 900, color: '#f4e4b8' }}>
              {g.kazananPuan}
            </div>
            <div className="text-[11px] opacity-60" style={italicFont}>
              {tarihFormatla(g.tarih)} · {g.eller.length} el · {sozluMu ? 'Sözlü Mod' : 'Klasik Mod'}
            </div>
          </div>

          <div className="rounded-xl overflow-hidden mt-4"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(168,122,46,0.2)' }}>
            <table className="w-full text-sm">
              <thead style={{ background: 'rgba(168,122,46,0.1)' }}>
                <tr>
                  <th className="py-2 px-1 w-8 text-[9px]" style={{ color: '#a87a2e', ...italicFont }}>EL</th>
                  {g.oyuncular.map((ad, i) => (
                    <th key={i} className="py-2 px-1" style={{ color: kartlar[i].renk }}>
                      <div className="flex flex-col items-center">
                        <span className="text-base leading-none" style={serifFont}>{kartlar[i].sembol}</span>
                        <span className="text-[10px] truncate opacity-85 mt-0.5" style={italicFont}>{ad}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.eller.map((el, idx) => {
                  const meta = g.ellerMeta && g.ellerMeta[idx];
                  return (
                    <tr key={idx} style={{
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                      background: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    }}>
                      <td className="py-2 px-1 text-center" style={{ color: 'rgba(255,255,255,0.35)', ...serifFont, fontSize: '12px', fontStyle: 'italic' }}>
                        {idx + 1}
                      </td>
                      {el.map((puan, i) => (
                        <td key={i} className="py-2 px-1 text-center tabular-nums">
                          {meta && (
                            <div className="text-[9px] opacity-60 mb-0.5" style={italicFont}>
                              {meta.sozler[i]}/{meta.aldilar[i]}
                            </div>
                          )}
                          <div style={{
                            ...serifFont, fontWeight: 700, fontSize: '15px',
                            color: puan < 0 ? '#d4574e' : '#f4e4b8',
                            opacity: puan === 0 ? 0.3 : 1,
                          }}>
                            {puan}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{
                  background: 'linear-gradient(to right, rgba(168,122,46,0.15), rgba(168,122,46,0.05), rgba(168,122,46,0.15))',
                  borderTop: '2px solid rgba(168,122,46,0.5)',
                }}>
                  <td className="py-3 px-1 text-center" style={{ color: '#d4a85a', ...serifFont, fontSize: '13px', fontStyle: 'italic' }}>Σ</td>
                  {g.toplamlar.map((t, i) => (
                    <td key={i} className="py-3 px-1 text-center tabular-nums"
                      style={{
                        ...serifFont, fontWeight: 900, fontSize: '18px',
                        color: i === g.kazananIdx ? kartlar[i].renk : (t < 0 ? '#d4574e' : '#f4e4b8'),
                      }}>
                      {t}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>

          {sozluMu && (
            <div className="text-[10px] text-center opacity-50 mt-2" style={italicFont}>
              her hücrede üstte <span style={{ color: '#d4a85a' }}>söz / alınan</span> · altta puan
            </div>
          )}

          <button
            onClick={() => setGecmisDetay(null)}
            className="w-full mt-5 rounded-lg py-3 text-xs tracking-[0.25em]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', ...italicFont,
            }}
          >KAPAT</button>
        </div>
      </div>
    );
  };

  // ========================================================
  // GEÇMİŞ EKRANI
  // ========================================================
  if (gecmisGoster) {
    return (
      <div
        className="min-h-screen text-white p-4 pb-10 relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at top, #2a1810 0%, #0d0604 50%, #000 100%)',
          ...sansFont,
        }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-15 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a87a2e 0%, transparent 70%)' }} />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center gap-3 mb-6 batak-fade-up">
            <button
              onClick={() => setGecmisGoster(false)}
              className="rounded-full p-2 transition-all hover:bg-white/10"
              style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,122,46,0.3)' }}
            >
              <ArrowLeft size={18} style={{ color: '#d4a85a' }} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl" style={{
                ...serifFont, fontWeight: 900, fontStyle: 'italic',
                background: 'linear-gradient(135deg, #f4e4b8 0%, #d4a85a 50%, #a87a2e 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Geçmiş Oyunlar</h1>
              <div className="text-[11px] tracking-[0.25em] mt-0.5" style={{ color: '#a87a2e', ...italicFont }}>
                {gecmisListe.length} KAYIT
              </div>
            </div>
          </div>

          {gecmisListe.length === 0 ? (
            <div className="text-center py-16 italic opacity-40 batak-fade-up"
              style={{ ...italicFont, fontSize: '18px' }}>
              <Clock size={40} className="mx-auto mb-4 opacity-50" />
              <div>— henüz geçmiş oyun yok —</div>
              <div className="text-xs mt-2 tracking-[0.25em] opacity-70">yeni bir oyun bitirdikçe burada birikir</div>
            </div>
          ) : (
            <div className="space-y-3">
              {gecmisListe.map((g, idx) => (
                <div
                  key={g.id}
                  className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01] relative batak-slide-in"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                    border: `1px solid rgba(${kartlar[g.kazananIdx].rgb}, 0.3)`,
                    boxShadow: `0 4px 20px rgba(0,0,0,0.35)`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                  onClick={() => setGecmisDetay(g)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Trophy size={12} style={{ color: '#d4a85a' }} />
                        <span className="text-[10px] tracking-[0.25em]" style={{ color: '#a87a2e', ...italicFont }}>KAZANAN</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl" style={{ color: kartlar[g.kazananIdx].renk }}>{kartlar[g.kazananIdx].sembol}</span>
                        <span className="text-lg truncate" style={{ ...serifFont, fontStyle: 'italic', color: kartlar[g.kazananIdx].renk }}>{g.kazanan}</span>
                        <span className="text-lg tabular-nums" style={{ ...serifFont, fontWeight: 900, color: '#f4e4b8' }}>{g.kazananPuan}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {g.oyuncular.map((ad, i) => (
                          <span key={i} className="text-[10px] truncate" style={{
                            ...italicFont, color: kartlar[i].renk, opacity: i === g.kazananIdx ? 1 : 0.55,
                          }}>
                            {kartlar[i].sembol} {ad}: {g.toplamlar[i]}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] mt-2 opacity-50" style={italicFont}>
                        {tarihFormatla(g.tarih)} · {g.eller.length} el
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setGecmisSilOnay(g.id); }}
                      className="p-2 rounded-lg opacity-30 hover:opacity-100 hover:text-red-400 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <GecmisDetayModal />

        {gecmisSilOnay !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-5 batak-fade-up"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setGecmisSilOnay(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, #2a1810 0%, #0d0604 100%)',
                border: '1px solid rgba(212,87,78,0.4)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl text-center mb-3" style={{ ...serifFont, color: '#d4574e', fontStyle: 'italic' }}>
                Bu kayıt silinsin mi?
              </h3>
              <p className="text-center text-sm mb-5" style={{ ...italicFont, color: 'rgba(255,255,255,0.6)' }}>
                Geri alınamaz.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setGecmisSilOnay(null)}
                  className="rounded-lg py-2.5 text-xs tracking-[0.2em]"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.7)', ...italicFont,
                  }}>İPTAL</button>
                <button onClick={() => gecmistenSil(gecmisSilOnay)}
                  className="rounded-lg py-2.5 text-xs tracking-[0.2em]"
                  style={{
                    background: 'linear-gradient(135deg, #d4574e 0%, #8a3730 100%)',
                    color: 'white', ...serifFont, fontWeight: 700,
                  }}>SİL</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========================================================
  // İSİM GİRİŞ EKRANI
  // ========================================================
  if (!oyunBasladi) {
    return (
      <div
        className="min-h-screen text-white p-5 flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at top, #2a1810 0%, #0d0604 50%, #000 100%)',
          ...sansFont,
        }}
      >
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #a87a2e 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full pointer-events-none opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d4574e 0%, transparent 70%)' }} />

        {gecmisListe.length > 0 && (
          <button
            onClick={() => setGecmisGoster(true)}
            className="absolute top-5 right-5 z-20 rounded-full px-3 py-2 flex items-center gap-2 transition-all hover:scale-105 batak-fade-up"
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(168,122,46,0.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <History size={14} style={{ color: '#d4a85a' }} />
            <span className="text-[10px] tracking-[0.25em]" style={{ color: '#d4a85a', ...italicFont }}>GEÇMİŞ</span>
            <span className="text-[10px] rounded-full px-1.5 py-0.5 tabular-nums" style={{
              background: 'rgba(168,122,46,0.25)', color: '#f4e4b8', ...serifFont, fontWeight: 700,
            }}>{gecmisListe.length}</span>
          </button>
        )}

        <div className="w-full max-w-md relative z-10 py-8">
          <div className="text-center mb-8 batak-fade-up">
            <div className="flex justify-center items-center gap-4 mb-4">
              {kartlar.map((k, i) => (
                <span key={i} className="text-2xl"
                  style={{ color: k.renk, animation: `batakGlow 2.5s ease-in-out ${i * 0.3}s infinite` }}>
                  {k.sembol}
                </span>
              ))}
            </div>
            <h1 className="text-7xl tracking-wider"
              style={{
                ...serifFont, fontWeight: 900, fontStyle: 'italic',
                background: 'linear-gradient(135deg, #f4e4b8 0%, #d4a85a 50%, #a87a2e 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '0.05em', textShadow: '0 0 60px rgba(168,122,46,0.3)',
              }}>
              Batak
            </h1>
            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="h-px w-20" style={{ background: 'linear-gradient(to right, transparent, #a87a2e, transparent)' }} />
              <span className="text-[10px] tracking-[0.4em] uppercase" style={{ color: '#a87a2e' }}>Skor Defteri</span>
              <div className="h-px w-20" style={{ background: 'linear-gradient(to right, transparent, #a87a2e, transparent)' }} />
            </div>
          </div>

          {/* Hedef El Sayısı */}
          <div className="mb-5 batak-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="text-[10px] text-center tracking-[0.4em] mb-2" style={{ color: '#a87a2e', ...italicFont }}>
              HEDEF EL SAYISI
            </div>
            <div className="rounded-xl p-3 flex items-center justify-between gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(168,122,46,0.12) 0%, rgba(0,0,0,0.3) 100%)',
                border: '1px solid rgba(168,122,46,0.35)',
              }}
            >
              <button
                onClick={() => setHedefEl(Math.max(11, hedefEl - 2))}
                disabled={hedefEl <= 11}
                className="rounded-full w-10 h-10 flex items-center justify-center transition-all"
                style={{
                  background: hedefEl <= 11 ? 'rgba(255,255,255,0.05)' : 'rgba(168,122,46,0.2)',
                  border: `1px solid rgba(168,122,46, ${hedefEl <= 11 ? 0.15 : 0.5})`,
                  color: hedefEl <= 11 ? 'rgba(255,255,255,0.2)' : '#d4a85a',
                  cursor: hedefEl <= 11 ? 'not-allowed' : 'pointer',
                  ...serifFont, fontSize: '22px', fontWeight: 700,
                }}
              >−</button>

              <div className="flex-1 text-center">
                <div className="flex items-baseline justify-center gap-2">
                  <span style={{
                    ...serifFont, fontWeight: 900, fontStyle: 'italic', fontSize: '48px',
                    background: 'linear-gradient(135deg, #f4e4b8 0%, #d4a85a 50%, #a87a2e 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    lineHeight: 1,
                  }}>{hedefEl}</span>
                  <span className="text-[10px] tracking-[0.25em]" style={{ color: '#a87a2e', ...italicFont }}>EL</span>
                </div>
                <div className="text-[10px] tracking-[0.15em] mt-1 opacity-60" style={italicFont}>
                  {hedefEl === 11 ? 'standart' : hedefEl >= 41 ? 'maraton' : hedefEl >= 25 ? 'uzun' : 'orta'}
                </div>
              </div>

              <button
                onClick={() => setHedefEl(Math.min(51, hedefEl + 2))}
                disabled={hedefEl >= 51}
                className="rounded-full w-10 h-10 flex items-center justify-center transition-all"
                style={{
                  background: hedefEl >= 51 ? 'rgba(255,255,255,0.05)' : 'rgba(168,122,46,0.2)',
                  border: `1px solid rgba(168,122,46, ${hedefEl >= 51 ? 0.15 : 0.5})`,
                  color: hedefEl >= 51 ? 'rgba(255,255,255,0.2)' : '#d4a85a',
                  cursor: hedefEl >= 51 ? 'not-allowed' : 'pointer',
                  ...serifFont, fontSize: '22px', fontWeight: 700,
                }}
              >+</button>
            </div>
            <div className="text-[9px] text-center mt-1.5 tracking-[0.2em] opacity-40" style={italicFont}>
              11'den 51'e kadar · ikişer artar
            </div>
          </div>

          {/* Mod Seçimi */}
          <div className="mb-6 batak-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="text-[10px] text-center tracking-[0.4em] mb-2" style={{ color: '#a87a2e', ...italicFont }}>
              OYUN MODU
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMod('sozlu')}
                className="rounded-xl p-3 text-left transition-all"
                style={{
                  background: mod === 'sozlu'
                    ? 'linear-gradient(135deg, rgba(168,122,46,0.25) 0%, rgba(168,122,46,0.08) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${mod === 'sozlu' ? 'rgba(168,122,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: mod === 'sozlu' ? '0 0 20px rgba(168,122,46,0.2)' : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calculator size={14} style={{ color: mod === 'sozlu' ? '#d4a85a' : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-[10px] tracking-[0.2em]" style={{
                    color: mod === 'sozlu' ? '#f4e4b8' : 'rgba(255,255,255,0.4)',
                    ...serifFont, fontWeight: 700,
                  }}>SÖZLÜ</span>
                </div>
                <div className="text-[11px] leading-tight" style={{
                  color: mod === 'sozlu' ? 'rgba(244,228,184,0.8)' : 'rgba(255,255,255,0.4)',
                  ...italicFont,
                }}>
                  Söz + el gir, puan otomatik
                </div>
              </button>
              <button
                onClick={() => setMod('klasik')}
                className="rounded-xl p-3 text-left transition-all"
                style={{
                  background: mod === 'klasik'
                    ? 'linear-gradient(135deg, rgba(168,122,46,0.25) 0%, rgba(168,122,46,0.08) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${mod === 'klasik' ? 'rgba(168,122,46,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: mod === 'klasik' ? '0 0 20px rgba(168,122,46,0.2)' : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Pencil size={14} style={{ color: mod === 'klasik' ? '#d4a85a' : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-[10px] tracking-[0.2em]" style={{
                    color: mod === 'klasik' ? '#f4e4b8' : 'rgba(255,255,255,0.4)',
                    ...serifFont, fontWeight: 700,
                  }}>KLASİK</span>
                </div>
                <div className="text-[11px] leading-tight" style={{
                  color: mod === 'klasik' ? 'rgba(244,228,184,0.8)' : 'rgba(255,255,255,0.4)',
                  ...italicFont,
                }}>
                  Elle puan gir, kendin hesapla
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {kartlar.map((k, i) => (
              <div
                key={i}
                className="relative rounded-xl p-4 transition-all batak-fade-up"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  border: `1px solid rgba(${k.rgb}, 0.3)`,
                  boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(${k.rgb}, 0.05)`,
                  animationDelay: `${0.15 + i * 0.06}s`,
                }}
              >
                <div className="absolute top-2 left-2"><CornerOrnament color={k.renk} /></div>
                <div className="absolute top-2 right-2"><CornerOrnament color={k.renk} rotation={90} /></div>
                <div className="absolute bottom-2 left-2"><CornerOrnament color={k.renk} rotation={-90} /></div>
                <div className="absolute bottom-2 right-2"><CornerOrnament color={k.renk} rotation={180} /></div>

                <div className="flex items-center gap-4 pl-2 pr-2">
                  <div className="text-5xl leading-none"
                    style={{ color: k.renk, ...serifFont, filter: `drop-shadow(0 0 8px rgba(${k.rgb},0.4))` }}>
                    {k.sembol}
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] tracking-[0.3em] mb-1" style={{ color: k.renk, opacity: 0.7 }}>
                      {k.isim} · {i + 1}. OYUNCU
                    </div>
                    <input
                      type="text"
                      value={isimGirisi[i]}
                      onChange={(e) => {
                        const yeni = [...isimGirisi];
                        yeni[i] = e.target.value;
                        setIsimGirisi(yeni);
                      }}
                      placeholder="İsim gir…"
                      maxLength={14}
                      className="w-full bg-transparent text-xl outline-none border-b placeholder:text-white/20 pb-1"
                      style={{ borderColor: `rgba(${k.rgb}, 0.25)`, ...italicFont, fontWeight: 500 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={oyunuBaslat}
            className="w-full rounded-xl py-4 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] batak-fade-up relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #d4a85a 0%, #a87a2e 100%)',
              color: '#1a0f08', ...serifFont, fontWeight: 700, letterSpacing: '0.2em',
              boxShadow: '0 10px 30px rgba(168,122,46,0.35), inset 0 1px 0 rgba(255,255,255,0.3)',
              animationDelay: '0.5s',
            }}
          >
            <Play size={18} fill="currentColor" />
            <span>OYUNU BAŞLAT</span>
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // OYUN EKRANI
  // ========================================================
  // Sözlü mod için: önce söz, sonra aldı
  const sozluCurrent = mod === 'sozlu';

  return (
    <div
      className="min-h-screen text-white p-4 pb-10 relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #2a1810 0%, #0d0604 50%, #000 100%)',
        ...sansFont,
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #a87a2e 0%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.8)' }} />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-4 batak-fade-up">
          <div className="w-10" />
          <div className="text-center flex-1">
            <h1 className="text-4xl tracking-wider"
              style={{
                ...serifFont, fontWeight: 900, fontStyle: 'italic',
                background: 'linear-gradient(135deg, #f4e4b8 0%, #d4a85a 50%, #a87a2e 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                letterSpacing: '0.05em',
              }}>Batak</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, #a87a2e, transparent)' }} />
              <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: '#a87a2e' }}>
                {sozluCurrent ? 'SÖZLÜ' : 'KLASİK'} · {eller.length} / {hedefEl} EL
              </span>
              <div className="h-px w-8" style={{ background: 'linear-gradient(to right, transparent, #a87a2e, transparent)' }} />
            </div>
            {eller.length > 0 && (
              <div className="mt-2 mx-auto w-40 h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (eller.length / hedefEl) * 100)}%`,
                    background: 'linear-gradient(90deg, #a87a2e, #d4a85a, #f4e4b8)',
                    boxShadow: '0 0 10px rgba(212,168,90,0.5)',
                  }}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => setGecmisGoster(true)}
            className="rounded-full p-2 relative transition-all hover:bg-white/10"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,122,46,0.3)' }}
          >
            <History size={16} style={{ color: '#d4a85a' }} />
            {gecmisListe.length > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] rounded-full w-4 h-4 flex items-center justify-center tabular-nums"
                style={{ background: '#d4a85a', color: '#1a0f08', fontWeight: 700 }}>
                {gecmisListe.length}
              </span>
            )}
          </button>
        </div>

        {/* Oyuncu Skor Kartları */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {oyuncular.map((ad, i) => {
            const k = kartlar[i];
            const puan = toplamlar[i];
            const isLider = lider === i;
            return (
              <div
                key={i}
                className="relative rounded-2xl p-4 transition-all batak-fade-up"
                style={{
                  background: isLider
                    ? `linear-gradient(135deg, rgba(${k.rgb}, 0.12) 0%, rgba(0,0,0,0.2) 100%)`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                  border: `1px solid rgba(${k.rgb}, ${isLider ? 0.65 : 0.22})`,
                  boxShadow: isLider
                    ? `0 0 30px rgba(${k.rgb}, 0.25), inset 0 0 30px rgba(${k.rgb}, 0.06)`
                    : `0 6px 20px rgba(0,0,0,0.35)`,
                  aspectRatio: '1.1 / 1',
                  animationDelay: `${0.05 + i * 0.07}s`,
                }}
              >
                <div className="absolute top-2 left-2.5 flex flex-col items-center leading-none">
                  <span style={{ ...serifFont, color: k.renk, fontSize: '13px', fontWeight: 700 }}>{k.harf}</span>
                  <span style={{ color: k.renk, fontSize: '11px', marginTop: '1px' }}>{k.sembol}</span>
                </div>
                <div className="absolute bottom-2 right-2.5 flex flex-col items-center leading-none rotate-180">
                  <span style={{ ...serifFont, color: k.renk, fontSize: '13px', fontWeight: 700 }}>{k.harf}</span>
                  <span style={{ color: k.renk, fontSize: '11px', marginTop: '1px' }}>{k.sembol}</span>
                </div>

                {isLider && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(135deg, #d4a85a 0%, #a87a2e 100%)',
                      boxShadow: '0 4px 12px rgba(168,122,46,0.5)',
                    }}>
                    <Crown size={10} style={{ color: '#1a0f08' }} fill="currentColor" />
                    <span className="text-[9px] tracking-[0.2em]" style={{ color: '#1a0f08', fontWeight: 700 }}>LİDER</span>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center h-full pt-1">
                  {duzenlenen === i ? (
                    <input autoFocus value={gecici}
                      onChange={(e) => setGecici(e.target.value)}
                      onBlur={ismiKaydet}
                      onKeyDown={(e) => e.key === 'Enter' && ismiKaydet()}
                      className="bg-black/40 rounded px-2 py-0.5 text-base w-full text-center outline-none"
                      style={italicFont} maxLength={14} />
                  ) : (
                    <button
                      onClick={() => { setDuzenlenen(i); setGecici(ad); }}
                      className="flex items-center gap-1 truncate max-w-full"
                      style={{ ...italicFont, color: k.renk, fontWeight: 500 }}
                    >
                      <span className="text-base truncate">{ad}</span>
                      <Edit3 size={10} className="opacity-40 flex-shrink-0" />
                    </button>
                  )}
                  <div
                    key={puan}
                    className={puan !== 0 ? 'batak-pulse' : ''}
                    style={{
                      ...serifFont, fontWeight: 900, fontSize: '52px', lineHeight: '1', marginTop: '4px',
                      color: puan < 0 ? '#d4574e' : '#f4e4b8',
                      textShadow: puan < 0
                        ? '0 0 25px rgba(212,87,78,0.4)'
                        : '0 0 25px rgba(244,228,184,0.25)',
                    }}
                  >{puan}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------------- YENİ EL (MOD BAZLI) ---------------- */}
        {sozluCurrent ? (
          <SozluEl />
        ) : (
          <KlasikEl />
        )}

        {/* El Defteri */}
        {eller.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden mb-4 batak-fade-up"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(168,122,46,0.25)',
              animationDelay: '0.4s',
            }}
          >
            <div className="px-4 py-3 flex items-center justify-center gap-3"
              style={{
                background: 'linear-gradient(to right, rgba(168,122,46,0.18), rgba(168,122,46,0.08), rgba(168,122,46,0.18))',
                borderBottom: '1px solid rgba(168,122,46,0.3)',
              }}>
              <div className="h-px w-10" style={{ background: 'linear-gradient(to right, transparent, #a87a2e)' }} />
              <span className="text-[10px] tracking-[0.4em]" style={{ color: '#d4a85a', ...serifFont, fontStyle: 'italic' }}>EL DEFTERİ</span>
              <div className="h-px w-10" style={{ background: 'linear-gradient(to left, transparent, #a87a2e)' }} />
            </div>

            <div className={eller.length > 6 ? 'max-h-80 overflow-y-auto batak-no-scrollbar' : ''}>
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: 'rgba(10,6,4,0.95)', backdropFilter: 'blur(8px)' }}>
                  <tr>
                    <th className="py-3 px-1 font-normal w-10" style={{ color: '#a87a2e' }}>
                      <span className="text-[9px] tracking-[0.3em]" style={italicFont}>EL</span>
                    </th>
                    {oyuncular.map((ad, i) => (
                      <th key={i} className="py-2 px-1 font-normal" style={{ color: kartlar[i].renk }}>
                        <div className="flex flex-col items-center">
                          <span className="text-lg leading-none" style={serifFont}>{kartlar[i].sembol}</span>
                          <span className="text-[10px] truncate opacity-85 mt-0.5" style={italicFont}>{ad}</span>
                        </div>
                      </th>
                    ))}
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {eller.map((el, idx) => {
                    const meta = ellerMeta[idx];
                    return (
                      <tr key={idx}
                        className={idx === yeniEklendi ? 'batak-fade-up' : ''}
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          background: idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                        }}
                      >
                        <td className="py-3 px-1 text-center" style={{ color: 'rgba(255,255,255,0.35)', ...serifFont, fontSize: '12px', fontStyle: 'italic' }}>
                          {idx + 1}
                        </td>
                        {el.map((puan, i) => (
                          <td key={i} className="py-2 px-1 text-center tabular-nums">
                            {meta && (
                              <div className="text-[9px] opacity-55 mb-0.5" style={italicFont}>
                                {meta.sozler[i]}/{meta.aldilar[i]}
                              </div>
                            )}
                            <div style={{
                              ...serifFont, fontWeight: 700, fontSize: '16px',
                              color: puan < 0 ? '#d4574e' : '#f4e4b8',
                              opacity: puan === 0 ? 0.3 : 1,
                            }}>{puan}</div>
                          </td>
                        ))}
                        <td className="py-2 px-1 text-center">
                          <button
                            onClick={() => elSil(idx)}
                            className="opacity-25 hover:opacity-100 hover:text-red-400 transition p-1"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{
                    background: 'linear-gradient(to right, rgba(168,122,46,0.15), rgba(168,122,46,0.05), rgba(168,122,46,0.15))',
                    borderTop: '2px solid rgba(168,122,46,0.5)',
                  }}>
                    <td className="py-4 px-1 text-center" style={{ color: '#d4a85a', ...serifFont, fontSize: '14px', fontStyle: 'italic' }}>Σ</td>
                    {toplamlar.map((t, i) => (
                      <td key={i} className="py-4 px-1 text-center tabular-nums"
                        style={{
                          ...serifFont, fontWeight: 900, fontSize: '22px',
                          color: t < 0 ? '#d4574e' : kartlar[i].renk,
                          textShadow: `0 0 15px rgba(${t < 0 ? '212,87,78' : kartlar[i].rgb}, 0.3)`,
                        }}>{t}</td>
                    ))}
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {sozluCurrent && (
              <div className="text-center py-2 text-[10px] opacity-50"
                style={{ ...italicFont, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                her hücrede üstte <span style={{ color: '#d4a85a' }}>söz / alınan</span>
              </div>
            )}
          </div>
        )}

        {eller.length === 0 && (
          <div className="text-center py-8 italic opacity-40 batak-fade-up"
            style={{ ...italicFont, fontSize: '16px', animationDelay: '0.4s' }}>
            — henüz el kaydedilmedi —
          </div>
        )}

        {/* Alt butonlar */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            onClick={sonEliGeriAl}
            disabled={eller.length === 0}
            className="rounded-lg py-3 text-xs tracking-[0.25em] transition-all flex items-center justify-center gap-2"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: eller.length === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
              ...italicFont,
              cursor: eller.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <Undo2 size={12} /> SON ELİ GERİ AL
          </button>
          <button
            onClick={() => setSifirlaOnay(true)}
            className="rounded-lg py-3 text-xs tracking-[0.25em] transition-all flex items-center justify-center gap-2 hover:bg-white/5"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)',
              ...italicFont,
            }}
          >
            <RotateCcw size={12} /> YENİ OYUN
          </button>
        </div>

        <div className="text-center mt-6 text-[10px] tracking-[0.25em] opacity-25"
          style={{ ...italicFont, letterSpacing: '0.2em' }}>
          ♠ ♥ ♦ ♣ · isimlere dokun düzenle · ♣ ♦ ♥ ♠
        </div>

        {/* Sıfırlama Onay Modalı */}
        {sifirlaOnay && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-5 batak-fade-up"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSifirlaOnay(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-7 relative"
              style={{
                background: 'linear-gradient(135deg, #2a1810 0%, #0d0604 100%)',
                border: '1px solid rgba(168,122,46,0.5)',
                boxShadow: '0 25px 80px rgba(0,0,0,0.9), 0 0 50px rgba(168,122,46,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-3 left-3"><CornerOrnament color="#a87a2e" /></div>
              <div className="absolute top-3 right-3"><CornerOrnament color="#a87a2e" rotation={90} /></div>
              <div className="absolute bottom-3 left-3"><CornerOrnament color="#a87a2e" rotation={-90} /></div>
              <div className="absolute bottom-3 right-3"><CornerOrnament color="#a87a2e" rotation={180} /></div>

              <div className="text-center mb-6 pt-2">
                <div className="text-3xl mb-3 tracking-[0.3em]" style={{ color: '#a87a2e' }}>♠ ♥ ♦ ♣</div>
                <h3 className="text-2xl mb-3" style={{ ...serifFont, color: '#f4e4b8', fontStyle: 'italic' }}>Yeni Oyun?</h3>
                <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.55)', ...italicFont, fontSize: '15px' }}>
                  Mevcut oyun <span style={{ color: '#d4a85a' }}>Geçmiş</span>'e kaydedilecek ve yeni bir oyun başlatılacak.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSifirlaOnay(false)}
                  className="rounded-lg py-3 text-xs tracking-[0.25em] transition-all hover:bg-white/5"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.7)', ...italicFont,
                  }}>İPTAL</button>
                <button onClick={sifirla}
                  className="rounded-lg py-3 text-xs tracking-[0.25em] transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #d4a85a 0%, #a87a2e 100%)',
                    color: '#1a0f08', ...serifFont, fontWeight: 700,
                    boxShadow: '0 6px 20px rgba(168,122,46,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}>ONAYLA</button>
                </div>
            </div>
          </div>
        )}

        {/* Kazanan Modalı - Oyun Bitti */}
        {kazananModal && lider >= 0 && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-5 batak-fade-up"
            style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-7 relative"
              style={{
                background: `linear-gradient(135deg, rgba(${kartlar[lider].rgb}, 0.2) 0%, #0d0604 70%)`,
                border: `2px solid rgba(${kartlar[lider].rgb}, 0.7)`,
                boxShadow: `0 25px 80px rgba(0,0,0,0.9), 0 0 80px rgba(${kartlar[lider].rgb}, 0.35)`,
              }}
            >
              <div className="absolute top-3 left-3"><CornerOrnament color={kartlar[lider].renk} /></div>
              <div className="absolute top-3 right-3"><CornerOrnament color={kartlar[lider].renk} rotation={90} /></div>
              <div className="absolute bottom-3 left-3"><CornerOrnament color={kartlar[lider].renk} rotation={-90} /></div>
              <div className="absolute bottom-3 right-3"><CornerOrnament color={kartlar[lider].renk} rotation={180} /></div>

              <div className="text-center mb-5 pt-2">
                <div className="text-[10px] tracking-[0.5em] mb-3" style={{ color: '#a87a2e', ...italicFont }}>
                  OYUN BİTTİ
                </div>
                <div className="flex justify-center mb-2">
                  <Crown size={44} style={{ color: '#d4a85a', filter: 'drop-shadow(0 0 20px rgba(212,168,90,0.6))' }} fill="currentColor" />
                </div>
                <div className="text-[10px] tracking-[0.4em] mb-2" style={{ color: kartlar[lider].renk, ...italicFont }}>
                  KAZANAN
                </div>
                <div className="text-6xl mb-1" style={{ color: kartlar[lider].renk }}>
                  {kartlar[lider].sembol}
                </div>
                <h3 className="text-3xl mb-2" style={{
                  ...serifFont, fontStyle: 'italic', fontWeight: 700,
                  color: kartlar[lider].renk,
                  textShadow: `0 0 30px rgba(${kartlar[lider].rgb}, 0.5)`,
                }}>
                  {oyuncular[lider]}
                </h3>
                <div className="text-6xl mb-3" style={{
                  ...serifFont, fontWeight: 900,
                  background: 'linear-gradient(135deg, #f4e4b8 0%, #d4a85a 50%, #a87a2e 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  textShadow: '0 0 40px rgba(168,122,46,0.4)',
                }}>
                  {toplamlar[lider]}
                </div>
                <div className="text-[11px] tracking-[0.3em] opacity-60" style={italicFont}>
                  {eller.length} el · hedef {hedefEl}
                </div>
              </div>

              {/* Diğer oyuncular */}
              <div className="space-y-1.5 mb-5">
                {oyuncular
                  .map((ad, i) => ({ ad, puan: toplamlar[i], idx: i }))
                  .sort((a, b) => b.puan - a.puan)
                  .map((o, siraNo) => siraNo === 0 ? null : (
                    <div key={o.idx} className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-50 tabular-nums">#{siraNo + 1}</span>
                        <span style={{ color: kartlar[o.idx].renk }}>{kartlar[o.idx].sembol}</span>
                        <span className="text-sm truncate" style={{ ...italicFont, color: kartlar[o.idx].renk }}>{o.ad}</span>
                      </div>
                      <span className="tabular-nums" style={{
                        ...serifFont, fontWeight: 700, fontSize: '16px',
                        color: o.puan < 0 ? '#d4574e' : '#f4e4b8',
                      }}>{o.puan}</span>
                    </div>
                  ))}
              </div>

              {/* Butonlar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setHedefEl(Math.min(51, hedefEl + 2));
                    setKazananModal(false);
                  }}
                  disabled={hedefEl >= 51}
                  className="rounded-lg py-3 text-[10px] tracking-[0.2em] transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: hedefEl >= 51 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)',
                    ...italicFont,
                    cursor: hedefEl >= 51 ? 'not-allowed' : 'pointer',
                  }}
                >
                  +2 EL DAHA
                </button>
                <button
                  onClick={async () => {
                    await sifirla();
                  }}
                  className="rounded-lg py-3 text-[10px] tracking-[0.2em]"
                  style={{
                    background: 'linear-gradient(135deg, #d4a85a 0%, #a87a2e 100%)',
                    color: '#1a0f08', ...serifFont, fontWeight: 700,
                    boxShadow: '0 6px 20px rgba(168,122,46,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                  }}
                >
                  YENİ OYUN
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ===========================================================
  // SÖZLÜ MOD: İKİ AŞAMALI YENİ EL PANELİ
  // ===========================================================
  function SozluEl() {
    // Aşama 1: Söz giriliyor (sozDuzenle=true)
    // Aşama 2: Aldı giriliyor (sozDuzenle=false)
    const tumSozlerDolu = yeniSoz.every(v => v !== '');
    const aldiToplami = yeniAldi.reduce((s, v) => s + (Number(v) || 0), 0);
    const tumAldilarDolu = yeniAldi.every(v => v !== '');
    const aldilarGecerli = aldiToplami === 13 && tumAldilarDolu;

    // Canlı puan hesaplaması (sadece aşama 2)
    const canliPuanlar = yeniSoz.map((s, i) => {
      if (!s || yeniAldi[i] === '') return null;
      return hesaplaPuan(s, yeniAldi[i]);
    });

    return (
      <div
        className="rounded-2xl p-4 mb-5 relative batak-fade-up"
        style={{
          background: 'linear-gradient(135deg, rgba(168,122,46,0.1) 0%, rgba(0,0,0,0.45) 100%)',
          border: '1px solid rgba(168,122,46,0.3)', animationDelay: '0.3s',
        }}
      >
        <div className="absolute top-2 left-2"><CornerOrnament color="#a87a2e" /></div>
        <div className="absolute top-2 right-2"><CornerOrnament color="#a87a2e" rotation={90} /></div>
        <div className="absolute bottom-2 left-2"><CornerOrnament color="#a87a2e" rotation={-90} /></div>
        <div className="absolute bottom-2 right-2"><CornerOrnament color="#a87a2e" rotation={180} /></div>

        {/* Aşama başlığı */}
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #a87a2e)' }} />
          <span className="text-[10px] tracking-[0.35em] flex items-center gap-2"
            style={{ color: '#d4a85a', ...serifFont, fontStyle: 'italic' }}>
            {sozDuzenle ? (
              <>
                <span style={{ background: '#d4a85a', color: '#1a0f08', padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: 900 }}>1</span>
                SÖZ VER
              </>
            ) : (
              <>
                <span style={{ background: '#d4a85a', color: '#1a0f08', padding: '1px 6px', borderRadius: '10px', fontSize: '9px', fontWeight: 900 }}>2</span>
                ALDIĞINI GİR
              </>
            )}
          </span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #a87a2e)' }} />
        </div>

        {/* Söz özeti (aşama 2'de gösterilir) */}
        {!sozDuzenle && (
          <div className="mb-3 p-2.5 rounded-lg flex items-center justify-between gap-2"
            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(168,122,46,0.2)' }}>
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <span className="text-[9px] tracking-[0.25em] opacity-60" style={italicFont}>SÖZLER:</span>
              {oyuncular.map((ad, i) => (
                <span key={i} className="text-[11px] flex items-center gap-1" style={{ color: kartlar[i].renk }}>
                  <span>{kartlar[i].sembol}</span>
                  <span style={italicFont}>{ad}:</span>
                  <span style={{ ...serifFont, fontWeight: 700 }}>{yeniSoz[i]}</span>
                </span>
              ))}
            </div>
            <button
              onClick={sozleriSifirla}
              className="text-[9px] tracking-[0.2em] px-2 py-1 rounded-md opacity-70 hover:opacity-100"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.7)', ...italicFont,
              }}
            >DÜZENLE</button>
          </div>
        )}

        {/* Aşama 1: Söz Girişi */}
        {sozDuzenle && (
          <>
            <div className="grid grid-cols-4 gap-2 mb-3 px-1">
              {oyuncular.map((ad, i) => {
                const k = kartlar[i];
                return (
                  <div key={i}>
                    <div className="text-[10px] text-center mb-1 truncate flex items-center justify-center gap-0.5"
                      style={{ color: k.renk, opacity: 0.85 }}>
                      <span>{k.sembol}</span>
                      <span style={italicFont}>{ad}</span>
                    </div>
                    <input
                      ref={(el) => (sozRefs.current[i] = el)}
                      type="text" inputMode="numeric"
                      value={yeniSoz[i]}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const temiz = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                        const yeni = [...yeniSoz];
                        yeni[i] = temiz;
                        setYeniSoz(yeni);
                        // Otomatik geçiş
                        sonrayaGec(sozRefs, i, () => {
                          // 4. söz de dolduysa aldı aşamasına geç
                          if (yeni.every(v => v !== '')) {
                            setTimeout(() => {
                              setSozDuzenle(false);
                              setTimeout(() => aldiRefs.current[0]?.focus(), 100);
                            }, 200);
                          }
                        }, temiz);
                      }}
                      placeholder="0"
                      className="batak-input w-full rounded-lg py-2.5 text-center text-2xl outline-none transition-all tabular-nums"
                      style={{
                        ...serifFont, fontWeight: 700,
                        background: 'rgba(0,0,0,0.5)',
                        border: `1px solid rgba(${k.rgb}, 0.45)`,
                        color: '#f4e4b8',
                      }}
                    />
                    <div className="text-[9px] text-center mt-1 tracking-[0.15em] opacity-40" style={italicFont}>
                      söz
                    </div>
                  </div>
                );
              })}
            </div>

            {sozDoluMu && (
              <div className="flex items-center justify-center gap-2 mb-3 py-2 rounded-lg text-[10px] tracking-[0.25em]"
                style={{
                  background: 'rgba(168,122,46,0.08)',
                  border: '1px solid rgba(168,122,46,0.3)',
                  color: '#d4a85a',
                }}>
                <Info size={11} />
                <span style={italicFont}>toplam söz:</span>
                <span style={{ ...serifFont, fontWeight: 700, fontSize: '12px' }}>{sozToplami}</span>
                {sozToplami > 13 && <span style={italicFont}>· agresif!</span>}
                {sozToplami < 13 && <span style={italicFont}>· temkinli</span>}
              </div>
            )}

            <button
              onClick={sozleriKaydet}
              disabled={!tumSozlerDolu}
              className="w-full rounded-lg py-3 flex items-center justify-center gap-2 transition-all"
              style={{
                background: tumSozlerDolu
                  ? 'linear-gradient(135deg, #d4a85a 0%, #a87a2e 100%)'
                  : 'rgba(100,100,100,0.15)',
                color: tumSozlerDolu ? '#1a0f08' : 'rgba(255,255,255,0.3)',
                ...serifFont, fontWeight: 700, letterSpacing: '0.2em',
                boxShadow: tumSozlerDolu
                  ? '0 6px 20px rgba(168,122,46,0.3), inset 0 1px 0 rgba(255,255,255,0.25)'
                  : 'none',
                border: tumSozlerDolu ? 'none' : '1px solid rgba(255,255,255,0.08)',
                cursor: tumSozlerDolu ? 'pointer' : 'not-allowed',
              }}
            >
              <Check size={16} />
              <span>SÖZLERİ ONAYLA</span>
            </button>
          </>
        )}

        {/* Aşama 2: Aldı Girişi */}
        {!sozDuzenle && (
          <>
            <div className="grid grid-cols-4 gap-2 mb-3 px-1">
              {oyuncular.map((ad, i) => {
                const k = kartlar[i];
                const soz = Number(yeniSoz[i]) || 0;
                const aldi = yeniAldi[i] === '' ? null : (Number(yeniAldi[i]) || 0);
                const batti = aldi !== null && aldi < soz;
                const puan = canliPuanlar[i];
                return (
                  <div key={i}>
                    <div className="text-[10px] text-center mb-1 truncate flex items-center justify-center gap-0.5"
                      style={{ color: k.renk, opacity: 0.85 }}>
                      <span>{k.sembol}</span>
                      <span style={italicFont}>{ad}</span>
                    </div>

                    {/* Söz rozeti */}
                    <div className="text-center mb-1">
                      <span className="text-[9px] tracking-[0.15em] px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(168,122,46,0.15)',
                          color: '#d4a85a',
                          ...italicFont,
                        }}>
                        söz {soz}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        ref={(el) => (aldiRefs.current[i] = el)}
                        type="text" inputMode="numeric"
                        value={yeniAldi[i]}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const temiz = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                          const yeni = [...yeniAldi];
                          yeni[i] = temiz;
                          setYeniAldi(yeni);
                          // Son input değilse sonraya geç
                          if (i < 3) {
                            sonrayaGec(aldiRefs, i, null, temiz);
                          }
                        }}
                        placeholder="0"
                        className="batak-input w-full rounded-lg py-2.5 text-center text-2xl outline-none transition-all tabular-nums"
                        style={{
                          ...serifFont, fontWeight: 700,
                          background: 'rgba(0,0,0,0.5)',
                          border: `1px solid rgba(${batti ? '212,87,78' : k.rgb}, 0.5)`,
                          color: batti ? '#d4574e' : '#f4e4b8',
                        }}
                      />
                    </div>
                    <div className="text-[9px] text-center mt-1 tracking-[0.15em] opacity-40" style={italicFont}>
                      aldı
                    </div>

                    {/* Canlı puan */}
                    {puan !== null && (
                      <div className="text-center mt-1.5 py-1 rounded"
                        style={{
                          background: puan < 0 ? 'rgba(212,87,78,0.15)' : 'rgba(127,168,138,0.15)',
                          border: `1px solid ${puan < 0 ? 'rgba(212,87,78,0.35)' : 'rgba(127,168,138,0.35)'}`,
                        }}>
                        <span style={{
                          ...serifFont, fontWeight: 700, fontSize: '14px',
                          color: puan < 0 ? '#d4574e' : '#7fa88a',
                        }}>
                          {puan > 0 ? '+' : ''}{puan}
                        </span>
                        {batti && (
                          <div className="text-[8px] tracking-[0.2em] mt-0.5" style={{ color: '#d4574e', ...italicFont }}>
                            BATTI
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Toplam alınan */}
            {tumAldilarDolu || aldiToplami > 0 ? (
              <div className="flex items-center justify-center gap-2 mb-3 py-2.5 rounded-lg text-[11px] tracking-[0.25em] transition-all"
                style={{
                  background: aldilarGecerli ? 'rgba(127,168,138,0.12)' : 'rgba(212,87,78,0.12)',
                  border: `1px solid ${aldilarGecerli ? 'rgba(127,168,138,0.5)' : 'rgba(212,87,78,0.4)'}`,
                  color: aldilarGecerli ? '#7fa88a' : '#d4574e',
                }}>
                <span style={{ ...serifFont, fontWeight: 700, fontSize: '14px' }}>{aldilarGecerli ? '✓' : '⚠'}</span>
                <span style={{ ...serifFont, fontStyle: 'italic' }}>Toplam Alınan El:&nbsp;</span>
                <span style={{ ...serifFont, fontWeight: 700, fontSize: '14px' }}>{aldiToplami} / 13</span>
              </div>
            ) : null}

            <button
              onClick={elEkle}
              disabled={!aldilarGecerli}
              className="w-full rounded-lg py-3 flex items-center justify-center gap-2 transition-all"
              style={{
                background: aldilarGecerli
                  ? 'linear-gradient(135deg, #d4a85a 0%, #a87a2e 100%)'
                  : 'rgba(100,100,100,0.15)',
                color: aldilarGecerli ? '#1a0f08' : 'rgba(255,255,255,0.3)',
                ...serifFont, fontWeight: 700, letterSpacing: '0.2em',
                boxShadow: aldilarGecerli
                  ? '0 6px 20px rgba(168,122,46,0.3), inset 0 1px 0 rgba(255,255,255,0.25)'
                  : 'none',
                border: aldilarGecerli ? 'none' : '1px solid rgba(255,255,255,0.08)',
                cursor: aldilarGecerli ? 'pointer' : 'not-allowed',
              }}
            >
              <Check size={16} />
              <span>ELİ KAYDET</span>
            </button>
          </>
        )}
      </div>
    );
  }

  // ===========================================================
  // KLASİK MOD: Eski yeni el paneli
  // ===========================================================
  function KlasikEl() {
    const elTopami = yeniEl.reduce((sum, v, i) => {
      if (eksi[i]) return sum;
      return sum + (Number(v) || 0);
    }, 0);
    const bosMu = yeniEl.every(v => v === '');
    const gecerli = elTopami === 13;

    return (
      <div
        className="rounded-2xl p-4 mb-5 relative batak-fade-up"
        style={{
          background: 'linear-gradient(135deg, rgba(168,122,46,0.08) 0%, rgba(0,0,0,0.4) 100%)',
          border: '1px solid rgba(168,122,46,0.28)', animationDelay: '0.3s',
        }}
      >
        <div className="absolute top-2 left-2"><CornerOrnament color="#a87a2e" /></div>
        <div className="absolute top-2 right-2"><CornerOrnament color="#a87a2e" rotation={90} /></div>
        <div className="absolute bottom-2 left-2"><CornerOrnament color="#a87a2e" rotation={-90} /></div>
        <div className="absolute bottom-2 right-2"><CornerOrnament color="#a87a2e" rotation={180} /></div>

        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, transparent, #a87a2e)' }} />
          <span className="text-[10px] tracking-[0.4em]" style={{ color: '#d4a85a', ...serifFont, fontStyle: 'italic' }}>YENİ EL</span>
          <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, transparent, #a87a2e)' }} />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3 px-1">
          {oyuncular.map((ad, i) => {
            const k = kartlar[i];
            return (
              <div key={i}>
                <div className="text-[10px] text-center mb-1 truncate flex items-center justify-center gap-0.5"
                  style={{ color: k.renk, opacity: 0.85 }}>
                  <span>{k.sembol}</span>
                  <span style={italicFont}>{ad}</span>
                </div>
                <div className="relative">
                  <input
                    ref={(el) => (elRefs.current[i] = el)}
                    type="text" inputMode="numeric"
                    value={yeniEl[i]}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const temiz = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                      const yeni = [...yeniEl];
                      yeni[i] = temiz;
                      setYeniEl(yeni);
                      if (i < 3) {
                        sonrayaGec(elRefs, i, null, temiz);
                      }
                    }}
                    placeholder="0"
                    className="batak-input w-full rounded-lg pl-4 pr-1 py-2.5 text-center text-2xl outline-none transition-all tabular-nums"
                    style={{
                      ...serifFont, fontWeight: 700,
                      background: 'rgba(0,0,0,0.5)',
                      border: `1px solid rgba(${eksi[i] ? '212,87,78' : k.rgb}, 0.45)`,
                      color: eksi[i] ? '#d4574e' : '#f4e4b8',
                    }}
                  />
                  {eksi[i] && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xl pointer-events-none"
                      style={{ color: '#d4574e', ...serifFont, fontWeight: 900 }}>−</span>
                  )}
                </div>
                <button
                  onClick={() => eksiToggle(i)}
                  className="w-full mt-1.5 rounded-md py-1 text-[9px] tracking-[0.15em] font-semibold transition-all"
                  style={{
                    background: eksi[i] ? 'rgba(212,87,78,0.22)' : 'rgba(0,0,0,0.35)',
                    border: `1px solid rgba(${eksi[i] ? '212,87,78' : '255,255,255'}, ${eksi[i] ? 0.55 : 0.1})`,
                    color: eksi[i] ? '#d4574e' : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {eksi[i] ? '− BATTI' : 'BATTI?'}
                </button>
              </div>
            );
          })}
        </div>

        {!bosMu && (
          <div className="flex items-center justify-center gap-2 mb-3 py-2.5 rounded-lg text-[11px] tracking-[0.25em] transition-all"
            style={{
              background: gecerli ? 'rgba(127,168,138,0.12)' : 'rgba(212,87,78,0.12)',
              border: `1px solid ${gecerli ? 'rgba(127,168,138,0.5)' : 'rgba(212,87,78,0.4)'}`,
              color: gecerli ? '#7fa88a' : '#d4574e',
            }}>
            <span style={{ ...serifFont, fontWeight: 700, fontSize: '14px' }}>{gecerli ? '✓' : '⚠'}</span>
            <span style={{ ...serifFont, fontStyle: 'italic' }}>Toplam El:&nbsp;</span>
            <span style={{ ...serifFont, fontWeight: 700, fontSize: '14px' }}>{elTopami} / 13</span>
          </div>
        )}

        <button
          onClick={elEkle}
          disabled={!gecerli}
          className="w-full rounded-lg py-3 flex items-center justify-center gap-2 transition-all"
          style={{
            background: gecerli
              ? 'linear-gradient(135deg, #d4a85a 0%, #a87a2e 100%)'
              : 'rgba(100,100,100,0.15)',
            color: gecerli ? '#1a0f08' : 'rgba(255,255,255,0.3)',
            ...serifFont, fontWeight: 700, letterSpacing: '0.2em',
            boxShadow: gecerli
              ? '0 6px 20px rgba(168,122,46,0.3), inset 0 1px 0 rgba(255,255,255,0.25)'
              : 'none',
            border: gecerli ? 'none' : '1px solid rgba(255,255,255,0.08)',
            cursor: gecerli ? 'pointer' : 'not-allowed',
          }}
        >
          <Check size={16} />
          <span>ELİ KAYDET</span>
        </button>
      </div>
    );
  }
}
