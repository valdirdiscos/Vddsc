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
  ChevronDown
} from 'lucide-react';

interface AboutAndContactSectionProps {
  whatsappNumber?: string;
  pixKey?: string;
}

export function AboutAndContactSection({
  whatsappNumber = '5511999999999',
  pixKey = 'valdirdiscos@gmail.com'
}: AboutAndContactSectionProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [sentSuccess, setSentSuccess] = useState(false);

  const faqs = [
    {
      q: 'Como os discos são avaliados e graduados?',
      a: 'Utilizamos estritamente a graduação internacional Goldmine (Mint, Near Mint, VG+, VG, G). Todos os vinis são inspecionados visualmente sob luz forte, higienizados e testados no toca-discos para garantir a reprodução fiel sem pulos.'
    },
    {
      q: 'Como funciona o envio e embalagem para outras cidades?',
      a: 'Enviamos para todo o Brasil via Correios (PAC/Sedex) ou transportadoras parceiras. Nossas embalagens são em caixas de papelão reforçado duplo, disco fora da capa com plásticos novos (interno e externo antiestático) e plástico bolha.'
    },
    {
      q: 'Posso retirar pessoalmente na loja física?',
      a: 'Sim! Basta selecionar a opção de retirada no balcão ao fechar seu pedido pelo site ou WhatsApp. O disco fica reservado no seu nome para você retirar e ouvir na loja.'
    },
    {
      q: 'O Valdir Discos compra lotes ou coleções particulares?',
      a: 'Sim! Compramos coleções completas e lotes selecionados de LPs, compactos 7" e CDs em bom estado. Entre em contato pelo nosso WhatsApp com fotos e relação dos títulos.'
    },
    {
      q: 'Quais são as formas de pagamento aceitas?',
      a: 'Aceitamos PIX (com confirmação imediata), cartões de crédito/débito no balcão ou links de pagamento seguros, e dinheiro na retirada presencial.'
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactMessage.trim()) return;

    const text = encodeURIComponent(
      `👋 *MENSAGEM DO SITE - VALDIR DISCOS*\n` +
      `👤 *Nome:* ${contactName}\n` +
      `📱 *Contato:* ${contactPhone || 'Não informado'}\n\n` +
      `💬 *Mensagem / Dúvida:* ${contactMessage}`
    );
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${text}`, '_blank');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  return (
    <div className="space-y-12 py-4">
      {/* Quem Somos / História */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
              <Disc className="h-3.5 w-3.5 text-amber-700" />
              Tradição e Paixão pelo Vinil
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
              A história do Valdir Discos: Garimpando raridades e preservando a memória musical.
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              O <strong>Valdir Discos</strong> nasceu do amor genuíno pela música e pela cultura do vinil. Com anos de dedicação, nosso acervo reúne desde clássicos consagrados da MPB, Samba, Rock e Jazz até compactos raros e prensagens históricas que encantam DJs e colecionadores do país inteiro.
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              Nosso compromisso é com a <strong>transparência e a qualidade</strong>: cada exemplar do acervo passa por uma curadoria detalhada, higienização profissional e avaliação no padrão Goldmine, para que você receba o disco exatamente como descrito.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl">
                <span className="text-xl font-black text-amber-950 block">100%</span>
                <span className="text-[11px] text-amber-800 font-semibold">Testados & Higienizados</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-xl font-black text-slate-900 block">Goldmine</span>
                <span className="text-[11px] text-slate-600 font-semibold">Graduação Rigorosa</span>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl col-span-2 sm:col-span-1">
                <span className="text-xl font-black text-emerald-950 block">Brasil Todo</span>
                <span className="text-[11px] text-emerald-800 font-semibold">Envio Seguro Reforçado</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-amber-950 text-white rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl border border-slate-800">
            <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-400" />
              Nossa Loja Física & Balcão
            </h3>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Endereço do Balcão:</strong>
                  <span>Consulte o endereço completo com a nossa equipe no WhatsApp para visitação e retiradas.</span>
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
                  <strong className="text-white block">Central WhatsApp:</strong>
                  <span className="text-emerald-400 font-bold">Atendimento direto e personalizado com o Valdir</span>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chamar no WhatsApp da Loja</span>
            </a>
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
            <h3 className="text-2xl font-black text-slate-950">
              Procurando um disco específico ou quer vender sua coleção?
            </h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto">
              Envie sua mensagem direto para nossa equipe. Respondemos com fotos, áudios e detalhes do acervo.
            </p>
          </div>

          <form onSubmit={handleContactSubmit} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-md space-y-3 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Seu Nome *</label>
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Seu WhatsApp</label>
                <input
                  type="tel"
                  placeholder="(DDD) 99999-9999"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">O que você está procurando ou deseja negociar? *</label>
              <textarea
                required
                rows={3}
                placeholder="Ex: Gostaria de saber se vocês têm o álbum Tim Maia Racional Vol. 1 ou se compram um lote de 80 LPs de Rock Nacional..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>Enviar Mensagem via WhatsApp</span>
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
