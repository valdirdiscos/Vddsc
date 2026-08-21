/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Disc, FileText, FolderOpen, Info } from 'lucide-react';
import { 
  GOLDMINE_VINYL_MEDIA, 
  GOLDMINE_VINYL_SLEEVE, 
  GOLDMINE_CD_MEDIA, 
  GOLDMINE_CD_SLEEVE,
  ConditionOption
} from '../constants';
import { ConditionSelection } from '../types';

interface SleeveMediaConditionSelectorProps {
  condition: ConditionSelection;
  onChange: (updated: ConditionSelection) => void;
  formatName?: string;
}

export const SleeveMediaConditionSelector: React.FC<SleeveMediaConditionSelectorProps> = ({
  condition,
  onChange,
  formatName,
}) => {
  const isCdDvd = formatName
    ? (formatName.toLowerCase().includes('cd') || formatName.toLowerCase().includes('dvd'))
    : false;

  const mediaConditions = isCdDvd ? GOLDMINE_CD_MEDIA : GOLDMINE_VINYL_MEDIA;
  const sleeveConditions = isCdDvd ? GOLDMINE_CD_SLEEVE : GOLDMINE_VINYL_SLEEVE;

  // Sync / update defaults if the selected condition is empty or invalid for the active list
  useEffect(() => {
    let updated = false;
    const newCond = { ...condition };

    if (!mediaConditions.some(c => c.code === condition.mediaCondition)) {
      newCond.mediaCondition = 'VG+';
      const condObj = mediaConditions.find(c => c.code === 'VG+');
      newCond.mediaDetails = condObj ? condObj.description.split('.')[0] : '';
      updated = true;
    }

    if (!sleeveConditions.some(c => c.code === condition.sleeveCondition)) {
      newCond.sleeveCondition = 'VG+';
      const condObj = sleeveConditions.find(c => c.code === 'VG+');
      newCond.sleeveDetails = condObj ? condObj.description.split('.')[0] : '';
      updated = true;
    }

    if (updated) {
      onChange(newCond);
    }
  }, [isCdDvd]);

  const handleMediaCondChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const condObj = mediaConditions.find(c => c.code === code);
    onChange({
      ...condition,
      mediaCondition: code,
      // Provide an automatic default detail if empty
      mediaDetails: condObj ? condObj.description : ''
    });
  };

  const handleSleeveCondChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const condObj = sleeveConditions.find(c => c.code === code);
    onChange({
      ...condition,
      sleeveCondition: code,
      // Provide an automatic default detail if empty
      sleeveDetails: condObj ? condObj.description : ''
    });
  };

  const selectedMediaObj = mediaConditions.find(c => c.code === condition.mediaCondition) || mediaConditions.find(c => c.code === 'VG+');
  const selectedSleeveObj = sleeveConditions.find(c => c.code === condition.sleeveCondition) || sleeveConditions.find(c => c.code === 'VG+');

  return (
    <div className="space-y-6" id="condition-selector-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          Estado de Conservação ({isCdDvd ? 'CD/DVD' : 'Vinil/LP'})
        </h3>
      </div>

      {/* Media Condition (LP/CD/DVD) */}
      <div className="space-y-3" id="media-condition-box">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Disc className="h-4 w-4 text-indigo-600 animate-spin" style={{ animationDuration: '8s' }} />
            Estado da Mídia ({isCdDvd ? 'Mídia Óptica CD/DVD' : 'Sulco do Vinil/LP'})
          </label>
          {selectedMediaObj && (
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${selectedMediaObj.vibe}`}>
              {selectedMediaObj.code}
            </span>
          )}
        </div>

        <select
          id="media-condition-select"
          value={condition.mediaCondition}
          onChange={handleMediaCondChange}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {mediaConditions.map((cond) => (
            <option key={`media-${cond.code}`} value={cond.code} className="text-slate-700">
              {cond.name}
            </option>
          ))}
        </select>

        {selectedMediaObj && (
          <p className={`text-xs p-2.5 rounded-xl border leading-relaxed ${
            condition.mediaCondition === 'SEM_DISCO' 
              ? 'bg-purple-50 text-purple-800 border-purple-200 font-medium' 
              : 'text-slate-500 bg-slate-50 border-slate-200/80'
          }`}>
            <span className="font-bold text-slate-700">Critério de Avaliação: </span>
            {selectedMediaObj.description}
          </p>
        )}

        {condition.mediaCondition === 'SEM_DISCO' && (
          <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-xl p-3 text-xs flex items-start gap-2.5">
            <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Item Configurado como "Apenas Capa (Sem Disco)"</p>
              <p className="text-purple-700 mt-0.5">O gerador de anúncios incluirá avisos em destaque no título e na descrição para alertar os compradores que o disco/mídia não acompanha a compra.</p>
            </div>
          </div>
        )}

        <textarea
          id="media-details-input"
          value={condition.mediaDetails}
          onChange={(e) => onChange({ ...condition, mediaDetails: e.target.value })}
          placeholder={isCdDvd 
            ? "Ex: Sem riscos de leitura, mídia brilhante impecável. Toca perfeitamente." 
            : "Ex: Toca perfeitamente, sem chiados ou pulos. Pouquíssimos risquinhos superficiais."}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-400"
          rows={2}
        />
      </div>

      {/* Sleeve / Cover Condition */}
      <div className="space-y-3" id="sleeve-condition-box">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-indigo-600" />
            Estado {isCdDvd ? 'do Encarte e Estojo' : 'da Capa / Encarte'}
          </label>
          {selectedSleeveObj && (
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${selectedSleeveObj.vibe}`}>
              {selectedSleeveObj.code}
            </span>
          )}
        </div>

        <select
          id="sleeve-condition-select"
          value={condition.sleeveCondition}
          onChange={handleSleeveCondChange}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {sleeveConditions.map((cond) => (
            <option key={`sleeve-${cond.code}`} value={cond.code} className="text-slate-700">
              {cond.name}
            </option>
          ))}
        </select>

        {selectedSleeveObj && (
          <p className={`text-xs p-2.5 rounded-xl border leading-relaxed ${
            condition.sleeveCondition === 'SEM_CAPA' 
              ? 'bg-purple-50 text-purple-800 border-purple-200 font-medium' 
              : 'text-slate-500 bg-slate-50 border-slate-200/80'
          }`}>
            <span className="font-bold text-slate-700">Critério de Avaliação: </span>
            {selectedSleeveObj.description}
          </p>
        )}

        {condition.sleeveCondition === 'SEM_CAPA' && (
          <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-xl p-3 text-xs flex items-start gap-2.5">
            <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Item Configurado como "Apenas Disco (Sem Capa Original)"</p>
              <p className="text-purple-700 mt-0.5">O gerador de anúncios incluirá avisos no título e na descrição informando que o produto vai em envelope/capa de proteção genérica.</p>
            </div>
          </div>
        )}

        <textarea
          id="sleeve-details-input"
          value={condition.sleeveDetails}
          onChange={(e) => onChange({ ...condition, sleeveDetails: e.target.value })}
          placeholder={isCdDvd 
            ? "Ex: Encarte completo e em ótimo estado. Caixinha de acrílico original sem trincos." 
            : "Ex: Capa muito conservada, sem rasgos ou escritas. Leve desgaste natural nas pontas."}
          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-400"
          rows={2}
        />
      </div>

      {/* Insert (Encarte) Condition - ONLY for Vinyl */}
      {!isCdDvd && (
        <div className="space-y-4 pt-4 border-t border-slate-100" id="insert-condition-box">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Possui Encarte?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChange({
                  ...condition,
                  hasInsert: true,
                  insertCondition: condition.insertCondition || 'VG+',
                  insertDetails: condition.insertDetails || 'Encarte em muito bom estado, com poucos sinais de manuseio.'
                })}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  condition.hasInsert
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => onChange({
                  ...condition,
                  hasInsert: false
                })}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  !condition.hasInsert
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Não
              </button>
            </div>
          </div>

          {condition.hasInsert && (
            <div className="space-y-3 pl-3 border-l-2 border-indigo-100">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Estado do Encarte
                </label>
                {condition.insertCondition && (
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                    (GOLDMINE_VINYL_SLEEVE.find(c => c.code === condition.insertCondition) || GOLDMINE_VINYL_SLEEVE.find(c => c.code === 'VG+'))?.vibe
                  }`}>
                    {condition.insertCondition || 'VG+'}
                  </span>
                )}
              </div>

              <select
                id="insert-condition-select"
                value={condition.insertCondition || 'VG+'}
                onChange={(e) => {
                  const code = e.target.value;
                  const condObj = GOLDMINE_VINYL_SLEEVE.find(c => c.code === code);
                  onChange({
                    ...condition,
                    insertCondition: code,
                    insertDetails: condObj ? condObj.description.replace(/Capa/gi, 'Encarte') : ''
                  });
                }}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {GOLDMINE_VINYL_SLEEVE.map((cond) => (
                  <option key={`insert-${cond.code}`} value={cond.code} className="text-slate-700">
                    {cond.name.replace('Capa', 'Encarte')}
                  </option>
                ))}
              </select>

              {condition.insertCondition && (
                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed">
                  <span className="font-bold text-slate-700">Critério do Encarte: </span>
                  {(GOLDMINE_VINYL_SLEEVE.find(c => c.code === condition.insertCondition) || GOLDMINE_VINYL_SLEEVE.find(c => c.code === 'VG+'))?.description.replace(/Capa/gi, 'Encarte')}
                </p>
              )}

              <textarea
                id="insert-details-input"
                value={condition.insertDetails || ''}
                onChange={(e) => onChange({ ...condition, insertDetails: e.target.value })}
                placeholder="Ex: Encarte em excelente estado, sem rasgos, com letras e créditos."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder-slate-400"
                rows={2}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
