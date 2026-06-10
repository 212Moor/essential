import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  justify-content: flex-end; /* Pousse le menu tout à droite */
  align-items: center;
  width: 100vw;
  height: 100vh;
  padding: 40px 80px; /* Ajoute une marge */
  box-sizing: border-box;
  pointer-events: none; /* Laisse les clics passer au travers pour tourner la caméra */
`;

export const Container = styled.div`
  width: 420px; /* Largeur du menu */
  height: 85vh; /* Hauteur dynamique */
  background: rgba(15, 23, 42, 0.85); /* Fond sombre transparent moderne */
  border-radius: 16px; /* Bords bien arrondis */
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  pointer-events: auto; /* Réactive les clics sur le menu */
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(14, 165, 233, 0.3); /* Légère bordure bleue */

  /* Design de la barre de défilement (Scrollbar) */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #0ea5e9; /* Bleu océan */
    border-radius: 10px;
  }
`;

/* --- ON REMET LE FLEXWRAPPER MANQUANT ICI --- */
export const FlexWrapper = styled.div`
  width: 100%;
  display: flex;

  > div {
    & + div {
      margin-left: 10px;
    }
  }
`;