import { AppState } from '../services/state.js';
import { supabaseClient } from '../supabase-client.js';

export const Inbox = {
    init() {
        this.cacheDom();
        this.bindEvents();
        this.render();

        // Subscribe to state changes
        AppState.subscribe(() => this.render());
    },

    cacheDom() {
        this.form = document.getElementById('form-inbox-capture');
        this.input = document.getElementById('inbox-input');
        this.list = document.getElementById('inbox-list');
        this.count = document.getElementById('inbox-count');
    },

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addItem();
            });
        }
    },

    async addItem() {
        const text = this.input.value.trim();
        if (!text) return;

        // Persist to DB
        const { data, error } = await supabaseClient
            .from('inbox_items')
            .insert([{ content: text, user_id: null }]) // user_id null for prototype
            .select();

        if (error) {
            console.error('Inbox Save Error:', error);
            return;
        }

        // Update State
        if (data && data[0]) {
            if (!AppState.inbox) AppState.inbox = [];
            AppState.inbox.unshift(data[0]);
            AppState.notify();
        }

        this.input.value = '';
    },

    async removeItem(id) {
        // Optimistic
        if (!AppState.inbox) return;
        AppState.inbox = AppState.inbox.filter(i => i.id !== id);
        AppState.notify();

        // DB Delete
        const { error } = await supabaseClient
            .from('inbox_items')
            .delete()
            .eq('id', id);

        if (error) console.error('Delete Error:', error);
    },

    render() {
        if (!this.list) return;

        const items = (AppState.inbox || []).filter(i => !i.isProcessed);

        // Update Count
        if (this.count) this.count.textContent = items.length;

        // Render List
        if (items.length === 0) {
            this.list.innerHTML = `<li class="p-8 text-center text-slate-400 italic">Sua caixa de entrada está vazia. Mente tranquila! 🧘</li>`;
            return;
        }

        this.list.innerHTML = items.map(item => `
            <li class="p-4 flex justify-between items-start group hover:bg-slate-50 transition-colors">
                <div class="flex items-start gap-3">
                    <input type="checkbox" class="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                        onclick="alert('Processar: ' + '${item.id}')">
                    <div>
                        <p class="text-slate-700 font-medium">${this.escapeHtml(item.content)}</p>
                        <span class="text-xs text-slate-400">${new Date(item.date).toLocaleTimeString()}</span>
                    </div>
                </div>
                <button class="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onclick="Inbox.removeItem('${item.id}')">
                    🗑️
                </button>
            </li>
        `).join('');

        // Expose method globally for inline onclicks (Hack for prototype)
        window.Inbox = this;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
