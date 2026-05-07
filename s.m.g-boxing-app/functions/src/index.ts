import * as functions from 'firebase-functions';
const cors = require('cors');
import * as cheerio from 'cheerio';

// Configuration CORS pour autoriser l'application S.M.G
const corsHandler = cors({ origin: true });

// ============================================================================
// ENDPOINT 1 : ASPIRATION DU CATALOGUE PRINCIPAL FFKMDA
// ============================================================================
export const fetchFFKMDACatalog = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        try {
            const res = await fetch('https://inscription-competition.ffkmda.com/');
            if (!res.ok) throw new Error('Cible FFKMDA inaccessible.');

            const html = await res.text();
            const $ = cheerio.load(html);
            const catalog: any[] = [];

            $('table tbody tr').each((_, row) => {
                const links = $(row).find('a');
                let compId: string | null = null;

                links.each((_, link) => {
                    const href = $(link).attr('href');
                    const match = href?.match(/competition\/(\d+)/);
                    if (match) compId = match[1];
                });

                if (compId) {
                    const cells = $(row).find('td');
                    if (cells.length >= 3) {
                        catalog.push({
                            id: compId,
                            date: $(cells[0]).text().trim(),
                            name: $(cells[1]).text().trim(),
                            location: $(cells[2]).text().trim()
                        });
                    }
                }
            });

            const uniqueCatalog = Array.from(new Map(catalog.map(item => [item.id, item])).values());
            response.status(200).json({ success: true, data: uniqueCatalog });
        } catch (error: any) {
            console.error("[ALBEDO] Erreur Fetch Catalog:", error);
            response.status(500).json({ success: false, error: error.message });
        }
    });
});

// ============================================================================
// ENDPOINT 2 : DEEP SCAN D'UNE COMPÉTITION CIBLÉE
// ============================================================================
export const scanFFKMDATournament = functions.https.onRequest((request, response) => {
    corsHandler(request, response, async () => {
        try {
            const compId = request.query.id;
            if (!compId) throw new Error('ID de compétition manquant dans la requête.');

            const targetUrl = `https://inscription-competition.ffkmda.com/competition/${compId}/public`;
            const res = await fetch(targetUrl);
            if (!res.ok) throw new Error(`Impossible de scanner l'arène ${compId}.`);

            const html = await res.text();
            const $ = cheerio.load(html);
            const pageText = $('body').text().replace(/\s+/g, ' ').toLowerCase();

            response.status(200).json({ success: true, pageData: pageText });
        } catch (error: any) {
            console.error(`[ALBEDO] Erreur Deep Scan:`, error);
            response.status(500).json({ success: false, error: error.message });
        }
    });
});