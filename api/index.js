
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const username = String(req.query.username || '').trim();

  if (!username) {
    return res.status(400).json({
      found: false,
      error: 'Missing username'
    });
  }

  const googleScriptUrl =
    'https://script.google.com/macros/s/AKfycbwPGdWaaVuE_Rdrvtgfj0u-_ewJ00yFyqStVGU9d5_TQvTPxTJP-TS7GEWYT4dqgH3QHQ/exec?username=' +
    encodeURIComponent(username);

  try {
    const response = await fetch(googleScriptUrl, {
      redirect: 'follow'
    });

    const text = await response.text();
    const json = JSON.parse(text);

    if (!json.success) {
      return res.status(200).json({
        found: false,
        user: username,
        count: 0,
        punishments: [],
        message: json.message || json.error || 'No records found'
      });
    }

    // Support both old single-record and new multiple-record formats
    let records = Array.isArray(json.data)
      ? json.data
      : json.data
        ? [json.data]
        : [];

    // Only retain records belonging to the requested username
    records = records.filter(record =>
      String(record.user || '').trim().toLowerCase() ===
      username.toLowerCase()
    );

    return res.status(200).json({
      found: records.length > 0,
      user: username,
      count: records.length,
      punishments: records.map(record => ({
        user: record.user || 'N/A',
        dateIssued: record.dateIssued || 'N/A',
        agency: record.agency || 'N/A',
        status: record.status || 'N/A',
        endDate: record.endDate || 'N/A'
      }))
    });

  } catch (error) {
    return res.status(502).json({
      found: false,
      error: 'Google Apps Script request failed',
      details: error.message
    });
  }
};
