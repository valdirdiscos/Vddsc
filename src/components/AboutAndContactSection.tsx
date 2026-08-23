import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Disc, 
  Sparkles, 
  Truck, 
  MessageCircle, 
  CheckCircle2, 
  HeartHandshake, 
  Send,
  HelpCircle,
  ChevronDown,
  Upload,
  ExternalLink,
  ShoppingBag,
  Store,
  Headphones,
  Music2
} from 'lucide-react';
import { LOGO_BADGE, LOGO_COLOR, LOGO_BW } from '../assets/logos';

interface AboutAndContactSectionProps {
  whatsappNumber?: string;
  pixKey?: string;
  onOpenLogoUpload?: () => void;
}

export function AboutAndContactSection({
  whatsappNumber = '5555981164666',
  pixKey = 'valdirdiscos@gmail.com',
  onOpenLogoUpload
}: AboutAndContactSectionProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('duvida_disco');
  const [contactMessage, setContactMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const marketplaces = [
    {
      name: 'Shopee Oficial',
      description: 'Frete grátis com cupons do app e garantia Shopee.',
      url: 'https://shopee.com.br/valdirdiscos',
      badge: 'Loja Oficial',
      badgeColor: 'bg-orange-500 text-white',
      borderHover: 'hover:border-orange-500 hover:ring-2 hover:ring-orange-500/20'
    },
    {
      name: 'Mercado Livre Oficial',
      description: 'Envios pelo Mercado Envios com proteção ao comprador.',
      url: 'https://lista.mercadolivre.com.br/_CustId_valdirdiscos',
      badge: 'MercadoLíder',
      badgeColor: 'bg-yellow-400 text-slate-950',
      borderHover: 'hover:border-yellow-500 hover:ring-2 hover:ring-yellow-500/20'
    },
    {
      name: 'Discogs Oficial',
      description: 'Catálogo internacional com graduação técnica Goldmine.',
      url: 'https://www.discogs.com/seller/valdirdiscos',
      badge: 'Top Rated Seller',
      badgeColor: 'bg-slate-900 text-white',
      borderHover: 'hover:border-slate-800 hover:ring-2 hover:ring-slate-800/20'
    }
  ];

  const faqs = [
    {
      q: 'Onde fica a loja física da Valdir Discos?',
      a: 'Nossa loja física e centro de expedição estão localizados em Santa Maria - Rio Grande do Sul (RS). Você pode retirar seus pedidos presencialmente no nosso balcão ou receber em casa com envio seguro para todo o Brasil.'
    },
    {
      q: 'Como funciona a venda de Música Digital (WAV, FLAC, MP3)?',
      a: 'Digitalizamos vinis raros diretamente da agulha em alta resolução (24-bit / 96kHz Lossless). Ao adquirir um álbum ou faixa avulsa, você recebe um link de download direto e seguro após a confirmação do PIX, com capas em alta definição e tags id3 completas.'
    },
    {
      q: 'Como os discos são avaliados e graduados?',
      a: 'Utilizamos estritamente a graduação internacional Goldmine (Mint, Near Mint, VG+, VG, G). Todos os vinis são inspecionados visualmente sob luz forte, higienizados e testados no toca-discos para garantir a reprodução fiel sem pulos.'
    },
    {
      q: 'Como funciona o cálculo de frete e envio para outras cidades?',
      a: 'Nossos envios partem de Santa Maria - RS para qualquer cidade do Brasil. Você pode calcular o frete informando seu CEP diretamente no carrinho. Oferecemos Correios PAC, SEDEX Express, Registro Módico / Mini Envios e entrega expressa local em Santa Maria/RS.'
    },
    {
      q: 'O Valdir Discos compra coleções particulares ou lotes de vinil?',
      a: 'Sim! Compramos coleções completas e lotes selecionados de LPs, compactos 7" e CDs em bom estado. Entre em contato conosco pelo WhatsApp com a relação dos títulos e fotos dos discos.'
    },
    {
      q: 'Quais são as formas de pagamento aceitas?',
      a: 'Aceitamos PIX com confirmação e desconto imediato, cartões de crédito e débito, e pagamento em dinheiro no balcão presencial de Santa Maria - RS.'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) return;

    const subjectsMap: Record<string, string> = {
      duvida_disco: 'Dúvida sobre Disco / Acervo',
      comprar_colecao: 'Quero Vender Minha Coleção',
      musica_digital: 'Dúvida sobre Download de Música Digital',
      frete_pedido: 'Informações sobre Frete / Pedido',
      outro: 'Outro Assunto'
    };

    const text = encodeURIComponent(
      `👋 *MENSAGEM DO SITE - VALDIR DISCOS (Santa Maria - RS)*\n` +
      `------------------------------------\n` +
      `👤 *Nome:* ${contactName}\n` +
      `📱 *WhatsApp:* ${contactPhone || 'Não informado'}\n` +
      `📧 *E-mail:* ${contactEmail || 'Não informado'}\n` +
      `📌 *Assunto:* ${subjectsMap[contactSubject] || contactSubject}\n\n` +
      `💬 *Mensagem / Solicitação:*\n${contactMessage}`
    );
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${text}`, '_blank');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div className="space-y-12 py-4 animate-in fade-in duration-200">
      
      {/* Quem Somos / História & Localização */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5 text-amber-700" />
              Santa Maria • Rio Grande do Sul (RS)
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
              A história da Valdir Discos: Tradição gaúcha em garimpar e preservar a boa música.
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Com base no coração do Rio Grande do Sul, em <strong>Santa Maria (RS)</strong>, a <strong>Valdir Discos</strong> é o ponto de encontro de apaixonados por vinis, CDs, fitas cassete e raridades fonográficas. 
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              Atendemos clientes locais no balcão e enviamos diariamente para colecionadores, DJs e amantes da música em todo o Brasil. Nosso lema é simples: <strong>Disco é cultura</strong>. Cada álbum físico ou digital passa por uma curadoria criteriosa, garantindo áudio impecável e respeito à obra.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl">
                <span className="text-lg sm:text-xl font-black text-amber-950 block">Santa Maria - RS</span>
                <span className="text-[11px] text-amber-800 font-semibold">Loja Física & Balcão</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-lg sm:text-xl font-black text-slate-900 block">Goldmine</span>
                <span className="text-[11px] text-slate-600 font-semibold">Graduação Rigorosa</span>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl col-span-2 sm:col-span-1">
                <span className="text-lg sm:text-xl font-black text-emerald-950 block">Envio Nacional</span>
                <span className="text-[11px] text-emerald-800 font-semibold">Embalagem Reforçada</span>
              </div>
            </div>
          </div>

          {/* Contact Card & Storefront Info */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0c232a] via-[#163840] to-[#b3431f] text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border border-teal-900/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 p-1 border border-amber-400/30 overflow-hidden shrink-0">
                <img 
                  src={LOGO_BADGE} 
                  alt="Selo Valdir Discos" 
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "/valdir-logo-badge.jpg";
                  }}
                />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>Valdir Discos • Santa Maria RS</span>
                </h3>
                <span className="text-xs text-amber-300 font-serif italic font-bold">Disco é cultura.</span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Localização:</strong>
                  <span>Santa Maria - Rio Grande do Sul (RS) • CEP 97010-000</span>
                  <span className="text-slate-300 text-[11px] block mt-0.5">Balcão físico para retirada e audição de discos.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Horário de Atendimento:</strong>
                  <span>Segunda a Sexta: 09h às 18h | Sábados: 09h às 14h</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">WhatsApp Oficial:</strong>
                  <span className="text-emerald-400 font-bold block text-sm">(55) 98116-4666</span>
                  <span className="text-slate-300 text-[11px]">Atendimento direto e personalizado com o Valdir</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">E-mail:</strong>
                  <span className="text-slate-300 font-mono">valdirdiscos@gmail.com</span>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Olá Valdir! Gostaria de tirar uma dúvida sobre os discos da loja.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chamar no WhatsApp da Loja</span>
            </a>
          </div>
        </div>
      </section>

      {/* Official Marketplaces Links Section */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
              Canais Oficiais Verificados
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Nossas Lojas Oficiais nos Marketplaces
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Você também pode comprar com a segurança dos maiores marketplaces do Brasil e do mundo:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketplaces.map((m, idx) => (
            <a
              key={idx}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between group transition-all duration-200 cursor-pointer ${m.borderHover}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs ${m.badgeColor}`}>
                    {m.badge}
                  </span>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>

                <div>
                  <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                    {m.name}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between text-xs font-bold text-amber-400">
                <span>Acessar Loja {m.name.split(' ')[0]}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* The 3 Official Logo Variations Showcase */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 inline-block">
            Identidade Visual & Tradição
          </span>
          <h4 className="text-xl sm:text-2xl font-black text-slate-950">
            As Três Variações Oficiais do Logotipo Valdir Discos
          </h4>
          <p className="text-xs text-slate-500">
            Símbolos de autenticidade presentes em nossos envelopes, selos de garantia e etiquetas de acervo em Santa Maria - RS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Variation 1: Retro Badge */}
          <div className="bg-[#fcfbf9] border border-amber-900/10 rounded-2xl p-5 text-center flex flex-col items-center shadow-xs hover:shadow-md transition-all">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-white border-2 border-amber-500/40 shadow-sm flex items-center justify-center overflow-hidden mb-3">
              <img 
                src={LOGO_BADGE} 
                alt="Selo Retrô Completo - Disco é Cultura" 
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "/valdir-logo-badge.jpg";
                }}
              />
            </div>
            <span className="text-[11px] font-black uppercase text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-200">
              1. Selo Retrô Completo
            </span>
            <p className="text-xs font-bold text-slate-900 mt-2 font-serif italic">"Disco é cultura."</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Emblema vintage com sulcos de vinil em terracota e azul petróleo, notas musicais e lema clássico.
            </p>
          </div>

          {/* Variation 2: Color Character */}
          <div className="bg-[#fcfbf9] border border-amber-900/10 rounded-2xl p-5 text-center flex flex-col items-center shadow-xs hover:shadow-md transition-all">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-white border-2 border-orange-500/40 shadow-sm flex items-center justify-center overflow-hidden mb-3">
              <img 
                src={LOGO_COLOR} 
                alt="Mascote Valdir Ilustrado" 
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "/valdir-logo-color.jpg";
                }}
              />
            </div>
            <span className="text-[11px] font-black uppercase text-orange-900 bg-orange-100/80 px-2 py-0.5 rounded border border-orange-200">
              2. Mascote Ilustrado
            </span>
            <p className="text-xs font-bold text-slate-900 mt-2">Valdir Girando o Vinil</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Ilustração autêntica do mestre Valdir equilibrando o LP no dedo com a simpatia da loja física.
            </p>
          </div>

          {/* Variation 3: Monochrome Linework */}
          <div className="bg-[#fcfbf9] border border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center shadow-xs hover:shadow-md transition-all">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-white border-2 border-slate-300 shadow-sm flex items-center justify-center overflow-hidden mb-3">
              <img 
                src={LOGO_BW} 
                alt="Selo Monocromático em Traço Vintage" 
                className="w-full h-full object-contain rounded-full"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = "/valdir-logo-bw.jpg";
                }}
              />
            </div>
            <span className="text-[11px] font-black uppercase text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              3. Traço Monocromático (P&B)
            </span>
            <p className="text-xs font-bold text-slate-900 mt-2">Gravação & Etiquetas</p>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Versão em linhas pretas de alto contraste para carimbos, envelopes e embalagens.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ & Perguntas Frequentes */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
            Dúvidas Frequentes
          </div>
          <h3 className="text-2xl font-black text-slate-950">
            Tudo o que você precisa saber antes de comprar
          </h3>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/50"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-amber-700' : ''}`} />
                </button>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Formulário Direto de Contato & Pedidos Especiais */}
      <section className="bg-gradient-to-br from-amber-900/10 via-white to-amber-500/10 rounded-3xl p-6 sm:p-10 border border-amber-200/80 shadow-sm">
        <div className="max-w-2xl mx-auto space-y-6 text-center">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase text-amber-800 tracking-wider">
              Atendimento Direto com o Valdir
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950">
              Procurando um disco específico ou quer vender sua coleção?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              Envie sua mensagem para a equipe em Santa Maria - RS. Respondemos com fotos dos discos, áudios de teste e cotações.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-md space-y-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Seu Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Seu WhatsApp / Celular *</label>
                <input
                  type="tel"
                  required
                  placeholder="(55) 99999-9999"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Seu E-mail</label>
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Assunto</label>
                <select
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                >
                  <option value="duvida_disco">Procurando Disco / Vinil Específico</option>
                  <option value="comprar_colecao">Quero Vender Minha Coleção de Vinil / CDs</option>
                  <option value="musica_digital">Música Digital (WAV / FLAC / MP3)</option>
                  <option value="frete_pedido">Dúvida sobre Frete de Santa Maria RS</option>
                  <option value="outro">Outro Assunto</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Mensagem ou Detalhes da Solicitação *</label>
              <textarea
                required
                rows={3}
                placeholder="Ex: Olá Valdir! Gostaria de saber se vocês têm o vinil Tim Maia Racional Vol. 1 ou tenho um lote de 60 LPs de Rock para vender..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer active:scale-98"
            >
              <Send className="h-4 w-4" />
              <span>Enviar Mensagem Direta para o WhatsApp</span>
            </button>

            {sentSuccess && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center rounded-xl">
                Mensagem preparada! Abrindo seu WhatsApp...
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
