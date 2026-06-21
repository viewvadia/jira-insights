export default async function handler(req, res) {
    // 1. Pull secure credentials from Vercel's environment variables
    const { JIRA_URL, JIRA_EMAIL, JIRA_TOKEN } = process.env;

    if (!JIRA_URL || !JIRA_EMAIL || !JIRA_TOKEN) {
        return res.status(500).json({ error: "Server missing Jira credentials." });
    }

    try {
        const jql = encodeURIComponent("statusCategory in (Todo, 'In Progress', Done) ORDER BY updated DESC");
        const targetUrl = `${JIRA_URL}/rest/api/3/search?jql=${jql}&maxResults=100`;
        
        // Node.js requires Buffer for base64 encoding instead of browser's btoa()
        const authHeader = 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');

        // 2. Fetch directly from Atlassian (No CORS here!)
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Jira API rejected the request with status: ${response.status}`);
        }

        const data = await response.json();
        
        // 3. Send the clean data back to your frontend
        res.status(200).json(data);

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Failed to fetch data from Jira." });
    }
}
