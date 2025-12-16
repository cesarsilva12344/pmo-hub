import { supabase } from '../services/supabase';
import { timesheetService } from '../services/timesheetService';

export const xmlExporter = {
    async generateProjectXML(project) {
        // 1. Fetch Entries
        const entries = await timesheetService.getProjectEntries(project.id);
        const totalHours = entries.reduce((acc, curr) => acc + Number(curr.hours), 0);

        // 2. Build XML String
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<Projeto id="${project.pep_code || project.id}" nome="${cleanString(project.name)}">\n`;

        xml += `  <Lancamentos>\n`;
        entries.forEach(entry => {
            xml += `    <Lancamento>\n`;
            xml += `      <TicketId>${entry.task?.name || 'Geral'}</TicketId>\n`;
            xml += `      <Atividade>${cleanString(entry.type)}</Atividade>\n`;
            xml += `      <Usuario>${entry.user?.email || 'Unknown'}</Usuario>\n`;
            xml += `      <Data>${entry.date}</Data>\n`;
            xml += `      <Horas>${entry.hours}</Horas>\n`;
            xml += `      <Observacao>${cleanString(entry.observation || '')}</Observacao>\n`;
            xml += `    </Lancamento>\n`;
        });
        xml += `  </Lancamentos>\n`;

        xml += `  <ResumoHoras>\n`;
        xml += `    <HorasEstimadas>${project.hours_estimated || 0}</HorasEstimadas>\n`;
        xml += `    <HorasFeitas>${totalHours}</HorasFeitas>\n`;
        xml += `  </ResumoHoras>\n`;
        xml += `</Projeto>`;

        return xml;
    },

    downloadXML(filename, content) {
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/xml' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
};

function cleanString(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
