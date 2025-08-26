import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';
// It's better to import Chart.js and its components directly if using a module system
// But for this environment, we'll rely on the global Chart object from the CDN.
import type { Chart, ChartConfiguration } from 'chart.js';

interface DashboardProps {
    session: Session;
}

// All the styles from the provided HTML are encapsulated here
const DashboardStyles = () => (
    <style>{`
        :root {
            --primary-bg: #0f172a;
            --secondary-bg: #1e293b;
            --card-bg: #334155;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --accent: #0ea5e9;
            --accent-hover: #0284c7;
            --success: #22c55e;
            --warning: #f59e0b;
            --danger: #ef4444;
            --border: #475569;
            --shadow: rgba(0, 0, 0, 0.5);
        }

        body[data-theme="light"] {
            --primary-bg: #f8fafc;
            --secondary-bg: #f1f5f9;
            --card-bg: #ffffff;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border: #e2e8f0;
            --shadow: rgba(0, 0, 0, 0.1);
        }

        .dashboard-body {
            background-color: var(--primary-bg);
            color: var(--text-primary);
            transition: all 0.3s ease;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        main { flex-grow: 1; }
        .container { max-width: 1400px; margin: 0 auto; padding: 0 1rem; width: 100%; }
        
        .card { background: var(--card-bg); border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 10px 30px var(--shadow); transition: all 0.3s ease; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px var(--shadow); }

        .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.875rem; text-decoration: none; position: relative; overflow: hidden; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
        .btn-primary { background: var(--accent); color: white; }
        .btn-primary:hover:not(:disabled) { background: var(--accent-hover); transform: translateY(-2px); }
        .btn-secondary { background: var(--secondary-bg); color: var(--text-primary); border: 1px solid var(--border); }
        .btn-secondary:hover { background: var(--card-bg); }
        .btn-success { background: var(--success); color: white; }
        .btn-warning { background: var(--warning); color: white; }
        .btn-danger { background: var(--danger); color: white; }
        .btn-small { padding: 0.5rem; font-size: 0.8rem; min-width: 35px; height: 35px; }

        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1000; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
        .modal.active { opacity: 1; visibility: visible; }
        .modal-content { background: var(--card-bg); border-radius: 20px; border: 1px solid var(--border); padding: 2rem; width: 90vw; max-width: 500px; max-height: 90vh; overflow-y: auto; position: relative; }
        
        .fullscreen-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: var(--primary-bg); z-index: 2000; display: flex; flex-direction: column; justify-content: flex-start; align-items: center; gap: 2rem; opacity: 0; visibility: hidden; transition: all 0.3s ease; padding: 1rem; overflow-y: auto; }
        .fullscreen-modal.active { opacity: 1; visibility: visible; }

        .form-input, .form-select { width: 100%; padding: 0.875rem 1rem; border: 2px solid var(--border); border-radius: 12px; background: var(--primary-bg); color: var(--text-primary); font-size: 1rem; transition: all 0.3s ease; }
        .form-input:focus, .form-select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1); }
        
        .category-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        .category-faucet { background: rgba(34, 197, 94, 0.2); color: var(--success); border: 1px solid var(--success); }
        .category-mining { background: rgba(245, 158, 11, 0.2); color: var(--warning); border: 1px solid var(--warning); }
        .category-staking { background: rgba(14, 165, 233, 0.2); color: var(--accent); border: 1px solid var(--accent); }
        .category-defi { background: rgba(168, 85, 247, 0.2); color: #a855f7; border: 1px solid #a855f7; }
        .category-trading { background: rgba(239, 68, 68, 0.2); color: var(--danger); border: 1px solid var(--danger); }
        .category-shorlin { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; }
        .category-other { background: rgba(148, 163, 184, 0.2); color: var(--text-secondary); border: 1px solid var(--text-secondary); }
        .category-favorites { background: rgba(245, 158, 11, 0.2); color: var(--warning); border: 1px solid var(--warning); }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .stat-card { background: var(--card-bg); border-radius: 16px; padding: 1.5rem; border: 1px solid var(--border); transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px var(--shadow); }
        .stat-value { font-size: 2rem; font-weight: 700; color: var(--accent); margin-bottom: 0.5rem; }
        .stat-label { color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .search-filter-bar { background: var(--card-bg); border-radius: 16px; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid var(--border); }
        
        .fab { position: fixed; bottom: 2rem; right: 2rem; width: 60px; height: 60px; background: var(--accent); border: none; border-radius: 50%; cursor: pointer; font-size: 1.5rem; color: white; box-shadow: 0 8px 30px rgba(14, 165, 233, 0.4); transition: all 0.3s ease; z-index: 100; }
        .fab:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(14, 165, 233, 0.6); }

        .notification { position: fixed; top: 1rem; right: 1rem; padding: 1rem 1.5rem; border-radius: 12px; color: white; font-weight: 600; z-index: 5100; transform: translateX(120%); transition: transform 0.3s ease; display: flex; align-items: center; gap: 0.5rem; }
        .notification.show { transform: translateX(0); }
        .notification.success { background: var(--success); }
        .notification.error { background: var(--danger); }
        .notification.warning { background: var(--warning); }
        .notification.info { background: var(--accent); }

        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }

        .user-id-container { position: fixed; top: 1rem; right: 0; display: flex; align-items: center; z-index: 100; transform: translateX(calc(100% - 45px)); transition: transform 0.3s ease-in-out; }
        .user-id-container.active { transform: translateX(0); }
        .user-id-toggle-btn { background: var(--accent); color: white; border: none; border-top-left-radius: 12px; border-bottom-left-radius: 12px; width: 45px; height: 45px; font-size: 1.2rem; cursor: pointer; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: background 0.2s ease; }
        .user-id-toggle-btn:hover { background: var(--accent-hover); }
        .user-id-panel { background: var(--card-bg); border: 1px solid var(--border); border-top-right-radius: 12px; border-bottom-right-radius: 12px; padding: 0.5rem 1rem; font-size: 0.875rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .user-id-panel span { font-weight: 600; letter-spacing: 0.05em; color: var(--accent); order: 2; }
        .user-id-copy-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1rem; transition: color 0.3s ease; order: 1; }
        .user-id-copy-btn:hover { color: var(--accent); }
        
        .mining-card { border-left: 5px solid var(--accent); }

        .card-image-container { position: relative; overflow: hidden; }
        .card-image { width: 100%; height: 180px; object-fit: cover; object-position: center; transition: transform 0.4s ease; }
        .mining-card:hover .card-image { transform: scale(1.1); }
        .card-top-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; z-index: 10; }
        .card-top-btn { background: rgba(0, 0, 0, 0.6); color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 0.875rem; transition: all 0.3s ease; display: flex; justify-content: center; align-items: center; }
        .card-top-btn:hover { transform: scale(1.15); }
        .card-top-btn.favorite-btn.is-favorite { color: #f59e0b; background: rgba(245, 158, 11, 0.2); }
        
        .card-content { padding: 1.5rem; flex-grow: 1; display: flex; flex-direction: column; }
        .card-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; }
        .status-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
        .status-dot.active { background-color: var(--success); }
        .status-dot.attention { background-color: var(--warning); }
        .status-dot.inactive { background-color: var(--danger); }
        
        .card-url { color: var(--text-secondary); font-size: 0.875rem; word-break: break-all; }
        .card-actions { display: flex; gap: 0.5rem; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 1rem; }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
        .card-footer { border-top: 1px solid var(--border); padding: 0.75rem 1.5rem; background-color: rgba(0,0,0,0.1); font-size: 0.75rem; color: var(--text-secondary); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
        .card-stat { display: flex; align-items: center; gap: 0.25rem; }
        
        .chart-container { background: var(--card-bg); border-radius: 16px; padding: 1.5rem; border: 1px solid var(--border); margin-bottom: 2rem; }
        .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-secondary); }
        .empty-state i { font-size: 4rem; color: var(--accent); margin-bottom: 1rem; }
        
        .filter-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
        .filter-chip { padding: 0.5rem 1rem; border-radius: 20px; background: var(--secondary-bg); color: var(--text-primary); border: 1px solid var(--border); cursor: pointer; transition: all 0.3s ease; font-size: 0.875rem; }
        .filter-chip:hover, .filter-chip.active { background: var(--accent); color: white; border-color: var(--accent); }
        .filter-chip[data-category="favorites"].active { background: var(--warning); color: white; border-color: var(--warning); }

        .menu-button { width: 180px; height: 180px; border-radius: 20px; border: none; cursor: pointer; transition: all 0.3s ease; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 1rem; font-size: 1.1rem; font-weight: 600; text-align: center; }
        .menu-button:hover { transform: scale(1.05); }
        .menu-button.faucet-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .menu-button.add-button { background: var(--accent); color: white; }
        .menu-button.export-button { background: var(--success); color: white; }
        .menu-button.delete-button { background: var(--danger); color: white; }
        .menu-button.investment-button { background: linear-gradient(135deg, #FF6B6B 0%, #FFD166 100%); color: white; }
        .menu-button.url-add-button { background: linear-gradient(135deg, #53d395 0%, #30c39e 100%); color: white; }
        .menu-button.share-all-button { background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%); color: white; }
        .menu-button.games-menu-button { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; }
        .menu-button.theme-toggle-menu-button { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; }
        
        .menu-button.share-app-button, .menu-button.install-button { width: 100%; height: 100px; padding: 0.5rem 1rem; font-size: 1.2rem; flex-direction: row; gap: 1rem; grid-column: span 2; }
        .menu-button.share-app-button { background: linear-gradient(135deg, #FF6F61 0%, #DE483A 100%); color: white; }
        .menu-button.install-button { background: linear-gradient(135deg, #20BDFF 0%, #A5FECB 100%); color: white; }

        .faucet-logo { width: 120px; height: 80px; border-radius: 8px; object-fit: contain; }
        .close-menu-btn { position: absolute; top: 2rem; right: 2rem; background: var(--danger); color: white; border: none; border-radius: 50%; width: 50px; height: 50px; font-size: 1.5rem; cursor: pointer; transition: all 0.3s ease; display: flex; justify-content: center; align-items: center; }
        .close-menu-btn:hover { transform: scale(1.1); }

        .share-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.8); display: flex; justify-content: center; align-items: center; z-index: 1500; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
        .share-modal.active { opacity: 1; visibility: visible; }
        .share-content { background: var(--card-bg); border-radius: 20px; border: 1px solid var(--border); padding: 2rem; max-width: 90vw; width: 500px; position: relative; }
        .share-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem; }
        .share-option { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; border-radius: 12px; background: var(--secondary-bg); cursor: pointer; transition: all 0.2s ease; }
        .share-option:hover { transform: translateY(-3px); background: var(--accent); color: white; }
        .share-option i { font-size: 1.5rem; }
        .share-preview { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; padding: 1rem; border-radius: 12px; background: var(--secondary-bg); }
        .share-preview img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; }
        
        .tooltip { position: fixed; background: var(--secondary-bg); color: var(--text-primary); padding: 0.5rem; border-radius: 6px; font-size: 0.75rem; z-index: 101; pointer-events: none; white-space: nowrap; opacity: 0; transition: opacity 0.2s ease; }
        .tooltip.visible { opacity: 1; }

        .progress-bar { width: 100%; height: 8px; background: var(--secondary-bg); border-radius: 4px; overflow: hidden; margin-top: 1rem; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--success)); transition: width 0.3s ease; }
        .import-progress { background: var(--secondary-bg); border-radius: 8px; padding: 1rem; margin-top: 1rem; }
        .import-log { background: var(--primary-bg); border-radius: 8px; padding: 1rem; max-height: 200px; overflow-y: auto; font-family: monospace; font-size: 0.8rem; color: var(--text-secondary); margin-top: 1rem; }
        .import-log .success { color: var(--success); }
        .import-log .error { color: var(--danger); }
        .import-log .warning { color: var(--warning); }
        .import-log .info { color: var(--accent); }

        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 768px) { 
            .modal-content { width: 95%; padding: 1.5rem; } 
            .cards-grid { grid-template-columns: 1fr; } 
            .stats-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
            .stat-value { font-size: 1.8rem; }
            .fab { bottom: 1rem; right: 1rem; width: 50px; height: 50px; } 
            .user-id-container { top: 0.5rem; transform: translateX(calc(100% - 35px)); }
            .user-id-toggle-btn { width: 35px; height: 35px; font-size: 1rem; }
            .user-id-panel { padding: 0.3rem 0.6rem; font-size: 0.7rem; }
            .filter-chips { flex-direction: column; align-items: stretch; } 
            .filter-chip { text-align: center; } 
            .fullscreen-modal { gap: 1rem; } 
            .menu-button { width: 150px; height: 150px; } 
            .menu-button.share-app-button, .menu-button.install-button { height: 80px; font-size: 1rem; }
            .faucet-logo { width: 100px; height: 60px; } 
            .share-options { grid-template-columns: 1fr 1fr; } 
        }
    `}</style>
);

// Type definitions
interface Entry {
    id: string;
    user_id: string;
    name: string;
    category: string;
    url: string | null;
    description: string | null;
    tags: string[] | null;
    image: string;
    is_favorite: boolean;
    click_count: number;
    last_opened: string | null;
    status: 'active' | 'attention' | 'inactive';
    card_color: string;
    share_code: string | null;
    original_category?: string; // Not in DB, client-side only
    created_at: string;
}

interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

const categories: { [key: string]: { name: string; icon: string; } } = {
    faucet: { name: 'Faucets', icon: 'fas fa-tint' },
    mining: { name: 'Mining', icon: 'fas fa-pickaxe' },
    staking: { name: 'Staking', icon: 'fas fa-coins' },
    defi: { name: 'DeFi', icon: 'fas fa-chart-line' },
    trading: { name: 'Trading', icon: 'fas fa-exchange-alt' },
    shorlin: { name: 'Shorlin Fause', icon: 'fas fa-briefcase' },
    other: { name: 'Otros', icon: 'fas fa-ellipsis-h' },
    favorites: { name: 'Favoritos', icon: 'fas fa-star' }
};

const barColors = ['rgba(255, 99, 132, 0.8)', 'rgba(54, 162, 235, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(75, 192, 192, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 159, 64, 0.8)'];


const Dashboard: React.FC<DashboardProps> = ({ session }) => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
    const [stats, setStats] = useState({ total: 0, categories: 0, favorites: 0, clicks: 0 });
    const [modals, setModals] = useState({ add: false, confirm: false, share: false, export: false, addUrl: false, menu: false });
    const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void, confirmText: string } | null>(null);
    const [shareEntry, setShareEntry] = useState<Entry | Partial<Entry> | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filters, setFilters] = useState({ search: '', category: '', sortBy: 'newest' });
    const [theme, setTheme] = useState('dark');
    const [userIdPanelActive, setUserIdPanelActive] = useState(false);
    const [importState, setImportState] = useState<{ progress: number; log: { type: string; message: string }[] } | null>(null);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [collectionShareCode, setCollectionShareCode] = useState<string | null>(null);

    const pageUsageChartRef = useRef<HTMLCanvasElement>(null);
    const categoryUsageChartRef = useRef<HTMLCanvasElement>(null);
    const pageUsageChartInstance = useRef<Chart | null>(null);
    const categoryUsageChartInstance = useRef<Chart | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showNotification = useCallback((message: string, type: Notification['type'] = 'success') => {
        const newNotif = { id: Date.now(), message, type };
        setNotifications(prev => [...prev, newNotif]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
        }, 5000);
    }, []);

    const getEntries = useCallback(async () => {
        const { data, error } = await supabase.from('entries').select('*').eq('user_id', session.user.id);
        if (error) {
            showNotification('Error al cargar las entradas', 'error');
            console.error(error);
            return [];
        }
        return data as Entry[];
    }, [session.user.id, showNotification]);

    const loadData = useCallback(async () => {
        const userEntries = await getEntries();
        setEntries(userEntries);
    }, [getEntries]);
    
    useEffect(() => {
        loadData();
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [loadData]);
    
    useEffect(() => {
        const getOrCreateCode = async () => {
            const { data } = await supabase.from('user_settings').select('setting_value').eq('setting_key', 'collectionShareCode').single();
            if (data?.setting_value) {
                setCollectionShareCode(data.setting_value as string);
            } else {
                const newCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();
                await supabase.from('user_settings').upsert({ user_id: session.user.id, setting_key: 'collectionShareCode', setting_value: newCode });
                setCollectionShareCode(newCode);
            }
        };
        getOrCreateCode();
    }, [session.user.id]);

    useEffect(() => {
        let processedEntries = [...entries];
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            processedEntries = processedEntries.filter(e => e.name.toLowerCase().includes(searchTerm) || e.description?.toLowerCase().includes(searchTerm) || e.tags?.some(t => t.toLowerCase().includes(searchTerm)));
        }
        if (filters.category) {
            if (filters.category === 'favorites') processedEntries = processedEntries.filter(e => e.is_favorite);
            else processedEntries = processedEntries.filter(e => e.category === filters.category);
        }
        switch (filters.sortBy) {
            case 'newest': processedEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
            case 'oldest': processedEntries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
            case 'name': processedEntries.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'category': processedEntries.sort((a, b) => a.category.localeCompare(b.category)); break;
            case 'favorites': processedEntries.sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0)); break;
            case 'mostClicked': processedEntries.sort((a, b) => (b.click_count || 0) - (a.click_count || 0)); break;
        }
        setFilteredEntries(processedEntries);
    }, [entries, filters]);
    
    useEffect(() => {
        const total = entries.length;
        const uniqueCategories = new Set(entries.map(e => e.category)).size;
        const favorites = entries.filter(e => e.is_favorite).length;
        const clicks = entries.reduce((acc, e) => acc + (e.click_count || 0), 0);
        setStats({ total, categories: uniqueCategories, favorites, clicks });
    }, [entries]);

    const createChart = (canvasRef: React.RefObject<HTMLCanvasElement>, chartInstanceRef: React.MutableRefObject<Chart | null>, config: ChartConfiguration) => {
        if (canvasRef.current) {
            if (chartInstanceRef.current) chartInstanceRef.current.destroy();
            const Chart = (window as any).Chart;
            if (Chart) chartInstanceRef.current = new Chart(canvasRef.current, config);
        }
    };

    useEffect(() => {
         const Chart = (window as any).Chart;
         if (!Chart) return;
        const updateCharts = async () => {
            const { data: pageUsageData } = await supabase.from('page_usage').select('name, count').eq('user_id', session.user.id).order('count', { ascending: false }).limit(10);
            if (pageUsageData) createChart(pageUsageChartRef, pageUsageChartInstance, { type: 'bar', data: { labels: pageUsageData.map(d => d.name), datasets: [{ label: 'Veces Abierta', data: pageUsageData.map(d => d.count), backgroundColor: barColors }] }, options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color: 'var(--text-secondary)' } }, y: { ticks: { color: 'var(--text-secondary)' } } } } });
            const { data: categoryUsageData } = await supabase.from('category_usage').select('name, count').eq('user_id', session.user.id).order('count', { ascending: false }).limit(10);
            if (categoryUsageData) createChart(categoryUsageChartRef, categoryUsageChartInstance, { type: 'doughnut', data: { labels: categoryUsageData.map(d => d.name), datasets: [{ label: 'Veces Usada', data: categoryUsageData.map(d => d.count), backgroundColor: barColors }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'var(--text-primary)' } } } } });
        };
        updateCharts();
    }, [entries, session.user.id, theme]);
    
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(savedTheme);
        document.body.dataset.theme = savedTheme;
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.body.dataset.theme = newTheme;
    };

    const signOut = async () => {
        showNotification('Cerrando sesión...', 'info');
        await supabase.auth.signOut();
    };

    const copyToClipboard = (text: string, subject: string) => {
        navigator.clipboard.writeText(text).then(() => showNotification(`${subject} copiado al portapapeles`, 'success')).catch(() => showNotification(`Error al copiar ${subject}`, 'error'));
    };
    
    const openMiningPage = async (entry: Entry) => {
        if (!entry.url) return;
        window.open(entry.url, '_blank');
        await supabase.from('entries').update({ click_count: (entry.click_count || 0) + 1, last_opened: new Date().toISOString() }).eq('id', entry.id);
        await supabase.rpc('increment_usage_count', { table_name: 'page_usage', user_id_in: session.user.id, name_in: entry.name, url_in: entry.url });
        await supabase.rpc('increment_usage_count', { table_name: 'category_usage', user_id_in: session.user.id, name_in: categories[entry.category]?.name || entry.category, category_in: entry.category });
        loadData();
    };
    
    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        if (key === 'category') {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            document.querySelector(`.filter-chip[data-category="${value}"]`)?.classList.add('active');
        }
    };
    
    const openExternalUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

    const shareApp = async () => {
        const appUrl = window.location.origin;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Lunaria Mining Premium', text: '¡Gestiona tus entradas de minería!', url: appUrl });
            } catch (error) { console.error('Error al compartir:', error); }
        } else {
            copyToClipboard(appUrl, 'Enlace de la app');
        }
    };

    const installApp = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
        } else {
            showNotification('La aplicación ya está instalada o no se puede instalar.', 'info');
        }
    };

    const handleShareAll = () => {
        if (!collectionShareCode) return showNotification('No se pudo generar código de colección.', 'error');
        setShareEntry({ id: 'collection', name: 'Todas tus tarjetas', category: 'other', image: 'https://i.postimg.cc/GpPsSmmX/4491470.png', share_code: collectionShareCode });
        setModals({ add: false, confirm: false, share: true, export: false, addUrl: false, menu: false });
    };

    const NotificationArea = () => (
        <div className="fixed top-0 right-0 p-4 z-[5100] space-y-2">
            {notifications.map(n => (
                <div key={n.id} className={`notification show ${n.type}`}>
                    <i className={`fas ${ n.type === 'success' ? 'fa-check-circle' : n.type === 'error' ? 'fa-times-circle' : n.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
                    {n.message}
                </div>
            ))}
        </div>
    );
    
    return (
        <>
            <DashboardStyles />
            <div className="dashboard-body">
                <NotificationArea />

                <div className={`user-id-container ${userIdPanelActive ? 'active' : ''}`}>
                    <button className="user-id-toggle-btn" aria-label="Toggle User ID" onClick={() => setUserIdPanelActive(!userIdPanelActive)}>
                        <i className={`fas ${userIdPanelActive ? 'fa-angle-right' : 'fa-angle-left'}`}></i>
                    </button>
                    <div className="user-id-panel">
                        <button className="user-id-copy-btn" onClick={() => copyToClipboard(session.user.id, 'ID de Usuario')}><i className="fas fa-copy"></i></button>
                        ID de Usuario: <span>{session.user.id.substring(0,8)}</span>
                    </div>
                </div>

                <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
                    <div className="container text-center">
                        <div className="flex justify-center items-center gap-4 mb-4">
                            <img src="https://i.postimg.cc/GpPsSmmX/4491470.png" alt="Logo" className="w-16 h-16" />
                            <h1 className="text-3xl sm:text-5xl font-bold">Lunaria Mining Premium</h1>
                        </div>
                        <p className="text-lg sm:text-xl opacity-90">Gestión avanzada de entradas de minería</p>
                    </div>
                </header>

                <section className="py-8">
                    <div className="container">
                        <div className="stats-grid">
                            <div className="stat-card"><div className="stat-value">{stats.total}</div><div className="stat-label">Total Entradas</div></div>
                            <div className="stat-card"><div className="stat-value">{stats.categories}</div><div className="stat-label">Categorías</div></div>
                            <div className="stat-card"><div className="stat-value">{stats.favorites}</div><div className="stat-label">Favoritas</div></div>
                            <div className="stat-card"><div className="stat-value">{stats.clicks}</div><div className="stat-label">Clicks Totales</div></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <div className="chart-container"><h3 className="text-xl font-bold mb-4">Páginas Más Usadas</h3><div style={{ height: '300px' }}><canvas ref={pageUsageChartRef}></canvas></div></div>
                            <div className="chart-container"><h3 className="text-xl font-bold mb-4">Categorías Más Usadas</h3><div style={{ height: '300px' }}><canvas ref={categoryUsageChartRef}></canvas></div></div>
                        </div>
                    </div>
                </section>

                <section className="py-4">
                    <div className="container">
                        <div className="search-filter-bar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Buscar</label>
                                    <div className="relative"><i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i><input type="text" value={filters.search} onChange={e => handleFilterChange('search', e.target.value)} className="form-input pl-10" placeholder="Buscar entradas..."/></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Categoría</label>
                                    <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="form-select">
                                        <option value="">Todas</option><option value="favorites">Favoritos</option>
                                        {Object.entries(categories).filter(([key]) => key !== 'favorites').map(([key, { name }]) => <option key={key} value={key}>{name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Ordenar por</label>
                                    <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className="form-select">
                                        <option value="newest">Más recientes</option><option value="oldest">Más antiguos</option><option value="favorites">Favoritos primero</option><option value="mostClicked">Más clickeados</option><option value="name">Nombre A-Z</option><option value="category">Categoría</option>
                                    </select>
                                </div>
                            </div>
                             <div className="filter-chips">
                                <button className={`filter-chip ${filters.category === '' ? 'active' : ''}`} data-category="" onClick={() => handleFilterChange('category', '')}>Todas</button>
                                {Object.entries(categories).map(([key, { name, icon }]) => <button key={key} className={`filter-chip ${filters.category === key ? 'active' : ''}`} data-category={key} onClick={() => handleFilterChange('category', key)}><i className={icon}></i> {name}</button>)}
                            </div>
                        </div>
                    </div>
                </section>

                <main className="py-8">
                    <div className="container">
                        {filteredEntries.length === 0 ? (
                             <div className="empty-state">
                                <i className="fas fa-gem"></i><h3 className="text-2xl font-bold mb-2">No hay entradas de minería</h3>
                                <p className="mb-4">Comienza agregando tu primera entrada</p>
                                <button className="btn btn-primary" onClick={() => { setEditingEntry(null); setModals(p => ({...p, add: true})); }}>Agregar Primera Entrada</button>
                            </div>
                        ) : (
                            <div className="cards-grid">
                                {filteredEntries.map(entry => (
                                    <div key={entry.id} className="mining-card fade-in" style={{ borderLeftColor: entry.card_color || 'var(--accent)' }}>
                                         <div className="card-image-container">
                                            <img src={entry.image} alt={entry.name} className="card-image" loading="lazy" />
                                            <div className="card-top-actions">
                                                <button className={`card-top-btn favorite-btn ${entry.is_favorite ? 'is-favorite' : ''}`} onClick={async () => { await supabase.from('entries').update({ is_favorite: !entry.is_favorite }).eq('id', entry.id); loadData(); }}>
                                                    <i className="fas fa-star"></i>
                                                </button>
                                                <button className="card-top-btn" onClick={() => { setShareEntry(entry); setModals(p=>({...p, share: true})); }}><i className="fas fa-share-alt"></i></button>
                                            </div>
                                        </div>
                                        <div className="card-content">
                                            <div className="card-header">
                                                <h3 className="card-title"><span className={`status-dot ${entry.status || 'active'}`}></span>{entry.name}</h3>
                                                <div className={`category-badge category-${entry.category}`}>{categories[entry.category]?.name || 'Otro'}</div>
                                            </div>
                                            {entry.description && <p className="text-gray-400 text-sm mb-3">{entry.description}</p>}
                                            {entry.url && <div className="card-url mb-3"><i className="fas fa-link mr-1"></i>{entry.url}</div>}
                                            <div className="card-actions mt-auto">
                                                <button className="btn btn-primary flex-1" onClick={() => openMiningPage(entry)}><i className="fas fa-play"></i>Abrir</button>
                                                <div className="flex gap-1">
                                                     <button className="btn btn-secondary btn-small" onClick={() => entry.url && copyToClipboard(entry.url, 'URL')}><i className="fas fa-copy"></i></button>
                                                     <button className="btn btn-warning btn-small" onClick={() => { setEditingEntry(entry); setModals(p => ({...p, add: true})); }}><i className="fas fa-edit"></i></button>
                                                     <button className="btn btn-danger btn-small" onClick={() => { setConfirmAction({ message: '¿Seguro que quieres eliminar esta entrada?', onConfirm: async () => { await supabase.from('entries').delete().eq('id', entry.id); loadData(); }, confirmText: 'Eliminar' }); setModals(p=>({...p, confirm: true})); }}><i className="fas fa-trash"></i></button>
                                                </div>
                                            </div>
                                        </div>
                                         <div className="card-footer">
                                            <span className="card-stat"><i className="fas fa-mouse-pointer"></i> {entry.click_count || 0}</span>
                                            <span className="card-stat"><i className="fas fa-clock"></i> {entry.last_opened ? new Date(entry.last_opened).toLocaleDateString() : 'Nunca'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
                
                <div className={`fullscreen-modal ${modals.menu ? 'active' : ''}`}>
                    <button className="close-menu-btn" onClick={() => setModals(p => ({ ...p, menu: false }))}><i className="fas fa-times"></i></button>
                    <h2 className="text-3xl font-bold text-center mb-4">Menú Principal</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                        <button className="menu-button faucet-button" onClick={() => { openExternalUrl('https://faucetpay.io/'); setModals(p => ({...p, menu: false})); }}><img src="https://i.postimg.cc/xd3HS5CW/Picsart-25-07-12-19-07-45-544.png" alt="FaucetPay" className="faucet-logo" /><span>FaucetPay</span></button>
                        <button className="menu-button investment-button" onClick={() => { window.location.href = '#'; setModals(p => ({...p, menu: false})); }}><i className="fas fa-money-bill-wave text-5xl"></i><span>Inversión</span></button>
                        <button className="menu-button url-add-button" onClick={() => setModals({ add: false, confirm: false, share: false, export: false, addUrl: true, menu: false })}><i className="fas fa-code text-5xl"></i><span>Integrar Tarjeta</span></button>
                        <button className="menu-button share-all-button" onClick={handleShareAll}><i className="fas fa-file-export text-5xl"></i><span>Compartir Todo</span></button>
                        <button className="menu-button add-button" onClick={() => { setEditingEntry(null); setModals({ add: true, confirm: false, share: false, export: false, addUrl: false, menu: false }); }}><i className="fas fa-plus text-5xl"></i><span>Agregar Página</span></button>
                        <button className="menu-button export-button" onClick={() => setModals({ add: false, confirm: false, share: false, export: true, addUrl: false, menu: false })}><i className="fas fa-download text-5xl"></i><span>Exportar/Importar</span></button>
                        <button className="menu-button delete-button" onClick={() => { setConfirmAction({ message: '¿Borrar todas las entradas permanentemente?', onConfirm: async () => { await supabase.from('entries').delete().eq('user_id', session.user.id); loadData(); }, confirmText: 'Formatear' }); setModals({ add: false, confirm: true, share: false, export: false, addUrl: false, menu: false }); }}><i className="fas fa-trash-alt text-5xl"></i><span>Borrar Todo</span></button>
                        <button className="menu-button theme-toggle-menu-button" onClick={() => { toggleTheme(); setModals(p => ({...p, menu: false})); }}><i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'} text-5xl`}></i><span>Cambiar Tema</span></button>
                        <button className="menu-button games-menu-button" onClick={() => { window.location.href = '#'; setModals(p => ({...p, menu: false})); }}><i className="fas fa-gamepad text-5xl"></i><span>Tus Juegos</span></button>
                        <button className="menu-button share-app-button col-span-2" onClick={() => { shareApp(); setModals(p => ({...p, menu: false})); }}><i className="fas fa-share-square text-5xl"></i><span>Compartir App</span></button>
                        {deferredPrompt && <button className="menu-button install-button col-span-2" onClick={() => { installApp(); setModals(p => ({...p, menu: false})); }}><i className="fas fa-download text-5xl"></i><span>Instalar App</span></button>}
                        <button className="menu-button delete-button" onClick={() => { signOut(); setModals(p => ({...p, menu: false})); }}><i className="fas fa-sign-out-alt text-5xl"></i><span>Cerrar Sesión</span></button>
                    </div>
                </div>

                <button className="fab" onClick={() => setModals(p => ({ ...p, menu: true }))} aria-label="Menú principal"><i className="fas fa-ellipsis-h"></i></button>
            </div>
        </>
    );
};

export default Dashboard;
