import React, { useState } from "react";

interface SwimControlPanelProps {
  title?: string;
  children?: React.ReactNode;
}

export const Sidebar: React.FC<SwimControlPanelProps> = ({title, children}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        className="fixed top-6 left-6 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close control panel" : "Open control panel"}
      >
        {isOpen ? "Close Panel" : "Open Panel"}
      </button>

      {/* Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ pointerEvents: isOpen ? "auto" : "none" }}
      >
        <div className="p-6 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-4">{title}</h2>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          <button
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        onClick={() => setIsOpen(false)}
          >
        Close
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

