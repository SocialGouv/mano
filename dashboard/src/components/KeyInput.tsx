import { useEffect, useRef, useState } from "react";
import { DEFAULT_ORGANISATION_KEY } from "../config";
import EyeIcon from "../assets/icons/EyeIcon";

// Un faux champ password pour la clé de chiffrement.
//
// Limites identifiées actuellement :
// - Pas de copier/coller (on peut voir ça comme une sécurité)
// - On ne peut pas déplacer le curseur, il est toujours à la fin.
const KeyInput = ({
  id,
  onChange,
  onPressEnter,
}: {
  id: string;
  onChange: (value: string) => void;
  onPressEnter: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (DEFAULT_ORGANISATION_KEY) {
      setValue(DEFAULT_ORGANISATION_KEY);
      inputRef.current.innerText = "•".repeat(DEFAULT_ORGANISATION_KEY.length);
    }
    // Focus sur le champ
    inputRef.current.focus();
    setCursorToEnd();
  }, []);

  function setCursorToEnd() {
    document.getSelection().selectAllChildren(inputRef.current);
    document.getSelection().collapseToEnd();
  }

  return (
    <div className="tw-relative tw-mb-1.5 tw-block tw-w-full tw-rounded tw-border tw-border-main75 tw-bg-transparent tw-outline-main tw-transition-all">
      <div
        id={id}
        contentEditable
        // L'auto-focus ne semble pas fonctionner ici, donc on utilise un useEffect pour forcer le focus.
        autoFocus
        ref={inputRef}
        onPaste={(e) => {
          // Pas de copier/coller
          e.preventDefault();
        }}
        onKeyDown={(e) => {
          // 1. On ne veut pas rajouter de caractère "entrée"
          // 2. On envoie la clé
          if (e.key === "Enter") {
            e.preventDefault();
            onPressEnter(e);
          }
        }}
        onDoubleClick={(e) => {
          // Gestion de la sélection de tout le texte (car il est en contradiction avec les onSelect)
          e.preventDefault();
          e.stopPropagation();
          document.getSelection().selectAllChildren(inputRef.current);
        }}
        onSelect={(e) => {
          e.preventDefault();
          // Toute sélection est désactivée, sauf si on a sélectionné tout le texte
          if (document.getSelection().toString().length !== inputRef.current.innerText.length) {
            setCursorToEnd();
          }
        }}
        onInput={(e) => {
          // Cas particulier: Si on est en train de faire une composition (comme ^ + i pour î par exemple), on gère à l'extérieur.
          // Sauf que sur android, on ne peut pas détecter la composition parce que tout est composition.
          // Mais on ne peut pas toujours détecter si c'est android ou pas.
          // Donc on ignore uniquement les caractères de composition courants en français comme ^¨`´.
          // Sur les claviers non-français, l'accent peut se faire avec ' et " (pour le trema).
          // Mais ça ne semble pas poser de problème car il n'est pas considéré comme composition.
          const nativeEvent = e.nativeEvent as InputEvent;
          if (nativeEvent.isComposing && /^[\^¨`´]$/.test(nativeEvent.data || "")) return;

          let innerText = (e.target as HTMLElement).innerText;
          // On enlève les caractères de retour à la ligne (sur iOS, quand on efface tout, il reste un retour à la ligne)
          innerText = (innerText || "").replace(/[\r\n]/g, "");
          let newValue: string;

          if (innerText.length === value.length + 1) {
            // 1 caractère en plus à la fin
            const newChar = innerText.slice(-1);
            newValue = value + newChar;
          } else if (innerText.length + 1 === value.length) {
            // 1 caractère en moins à la fin
            newValue = value.slice(0, -1);
          } else {
            // Autre cas
            newValue = innerText;
          }

          // Cas particulier en cas d'erreur (si la personne a forcé le déplacement du curseur par exemple)
          if (newValue.includes("•")) {
            newValue = "";
          }

          // Replace non-breaking spaces by normal spaces
          // eslint-disable-next-line no-irregular-whitespace
          newValue = newValue.replace(/ /g, " ");

          // State interne et envoi de la clé
          onChange(newValue);
          setValue(newValue);

          // Remplacement du texte par des points
          if (!showPassword) {
            (e.target as HTMLElement).innerText = "•".repeat(newValue.length);
          }

          // On déplace le curseur à la fin
          setCursorToEnd();
        }}
        autoCorrect="off"
        spellCheck="false"
        autoCapitalize="off"
        // Il est très important de laisser `tw-whitespace-pre-wrap` pour éviter
        // que le navigateur remplace les espaces par des espaces insécables.
        className="tw-whitespace-pre-wrap tw-block tw-w-full tw-bg-transparent tw-p-2.5 tw-text-black tw-outline-main tw-transition-all"
      />
      <EyeIcon
        strikedThrough={showPassword}
        onClick={() => {
          const nextShowPassword = !showPassword;
          if (nextShowPassword === false) {
            inputRef.current.innerText = "•".repeat(value.length);
          } else {
            inputRef.current.innerText = value;
          }
          setShowPassword(nextShowPassword);
        }}
        className="tw-absolute tw-right-4 tw-top-2 tw-cursor-pointer"
      />
    </div>
  );
};

export default KeyInput;
