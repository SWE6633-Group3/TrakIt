'use client';
import { useState, useEffect, useCallback } from 'react';

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function TeamManager({ projectId }: { projectId: number }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newRole, setNewRole] = useState('Member');

  // Wrapped in useCallback to prevent unnecessary re-renders and satisfy linting
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      const data = await res.json();
      setMembers(data);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  }, [projectId]);

  useEffect(() => {
    const loadData = async () => {
      await fetchMembers();
    };
    loadData();
  }, [fetchMembers]);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newUserEmail, role: newRole }),
    });

    if (res.ok) {
      setNewUserEmail('');
      fetchMembers();
    } else {
      alert("Failed to add member. Make sure the email exists in the system.");
    }
  };

  const removeMember = async (userId: number) => {
    if (confirm('Remove this member?')) {
      await fetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
      fetchMembers();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <form onSubmit={addMember} className="flex items-center gap-4">
          <div className="flex-1">
            <input 
              type="email" 
              placeholder="User email" 
              className="w-full p-4 rounded-xl border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black shadow-sm"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
            />
          </div>
          <select 
            className="p-4 rounded-xl border border-gray-200 bg-white text-black min-w-[150px]"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
          >
            <option value="Member">Member</option>
            <option value="Developer">Developer</option>
            <option value="Lead">Lead</option>
          </select>
          <button type="submit" className="bg-[#0f172a] text-white px-10 py-4 rounded-full font-semibold hover:bg-black transition-all">
            Add
          </button>
        </form>
        <p className="mt-3 text-gray-400 text-sm ml-1">Existing user required</p>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all">
            <div>
              <div className="font-bold text-lg text-gray-900">{member.name}</div>
              <div className="text-gray-400 text-sm">{member.role} · {member.email}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Edit
              </button>
              <button 
                onClick={() => removeMember(member.id)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}