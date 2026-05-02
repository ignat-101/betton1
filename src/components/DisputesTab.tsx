import React, { useEffect, useState } from 'react';
import { useApp } from '../data';
import type { Dispute } from '../types';

export default function DisputesTab() {
  const { user } = useApp();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState<number>(100);
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState<string>('');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/disputes');
      const j = await res.json();
      setDisputes(j.disputes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const doStake = async (amount: number) => {
    if (amount <= 0) return;
    await fetch('/api/stake', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_address: user.address, amount }) });
    fetchDisputes();
  };

  const createDispute = async () => {
    if (!title) return;
    const expires_ts = expiresAt ? new Date(expiresAt).getTime() : 0;
    await fetch('/api/disputes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description: reason, expires_at: expires_ts, creator: user.address }) });
    setTitle(''); setReason(''); setExpiresAt('');
    fetchDisputes();
  };

  const vote = async (id: string, voteChoice: 'yes' | 'no') => {
    await fetch(`/api/disputes/${id}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_address: user.address, vote: voteChoice, stake: stakeAmount }) });
    fetchDisputes();
  };

  const resolve = async (id: string, result?: 'yes' | 'no') => {
    await fetch(`/api/disputes/${id}/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ admin_address: user.address, result }) });
    fetchDisputes();
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 px-4">
      <div className="py-3">
        <h2 className="text-sm font-semibold mb-2">Заработать — участвуйте в спорах</h2>
        <div className="flex gap-2 items-center">
          <input type="number" value={stakeAmount} onChange={e => setStakeAmount(Number(e.target.value))} className="w-28 px-3 py-2 rounded-lg bg-neutral-900" />
          <button onClick={() => doStake(stakeAmount)} className="px-3 py-2 rounded-lg bg-blue-600">Застейкать</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Зарабатывайте, участвуя в разрешении споров: вы сте́йните средства, голосуете «Да/Нет» и получаете вознаграждение при правильном голосовании. Спор открывается прямо на странице рынка (кнопка «Открыть спор»).</p>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-2">Открытые споры</h2>
        {loading && <div className="text-gray-400 text-sm">Загрузка...</div>}
        {!loading && disputes.length === 0 && <div className="text-gray-500 text-sm">Нет споров</div>}
        <div className="flex flex-col gap-3">
          {disputes.map(d => (
            <div key={d.id} className="p-3 rounded-lg bg-neutral-900">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">{d.title}</div>
                  <div className="text-xs text-gray-400">{d.reason}</div>
                  <div className="text-xs text-gray-500 mt-1">Открыт: {new Date(d.created_at).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Статус: {d.status}</div>
                  {d.status === 'resolved' && <div className="text-xs text-gray-300">Результат: {d.result}</div>}
                </div>
              </div>

              <div className="mt-3 flex gap-2 items-center">
                <button onClick={() => vote(d.id, 'yes')} className="px-3 py-1 rounded-lg bg-emerald-600 text-sm">Голосовать ЗА</button>
                <button onClick={() => vote(d.id, 'no')} className="px-3 py-1 rounded-lg bg-red-600 text-sm">Голосовать ПРОТИВ</button>
                {user.address === process.env.REACT_APP_ADMIN_WALLET || user.isAdmin ? (
                  <>
                    <button onClick={() => resolve(d.id, 'yes')} className="px-3 py-1 rounded-lg bg-amber-600 text-sm">Резолв ЗА</button>
                    <button onClick={() => resolve(d.id, 'no')} className="px-3 py-1 rounded-lg bg-amber-600 text-sm">Резолв ПРОТИВ</button>
                  </>
                ) : null}
                <div className="ml-auto text-xs text-gray-400">Голосов: {d.votes.length}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
