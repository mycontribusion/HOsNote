import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import SuffixedValue from './SuffixedValue';

export default function ReviewDuplicatesModal({ pendingImport, onResolve, onCancel }) {
    // pendingImport.conflicts = [ { imported, existing } ]
    // Each conflict needs a choice. Default to 'skip'.
    const [choices, setChoices] = useState(() =>
        pendingImport.conflicts.reduce((acc, conflict, idx) => {
            acc[idx] = 'skip'; // default choice
            return acc;
        }, {})
    );

    const handleChoiceChange = (idx, value) => {
        setChoices(prev => ({ ...prev, [idx]: value }));
    };

    const handleApply = () => {
        const resolved = pendingImport.conflicts.map((conflict, idx) => ({
            ...conflict,
            action: choices[idx]
        }));
        onResolve(resolved, pendingImport.newOnes);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-box w-full max-w-lg p-0" role="dialog" aria-modal="true">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
                    <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-500" />
                        Review Duplicates
                    </h2>
                    <button className="btn-icon text-gray-400 hover:text-gray-600" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-4">
                        We found {pendingImport.conflicts.length} patient(s) that already exist in your list.
                        Please choose how to handle each one.
                    </p>

                    <div className="flex flex-col gap-4">
                        {pendingImport.conflicts.map((conflict, idx) => {
                            const p = conflict.imported;
                            return (
                                <div key={idx} className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                                    <div className="font-semibold text-gray-900 mb-1">{p.name || 'Unnamed'}</div>
                                    <div className="text-xs text-gray-500 mb-3 space-y-1">
                                        {p.hospitalNumber && <div>Hosp ID: <span className="font-medium text-gray-700"><SuffixedValue value={p.hospitalNumber} /></span></div>}
                                        {p.ward && <div>Ward/Bed: <span className="font-medium text-gray-700">{p.ward} <SuffixedValue value={p.bed} /></span></div>}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <label className={`flex-1 text-center py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer border transition-colors ${choices[idx] === 'skip' ? 'bg-white border-blue-500 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-white'}`}>
                                            <input type="radio" className="hidden" name={`choice-${idx}`} value="skip" checked={choices[idx] === 'skip'} onChange={(e) => handleChoiceChange(idx, e.target.value)} />
                                            Skip Duplicate
                                        </label>
                                        <label className={`flex-1 text-center py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer border transition-colors ${choices[idx] === 'update' ? 'bg-white border-blue-500 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-white'}`}>
                                            <input type="radio" className="hidden" name={`choice-${idx}`} value="update" checked={choices[idx] === 'update'} onChange={(e) => handleChoiceChange(idx, e.target.value)} />
                                            Update Details
                                        </label>
                                        <label className={`flex-1 text-center py-2 px-1 text-xs font-semibold rounded-lg cursor-pointer border transition-colors ${choices[idx] === 'new' ? 'bg-white border-blue-500 text-blue-700 shadow-sm' : 'border-gray-200 text-gray-500 hover:bg-white'}`}>
                                            <input type="radio" className="hidden" name={`choice-${idx}`} value="new" checked={choices[idx] === 'new'} onChange={(e) => handleChoiceChange(idx, e.target.value)} />
                                            Add as New
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {pendingImport.newOnes.length > 0 && (
                        <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm font-medium rounded-lg">
                            + {pendingImport.newOnes.length} brand new patient(s) will also be added.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-2">
                    <button className="btn-secondary flex-1 border-gray-300" onClick={onCancel}>Cancel All</button>
                    <button className="btn-primary flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleApply}>Complete Handover</button>
                </div>
            </div>
        </div>
    );
}
