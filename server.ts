/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import dns from "dns";

// Force IPv4 first to prevent IPv6 DNS resolution connection hangs in container environments
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please define it in your Secrets / Environment settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function generateContentWithFallback(ai: GoogleGenAI, params: any): Promise<any> {
  let requestedModel = params.model || "gemini-3.5-flash";
  if (requestedModel === "gemini-flash-latest") {
    requestedModel = "gemini-3.5-flash";
  }
  
  // Cleanly list potential models to try as fallbacks (excluding deprecated ones)
  const modelsToTry = [
    requestedModel,
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-flash-latest"
  ].filter((model, idx, self) => self.indexOf(model) === idx);
  
  // Map models to their underlying families to avoid duplicate slow failures on equivalent models
  const MODEL_FAMILIES: { [key: string]: string } = {
    "gemini-3.5-flash": "gemini-3.5-flash",
    "gemini-flash-latest": "gemini-3.5-flash",
    "gemini-3.1-flash-lite": "gemini-3.1-flash-lite",
    "gemini-2.5-flash": "gemini-2.5-flash"
  };
  
  const failedFamilies = new Set<string>();
  let lastError: any = null;
  
  for (const model of modelsToTry) {
    const family = MODEL_FAMILIES[model] || model;
    if (failedFamilies.has(family)) {
      console.log(`Skipping model ${model} because its family ${family} has already failed.`);
      continue;
    }
    
    let retries = 2; // Try up to 2 times for each model
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Calling Gemini API using model ${model} (attempt ${attempt}/${retries})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: model,
        });
        return response;
      } catch (error: any) {
        lastError = error;
        console.log(`Gemini call failed with model ${model} on attempt ${attempt}:`, error);
        
        // Extract status/code/message for robust check
        const errMsg = (error.message || "").toLowerCase();
        const errStatus = error.status || error.statusCode || error.code || (error.error && (error.error.code || error.error.status));
        
        // Only throw immediately on absolute terminal errors (authentication, key, or safety blocks)
        const isTerminalError = 
          errStatus === 401 || 
          errStatus === "401" ||
          errStatus === 403 || 
          errStatus === "403" ||
          errMsg.includes("api key") || 
          errMsg.includes("safety") || 
          errMsg.includes("blocked") ||
          errMsg.includes("unauthorized") ||
          errMsg.includes("invalid key");
          
        if (isTerminalError) {
          throw error;
        }
        
        // Check if the error is due to high demand, overload, rate limits, unavailability, or unsupported/deprecated models
        const isUnavailableOrUnsupported = 
          errStatus === 503 || 
          errStatus === "503" ||
          errStatus === 429 ||
          errStatus === "429" ||
          errStatus === 404 ||
          errStatus === "404" ||
          errStatus === 400 ||
          errStatus === "400" ||
          errStatus === "UNAVAILABLE" ||
          errStatus === "RESOURCE_EXHAUSTED" ||
          errMsg.includes("503") || 
          errMsg.includes("429") || 
          errMsg.includes("404") || 
          errMsg.includes("400") || 
          errMsg.includes("unavailable") || 
          errMsg.includes("high demand") || 
          errMsg.includes("overload") || 
          errMsg.includes("exhausted") ||
          errMsg.includes("resource has been exhausted") ||
          errMsg.includes("not found") ||
          errMsg.includes("does not exist") ||
          errMsg.includes("unsupported") ||
          errMsg.includes("deprecated") ||
          errMsg.includes("invalid model") ||
          errMsg.includes("unknown model") ||
          errMsg.includes("spikes in demand");
          
        if (isUnavailableOrUnsupported) {
          console.log(`Model ${model} is unavailable, overloaded, or unsupported. Marking family ${family} as failed and falling back immediately.`);
          failedFamilies.add(family);
          // Break out of the retry loop for this model to fall back immediately
          break;
        }
        
        if (attempt < retries) {
          const delay = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }
  
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Image Proxy for CORS-safe card exports
  app.get("/api/proxy-image", async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send("No image URL provided");
    }
    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'ValdirDiscosShopeeExtractor/1.0 (+https://valdirdiscos.com)'
        }
      });
      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch image");
      }
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.set("Content-Type", contentType);
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cache-Control", "public, max-age=86400");
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (err) {
      console.error("Error proxying image:", err);
      res.status(500).send("Internal server error proxying image");
    }
  });

  // Direct Mobile Logo Uploader Endpoint
  app.post("/api/upload-logo", async (req, res) => {
    try {
      const { type, dataBase64 } = req.body;
      if (!type || !dataBase64) {
        return res.status(400).json({ error: "Missing type or dataBase64" });
      }

      // Valid types: 'badge', 'color', 'bw'
      const baseNames: { [key: string]: string } = {
        badge: "valdir-logo-badge",
        color: "valdir-logo-color",
        bw: "valdir-logo-bw"
      };

      const baseName = baseNames[type] || "valdir-logo-badge";

      // Strip potential header like data:image/png;base64,...
      const base64Data = dataBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');

      const fs = await import("fs/promises");

      // Write both .jpg and .png to public directory
      const targets = [
        path.join(process.cwd(), "public", `${baseName}.jpg`),
        path.join(process.cwd(), "public", `${baseName}.png`),
        path.join(process.cwd(), "src", "assets", "images", `${baseName}.jpg`),
        path.join(process.cwd(), "src", "assets", "images", `${baseName}.png`),
      ];

      if (type === "badge") {
        targets.push(
          path.join(process.cwd(), "public", "app_icon.jpg"),
          path.join(process.cwd(), "public", "app_icon.png")
        );
      }

      for (const target of targets) {
        try {
          await fs.writeFile(target, buffer);
        } catch (writeErr) {
          // ignore directory non-existence in some environments
        }
      }

      // Also copy to dist if dist exists
      const distTargets = [
        path.join(process.cwd(), "dist", `${baseName}.jpg`),
        path.join(process.cwd(), "dist", `${baseName}.png`),
      ];
      for (const target of distTargets) {
        try {
          await fs.writeFile(target, buffer);
        } catch {}
      }

      return res.json({ success: true, message: `Logo ${baseName} (.jpg / .png) atualizado com sucesso!` });
    } catch (err: any) {
      console.error("Error saving uploaded logo:", err);
      return res.status(500).json({ error: err.message || "Falha ao salvar logo" });
    }
  });

  // Programmatic fallback for Manual Search Query if Gemini fails/is overloaded
  function generateManualProgrammaticExtract(query: string) {
    let artist = "Artista Desconhecido";
    let title = query || "Álbum Desconhecido";

    const splitters = [" - ", " – ", " — ", " by ", " de "];
    for (const s of splitters) {
      if (query.includes(s)) {
        const parts = query.split(s);
        if (parts.length >= 2) {
          artist = parts[0].trim();
          title = parts[1].trim();
          break;
        }
      }
    }

    return {
      id: "manual_fallback_" + Date.now(),
      title: title,
      artist: artist,
      label: "Gravadora Original",
      catno: "N/A",
      year: "N/A",
      country: "Brasil",
      genres: ["Música"],
      styles: [],
      tracklist: [
        { position: "1", title: "Faixa 1", duration: "03:30" },
        { position: "2", title: "Faixa 2", duration: "04:00" },
        { position: "3", title: "Faixa 3", duration: "03:45" }
      ],
      formats: [
        { name: "Vinyl", qty: "1", descriptions: ["LP", "Album"] }
      ],
      notes: "Informações geradas localmente. Edite os campos e a lista de faixas acima como desejar.",
      coverImage: "",
      isManual: true,
      isFallback: true
    };
  }

// Helper functions to detect and format imported record tags
function isImportedCountry(country?: string): boolean {
  if (!country) return false;
  const clean = country.trim().toLowerCase();
  if (!clean || clean === 'brasil' || clean === 'brazil' || clean === 'br' || clean === 'nacional' || clean === 'desconhecido' || clean === 'n/a') {
    return false;
  }
  return true;
}

function getImportTag(country?: string): string {
  if (!isImportedCountry(country)) return "";
  const clean = country!.trim().toUpperCase();
  if (clean === 'US' || clean === 'USA' || clean === 'UNITED STATES' || clean === 'ESTADOS UNIDOS' || clean === 'EUA') {
    return 'IMPORTADO EUA';
  }
  if (clean === 'UK' || clean === 'UNITED KINGDOM' || clean === 'REINO UNIDO' || clean === 'ENGLAND' || clean === 'INGLATERRA') {
    return 'IMPORTADO UK';
  }
  if (clean === 'JAPAN' || clean === 'JAPÃO' || clean === 'JAPAO') {
    return 'IMPORTADO JAPÃO';
  }
  if (clean === 'GERMANY' || clean === 'ALEMANHA') {
    return 'IMPORTADO ALEMANHA';
  }
  if (clean === 'EUROPE' || clean === 'EUROPA' || clean === 'EU') {
    return 'IMPORTADO EUROPA';
  }
  if (clean === 'FRANCE' || clean === 'FRANÇA' || clean === 'FRANCA') {
    return 'IMPORTADO FRANÇA';
  }
  if (clean === 'ITALY' || clean === 'ITÁLIA' || clean === 'ITALIA') {
    return 'IMPORTADO ITÁLIA';
  }
  if (clean.length <= 12) {
    return `IMPORTADO ${clean}`;
  }
  return 'IMPORTADO';
}

  // Programmatic fallback for Listing Generation if Gemini fails/is overloaded
  function generateProgrammaticListing(release: any, condition: any, pricing: any, drawer: string, isGarimpo?: boolean, garimpoDetails?: string) {
    const drawerClean = drawer ? String(drawer).trim() : "";
    const formatString = release.formats?.map((f: any) => `${f.qty}x ${f.name} (${f.descriptions?.join(", ") || ""})`).join(", ") || "Disco";
    
    const mediaFormatLower = (release.formats?.[0]?.name || "").toLowerCase();
    let formatLabel = "LP";
    if (mediaFormatLower.includes("cd")) formatLabel = "CD";
    else if (mediaFormatLower.includes("dvd")) formatLabel = "DVD";
    else if (mediaFormatLower.includes("vinyl") || mediaFormatLower.includes("vinil")) formatLabel = "LP";

    const isCdDvd = formatLabel === "CD" || formatLabel === "DVD";
    const isMint = condition.mediaCondition === 'M';

    const artistName = release.artist || "Artista Desconhecido";
    const albumTitle = release.title || "Álbum Desconhecido";
    const releaseYear = release.year || "N/A";
    const labelName = release.label || "N/A";
    const catNo = release.catno || "N/A";

    const isOnlySleeve = condition.mediaCondition === 'SEM_DISCO';
    const isOnlyMedia = condition.sleeveCondition === 'SEM_CAPA';
    const isImported = isImportedCountry(release.country);
    const importTag = getImportTag(release.country);

    // Shopee title limit is 115 characters
    let shopeeSuffix = "";
    if (isOnlySleeve) shopeeSuffix += " APENAS CAPA (SEM DISCO)";
    else if (isOnlyMedia) shopeeSuffix += " APENAS DISCO (SEM CAPA)";
    else if (isMint) shopeeSuffix += " NOVO LACRADO";

    if (isImported && importTag) {
      shopeeSuffix += ` ${importTag}`;
    }
    if (drawerClean) shopeeSuffix += ` [${drawerClean}]`;

    const prefix = `${formatLabel} `;
    const maxShopeeLen = 115;
    
    let baseTitleShopee = `${artistName} - ${albumTitle} (${releaseYear}) ${labelName}`;
    const availableShopeeLen = maxShopeeLen - prefix.length - shopeeSuffix.length;
    if (baseTitleShopee.length > availableShopeeLen) {
      baseTitleShopee = baseTitleShopee.substring(0, Math.max(10, availableShopeeLen - 3)) + "...";
    }
    const finalTitleShopee = `${prefix}${baseTitleShopee}${shopeeSuffix}`;

    // Mercado Livre title limit is 60 characters
    let mlSuffix = "";
    if (isOnlySleeve) mlSuffix = " APENAS CAPA (SEM DISCO)";
    else if (isOnlyMedia) mlSuffix = " APENAS DISCO (SEM CAPA)";
    else if (isImported && importTag) mlSuffix = ` ${importTag}`;

    const maxMlLen = 60;
    let baseTitleMl = `${artistName} - ${albumTitle}`;
    if (!isOnlySleeve && !isOnlyMedia && !isImported) {
      baseTitleMl = `${artistName} - ${albumTitle} (${releaseYear})`;
    }
    const availableMlLen = maxMlLen - prefix.length - mlSuffix.length;
    if (baseTitleMl.length > availableMlLen) {
      baseTitleMl = baseTitleMl.substring(0, Math.max(10, availableMlLen - 3)) + "...";
    }
    const finalTitleMl = `${prefix}${baseTitleMl}${mlSuffix}`;

    // Build description markdown lines
    const descLines: string[] = [];

    if (isOnlySleeve) {
      descLines.push(`⚠️ **ATENÇÃO: ANÚNCIO REFERENTE APENAS À CAPA E ENCARTE ORIGINAL (NÃO POSSUI / NÃO ACOMPANHA O DISCO DE MÍDIA FÍSICA).**\n`);
    }

    if (isOnlyMedia) {
      descLines.push(`⚠️ **ATENÇÃO: ANÚNCIO REFERENTE APENAS AO DISCO (NÃO POSSUI A CAPA ORIGINAL DE PAPELÃO/ENCARTE). ENVIADO EM CAPA DE PROTEÇÃO GENÉRICA.**\n`);
    }

    if (isGarimpo) {
      descLines.push(`🔥 **SESSÃO GARIMPO & OPORTUNIDADES - VALDIR DISCOS**`);
      descLines.push(`Item com menor valor de mercado ou avarias/detalhes físicos anunciados com total transparência.`);
      if (garimpoDetails && garimpoDetails.trim()) {
        descLines.push(`• Detalhes / Motivo: ${garimpoDetails.trim()}`);
      }
      descLines.push(``);
    }

    if (drawerClean) {
      descLines.push(`📍 **Loc:** ${drawerClean}\n`);
    }

    descLines.push(`🎵 **BEM-VINDO À VALDIR DISCOS!** 🎵`);
    descLines.push(`Aqui você encontra mídias físicas originais com excelente qualidade para sua coleção.\n`);

    descLines.push(`📝 **ESTADO DE CONSERVAÇÃO (AVALIAÇÃO GOLDMINE)**`);
    
    const mediaCondMap: { [key: string]: string } = {
      'M': 'M (Mint) - Novo, lacrado de fábrica, perfeito estado.',
      'NM': 'NM (Near Mint) - Quase novo, sem marcas visíveis ou muito superficiais que não afetam a reprodução.',
      'VG+': 'VG+ (Very Good Plus) - Excelente estado, pouquíssimas marcas superficiais que não interferem no áudio.',
      'VG': 'VG (Very Good) - Muito bom estado. Apresenta algumas marcas superficiais leves, podendo conter chiados ocasionais de fundo, mas sem pular.',
      'G+': 'G+ (Good Plus) - Bom estado. Possui marcas visíveis de uso que causam ruídos de fundo perceptíveis, mas reproduz normalmente.',
      'G': 'G (Good) - Regular estado. Marcas visíveis e desgaste, com chiados evidentes.',
      'F': 'F (Fair) - Estado ruim, marcas acentuadas.',
      'P': 'P (Poor) - Estado precário, apenas para acervo ou decoração.',
      'SEM_DISCO': 'SEM DISCO (Mídia Ausente) - Anúncio referente exclusivamente à capa e encarte original.'
    };

    const sleeveCondMap: { [key: string]: string } = {
      'M': 'M (Mint) - Capa perfeita, nova, lacrada.',
      'NM': 'NM (Near Mint) - Capa praticamente perfeita, sem desgastes significativos.',
      'VG+': 'VG+ (Very Good Plus) - Capa muito bem conservada, pequenos detalhes ou marcas leves de manuseio.',
      'VG': 'VG (Very Good) - Capa em bom estado, com marcas visíveis de desgaste nas bordas ou cantos.',
      'G+': 'G+ (Good Plus) - Capa com marcas evidentes de desgaste, pequenas assinaturas ou desgastes acentuados.',
      'G': 'G (Good) - Capa com desgaste acentuado, pequenas avarias ou fita nas bordas.',
      'F': 'F (Fair) - Capa danificada.',
      'P': 'P (Poor) - Capa em estado muito precário ou inexistente.',
      'SEM_CAPA': 'SEM CAPA (Capa Genérica) - Anúncio referente apenas ao disco em envelope/capa de proteção genérica.'
    };

    descLines.push(`• **Mídia (Disco/CD/DVD):** ${mediaCondMap[condition.mediaCondition] || condition.mediaCondition}`);
    if (condition.mediaDetails) {
      descLines.push(`  *Observações da Mídia:* ${condition.mediaDetails}`);
    }

    descLines.push(`• **Capa / Estojo:** ${sleeveCondMap[condition.sleeveCondition] || condition.sleeveCondition}`);
    if (condition.sleeveDetails) {
      descLines.push(`  *Observações da Capa:* ${condition.sleeveDetails}`);
    }

    if (!isCdDvd) {
      if (condition.hasInsert) {
        descLines.push(`• **Encarte:** Sim, acompanhado em estado ${condition.insertCondition || 'VG+'}`);
        if (condition.insertDetails) {
          descLines.push(`  *Observações do Encarte:* ${condition.insertDetails}`);
        }
      } else {
        descLines.push(`• **Encarte:** Não possui / não acompanha encarte.`);
      }
    }

    if (isMint) {
      descLines.push(`\n✨ **PRODUTO NOVO & LACRADO DE FÁBRICA!** Nunca reproduzido, perfeito para colecionadores mais exigentes.`);
    } else {
      descLines.push(`\n✨ **PRODUTO REVISADO:** Garantia de uma ótima reprodução sem pulos ou travamentos.`);
    }

    descLines.push(`\n📷 *Fotos originais do produto.*`);

    descLines.push(`\n📋 **FICHA TÉCNICA DO LANÇAMENTO**`);
    descLines.push(`• **Artista/Banda:** ${artistName}`);
    descLines.push(`• **Título do Álbum:** ${albumTitle}`);
    descLines.push(`• **Formato:** ${formatString}`);
    descLines.push(`• **Gravadora:** ${labelName}`);
    descLines.push(`• **Número de Catálogo:** ${catNo}`);
    descLines.push(`• **Ano de Lançamento Original:** ${releaseYear}`);
    if (release.genres && release.genres.length > 0) {
      descLines.push(`• **Gênero:** ${release.genres.join(", ")}`);
    }
    if (release.styles && release.styles.length > 0) {
      descLines.push(`• **Estilos:** ${release.styles.join(", ")}`);
    }

    if (release.tracklist && release.tracklist.length > 0) {
      descLines.push(`\n🎶 **FAIXAS / TRACKLIST**`);
      release.tracklist.forEach((t: any) => {
        const pos = t.position ? `[${t.position}] ` : "• ";
        const dur = t.duration ? ` (${t.duration})` : "";
        const art = t.artist ? ` - ${t.artist}` : "";
        descLines.push(`${pos}${t.title}${art}${dur}`);
      });
    }

    descLines.push(`\n📦 **DIFERENCIAL DE ENVIO PREMIUM - VALDIR DISCOS**`);
    descLines.push(`1. **Higienização & Teste:** Discos de vinil usados passam por higienização profissional cuidadosa e teste de audição antes do envio (itens novos/lacrados permanecem intactos).`);
    descLines.push(`2. **Plásticos Novos:** Enviamos com plásticos protetores externos e internos novos de alta espessura (micragem), protegendo sua mídia contra poeira e riscos.`);
    descLines.push(`3. **Embalagem Blindada:** Embalamos sob medida em caixas de papelão super reforçadas e plástico bolha extra, garantindo que seu produto chegue intacto e perfeito em suas mãos.`);

    const finalDescription = descLines.join("\n");

    const baseHashtags = ["#vinil", "#discodevinil", "#valdirdiscos", "#colecionadores", "#lps", "#discosraros", "#musicabrasileira"];
    if (artistName !== "Artista Desconhecido") {
      const artistTag = "#" + artistName.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (artistTag.length > 2) baseHashtags.push(artistTag);
    }
    if (albumTitle !== "Álbum Desconhecido") {
      const albumTag = "#" + albumTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (albumTag.length > 2) baseHashtags.push(albumTag);
    }

    return {
      shopee: {
        title: finalTitleShopee,
        description: finalDescription,
        suggestedPrice: pricing.basePriceBrl || 0,
        hashtags: baseHashtags
      },
      mercadolivre: {
        title: finalTitleMl,
        description: finalDescription,
        suggestedPrice: pricing.basePriceBrl || 0
      }
    };
  }

  // Extract from Discogs Link or Manual Query
  app.post("/api/extract", async (req, res) => {
    const { url, query } = req.body;

    if (!url && !query) {
      return res.status(400).json({ error: "Por favor, envie um link do Discogs ou o nome de um álbum." });
    }

    try {
      if (url) {
        // 1. Try to extract release ID
        let releaseId = "";

        const releaseMatch = url.match(/(?:release|releases)\/(\d+)/i);
        const masterMatch = url.match(/(?:master|masters)\/(\d+)/i);
        const directIdMatch = url.match(/^\s*(\d+)\s*$/);

        if (releaseMatch) {
          releaseId = releaseMatch[1];
        } else if (masterMatch) {
          const masterId = masterMatch[1];
          // Fetch master to get main release
          const masterRes = await fetch(`https://api.discogs.com/masters/${masterId}`, {
            headers: { 'User-Agent': 'ValdirDiscosShopeeExtractor/1.0 (+https://valdirdiscos.com)' }
          });
          if (masterRes.ok) {
            const masterData: any = await masterRes.json();
            if (masterData.main_release) {
              releaseId = String(masterData.main_release);
            }
          }
        } else if (directIdMatch) {
          releaseId = directIdMatch[1];
        }

        if (!releaseId) {
          throw new Error("Não conseguimos identificar um ID de lançamento válido na URL. Certifique-se de que é um link de Release do Discogs (ex: discogs.com/release/XXXXX).");
        }

        // Fetch release from Discogs API
        const releaseUrl = `https://api.discogs.com/releases/${releaseId}`;
        const discogsResponse = await fetch(releaseUrl, {
          headers: {
            'User-Agent': 'ValdirDiscosShopeeExtractor/1.0 (+https://valdirdiscos.com)'
          }
        });

        let data: any;
        if (!discogsResponse.ok) {
          console.warn(`Discogs API returned status ${discogsResponse.status}. Attempting AI-driven reconstruction fallback...`);
          try {
            const ai = getGeminiClient();
            const aiPrompt = `O usuário forneceu o link do Discogs: "${url}" (ID do Lançamento: ${releaseId}).
Como a API oficial do Discogs está indisponível para o nosso servidor (${discogsResponse.status}), atue como o banco de dados oficial do Discogs e pesquise/reconstrua os detalhes técnicos REAIS deste lançamento específico com precisão máxima.
Retorne os dados formatados perfeitamente como JSON de acordo com a estrutura do Discogs para podermos listá-lo.

ATENÇÃO COM A ACENTUAÇÃO EM PORTUGUÊS: É obrigatório utilizar a acentuação gramatical correta e completa da língua portuguesa em todos os textos (incluindo cedilhas 'ç', tils '~', acentos agudos e circunflexos, como 'coleção', 'reprodução', 'álbum', 'música', 'canção', 'não'). Nunca remova acentos nem reduza o texto para formato sem acentos (ASCII puro).

Importante: Identifique o artista, título, gravadora, catalog no, ano e faixas reais desse lançamento ${releaseId}. A tracklist deve conter as faixas REAIS do disco em ordem correta. Se for LP, divida em Lado A (A1, A2...) e Lado B (B1, B2...), se for CD posicione sequencialmente (1, 2, 3...). Inclua estimativas de duração válidas (MM:SS).
Se for uma coletânea (Various Artists / Vários Artistas), você DEVE obrigatoriamente preencher o campo "artist" de cada faixa da tracklist com o nome do artista correspondente da música.`;

            const aiResponse = await generateContentWithFallback(ai, {
              model: "gemini-3.5-flash",
              contents: aiPrompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Nome exato do álbum" },
                    artist: { type: Type.STRING, description: "Nome correto do artista ou banda" },
                    label: { type: Type.STRING, description: "Gravadora original" },
                    catno: { type: Type.STRING, description: "Número de catálogo original do lançamento" },
                    year: { type: Type.STRING, description: "Ano original de lançamento do álbum" },
                    genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Gêneros (ex: Rock, Electronic, Latin)" },
                    styles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Estilos específicos (ex: Bossanova, Heavy Metal, Synth-pop)" },
                    tracklist: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          position: { type: Type.STRING, description: "Ex: A1, A2 ou 1, 2" },
                          title: { type: Type.STRING, description: "Título da faixa" },
                          duration: { type: Type.STRING, description: "MM:SS" },
                          artist: { type: Type.STRING, description: "Nome do artista específico desta música (obrigatório se for coletânea/vários artistas)" }
                        },
                        required: ["position", "title"]
                      }
                    },
                    formats: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING, description: "Ex: Vinyl, CD, DVD" },
                          qty: { type: Type.STRING, description: "Quantidade, ex: 1" },
                          descriptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ex: LP, Album, Gatefold" }
                        },
                        required: ["name"]
                      }
                    },
                    notes: { type: Type.STRING, description: "Curiosidade histórica sobre o álbum ou detalhes da prensagem" },
                    country: { type: Type.STRING, description: "País de origem/lançamento/prensagem (ex: Brasil, Japão, EUA, Alemanha)" },
                    lowestPriceUsd: { type: Type.NUMBER, description: "Preço médio de mercado internacional no Discogs em dólares (ex: 25)" }
                  },
                  required: ["title", "artist", "label", "tracklist", "formats"]
                }
              }
            });

            const cleanJson = aiResponse.text.trim();
            const albumData = JSON.parse(cleanJson);

            // Structure data to match expected Discogs fields
            data = {
              title: albumData.title,
              artists: [{ name: albumData.artist }],
              labels: [{ name: albumData.label, catno: albumData.catno }],
              released_year: albumData.year,
              country: albumData.country || "Brasil",
              genres: albumData.genres,
              styles: albumData.styles,
              tracklist: albumData.tracklist.map((t: any) => ({
                position: t.position,
                title: t.title,
                duration: t.duration,
                artists: t.artist ? [{ name: t.artist }] : undefined
              })),
              formats: albumData.formats,
              notes: albumData.notes + "\n\n(Reconstruído via Inteligência Artificial porque a API do Discogs estava indisponível.)",
              lowest_price: albumData.lowestPriceUsd,
              images: []
            };
          } catch (aiErr) {
            console.error("AI reconstruction failed:", aiErr);
            throw new Error(`O Discogs retornou um erro (${discogsResponse.status}) e a reconstrução automática por IA também falhou. Verifique o link ou tente digitar na Pesquisa Manual.`);
          }
        } else {
          data = await discogsResponse.json();
        }

        // Format data to fit DiscogsRelease format
        const artistsName = data.artists?.map((a: any) => a.name.replace(/\s\(\d+\)$/, '')).join(", ") || "Artista Desconhecido";
        const labelsName = data.labels?.map((l: any) => l.name).join(", ") || "N/A";
        const catalogNo = data.labels?.map((l: any) => l.catno).filter(Boolean).join(", ") || "N/A";

        const tracklist = data.tracklist?.map((t: any) => {
          let trackArtist = "";
          if (t.artists && Array.isArray(t.artists)) {
            trackArtist = t.artists.map((a: any) => a.name.replace(/\s\(\d+\)$/, '')).join(", ");
          }
          return {
            position: t.position || "",
            title: t.title || "",
            duration: t.duration || "",
            artist: trackArtist || undefined
          };
        }) || [];

        const formats = data.formats?.map((f: any) => ({
          name: f.name || "",
          qty: f.qty || "1",
          descriptions: f.descriptions || []
        })) || [];

        const coverImage = data.images?.[0]?.resource_url || data.images?.[0]?.uri || "";

        const payload = {
          id: releaseId,
          title: data.title || "Álbum Desconhecido",
          artist: artistsName,
          label: labelsName,
          catno: catalogNo,
          year: data.released_year || data.year || data.released || "N/A",
          country: data.country || "Brasil",
          genres: data.genres || [],
          styles: data.styles || [],
          tracklist,
          formats,
          coverImage,
          notes: data.notes || "",
          lowestPriceUsd: data.lowest_price || undefined
        };

        return res.json({ success: true, release: payload });
      } else {
        // 2. Manual query using Gemini search & reconstruction with safety programmatic fallback
        try {
          const ai = getGeminiClient();
          const prompt = `O usuário deseja vender o seguinte álbum de música na Shopee Brasil: "${query}".
Como ele não forneceu um link do Discogs, atue como o banco de dados oficial do Discogs e pesquise/reconstrua os detalhes técnicos REAIS deste álbum com precisão factual máxima.
Retorne os dados formatados perfeitamente como JSON de acordo com a estrutura do Discogs para podermos listá-lo.

ATENÇÃO COM A ACENTUAÇÃO EM PORTUGUÊS: É obrigatório utilizar a acentuação gramatical correta e completa da língua portuguesa em todos os textos (incluindo cedilhas 'ç', tils '~', acentos agudos e circunflexos, como 'coleção', 'reprodução', 'álbum', 'música', 'canção', 'não'). Nunca remova acentos nem reduza o texto para formato sem acentos (ASCII puro).

Importante: O ano de lançamento deve ser o ano original do álbum. A tracklist deve conter as faixas REAIS do disco em ordem correta, se for LP divida em Lado A (A1, A2...) e Lado B (B1, B2...), se for CD posicione sequencialmente (1, 2, 3...). Inclua estimativas de duração válidas (MM:SS).
Se for uma coletânea (Various Artists / Vários Artistas), você DEVE obrigatoriamente preencher o campo "artist" de cada faixa da tracklist com o nome do artista correspondente da música.
Gravadora original e número de catálogo devem ser os reais deste álbum clássico ou os mais comuns.`;

          const response = await generateContentWithFallback(ai, {
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Nome exato do álbum" },
                  artist: { type: Type.STRING, description: "Nome correto do artista ou banda" },
                  label: { type: Type.STRING, description: "Gravadora original" },
                  catno: { type: Type.STRING, description: "Número de catálogo original do lançamento" },
                  year: { type: Type.STRING, description: "Ano original de lançamento do álbum" },
                  genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Gêneros (ex: Rock, Electronic, Latin)" },
                  styles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Estilos específicos (ex: Bossanova, Heavy Metal, Synth-pop)" },
                  tracklist: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        position: { type: Type.STRING, description: "Ex: A1, A2 ou 1, 2" },
                        title: { type: Type.STRING, description: "Título da faixa" },
                        duration: { type: Type.STRING, description: "MM:SS" },
                        artist: { type: Type.STRING, description: "Nome do artista específico desta música (obrigatório se for coletânea/vários artistas)" }
                      },
                      required: ["position", "title"]
                    }
                  },
                  formats: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Ex: Vinyl, CD, DVD" },
                        qty: { type: Type.STRING, description: "Quantidade, ex: 1" },
                        descriptions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ex: LP, Album, Gatefold" }
                      },
                      required: ["name"]
                    }
                  },
                  notes: { type: Type.STRING, description: "Curiosidade histórica sobre o álbum ou detalhes da prensagem" },
                  country: { type: Type.STRING, description: "País de origem/lançamento/prensagem (ex: Brasil, Japão, EUA, Alemanha)" },
                  lowestPriceUsd: { type: Type.NUMBER, description: "Preço médio de mercado internacional no Discogs em dólares (ex: 25)" }
                },
                required: ["title", "artist", "label", "tracklist", "formats"]
              }
            }
          });

          const cleanJson = response.text.trim();
          const albumData = JSON.parse(cleanJson);

          albumData.id = "manual_" + Date.now();
          albumData.coverImage = ""; // Manual items don't have standard cover images
          albumData.isManual = true;

          return res.json({ success: true, release: albumData });
        } catch (geminiErr) {
          console.warn("Gemini extract failed, falling back to programmatic extraction:", geminiErr);
          const fallbackData = generateManualProgrammaticExtract(query);
          return res.json({ success: true, release: fallbackData, note: "Serviço de IA instável ou sobrecarregado. Dados básicos criados localmente com sucesso!" });
        }
      }
    } catch (error: any) {
      console.error("Extraction error:", error);
      return res.status(500).json({ error: error.message || "Erro de extração. Verifique suas conexões." });
    }
  });

  // Unified generator function for generating both Shopee and Mercado Livre listings in a single Gemini call
  async function generateAllListings(release: any, condition: any, pricing: any, drawer: string, isGarimpo?: boolean, garimpoDetails?: string) {
    const drawerClean = drawer ? String(drawer).trim() : "";
    const formatString = release.formats?.map((f: any) => `${f.qty}x ${f.name} (${f.descriptions?.join(", ") || ""})`).join(", ") || "Disco";
    const mediaFormatLower = (release.formats?.[0]?.name || "").toLowerCase();
    let formatLabel = "LP";
    if (mediaFormatLower.includes("cd")) formatLabel = "CD";
    else if (mediaFormatLower.includes("dvd")) formatLabel = "DVD";
    else if (mediaFormatLower.includes("vinyl") || mediaFormatLower.includes("vinil")) formatLabel = "LP";

    const isCdDvd = formatLabel === "CD" || formatLabel === "DVD";
    const isMint = condition.mediaCondition === 'M';

    // Extract unique track artists for compilations
    const trackArtistsList = Array.from(new Set(
      (release.tracklist || [])
        .map((t: any) => t.artist)
        .filter((a: string) => a && !/various|vários|varios|coletânea|compilation/i.test(a.trim()))
    )).slice(0, 10);

    const isCompilation = (release.artist && /various|vários|varios|coletânea|compilation/i.test(release.artist)) ||
      (release.formats?.[0]?.descriptions?.some((d: string) => /compilation|coletânea/i.test(d))) ||
      trackArtistsList.length > 1;

    const countryStr = release.country || "Brasil";
    const isOnlySleeve = condition.mediaCondition === 'SEM_DISCO';
    const isOnlyMedia = condition.sleeveCondition === 'SEM_CAPA';
    const isImported = isImportedCountry(countryStr);
    const importTag = getImportTag(countryStr);

    try {
      const ai = getGeminiClient();

      const prompt = `Você é um especialista em vendas e mídias físicas de música (LPs, CDs, DVDs) no e-commerce brasileiro. O dono da loja chama-se **Valdir** e a loja é a **Valdir Discos**. Nosso foco é oferecer itens originais de alta qualidade para colecionadores exigentes de forma honesta, objetiva e puramente baseada em dados reais.

Gere um anúncio de vendas super direto e de forma compartilhada para duas plataformas de marketplace populares (Shopee e Mercado Livre).
A descrição deve ser compartilhada e idêntica para ambas, e, por isso, você está **RIGOROSAMENTE PROIBIDO de citar os nomes das plataformas ("Shopee", "Mercado Livre", "MercadoLivre", "ML") ou qualquer outro nome de site na descrição**! O texto deve ser focado puramente nas especificações concretas do item físico, no estado de conservação real dele, nas faixas de música e no excelente e seguro serviço de envio da loja Valdir Discos.

${isGarimpo ? `🚨 SESSÃO GARIMPO & OPORTUNIDADES:
- Este item faz parte da Sessão Garimpo (menor valor de mercado, avarias ou oportunidade especial para colecionadores).
- Motivo / Detalhes informados pelo Valdir: "${garimpoDetails || 'Item com menor valor de mercado / oportunidade'}".
- É OBRIGATÓRIO incluir logo no início da descrição a seção "GARIMPO & OPORTUNIDADES" explicando esses detalhes com total transparência!` : ""}

${isOnlySleeve ? `🚨 ALERTA CRÍTICO: ESTE ANÚNCIO É REFERENTE APENAS À CAPA E ENCARTE (NÃO POSSUI O DISCO/MÍDIA).
- É OBRIGATÓRIO INCLUIR "APENAS CAPA (SEM DISCO)" EM MAIÚSCULAS NO FINAL DO TÍTULO DA SHOPEE E DO MERCADO LIVRE!
- É OBRIGATÓRIO INCLUIR UM AVISO EM DESTAQUE NO INÍCIO DA DESCRIÇÃO INFORMANDO QUE NÃO POSSUI O DISCO/MÍDIA!` : ""}

${isOnlyMedia ? `🚨 ALERTA CRÍTICO: ESTE ANÚNCIO É REFERENTE APENAS AO DISCO (NÃO POSSUI A CAPA ORIGINAL).
- É OBRIGATÓRIO INCLUIR "APENAS DISCO (SEM CAPA)" EM MAIÚSCULAS NO FINAL DO TÍTULO DA SHOPEE E DO MERCADO LIVRE!
- É OBRIGATÓRIO INCLUIR UM AVISO EM DESTAQUE NO INÍCIO DA DESCRIÇÃO INFORMANDO QUE O DISCO SERÁ ENVIADO EM CAPA DE PROTEÇÃO GENÉRICA!` : ""}

${isImported ? `🚨 ALERTA CRÍTICO DE DISCO IMPORTADO: ESTE DISCO É UMA EDIÇÃO IMPORTADA (PAÍS/PRENSAGEM: ${countryStr.toUpperCase()}).
- É EXTREMAMENTE OBRIGATÓRIO INCLUIR A TAG "${importTag}" OU "IMPORTADO" EM MAIÚSCULAS NO TÍTULO DA SHOPEE E DO MERCADO LIVRE!
- É OBRIGATÓRIO DESTACAR NA DESCRIÇÃO E NA FICHA TÉCNICA QUE O ITEM É IMPORTADO DE ${countryStr.toUpperCase()}!` : ""}

--- DETALHES TÉCNICOS ---
Artista / Banda: ${release.artist}
${isCompilation && trackArtistsList.length > 0 ? `Artistas/Bandas presentes na coletânea: ${trackArtistsList.join(", ")}` : ""}
Título do Álbum: ${release.title}
Formato de Mídia: ${formatString} (Classificado como: ${formatLabel})
Gravadora: ${release.label} (Catalog No: ${release.catno})
Ano de Lançamento Original: ${release.year}
País de Origem / Prensagem: ${countryStr}
Gêneros/Estilos: ${release.genres?.join(", ") || ""} | ${release.styles?.join(", ") || ""}
Músicas (Tracklist): ${JSON.stringify(release.tracklist)}

--- ESTADO DE CONSERVAÇÃO (ESCOLHIDO PELO VALDIR) ---
Mídia (Disco/CD/DVD): ${condition.mediaCondition} ${condition.mediaDetails ? `(${condition.mediaDetails})` : ""}
Capa / Estojo: ${condition.sleeveCondition} ${condition.sleeveDetails ? `(${condition.sleeveDetails})` : ""}
${!isCdDvd ? (condition.hasInsert ? `Encarte: Sim, em estado de conservação ${condition.insertCondition || 'VG+'} ${condition.insertDetails ? `(${condition.insertDetails})` : ""}` : "Encarte: Não possui / Não acompanha encarte.") : ""}
${isMint ? "Este produto é NOVO." : "Este produto é USADO."}

--- LOCALIZAÇÃO DE ESTOQUE ---
${drawerClean ? `Localização física do produto para indicação (Loc): ${drawerClean}` : "Nenhuma localização especificada."}

--- DETALHES DE PREÇO ---
Preço sugerido calculated: R$ ${pricing.basePriceBrl.toFixed(2)}

Gere o anúncio estruturado estritamente em JSON contendo os seguintes campos:

1. **titleShopee**:
   - Título otimizado de vendas com limite de 115 caracteres.
   - **A PRIMEIRA PALAVRA DEVE SER O TIPO DE PRODUTO** em maiúsculas: "${formatLabel}" (ou "LP", "CD", "DVD" conforme o formato).
   - Para artista único: "${formatLabel} [Artista] - [Nome do Álbum] ([Ano]) [Gravadora] [Termos de busca]"
   - **REGRA OBRIGATÓRIA PARA COLETÂNEAS (VÁRIOS ARTISTAS / COMPILATION)**:
     * É PROIBIDO "encher linguiça" com palavras genéricas vazias (como "Vários Artistas", "Coletânea", "Música Rock", "Detonando", etc).
     * EM VEZ DISSO, SELECIONE E INCLUA OS NOMES DAS PRINCIPAIS BANDAS / ARTISTAS PRESENTES NA COLETÂNEA LOGO APÓS O NOME DO ÁLBUM NO TÍTULO!
     * Exemplo real: "${formatLabel} [Nome do Álbum] ([Ano]) [Banda 1] [Banda 2] [Banda 3] [Banda 4]" (exemplo real: "CD Surf Ataque (1998) NOFX No Use For A Name Lagwagon").
     * Inclua quantas bandas famosas da tracklist couberem no limite de 115 caracteres do título para atração máxima em buscas diretas por essas bandas.
   - Se o estado da mídia for Mint ('M') (novo/lacrado), termine o título obrigatoriamente com "NOVO LACRADO" em letras maiúsculas.
   - Se a localização (Loc) estiver especificada, adicione o identificador dela no final do título (ex: "[${drawerClean}]").

2. **titleMl**:
   - Título super otimizado e curto com **LIMITE MÁXIMO E ABSOLUTO DE 60 CARACTERES**.
   - **A PRIMEIRA PALAVRA DEVE SER O TIPO DE PRODUTO** em maiúsculas: "${formatLabel}".
   - NÃO use pontuações desnecessárias, asteriscos, aspas ou excesso de parênteses.
   - Para artista único: "${formatLabel} [Artista] [Nome do Álbum] ([Ano])".
   - **PARA COLETÂNEAS**: Não coloque "Vários Artistas" nem palavras genéricas de "encher linguiça". Coloque o tipo do produto, o nome do álbum e 2 ou 3 bandas principais da coletânea que couberem no limite estrito de 60 caracteres. Exemplo: "${formatLabel} Surf Ataque NOFX Lagwagon".
   - Deve ser curto, atrativo e caber perfeitamente no limite de 60 caracteres do Mercado Livre.

3. **description**:
   - Uma descrição unificada, super sucinta, objetiva, informativa e direta, focando APENAS em dados concretos, especificações técnicas e reais do item anunciado.
   - **PROIBIDO GERAR TEXTOS HISTÓRICOS, RESENHAS, OPINIÕES, NARRATIVAS, DESCRITIVOS ARTÍSTICOS OU QUALQUER HISTÓRIA SOBRE O ÁLBUM OU ARTISTA.** Não inclua parágrafos descritivos sobre o lançamento ou história da banda.
   - **ATENÇÃO EXTREMA**: Está **ABSOLUTAMENTE PROIBIDO de mencionar "Shopee", "Mercado Livre", "MercadoLivre", "ML" ou similares**. A descrição deve ser 100% neutra em relação a plataformas.
   - **ATENÇÃO MÁXIMA COM A ACENTUAÇÃO**: Você DEVE usar acentuação completa e gramaticalmente correta em português brasileiro (ex: 'coleção', 'reprodução', 'mídia', 'não', 'canção', 'está', 'conservação', 'padrão'). Nunca envie textos sem acentos ou em formato ASCII puro.
   - **PROIBIDO USAR QUALQUER FORMATAÇÃO MARKDOWN (como asteriscos duplos para negrito ou asterisco simples para listas)**. Em vez de usar negrito Markdown, use LETRAS MAIÚSCULAS para os títulos das seções (exemplo: "FICHA TECNICA:" ou "FAIXAS DO ALBUM:").
   - **OBRIGATÓRIO SEPARAR CADA ITEM, LINHA OU SEÇÃO COM DUAS QUEBRAS DE LINHA (QUEBRA DE LINHA DUPLA)**.
   - Utilize emojis sutis de música e de tópicos para criar uma apresentação limpa, arejada e bem espaçada.
   - **A PRIMEIRÍSSIMA COISA NO TEXTO DE DESCRIÇÃO DEVE SER O ESTADO DE CONSERVAÇÃO DA CAPA, DO DISCO E DO ENCARTE** (ou a localização se especificada). Comece imediatamente com isso, sem saudações ou apresentações prévias de abertura.
   - Se a localização foi especificada, comece com: "LOC: ${drawerClean}" seguido de quebra de linha dupla.
   - Avalie detalhadamente e com transparência as condições físicas da mídia (${condition.mediaCondition}) e da capa (${condition.sleeveCondition}). Integre todas as observações do Valdir.
   - Se for Mint ('M'), enfatize de forma curta que o produto é NOVO e LACRADO de fábrica.
   - Inclua em destaque a frase exata "fotos originais do produto" (sem aspas), separada por quebra de linha dupla.
   - Apresente a loja Valdir Discos de forma extremamente simples e amigável, apenas dando boas-vindas curtas.
   - **FICHA TÉCNICA DETALHADA**: Coloque cada item em uma nova linha separada por quebra de linha dupla:
     • Artista: ...
     • Álbum: ...
     • Gravadora: ...
     • Ano: ...
     • País de Origem / Prensagem: ${countryStr}  <-- É ABSOLUTAMENTE OBRIGATÓRIO INCLUIR ESTA LINHA COM O PAÍS DE ORIGEM NA FICHA TÉCNICA!
     • Catálogo: ...
     • Formato: ...
   - Tracklist / Lista de músicas completa. Coloque cada faixa em uma nova linha separada por quebra de linha dupla. Para coletâneas (Various Artists), mostre o nome do artista de cada música.
   - Descreva de forma compacta e objetiva o Diferencial de Envio Premium Valdir Discos (higienização profissional, plásticos novos, embalagem reforçada).

4. **hashtags**:
   - Uma lista de 8 a 12 hashtags relevantes em português neutras.

5. **suggestedPrice**:
   - O preço sugerido (número).`;

      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              titleShopee: { type: Type.STRING },
              titleMl: { type: Type.STRING },
              description: { type: Type.STRING },
              suggestedPrice: { type: Type.NUMBER },
              hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["titleShopee", "titleMl", "description", "suggestedPrice", "hashtags"]
          }
        }
      });

      const cleanJson = response.text.trim();
      const rawListing = JSON.parse(cleanJson);

      // Post-process Shopee title
      let titleShopee = rawListing.titleShopee || "";
      titleShopee = titleShopee.replace(/^(Lp|LP|Cd|CD|Dvd|DVD|Vinyl|Vinil|Disco de Vinil)\s*[:-]?\s*/i, "").trim();

      const isCompTitle = isCompilation || /^(various\s+artists|vários\s+artistas|varios\s+artistas|various|vários|varios)\s*[-–—:]/i.test(titleShopee);

      if (isCompTitle) {
        titleShopee = titleShopee.replace(/^(various\s+artists|vários\s+artistas|varios\s+artistas|various|vários|varios)\s*[-–—:]\s*/i, "").trim();
        titleShopee = titleShopee.replace(/^(various\s+artists|vários\s+artistas|varios\s+artistas|various|vários|varios)\s+/i, "").trim();
      }

      const drawerSuffix = drawerClean ? ` [${drawerClean}]` : "";
      const maxShopeeLen = 115;
      const prefix = `${formatLabel} `;

      let shopeeConditionSuffix = "";
      if (isOnlySleeve) {
        shopeeConditionSuffix = " APENAS CAPA (SEM DISCO)";
      } else if (isOnlyMedia) {
        shopeeConditionSuffix = " APENAS DISCO (SEM CAPA)";
      } else if (isMint) {
        shopeeConditionSuffix = " NOVO LACRADO";
      }

      if (isImported && importTag) {
        shopeeConditionSuffix += ` ${importTag}`;
      }

      // Clean existing condition/import/drawer phrases from body of titleShopee to prevent duplication
      titleShopee = titleShopee
        .replace(/\b(apenas|somente)\s*(capa|disco)(\s*\(sem\s*(disco|capa)\))?\b/gi, "")
        .replace(/\b(sem)\s*(disco|capa)\b/gi, "")
        .replace(/\b(novo lacrado|novo\/lacrado)\b/gi, "")
        .replace(/\bimportado(\s+[a-zà-ú]+)?\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      if (drawerClean) {
        const escDrawer = drawerClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const drawerRegex = new RegExp(`\\[\\s*${escDrawer}\\s*\\]|\\b${escDrawer}\\b`, 'gi');
        titleShopee = titleShopee.replace(drawerRegex, "").replace(/\s+/g, " ").trim();
      }

      const fullShopeeSuffix = shopeeConditionSuffix + drawerSuffix;
      const availableLenForShopeeTitle = maxShopeeLen - prefix.length - fullShopeeSuffix.length;
      if (titleShopee.length > availableLenForShopeeTitle) {
        titleShopee = titleShopee.substring(0, Math.max(10, availableLenForShopeeTitle - 3)).trim() + "...";
      }
      titleShopee = `${prefix}${titleShopee}${fullShopeeSuffix}`;

      // Post-process Mercado Livre title
      let titleMl = rawListing.titleMl || "";
      titleMl = titleMl.replace(/[\*\_`#\[\]]/g, "").trim();
      titleMl = titleMl.replace(/^(Lp|LP|Cd|CD|Dvd|DVD|Vinyl|Vinil|Disco de Vinil)\s*[:-]?\s*/i, "").trim();

      if (isCompilation) {
        titleMl = titleMl.replace(/^(various\s+artists|vários\s+artistas|varios\s+artistas|various|vários|varios)\s*[-–—:]\s*/i, "").trim();
        titleMl = titleMl.replace(/^(various\s+artists|vários\s+artistas|varios\s+artistas|various|vários|varios)\s+/i, "").trim();
      }

      let mlConditionSuffix = "";
      if (isOnlySleeve) {
        mlConditionSuffix = " APENAS CAPA (SEM DISCO)";
      } else if (isOnlyMedia) {
        mlConditionSuffix = " APENAS DISCO (SEM CAPA)";
      } else if (isImported && importTag) {
        mlConditionSuffix = ` ${importTag}`;
      }

      titleMl = titleMl
        .replace(/\b(apenas|somente)\s*(capa|disco)(\s*\(sem\s*(disco|capa)\))?\b/gi, "")
        .replace(/\b(sem)\s*(disco|capa)\b/gi, "")
        .replace(/\bimportado(\s+[a-zà-ú]+)?\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      const maxMlLen = 60;
      const availableLenForMlTitle = maxMlLen - prefix.length - mlConditionSuffix.length;
      if (titleMl.length > availableLenForMlTitle) {
        titleMl = titleMl.substring(0, Math.max(10, availableLenForMlTitle - 3)).trim() + "...";
      }
      let fullTitleMl = `${prefix}${titleMl}${mlConditionSuffix}`.trim();

      // Handle Description - clean platform mentions & ensure key phrases
      let description = rawListing.description || "";
      
      // Guarantee high-visibility warnings for incomplete or imported items at the VERY top of description
      if (isOnlySleeve && !description.toLowerCase().includes("apenas à capa") && !description.toLowerCase().includes("sem disco")) {
        description = `🚨 **ATENÇÃO COMPRADOR: ITEM INCOMPLETO - ANÚNCIO REFERENTE APENAS À CAPA E ENCARTE ORIGINAL (NÃO POSSUI / NÃO ACOMPANHA O DISCO / MÍDIA FÍSICA).**\n\n${description}`;
      } else if (isOnlyMedia && !description.toLowerCase().includes("apenas ao disco") && !description.toLowerCase().includes("sem capa")) {
        description = `🚨 **ATENÇÃO COMPRADOR: ITEM INCOMPLETO - ANÚNCIO REFERENTE APENAS AO DISCO / MÍDIA. NÃO POSSUI A CAPA ORIGINAL DE PAPELÃO / ENCARTE (SERÁ ENVIADO EM CAPA DE PROTEÇÃO GENÉRICA).**\n\n${description}`;
      } else if (isImported && !description.toLowerCase().includes("importado")) {
        description = `✈️ **ITEM IMPORTADO (ORIGEM/PRENSAGEM: ${countryStr.toUpperCase()}) - EDIÇÃO ORIGINAL IMPORTADA DE COLECIONADOR.**\n\n${description}`;
      }

      // Guarantee "fotos originais do produto" is present
      if (!description.toLowerCase().includes("fotos originais do produto")) {
        description = `📷 **Observação importante:** fotos originais do produto\n\n${description}`;
      }

      // Guarantee drawer localization is at the start
      if (drawerClean) {
        const escDrawer = drawerClean.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const drawerHeaderRegex = new RegExp(`^📍\\s*\\*\\*(Localização física\\s*/\\s*Gaveta|Loc):\\*\\*\\s*${escDrawer}\\n*`, 'i');
        description = description.replace(drawerHeaderRegex, "").trim();
        description = `📍 **Loc:** ${drawerClean}\n\n${description}`;
      }

      // Sanitization function for personal data & safety against any accidental platform name leaks
      const sanitizePersonalAndPlatforms = (text: string): string => {
        if (!text) return "";
        let cleaned = text;

        // Remove specific platform names from description to keep it 100% neutral as requested!
        cleaned = cleaned.replace(/\b(?:na|no|pela|pelo|da|do)?\s*(?:shopee|mercado\s*livres?|mercadolivre|mercado-livre)\b/gi, "");

        // Remove emails
        cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, "");
        
        // Remove links
        cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, "");
        cleaned = cleaned.replace(/www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s]*/gi, "");

        // Remove contact info / phone numbers
        cleaned = cleaned.replace(/\b(whatsapp|whats|zap|instagram|insta|face|facebook|contato|telefone|celular|fone|e-mail|email)\b\s*[:\-–—]?\s*(?:\+?55\s*)?(?:\(?\d{2}\)?)?\s*9?\d{4}[-\s]?\d{4}/gi, "");
        cleaned = cleaned.replace(/\b(whatsapp|whats|zap|instagram|insta|face|facebook|contato|telefone|celular|fone|e-mail|email)\s*[:\-–—]?\s*[^\s\n]+/gi, "");
        cleaned = cleaned.replace(/(?:\+?55\s*)?\(?\d{2}\)?\s*9\d{4}[-\s]?\d{4}/g, "");
        
        // Clean multiple consecutive horizontal spaces to a single space
        cleaned = cleaned.replace(/[ \t]+/g, " ");
        // Normalize line breaks
        cleaned = cleaned.replace(/\r\n/g, "\n");
        // Limit consecutive empty lines to at most 2 newlines (double newline) to keep layout clean and readable
        cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
        
        return cleaned.trim();
      };

      const finalDescription = sanitizePersonalAndPlatforms(description);

      return {
        shopee: {
          title: sanitizePersonalAndPlatforms(titleShopee),
          description: finalDescription,
          suggestedPrice: rawListing.suggestedPrice || pricing.basePriceBrl,
          hashtags: rawListing.hashtags?.map((h: string) => sanitizePersonalAndPlatforms(h)).filter(Boolean) || []
        },
        mercadolivre: {
          title: sanitizePersonalAndPlatforms(fullTitleMl),
          description: finalDescription,
          suggestedPrice: rawListing.suggestedPrice || pricing.basePriceBrl
        }
      };
    } catch (geminiErr) {
      console.warn("Gemini generation failed, falling back to programmatic template:", geminiErr);
      return generateProgrammaticListing(release, condition, pricing, drawer, isGarimpo, garimpoDetails);
    }
  }

  // Generate both Shopee and Mercado Livre in a single highly optimized call
  app.post("/api/generate-all", async (req, res) => {
    const { release, condition, pricing, drawer, isGarimpo, garimpoDetails } = req.body;
    if (!release) {
      return res.status(400).json({ error: "Faltam dados do disco para gerar o anúncio." });
    }

    try {
      const results = await generateAllListings(release, condition, pricing, drawer, isGarimpo, garimpoDetails);
      return res.json({ success: true, ...results });
    } catch (error: any) {
      console.error("Unified Generation error:", error);
      return res.status(500).json({ error: error.message || "Erro ao processar a geração unificada dos anúncios." });
    }
  });

  // Backward compatible route for Shopee generation
  app.post("/api/generate-shopee", async (req, res) => {
    const { release, condition, pricing, drawer } = req.body;
    if (!release) {
      return res.status(400).json({ error: "Faltam dados do disco para gerar o anúncio." });
    }

    try {
      const results = await generateAllListings(release, condition, pricing, drawer);
      return res.json({ success: true, listing: results.shopee });
    } catch (error: any) {
      console.error("Shopee Generation error:", error);
      return res.status(500).json({ error: error.message || "Erro ao processar a geração de anúncio Shopee." });
    }
  });

  // Backward compatible route for Mercado Livre generation
  app.post("/api/generate-mercadolivre", async (req, res) => {
    const { release, condition, pricing, drawer } = req.body;
    if (!release) {
      return res.status(400).json({ error: "Faltam dados do disco para gerar o anúncio." });
    }

    try {
      const results = await generateAllListings(release, condition, pricing, drawer);
      return res.json({ success: true, listing: results.mercadolivre });
    } catch (error: any) {
      console.error("Mercado Livre Generation error:", error);
      return res.status(500).json({ error: error.message || "Erro ao processar a geração de anúncio Mercado Livre." });
    }
  });

  // Parse Sale Printscreen (screenshot/receipt) using Gemini for Shopee, Mercado Livre, WhatsApp, Pix etc.
  app.post("/api/parse-shopee-print", async (req, res) => {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Nenhuma imagem em formato base64 foi enviada." });
    }

    try {
      const ai = getGeminiClient();
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      
      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/png",
          data: cleanBase64
        }
      };

      const promptText = {
        text: `Você é um leitor de tela especialista em interpretar prints (screenshots) de vendas de e-commerce (Shopee, Mercado Livre, OLX, Enjoei, etc.) ou comprovantes de transferência/pagamento (Pix, recibos do WhatsApp, etc.).
Analise a imagem anexada e extraia com precisão máxima as seguintes informações:
1. Plataforma ou Canal de Venda (detecte se é "shopee", "mercadolivre", "direct" para WhatsApp/Pix/Instagram/Venda Direta, ou "other" para físico/outros).
2. Nome do Comprador / Pagador (pode ser o apelido de usuário ou o nome real completo, ex: "Daniel de SP", "mariasilva", "José da Silva").
3. Cidade de Entrega / Origem (se disponível, ex: "São Paulo", "Ribeirão Preto").
4. Estado / UF (se disponível, ex: "SP", "RJ", "MG").
5. Preço de venda ou valor total do item em Reais (ex: 120.00). Se for um comprovante de Pix, use o valor do Pix.
6. Taxas / Comissão pagas ao canal de venda em Reais (comissão + taxa fixa da plataforma, ex: 18.50. Para Pix ou venda direta por WhatsApp, geralmente é 0).
7. Lucro líquido ou valor a receber do vendedor em Reais (ex: 101.50).
8. Título do disco, LP ou álbum vendido (se estiver visível no print da venda, recibo ou chat, ex: "Tim Maia", "Cheia de Manias", "Cantar").
9. Nome do artista do disco ou LP vendido (se estiver visível, ex: "Tim Maia", "Raça Negra", "Gal Costa").

Se algum campo não estiver visível na imagem, retorne null ou 0 para números.
Retorne os dados estritamente em formato JSON estruturado conforme o schema.`
      };

      const response = await generateContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, promptText] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING, description: "Canal detectado. Valores aceitos: 'shopee', 'mercadolivre', 'direct', 'other'" },
              customerName: { type: Type.STRING, description: "Nome exato ou apelido do cliente/pagador" },
              customerCity: { type: Type.STRING, description: "Cidade de entrega ou residência" },
              customerState: { type: Type.STRING, description: "Sigla do Estado/UF com 2 letras, ex: SP" },
              salePrice: { type: Type.NUMBER, description: "Valor de venda do produto ou total do Pix em reais" },
              feesPaid: { type: Type.NUMBER, description: "Taxa e comissão retida pela plataforma em reais" },
              netProfit: { type: Type.NUMBER, description: "Lucro líquido ou ganho do vendedor em reais" },
              albumTitle: { type: Type.STRING, description: "Título do álbum ou LP extraído do print" },
              albumArtist: { type: Type.STRING, description: "Nome do artista extraído do print" }
            },
            required: ["customerName", "platform"]
          }
        }
      });

      const cleanJson = response.text.trim();
      const parsedData = JSON.parse(cleanJson);
      
      return res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("Error parsing sale printscreen:", error);
      return res.status(500).json({ error: error.message || "Erro ao interpretar a imagem do print." });
    }
  });

  // Vite development middleware setup or production static file server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
