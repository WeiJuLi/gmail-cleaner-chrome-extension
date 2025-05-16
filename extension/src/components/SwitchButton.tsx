import { useState } from 'react';

interface SwitchButtonProps {
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
}

const SwitchButton: React.FC<SwitchButtonProps> = ({ 
  initialValue = false, 
  onChange,
  label 
}) => {
  const [isOn, setIsOn] = useState(initialValue);

  const handleToggle = () => {
    const newValue = !isOn;
    setIsOn(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          transition-colors duration-200 ease-in-out
          ${isOn ? 'bg-blue-600' : 'bg-gray-200'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white
            transition-transform duration-200 ease-in-out
            ${isOn ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
};

export default SwitchButton; 