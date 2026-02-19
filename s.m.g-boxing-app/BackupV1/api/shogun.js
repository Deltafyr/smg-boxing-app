export default async function handler(req, res) {
  // 1. Récupérer les paramètres (action et ID)
  const { action, competId = '897' } = req.query;

  // 2. Récupérer l'URL secrète (définie dans Vercel)
  const googleUrl = process.env.GOOGLE_SCRIPT_API_URL;

  if (!googleUrl) {
    return res.status(500).json({ error: 'Configuration serveur manquante (GOOGLE_SCRIPT_API_URL)' });
  }

  try {
    // 3. Appeler Google Apps Script
    const response = await fetch(`${googleUrl}?action=${action}&competId=${competId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
    });

    const data = await response.json();

    // 4. Renvoyer la réponse à ton site
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Erreur communication Google: ' + error.message });
  }
}