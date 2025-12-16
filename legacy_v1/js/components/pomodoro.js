import { AppState } from '../services/state.js';
import { supabaseClient } from '../supabase-client.js';
import { TimesheetService } from '../services/timesheet-service.js';

export const PomodoroTimer = {
    // Configuração
    WORK_TIME: 25 * 60, // 25 min em segundos
    BREAK_TIME: 5 * 60,

    // Estado
    timeLeft: 25 * 60,
    timerId: null,
    status: 'idle', // idle (ocioso), running (rodando), paused (pausado), break (intervalo)
    currenttaskId: null,
    startTime: null,

    // Elementos do DOM
    container: null,
    display: null,
    btnToggle: null,
    lblStatus: null,

    init() {
        this.renderWidget();
        this.cacheDom();
        this.bindEvents();
    },

    renderWidget() {
        const div = document.createElement('div');
        div.id = 'pomodoro-widget';
        div.className = 'fixed bottom-6 right-6 z-50 bg-white rounded-full shadow-2xl flex items-center gap-4 p-2 pl-6 border border-slate-200 transition-all hover:scale-105';
        div.style.maxWidth = '300px';

        div.innerHTML = `
            <div class="flex flex-col">
                <span id="pomo-status" class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Foco</span>
                <span id="pomo-time" class="text-2xl font-mono font-bold text-slate-800 leading-none">25:00</span>
            </div>
            
            <button id="pomo-toggle" class="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 shadow-lg transition-colors">
                <svg id="icon-play" class="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg id="icon-pause" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            </button>
            
            <!-- Menu de Contexto (Seleção de Tarefa) - Oculto por padrão -->
            <div id="pomo-menu" class="hidden absolute bottom-20 right-0 bg-white rounded-lg shadow-xl p-4 w-64 border border-gray-100">
                <h4 class="text-sm font-bold mb-2">O que você vai fazer?</h4>
                <select id="pomo-task-select" class="w-full text-sm border rounded p-2 mb-2 bg-gray-50">
                    <option value="">Selecione uma tarefa...</option>
                    <!-- Hidratado via JS -->
                </select>
            </div>
        `;

        document.body.appendChild(div);
    },

    cacheDom() {
        this.container = document.getElementById('pomodoro-widget');
        this.display = document.getElementById('pomo-time');
        this.btnToggle = document.getElementById('pomo-toggle');
        this.lblStatus = document.getElementById('pomo-status');
        this.iconPlay = document.getElementById('icon-play');
        this.iconPause = document.getElementById('icon-pause');
    },

    bindEvents() {
        this.btnToggle.addEventListener('click', () => this.toggleTimer());
    },

    toggleTimer() {
        if (this.status === 'idle' || this.status === 'paused') {
            this.start();
        } else {
            this.pause();
        }
    },

    start() {
        this.status = 'running';
        this.startTime = new Date();
        this.updateUI();

        this.timerId = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.finish();
            }
        }, 1000);
    },

    pause() {
        this.status = 'paused';
        clearInterval(this.timerId);
        this.updateUI();
    },

    finish() {
        this.pause();
        this.status = 'idle';
        this.timeLeft = this.WORK_TIME;

        // Tocar Som
        this.playSound();

        // Logar Tempo
        this.logTime();

        alert('Pomodoro Concluído! 🍅 Hora do intervalo.');
        this.updateUI();
        this.updateDisplay();
    },

    updateDisplay() {
        const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
        const s = (this.timeLeft % 60).toString().padStart(2, '0');
        this.display.textContent = `${m}:${s}`;
        document.title = `${m}:${s} - Focando`;
    },

    updateUI() {
        if (this.status === 'running') {
            this.iconPlay.classList.add('hidden');
            this.iconPause.classList.remove('hidden');
            this.lblStatus.textContent = "Focando...";
            this.lblStatus.className = "text-[10px] font-bold text-blue-500 uppercase tracking-wider animate-pulse";
        } else {
            this.iconPlay.classList.remove('hidden');
            this.iconPause.classList.add('hidden');
            this.lblStatus.textContent = this.status === 'paused' ? "Pausado" : "Modo Foco";
            this.lblStatus.className = "text-[10px] font-bold text-slate-400 uppercase tracking-wider";
        }
    },

    async logTime() {
        // ID do Usuário Mockado (Usuário Atual)
        const userId = '1'; // Ana Silva (Gerente)

        await TimesheetService.logTime({
            taskId: this.currenttaskId, // pode ser nulo se nenhuma tarefa for selecionada
            userId: userId,
            durationMinutes: 25,
            date: new Date()
        });

        // Feedback
        AppState.reports.push({
            date: new Date().toLocaleDateString(),
            project: 'Timesheet Audio',
            health: 'Done',
            author: 'Sistema',
            action: 'Custo contabilizado via Pomodoro'
        });
        AppState.notify();
    },

    playSound() {
        // Beep simples usando AudioContext ou elemento de Áudio
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play().catch(e => console.log('Reprodução de áudio bloqueada', e));
    }
};
