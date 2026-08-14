import React, { useState } from 'react';

export default function GoalEditor({ goal, onSave, onClose }) {
  const [target, setTarget] = useState(goal ? goal.target : 1);

  function save() {
    const parsed = Number(target);
    if (Number.isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid positive number');
      return;
    }
    onSave({ ...goal, target: parsed });
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-2xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Edit Goal</h3>
          <button aria-label="Close" onClick={onClose} className="text-gray-600">✕</button>
        </div>
        <div className="mt-4">
          <div className="text-sm text-gray-700">{goal.title}</div>
          <label className="block text-sm text-gray-500 mt-3">Target ({goal.unit})</label>
          <input aria-label="Target value" type="number" value={target} onChange={e => setTarget(e.target.value)} className="w-full mt-2 p-3 border rounded-lg" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} className="flex-1 bg-green-600 text-white py-3 rounded-lg">Save</button>
          <button onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  );
}
