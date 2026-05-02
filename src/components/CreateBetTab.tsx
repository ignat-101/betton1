import { useState } from 'react';
import { useApp } from '../data';
import { Plus, CheckCircle } from 'lucide-react';
import type { Market } from '../types';

const categories = [
  { id: 'crypto', label: 'Крипто' },
  { id: 'sports', label: 'Спорт' },
  { id: 'politics', label: 'Политика' },
  { id: 'weather', label: 'Погода' },
  { id: 'other', label: 'Другое' },
];

export default function CreateBetTab() {
  const { createMarket, user } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('crypto');
  const [endDate, setEndDate] = useState('');
  const [created, setCreated] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !endDate) return;

    createMarket({
      title: title.trim(),
      description: description.trim(),
      category,
      creatorAddress: user.address,
      creatorName: user.name,
      endDate: new Date(endDate).getTime(),
      oracleType: 'manual',
      oracleConfig: undefined,
    });

    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      setTitle('');
      setDescription('');
      setEndDate('');
    }, 2500);
  };

  if (created) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center fade-in">
          <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">Ставка создана!</h2>
          <p className="text-sm text-gray-500">Она появится в списке после подтверждения</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-4 pt-4">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-white">Создать рынок</h1>
        <p className="text-xs text-gray-500 mt-0.5">Спросите, опишите, установите срок. Разрешение — через споры и голосование.</p>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Вопрос</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: BTC выше $100,000 к 1 марта?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Описание</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробности и условия разрешения ставки..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Категория</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === id
                    ? 'bg-white/10 text-white'
                    : 'bg-white/5 text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="text-xs font-medium text-gray-400 block mb-1.5">Дата окончания</label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !description.trim() || !endDate}
          className="w-full py-3 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Создать рынок
        </button>
      </div>
    </div>
  );
}
