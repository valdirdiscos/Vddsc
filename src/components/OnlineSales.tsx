import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, Camera, RefreshCw, CheckCircle, AlertCircle, 
  Search, Disc, User, MapPin, Sparkles, Plus, AlertTriangle, 
  ArrowRight, Copy, Check, FileCheck, X, Trash2, ChevronRight, HelpCircle, FileText
} from 'lucide-react';
import { SavedListing, Customer } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface OnlineSalesProps {
  listings: SavedListing[];
  customers: Customer[];
  onUpdateListing: (updatedListing: SavedListing) => Promise<void> | void;
  onAddCustomer: (newCust: Customer) => Promise<void> | void;
  onSwitchToCatalog: () => void;
}

interface ScannedPrint {
  id: string;
  fileName: string;
  imagePreview: string;
  isParsing: boolean;
  parseError: string | null;
  parseSuccess: string | null;
  parsedData: {
    platform: 'shopee' | 'mercadolivre' | 'direct' | 'other';
    customerName: string;
    customerCity: string;
    customerState: string;
    salePrice: number;
    feesPaid: number;
    netProfit: number;
    albumTitle?: string;
    albumArtist?: string;
  } | null;
  
  // Custom states for this print specifically, initialized when parsed
  selectedListing: SavedListing | null;
  noMatchingItem: boolean;
  itemSearchQuery: string;
  customAlbumTitle: string;
  customAlbumArtist: string;
  customAlbumCost: number;
  
  // Customer selection specifically for this print
  selectedCustomerId: string;
  isNewCustomer: boolean;
  newCustName: string;
  newCustPhone: string;
  newCustCity: string;
  newCustState: string;
  
  isSubmitting: boolean;
  isCompleted: boolean;
  savedListingId?: string; // link to saved item
}

const compressAndResizeImage = (file: File, maxWidth = 1200, maxHeight = 1200): Promise<{ base64: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize proportionally
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao obter contexto do canvas 2D.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to jpeg base64 with high quality (0.85) to retain text sharpness
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        const base64String = compressedBase64.split(',')[1];
        resolve({
          base64: base64String,
          mimeType: 'image/jpeg'
        });
      };
      img.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
};

export default function OnlineSales({ 
  listings, 
  customers, 
  onUpdateListing, 
  onAddCustomer, 
  onSwitchToCatalog 
}: OnlineSalesProps) {
  const [scannedPrints, setScannedPrints] = useState<ScannedPrint[]>([]);
  const [activePrintId, setActivePrintId] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [receiptCopiedId, setReceiptCopiedId] = useState<string | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Retrieve active print object
  const activePrint = scannedPrints.find(p => p.id === activePrintId) || null;

  // Clipboard Paste handler
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        processImageFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [scannedPrints]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop Event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files) as File[];
      processImageFiles(filesArray);
    }
  };

  // File Picker Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files) as File[];
      processImageFiles(filesArray);
    }
  };

  // Main Image Processor for multiple files
  const processImageFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Por favor, selecione apenas arquivos de imagem (prints ou fotos).');
      return;
    }

    const newPrints: ScannedPrint[] = imageFiles.map((file, idx) => {
      const id = 'print-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9) + '-' + idx;
      const previewUrl = URL.createObjectURL(file);

      return {
        id,
        fileName: file.name,
        imagePreview: previewUrl,
        isParsing: true,
        parseError: null,
        parseSuccess: null,
        parsedData: null,
        
        selectedListing: null,
        noMatchingItem: false,
        itemSearchQuery: '',
        customAlbumTitle: '',
        customAlbumArtist: '',
        customAlbumCost: 0,
        
        selectedCustomerId: '',
        isNewCustomer: false,
        newCustName: '',
        newCustPhone: '',
        newCustCity: '',
        newCustState: '',
        
        isSubmitting: false,
        isCompleted: false
      };
    });

    setScannedPrints(prev => [...prev, ...newPrints]);
    
    // Set first newly added print as active if there wasn't an active one or the previous active was completed
    if (!activePrintId || scannedPrints.find(p => p.id === activePrintId)?.isCompleted) {
      setActivePrintId(newPrints[0].id);
    }

    // Trigger parsing for each image individually
    newPrints.forEach((print, index) => {
      triggerParsing(imageFiles[index], print.id);
    });
  };

  // Call the Gemini API to parse an individual print
  const triggerParsing = async (file: File, printId: string) => {
    try {
      // Compress and resize image client-side to avoid Payload Too Large errors and speed up requests
      const { base64: base64Data, mimeType } = await compressAndResizeImage(file);
      
      const res = await fetch("/api/parse-shopee-print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mimeType
        })
      });

      if (!res.ok) {
        let errMsg = "Erro de comunicação com o servidor Gemini.";
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {
          // Fallback to default message or status text if JSON is not readable
        }
        throw new Error(errMsg);
      }

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        
        // Normalize platform
        let platform: 'shopee' | 'mercadolivre' | 'direct' | 'other' = 'shopee';
        if (data.platform && ['shopee', 'mercadolivre', 'direct', 'other'].includes(data.platform)) {
          platform = data.platform as any;
        }

        const parsed = {
          platform,
          customerName: data.customerName || 'Cliente Identificado',
          customerCity: data.customerCity || '',
          customerState: (data.customerState || '').toUpperCase(),
          salePrice: data.salePrice || 0,
          feesPaid: data.feesPaid || 0,
          netProfit: data.netProfit || 0,
          albumTitle: data.albumTitle || undefined,
          albumArtist: data.albumArtist || undefined
        };

        // Try auto-matching with the catalog
        let matchedListing: SavedListing | null = null;
        let searchSuggestion = '';

        if (parsed.albumTitle) {
          const available = listings.filter(l => l.status === 'available' || l.status === 'reserved' || !l.status);
          if (available.length > 0) {
            const tLower = parsed.albumTitle.toLowerCase();
            const aLower = parsed.albumArtist ? parsed.albumArtist.toLowerCase() : '';

            const scored = available.map(item => {
              let score = 0;
              const itemTitle = item.release.title.toLowerCase();
              const itemArtist = item.release.artist.toLowerCase();

              if (itemTitle.includes(tLower) || tLower.includes(itemTitle)) {
                score += 5;
              } else {
                const words = tLower.split(/\s+/).filter(w => w.length > 2);
                words.forEach(w => {
                  if (itemTitle.includes(w)) score += 1;
                });
              }

              if (aLower) {
                if (itemArtist.includes(aLower) || aLower.includes(itemArtist)) {
                  score += 4;
                } else {
                  const words = aLower.split(/\s+/).filter(w => w.length > 2);
                  words.forEach(w => {
                    if (itemArtist.includes(w)) score += 1;
                  });
                }
              }
              return { item, score };
            });

            const sorted = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
            if (sorted.length > 0 && sorted[0].score >= 3) {
              matchedListing = sorted[0].item;
            } else {
              searchSuggestion = parsed.albumTitle;
            }
          }
        }

        // Try auto-matching client
        let matchedCustomerId = '';
        let isNewCustomer = false;
        let newCustName = '';
        let newCustCity = '';
        let newCustState = '';

        if (parsed.customerName && parsed.customerName !== 'Cliente Identificado') {
          const nameLower = parsed.customerName.toLowerCase().trim();
          const matched = customers.find(c => 
            c.name.toLowerCase().includes(nameLower) || nameLower.includes(c.name.toLowerCase())
          );

          if (matched) {
            matchedCustomerId = matched.id;
          } else {
            isNewCustomer = true;
            newCustName = parsed.customerName;
            newCustCity = parsed.customerCity;
            newCustState = parsed.customerState;
          }
        }

        // Update print entry
        setScannedPrints(prev => prev.map(p => {
          if (p.id === printId) {
            return {
              ...p,
              isParsing: false,
              parseSuccess: 'Análise concluída!',
              parsedData: parsed,
              selectedListing: matchedListing,
              itemSearchQuery: searchSuggestion,
              selectedCustomerId: matchedCustomerId,
              isNewCustomer,
              newCustName,
              newCustCity,
              newCustState
            };
          }
          return p;
        }));

      } else {
        throw new Error("Não foi possível decifrar dados estruturados desta imagem.");
      }
    } catch (err: any) {
      console.error(err);
      setScannedPrints(prev => prev.map(p => {
        if (p.id === printId) {
          return {
            ...p,
            isParsing: false,
            parseError: err.message || 'Erro ao processar imagem.'
          };
        }
        return p;
      }));
    }
  };

  // Helper to calculate total unit cost (Base + Packaging)
  const getItemCost = (item: SavedListing): number => {
    const base = item.pricing.useExchange 
      ? item.pricing.basePriceBrl * item.pricing.exchangeRate 
      : item.pricing.basePriceBrl;
    return base + (item.pricing.packagingCost || 0);
  };

  // Remove print from list
  const handleRemovePrint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setScannedPrints(prev => prev.filter(p => p.id !== id));
    if (activePrintId === id) {
      const remaining = scannedPrints.filter(p => p.id !== id);
      if (remaining.length > 0) {
        setActivePrintId(remaining[0].id);
      } else {
        setActivePrintId(null);
      }
    }
  };

  // Mutators for active print specific settings
  const updateActivePrintState = (updater: (print: ScannedPrint) => ScannedPrint) => {
    if (!activePrintId) return;
    setScannedPrints(prev => prev.map(p => p.id === activePrintId ? updater(p) : p));
  };

  // Final Action: Confirm and Save Sale for Active Print
  const handleConfirmSale = async () => {
    if (!activePrint || !activePrint.parsedData) return;
    if (!activePrint.selectedListing && !activePrint.noMatchingItem) {
      alert('Por favor, selecione ou busque o disco correspondente no seu acervo ou marque a opção "Item fora do estoque".');
      return;
    }

    // Set submitting
    updateActivePrintState(p => ({ ...p, isSubmitting: true }));

    try {
      let finalCustId = activePrint.selectedCustomerId || undefined;
      let finalCustName = customers.find(c => c.id === activePrint.selectedCustomerId)?.name || undefined;

      // 1. Create customer if new
      if (activePrint.isNewCustomer && activePrint.newCustName.trim()) {
        const newId = Date.now().toString();
        const newCust: Customer = {
          id: newId,
          name: activePrint.newCustName.trim(),
          phone: activePrint.newCustPhone.trim() || undefined,
          city: activePrint.newCustCity.trim() || undefined,
          state: activePrint.newCustState.trim().toUpperCase() || undefined,
          createdAt: new Date().toISOString()
        };

        await onAddCustomer(newCust);
        finalCustId = newId;
        finalCustName = newCust.name;
      }

      // 2. Prepare Target Listing
      let targetListing: SavedListing;
      const parsed = activePrint.parsedData;
      const calculatedCost = activePrint.selectedListing 
        ? getItemCost(activePrint.selectedListing) 
        : activePrint.customAlbumCost;
      const simulatedProfit = parsed.salePrice - calculatedCost - parsed.feesPaid;

      if (activePrint.noMatchingItem) {
        const cleanTitle = activePrint.customAlbumTitle.trim() || parsed.albumTitle || 'Item de Venda Direta';
        const cleanArtist = activePrint.customAlbumArtist.trim() || parsed.albumArtist || 'Artista Não Especificado';

        targetListing = {
          id: 'custom-sale-' + Date.now(),
          release: {
            id: 'custom-' + Date.now(),
            title: cleanTitle,
            artist: cleanArtist,
            label: 'N/A',
            catno: 'N/A',
            year: new Date().getFullYear(),
            genres: [],
            styles: [],
            tracklist: [],
            formats: [{ name: 'Disco Vinil', qty: '1', descriptions: [] }],
            coverImage: 'https://images.unsplash.com/photo-1539628399213-d6489ff39345?w=200&auto=format&fit=crop'
          },
          condition: {
            mediaCondition: 'NM',
            mediaDetails: '',
            sleeveCondition: 'NM',
            sleeveDetails: ''
          },
          pricing: {
            basePriceBrl: activePrint.customAlbumCost,
            exchangeRate: 1,
            useExchange: false,
            shopeeCommissionPercent: 0,
            shopeeFixedFee: 0,
            packagingCost: 0,
            profitMarginPercent: 0
          },
          shopee: {
            title: cleanTitle,
            description: '',
            suggestedPrice: parsed.salePrice,
            hashtags: []
          },
          createdAt: new Date().toISOString()
        };
      } else {
        targetListing = activePrint.selectedListing!;
      }

      const updatedListing: SavedListing = {
        ...targetListing,
        status: 'sold',
        customerId: finalCustId,
        customerName: finalCustName,
        saleDetails: {
          salePrice: parsed.salePrice,
          platform: parsed.platform,
          soldAt: new Date().toISOString(),
          feesPaid: parsed.feesPaid,
          netProfit: parseFloat(simulatedProfit.toFixed(2)),
          paymentStatus: 'pago',
          paymentMethod: parsed.platform === 'direct' ? 'pix' : parsed.platform
        }
      };

      await onUpdateListing(updatedListing);

      // Mark this print as completed and record the listing id
      setScannedPrints(prev => prev.map(p => {
        if (p.id === activePrintId) {
          return {
            ...p,
            isSubmitting: false,
            isCompleted: true,
            savedListingId: updatedListing.id
          };
        }
        return p;
      }));

    } catch (err: any) {
      console.error(err);
      alert('Erro ao confirmar a venda: ' + err.message);
      updateActivePrintState(p => ({ ...p, isSubmitting: false }));
    }
  };

  const copyReceiptText = (print: ScannedPrint) => {
    if (!print.parsedData) return;
    
    const albumName = print.noMatchingItem 
      ? (print.customAlbumTitle || print.parsedData.albumTitle || 'Álbum Musical') 
      : (print.selectedListing?.release.title || 'Álbum Musical');
    
    const artistName = print.noMatchingItem 
      ? (print.customAlbumArtist || print.parsedData.albumArtist || '') 
      : (print.selectedListing?.release.artist || '');

    const buyerName = print.isNewCustomer ? print.newCustName : (customers.find(c => c.id === print.selectedCustomerId)?.name || 'Consumidor Final');

    const text = `*VALDIR DISCOS & ANTIGUIDADES* 💿
---------------------------------------
*RECIBO DE VENDA ONLINE*
Data: ${new Date().toLocaleDateString('pt-BR')}
Canal: ${print.parsedData.platform.toUpperCase()}

*Item:* ${albumName} ${artistName ? `- ${artistName}` : ''}
*Cliente:* ${buyerName || 'Consumidor Final'}

*Valor Total:* R$ ${print.parsedData.salePrice.toFixed(2)}
*Status:* Pago e Confirmado ✅
---------------------------------------
Muito obrigado pela compra! Preservando a história física da música brasileira.`;

    navigator.clipboard.writeText(text);
    setReceiptCopiedId(print.id);
    setTimeout(() => setReceiptCopiedId(null), 2000);
  };

  // Filter list of available in-stock items
  const getFilteredCatalogItems = (searchQuery: string) => {
    return listings.filter(item => {
      const isAvail = item.status === 'available' || item.status === 'reserved' || !item.status;
      if (!isAvail) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.release.title.toLowerCase().includes(q) ||
          item.release.artist.toLowerCase().includes(q) ||
          (item.release.catno && item.release.catno.toLowerCase().includes(q))
        );
      }
      return true;
    });
  };

  // Clear completed prints from the list
  const clearCompleted = () => {
    const uncompleted = scannedPrints.filter(p => !p.isCompleted);
    setScannedPrints(uncompleted);
    if (activePrintId && scannedPrints.find(p => p.id === activePrintId)?.isCompleted) {
      if (uncompleted.length > 0) {
        setActivePrintId(uncompleted[0].id);
      } else {
        setActivePrintId(null);
      }
    }
  };

  // Clear entire list
  const clearAll = () => {
    if (confirm('Tem certeza que deseja limpar todos os prints da fila?')) {
      setScannedPrints([]);
      setActivePrintId(null);
    }
  };

  // Go to next pending print in list
  const goToNextPending = () => {
    const nextPending = scannedPrints.find(p => !p.isCompleted && p.id !== activePrintId);
    if (nextPending) {
      setActivePrintId(nextPending.id);
    }
  };

  // Count metrics
  const totalInQueue = scannedPrints.length;
  const totalCompleted = scannedPrints.filter(p => p.isCompleted).length;
  const totalParsing = scannedPrints.filter(p => p.isParsing).length;

  return (
    <div className="space-y-6" id="online-sales-workspace">
      {/* Intro Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <Camera className="h-5 w-5 text-indigo-100" />
            </div>
            <h2 className="text-lg font-black tracking-wide">Faturamento em Lote por Prints</h2>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Arraste, tire ou envie múltiplos prints ou comprovantes Pix de uma vez só! O Gemini AI lê e analisa cada um individualmente em segundo plano enquanto você finaliza os cadastros.
          </p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/60 p-3 rounded-xl flex items-center gap-2.5 self-start md:self-auto text-xs">
          <span className={`flex h-2 w-2 rounded-full ${totalParsing > 0 ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span className="font-semibold text-slate-300">
            {totalParsing > 0 ? `Lendo ${totalParsing} de ${totalInQueue} prints...` : 'Fila de faturamento pronta!'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Upload & Processing queue */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                1. Upload de Múltiplos Prints
              </h3>
              {totalCompleted > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-700 underline"
                >
                  Limpar concluídos
                </button>
              )}
            </div>

            {/* Drop / Paste Box */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-all duration-200 ${
                dragActive 
                  ? 'border-indigo-600 bg-indigo-50/30' 
                  : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-2">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-full w-fit mx-auto shadow-inner">
                  <Camera className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-slate-700 block">
                    Adicionar Prints / Comprovantes
                  </span>
                  <span className="text-[9px] text-slate-400 block font-medium mt-0.5">
                    Selecione várias fotos ao mesmo tempo ou use Ctrl+V
                  </span>
                </div>
              </div>
            </div>

            {/* Processing Queue List */}
            {scannedPrints.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Fila de faturamento ({totalInQueue})</span>
                  <button onClick={clearAll} className="text-rose-500 hover:text-rose-700 hover:underline">
                    Remover todos
                  </button>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {scannedPrints.map((print, index) => {
                    const isActive = print.id === activePrintId;
                    let statusLabel = 'Aguardando';
                    let statusColor = 'text-slate-400 bg-slate-100';

                    if (print.isParsing) {
                      statusLabel = 'Analisando...';
                      statusColor = 'text-indigo-600 bg-indigo-50 animate-pulse font-extrabold';
                    } else if (print.isCompleted) {
                      statusLabel = 'Registrado';
                      statusColor = 'text-emerald-700 bg-emerald-50 border border-emerald-200 font-extrabold';
                    } else if (print.parseError) {
                      statusLabel = 'Erro de leitura';
                      statusColor = 'text-rose-600 bg-rose-50 border border-rose-100 font-extrabold';
                    } else if (print.parsedData) {
                      statusLabel = `Pronto (${print.parsedData.platform.toUpperCase()})`;
                      statusColor = 'text-amber-700 bg-amber-50 border border-amber-200 font-bold';
                    }

                    return (
                      <div
                        key={print.id}
                        onClick={() => setActivePrintId(print.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between relative group ${
                          isActive 
                            ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-300' 
                            : print.isCompleted 
                              ? 'bg-slate-50/50 border-slate-150 opacity-75'
                              : 'bg-white border-slate-200 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Thumbnail preview */}
                          <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                            {print.imagePreview && print.imagePreview.trim() !== '' ? (
                              <img src={print.imagePreview} alt="Preview" className="h-full w-full object-cover" />
                            ) : (
                              <FileText className="h-4 w-4 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-black text-slate-800 block truncate leading-snug">
                              Print #{index + 1} - {print.parsedData?.customerName || print.fileName.slice(0, 15)}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1.5 py-0.5 text-[8px] font-black rounded uppercase ${statusColor}`}>
                                {statusLabel}
                              </span>
                              {print.parsedData && print.parsedData.salePrice > 0 && (
                                <span className="text-[9px] font-bold text-indigo-700">
                                  R$ {print.parsedData.salePrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleRemovePrint(print.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick tips */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-600 block uppercase">💡 Dicas do Valdir:</span>
              <ul className="list-disc pl-3.5 space-y-0.5 font-medium leading-relaxed">
                <li>Você pode colar várias fotos seguidamente via <kbd className="px-1 bg-slate-200 rounded text-slate-700">Ctrl+V</kbd>.</li>
                <li>Selecione vários arquivos na galeria do seu celular para enviar todos em lote.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right column: Active Print Workspace */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {activePrint ? (
              <motion.div
                key={activePrint.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5"
              >
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                      Faturamento do Print Selecionado
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">Arquivo: {activePrint.fileName}</p>
                  </div>

                  {activePrint.parsedData && (
                    <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-lg uppercase ${
                      activePrint.parsedData.platform === 'shopee' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
                      activePrint.parsedData.platform === 'mercadolivre' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      activePrint.parsedData.platform === 'direct' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {activePrint.parsedData.platform === 'shopee' ? 'Shopee' :
                       activePrint.parsedData.platform === 'mercadolivre' ? 'Mercado Livre' :
                       activePrint.parsedData.platform === 'direct' ? 'Direto / Pix' : 'Outra Plataforma'}
                    </span>
                  )}
                </div>

                {/* Main conditional display states for the active print */}
                {activePrint.isParsing ? (
                  <div className="py-16 text-center space-y-3">
                    <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                    <div>
                      <p className="text-xs font-black text-slate-700 uppercase">Gemini AI lendo o print...</p>
                      <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto mt-0.5">
                        Aguarde um instante enquanto a Inteligência Artificial decifra comprador, preço, taxas e o álbum.
                      </p>
                    </div>
                  </div>
                ) : activePrint.parseError ? (
                  <div className="py-10 text-center space-y-3 max-w-sm mx-auto">
                    <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
                    <div>
                      <h4 className="text-xs font-black text-rose-800 uppercase">Falha na Leitura Automática</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">
                        Não conseguimos ler os dados deste print automaticamente. Isso pode ocorrer por falta de nitidez ou formato inválido.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => triggerParsing(fileInputRef.current?.files?.[0] || new File([], ''), activePrint.id)}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Tentar ler novamente
                      </button>
                    </div>
                  </div>
                ) : activePrint.isCompleted ? (
                  /* Completed success state */
                  <div className="py-8 text-center space-y-5">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full w-fit mx-auto shadow-inner">
                      <CheckCircle className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Venda Registrada com Sucesso!</h4>
                      <p className="text-[10px] text-slate-400 font-medium">O status do disco foi alterado para 'Vendido' no acervo.</p>
                    </div>

                    {/* Financial details overview */}
                    {activePrint.parsedData && (
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 max-w-md mx-auto text-left text-xs font-mono space-y-1">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                          <span className="font-sans text-slate-400 font-bold">Resumo Financeiro</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-sans uppercase font-extrabold">
                            #{activePrint.id.slice(-5).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>👤 Cliente:</span>
                          <span className="font-sans text-slate-700 font-bold">
                            {activePrint.isNewCustomer ? activePrint.newCustName : (customers.find(c => c.id === activePrint.selectedCustomerId)?.name || 'Consumidor Final')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>💰 Valor Pago:</span>
                          <span className="text-slate-800 font-bold">R$ {activePrint.parsedData.salePrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>📉 Taxas Retidas:</span>
                          <span className="text-rose-600">R$ {activePrint.parsedData.feesPaid.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center gap-3 max-w-md mx-auto pt-2">
                      <button
                        onClick={() => copyReceiptText(activePrint)}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-100"
                      >
                        {receiptCopiedId === activePrint.id ? (
                          <>
                            <Check className="h-4 w-4" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" /> Copiar para WhatsApp
                          </>
                        )}
                      </button>
                      
                      {scannedPrints.some(p => !p.isCompleted) ? (
                        <button
                          onClick={goToNextPending}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          Ir para o próximo <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={onSwitchToCatalog}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          Ir para o Acervo <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : activePrint.parsedData ? (
                  /* Form flow for editing/confirming a parsed print */
                  <div className="space-y-5 animate-fade-in">
                    {/* 1. Parsed details grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Comprador no Print</span>
                          <Sparkles className="h-3 w-3 text-indigo-500 shrink-0" />
                        </div>
                        <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          {activePrint.parsedData.customerName}
                        </p>
                        {(activePrint.parsedData.customerCity || activePrint.parsedData.customerState) && (
                          <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {activePrint.parsedData.customerCity} - {activePrint.parsedData.customerState}
                          </span>
                        )}
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Valores Extraídos</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-600 font-mono">
                            Preço: R$ {activePrint.parsedData.salePrice.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            Comissão/Taxa: R$ {activePrint.parsedData.feesPaid.toFixed(2)}
                          </span>
                        </div>
                        {/* Inline field adjustments */}
                        <div className="flex gap-2 pt-1 border-t border-slate-200 mt-1">
                          <div className="flex-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Preço real:</span>
                            <input
                              type="number"
                              value={activePrint.parsedData.salePrice || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateActivePrintState(p => {
                                  if (!p.parsedData) return p;
                                  return { ...p, parsedData: { ...p.parsedData, salePrice: val } };
                                });
                              }}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 font-mono"
                            />
                          </div>
                          <div className="flex-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Taxas:</span>
                            <input
                              type="number"
                              value={activePrint.parsedData.feesPaid || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateActivePrintState(p => {
                                  if (!p.parsedData) return p;
                                  return { ...p, parsedData: { ...p.parsedData, feesPaid: val } };
                                });
                              }}
                              className="w-full px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 2. Item Association Section */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Disco / Álbum Correspondente:
                        </label>
                        <label className="text-[9px] font-bold text-slate-400 flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activePrint.noMatchingItem}
                            onChange={(e) => {
                              const val = e.target.checked;
                              updateActivePrintState(p => ({ ...p, noMatchingItem: val }));
                            }}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                          />
                          Venda Direta (fora do acervo)
                        </label>
                      </div>

                      {activePrint.noMatchingItem ? (
                        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 animate-fade-in">
                          <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest block">
                            📝 Dados do Item Vendido Diretamente
                          </span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Título do Álbum:</label>
                              <input
                                type="text"
                                placeholder="Ex: Acabou Chorare"
                                value={activePrint.customAlbumTitle}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateActivePrintState(p => ({ ...p, customAlbumTitle: val }));
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase">Artista:</label>
                              <input
                                type="text"
                                placeholder="Ex: Novos Baianos"
                                value={activePrint.customAlbumArtist}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateActivePrintState(p => ({ ...p, customAlbumArtist: val }));
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="space-y-1 w-1/2">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Custo Unitário de Compra (R$):</label>
                            <input
                              type="number"
                              placeholder="Ex: 30.00"
                              value={activePrint.customAlbumCost || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                updateActivePrintState(p => ({ ...p, customAlbumCost: val }));
                              }}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Display album title from print if available */}
                          {activePrint.parsedData.albumTitle && (
                            <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 flex items-center justify-between text-xs">
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black text-indigo-700 uppercase tracking-wider block">Extraído do Print</span>
                                <strong className="text-slate-800 font-extrabold block truncate">{activePrint.parsedData.albumTitle}</strong>
                                {activePrint.parsedData.albumArtist && (
                                  <span className="text-slate-500 font-bold text-[10px] block mt-0.5">Artista sugerido: {activePrint.parsedData.albumArtist}</span>
                                )}
                              </div>
                              <Sparkles className="h-4 w-4 text-indigo-500 shrink-0 ml-2" />
                            </div>
                          )}

                          {/* Selected stock listing indicator */}
                          {activePrint.selectedListing ? (
                            <div className="p-3 border border-indigo-200 bg-indigo-50/20 rounded-xl flex items-center justify-between relative overflow-hidden">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-10 w-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                                  {activePrint.selectedListing.release.coverImage && activePrint.selectedListing.release.coverImage.trim() !== '' ? (
                                    <img 
                                      src={activePrint.selectedListing.release.coverImage} 
                                      alt={activePrint.selectedListing.release.title} 
                                      className="h-full w-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <Disc className="h-5 w-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="space-y-0.5 min-w-0">
                                  <h4 className="text-xs font-black text-slate-800 leading-tight truncate">
                                    {activePrint.selectedListing.release.title}
                                  </h4>
                                  <p className="text-[10px] font-bold text-slate-500 truncate">{activePrint.selectedListing.release.artist}</p>
                                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                                    <span>Gaveta: {activePrint.selectedListing.drawer || 'N/A'}</span>
                                    <span>Preço Base: R$ {getItemCost(activePrint.selectedListing).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>

                              <button 
                                type="button"
                                onClick={() => updateActivePrintState(p => ({ ...p, selectedListing: null }))}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="p-4 border border-rose-100 bg-rose-50/30 rounded-xl text-center space-y-1">
                              <AlertTriangle className="h-4 w-4 text-rose-500 mx-auto" />
                              <p className="text-[10px] font-bold text-rose-800 leading-normal">
                                Busque e selecione o disco correspondente no seu estoque:
                              </p>
                            </div>
                          )}

                          {/* Manual Stock Search */}
                          <div className="space-y-1.5">
                            <div className="relative">
                              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Buscar no estoque por título, artista ou gaveta..."
                                value={activePrint.itemSearchQuery}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateActivePrintState(p => ({ ...p, itemSearchQuery: val }));
                                }}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                              />
                            </div>

                            {/* Options popup/results */}
                            {!activePrint.selectedListing && (
                              <div className="max-h-[160px] overflow-y-auto border border-slate-150 rounded-xl divide-y divide-slate-100 bg-white shadow-inner">
                                {getFilteredCatalogItems(activePrint.itemSearchQuery).length > 0 ? (
                                  getFilteredCatalogItems(activePrint.itemSearchQuery).map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => {
                                        updateActivePrintState(p => ({ ...p, selectedListing: item, itemSearchQuery: '' }));
                                      }}
                                      className="w-full p-2 hover:bg-slate-50 flex items-center gap-2.5 text-left cursor-pointer transition-colors text-xs"
                                    >
                                      <div className="h-8 w-8 rounded overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        {item.release.coverImage && item.release.coverImage.trim() !== '' ? (
                                          <img 
                                            src={item.release.coverImage} 
                                            alt={item.release.title} 
                                            className="h-full w-full object-cover" 
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <Disc className="h-4 w-4 text-slate-400" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 truncate leading-snug">{item.release.title}</p>
                                        <p className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">{item.release.artist}</p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-[8px] font-black uppercase text-indigo-600 px-1.5 py-0.5 bg-indigo-50 rounded">
                                          Gaveta {item.drawer || 'N/A'}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-500 block mt-0.5">Custo R$ {getItemCost(item).toFixed(0)}</span>
                                      </div>
                                    </button>
                                  ))
                                ) : (
                                  <p className="p-3 text-[10px] font-bold text-slate-400 text-center uppercase">
                                    Nenhum disco em estoque encontrado com esses termos.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Customer Binding */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Cliente da Venda:
                      </label>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateActivePrintState(p => ({ ...p, isNewCustomer: false }))}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                            !activePrint.isNewCustomer 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          Cliente Existente
                        </button>
                        <button
                          type="button"
                          onClick={() => updateActivePrintState(p => ({ ...p, isNewCustomer: true }))}
                          className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                            activePrint.isNewCustomer 
                              ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          Cadastrar Novo Rápido
                        </button>
                      </div>

                      {activePrint.isNewCustomer ? (
                        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2.5 animate-fade-in">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Nome Completo:</span>
                              <input
                                type="text"
                                value={activePrint.newCustName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateActivePrintState(p => ({ ...p, newCustName: val }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">WhatsApp / Celular:</span>
                              <input
                                type="text"
                                placeholder="(11) 99999-9999"
                                value={activePrint.newCustPhone}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateActivePrintState(p => ({ ...p, newCustPhone: val }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Cidade:</span>
                              <input
                                type="text"
                                value={activePrint.newCustCity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateActivePrintState(p => ({ ...p, newCustCity: val }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase">Estado (UF):</span>
                              <input
                                type="text"
                                maxLength={2}
                                value={activePrint.newCustState}
                                onChange={(e) => {
                                  const val = e.target.value.toUpperCase();
                                  updateActivePrintState(p => ({ ...p, newCustState: val }));
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <select
                          value={activePrint.selectedCustomerId}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateActivePrintState(p => ({ ...p, selectedCustomerId: val }));
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">-- Consumidor Final (Sem Vínculo) --</option>
                          {customers.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.city ? `(${c.city}/${c.state || 'SP'})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* 4. Profit & Pricing dynamic indicator */}
                    {(() => {
                      const calculatedCost = activePrint.selectedListing 
                        ? getItemCost(activePrint.selectedListing) 
                        : activePrint.customAlbumCost;
                      const simulatedProfit = activePrint.parsedData.salePrice - calculatedCost - activePrint.parsedData.feesPaid;
                      const simulatedMargin = activePrint.parsedData.salePrice > 0 
                        ? (simulatedProfit / activePrint.parsedData.salePrice) * 100 
                        : 0;

                      return (
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Demonstrativo de Faturamento</span>
                            <div className="text-[10px] font-semibold text-slate-500 space-y-0.5 leading-relaxed">
                              <div>Preço de Venda: <strong className="text-slate-700">R$ {activePrint.parsedData.salePrice.toFixed(2)}</strong></div>
                              <div>Custo Estimado do Item: <strong className="text-slate-700">R$ {calculatedCost.toFixed(2)}</strong></div>
                              <div>Taxas Plataforma: <strong className="text-slate-700">R$ {activePrint.parsedData.feesPaid.toFixed(2)}</strong></div>
                            </div>
                          </div>
                          
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Lucro Líquido Previsto</span>
                            <strong className="text-emerald-700 text-lg sm:text-xl font-black font-mono block">
                              R$ {simulatedProfit.toFixed(2)}
                            </strong>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${simulatedProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              Margem {simulatedMargin.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Confirm Action Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleConfirmSale}
                        disabled={activePrint.isSubmitting || (!activePrint.selectedListing && !activePrint.noMatchingItem)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {activePrint.isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" /> Registrando Venda...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" /> Registrar & Confirmar Venda
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              /* Empty state workspace */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-full border border-indigo-100 text-indigo-400 shadow-inner">
                  <ShoppingBag className="h-10 w-10 animate-bounce-slow" />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Nenhum print selecionado
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
                    Carregue prints da Shopee, Mercado Livre ou Pix na área ao lado, ou selecione um print existente na fila para concluir seu faturamento inteligente com IA.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
