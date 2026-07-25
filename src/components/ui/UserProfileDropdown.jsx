import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { 
  User, 
  Mail, 
  Wallet, 
  Edit3, 
  LogOut, 
  Shield, 
  FileText, 
  Lock, 
  Search,
  Copy,
  Check
} from 'lucide-react';

export function UserProfileDropdown() {
  const { user, logout, updateName } = useAuth();
  const { totalUsd } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleCopyAddress = () => {
    if (user.wallet_address) {
      navigator.clipboard.writeText(user.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveName = async () => {
    if (newName.trim() && newName !== user.name) {
      await updateName(newName.trim());
    }
    setIsEditingName(false);
  };

  const shortAddress = user.wallet_address 
    ? `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`
    : 'Not created';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 touch-target text-muted hover:text-bone transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-brass/20 flex items-center justify-center text-brass font-semibold text-sm">
          {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
        </div>
        <span className="hidden tablet:block text-sm font-medium">
          {user.name || 'Guest'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-72 bg-panel2 border border-line rounded-lg shadow-2xl z-50 overflow-hidden">
          {/* Header with name and balance */}
          <div className="px-4 py-3 border-b border-line">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-brass/20 flex items-center justify-center text-brass font-semibold text-lg">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'G'}
                </div>
                <div>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-panel border border-line rounded px-2 py-1 text-sm text-bone focus:outline-none focus:border-brass"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      />
                      <button
                        onClick={handleSaveName}
                        className="text-xs bg-brass text-void px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setIsEditingName(false); setNewName(user.name || ''); }}
                        className="text-xs text-muted hover:text-bone"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-bone">{user.name}</span>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-muted hover:text-bone"
                      >
                        <Edit3 size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Mail size={12} />
                    <span>{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted">CLOSE Balance</span>
              <span className="font-mono text-bone">{user.close_balance || 0} CLOSE</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Wallet Value</span>
              <span className="font-mono text-bone">${totalUsd.toFixed(2)}</span>
            </div>
          </div>

          {/* Wallet address */}
          <div className="px-4 py-2 border-b border-line flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wallet size={14} className="text-muted" />
              <span className="font-mono text-bone">{shortAddress}</span>
            </div>
            <button
              onClick={handleCopyAddress}
              className="text-muted hover:text-bone"
            >
              {copied ? <Check size={14} className="text-teal" /> : <Copy size={14} />}
            </button>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {/* open search modal */}}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted hover:text-bone hover:bg-white/5 transition-colors"
            >
              <Search size={16} />
              Search
            </button>
            <button
              onClick={() => {/* open change password modal */}}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted hover:text-bone hover:bg-white/5 transition-colors"
            >
              <Lock size={16} />
              Change Password
            </button>
            <button
              onClick={() => window.location.href='/about'}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted hover:text-bone hover:bg-white/5 transition-colors"
            >
              <FileText size={16} />
              About
            </button>
            <button
              onClick={() => window.location.href='/privacy-terms'}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted hover:text-bone hover:bg-white/5 transition-colors"
            >
              <Shield size={16} />
              Terms & Privacy
            </button>
            <div className="border-t border-line my-1" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-alert hover:bg-alert/10 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}