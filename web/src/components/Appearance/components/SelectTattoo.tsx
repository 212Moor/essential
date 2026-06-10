import { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useNuiState } from '../../../hooks/nuiState';
import { Tattoo, TattoosSettings } from '../interfaces';
import RangeInput from './RangeInput';
import Button from './Button';

// ─── INTERFACES ────────────────────────────────────────────
interface SelectTattooProps {
  items: Tattoo[];
  tattoosApplied: Tattoo[] | null;
  handleApplyTattoo: (value: Tattoo, opacity: number) => void;
  handlePreviewTattoo: (value: Tattoo, opacity: number) => void;
  handleDeleteTattoo: (value: Tattoo) => void;
  settings: TattoosSettings;
}

// ─── ANIMATIONS ────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
`;

const scanline = keyframes`
  0%   { transform: translateY(-100%); opacity: 0.06; }
  100% { transform: translateY(100%);  opacity: 0; }
`;

const glowPulse = keyframes`
  0%,100% { box-shadow: 0 0 12px rgba(14,165,233,0.4), 0 0 24px rgba(14,165,233,0.15); }
  50%     { box-shadow: 0 0 20px rgba(14,165,233,0.7), 0 0 40px rgba(14,165,233,0.3); }
`;

const checkIn = keyframes`
  0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
  70%  { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg);   opacity: 1; }
`;

// ─── ROOT CONTAINER ────────────────────────────────────────
const Root = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
`;

// ─── SEARCH BAR ────────────────────────────────────────────
const SearchWrap = styled.div`
  position: relative;
  margin-bottom: 12px;
  flex-shrink: 0;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #475569;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(51, 65, 85, 0.8);
  border-radius: 10px;
  padding: 9px 12px 9px 34px;
  color: #e2e8f0;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;

  &::placeholder { color: #475569; }
  &:focus {
    border-color: rgba(14, 165, 233, 0.5);
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.08);
  }
`;

// ─── GRID ──────────────────────────────────────────────────
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 2px 2px 8px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #1e3a4a; border-radius: 4px; }
`;

const EmptyState = styled.div`
  grid-column: 1/-1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 0;
  color: #475569;
  font-size: 12px;

  &::before {
    content: '✕';
    font-size: 28px;
    opacity: 0.3;
  }
`;

// ─── CARD ─────────────────────────────────────────────────
const Card = styled.div<{ $selected: boolean; $applied: boolean; $delay: number }>`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${({ $delay }) => Math.min($delay * 25, 300)}ms;

  border: 1.5px solid ${({ $selected, $applied }) =>
    $selected ? '#0ea5e9' :
    $applied  ? '#22c55e' :
    'rgba(30, 41, 59, 0.9)'};

  background: #0f172a;

  ${({ $selected }) => $selected && css`
    animation: ${glowPulse} 2.5s ease-in-out infinite;
  `}

  &:hover:not([data-selected="true"]) {
    transform: translateY(-3px) scale(1.02);
    border-color: rgba(14, 165, 233, 0.35);
    box-shadow: 0 8px 20px rgba(0,0,0,0.4);
  }
`;

const AppliedBadge = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
  z-index: 3;
  animation: ${checkIn} 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(34,197,94,0.5);
`;

const SelectOverlay = styled.div<{ $visible: boolean }>`
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(14,165,233,0.18) 0%, transparent 60%);
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 2;
`;

// ─── IMAGE ZONE ────────────────────────────────────────────
const ImgWrap = styled.div`
  position: relative;
  width: 100%;
  height: 110px;
  background: #94a3b8; /* <-- GRIS NEUTRE POUR MIEUX VOIR LES TATOUAGES */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0,0,0,0.04) 50%,
      transparent 100%
    );
    background-size: 100% 4px;
    pointer-events: none;
    opacity: 0.5;
  }

  img {
    width: 90%;
    height: 90%;
    object-fit: contain;
    transition: transform 0.25s ease;
  }

  ${Card}:hover & img {
    transform: scale(1.06);
  }
`;

const ImgPlaceholder = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(14,165,233,0.08);
  border: 1.5px dashed rgba(14,165,233,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: rgba(14,165,233,0.3);
`;

const SkeletonImg = styled.div`
  width: 70%;
  height: 70%;
  border-radius: 8px;
  background: linear-gradient(90deg, #1e293b 25%, #2d3f50 50%, #1e293b 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.4s infinite;
`;

// ─── LABEL BANDE ──────────────────────────────────────────
const Label = styled.div<{ $selected: boolean }>`
  background: ${({ $selected }) => $selected
    ? 'linear-gradient(135deg, #0284c7, #0ea5e9)'
    : '#0c1828'};
  padding: 7px 8px;
  font-size: 10px;
  font-weight: 600;
  color: ${({ $selected }) => $selected ? '#fff' : '#94a3b8'};
  text-align: center;
  letter-spacing: 0.4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.2s, color 0.2s;
  border-top: 1px solid rgba(255,255,255,0.04);
`;

// ─── SMART IMAGE ──────────────────────────────────────────
const SmartImage = ({ tattoo, alt }: { tattoo: Tattoo; alt: string }) => {
  const hashM     = (tattoo.hashMale  ?? '').toLowerCase();
  const cleanHash = hashM.endsWith('_m') ? hashM.slice(0, -2) : hashM;
  const hashF     = (tattoo.hashFemale ?? '').toLowerCase();

  const srcs = [
    `./tattoos/${cleanHash}.png`,
    `./tattoos/${hashM}.png`,
    `./tattoos/${(tattoo.name ?? '').toLowerCase()}.png`,
    `./tattoos/${hashF}.png`,
  ].filter(Boolean);

  const [idx,     setIdx]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed,  setFailed]  = useState(srcs.length === 0);

  const onError = () => {
    if (idx + 1 < srcs.length) setIdx(i => i + 1);
    else setFailed(true);
  };

  if (failed) return <ImgPlaceholder>✦</ImgPlaceholder>;

  return (
    <>
      {loading && <SkeletonImg />}
      <img
        src={srcs[idx]}
        alt={alt}
        onLoad={() => setLoading(false)}
        onError={onError}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </>
  );
};

// ─── BOTTOM PANEL ─────────────────────────────────────────
const BottomPanel = styled.div`
  flex-shrink: 0;
  margin-top: 10px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(30, 58, 74, 0.8);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SelectedPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PreviewThumb = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #94a3b8; /* <-- MEME GRIS NEUTRE POUR LA MINIATURE EN BAS */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(14,165,233,0.3);

  img {
    width: 90%;
    height: 90%;
    object-fit: contain;
  }
`;

const PreviewInfo = styled.div`
  flex: 1;
  min-width: 0;

  .name {
    font-size: 12px;
    font-weight: 600;
    color: #e2e8f0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px;
  }

  .status {
    font-size: 10px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 4px;

    &.applied { color: #22c55e; }
  }
`;

const BtnRow = styled.div`
  display: flex;
  gap: 8px;

  button {
    flex: 1;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 9px;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
    font-family: inherit;
  }

  .btn-apply {
    background: #0ea5e9;
    color: #fff;
    border-color: #0284c7;
    &:hover { background: #38bdf8; }
  }

  .btn-delete {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    border-color: rgba(239, 68, 68, 0.3);
    &:hover { background: rgba(239, 68, 68, 0.22); }
  }
`;

// ─── COMPTEUR ─────────────────────────────────────────────
const CountBadge = styled.div`
  font-size: 10px;
  color: #475569;
  text-align: right;
  margin-bottom: 4px;
  flex-shrink: 0;

  span { color: #0ea5e9; font-weight: 600; }
`;

// ─────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────
const SelectTattoo = ({
  items,
  tattoosApplied,
  handleApplyTattoo,
  handlePreviewTattoo,
  handleDeleteTattoo,
  settings,
}: SelectTattooProps) => {
  const defaultOpacity = 1.0;
  const [currentTattoo, setCurrentTattoo] = useState<Tattoo>(items[0]);
  const [opacity, setOpacity]             = useState<number>(defaultOpacity);
  const [search, setSearch]               = useState('');
  const { locales } = useNuiState();

  const clientOpacity = useCallback(() => {
    if (!tattoosApplied) return defaultOpacity;
    const found = tattoosApplied.find(t => t.name === currentTattoo.name);
    return found?.opacity ?? defaultOpacity;
  }, [currentTattoo, tattoosApplied])();

  useEffect(() => { setOpacity(clientOpacity); }, [clientOpacity]);

  const isApplied = useCallback((name: string) =>
    tattoosApplied?.some(t => t.name === name) ?? false,
  [tattoosApplied]);

  const isCurrentApplied = isApplied(currentTattoo.name);

  const handleSelect = (tattoo: Tattoo) => {
    setCurrentTattoo(tattoo);
    handlePreviewTattoo(tattoo, opacity);
  };

  const handleOpacity = useCallback((val: number) => {
    setOpacity(val);
    handlePreviewTattoo(currentTattoo, val);
  }, [currentTattoo, handlePreviewTattoo]);

  const filtered = search.trim()
    ? items.filter(t =>
        t.label?.toLowerCase().includes(search.toLowerCase()) ||
        t.name?.toLowerCase().includes(search.toLowerCase())
      )
    : items;

  if (!locales) return null;

  return (
    <Root>

      <SearchWrap>
        <SearchIcon>⌕</SearchIcon>
        <SearchInput
          placeholder="Rechercher un tatouage..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </SearchWrap>

      <CountBadge>
        <span>{filtered.length}</span> / {items.length} tatouages
        {tattoosApplied && tattoosApplied.length > 0 && (
          <> · <span style={{ color: '#22c55e' }}>{tattoosApplied.length} appliqué{tattoosApplied.length > 1 ? 's' : ''}</span></>
        )}
      </CountBadge>

      <Grid>
        {filtered.length === 0 && (
          <EmptyState>Aucun tatouage trouvé</EmptyState>
        )}

        {filtered.map((tattoo, i) => {
          const selected = currentTattoo.name === tattoo.name;
          const applied  = isApplied(tattoo.name);

          return (
            <Card
              key={tattoo.name}
              $selected={selected}
              $applied={applied}
              $delay={i}
              data-selected={selected}
              onClick={() => handleSelect(tattoo)}
            >
              {applied && <AppliedBadge>✓</AppliedBadge>}
              <SelectOverlay $visible={selected} />

              <ImgWrap>
                <SmartImage tattoo={tattoo} alt={tattoo.label} />
              </ImgWrap>

              <Label $selected={selected}>{tattoo.label}</Label>
            </Card>
          );
        })}
      </Grid>

      <BottomPanel>
        <SelectedPreview>
          <PreviewThumb>
            <SmartImage tattoo={currentTattoo} alt={currentTattoo.label} />
          </PreviewThumb>

          <PreviewInfo>
            <div className="name">{currentTattoo.label}</div>
            <div className={`status ${isCurrentApplied ? 'applied' : ''}`}>
              {isCurrentApplied ? '● Appliqué' : '○ Non appliqué'}
            </div>
          </PreviewInfo>
        </SelectedPreview>

        <RangeInput
          title={locales.tattoos.opacity}
          min={settings.opacity.min}
          max={settings.opacity.max}
          factor={settings.opacity.factor}
          defaultValue={opacity}
          clientValue={clientOpacity}
          onChange={handleOpacity}
        />

        <BtnRow>
          {isCurrentApplied ? (
            <button
              className="btn-delete"
              onClick={() => handleDeleteTattoo(currentTattoo)}
            >
              ✕ {locales.tattoos.delete}
            </button>
          ) : (
            <button
              className="btn-apply"
              onClick={() => handleApplyTattoo(currentTattoo, opacity)}
            >
              ✦ {locales.tattoos.apply}
            </button>
          )}
        </BtnRow>
      </BottomPanel>

    </Root>
  );
};

export default SelectTattoo;