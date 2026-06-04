import React from 'react'

interface DiffViewerProps {
    oldValue: Record<string, any> | null
    newValue: Record<string, any> | null
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ oldValue, newValue }) => {
    const safeOld = oldValue || {}
    const safeNew = newValue || {}

    // Get all unique keys from both objects
    const allKeys = Array.from(new Set([...Object.keys(safeOld), ...Object.keys(safeNew)])).sort()

    return (
        <div className="bg-black/30 backdrop-blur-md rounded-lg p-4 border border-white/10 mt-2 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="py-2 px-4 font-bold text-[var(--color-text-secondary)]">Field</th>
                        <th className="py-2 px-4 font-bold text-[var(--color-text-secondary)]">Old Value</th>
                        <th className="py-2 px-4 font-bold text-[var(--color-text-secondary)]">New Value</th>
                    </tr>
                </thead>
                <tbody>
                    {allKeys.map(key => {
                        const oldVal = safeOld[key]
                        const newVal = safeNew[key]

                        const oldStr = oldVal !== undefined ? JSON.stringify(oldVal) : '-'
                        const newStr = newVal !== undefined ? JSON.stringify(newVal) : '-'

                        let rowClass = "text-[var(--color-text-primary)]"
                        if (oldVal === undefined && newVal !== undefined) {
                            rowClass = "text-green-400 bg-green-400/10" // Added
                        } else if (oldVal !== undefined && newVal === undefined) {
                            rowClass = "text-red-400 bg-red-400/10" // Removed
                        } else if (oldStr !== newStr) {
                            rowClass = "text-amber-400 bg-amber-400/10" // Changed
                        } else {
                            rowClass = "text-[var(--color-text-muted)]" // Unchanged
                        }

                        // Don't render unchanged fields if we don't want to clutter the diff
                        if (oldStr === newStr) {
                            return null;
                        }

                        return (
                            <tr key={key} className={`border-b border-white/5 ${rowClass}`}>
                                <td className="py-2 px-4 font-medium">{key}</td>
                                <td className="py-2 px-4 font-mono text-xs max-w-[200px] truncate" title={oldStr}>{oldStr}</td>
                                <td className="py-2 px-4 font-mono text-xs max-w-[200px] truncate" title={newStr}>{newStr}</td>
                            </tr>
                        )
                    })}
                    {allKeys.every(key => JSON.stringify(safeOld[key]) === JSON.stringify(safeNew[key])) && (
                        <tr>
                            <td colSpan={3} className="py-4 text-center text-white/50 text-xs italic">
                                No specific field changes recorded (or only metadata like timestamps).
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
