interface TransactionConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipient: string;
  amount: string;
  loading: boolean;
}

export const TransactionConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  recipient,
  amount,
  loading
}: TransactionConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-xl border border-gray-700/50 p-6 max-w-md w-full mx-4 space-y-4">
        <h3 className="text-xl font-semibold text-gray-100">
          İşlem Onayı
        </h3>
        
        <div className="space-y-4 py-2">
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Alıcı</span>
              <span className="text-sm text-gray-100 font-mono">{recipient}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Miktar</span>
              <span className="text-sm text-gray-100">{amount} UNIT0</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-300">
            Bu işlemi bundler'a göndermek istediğinizden emin misiniz?
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors duration-200"
          >
            İptal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors duration-200 relative"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              'Onayla'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 