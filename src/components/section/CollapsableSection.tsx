import React, { ReactNode, useState } from "react";

interface CollapsableSectionProps {
    heading: string;
    children: ReactNode;
    defaultOpen?: boolean;
}

const CollapseableSection: React.FC<CollapsableSectionProps> = ({
    heading,
    children,
    defaultOpen = false,
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <section className="border rounded mb-4">
            <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 focus:outline-none"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
            >
                <span className="font-semibold">{heading}</span>
                <span className="ml-2">
                    {open ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    )}
                </span>
            </button>
            {open && (
                <div className="px-4 py-2 bg-white">
                    {children}
                </div>
            )}
        </section>
    );
};

export default CollapseableSection;