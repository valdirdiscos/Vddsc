import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Bookmark, Share, PlusSquare, Check, X, Smartphone, Globe, ArrowRight } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

export function InstallPwaBanner() {
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('valdir_pwa_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showDomainTips, setShowDomainTips] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('valdir_pwa_banner_dismissed', 'true');
    } catch {}
  };

  const handleBookmark = () => {
    const isMac = navigator.userAgent.toLowerCase().includes('mac');
    const shortcut = isMac ? 'Cmd + D' : 'Ctrl + D';
    
    // Copy current URL
    navigator.clipboard.writeText(window.location.origin).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {});

    setShowDomainTips(true);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white px-3 sm:px-4 py-2 border-b border-amber-500/20 text-xs shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Globe className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-amber-300">
                Acesse o Valdir Discos direto na sua tela inicial ou favoritos:
              </span>
              <span className="hidden md:inline text-slate-300 ml-1">
                Nunca mais perca o endereço e encontre seu vinil com 1 clique.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInstallable && (
              <button
                type="button"
                onClick={triggerInstall}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              >
                <Download className="h-3 w-3" />
                <span>Instalar Aplicativo</span>
              </button>
            )}

            {isIOS && (
              <button
                type="button"
                onClick={() => setShowIosGuide(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
              >
                <Smartphone className="h-3 w-3" />
                <span>Fixar na Tela de Início</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleBookmark}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-500/30 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-bold active:scale-95"
              title="Salvar nos Favoritos do navegador"
            >
              <Bookmark className="h-3 w-3 text-amber-400" />
              <span>Salvar nos Favoritos</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-md"
              title="Fechar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-sm w-full p-5 text-white shadow-2xl relative"
            >
              <button
                onClick={() => setShowIosGuide(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 p-1 flex items-center justify-center">
                  <img src="/apple-touch-icon.png" alt="Valdir Discos" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div>
                  <h3 className="font-black text-amber-400 text-sm">Fixar no iPhone / iPad</h3>
                  <p className="text-xs text-slate-400">Como salvar o site no Safari</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p>No Safari, toque no ícone de <strong>Compartilhar</strong> (<Share className="inline h-3.5 w-3.5 text-blue-400" />) na barra inferior.</p>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="inline h-3.5 w-3.5 text-amber-400" />).</p>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <p>Toque em <strong>Adicionar</strong> no canto superior direito. Pronto! O Valdir Discos funcionará como um aplicativo oficial no seu celular.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="mt-4 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors"
              >
                Entendi!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bookmark Tips Modal */}
      <AnimatePresence>
        {showDomainTips && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-md w-full p-5 text-white shadow-2xl relative"
            >
              <button
                onClick={() => setShowDomainTips(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Bookmark className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-amber-400 text-sm">Salvar Valdir Discos no Navegador</h3>
                  <p className="text-xs text-slate-400">Acesse com 1 clique na sua barra de favoritos</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <p className="font-semibold text-amber-200 mb-1">Dica Rápida no Computador:</p>
                  <p>Pressione o atalho <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-amber-300 font-mono text-[11px] font-bold">Ctrl + D</kbd> (ou <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-amber-300 font-mono text-[11px] font-bold">Cmd + D</kbd> no Mac) agora mesmo para adicionar esta página à sua barra de favoritos.</p>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <p className="font-semibold text-amber-200 mb-1">Endereço Oficial Copiado:</p>
                  <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[11px]">
                    <span className="text-amber-400 truncate">{window.location.origin}</span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                      {copied ? <Check className="h-3 w-3" /> : null}
                      {copied ? 'Copiado!' : 'Salvo'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDomainTips(false)}
                className="mt-4 w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors"
              >
                Concluído
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
