import { ModalBody } from "reactstrap";
import { ModalContainer } from "./tailwind/Modal";

export default function ModalCacheResetLoader() {
  return (
    <ModalContainer open={true}>
      <ModalBody>
        <div className="tw-text-center tw-animate-pulse">Veuillez patienter pendant le vidage du cache…</div>
      </ModalBody>
    </ModalContainer>
  );
}
