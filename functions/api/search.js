export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return new Response(JSON.stringify({ d: [] }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  // Sanitize and format the IMDb suggestion URL
  const cleanQ = q.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '');
  const firstChar = cleanQ[0] || 'a';
  const url = `https://v2.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(cleanQ)}.json`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`IMDb API responded with ${response.status}`);
    }
    
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, d: [] }), {
      status: 200, // Return 200 with empty data to avoid crashing the frontend
      headers: { 
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
