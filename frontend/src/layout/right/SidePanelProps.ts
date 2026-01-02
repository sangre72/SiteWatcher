
interface SidePanelProps {
    isOpen: boolean;
    responseContent: string; // Assuming responseContent is a string for the editor
    onClose: () => void; // 새로 추가된 onClose 함수
    onToggle: () => void; // 새로 추가된 onClose 함수
}
