// src/components/Sections.tsx — secciones inferiores de la página.
// Porte de renderLearn/renderTape/renderCatalog/renderPhotos/renderSources
// del original. Exporta cada sección por separado y el componente Sections
// que las apila todas (App las apila en este orden).
import React from 'react';
import type { ReactNode } from 'react';
import { LEARN_NEW, LEARN, FIXES, TAPE, GROUPS, PHOTOS, SOURCES, INFO, NOCODE, SHORT } from '../data/content';
import type { LearnItem } from '../data/content';
import { DDP } from '../state/cycle';
import { tr, L, useLang } from '../i18n';

const VL: Record<string, string> = { ok: "vOk", partial: "vPartial", fix: "vFix", q: "vQ" };

export function Learn(): ReactNode {
  const { lang } = useLang();
  const item = (it: LearnItem, key: string): ReactNode => (
    <div className="litem" key={key}>
      <div className="lhead"><span className={"verdict " + it.v}>{tr(VL[it.v])}</span></div>
      <p className="said">{"\u201C" + L(it.s) + "\u201D"}</p>
      {it.a ? <p>{L(it.a)}</p> : null}
    </div>
  );
  return (
    <section className="block" aria-labelledby="learnT">
      <h2 id="learnT">{tr('learnT')}</h2>
      <p className="small" style={{ maxWidth: "76ch" }}>{tr('learnNote')}</p>
      <div className="learn" id="learn">
        <h3 className="lgroup">{tr('learnNewT')}</h3>
        {LEARN_NEW.map((it, i) => item(it, "n" + i))}
        <h3 className="lgroup">{tr('learnOldT')}</h3>
        {LEARN.map((it, i) => item(it, "o" + i))}
        <div className="litem">
          <h3>{tr('fixT')}</h3>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {FIXES[lang].map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Tape(): ReactNode {
  const { lang } = useLang();
  return (
    <section className="block" aria-labelledby="tapeT">
      <h2 id="tapeT">{tr('tapeT')}</h2>
      <div className="tapewrap">
        <div className="tape" id="tape" aria-label={tr('tapeAria')}>{TAPE.lines}</div>
        <div className="tapenotes">
          <p>{tr('tapeIntro')}</p>
          <ul id="tapenotes">
            {TAPE.notes[lang].map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export interface CatalogProps {
  doors: number;
  onSelect?: (id: string) => void;
  onDoors?: (n: number) => void;
}

export function Catalog({ doors, onSelect, onDoors }: CatalogProps): ReactNode {
  useLang();
  return (
    <section className="block" aria-labelledby="catT">
      <h2 id="catT">{tr('catT')}</h2>
      <p className="small" style={{ maxWidth: "76ch" }}>{tr('catNote')}</p>
      <div className="cat" id="cat">
        {GROUPS.map(([name, ids], gi) => (
          <div className="cgroup" key={gi}>
            <h3>{L(name)}</h3>
            {ids.map(id => (
              <button key={id} className="crow" type="button" onClick={() => {
                if (DDP.has(id) && doors === 1 && onDoors) onDoors(2);
                if (onSelect) onSelect(id);
              }}>
                <b>{(NOCODE.has(id) ? "\u2014" : (id === "RTD1" ? "RTD1/4" : id)) + (DDP.has(id) ? "\u00B2" : "")}</b>
                <span>{L(INFO[id]).n}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function Photos(): ReactNode {
  const { lang } = useLang();
  return (
    <section className="block photos" aria-labelledby="phT">
      <h2 id="phT">{tr('photosT')}</h2>
      <ul id="photos">
        {PHOTOS[lang].map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </section>
  );
}

export function Sources(): ReactNode {
  useLang();
  return (
    <section className="block sources" aria-labelledby="srcT">
      <h2 id="srcT">{tr('sourcesT')}</h2>
      <ul id="sources">
        {SOURCES.map((s, i) => (
          <li key={i}>
            {s.u
              ? <a href={s.u} target="_blank" rel="noopener">{L(s.t)}</a>
              : <b>{L(s.t)}</b>}
            {" \u2014 " + L(s.d)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export interface SectionsProps {
  doors: number;
  onSelect?: (id: string) => void;
  onDoors?: (n: number) => void;
}

export function Sections({ doors, onSelect, onDoors }: SectionsProps): ReactNode {
  return (
    <>
      <Learn />
      <Tape />
      <Catalog doors={doors} onSelect={onSelect} onDoors={onDoors} />
      <Photos />
      <Sources />
    </>
  );
}

export default Sections;
