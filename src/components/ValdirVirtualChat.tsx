import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Disc, 
  ExternalLink, 
  ShoppingBag, 
  Truck, 
  CreditCard, 
  HelpCircle, 
  Phone, 
  Minimize2, 
  Maximize2,
  RefreshCw,
  Search,
  CheckCircle2,
  Flame,
  Music,
  Tag,
  Radio
} from 'lucide-react';
import { SavedListing } from '../types';
import { useLogos } from '../hooks/useLogos';

interface MessageItem {
  id: string;
  sender: 'valdir' | 'user';
  text: string;
  timestamp: string;
  recommendations?: SavedListing[];
  quickActions?: { label: string; query: string }[];
}

interface ValdirVirtualChatProps {
  listings?: SavedListing[];
  whatsappNumber?: string;
  onSelectProduct?: (listing: SavedListing) => void;
}

// Normalizer for accent-insensitive search
const normalizeStr = (str: string): string => {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export function ValdirVirtualChat({
  listings = [],
  whatsappNumber = '5555981164666',
  onSelectProduct
}: ValdirVirtualChatProps) {
  const { logoBadge } = useLogos();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showNotificationBubble, setShowNotificationBubble] = useState<boolean>(true);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(1);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Extract dynamic styles and genres available in current stock
  const { popularStyles, stylesSummary } = useMemo(() => {
    const styleCountMap = new Map<string, number>();
    const genreCountMap = new Map<string, number>();

    listings.forEach((item) => {
      const styles = item.release?.styles || [];
      const genres = item.release?.genres || [];

      styles.forEach((s) => {
        const clean = s.trim();
        if (clean) styleCountMap.set(clean, (styleCountMap.get(clean) || 0) + 1);
      });
      genres.forEach((g) => {
        const clean = g.trim();
        if (clean) genreCountMap.set(clean, (genreCountMap.get(clean) || 0) + 1);
      });
    });

    const sortedStyles = Array.from(styleCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    const summary = sortedStyles.map(([style, count]) => `• ${style} (${count} títulos)`).join('\n');

    return {
      popularStyles: sortedStyles.map(([s]) => s),
      stylesSummary: summary
    };
  }, [listings]);

  // Initial welcome message
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'msg_welcome',
      sender: 'valdir',
      text: `Fala, colecionador! 🎶 Sou o **Valdir Virtual**, atendente e consultor musical oficial da **Valdir Discos** (Santa Maria - RS).\n\nConheço a fundo nosso acervo de vinil por **estilos musicais**, artistas e raridades. Como posso te ajudar na sua garimpagem hoje? Escolha um estilo ou dúvida rápida abaixo:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      quickActions: [
        { label: '🎸 Rock & Metal', query: 'Quais discos de Rock e Heavy Metal vocês têm disponíveis no estoque?' },
        { label: '🇧🇷 MPB & Tropicália', query: 'Me mostre os discos de MPB e música brasileira disponíveis no acervo' },
        { label: '🪘 Samba & Bossa Nova', query: 'Quais títulos de Samba e Bossa Nova você me recomenda?' },
        { label: '🎷 Jazz & Blues', query: 'O que tem de Jazz e Blues em vinil no acervo?' },
        { label: '🌾 Música Gaúcha / Nativismo', query: 'Quais discos de Música Regional Gaúcha e Nativismo vocês têm?' },
        { label: '📦 Como é o Frete e Embalagem?', query: 'Como funciona o envio e a embalagem blindada dos discos?' },
        { label: '💳 Pix tem desconto?', query: 'Quais as formas de pagamento e desconto no Pix?' },
        { label: '🌟 O que é Goldmine (NM, VG+)?', query: 'Como funciona a graduação de conservação dos vinis?' },
        { label: '📱 Falar no WhatsApp', query: 'Quero falar com o Valdir real no WhatsApp' },
      ]
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      setUnreadCount(0);
      setShowNotificationBubble(false);
    }
  }, [messages, isOpen, isMinimized]);

  // High-precision search and style-matcher in catalog
  const findRelevantListings = (query: string): SavedListing[] => {
    if (!listings || listings.length === 0) return [];
    const normQ = normalizeStr(query);
    if (normQ.length < 2) return [];

    // Keywords mapping for style queries
    const styleAliases: Record<string, string[]> = {
      rock: ['rock', 'hard rock', 'classic rock', 'prog rock', 'rock & roll', 'punk', 'pop rock'],
      metal: ['heavy metal', 'metal', 'hard rock', 'thrash', 'doom', 'black metal'],
      mpb: ['mpb', 'musica popular brasileira', 'tropicalia', 'latin', 'folk', 'bossa'],
      samba: ['samba', 'samba-cancao', 'choro', 'chorinho', 'pagode'],
      bossa: ['bossa nova', 'bossa', 'jazz', 'latin'],
      jazz: ['jazz', 'fusion', 'blues', 'soul-jazz', 'hard bop'],
      blues: ['blues', 'rhythm & blues', 'chicago blues', 'electric blues'],
      gaucha: ['gaucha', 'regional', 'nativismo', 'milonga', 'vanerao', 'tradicionalista', 'folk'],
      regional: ['regional', 'gaucha', 'nativismo', 'folk', 'tradicional'],
      forro: ['forro', 'baiao', 'nordestino', 'xote', 'baiao'],
      soul: ['soul', 'funk', 'disco', 'r&b', 'boogie'],
      funk: ['funk', 'soul', 'disco', 'groove']
    };

    // Detect matched style aliases
    const matchedAliases = Object.entries(styleAliases).flatMap(([key, aliases]) => 
      normQ.includes(key) ? aliases : []
    );

    // Score each item based on style/genre/artist/title match
    const scored = listings.map((item) => {
      let score = 0;
      const artist = normalizeStr(item.release?.artist || '');
      const title = normalizeStr(item.release?.title || '');
      const genres = (item.release?.genres || []).map(normalizeStr);
      const styles = (item.release?.styles || []).map(normalizeStr);

      // Exact artist/title match
      if (artist.includes(normQ)) score += 10;
      if (title.includes(normQ)) score += 10;

      // Style direct match
      styles.forEach((st) => {
        if (st.includes(normQ) || normQ.includes(st)) score += 8;
        matchedAliases.forEach(alias => {
          if (st.includes(alias)) score += 6;
        });
      });

      // Genre match
      genres.forEach((g) => {
        if (g.includes(normQ) || normQ.includes(g)) score += 6;
        matchedAliases.forEach(alias => {
          if (g.includes(alias)) score += 4;
        });
      });

      // Partial word matches
      const words = normQ.split(' ').filter(w => w.length > 2);
      words.forEach(w => {
        if (artist.includes(w)) score += 3;
        if (title.includes(w)) score += 3;
        if (styles.some(s => s.includes(w))) score += 4;
        if (genres.some(g => g.includes(w))) score += 2;
      });

      return { item, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((s) => s.item);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = `user_${Date.now()}`;
    const userMessage: MessageItem = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Check catalog for product recommendations by style or text
    const matchingListings = findRelevantListings(query);

    // Build structured catalog context with styles and genres for backend
    const catalogContext = listings.slice(0, 20).map(l => {
      const fmtName = l.release.formats?.[0]?.name || 'LP';
      const cond = l.condition?.mediaCondition || 'VG+';
      const price = l.pricing?.directPrice || l.pricing?.basePriceBrl || 0;
      const styles = (l.release.styles || []).slice(0, 3).join(', ') || (l.release.genres || []).join(', ') || 'Vinil';
      return `- ${l.release.artist} - "${l.release.title}" (${fmtName}) [Estilos: ${styles}] - R$ ${price} [Estado: ${cond}]`;
    }).join('\n');

    try {
      const historyPayload = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/valdir-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          catalogContext,
          stylesSummary
        })
      });

      let replyText = '';
      if (res.ok) {
        const data = await res.json();
        replyText = data.reply || '';
      }

      if (!replyText) {
        // Client-side dynamic fallback with real stock data
        replyText = getDynamicFallback(query, matchingListings);
      }

      const botMessage: MessageItem = {
        id: `valdir_${Date.now()}`,
        sender: 'valdir',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: matchingListings.length > 0 ? matchingListings : undefined,
        quickActions: [
          { label: '🎸 Ver Rock & Metal', query: 'Quais discos de Rock e Metal estão no estoque?' },
          { label: '🇧🇷 Ver MPB & Bossa', query: 'Me mostre os álbuns de MPB e Bossa Nova' },
          { label: '🪘 Ver Samba & Choro', query: 'O que tem de Samba e Choro disponível?' },
          { label: '📦 Como é o frete?', query: 'Como é o envio blindado?' },
          { label: '📱 Chamar no WhatsApp', query: 'Quero falar no WhatsApp' }
        ]
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.warn("Valdir Virtual offline fallback", err);
      const fallbackReply = getDynamicFallback(query, matchingListings);
      const botMessage: MessageItem = {
        id: `valdir_${Date.now()}`,
        sender: 'valdir',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        recommendations: matchingListings.length > 0 ? matchingListings : undefined
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getDynamicFallback = (q: string, matches: SavedListing[]): string => {
    const lower = normalizeStr(q);

    // Style-specific dynamic responses
    if (lower.includes('rock') || lower.includes('metal') || lower.includes('punk') || lower.includes('prog')) {
      const topItems = matches.length > 0 
        ? `\n\n🔥 **Discos de Rock em destaque no estoque:**\n` + matches.map(m => `• **${m.release.artist}** - *${m.release.title}* (R$ ${(m.pricing?.directPrice || m.pricing?.basePriceBrl || 0).toFixed(2).replace('.', ',')} | ${m.condition?.mediaCondition || 'VG+'})`).join('\n')
        : '';
      return `🎸 **Acervo de Rock & Heavy Metal da Valdir Discos:**\n\nTemos clássicos do Classic Rock, Hard Rock, Heavy Metal e Rock Nacional com prensagens originais e excelente conservação!${topItems}\n\nClique no card abaixo para conferir os detalhes e ouvir faixas!`;
    }

    if (lower.includes('mpb') || lower.includes('brasileir') || lower.includes('bossa') || lower.includes('tropicalia')) {
      const topItems = matches.length > 0 
        ? `\n\n🇧🇷 **Destaques de MPB & Bossa Nova disponíveis:**\n` + matches.map(m => `• **${m.release.artist}** - *${m.release.title}* (R$ ${(m.pricing?.directPrice || m.pricing?.basePriceBrl || 0).toFixed(2).replace('.', ',')} | ${m.condition?.mediaCondition || 'VG+'})`).join('\n')
        : '';
      return `🇧🇷 **Música Popular Brasileira & Bossa Nova:**\n\nA MPB e a Bossa Nova são nosso grande orgulho! Temos prensagens de época com capas bem cuidadas e o calor analógico incomparável.${topItems}\n\nVocê pode ver os discos logo abaixo ou buscar outros artistas pelo catálogo!`;
    }

    if (lower.includes('samba') || lower.includes('pagode') || lower.includes('choro') || lower.includes('chorinho')) {
      const topItems = matches.length > 0 
        ? `\n\n🪘 **Destaques de Samba & Choro disponíveis:**\n` + matches.map(m => `• **${m.release.artist}** - *${m.release.title}* (R$ ${(m.pricing?.directPrice || m.pricing?.basePriceBrl || 0).toFixed(2).replace('.', ',')} | ${m.condition?.mediaCondition || 'VG+'})`).join('\n')
        : '';
      return `🪘 **Samba Raiz, Samba-Canção e Chorinho:**\n\nGrandes mestres do ritmo brasileiro com arranjos ricos e prensagens autênticas.${topItems}\n\nConfira as opções abaixo ou peça uma foto no WhatsApp!`;
    }

    if (lower.includes('jazz') || lower.includes('blues') || lower.includes('soul') || lower.includes('funk')) {
      const topItems = matches.length > 0 
        ? `\n\n🎷 **Destaques de Jazz & Blues no acervo:**\n` + matches.map(m => `• **${m.release.artist}** - *${m.release.title}* (R$ ${(m.pricing?.directPrice || m.pricing?.basePriceBrl || 0).toFixed(2).replace('.', ',')} | ${m.condition?.mediaCondition || 'VG+'})`).join('\n')
        : '';
      return `🎷 **Jazz, Blues e Soul Music:**\n\nImprovisação refinada, sonoridade encorpada e timbres que ganham vida na agulha.${topItems}`;
    }

    if (lower.includes('gaucha') || lower.includes('regional') || lower.includes('nativis') || lower.includes('milonga')) {
      const topItems = matches.length > 0 
        ? `\n\n🌾 **Música Gaúcha & Nativista em estoque:**\n` + matches.map(m => `• **${m.release.artist}** - *${m.release.title}* (R$ ${(m.pricing?.directPrice || m.pricing?.basePriceBrl || 0).toFixed(2).replace('.', ',')} | ${m.condition?.mediaCondition || 'VG+'})`).join('\n')
        : '';
      return `🌾 **Música Regional Gaúcha & Nativismo (Direto de Santa Maria - RS):**\n\nTemos uma curadoria nativista autêntica com milongas, vanerões e clássicos tradicionais da nossa terra!${topItems}`;
    }

    if (lower.includes('forro') || lower.includes('baiao') || lower.includes('nordest')) {
      return `🪗 **Forró & Música Nordestina:**\n\nRitmo contagiante, acordeom estalando e o calor das prensagens de época de Luiz Gonzaga, Dominguinhos e mestres do forró pé de serra!`;
    }

    if (lower.includes('frete') || lower.includes('envio') || lower.includes('embalagem') || lower.includes('entrega')) {
      return `📦 **Envio Blindado & Embalagem Segura Valdir Discos:**\n\nEnviamos para todo o Brasil! Nossos discos vão em **caixas reforçadas de papelão duplo** com proteção de plástico bolha extra. Todos os vinis são higienizados e acompanham plásticos internos e externos novos de alta gramatura.`;
    }

    if (lower.includes('pix') || lower.includes('pagamento') || lower.includes('desconto') || lower.includes('cartao')) {
      return `💳 **Formas de Pagamento & Descontos:**\n\n• **Pix à vista:** Desconto especial de 5% direto no checkout!\n• **Cartão de Crédito:** Em até 12x via Mercado Pago.\n• **Boleto Bancário** e compra direta pelo WhatsApp.`;
    }

    if (lower.includes('estado') || lower.includes('goldmine') || lower.includes('conservacao') || lower.includes('chiado')) {
      return `🌟 **Classificação Goldmine Oficial:**\n\n• **M (Mint):** Novo / Lacrado de fábrica.\n• **NM (Near Mint):** Quase novo, sem marcas ou chiados.\n• **VG+ (Very Good Plus):** Excelente estado, marcas levíssimas que não afetam a reprodução.\n• **VG (Very Good):** Muito bom estado, com chiadinho leve em passagens silenciosas, sem pular.\n• **Garimpo:** Itens com super desconto e detalhes informados!`;
    }

    if (lower.includes('camiseta') || lower.includes('camisa') || lower.includes('tshirt')) {
      return `👕 **Camisetas Oficiais Valdir Discos:**\n\nProduzidas em malha premium 100% algodão penteado fio 30.1 com estampas clássicas dos nossos selos ("Disco é Cultura", "Mascote Valdir", "Selo Vintage"). Disponíveis do P ao XGG nos modelos Unissex e Baby Look!`;
    }

    if (lower.includes('download') || lower.includes('digital') || lower.includes('flac') || lower.includes('wav')) {
      return `🎧 **Downloads em Alta Resolução (Hi-Res):**\n\nDigitalizamos vinis raros diretamente da agulha em estúdio profissional (24-bit / 96kHz). Você pode baixar o álbum completo ou faixas avulsas em WAV, FLAC ou MP3 assim que seu pagamento for confirmado!`;
    }

    if (lower.includes('whatsapp') || lower.includes('zap') || lower.includes('contato') || lower.includes('real')) {
      return `📱 **WhatsApp Direto do Valdir:**\n\nPara negociar lotes, pedir vídeos do disco tocando ou tirar dúvidas específicas, me chame no WhatsApp oficial: **(55) 98116-4666**!`;
    }

    if (matches.length > 0) {
      return `🎵 **Valdir Virtual:** Encontrei opções incríveis no nosso acervo correspondentes à sua busca! Dê uma olhada nos discos recomendados logo abaixo:`;
    }

    return `🎵 **Valdir Virtual:** Perfeito! Se você procura algum artista ou estilo musical específico (como Rock, MPB, Samba, Jazz, Bossa Nova ou Regional Gaúcho), me diga o nome que busco no estoque em tempo real!`;
  };

  const handleOpenWhatsApp = (customText?: string) => {
    const text = encodeURIComponent(customText || "Olá, Valdir! Estava no site da Valdir Discos e gostaria de tirar uma dúvida sobre o acervo.");
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        {/* Notification Bubble Tooltip */}
        <AnimatePresence>
          {!isOpen && showNotificationBubble && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-2 bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-amber-500/30 max-w-xs text-xs space-y-1 relative group cursor-pointer"
              onClick={() => setIsOpen(true)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-amber-400 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  Valdir Virtual • Consultor Musical
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotificationBubble(false);
                  }}
                  className="text-slate-400 hover:text-white p-0.5 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-slate-200 text-[11px] leading-snug">
                Procurando Rock, MPB, Samba, Jazz ou frete seguro? Clique aqui para consultar o acervo comigo!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Bubble Button */}
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setShowNotificationBubble(false);
            }}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-950 via-amber-800 to-amber-600 text-white shadow-2xl flex items-center justify-center p-1.5 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-amber-400/50 cursor-pointer relative group"
            aria-label="Abrir atendente virtual Valdir"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 flex items-center justify-center relative shadow-inner">
              <img
                src={logoBadge}
                alt="Valdir Virtual"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-amber-600/10 pointer-events-none" />
            </div>

            {/* Glowing Online Status Indicator */}
            <span className="absolute top-0 right-0 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950" />
            </span>

            {/* Notification Badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-black rounded-full shadow-md border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Main Chat Box Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '590px' 
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 ${
              isMinimized ? 'h-auto' : 'max-h-[85vh]'
            }`}
          >
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-3.5 sm:p-4 text-white flex items-center justify-between border-b border-amber-500/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-400/40 bg-slate-950 shrink-0 shadow-md">
                  <img
                    src={logoBadge}
                    alt="Valdir Virtual"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-white flex items-center gap-1">
                      Valdir Virtual
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded">IA</span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-amber-200/80 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Consultor Musical • Valdir Discos
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp("Olá, Valdir! Gostaria de falar com o atendimento pelo WhatsApp.")}
                  title="Falar no WhatsApp oficial"
                  className="p-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Expandir" : "Minimizar"}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Fechar conversa"
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Body (Scrollable) */}
            {!isMinimized && (
              <>
                {/* Dynamic Quick Styles Explorer Bar */}
                <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1 shrink-0 uppercase tracking-wider">
                    <Music className="h-3 w-3 text-amber-700" />
                    Estilos:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Quais discos de Rock e Metal vocês têm disponíveis?')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 text-slate-800 text-[10px] font-bold rounded-md shrink-0 shadow-2xs transition-colors cursor-pointer"
                  >
                    🎸 Rock & Metal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('O que tem de MPB e Bossa Nova disponível no acervo?')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 text-slate-800 text-[10px] font-bold rounded-md shrink-0 shadow-2xs transition-colors cursor-pointer"
                  >
                    🇧🇷 MPB & Bossa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Me mostre os discos de Samba e Chorinho')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 text-slate-800 text-[10px] font-bold rounded-md shrink-0 shadow-2xs transition-colors cursor-pointer"
                  >
                    🪘 Samba & Choro
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Quais álbuns de Jazz e Blues vocês têm?')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 text-slate-800 text-[10px] font-bold rounded-md shrink-0 shadow-2xs transition-colors cursor-pointer"
                  >
                    🎷 Jazz & Blues
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Quais discos de Música Regional Gaúcha e Nativismo vocês têm?')}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 border border-amber-200 text-slate-800 text-[10px] font-bold rounded-md shrink-0 shadow-2xs transition-colors cursor-pointer"
                  >
                    🌾 Regional Gaúcha
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/80 text-slate-800 text-xs">
                  {/* Security/Assurance Pill */}
                  <div className="flex items-center justify-center">
                    <span className="px-3 py-1 bg-amber-100/80 text-amber-900 border border-amber-200/80 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-2xs">
                      <Truck className="h-3 w-3 text-amber-700" />
                      Embalagem blindada e envio para todo o Brasil
                    </span>
                  </div>

                  {messages.map((msg) => {
                    const isValdir = msg.sender === 'valdir';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isValdir ? 'items-start' : 'items-end'}`}
                      >
                        <div className="flex items-end gap-2 max-w-[90%]">
                          {isValdir && (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-900 shrink-0 border border-amber-400/40 mb-1">
                              <img src={logoBadge} alt="Valdir" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl shadow-xs leading-relaxed ${
                              isValdir
                                ? 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs'
                                : 'bg-amber-600 text-white rounded-br-xs font-medium'
                            }`}
                          >
                            <p className="whitespace-pre-line text-xs">{msg.text}</p>

                            {/* Product Recommendations Card list inside chat with style tags */}
                            {msg.recommendations && msg.recommendations.length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                                <span className="text-[10px] font-black uppercase text-amber-700 flex items-center gap-1 tracking-wider">
                                  <Sparkles className="h-3 w-3 text-amber-600" />
                                  Discos sugeridos do nosso acervo:
                                </span>
                                <div className="space-y-1.5">
                                  {msg.recommendations.map((rec) => {
                                    const primaryStyle = rec.release.styles?.[0] || rec.release.genres?.[0] || 'Vinil';
                                    const price = (rec.pricing?.directPrice || rec.pricing?.basePriceBrl || 0).toFixed(2).replace('.', ',');
                                    const cond = rec.condition?.mediaCondition || 'VG+';

                                    return (
                                      <div
                                        key={rec.id}
                                        onClick={() => onSelectProduct?.(rec)}
                                        className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-200 hover:border-amber-400 cursor-pointer transition-all group"
                                      >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0 border border-slate-200">
                                          <img
                                            src={rec.release.coverImage}
                                            alt={rec.release.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold text-[11px] text-slate-900 truncate group-hover:text-amber-800">
                                            {rec.release.title}
                                          </p>
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 truncate">
                                            <span className="truncate">{rec.release.artist}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold text-[9px] shrink-0">
                                              {primaryStyle}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] mt-0.5">
                                            <span className="font-black text-emerald-700">R$ {price}</span>
                                            <span className="px-1 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">{cond}</span>
                                          </div>
                                        </div>
                                        <span className="text-[10px] font-black text-amber-700 px-2 py-1 bg-white group-hover:bg-amber-600 group-hover:text-white rounded-lg border border-amber-300 shrink-0 transition-colors shadow-2xs">
                                          Ver
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Quick Action suggestions */}
                            {msg.quickActions && msg.quickActions.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-slate-100/80 flex flex-wrap gap-1.5">
                                {msg.quickActions.map((qa, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSendMessage(qa.query)}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-left active:scale-95"
                                  >
                                    {qa.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="text-[9px] text-slate-400 mt-1 px-1">
                          {msg.timestamp}
                        </span>
                      </div>
                    );
                  })}

                  {/* Loading Typing Indicator */}
                  {isLoading && (
                    <div className="flex items-end gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-900 shrink-0 border border-amber-400/40">
                        <img src={logoBadge} alt="Valdir" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-xs shadow-xs flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-[10px] text-slate-400 font-semibold ml-1">Valdir está garimpando sugestões...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* WhatsApp Help Banner Bar */}
                <div className="px-3 py-1.5 bg-emerald-50 border-t border-b border-emerald-200 flex items-center justify-between text-[11px] text-emerald-900">
                  <span className="font-semibold flex items-center gap-1">
                    <Phone className="h-3 w-3 text-emerald-600" />
                    Prefere falar direto com o Valdir real?
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp()}
                    className="font-black text-emerald-700 hover:underline cursor-pointer"
                  >
                    Abrir Zap →
                  </button>
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ex: Recomende um rock clássico, MPB, samba ou nome de artista..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 text-xs rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 focus:outline-hidden transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isLoading}
                    className="p-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
