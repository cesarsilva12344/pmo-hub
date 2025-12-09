
import { AppState } from '../services/state.js';

export const FileImporter = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const btnImport = document.getElementById('btn-import-project');
        const modal = document.getElementById('import-modal');
        const btnClose = document.getElementById('btn-close-import');
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const btnProcess = document.getElementById('btn-process-import');

        if (btnImport) btnImport.addEventListener('click', () => this.openModal());
        if (btnClose) btnClose.addEventListener('click', () => this.closeModal());

        if (dropZone) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('bg-slate-50', 'border-blue-500');
            });
            dropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                dropZone.classList.remove('bg-slate-50', 'border-blue-500');
            });
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('bg-slate-50', 'border-blue-500');
                if (e.dataTransfer.files.length) this.handleFile(e.dataTransfer.files[0]);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) this.handleFile(e.target.files[0]);
            });
        }

        if (btnProcess) {
            btnProcess.addEventListener('click', () => this.processCurrentFile());
        }
    },

    openModal() {
        document.getElementById('import-modal').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('import-modal').classList.add('hidden');
        this.resetUI();
    },

    resetUI() {
        document.getElementById('import-preview').classList.add('hidden');
        document.getElementById('drop-zone').classList.remove('hidden');
        this.currentFile = null;
    },

    handleFile(file) {
        this.currentFile = file;

        // Update UI
        document.getElementById('drop-zone').classList.add('hidden');
        document.getElementById('import-preview').classList.remove('hidden');
        document.getElementById('file-name').innerText = file.name;
        document.getElementById('file-size').innerText = `${(file.size / 1024).toFixed(1)} KB`;

        // Set Icon
        const iconInfo = file.name.endsWith('.pdf') ? '📄 PDF' : (file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) ? '📊 Excel' : '📅 Project';
        document.getElementById('file-icon').innerText = iconInfo.split(' ')[0];
    },

    async processCurrentFile() {
        if (!this.currentFile) return;

        const file = this.currentFile;
        const ext = file.name.split('.').pop().toLowerCase();

        try {
            document.getElementById('btn-process-import').innerText = 'Processando...';

            if (ext === 'xlsx' || ext === 'xls') await this.parseExcel(file);
            else if (ext === 'xml') await this.parseProjectXML(file);
            else if (ext === 'pdf') await this.parsePDF(file);
            else alert('Formato não suportado.');

            this.closeModal();
        } catch (error) {
            console.error(error);
            alert('Erro ao processar arquivo: ' + error.message);
        } finally {
            document.getElementById('btn-process-import').innerText = 'Processar Importação';
        }
    },

    // --- Parsers ---

    async parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    // Assume first sheet is the project play
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                    console.log('Excel Data:', jsonData);

                    // Map fields (Simple heuristic)
                    // Looking for 'Tarefa', 'Inicio', 'Fim'
                    const project = AppState.addProject('traditional', file.name.split('.')[0], 'Importado', 0);

                    // Logic to populate tasks would go here (requires Task model in AppState)
                    alert(`Projeto "${project.name}" importado do Excel com ${jsonData.length} linhas de dados.`);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    },

    async parseProjectXML(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const parser = new fxp.XMLParser();
                    const result = parser.parse(text);

                    console.log('Project XML:', result);

                    // Try to finding Project Title
                    const projName = result.Project?.Title || file.name.split('.')[0];
                    const project = AppState.addProject('traditional', projName, 'MS Project', 0);

                    alert(`Projeto "${project.name}" importado via XML.`);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsText(file);
        });
    },

    async parsePDF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;

                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + ' ';
                    }

                    console.log('PDF Text:', fullText);

                    // Simple regex extraction ex: Name
                    const emails = fullText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

                    alert(`PDF Processado. Texto extraído (${fullText.length} chars). Emails encontrados: ${emails ? emails.join(', ') : 'Nenhum'}`);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }
};
