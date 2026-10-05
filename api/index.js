module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ 
      found: false, 
      error: 'Missing required query parameter: username' 
    });
  }

  // Your new Google Apps Script Deployment URL targeting Punishment History
  const googleScriptUrl = `https://script.google.com/macros/s/AKfycbwPGdWaaVuE_Rdrvtgfj0u-_ewJ00yFyqStVGU9d5_TQvTPxTJP-TS7GEWYT4dqgH3QHQ/exec?username=${encodeURIComponent(username)}`;

  try {
    const response = await fetch(googleScriptUrl, { 
      redirect: 'follow',
      headers: { 'Accept': 'application/json' }
    });
    
    const rawText = await response.text();

    // Catch HTML error pages from Google gracefully
    if (rawText.trim().startsWith('<')) {
      return res.status(502).json({
        found: false,
        error: 'Google Apps Script returned HTML instead of JSON. Ensure deployment access is set to "Anyone" and "Execute as: Me".'
      });
    }

    const json = JSON.parse(rawText);

    if (json.success && json.data) {
      return res.status(200).json({
        found: true,
        user: json.data.user || "N/A",
        dateIssued: json.data.dateIssued || "N/A",
        agency: json.data.agency || "N/A",
        status: json.data.status || "N/A",
        endDate: json.data.endDate || "N/A"
      });
    }

    return res.status(200).json({
      found: false,
      message: "User not found in Punishment History."
    });

  } catch (error) {
    return res.status(500).json({ 
      found: false, 
      error: 'Failed to parse endpoint response',
      details: error.message 
    });
  }
};
