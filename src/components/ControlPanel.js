"use client";

import { useRef } from "react";

const DIRECTIONS = [
  { id: "diagonal-down", label: "Diagonal ↘", icon: "⟋" },
  { id: "diagonal-up", label: "Diagonal ↗", icon: "⟍" },
  { id: "horizontal", label: "Horizontal", icon: "—" },
  { id: "vertical", label: "Vertical", icon: "|" },
];

// ── Reusable slider label row ──────────────────────────────────────────────
function SliderRow({ label, value, unit = "%" }) {
  return (
    <div className="flex items-center justify-between cursor-default select-none">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </span>
      <span className="text-[11px] font-mono text-zinc-300">
        {value}{unit}
      </span>
    </div>
  );
}

export default function ControlPanel({
  options,
  setOptions,
  watermarkLogo,
  setWatermarkLogo,
  onProcessBatch,
  isProcessing,
  totalImages,
  onReset,
  // Nombre ZIP inteligente
  zipName,
  setZipName,
  isFolderMode,
}) {
  const logoInputRef = useRef(null);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona un archivo de imagen válido.");
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => setWatermarkLogo({ element: img, file, objectUrl });
    img.onerror = () => {
      alert("Error al cargar el logo.");
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  const removeLogo = () => {
    if (watermarkLogo?.objectUrl) URL.revokeObjectURL(watermarkLogo.objectUrl);
    setWatermarkLogo(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const set = (key, value) => setOptions((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="w-full flex flex-col rounded-2xl overflow-hidden bg-zinc-950 divide-y divide-zinc-900 cursor-default">

      {/* ── Logo / Marca de Agua ─────────────────────────────────────────── */}
      <section className="p-5 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 select-none">
          Logo / Marca de Agua
        </p>

        <input
          type="file"
          ref={logoInputRef}
          onChange={handleLogoChange}
          accept="image/*"
          className="hidden"
        />

        {!watermarkLogo ? (
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="cursor-pointer w-full py-4 rounded-xl border border-dashed border-zinc-800 text-zinc-500
                       hover:text-zinc-200 hover:border-zinc-600 text-xs font-medium
                       transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Subir imagen
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800/60 p-3">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={watermarkLogo.objectUrl}
                alt=""
                className="w-9 h-9 object-contain rounded-lg bg-zinc-800 border border-zinc-700/60 shrink-0"
              />
              <div className="overflow-hidden cursor-default select-none">
                <p className="text-xs font-medium text-zinc-300 truncate">{watermarkLogo.file.name}</p>
                <p className="text-[10px] text-zinc-600">{(watermarkLogo.file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeLogo}
              title="Quitar logo"
              className="cursor-pointer text-zinc-600 hover:text-zinc-200 transition-colors duration-200 p-1.5 rounded-lg hover:bg-zinc-800 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* ── Dirección del patrón ─────────────────────────────────────────── */}
      <section className="p-5 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 select-none">
          Dirección del Patrón
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DIRECTIONS.map(({ id, label }) => {
            const active = options.direction === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => set("direction", id)}
                className={`cursor-pointer py-2.5 rounded-xl text-xs font-medium transition-colors duration-200 border ${active
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800/60 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Opacidad ─────────────────────────────────────────────────────── */}
      <section className="p-5 space-y-2.5">
        <SliderRow label="Opacidad" value={Math.round(options.opacity * 100)} />
        <input
          type="range" min="5" max="100"
          value={Math.round(options.opacity * 100)}
          onChange={(e) => set("opacity", parseInt(e.target.value) / 100)}
          className="cursor-pointer w-full accent-white"
        />
      </section>

      {/* ── Escala ───────────────────────────────────────────────────────── */}
      <section className="p-5 space-y-2.5">
        <SliderRow label="Escala" value={Math.round(options.scale * 100)} />
        <input
          type="range" min="5" max="50"
          value={Math.round(options.scale * 100)}
          onChange={(e) => set("scale", parseInt(e.target.value) / 100)}
          className="cursor-pointer w-full accent-white"
        />
      </section>

      {/* ── Nombre del ZIP ───────────────────────────────────────────────── */}
      {!isFolderMode && (
        <section className="p-5 space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 select-none">
            Nombre del archivo ZIP
          </p>
          <input
            type="text"
            value={zipName}
            onChange={(e) => setZipName(e.target.value)}
            placeholder="imagenes_con_marca_de_agua"
            className="cursor-text w-full bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-2 text-xs placeholder-zinc-600 outline-none transition-colors duration-200"
          />
        </section>
      )}

      {/* ── Formato de salida ────────────────────────────────────────────── */}
      <section className="p-5 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 select-none">
          Salida JPEG
        </p>

        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 select-none">Forzar conversión a .jpg</span>
          <button
            type="button"
            onClick={() => set("convertToJpeg", !options.convertToJpeg)}
            className={`cursor-pointer relative h-5.5 w-11 rounded-full border transition-colors duration-200 ${options.convertToJpeg ? "bg-white border-white" : "bg-zinc-800 border-zinc-700"
              }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform duration-200 ${options.convertToJpeg ? "translate-x-0.5 bg-zinc-900" : "-translate-x-4.5 bg-zinc-400"
                }`}
            />
          </button>
        </div>

        {options.convertToJpeg && (
          <div className="space-y-2.5">
            <SliderRow label="Calidad JPEG" value={Math.round(options.quality * 100)} />
            <input
              type="range" min="10" max="100"
              value={Math.round(options.quality * 100)}
              onChange={(e) => set("quality", parseInt(e.target.value) / 100)}
              className="cursor-pointer w-full accent-white"
            />
          </div>
        )}
      </section>

      {/* ── Acción ───────────────────────────────────────────────────────── */}
      <section className="p-5 space-y-2">
        <button
          type="button"
          disabled={isProcessing || totalImages === 0}
          onClick={onProcessBatch}
          className={`cursor-pointer w-full py-3 rounded-xl text-sm font-semibold transition-colors duration-200 flex items-center justify-center gap-2 ${totalImages === 0
            ? "cursor-default bg-zinc-900 text-zinc-600 border border-zinc-800/60"
            : isProcessing
              ? "cursor-default bg-zinc-900 text-zinc-500 border border-zinc-800/60"
              : "bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all"
            }`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
              <span>Procesando…</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Procesar y Descargar ZIP</span>
            </>
          )}
        </button>

        {totalImages > 0 && !isProcessing && (
          <button
            type="button"
            onClick={onReset}
            className="cursor-pointer w-full py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-300 transition-colors duration-200"
          >
            Limpiar todo
          </button>
        )}
      </section>
    </div>
  );
}
