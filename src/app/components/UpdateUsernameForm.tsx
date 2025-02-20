import { useState } from 'react';

interface UpdateUsernameFormProps {
  onSubmit: (newUsername: string) => Promise<void>;
  loading: boolean;
  currentUsername: string | null;
}

export const UpdateUsernameForm = ({ onSubmit, loading, currentUsername }: UpdateUsernameFormProps) => {
  const [newUsername, setNewUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      await onSubmit(newUsername.trim());
      setNewUsername('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Current Username
        </label>
        <div className="text-blue-400 font-medium mb-4">
          {currentUsername || 'No username set'}
        </div>
        
        <label className="block text-sm font-medium text-gray-300 mb-2">
          New Username
        </label>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          placeholder="Enter new username (without .units)"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          disabled={loading}
        />
        <p className="mt-1 text-sm text-gray-400">
          New username will be registered as {newUsername ? `${newUsername}.units` : 'username.units'}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !newUsername.trim()}
        className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
          loading || !newUsername.trim()
            ? 'bg-gray-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.99]'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Updating...
          </div>
        ) : (
          'Update Username'
        )}
      </button>
    </form>
  );
}; 